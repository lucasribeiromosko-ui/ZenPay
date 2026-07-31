"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "./shared";
import { PLAN_ORDER, PLAN_INFO, Plan, medsRestantes } from "@/lib/plans";
import { IconCheck, IconShieldAlt, IconInfo } from "../icons";

export default function PlansPage() {
  const [plano, setPlano] = useState<Plan>("free");
  const [meds, setMeds] = useState(0);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sembanco">("carregando");

  useEffect(() => {
    fetch("/api/settings/plan", { cache: "no-store" })
      .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
      .then(({ status, body }) => {
        if (status === 503 || body.configured === false) {
          setEstado("sembanco");
        } else if (body.ok) {
          setPlano(body.plano);
          setMeds(body.meds ?? 0);
          setEstado("pronto");
        } else {
          setEstado("pronto");
        }
      })
      .catch(() => setEstado("pronto"));
  }, []);

  const restantes = medsRestantes(plano, meds);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        subtitle="Seu plano define quantos MEDs a conta aguenta antes de cair."
      />

      {estado === "sembanco" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-[12.5px] leading-relaxed text-amber-200/90">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          Os planos ficam disponíveis quando o banco de dados estiver ligado (login rígido ativo).
        </div>
      )}

      {/* Plano atual */}
      {estado === "pronto" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zen-border bg-zen-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zen-red/15 text-zen-red-bright">
              <IconShieldAlt className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">Seu plano</p>
              <p className="text-lg font-extrabold">{PLAN_INFO[plano].nome}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-zen-muted">MEDs registrados: {meds}</p>
            <p className="text-[13px] font-semibold">
              {restantes === null ? (
                <span className="text-emerald-400">Não cai por MED</span>
              ) : restantes === 0 ? (
                <span className="text-zen-red-bright">Próximo MED derruba a conta</span>
              ) : (
                <span className="text-amber-400">Aguenta mais {restantes} MED{restantes > 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Cards dos planos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((p) => {
          const info = PLAN_INFO[p];
          const atual = p === plano;
          return (
            <div
              key={p}
              className={`relative flex flex-col rounded-2xl border p-5 transition ${
                atual
                  ? "border-zen-red/60 bg-gradient-to-b from-zen-red/10 to-zen-card shadow-red-soft"
                  : "border-zen-border bg-zen-card"
              }`}
            >
              {atual && (
                <span className="absolute right-4 top-4 rounded-full bg-zen-red px-2.5 py-0.5 text-[10px] font-bold text-white">
                  ATUAL
                </span>
              )}
              <h3 className={`text-xl font-extrabold ${info.cor}`}>{info.nome}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-zen-muted">{info.resumo}</p>
              <ul className="mt-4 space-y-2">
                {info.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13px] text-zinc-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zen-red/15 text-zen-red-bright">
                      <IconCheck className="h-2.5 w-2.5" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-zen-border pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                  Tolerância a MED
                </p>
                <p className="text-[14px] font-bold">
                  {info.medTolerancia === Infinity ? "Não cai por MED" : `${info.medTolerancia} MED${info.medTolerancia > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="rounded-xl border border-zen-border bg-zen-card px-4 py-3 text-[12px] leading-relaxed text-zen-muted">
        A troca de plano é feita pela equipe ZenPay. Fale com o suporte para subir de plano.
      </p>
    </div>
  );
}
