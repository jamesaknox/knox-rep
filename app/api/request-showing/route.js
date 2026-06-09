import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/notify";

// POST /api/request-showing
// Body: { galleryId, visitorName, visitorEmail, visitorPhone, message }
// Public — no admin auth. Sends a showing request email to the listing agent.
export async function POST(req) {
  try {
    const { galleryId, visitorName, visitorEmail, visitorPhone, message } = await req.json();
    if (!galleryId || !visitorName || !visitorEmail) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: gallery } = await db
      .from("galleries")
      .select("address, city, state, agent:agents(name, email)")
      .eq("id", galleryId)
      .single();

    if (!gallery) return NextResponse.json({ error: "Gallery not found" }, { status: 404 });

    const agentEmail = gallery.agent?.email;
    const agentFirst = (gallery.agent?.name || "there").split(" ")[0];
    const address = `${gallery.address}, ${gallery.city} ${gallery.state}`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;color:#171717;max-width:540px">
        <p style="font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:600;margin:0 0 4px">
          New Showing Request
        </p>
        <p style="margin:0 0 20px;color:#2A211B">
          Hi ${agentFirst}, someone is interested in <strong>${address}</strong>.
        </p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr><td style="padding:8px 12px;background:#f7f4ef;font-weight:600;width:120px">Name</td><td style="padding:8px 12px;border-bottom:1px solid #e3ddd2">${visitorName}</td></tr>
          <tr><td style="padding:8px 12px;background:#f7f4ef;font-weight:600">Email</td><td style="padding:8px 12px;border-bottom:1px solid #e3ddd2"><a href="mailto:${visitorEmail}" style="color:#B98A44">${visitorEmail}</a></td></tr>
          ${visitorPhone ? `<tr><td style="padding:8px 12px;background:#f7f4ef;font-weight:600">Phone</td><td style="padding:8px 12px;border-bottom:1px solid #e3ddd2"><a href="tel:${visitorPhone.replace(/\D/g,"")}" style="color:#B98A44">${visitorPhone}</a></td></tr>` : ""}
          ${message ? `<tr><td style="padding:8px 12px;background:#f7f4ef;font-weight:600;vertical-align:top">Message</td><td style="padding:8px 12px;border-bottom:1px solid #e3ddd2">${message}</td></tr>` : ""}
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#888">
          Sent via Knox Creative · ${address}
        </p>
      </div>`;

    await sendEmail({
      to: agentEmail,
      subject: `Showing request — ${address}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("request-showing error", e);
    return NextResponse.json({ error: "Failed to send request." }, { status: 500 });
  }
}
