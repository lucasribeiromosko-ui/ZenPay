"use client";

import { useEffect, useRef, useState } from "react";
import { IconClose, IconCopy, IconCheck, IconClock, IconLock } from "../icons";

// PIX real via Mercado Pago: gera o QR Code de verdade e fica
// verificando sozinho quando o pagamento cai.

type Props = {
  amount: number;
  description: string;
  defaultEmail?: string;
  defaultName?: string;
  testMode?: boolean;
  onApproved: () => void;
};

type Pix = { id: string; qrCode: string; qrCodeBase64: string };

export default function MercadoPagoPix({
  amount,
  description,
  defaultEmail,
  defaultName,
  testMode,
  onApproved,
}: Props) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [pix, setPix] = useState<Pix | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function gerar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setErro("Informe um e-mail válido para o comprovante.");
      return;
    }
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pay/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email, name: defaultName, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.qrCode) {
        setPix({ id: String(data.id), qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
      } else {
        setErro(data.message ?? "Não foi possível gerar o PIX.");
      }
    } catch {
      setErro("Não foi possível gerar o PIX.");
    } finally {
      setLoading(false);
    }
  }

  // Verifica o pagamento a cada 4s enquanto o QR está na tela.
  useEffect(() => {
    if (!pix) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/pix/status?id=${encodeURIComponent(pix.id)}`);
        const data = await res.json().catch(() => ({}));
        if (data.ok && data.status === "approved") {
          if (pollRef.current) clearInterval(pollRef.current);
          onApproved();
        }
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pix, onApproved]);

  async function copiar() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado
    }
  }

  if (!pix) {
    return (
      <form onSubmit={gerar} className="space-y-3">
        <p className="text-[13.5px] font-semibold">Pagar com PIX</p>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">E-mail</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
          />
        </div>
        {erro && (
          <p className="flex items-start gap-2 rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
            <IconClose className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-3 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Gerando PIX…" : "Gerar PIX"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-[13.5px] font-semibold">Escaneie o QR Code com o app do seu banco</p>
      <div className="mt-4 h-52 w-52 overflow-hidden rounded-xl border-4 border-white bg-white p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR Code PIX"
          className="h-full w-full"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3.5 py-1.5 text-[12px] font-semibold text-amber-400">
        <IconClock className="h-3.5 w-3.5" />
        Aguardando pagamento…
      </div>

      {testMode && (
        <p className="mt-3 max-w-[280px] text-center text-[11.5px] leading-relaxed text-amber-300/80">
          PIX de teste: apps de banco reais não pagam este QR. Aprove pelas
          ferramentas de teste do Mercado Pago, ou use credenciais de produção
          para um PIX pagável de verdade.
        </p>
      )}

      <div className="mt-5 w-full">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
          Ou use o PIX copia e cola
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <p className="flex-1 truncate rounded-xl border border-zen-border bg-zen-bg px-3.5 py-2.5 font-mono text-[11px] text-zinc-400">
            {pix.qrCode}
          </p>
          <button
            onClick={copiar}
            className={`flex h-10 items-center gap-1.5 rounded-xl px-4 text-[12.5px] font-bold transition ${
              copied
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-gradient-to-r from-zen-red to-zen-red-dark text-white shadow-red-soft hover:brightness-110"
            }`}
          >
            {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
        <IconLock className="h-3 w-3" />
        Assim que o PIX cair, a tela confirma sozinha
      </p>
    </div>
  );
}
