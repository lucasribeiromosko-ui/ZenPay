import { NextResponse } from "next/server";
import { chargeCard, isMercadoPagoEnabled } from "@/lib/mercadopago";

// Cobrança de cartão via Mercado Pago.
// Recebe apenas um TOKEN de cartão (gerado no navegador) — nunca o
// número do cartão nem o CVV. Nada de dado de cartão é armazenado.

export async function POST(req: Request) {
  if (!isMercadoPagoEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Cartão em modo sandbox. Configure o Mercado Pago (MP_ACCESS_TOKEN) para cobrança real.",
      },
      { status: 503 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Requisição inválida." }, { status: 400 });
  }

  const token = typeof payload.token === "string" ? payload.token : "";
  const amount = Number(payload.amount);
  const paymentMethodId =
    typeof payload.paymentMethodId === "string" ? payload.paymentMethodId : "";
  const email = typeof payload.email === "string" ? payload.email : "";

  if (!token || !paymentMethodId || !email) {
    return NextResponse.json(
      { ok: false, message: "Dados de pagamento incompletos." },
      { status: 400 }
    );
  }

  // Sanidade do valor. Obs.: hoje o valor vem do cliente — quando o banco
  // entrar, o servidor deve buscar o preço pelo id do produto/link e ignorar
  // o valor enviado pelo navegador.
  if (!Number.isFinite(amount) || amount < 0.5 || amount > 100000) {
    return NextResponse.json({ ok: false, message: "Valor inválido." }, { status: 400 });
  }

  try {
    const result = await chargeCard({
      token,
      transactionAmount: amount,
      installments: Number(payload.installments) || 1,
      paymentMethodId,
      description:
        typeof payload.description === "string" ? payload.description : "Pagamento ZenPay",
      payer: {
        email,
        docType: typeof payload.docType === "string" ? payload.docType : undefined,
        docNumber: typeof payload.docNumber === "string" ? payload.docNumber : undefined,
      },
      idempotencyKey: `${token}-${Date.now()}`,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 402 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Erro ao processar pagamento." },
      { status: 500 }
    );
  }
}
