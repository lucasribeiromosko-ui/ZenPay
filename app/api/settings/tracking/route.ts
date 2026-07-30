import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { currentSellerEmail } from "@/lib/sessionServer";
import { getTracking, saveTracking, Tracking } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, tracking: await getTracking(email) });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Requisição inválida." }, { status: 400 });
  }
  const t: Tracking = {
    meta_pixel: String(body.meta_pixel ?? "").trim(),
    google_ads: String(body.google_ads ?? "").trim(),
    tiktok_pixel: String(body.tiktok_pixel ?? "").trim(),
    gtm_container: String(body.gtm_container ?? "").trim(),
  };
  try {
    await saveTracking(email, t);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}
