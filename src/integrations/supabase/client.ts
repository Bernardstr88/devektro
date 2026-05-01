import { createClient } from '@supabase/supabase-js';

// Database 1 (gedeeld project, schema 'devektro')
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://vgmkepkyubpkxlwsippg.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbWtlcGt5dWJwa3hsd3NpcHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTAwMjUsImV4cCI6MjA4MjgyNjAyNX0.hPQhiBC6Hftn_yPkyTXGWpAzZPsnGJ3X1p6rIoGp2BY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'devektro' },
});
