import { NextResponse } from "next/server";
import { authReady } from "@/lib/db";
import { currentSellerEmail } from "@/lib/sessionServer";

export const dynamic = "force-dynamic";

// Envia um evento de teste real para a URL informada e devolve o status.
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
    return NextResponse.json({ ok: false, message: "URL inválida." }, { status: 400 });
  }

  const evento = {
    event: "payment.approved",
    test: true,
    data: {
      id: "test_" + Math.random().toString(36).slice(2, 10),
      status: "approved",
      amount: 1990,
      method: "pix",
      seller: email,
    },
    sent_at: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ZenPay-Event": "payment.approved" },
      body: JSON.stringify(evento),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return NextResponse.json({ ok: true, status: res.status, statusText: res.statusText });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Não foi possível entregar." },
      { status: 502 }
    );
  }
}
