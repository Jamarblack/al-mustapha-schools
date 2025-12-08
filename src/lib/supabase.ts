import { createClient } from '@supabase/supabase-js';

// Get the keys from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if keys are missing (helps debug)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Key. Check your .env file.');
}

// Create the single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);