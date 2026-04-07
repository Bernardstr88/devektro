import { createClient } from '@supabase/supabase-js';

// Use environment variables when available (local dev via .env.local),
// fall back to the project defaults for hosted environments.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://ttyxkxyzclhyffqlweeo.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eXhreHl6Y2xoeWZmcWx3ZWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTMwOTgsImV4cCI6MjA5MDE4OTA5OH0.MJcwIC5Cxgm2zgDvsB6IJiQw6tDLO5pHORgWl0G4P4s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
