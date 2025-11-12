import { createClient } from '@supabase/supabase-js';

// Provided Supabase project details
const supabaseUrl = 'https://zmrkdtmmbrnjfizzgpsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptcmtkdG1tYnJuamZpenpncHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODQ0NzYsImV4cCI6MjA3ODM2MDQ3Nn0.7g4l6XyTnltXnkh5OaqFRbry4ChOJ7cU_u5hfObUjUo';

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
