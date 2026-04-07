import { createClient } from '@supabase/supabase-js';

// Use environment variables when available (local dev via .env.local),
// fall back to the project defaults for hosted environments.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://ysuafagyknyirrbhebrt.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdWFmYWd5a255aXJyYmhlYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQwMTIsImV4cCI6MjA5MTEyMDAxMn0.708_o5G25tiY_Ee5vAkdqNGpUH9WzzgGazCAbLVB-l0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
