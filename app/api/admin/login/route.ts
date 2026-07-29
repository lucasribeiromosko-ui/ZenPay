import { NextResponse } from "next/server";
import { ADMIN_COOKIE, anyAdminConfigured, credentialsOk, makeToken } from "@/lib/adminAuth";

export async function POST(req: Request) {
  if (!anyAdminConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Admin não configurado. Defina ADMIN_PASSWORD na Vercel." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Requisição inválida." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!credentialsOk(email, password)) {
    return NextResponse.json({ ok: false, message: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}
