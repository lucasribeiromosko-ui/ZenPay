"use client";

import { useState } from "react";
import {
  Product,
  CheckoutMode,
  brlFromCents,
  centsFromInput,
  newProductId,
} from "@/lib/products";
import { IconClose, IconBox, IconPix, IconCard, IconUsers, IconLock, IconCheck } from "./icons";
import { useMpMode } from "./useMpMode";

function MethodToggle({
  checked,
  onChange,
  label,
  sub,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
        checked ? "border-zen-red/60 bg-zen-red/10" : "border-zen-border bg-zen-bg hover:border-zinc-600"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          checked ? "bg-zen-red/20 text-zen-red-bright" : "bg-white/5 text-zinc-400"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">{label}</span>
        <span className="block truncate text-[11px] text-zen-muted">{sub}</span>
      </span>
      <span
        className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition ${
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

export default function ProductModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: Product) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [modo, setModo] = useState<CheckoutMode>("rapido");
  const [pix, setPix] = useState(true);
  const [credito, setCredito] = useState(true);
  const [debito, setDebito] = useState(false);
  const [parcelas, setParcelas] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const mpMode = useMpMode();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError("Dê um nome ao seu produto.");
      return;
    }
    const cents = centsFromInput(valor);
    if (cents < 100) {
      setError("O valor precisa ser de pelo menos R$ 1,00.");
      return;
    }
    if (!pix && !credito && !debito) {
      setError("Escolha pelo menos uma forma de pagamento.");
      return;
    }
    onCreate({
      id: newProductId(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      valor: cents,
      modo,
      pix,
      credito,
      debito,
      parcelas: credito ? parcelas : 1,
      ativo: true,
      vendas: 0,
      criadoEm: new Date().toLocaleDateString("pt-BR"),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />

      <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-zen-border bg-zen-card shadow-red-glow animate-pop-in">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-zen-red/20 blur-3xl" />

        <div className="relative flex items-center gap-3 border-b border-zen-border px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zen-red to-zen-blood text-white">
            <IconBox className="h-4.5 w-4.5" />
          </span>
          <div className="flex-1">
            <h2 className="text-[15.5px] font-bold">Criar novo produto</h2>
            <p className="text-[12px] text-zen-muted">Gera um checkout pronto para vender.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-4 px-6 py-5">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
              Nome do produto
            </p>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mentoria Individual"
              className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>

          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
              Descrição (opcional)
            </p>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Aparece no checkout para o comprador"
              className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>

          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">Preço</p>
            <input
              type="text"
              inputMode="numeric"
              value={valor ? brlFromCents(centsFromInput(valor)) : ""}
              onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
              placeholder="R$ 0,00"
              className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-lg font-bold outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
              Tipo de checkout
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModo("rapido")}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  modo === "rapido"
                    ? "border-zen-red/60 bg-zen-red/10"
                    : "border-zen-border bg-zen-bg hover:border-zinc-600"
                }`}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-bold">
                  <IconPix className="h-3.5 w-3.5" />
                  Rápido
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-zen-muted">
                  Só o pagamento, sem pedir dados
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModo("completo")}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  modo === "completo"
                    ? "border-zen-red/60 bg-zen-red/10"
                    : "border-zen-border bg-zen-bg hover:border-zinc-600"
                }`}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-bold">
                  <IconUsers className="h-3.5 w-3.5" />
                  Completo
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-zen-muted">
                  Pede nome, CPF e e-mail (vira lead)
                </span>
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
              Formas de pagamento
            </p>
            <div className="space-y-2">
              <MethodToggle
                checked={pix}
                onChange={setPix}
                label="PIX"
                sub="Aprovação instantânea"
                icon={<IconPix className="h-4 w-4" />}
              />
              <MethodToggle
                checked={credito}
                onChange={setCredito}
                label="Cartão de crédito"
                sub="Com opção de parcelamento"
                icon={<IconCard className="h-4 w-4" />}
              />
              <MethodToggle
                checked={debito}
                onChange={setDebito}
                label="Cartão de débito"
                sub="À vista, direto da conta"
                icon={<IconCard className="h-4 w-4" />}
              />
            </div>
            {(credito || debito) &&
              (mpMode?.testMode === false ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] leading-snug text-emerald-300/90">
                  <IconCheck className="mt-0.5 h-3 w-3 shrink-0" />
                  Cartão via Mercado Pago — cobrança real. Nenhum dado de cartão é guardado aqui.
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
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
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

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zen-border bg-zen-bg py-2.5 text-sm font-semibold text-zinc-300 transition hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[1.5] rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-2.5 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 active:scale-[0.99]"
            >
              Criar produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
