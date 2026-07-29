import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, tokenValid } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db";
import { setAccountStatus, setSaldoTravado } from "@/lib/authUsers";

// Ações do admin sobre uma conta real: travar, destravar, travar/liberar
// saldo, banir, desbanir.

export async function POST(req: Request) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!tokenValid(token)) {
    return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, message: "Banco não configurado." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Requisição inválida." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!email || !action) {
    return NextResponse.json({ ok: false, message: "Dados incompletos." }, { status: 400 });
  }

  try {
    switch (action) {
      case "lock":
        await setAccountStatus(email, "travado");
        break;
      case "unlock":
        await setAccountStatus(email, "ativo");
        break;
      case "freeze":
        await setSaldoTravado(email, true);
        break;
      case "unfreeze":
        await setSaldoTravado(email, false);
        break;
      case "ban":
        await setAccountStatus(email, "banido", true);
        break;
      case "unban":
        await setAccountStatus(email, "ativo", false);
        break;
      default:
        return NextResponse.json({ ok: false, message: "Ação inválida." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Erro." },
      { status: 500 }
    );
  }
}
