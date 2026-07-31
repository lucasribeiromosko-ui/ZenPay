import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { currentSellerEmail } from "@/lib/sessionServer";
import { getUser } from "@/lib/authUsers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  try {
    const u = await getUser(email);
    return NextResponse.json({ ok: true, plano: u?.plano ?? "free", meds: u?.meds ?? 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}
