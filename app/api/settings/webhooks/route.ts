import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { currentSellerEmail } from "@/lib/sessionServer";
import { addWebhook, listWebhooks, removeWebhook } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, webhooks: await listWebhooks(email) });
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
  const url = String(body.url ?? "").trim();
  if (!/^https?:\/\/.+/.test(url)) {
    return NextResponse.json({ ok: false, message: "URL inválida (use https://…)." }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, webhook: await addWebhook(email, url) });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!authReady()) return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "id ausente." }, { status: 400 });
  try {
    await removeWebhook(email, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "Erro." }, { status: 500 });
  }
}
