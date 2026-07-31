"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FakeQr from "./FakeQr";
import MercadoPagoCard from "./MercadoPagoCard";
import MercadoPagoPix from "./MercadoPagoPix";
import { evaluateSandboxCard, TEST_CARDS } from "@/lib/sandbox";
import { LogoMark } from "../Logo";

type MpConfig = {
  pixReal: boolean;
  cardReal: boolean;
  publicKey: string | null;
  testMode: boolean;
};
import {
  IconPix,
  IconCard,
  IconCopy,
  IconCheck,
  IconShield,
  IconClock,
  IconLock,
  IconClose,
} from "../icons";

type Method = "pix" | "credito" | "debito";

function parseValor(v: string | null): number {
  const cents = parseInt((v ?? "").replace(/\D/g, "") || "0", 10);
  return cents / 100;
}

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function maskCard(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function maskExpiry(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export default function Checkout({ linkId }: { linkId: string }) {
  const sp = useSearchParams();

  const desc = sp.get("desc") || "Pagamento ZenPay";
  const valor = parseValor(sp.get("valor"));
  const allowPix = sp.get("pix") !== "0";
  const allowCredito = sp.get("credito") !== "0";
  const allowDebito = sp.get("debito") === "1";
  const maxParcelas = Math.max(1, parseInt(sp.get("parcelas") || "1", 10) || 1);
  const modoCompleto = sp.get("modo") === "completo";
  const sellerToken = sp.get("t") || undefined;

  const methods: Method[] = useMemo(() => {
    const m: Method[] = [];
    if (allowPix) m.push("pix");
    if (allowCredito) m.push("credito");
    if (allowDebito) m.push("debito");
    return m.length ? m : ["pix"];
  }, [allowPix, allowCredito, allowDebito]);

  const [method, setMethod] = useState<Method>(methods[0]);
  const [copied, setCopied] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [paid, setPaid] = useState(false);
  const [cardErro, setCardErro] = useState<string | null>(null);
  const [aprovado, setAprovado] = useState<{ brand: string; last4: string } | null>(null);
  const [mostrarTestes, setMostrarTestes] = useState(false);

  function pagarCartao(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName.trim()) {
      setCardErro("Informe o nome impresso no cartão.");
      return;
    }
    // Avaliação 100% no navegador. Número e CVV não são guardados
    // nem enviados: a função devolve só bandeira e 4 últimos dígitos.
    const r = evaluateSandboxCard(cardNum, cardExp, cardCvv);
    if (!r.ok) {
      setCardErro(r.reason);
      setAprovado(null);
      return;
    }
    setCardErro(null);
    setAprovado({ brand: r.brand, last4: r.last4 });
    // Descarta os dados sensíveis imediatamente após avaliar.
    setCardNum("");
    setCardCvv("");
    setPaid(true);
  }

  // Dados do comprador (checkout completo)
  const [step, setStep] = useState<"dados" | "pagamento">(
    modoCompleto ? "dados" : "pagamento"
  );
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [erroDados, setErroDados] = useState<string | null>(null);

  function maskCpf(v: string): string {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }

  function submitDados(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().split(" ").filter(Boolean).length < 2) {
      setErroDados("Informe seu nome completo.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setErroDados("Informe um e-mail válido.");
      return;
    }
    if (cpf.replace(/\D/g, "").length !== 11) {
      setErroDados("Informe um CPF válido.");
      return;
    }
    setErroDados(null);
    setStep("pagamento");
  }

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136zenpay-${linkId}-demo520400005303986540${valor
    .toFixed(2)
    .replace(".", "")}5802BR5906ZENPAY6009SAO PAULO`;

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado
    }
  }

  const parcelaOptions = Array.from({ length: maxParcelas }, (_, i) => i + 1);

  const [mp, setMp] = useState<MpConfig | null>(null);
  useEffect(() => {
    let cancel = false;
    fetch("/api/pay/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((c: MpConfig) => {
        if (!cancel) setMp(c);
      })
      .catch(() => {
        if (!cancel) setMp({ pixReal: false, cardReal: false, publicKey: null, testMode: true });
      });
    return () => {
      cancel = true;
    };
  }, []);

  const pixReal = Boolean(mp?.pixReal);
  const cardReal = Boolean(mp?.cardReal);
  const testMode = mp?.testMode ?? true;

  const aprovarPagamento = useCallback(() => {
    setAprovado(null);
    setPaid(true);
  }, []);

  if (paid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zen-bg p-4">
        <div className="w-full max-w-[420px] rounded-2xl border border-emerald-500/30 bg-zen-card p-8 text-center shadow-xl animate-pop-in">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <IconCheck className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold">Pagamento aprovado!</h1>
          {aprovado?.last4 && method !== "pix" && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-zen-border bg-zen-bg px-3 py-1 text-[12px] font-semibold text-zinc-300">
              <IconCard className="h-3.5 w-3.5" />
              {aprovado.brand} •••• {aprovado.last4}
            </p>
          )}
          <p className="mt-3 text-[13.5px] leading-relaxed text-zen-muted">
            {testMode
              ? "Pagamento aprovado no modo teste — nenhuma cobrança real foi feita."
              : "Pagamento aprovado. Você vai receber a confirmação por e-mail."}
          </p>
          <button
            onClick={() => {
              setPaid(false);
              setAprovado(null);
            }}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-2.5 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110"
          >
            Voltar ao checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zen-bg">
      {/* Faixa de modo teste (some quando estiver em produção) */}
      {testMode && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 px-4 py-1.5 text-center text-[12px] font-semibold text-amber-300">
          <IconLock className="h-3.5 w-3.5" />
          {pixReal || cardReal
            ? "Ambiente de teste do Mercado Pago — use os cartões de teste; nenhuma cobrança real."
            : "Modo sandbox — nenhuma cobrança real. Cartões reais não são processados nem guardados."}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zen-border bg-zen-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-extrabold tracking-wide">
              ZEN<span className="text-zen-red-bright">PAY</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400">
            <IconShield className="h-4 w-4" />
            Pagamento seguro
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[960px] grid-cols-1 gap-5 px-4 py-8 md:grid-cols-[1fr_1.4fr]">
        {/* Resumo */}
        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zen-muted">
            Você está pagando
          </p>
          <h1 className="mt-2 text-lg font-bold">{desc}</h1>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-zen-red-bright">
            {brl(valor)}
          </p>

          {modoCompleto && step === "pagamento" && (
            <div className="mt-5 rounded-xl border border-zen-border bg-zen-bg p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                    Comprador
                  </p>
                  <p className="mt-1 truncate text-[13px] font-semibold">{nome}</p>
                  <p className="truncate text-[11.5px] text-zen-muted">{email}</p>
                  <p className="font-mono text-[11.5px] text-zen-muted">{cpf}</p>
                </div>
                <button
                  onClick={() => setStep("dados")}
                  className="shrink-0 text-[11.5px] font-semibold text-zen-red-bright transition hover:brightness-125"
                >
                  Editar
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2.5 border-t border-zen-border pt-5">
            <div className="flex items-center gap-2 text-[12.5px] text-zen-muted">
              <IconShield className="h-4 w-4 text-emerald-400" />
              Ambiente criptografado
            </div>
            <div className="flex items-center gap-2 text-[12.5px] text-zen-muted">
              <IconClock className="h-4 w-4 text-amber-400" />
              {allowPix ? "PIX aprovado na hora" : "Processamento imediato"}
            </div>
            <div className="flex items-center gap-2 text-[12.5px] text-zen-muted">
              <IconLock className="h-4 w-4 text-zen-red-bright" />
              Dados protegidos pela ZenPay
            </div>
          </div>
        </section>

        {/* Pagamento */}
        <section className="rounded-2xl border border-zen-border bg-zen-card p-6">
          {/* Passos do checkout completo */}
          {modoCompleto && (
            <div className="mb-5 flex items-center gap-2">
              {(["dados", "pagamento"] as const).map((s, i) => {
                const done = step === "pagamento" && s === "dados";
                const atual = step === s;
                return (
                  <div key={s} className="flex flex-1 items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                        done
                          ? "bg-emerald-500/15 text-emerald-400"
                          : atual
                            ? "bg-zen-red text-white"
                            : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {done ? <IconCheck className="h-3 w-3" /> : i + 1}
                    </span>
                    <span
                      className={`text-[12px] font-semibold ${
                        atual ? "text-white" : "text-zen-muted"
                      }`}
                    >
                      {s === "dados" ? "Seus dados" : "Pagamento"}
                    </span>
                    {i === 0 && <span className="h-px flex-1 bg-zen-border" />}
                  </div>
                );
              })}
            </div>
          )}

          {modoCompleto && step === "dados" ? (
            <form onSubmit={submitDados} className="space-y-3.5">
              <p className="text-[13.5px] font-semibold">Preencha seus dados para continuar</p>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                  Nome completo
                </p>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                  E-mail
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                />
                <p className="mt-1 text-[11px] text-zen-muted">
                  É neste e-mail que você recebe o acesso.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">CPF</p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                />
              </div>

              {erroDados && (
                <p className="rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
                  {erroDados}
                </p>
              )}

              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-3 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 active:scale-[0.99]"
              >
                Continuar para o pagamento
              </button>
            </form>
          ) : (
          <>
          {/* Tabs de método */}
          {methods.length > 1 && (
            <div
              className="mb-5 grid gap-1 rounded-xl bg-zen-bg p-1"
              style={{ gridTemplateColumns: `repeat(${methods.length}, 1fr)` }}
            >
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold transition ${
                    method === m
                      ? "bg-zen-red text-white shadow-red-soft"
                      : "text-zen-muted hover:text-zinc-200"
                  }`}
                >
                  {m === "pix" ? (
                    <IconPix className="h-4 w-4" />
                  ) : (
                    <IconCard className="h-4 w-4" />
                  )}
                  {m === "pix" ? "PIX" : m === "credito" ? "Crédito" : "Débito"}
                </button>
              ))}
            </div>
          )}

          {method === "pix" ? (
            pixReal ? (
              <MercadoPagoPix
                amount={valor}
                description={desc}
                defaultEmail={modoCompleto ? email : undefined}
                defaultName={modoCompleto ? nome : undefined}
                testMode={testMode}
                sellerToken={sellerToken}
                onApproved={aprovarPagamento}
              />
            ) : (
            <div className="flex flex-col items-center">
              <p className="text-[13.5px] font-semibold">
                Escaneie o QR Code com o app do seu banco
              </p>
              <div className="mt-4 h-52 w-52 overflow-hidden rounded-xl border-4 border-white bg-white p-1.5">
                <FakeQr seed={linkId} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3.5 py-1.5 text-[12px] font-semibold text-amber-400">
                <IconClock className="h-3.5 w-3.5" />
                Expira em 29:59
              </div>

              <div className="mt-5 w-full">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                  Ou use o PIX copia e cola
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="flex-1 truncate rounded-xl border border-zen-border bg-zen-bg px-3.5 py-2.5 font-mono text-[11px] text-zinc-400">
                    {pixCode}
                  </p>
                  <button
                    onClick={copyPix}
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

              <button
                onClick={() => setPaid(true)}
                className="mt-5 w-full rounded-xl border border-zen-border bg-zen-bg py-2.5 text-[13px] font-semibold text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
              >
                Já paguei, verificar pagamento
              </button>
            </div>
            )
          ) : cardReal && mp?.publicKey ? (
            <MercadoPagoCard
              publicKey={mp.publicKey}
              amount={valor}
              maxInstallments={method === "credito" ? maxParcelas : 1}
              description={desc}
              payerEmail={modoCompleto ? email : undefined}
              tipo={method === "debito" ? "debito" : "credito"}
              sellerToken={sellerToken}
              onApproved={aprovarPagamento}
            />
          ) : (
            <form onSubmit={pagarCartao} className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13.5px] font-semibold">
                  {method === "credito"
                    ? "Pagar com cartão de crédito"
                    : "Pagar com cartão de débito"}
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarTestes((v) => !v)}
                  className="text-[11.5px] font-semibold text-amber-400 transition hover:brightness-125"
                >
                  Cartões de teste
                </button>
              </div>

              {mostrarTestes && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Use um destes no sandbox
                  </p>
                  <ul className="space-y-1">
                    {TEST_CARDS.map((c) => (
                      <li key={c.pan} className="flex items-center justify-between gap-2 text-[12px]">
                        <button
                          type="button"
                          onClick={() => {
                            setCardNum(c.pan);
                            setCardExp("12/30");
                            setCardCvv("123");
                            setCardName(cardName || "TESTE ZENPAY");
                          }}
                          className="font-mono text-zinc-200 transition hover:text-white"
                          title="Preencher"
                        >
                          {c.pan}
                        </button>
                        <span className="text-zen-muted">{c.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-zen-muted">
                    Validade: qualquer data futura · CVV: 3 dígitos
                  </p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                  Número do cartão
                </p>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                    <IconCard className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNum}
                    onChange={(e) => setCardNum(maskCard(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full rounded-xl border border-zen-border bg-zen-bg py-2.5 pl-10 pr-4 font-mono text-[14px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                  Nome impresso no cartão
                </p>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="COMO ESTÁ NO CARTÃO"
                  className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] uppercase outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                    Validade
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExp}
                    onChange={(e) => setCardExp(maskExpiry(e.target.value))}
                    placeholder="MM/AA"
                    className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">CVV</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                  />
                </div>
              </div>

              {method === "credito" && maxParcelas > 1 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
                    Parcelamento
                  </p>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(parseInt(e.target.value, 10))}
                    className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                  >
                    {parcelaOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}x de {brl(valor / p)} {p === 1 ? "à vista" : "sem juros"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {cardErro && (
                <p className="flex items-start gap-2 rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
                  <IconClose className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {cardErro}
                </p>
              )}

              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-3 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 active:scale-[0.99]"
              >
                Pagar {brl(valor)}
                {method === "credito" && parcelas > 1 ? ` em ${parcelas}x` : ""}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
                <IconLock className="h-3 w-3" />
                Modo teste · número e CVV não são guardados
              </p>
            </form>
          )}
          </>
          )}
        </section>
      </main>

      <footer className="pb-8 text-center text-[11px] text-zinc-600">
        Processado por ZenPay © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
