import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";
import path from "path";

// POST /api/admin/upload-url
// Body: { galleryId, filename }
// Returns a Supabase signed upload URL so the browser can PUT the full-res
// file directly to the private kc-full bucket without routing it through our
// server (avoids Vercel's 4.5 MB body limit for large photos).
export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { galleryId, filename } = await req.json();
  if (!galleryId || !filename) {
    return NextResponse.json({ error: "Missing galleryId or filename" }, { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase() || ".jpg";
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `${galleryId}/full/${randomUUID()}-${base}${ext}`;

  const db = supabaseAdmin();
  const { data, error } = await db.storage.from("kc-full").createSignedUploadUrl(storagePath);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    signedUrl: data.signedUrl,
    uploadToken: data.token,
    path: storagePath,
  });
}
