/**
 * process-and-upload.js
 *
 * For each shoot photo this creates TWO derivatives and uploads them:
 *   1. CLEAN full-res  -> private bucket  kc-full
 *   2. WATERMARKED preview (logo centered, ~20% opacity) -> public bucket kc-previews
 *
 * The watermark is BURNED INTO the preview pixels here, server-side. This is
 * what makes the paywall real: the public can view the watermarked preview, but
 * the clean file only ever leaves the server through a signed URL after payment.
 * (A CSS-only watermark would be trivially bypassed via the browser network tab.)
 *
 * Usage:  node scripts/process-and-upload.js <galleryId> <category> ./photos/*.jpg
 * Requires: npm i sharp @supabase/supabase-js
 *           a transparent PNG logo at ./assets/knox-watermark.png
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const [, , galleryId, category, ...files] = process.argv;

async function buildWatermark(width, height) {
  // Scale the logo to ~38% of the image width, center it, knock to 20% opacity.
  const logo = await sharp("./assets/knox-watermark.png")
    .resize({ width: Math.round(width * 0.38) })
    .ensureAlpha()
    .modulate({}) // no-op; keeps pipeline explicit
    .toBuffer();

  // Apply 20% opacity by compositing the logo onto a transparent canvas with a
  // global alpha. sharp doesn't take a single opacity arg, so we use a tint via
  // composite + 'dest-in' alpha mask of 0.2.
  const meta = await sharp(logo).metadata();
  const alpha = Buffer.from(
    `<svg width="${meta.width}" height="${meta.height}">
       <rect width="100%" height="100%" fill="#fff" fill-opacity="0.20"/>
     </svg>`
  );
  return sharp(logo)
    .composite([{ input: alpha, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function run() {
  for (const file of files) {
    const base = path.parse(file).name;
    const input = sharp(file).rotate(); // honor EXIF orientation
    const meta = await input.metadata();

    // 1) clean full-res (just re-encode, no watermark)
    const fullBuf = await sharp(file).rotate().jpeg({ quality: 92 }).toBuffer();
    const fullPath = `${galleryId}/full/${base}.jpg`;
    await db.storage.from("kc-full").upload(fullPath, fullBuf, { contentType: "image/jpeg", upsert: true });

    // 2) watermarked preview, downsized for fast loading
    const wm = await buildWatermark(meta.width, meta.height);
    const previewBuf = await sharp(file)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .composite([{ input: wm, gravity: "center" }])
      .jpeg({ quality: 80 })
      .toBuffer();
    const previewPath = `${galleryId}/preview/${base}.jpg`;
    await db.storage.from("kc-previews").upload(previewPath, previewBuf, { contentType: "image/jpeg", upsert: true });

    // 3) record the media row
    await db.from("media").insert({
      gallery_id: galleryId,
      category,
      label: base,
      preview_path: previewPath,
      full_path: fullPath,
      width: meta.width,
      height: meta.height,
    });

    console.log(`✓ ${base}`);
  }
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
