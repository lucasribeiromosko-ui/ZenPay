"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "./shared";
import { IconGlobe, IconCheck, IconInfo } from "../icons";

type Tracking = {
  meta_pixel: string;
  google_ads: string;
  tiktok_pixel: string;
  gtm_container: string;
};

const CAMPOS: { key: keyof Tracking; nome: string; desc: string; placeholder: string; cor: string; bg: string }[] = [
  { key: "meta_pixel", nome: "Meta Pixel", desc: "Facebook e Instagram Ads", placeholder: "000000000000000", cor: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "google_ads", nome: "Google Ads", desc: "Tag de conversão do Google", placeholder: "AW-000000000", cor: "text-amber-400", bg: "bg-amber-500/10" },
  { key: "tiktok_pixel", nome: "TikTok Pixel", desc: "TikTok Ads Manager", placeholder: "C0000000000000000000", cor: "text-pink-400", bg: "bg-pink-500/10" },
  { key: "gtm_container", nome: "Google Tag Manager", desc: "Container GTM", placeholder: "GTM-XXXXXXX", cor: "text-emerald-400", bg: "bg-emerald-500/10" },
];

export default function TrackingPage() {
  const [data, setData] = useState<Tracking>({ meta_pixel: "", google_ads: "", tiktok_pixel: "", gtm_container: "" });
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sembanco">("carregando");
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/settings/tracking", { cache: "no-store" })
      .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
      .then(({ status, body }) => {
        if (status === 503 || body.configured === false) {
          setEstado("sembanco");
        } else if (body.ok) {
          setData(body.tracking);
          setEstado("pronto");
        } else {
          setEstado("pronto");
        }
      })
      .catch(() => setEstado("pronto"));
  }, []);

  async function salvar() {
    setSalvando(true);
    try {
      const res = await fetch("/api/settings/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) {
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2000);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trackeamento"
        subtitle="Conecte seus pixels para medir conversão nos seus checkouts da ZenPay."
      />

      {estado === "sembanco" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-[12.5px] leading-relaxed text-amber-200/90">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          Trackeamento fica disponível quando o banco de dados estiver ligado (login rígido ativo).
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {CAMPOS.map((c) => (
          <section key={c.key} className="rounded-2xl border border-zen-border bg-zen-card p-5">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.cor}`}>
                <IconGlobe className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-[14.5px] font-bold">{c.nome}</h2>
                <p className="text-[12px] text-zen-muted">{c.desc}</p>
              </div>
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  data[c.key]?.trim() ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
                }`}
              >
                {data[c.key]?.trim() ? "Ativo" : "Inativo"}
              </span>
            </div>
            <input
              type="text"
              value={data[c.key]}
              onChange={(e) => setData((d) => ({ ...d, [c.key]: e.target.value }))}
              placeholder={c.placeholder}
              disabled={estado !== "pronto"}
              className="mt-4 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20 disabled:opacity-50"
            />
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zen-red/25 bg-zen-red/5 px-5 py-4">
        <p className="text-[12.5px] leading-relaxed text-zinc-300">
          Os eventos <span className="font-bold text-white">PageView</span>,{" "}
          <span className="font-bold text-white">InitiateCheckout</span> e{" "}
          <span className="font-bold text-white">Purchase</span> são disparados no checkout.
        </p>
        <button
          onClick={salvar}
          disabled={estado !== "pronto" || salvando}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
            salvo
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-gradient-to-r from-zen-red to-zen-red-dark text-white shadow-red-soft hover:brightness-110"
          }`}
        >
          {salvo ? <IconCheck className="h-4 w-4" /> : null}
          {salvo ? "Salvo!" : salvando ? "Salvando…" : "Salvar pixels"}
        </button>
      </div>
    </div>
  );
}
