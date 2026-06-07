import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { chargeCard } from "@/lib/square";

// POST /api/pay
// Body: { token (gallery token), sourceId (Square card token) }
//
// Flow: look up the gallery by its private token → compute the balance →
// charge it via Square → on success, flip paid=true. The browser never sees
// the amount it "should" pay; the server computes it from the DB, so a user
// can't tamper with the price.
export async function POST(req) {
  try {
    const { token, sourceId } = await req.json();
    if (!token || !sourceId) {
      return NextResponse.json({ error: "Missing token or sourceId" }, { status: 400 });
    }

    const db = supabaseAdmin();

    const { data: gallery, error } = await db
      .from("galleries")
      .select("id, address, total_cents, deposit_cents, paid")
      .eq("token", token)
      .single();

    if (error || !gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }
    if (gallery.paid) {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const balanceCents = gallery.total_cents - gallery.deposit_cents;
    if (balanceCents <= 0) {
      // Nothing to charge — just unlock.
      await db.from("galleries").update({ paid: true, paid_at: new Date().toISOString() }).eq("id", gallery.id);
      return NextResponse.json({ ok: true });
    }

    const payment = await chargeCard({
      sourceId,
      amountCents: balanceCents,
      note: `Knox Creative — ${gallery.address} balance`,
    });

    if (payment?.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    await db
      .from("galleries")
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        square_payment_id: payment.id,
      })
      .eq("id", gallery.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("pay error", e);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
