"use client";

import { useState } from "react";
import { IconQr, IconSend, IconUser, IconEye, IconEyeOff } from "./icons";

export default function BalanceCard({
  onQuickPay,
}: {
  onQuickPay?: () => void;
}) {
  const [hidden, setHidden] = useState(false);

  return (
    <section className="zen-gradient-hero relative overflow-hidden rounded-2xl border border-zen-border">
      {/* Barra lateral de destaque */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-zen-red-bright to-zen-blood" />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-300">
              Saldo disponível
            </p>
            <p className="mt-0.5 text-[12.5px] text-zinc-400">
              Atualizado agora · pronto para sacar ou usar
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-semibold text-zinc-200 backdrop-blur-sm sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-zen-red-bright" />
              CICLO ATUAL
            </span>
            <button
              onClick={() => setHidden((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 text-zinc-300 backdrop-blur-sm transition hover:text-white"
              title={hidden ? "Mostrar saldo" : "Ocultar saldo"}
            >
              {hidden ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          {hidden ? "R$ ••••••" : "R$ 0,00"}
        </p>

        {/* Ações rápidas */}
        <div className="grid max-w-md grid-cols-3 overflow-hidden rounded-2xl bg-gradient-to-r from-zen-red to-zen-red-dark shadow-red-soft">
          {[
            { label: "Pagamento Rápido", icon: <IconQr className="h-5 w-5" />, action: onQuickPay },
            { label: "Transferir", icon: <IconSend className="h-5 w-5" />, action: undefined },
            { label: "Personalizar Identificador", icon: <IconUser className="h-5 w-5" />, action: undefined },
          ].map((action, i) => (
            <button
              key={action.label}
              onClick={action.action}
              className={`flex flex-col items-center gap-2 px-3 py-4 text-center transition hover:bg-white/10 ${
                i > 0 ? "border-l border-white/15" : ""
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
                {action.icon}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-white">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
