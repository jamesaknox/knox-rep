import { Client, Environment } from "square";
import { randomUUID } from "crypto";

// Server-only Square client. SQUARE_ACCESS_TOKEN is a secret — never ship it
// to the browser. Switch environment via SQUARE_ENV ('sandbox' | 'production').
export function square() {
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment:
      process.env.SQUARE_ENV === "production"
        ? Environment.Production
        : Environment.Sandbox,
  });
}

// Charge a payment token (from the Web Payments SDK on the client).
// amountCents is an integer; Square wants the smallest currency unit.
export async function chargeCard({ sourceId, amountCents, note }) {
  const client = square();
  const { result } = await client.paymentsApi.createPayment({
    sourceId,                          // the single-use token from card.tokenize()
    idempotencyKey: randomUUID(),      // protects against double-charges on retry
    amountMoney: {
      amount: BigInt(amountCents),     // Square SDK uses BigInt for money amounts
      currency: "USD",
    },
    locationId: process.env.SQUARE_LOCATION_ID,
    note: note || "Knox Creative gallery balance",
  });
  return result.payment; // contains id, status ('COMPLETED'), etc.
}
