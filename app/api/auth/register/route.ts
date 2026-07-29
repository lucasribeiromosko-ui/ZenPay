import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { createUser, getUser, makeSession, SESSION_COOKIE } from "@/lib/authUsers";

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

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!nome || !email.includes("@") || password.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Nome, e-mail válido e senha de 6+ caracteres." },
      { status: 400 }
    );
  }

  try {
    const existing = await getUser(email);
    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Já existe uma conta com esse e-mail." },
        { status: 409 }
      );
    }
    const user = await createUser(nome, email, password);
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
    return NextResponse.json({ ok: false, message: "Erro ao criar a conta." }, { status: 500 });
  }
}
