"use client";

import {
  IconClose,
  IconPix,
  IconCard,
  IconBox,
  IconLink,
  IconClock,
  IconCheck,
} from "./icons";

export type TxDetail = {
  id: string;
  data: string;
  status: "pendente" | "paga" | "recusada";
  origem: "checkout" | "link";
  metodo: "PIX" | "Crédito" | "Débito";
  parcelas?: number;
  produto: string | null;
  cliente: { nome: string; email: string; cpf?: string } | null;
  valor: string;
  taxa: string;
  liquido: string;
};

const statusStyle: Record<TxDetail["status"], string> = {
  paga: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pendente: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  recusada: "bg-zen-red/10 text-zen-red-bright border-zen-red/30",
};

const statusLabel: Record<TxDetail["status"], string> = {
  paga: "Paga",
  pendente: "Aguardando pagamento",
  recusada: "Recusada",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zen-border py-2.5 last:border-0">
      <p className="text-[12.5px] text-zen-muted">{label}</p>
      <div className="text-right text-[13px] font-semibold">{value}</div>
    </div>
  );
}

export default function TransactionDetailModal({
  tx,
  onClose,
}: {
  tx: TxDetail;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />

      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-zen-border bg-zen-card shadow-red-glow animate-pop-in">
        <div className="flex items-center gap-3 border-b border-zen-border px-6 py-4">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              tx.metodo === "PIX"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zen-red/15 text-zen-red-bright"
            }`}
          >
            {tx.metodo === "PIX" ? <IconPix className="h-4.5 w-4.5" /> : <IconCard className="h-4.5 w-4.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold">Detalhes da transação</h2>
            <p className="font-mono text-[11.5px] text-zen-muted">{tx.id}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Valor + status */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">Valor</p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight">{tx.valor}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${statusStyle[tx.status]}`}
            >
              {tx.status === "paga" ? (
                <IconCheck className="h-3 w-3" />
              ) : (
                <IconClock className="h-3 w-3" />
              )}
              {statusLabel[tx.status]}
            </span>
          </div>

          {/* Detalhes */}
          <div className="mt-5">
            <Row label="Data" value={tx.data} />
            <Row
              label="Forma de pagamento"
              value={
                tx.metodo === "Crédito" && tx.parcelas && tx.parcelas > 1
                  ? `${tx.metodo} ${tx.parcelas}x`
                  : tx.metodo
              }
            />
            <Row
              label="Origem"
              value={
                tx.origem === "link" ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <IconLink className="h-3.5 w-3.5" /> Link Rápido
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-zen-red-bright">
                    <IconBox className="h-3.5 w-3.5" /> Checkout
                  </span>
                )
              }
            />
            <Row label="Produto" value={tx.produto ?? "—"} />
          </div>

          {/* Cliente */}
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">Cliente</p>
            {tx.cliente ? (
              <div className="mt-1.5 rounded-xl border border-zen-border bg-zen-bg p-3.5">
                <p className="text-[13.5px] font-bold">{tx.cliente.nome}</p>
                <p className="text-[12px] text-zen-muted">{tx.cliente.email}</p>
                {tx.cliente.cpf && (
                  <p className="font-mono text-[12px] text-zen-muted">{tx.cliente.cpf}</p>
                )}
              </div>
            ) : (
              <p className="mt-1.5 rounded-xl border border-dashed border-zen-border p-3.5 text-[12.5px] text-zen-muted">
                Checkout no modo Rápido — sem dados do comprador.
              </p>
            )}
          </div>

          {/* Repasse */}
          <div className="mt-5 rounded-xl border border-zen-border bg-zen-bg p-4">
            <Row label="Valor bruto" value={tx.valor} />
            <Row label="Taxa ZenPay" value={<span className="text-zen-red-bright">-{tx.taxa}</span>} />
            <div className="flex items-center justify-between gap-4 pt-2.5">
              <p className="text-[12.5px] font-bold">Você recebe</p>
              <p className="text-lg font-extrabold text-emerald-400">{tx.liquido}</p>
            </div>
          </div>

          {tx.status === "pendente" && (
            <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-[12px] leading-relaxed text-zinc-300">
              Este pagamento ainda não foi confirmado. O valor entra no seu saldo assim que o
              comprador finalizar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
