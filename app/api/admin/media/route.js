import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

async function guard(req) {
  const gate = await requireAdmin(req);
  return gate.ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// GET /api/admin/media?galleryId=<uuid>
export async function GET(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;

  const galleryId = new URL(req.url).searchParams.get("galleryId");
  if (!galleryId) return NextResponse.json({ error: "Missing galleryId" }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("media")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("sort_order")
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data });
}

// PATCH /api/admin/media
// Body: { id, gallery_id }  — marks id as is_hero, clears all others in gallery
export async function PATCH(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;

  const { id, gallery_id } = await req.json();
  if (!id || !gallery_id) return NextResponse.json({ error: "Missing id or gallery_id" }, { status: 400 });

  const db = supabaseAdmin();
  // Clear all hero flags in gallery, then set this one
  await db.from("media").update({ is_hero: false }).eq("gallery_id", gallery_id);
  const { data, error } = await db.from("media").update({ is_hero: true }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data });
}

// DELETE /api/admin/media
// Body: { id }  — deletes the DB row and both storage files
export async function DELETE(req) {
  const blocked = await guard(req);
  if (blocked) return blocked;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabaseAdmin();

  // Grab paths before deleting the row
  const { data: row } = await db
    .from("media")
    .select("full_path, preview_path")
    .eq("id", id)
    .single();

  if (row) {
    await Promise.all([
      db.storage.from("kc-full").remove([row.full_path]),
      db.storage.from("kc-previews").remove([row.preview_path]),
    ]);
  }

  const { error } = await db.from("media").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
