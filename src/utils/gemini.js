import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Strips markdown code blocks (like ```json ... ```) from a text response.
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/, '');
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

/**
 * Perform AI research on a company domain/name using the Gemini API.
 * @param {string} domainOrName - The domain or name of the target company.
 * @param {string} apiKey - The user's Gemini API key.
 * @returns {Promise<Object>} The structured company analysis data.
 */
export async function analyzeCompany(domainOrName, apiKey) {
  if (!apiKey) {
    throw new Error("Gemini API key is required. Go to Settings to add one.");
  }

  try {
    // If using the official SDK (GoogleGenAI handles modern endpoints)
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an elite B2B sales researcher. Research the company associated with the domain or name: "${domainOrName}".
      
      Generate a structured analysis of this company to help a sales representative draft a personalized outreach email.
      
      Return ONLY a JSON object with the exact keys shown below. Do not include any explanation, markdown formatting, or text outside the JSON.
      
      {
        "companyName": "Standardized company name",
        "domain": "${domainOrName}",
        "industry": "Specific industry category",
        "valueProposition": "A concise 1-2 sentence description of what they do and who they serve",
        "targetAudience": "Who their primary customers are (e.g., enterprise IT, SMB retail, creators)",
        "painPoints": [
          "Primary business/operational challenge they likely face",
          "Secondary challenge (e.g., scaling, retention, compliance)",
          "Tertiary challenge"
        ],
        "hooks": [
          "Outreach hook 1: Something impressive about their growth or current positioning",
          "Outreach hook 2: How their value proposition fits modern market changes",
          "Outreach hook 3: A compliment about their product/service quality"
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = cleanJsonResponse(text);
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Company Analysis Error:", error);
    // Return a structured fallback so the app doesn't crash, but display an error
    throw new Error(`AI Research failed: ${error.message || error}`);
  }
}

/**
 * Generate a personalized cold email using Gemini.
 * @param {Object} params
 * @param {Object} params.lead - The lead company analysis object.
 * @param {Object} params.userProfile - The sender's profile (name, company, title, product description).
 * @param {Object} params.config - Outreach configuration (tone, goal, length, customInstructions).
 * @param {string} apiKey - The user's Gemini API key.
 * @returns {Promise<Object>} An object containing the subject line and the email body.
 */
export async function generateOutreachEmail({ lead, userProfile, config, apiKey }) {
  if (!apiKey) {
    throw new Error("Gemini API key is required. Go to Settings to add one.");
  }

  const { tone, goal, length, customInstructions } = config;
  const { senderName, senderTitle, senderCompany, senderProductDesc } = userProfile;

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert copywriter specializing in high-converting B2B cold email outreach.
      
      Write a highly personalized cold outreach email using the following details:
      
      --- SENDER INFO ---
      Sender Name: ${senderName || 'Sales Representative'}
      Sender Title: ${senderTitle || 'Business Development'}
      Sender Company: ${senderCompany || 'Our Company'}
      Sender Product/Service: ${senderProductDesc || 'A productivity-boosting software platform'}
      
      --- RECIPIENT INFO ---
      Recipient Company: ${lead.companyName}
      Recipient Industry: ${lead.industry}
      Recipient Value Proposition: ${lead.valueProposition}
      Primary Pain Points: ${JSON.stringify(lead.painPoints)}
      Personalization Hooks: ${JSON.stringify(lead.hooks)}
      
      --- EMAIL CONFIGURATION ---
      Tone: ${tone} (e.g. casual, professional, value-first, curious)
      Goal of Email: ${goal} (e.g. book a demo, explore partnership, ask feedback, share a resources)
      Length: ${length} (short: ~100 words, medium: ~180 words)
      Additional Instructions: ${customInstructions || 'None'}
      
      --- WRITING RULES ---
      1. DO NOT sound like a typical spammy salesperson. Be human, conversational, and direct.
      2. Start with a customized opening hook based on the recipient's personalization hooks.
      3. Connect their pain points to how the sender's product/service can solve them.
      4. Make the call to action low friction (e.g., "Open to a brief chat next week?" or "Can I send over a 2-minute video overview?").
      5. Include a short, punchy, curiosity-inducing Subject Line.
      
      Return ONLY a JSON object containing "subject" and "body" keys. Do not write markdown, code blocks, or extra text.
      
      {
        "subject": "Email subject line",
        "body": "Hi [Name],\\n\\n[Email Body Text]\\n\\nBest,\\n\\n${senderName}"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = cleanJsonResponse(text);
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Email Generation Error:", error);
    throw new Error(`Email generation failed: ${error.message || error}`);
  }
}
