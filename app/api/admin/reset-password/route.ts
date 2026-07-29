import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, tokenValid } from "@/lib/adminAuth";
import { dbConfigured } from "@/lib/db";
import { getUser, setPassword } from "@/lib/authUsers";

// Reset de senha de um vendedor — só admin autenticado.

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
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!email || newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Informe o e-mail e uma nova senha de 6+ caracteres." },
      { status: 400 }
    );
  }

  try {
    const user = await getUser(email);
    if (!user) {
      return NextResponse.json({ ok: false, message: "Conta não encontrada." }, { status: 404 });
    }
    await setPassword(email, newPassword);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Erro ao redefinir a senha." }, { status: 500 });
  }
}
