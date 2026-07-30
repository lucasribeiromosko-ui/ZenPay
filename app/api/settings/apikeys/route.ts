import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { currentSellerEmail } from "@/lib/sessionServer";
import { getPublicKey, rotateApiKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  try {
    const publicKey = await getPublicKey(email);
    return NextResponse.json({ ok: true, publicKey });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}

// Gera ou regenera o par de chaves. A secreta só é devolvida aqui, uma vez.
export async function POST() {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  try {
    const keys = await rotateApiKey(email);
    return NextResponse.json({ ok: true, ...keys });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}
