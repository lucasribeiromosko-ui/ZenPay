"use client";

import { useEffect, useRef, useState } from "react";
import { MP_PUBLIC_KEY } from "@/lib/mpClient";
import { IconClose, IconLock } from "../icons";

// Campo de cartão seguro do Mercado Pago (Card Payment Brick).
// O número do cartão e o CVV são digitados dentro de iframes do próprio
// Mercado Pago — não passam pelo nosso código nem pelo nosso servidor.
// A gente recebe só um token, que o backend usa para criar a cobrança.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    MercadoPago?: any;
  }
}

const PUBLIC_KEY = MP_PUBLIC_KEY;

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar o Mercado Pago."));
    document.body.appendChild(s);
  });
  return sdkPromise;
}

type Props = {
  amount: number;
  maxInstallments: number;
  description: string;
  payerEmail?: string;
  tipo: "credito" | "debito";
  onApproved: () => void;
};

export default function MercadoPagoCard({
  amount,
  maxInstallments,
  description,
  payerEmail,
  tipo,
  onApproved,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "error">("loading");
  const [erro, setErro] = useState<string | null>(null);
  const brickRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: any;

    async function init() {
      try {
        await loadSdk();
        if (cancelled || !window.MercadoPago) return;

        const mp = new window.MercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
        const bricks = mp.bricks();

        controller = await bricks.create("cardPayment", "zenpay-mp-card", {
          initialization: {
            amount,
            payer: payerEmail ? { email: payerEmail } : undefined,
          },
          customization: {
            visual: { style: { theme: "dark" } },
            paymentMethods: {
              maxInstallments,
              types: {
                included: [tipo === "debito" ? "debit_card" : "credit_card"],
              },
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setStatus("ready");
            },
            onError: () => {
              if (!cancelled) {
                setStatus("error");
                setErro("Não foi possível carregar o formulário de cartão.");
              }
            },
            onSubmit: async (cardFormData: any) => {
              setErro(null);
              setStatus("processing");
              try {
                const res = await fetch("/api/pay/card", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    token: cardFormData.token,
                    amount,
                    installments: cardFormData.installments,
                    paymentMethodId: cardFormData.payment_method_id,
                    email: cardFormData.payer?.email ?? payerEmail,
                    docType: cardFormData.payer?.identification?.type,
                    docNumber: cardFormData.payer?.identification?.number,
                    description,
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (data.ok) {
                  onApproved();
                } else {
                  setStatus("ready");
                  setErro(data.message ?? "Pagamento não aprovado. Confira os dados do cartão.");
                }
              } catch {
                setStatus("ready");
                setErro("Não foi possível processar o pagamento.");
              }
            },
          },
        });
        brickRef.current = controller;
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setErro(e instanceof Error ? e.message : "Falha ao iniciar o Mercado Pago.");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      try {
        controller?.unmount?.();
      } catch {
        // brick já desmontado
      }
    };
  }, [amount, maxInstallments, description, payerEmail, tipo, onApproved]);

  return (
    <div className="space-y-3">
      {status === "loading" && (
        <p className="flex items-center gap-2 py-6 text-center text-[13px] text-zen-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zen-red-bright border-t-transparent" />
          Carregando pagamento seguro…
        </p>
      )}

      {erro && (
        <p className="flex items-start gap-2 rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
          <IconClose className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {erro}
        </p>
      )}

      {/* O Mercado Pago injeta o formulário seguro aqui dentro */}
      <div id="zenpay-mp-card" />

      {status === "processing" && (
        <p className="text-center text-[12px] text-zen-muted">Processando pagamento…</p>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
        <IconLock className="h-3 w-3" />
        Cartão protegido pelo Mercado Pago · nada é guardado por aqui
      </p>
    </div>
  );
}
