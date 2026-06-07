import { createClient } from "@supabase/supabase-js";

// ── Browser/anon client ──────────────────────────────────────────────────
// Safe to expose. Subject to Row Level Security. Used for public reads only
// (e.g. the products list on the marketing site). It can NEVER read galleries
// or media because those tables have no public RLS policy.
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Server/service-role client ───────────────────────────────────────────
// BYPASSES RLS. This key is a master key — it must ONLY ever be imported into
// server code (route handlers, server components). Never import this file into
// a "use client" component. Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
