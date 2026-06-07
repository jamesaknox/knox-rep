import { createClient } from "@supabase/supabase-js";

// Verifies the caller is a logged-in admin. The browser sends the Supabase
// access token as a Bearer header; we validate it and check the email against
// the ADMIN_EMAILS allowlist. No public signups exist, so only invited admins
// (you) can ever hold a valid session.
export async function requireAdmin(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return { ok: false };

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supa.auth.getUser(token);
    if (error || !data?.user) return { ok: false };

    const allow = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!allow.includes((data.user.email || "").toLowerCase())) return { ok: false };
    return { ok: true, user: data.user };
  } catch {
    return { ok: false };
  }
}
