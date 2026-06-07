import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import JSZip from "jszip";

// POST /api/download
// Body: { token, scope: 'all'|'selected', ids?: string[] }
//
// THE PAYWALL ENFORCEMENT POINT. The clean full-res files live in a PRIVATE
// bucket with no public access. This route is the ONLY way to get them, and it
// refuses unless the gallery is paid. Even if someone guesses a storage path,
// they get nothing without a signed URL minted here.
export async function POST(req) {
  try {
    const { token, scope = "all", ids = [] } = await req.json();
    const db = supabaseAdmin();

    const { data: gallery } = await db
      .from("galleries")
      .select("id, address, paid")
      .eq("token", token)
      .single();

    if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ── The gate. No payment, no files. ──
    if (!gallery.paid) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    let q = db.from("media").select("id, label, full_path").eq("gallery_id", gallery.id);
    if (scope === "selected" && ids.length) q = q.in("id", ids);
    const { data: items } = await q;

    if (!items?.length) return NextResponse.json({ error: "No files" }, { status: 404 });

    // Build a ZIP of the CLEAN full-res files from the private bucket.
    // (For very large galleries you'd stream this / pre-build it on delivery and
    //  cache the zip; for typical real-estate shoots, on-demand is fine.)
    const zip = new JSZip();
    for (const item of items) {
      const { data: file } = await db.storage.from("kc-full").download(item.full_path);
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        const name = `${(item.label || item.id).replace(/[^\w.-]+/g, "_")}.jpg`;
        zip.file(name, buf);
      }
    }
    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });

    // Upload the zip to a temp path and mint a short-lived signed URL.
    const zipPath = `zips/${gallery.id}-${Date.now()}.zip`;
    await db.storage.from("kc-full").upload(zipPath, zipBuf, {
      contentType: "application/zip",
      upsert: true,
    });
    const { data: signed } = await db.storage
      .from("kc-full")
      .createSignedUrl(zipPath, 60 * 10); // valid 10 minutes

    // Also return per-file signed URLs, which the phone "save to camera roll"
    // flow opens one at a time so each image can be saved natively.
    const files = [];
    for (const item of items) {
      const { data: s } = await db.storage
        .from("kc-full")
        .createSignedUrl(item.full_path, 60 * 10);
      if (s) files.push({ label: item.label, url: s.signedUrl });
    }

    return NextResponse.json({ zipUrl: signed?.signedUrl, files });
  } catch (e) {
    console.error("download error", e);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
