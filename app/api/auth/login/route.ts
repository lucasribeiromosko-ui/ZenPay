import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { getUser, verifyPassword, makeSession, SESSION_COOKIE } from "@/lib/authUsers";

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Requisição inválida." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Informe e-mail e senha." }, { status: 400 });
  }

  try {
    const user = await getUser(email);
    if (!user || !(await verifyPassword(password, user.senha_hash))) {
      return NextResponse.json({ ok: false, message: "E-mail ou senha incorretos." }, { status: 401 });
    }
    if (user.status === "banido") {
      return NextResponse.json({ ok: false, message: "Conta banida. Fale com o suporte." }, { status: 403 });
    }
    if (user.status === "travado") {
      return NextResponse.json({ ok: false, message: "Conta bloqueada. Fale com o suporte." }, { status: 403 });
    }
    const res = NextResponse.json({ ok: true, user: { email: user.email, nome: user.nome } });
    res.cookies.set(SESSION_COOKIE, makeSession(email), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, message: "Erro ao entrar." }, { status: 500 });
  }
}
