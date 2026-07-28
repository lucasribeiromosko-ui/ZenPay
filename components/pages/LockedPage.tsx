"use client";

import { IconLock, IconCheck } from "../icons";

const conteudo: Record<string, { desc: string; itens: string[] }> = {
  "Saque em Cripto": {
    desc: "Vai permitir converter seu saldo e sacar em USDT direto para a sua carteira, sem passar pelo banco.",
    itens: [
      "Carteira USDT nas redes TRC20, ERC20 e BEP20",
      "Cotação na hora do saque",
      "Histórico de saques em cripto",
    ],
  },
  Trackeamento: {
    desc: "Vai conectar seus pixels para medir conversão direto no checkout da ZenPay.",
    itens: [
      "Meta Pixel, Google Ads, TikTok e GTM",
      "Eventos PageView, InitiateCheckout e Purchase",
      "Disparo automático no checkout",
    ],
  },
  "API & Webhooks": {
    desc: "Vai liberar a integração da ZenPay com o seu sistema por API e avisos automáticos de cada evento.",
    itens: [
      "Chave pública e chave secreta",
      "Endpoints de webhook por conta",
      "Eventos de pagamento criado, aprovado, recusado e estornado",
    ],
  },
};

export default function LockedPage({ titulo }: { titulo: string }) {
  const info = conteudo[titulo];

  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-zen-border bg-zen-card p-8 text-center">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-zen-red/15 blur-3xl" />

        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zen-border bg-zen-bg text-zinc-500">
            <IconLock className="h-7 w-7" />
          </span>

          <h1 className="mt-5 text-xl font-extrabold tracking-tight">{titulo}</h1>
          <span className="mt-2 inline-block rounded-full border border-zen-border bg-zen-bg px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-zen-muted">
            Ainda não disponível
          </span>

          {info && (
            <>
              <p className="mt-4 text-[13.5px] leading-relaxed text-zen-muted">{info.desc}</p>

              <ul className="mt-5 space-y-2 text-left">
                {info.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-zinc-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zen-red/15 text-zen-red-bright">
                      <IconCheck className="h-2.5 w-2.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
