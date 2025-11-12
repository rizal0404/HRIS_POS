import { createClient } from '@supabase/supabase-js';

// Provided Supabase project details
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Initialize and export the Supabase client
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);