"use client";

import { useEffect, useState } from "react";
import { PageHeader, MiniStat } from "./shared";
import {
  IconLink,
  IconPix,
  IconCard,
  IconCopy,
  IconCheck,
  IconTrash,
  IconExternal,
  IconPlus,
  IconTrendUp,
  IconLock,
} from "../icons";
import { useMpMode } from "../useMpMode";

type PayLink = {
  id: string;
  descricao: string;
  valor: string;
  pix: boolean;
  credito: boolean;
  debito: boolean;
  parcelas: number;
  criadoEm: string;
};

const STORAGE_KEY = "zenpay_paylinks";

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cents = parseInt(digits || "0", 10);
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function buildUrl(link: PayLink): string {
  const params = new URLSearchParams({
    desc: link.descricao,
    valor: link.valor,
    pix: link.pix ? "1" : "0",
    credito: link.credito ? "1" : "0",
    debito: link.debito ? "1" : "0",
    parcelas: String(link.parcelas),
  });
  return `/pay/${link.id}?${params.toString()}`;
}

function Toggle({
  checked,
  onChange,
  label,
  icon,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        checked
          ? "border-zen-red/60 bg-zen-red/10"
          : "border-zen-border bg-zen-bg hover:border-zinc-600"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          checked ? "bg-zen-red/20 text-zen-red-bright" : "bg-white/5 text-zinc-400"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[13px] font-bold">{label}</span>
        <span className="block text-[11px] text-zen-muted">{sub}</span>
      </span>
      <span
        className={`relative h-5.5 flex h-5 w-9 items-center rounded-full transition ${
          checked ? "bg-zen-red" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PayLink[]>([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [pix, setPix] = useState(true);
  const [credito, setCredito] = useState(true);
  const [debito, setDebito] = useState(false);
  const [parcelas, setParcelas] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const mpMode = useMpMode();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLinks(JSON.parse(saved));
    } catch {
      // storage corrompido — ignora
    }
  }, []);

  function persist(next: PayLink[]) {
    setLinks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const cents = parseInt(valor.replace(/\D/g, "") || "0", 10);
    if (cents < 100) {
      setError("Informe um valor de pelo menos R$ 1,00.");
      return;
    }
    if (!pix && !credito && !debito) {
      setError("Escolha pelo menos uma forma de pagamento.");
      return;
    }
    setError(null);
    const novo: PayLink = {
      id: Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4),
      descricao: descricao.trim() || "Pagamento ZenPay",
      valor: formatBRL(valor),
      pix,
      credito,
      debito,
      parcelas: credito ? parcelas : 1,
      criadoEm: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
    persist([novo, ...links]);
    setDescricao("");
    setValor("");
  }

  async function handleCopy(link: PayLink) {
    const url = `${window.location.origin}${buildUrl(link)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard bloqueado — mantém silencioso
    }
  }

  function handleDelete(id: string) {
    persist(links.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Links de Pagamento"
        subtitle="Crie um link, escolha as formas de pagamento e cobre por PIX, crédito ou débito."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<IconLink className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Links ativos"
          value={String(links.length)}
          highlight
        />
        <MiniStat
          icon={<IconPix className="h-4 w-4" />}
          iconClass="bg-emerald-500/10 text-emerald-400"
          label="Recebido via PIX"
          value="R$ 0,00"
        />
        <MiniStat
          icon={<IconCard className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Recebido no cartão"
          value="R$ 0,00"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_1.4fr]">
        {/* Criar link */}
        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
              <IconPlus className="h-4 w-4" />
            </span>
            Criar novo link
          </h2>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-zen-muted">
                Descrição (opcional)
              </p>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Mentoria individual"
                className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
              />
            </div>

            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-zen-muted">Valor</p>
              <input
                type="text"
                inputMode="numeric"
                value={valor ? formatBRL(valor) : ""}
                onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
                placeholder="R$ 0,00"
                className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-lg font-bold outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
              />
            </div>

            <div>
              <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-zen-muted">
                Formas de pagamento
              </p>
              <div className="space-y-2">
                <Toggle
                  checked={pix}
                  onChange={setPix}
                  label="PIX"
                  sub="Aprovação instantânea"
                  icon={<IconPix className="h-4.5 w-4.5" />}
                />
                <Toggle
                  checked={credito}
                  onChange={setCredito}
                  label="Cartão de crédito"
                  sub="Com opção de parcelamento"
                  icon={<IconCard className="h-4.5 w-4.5" />}
                />
                <Toggle
                  checked={debito}
                  onChange={setDebito}
                  label="Cartão de débito"
                  sub="À vista, direto da conta"
                  icon={<IconCard className="h-4.5 w-4.5" />}
                />
              </div>
              {(credito || debito) &&
                (mpMode?.testMode === false ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] leading-snug text-emerald-300/90">
                    <IconCheck className="mt-0.5 h-3 w-3 shrink-0" />
                    Cartão via Mercado Pago — cobrança real ativada. Nenhum dado de cartão é
                    guardado por aqui.
                  </p>
                ) : (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-1.5 text-[11px] leading-snug text-amber-300/90">
                    <IconLock className="mt-0.5 h-3 w-3 shrink-0" />
                    Cartão em modo teste: só cartões de teste passam e nenhum dado de cartão é
                    guardado.
                  </p>
                ))}
            </div>

            {credito && (
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-zen-muted">
                  Parcelamento máximo
                </p>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {[1, 3, 6, 12].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setParcelas(p)}
                      className={`rounded-lg py-2 text-[12.5px] font-bold transition ${
                        parcelas === p
                          ? "bg-zen-red text-white shadow-red-soft"
                          : "border border-zen-border bg-zen-bg text-zinc-400 hover:text-white"
                      }`}
                    >
                      {p}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-2.5 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 active:scale-[0.99]"
            >
              Gerar link de pagamento
            </button>
          </form>
        </section>

        {/* Lista de links */}
        <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
              <IconLink className="h-4 w-4" />
            </span>
            Seus links
            <span className="text-[12px] font-semibold text-zen-muted">({links.length})</span>
          </h2>

          {links.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zen-border text-zen-muted">
                <IconLink className="h-5 w-5" />
              </span>
              <p className="max-w-[260px] text-[13px] text-zen-muted">
                Nenhum link ainda. Crie o primeiro ao lado e compartilhe onde quiser.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="rounded-xl border border-zen-border bg-zen-bg p-4 transition hover:border-zen-red/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold">{link.descricao}</p>
                      <p className="mt-0.5 font-mono text-[11.5px] text-zen-muted">
                        zenpay.vercel.app/pay/{link.id}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {link.pix && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-[10.5px] font-bold text-emerald-400">
                            <IconPix className="h-3 w-3" /> PIX
                          </span>
                        )}
                        {link.credito && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-zen-red/30 bg-zen-red/5 px-2 py-0.5 text-[10.5px] font-bold text-zen-red-bright">
                            <IconCard className="h-3 w-3" /> Crédito até {link.parcelas}x
                          </span>
                        )}
                        {link.debito && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-500/30 bg-white/5 px-2 py-0.5 text-[10.5px] font-bold text-zinc-300">
                            <IconCard className="h-3 w-3" /> Débito
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-zen-red-bright">{link.valor}</p>
                      <p className="text-[11px] text-zen-muted">criado em {link.criadoEm}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(link)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-semibold transition ${
                        copiedId === link.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-zen-border bg-zen-card text-zinc-300 hover:border-zen-red/40 hover:text-white"
                      }`}
                    >
                      {copiedId === link.id ? (
                        <>
                          <IconCheck className="h-3.5 w-3.5" /> Copiado!
                        </>
                      ) : (
                        <>
                          <IconCopy className="h-3.5 w-3.5" /> Copiar link
                        </>
                      )}
                    </button>
                    <a
                      href={buildUrl(link)}
                      target="_blank"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zen-border bg-zen-card py-2 text-[12px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white"
                    >
                      <IconExternal className="h-3.5 w-3.5" /> Abrir checkout
                    </a>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zen-border bg-zen-card text-zinc-500 transition hover:border-zen-red/50 hover:text-zen-red-bright"
                      title="Excluir link"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
