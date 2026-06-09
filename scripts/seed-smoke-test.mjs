/**
 * seed-smoke-test.mjs  (fetch-only, idempotent)
 * Run: source ~/.nvm/nvm.sh && node --env-file=.env.local scripts/seed-smoke-test.mjs
 */

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !KEY) { console.error("Missing env vars"); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

async function q(method, path, body, extra = {}) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    method, headers: { ...H, ...extra.headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function upload(bucket, path, data) {
  const r = await fetch(`${BASE}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
    body: data,
  });
  if (!r.ok) console.warn(`  upload warn ${bucket}/${path}:`, await r.text());
}

const TINY_JPEG = Buffer.from(
  "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c" +
  "140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e27202" +
  "22c231c1c28372" + "92c303134343" + "41f27393d38323c2e333432" +
  "ffc0000b080001000101011100ffc4001f000001050101010101000000000000000001020304050607" +
  "08090a0bffda00080101000003f00fbfd28a2803ffd9", "hex"
);

async function main() {
  console.log("🌱  Seeding smoke-test data…\n");

  // ── 1. Agent (reuse existing or create) ──────────────────────────────────
  let agent;
  const existing = await q("GET", "agents?email=eq.janeagent@example.com&limit=1");
  if (existing?.length) {
    agent = existing[0];
    console.log("✓  Agent (existing):", agent.id, agent.name);
  } else {
    const [a] = await q("POST", "agents", {
      name: "Jane Agent", email: "janeagent@example.com",
      phone: "+14235550101", brokerage: "Knox Realty",
    });
    agent = a;
    console.log("✓  Agent (created):", agent.id, agent.name);
  }

  // ── 2. Gallery (fetch-or-create by site_slug) ────────────────────────────
  let gallery;
  const existingG = await q("GET", "galleries?site_slug=eq.242fykedr&limit=1");
  if (existingG?.length) {
    gallery = existingG[0];
    console.log("✓  Gallery (existing):", gallery.id, "→ slug:", gallery.site_slug, "| token:", gallery.token);
  } else {
    const [g] = await q("POST", "galleries", {
      agent_id: agent.id,
      address: "242 Fyke Dr", city: "Athens", state: "TN", zip: "37303",
      sqft: 1800, beds: 3, baths: 2,
      total_cents: 19900, deposit_cents: 0,
      site_slug: "242fykedr",
      shoot_date: "2026-06-09",
      status: "active",
      description: "Beautiful 3 bed / 2 bath home in Athens, TN. Move-in ready with updated kitchen and open floor plan.",
    });
    gallery = g;
    console.log("✓  Gallery (created):", gallery.id, "→ slug:", gallery.site_slug, "| token:", gallery.token);
  }

  // ── 3. Photos ─────────────────────────────────────────────────────────────
  const photos = ["photo-01", "photo-02", "photo-03"];
  const media  = [];
  for (const name of photos) {
    const pre = `${gallery.id}/${name}-preview.jpg`;
    const ful = `${gallery.id}/${name}-full.jpg`;
    await upload("kc-previews", pre, TINY_JPEG);
    await upload("kc-full",     ful, TINY_JPEG);
    console.log("✓  Uploaded", name);
    const cats = ["Interior", "Exterior", "Interior"];
    media.push({ gallery_id: gallery.id, category: cats[+name.split("-")[1] - 1], label: name,
                 preview_path: pre, full_path: ful, sort_order: +name.split("-")[1] });
  }
  // Upsert media rows (ignore duplicates)
  await q("POST", "media", media,
    { headers: { Prefer: "resolution=ignore-duplicates,return=representation" } });
  console.log("✓  Media rows inserted\n");

  console.log("════════════════════════════════════════════════════════");
  console.log("  SMOKE TEST URLS");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  Property site:   https://242fykedr.knoxhd.com`);
  console.log(`  Gallery/paywall: https://www.knoxhd.com/g/${gallery.token}`);
  console.log(`  Gallery ID:      ${gallery.id}`);
  console.log(`  Token:           ${gallery.token}`);
  console.log("  Sandbox card:    4111 1111 1111 1111  exp 12/26  cvv 111");
  console.log("════════════════════════════════════════════════════════");
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
