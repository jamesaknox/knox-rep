import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, sendSms, mediaReadyContent } from "@/lib/notify";
import { requireAdmin } from "@/lib/auth";

// POST /api/notify
// Body: { galleryId }
// Admin-only. Sends the "your media is ready" alert (email + SMS) to the agent
// on the gallery, then stamps notified_at so you can see it went out.
export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { galleryId } = await req.json();
    const db = supabaseAdmin();

    const { data: gallery } = await db
      .from("galleries")
      .select("id, token, address, agent:agents(name, email, phone)")
      .eq("id", galleryId)
      .single();

    if (!gallery) return NextResponse.json({ error: "Gallery not found" }, { status: 404 });

    const galleryUrl = `https://${process.env.NEXT_PUBLIC_BASE_DOMAIN}/g/${gallery.token}`;
    const content = mediaReadyContent({
      agentName: gallery.agent?.name,
      address: gallery.address,
      galleryUrl,
    });

    const [emailRes, smsRes] = await Promise.allSettled([
      sendEmail({ to: gallery.agent?.email, subject: content.subject, html: content.html }),
      sendSms({ to: gallery.agent?.phone, body: content.sms }),
    ]);

    await db
      .from("galleries")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", gallery.id);

    return NextResponse.json({
      ok: true,
      email: emailRes.status,
      sms: smsRes.status,
    });
  } catch (e) {
    console.error("notify error", e);
    return NextResponse.json({ error: "Notify failed" }, { status: 500 });
  }
}
