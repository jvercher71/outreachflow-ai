import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.23.0?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Initialize Stripe with fetch client compatible with Deno/Edge runtime
const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  // Allow only POST requests from Stripe
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing Stripe signature header', { status: 400 })
  }

  try {
    const body = await req.text()
    
    // Construct the verified Stripe event
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret
    )

    console.log(`Received Stripe Webhook Event: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id

      console.log(`Successfully completed Stripe checkout session. client_reference_id (Supabase User ID): ${userId}`)

      if (!userId) {
        console.warn('Stripe checkout completed but client_reference_id (User ID) was not provided.')
        return new Response(JSON.stringify({ message: 'No client_reference_id found.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Initialize Supabase admin client to bypass row-level security for updating user profile
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId)

      if (error) {
        console.error(`Database error updating premium status for user ${userId}:`, error)
        return new Response('Database update failed', { status: 500 })
      }

      console.log(`Successfully activated Pro subscription status for user ID: ${userId}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error(`Stripe Webhook Signature Verification Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
