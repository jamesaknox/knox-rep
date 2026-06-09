import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/media-sort
// Body: { updates: [{ id, sort_order }] }
// Bulk-updates sort_order so drag-reorder is persisted in one round trip per batch.
export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { updates } = await req.json();
  if (!updates?.length) return NextResponse.json({ ok: true });

  const db = supabaseAdmin();
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      db.from("media").update({ sort_order }).eq("id", id)
    )
  );
  return NextResponse.json({ ok: true });
}
