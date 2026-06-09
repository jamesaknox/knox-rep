import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import sharp from "sharp";
import { randomUUID } from "crypto";

// POST /api/admin/upload-headshot
// Multipart form: agentId + file
// Resizes to 400×400, uploads to kc-previews/agents/{uuid}.jpg, returns { url }
export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize to 400×400 circle-ready square, convert to JPEG
  const processed = await sharp(buffer)
    .resize(400, 400, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();

  const path = `agents/${randomUUID()}.jpg`;
  const db = supabaseAdmin();
  const { error } = await db.storage.from("kc-previews").upload(path, processed, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kc-previews/${path}`;
  return NextResponse.json({ url });
}
