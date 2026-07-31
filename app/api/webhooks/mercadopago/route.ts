import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { getPaymentStatus } from "@/lib/mercadopago";
import { approveByMpId } from "@/lib/transactions";

export const dynamic = "force-dynamic";

// Webhook do Mercado Pago. Configure esta URL no painel do MP
// (Notificações/Webhooks): https://SEU-SITE/api/webhooks/mercadopago
// O MP avisa aqui quando um pagamento muda de status; confirmamos a venda.

export async function POST(req: Request) {
  let paymentId: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      action?: string;
      data?: { id?: string | number };
    };
    if (body?.data?.id) paymentId = String(body.data.id);
  } catch {
    // ignora corpo inválido
  }
  // MP também manda via querystring em alguns formatos.
  if (!paymentId) {
    const { searchParams } = new URL(req.url);
    paymentId = searchParams.get("data.id") || searchParams.get("id");
  }

  if (!paymentId || !authReady()) {
    return NextResponse.json({ ok: true }); // 200 sempre, para o MP não reenviar em loop
  }

  try {
    const st = await getPaymentStatus(paymentId);
    if (st.ok && st.status === "approved") {
      await approveByMpId(paymentId);
    }
  } catch {
    // Confirmamos recebimento mesmo assim.
  }
  return NextResponse.json({ ok: true });
}
