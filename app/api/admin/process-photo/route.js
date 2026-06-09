import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import sharp from "sharp";

// Build an SVG watermark scaled to the image width.
// "KNOX CREATIVE" centered, semi-transparent white text.
function buildWatermarkSvg(imageWidth) {
  const wmWidth = Math.round(imageWidth * 0.42);
  const fontSize = Math.round(wmWidth * 0.10);
  const wmHeight = Math.round(fontSize * 2.6);
  const letterSpacing = Math.round(fontSize * 0.28);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${wmWidth}" height="${wmHeight}">
      <text x="50%" y="72%" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${fontSize}px"
        fill="white"
        opacity="0.42"
        letter-spacing="${letterSpacing}">KNOX CREATIVE</text>
    </svg>`
  );
}

// POST /api/admin/process-photo
// Body: { galleryId, fullPath, category, label?, sortOrder? }
//
// Flow:
//   1. Download full-res from kc-full
//   2. Composite a centered watermark, resize to 1600px wide
//   3. Upload preview to kc-previews
//   4. Insert media row in DB
export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { galleryId, fullPath, category, label, sortOrder } = await req.json();
  if (!galleryId || !fullPath || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // 1. Download the full-res file
  const { data: blob, error: dlErr } = await db.storage.from("kc-full").download(fullPath);
  if (dlErr || !blob) {
    return NextResponse.json({ error: dlErr?.message || "Download failed" }, { status: 500 });
  }

  const inputBuf = Buffer.from(await blob.arrayBuffer());

  // 2. Get dimensions, build watermark, create preview
  const meta = await sharp(inputBuf).metadata();
  const imgW = meta.width || 1600;
  const imgH = meta.height || 1200;

  const wmSvg = buildWatermarkSvg(imgW);

  const previewBuf = await sharp(inputBuf)
    .rotate()                                          // respect EXIF orientation
    .resize({ width: 1600, withoutEnlargement: true }) // never upscale
    .composite([{ input: wmSvg, gravity: "center" }])  // center watermark
    .jpeg({ quality: 80 })
    .toBuffer();

  // 3. Upload watermarked preview to kc-previews
  const baseName = fullPath.split("/").pop().replace(/\.[^.]+$/, "");
  const previewPath = `${galleryId}/preview/${baseName}.jpg`;

  const { error: upErr } = await db.storage
    .from("kc-previews")
    .upload(previewPath, previewBuf, { contentType: "image/jpeg", upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // 4. Insert media row
  const { data: media, error: dbErr } = await db
    .from("media")
    .insert({
      gallery_id: galleryId,
      category,
      label: label || baseName,
      preview_path: previewPath,
      full_path: fullPath,
      width: imgW,
      height: imgH,
      sort_order: sortOrder ?? 0,
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ media });
}
