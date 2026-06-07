import { Resend } from "resend";

// ── Email via Resend ───────────────────────────────────────────────────────
export async function sendEmail({ to, subject, html }) {
  if (!to) return { skipped: "no email" };
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: `Knox Creative <${process.env.NOTIFY_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ── SMS via Twilio ──────────────────────────────────────────────────────────
// Twilio's REST API is a simple POST; we call it with fetch so there's no extra
// SDK weight. Auth is HTTP Basic with the Account SID + Auth Token.
export async function sendSms({ to, body }) {
  if (!to) return { skipped: "no phone" };
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  const params = new URLSearchParams({ To: normalizePhone(to), From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  return res.json();
}

// Coerce a US number into E.164 (+1XXXXXXXXXX). Twilio requires E.164.
function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

// ── The "media ready" message content ───────────────────────────────────────
export function mediaReadyContent({ agentName, address, galleryUrl }) {
  const first = (agentName || "there").split(" ")[0];
  return {
    subject: `Your photos for ${address} are ready`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#171717;max-width:520px">
        <p style="font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:600;margin:0 0 4px">
          Your gallery is ready
        </p>
        <p style="margin:0 0 16px;color:#2A211B">Hi ${first}, the media for <strong>${address}</strong> is ready to view and download.</p>
        <a href="${galleryUrl}" style="display:inline-block;background:#B98A44;color:#171717;
           text-decoration:none;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
           font-size:12px;padding:13px 22px;border-radius:2px">View &amp; Download &rarr;</a>
        <p style="margin:18px 0 0;font-size:13px;color:#2A211B">
          The balance is due before download. Once paid, all files are full-resolution and watermark-free.
        </p>
        <p style="margin:20px 0 0;font-size:12px;color:#888">Knox Creative · James Knox Photography · Athens, TN</p>
      </div>`,
    sms: `Knox Creative: Your photos for ${address} are ready. View & download: ${galleryUrl}`,
  };
}
