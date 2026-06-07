import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// GET    /api/admin/galleries          list all galleries (with agent + media count)
// POST   /api/admin/galleries          create a gallery
// PATCH  /api/admin/galleries          update a gallery   (body includes id)
async function guard(req) {
  const gate = await requireAdmin(req);
  return gate.ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("galleries")
    .select("*, agent:agents(name, email, phone), media(count)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ galleries: data });
}

export async function POST(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const body = await req.json();
  const db = supabaseAdmin();

  // derive a subdomain slug from the address: "242 Fyke Dr" -> "242fykedr"
  const slug = (body.site_slug || body.address || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);

  const { data, error } = await db
    .from("galleries")
    .insert({
      agent_id: body.agent_id || null,
      address: body.address,
      city: body.city || "Athens",
      state: body.state || "TN",
      zip: body.zip || null,
      sqft: body.sqft || null,
      beds: body.beds || null,
      baths: body.baths || null,
      total_cents: body.total_cents || 0,
      deposit_cents: body.deposit_cents || 0,
      site_slug: slug || null,
      shoot_date: body.shoot_date || null,
      status: body.status || "preparing",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gallery: data });
}

export async function PATCH(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id, ...fields } = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db.from("galleries").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gallery: data });
}
