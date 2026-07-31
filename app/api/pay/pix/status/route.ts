import { NextResponse } from "next/server";
import { getPaymentStatus, isMercadoPagoEnabled } from "@/lib/mercadopago";
import { authReady } from "@/lib/db";
import { approveByMpId } from "@/lib/transactions";

// Consulta se um PIX já foi pago.

export async function GET(req: Request) {
  if (!isMercadoPagoEnabled()) {
    return NextResponse.json({ ok: false, message: "Sandbox." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "id ausente." }, { status: 400 });
  }

  const result = await getPaymentStatus(id);
  if (result.ok && result.status === "approved" && authReady()) {
    approveByMpId(id).catch(() => {});
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
