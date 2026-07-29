import { NextResponse } from "next/server";

// Sempre em runtime, para ler as variáveis de ambiente a cada request.
export const dynamic = "force-dynamic";

// Diz ao checkout, em tempo de execução, se o Mercado Pago está ativo.
// Evita depender de variável injetada no build (NEXT_PUBLIC_*), que é a
// causa mais comum de "configurei mas não ativou".
//
// Você pode abrir /api/pay/config direto no navegador para conferir:
//   - pixReal:  há Access Token (servidor consegue criar cobrança)
//   - cardReal: há Access Token E Public Key (cartão pode ser tokenizado)
//   - testMode: credencial de teste (TEST-) ou ausente

export async function GET() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const publicKey =
    process.env.MP_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || null;

  const pixReal = Boolean(accessToken);
  const cardReal = Boolean(accessToken && publicKey);
  const testMode = !publicKey || publicKey.startsWith("TEST");

  return NextResponse.json(
    { pixReal, cardReal, publicKey, testMode },
    { headers: { "Cache-Control": "no-store" } }
  );
}
