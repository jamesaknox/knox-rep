import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// Manage realtor clients (agents).
async function guard(req) {
  const gate = await requireAdmin(req);
  return gate.ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const db = supabaseAdmin();
  const { data, error } = await db.from("agents").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data });
}

export async function POST(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const body = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db.from("agents").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}

export async function PATCH(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id, ...fields } = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db.from("agents").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}
