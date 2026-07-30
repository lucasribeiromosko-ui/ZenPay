import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { findEmailBySecret } from "@/lib/settings";
import { chargePix, isMercadoPagoEnabled } from "@/lib/mercadopago";

// API pública da ZenPay: cria uma cobrança PIX.
// Autenticação por chave secreta no header Authorization: Bearer <zsk_...>.
//
//   curl -X POST https://SEU-SITE/api/v1/pix \
//     -H "Authorization: Bearer zsk_live_..." \
//     -H "Content-Type: application/json" \
//     -d '{"amount": 49.90, "email": "comprador@email.com", "description": "Pedido 123"}'

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authReady()) {
    return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") || "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 401 });
  }

  const email = await findEmailBySecret(secret).catch(() => null);
  if (!email) {
    return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
  }

  if (!isMercadoPagoEnabled()) {
    return NextResponse.json({ ok: false, error: "gateway_not_configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const payerEmail = typeof body.email === "string" ? body.email : "";
  if (!Number.isFinite(amount) || amount < 0.5 || amount > 100000) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }
  if (!payerEmail.includes("@")) {
    return NextResponse.json({ ok: false, error: "invalid_payer_email" }, { status: 400 });
  }

  try {
    const r = await chargePix({
      transactionAmount: amount,
      description: typeof body.description === "string" ? body.description : "Cobrança ZenPay",
      payer: { email: payerEmail },
      idempotencyKey: `v1-${email}-${amount}-${Date.now()}`,
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "charge_failed", message: r.message }, { status: 402 });
    }
    return NextResponse.json({
      ok: true,
      id: r.id,
      status: r.status,
      pix: { qr_code: r.qrCode, qr_code_base64: r.qrCodeBase64 },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
