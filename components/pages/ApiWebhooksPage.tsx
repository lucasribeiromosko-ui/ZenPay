"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "./shared";
import {
  IconApi,
  IconGlobe,
  IconCopy,
  IconCheck,
  IconPlus,
  IconTrash,
  IconInfo,
} from "../icons";

type Webhook = { id: string; url: string; secret: string; ativo: boolean };

export default function ApiWebhooksPage() {
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sembanco">("carregando");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [secretOnce, setSecretOnce] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [novoUrl, setNovoUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [teste, setTeste] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function load() {
      const r = await fetch("/api/settings/apikeys", { cache: "no-store" });
      if (r.status === 503) {
        setEstado("sembanco");
        return;
      }
      const d = await r.json().catch(() => ({}));
      setPublicKey(d.publicKey ?? null);
      const w = await fetch("/api/settings/webhooks", { cache: "no-store" });
      const wd = await w.json().catch(() => ({}));
      if (wd.ok) setWebhooks(wd.webhooks);
      setEstado("pronto");
    }
    load().catch(() => setEstado("pronto"));
  }, []);

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard bloqueado
    }
  }

  async function gerarChaves() {
    setGerando(true);
    try {
      const r = await fetch("/api/settings/apikeys", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (d.ok) {
        setPublicKey(d.publicKey);
        setSecretOnce(d.secretKey);
      }
    } finally {
      setGerando(false);
    }
  }

  async function addWebhook(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/settings/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: novoUrl.trim() }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.ok) {
      setWebhooks((w) => [d.webhook, ...w]);
      setNovoUrl("");
    }
  }

  async function delWebhook(id: string) {
    await fetch(`/api/settings/webhooks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setWebhooks((w) => w.filter((x) => x.id !== id));
  }

  async function testWebhook(w: Webhook) {
    setTeste({ id: w.id, msg: "Enviando…", ok: false });
    const r = await fetch("/api/settings/webhooks/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: w.url }),
    });
    const d = await r.json().catch(() => ({}));
    setTeste({
      id: w.id,
      ok: Boolean(d.ok),
      msg: d.ok ? `Entregue (HTTP ${d.status})` : d.message || "Falhou",
    });
  }

  const eventos = [
    "payment.created",
    "payment.approved",
    "payment.refused",
    "payment.expired",
    "payment.refunded",
    "withdraw.completed",
  ];

  const curl = `curl -X POST ${origin || "https://SEU-SITE"}/api/v1/pix \\
  -H "Authorization: Bearer SUA_CHAVE_SECRETA" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 49.90, "email": "comprador@email.com", "description": "Pedido 123"}'`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="API & Webhooks"
        subtitle="Suas chaves de integração e para onde a ZenPay avisa cada evento."
      />

      {estado === "sembanco" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-[12.5px] leading-relaxed text-amber-200/90">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          A API fica disponível quando o banco de dados estiver ligado (login rígido ativo).
        </div>
      )}

      {/* Chaves */}
      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
            <IconApi className="h-4 w-4" />
          </span>
          Suas chaves
        </h2>

        {secretOnce && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-[12px] font-bold text-emerald-400">
              Chave secreta gerada — copie agora, ela não será mostrada de novo.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <p className="flex-1 truncate rounded-lg border border-zen-border bg-zen-bg px-3 py-2 font-mono text-[12px]">
                {secretOnce}
              </p>
              <button
                onClick={() => copy(secretOnce, "once")}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-[12px] font-bold text-emerald-400"
              >
                {copied === "once" ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                {copied === "once" ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">Chave pública</p>
          {publicKey ? (
            <div className="mt-1.5 flex items-center gap-2">
              <p className="flex-1 truncate rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[12.5px] text-zinc-300">
                {publicKey}
              </p>
              <button
                onClick={() => copy(publicKey, "pub")}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zen-border bg-zen-bg text-zinc-400 transition hover:text-white"
              >
                {copied === "pub" ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-[13px] text-zen-muted">Nenhuma chave gerada ainda.</p>
          )}
        </div>

        <button
          onClick={gerarChaves}
          disabled={estado !== "pronto" || gerando}
          className="mt-4 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-5 py-2.5 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 disabled:opacity-50"
        >
          {gerando ? "Gerando…" : publicKey ? "Regenerar chaves" : "Gerar chaves"}
        </button>
        {publicKey && (
          <p className="mt-2 text-[11.5px] text-zen-muted">
            Regenerar invalida a chave secreta anterior.
          </p>
        )}
      </section>

      {/* Documentação rápida */}
      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <h2 className="text-[15px] font-bold">Criar cobrança PIX pela API</h2>
        <p className="mt-1 text-[12px] text-zen-muted">
          Autentique com a chave secreta no header. Retorna o QR Code do PIX.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-zen-border bg-zen-bg p-4 font-mono text-[11.5px] leading-relaxed text-zinc-300">
{curl}
        </pre>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Webhooks */}
        <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
              <IconGlobe className="h-4 w-4" />
            </span>
            Endpoints de webhook
          </h2>

          <form onSubmit={addWebhook} className="mt-4 flex gap-2">
            <input
              type="text"
              value={novoUrl}
              onChange={(e) => setNovoUrl(e.target.value)}
              placeholder="https://seusite.com/webhooks/zenpay"
              disabled={estado !== "pronto"}
              className="flex-1 rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[12.5px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={estado !== "pronto"}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-4 text-[12.5px] font-bold text-white shadow-red-soft transition hover:brightness-110 disabled:opacity-50"
            >
              <IconPlus className="h-4 w-4" />
              Adicionar
            </button>
          </form>

          {webhooks.length === 0 ? (
            <p className="mt-6 py-8 text-center text-[13px] text-zen-muted">Nenhum endpoint cadastrado.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {webhooks.map((w) => (
                <li key={w.id} className="rounded-xl border border-zen-border bg-zen-bg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <p className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-300">{w.url}</p>
                    <button
                      onClick={() => testWebhook(w)}
                      className="rounded-lg border border-zen-border px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white"
                    >
                      Testar
                    </button>
                    <button
                      onClick={() => delWebhook(w.id)}
                      className="text-zinc-500 transition hover:text-zen-red-bright"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-zen-muted">Secret</span>
                    <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-500">{w.secret}</p>
                    <button
                      onClick={() => copy(w.secret, w.id)}
                      className="text-zinc-500 transition hover:text-white"
                    >
                      {copied === w.id ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {teste?.id === w.id && (
                    <p className={`mt-2 text-[11.5px] font-medium ${teste.ok ? "text-emerald-400" : "text-zen-red-bright"}`}>
                      {teste.msg}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="text-[15px] font-bold">Eventos disponíveis</h2>
          <p className="mt-1 text-[12px] text-zen-muted">Enviados via POST em JSON para cada endpoint.</p>
          <ul className="mt-4 space-y-1.5">
            {eventos.map((ev) => (
              <li key={ev} className="rounded-lg border border-zen-border bg-zen-bg px-3 py-2 font-mono text-[12px] text-zinc-300">
                {ev}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
