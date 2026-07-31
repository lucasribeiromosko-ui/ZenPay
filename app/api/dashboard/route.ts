import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { currentSellerEmail } from "@/lib/sessionServer";
import { dashboardFor, listTransactions } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  try {
    const resumo = await dashboardFor(email);
    const transacoes = await listTransactions(email);
    return NextResponse.json({ ok: true, resumo, transacoes });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}
