import { NextResponse } from "next/server";
import { chargePix, isMercadoPagoEnabled } from "@/lib/mercadopago";

// Gera uma cobrança PIX no Mercado Pago e devolve o QR Code.

export async function POST(req: Request) {
  if (!isMercadoPagoEnabled()) {
    return NextResponse.json(
      { ok: false, message: "PIX em modo sandbox. Configure o Mercado Pago para cobrança real." },
      { status: 503 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Requisição inválida." }, { status: 400 });
  }

  const amount = Number(payload.amount);
  const email = typeof payload.email === "string" ? payload.email : "";

  if (!email) {
    return NextResponse.json({ ok: false, message: "Informe o e-mail." }, { status: 400 });
  }

  // Sanidade do valor (ver observação em /api/pay/card).
  if (!Number.isFinite(amount) || amount < 0.5 || amount > 100000) {
    return NextResponse.json({ ok: false, message: "Valor inválido." }, { status: 400 });
  }

  try {
    const result = await chargePix({
      transactionAmount: amount,
      description:
        typeof payload.description === "string" ? payload.description : "Pagamento ZenPay",
      payer: {
        email,
        firstName: typeof payload.name === "string" ? payload.name : undefined,
        docType: typeof payload.docType === "string" ? payload.docType : undefined,
        docNumber: typeof payload.docNumber === "string" ? payload.docNumber : undefined,
      },
      idempotencyKey: `pix-${email}-${amount}-${Date.now()}`,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 402 });
  } catch {
    return NextResponse.json({ ok: false, message: "Erro ao gerar o PIX." }, { status: 500 });
  }
}
