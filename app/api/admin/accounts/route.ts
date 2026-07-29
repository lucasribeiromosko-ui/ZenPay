import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, tokenValid } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db";
import { listUsers } from "@/lib/authUsers";

export const dynamic = "force-dynamic";

// Lista as contas reais do banco para o painel de admin.

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!tokenValid(token)) {
    return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: true, configured: false, accounts: [] });
  }

  try {
    const users = await listUsers();
    const accounts = users.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      documento: "—",
      telefone: "—",
      chavePix: "—",
      criadoEm: u.criado_em ? new Date(u.criado_em).toLocaleDateString("pt-BR") : "—",
      ultimoAcesso: "—",
      status: u.status,
      saldoTravado: u.saldo_travado,
      saldoDisponivel: 0,
      saldoALiberar: 0,
      volumeTotal: 0,
      vendas: 0,
      chargebacks: 0,
    }));
    return NextResponse.json({ ok: true, configured: true, accounts });
  } catch (e) {
    return NextResponse.json(
      { ok: false, configured: true, message: e instanceof Error ? e.message : "Erro." },
      { status: 500 }
    );
  }
}
