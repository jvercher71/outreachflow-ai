-- OutreachFlow AI Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com)

-- 1. PROFILES TABLE
-- Stores user-specific settings and sender profile data.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  sender_name text,
  sender_title text,
  sender_company text,
  sender_product_desc text,
  gemini_api_key text
);

-- Enable Row Level Security (RLS) on Profiles
alter table public.profiles enable row level security;

-- Profile RLS Policies
create policy "Users can view their own profile." on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);


-- 2. LEADS TABLE
-- Stores B2B target company details and generated outreach emails.
create table public.leads (
  id uuid default gen_random_uuid() not null primary key,
  user_id uuid references auth.users on delete cascade not null,
  company_name text not null,
  domain text not null,
  industry text,
  value_proposition text,
  target_audience text,
  pain_points text[],
  hooks text[],
  status text default 'pending',
  email_subject text,
  email_body text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on Leads
alter table public.leads enable row level security;

-- Leads RLS Policies
create policy "Users can view their own leads." on public.leads
  for select using (auth.uid() = user_id);

create policy "Users can insert their own leads." on public.leads
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own leads." on public.leads
  for update using (auth.uid() = user_id);

create policy "Users can delete their own leads." on public.leads
  for delete using (auth.uid() = user_id);


-- 3. PROFILE CREATION TRIGGER
-- Automatically creates a blank profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, updated_at, sender_name, sender_title, sender_company, sender_product_desc, gemini_api_key)
  values (new.id, now(), '', '', '', '', '');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
