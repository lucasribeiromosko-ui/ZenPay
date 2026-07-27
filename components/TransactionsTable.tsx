"use client";

import { IconReceipt } from "./icons";

type Tx = {
  id: string;
  cliente: string;
  metodo: string;
  valor: string;
  status: "aprovada" | "pendente" | "recusada";
  data: string;
};

const txs: Tx[] = [
  {
    id: "#ZP-000002",
    cliente: "cliente@email.com",
    metodo: "PIX",
    valor: "R$ 60,00",
    status: "pendente",
    data: "Hoje, 22:41",
  },
  {
    id: "#ZP-000001",
    cliente: "comprador@email.com",
    metodo: "PIX",
    valor: "R$ 60,00",
    status: "pendente",
    data: "Hoje, 21:15",
  },
];

const statusStyles: Record<Tx["status"], string> = {
  aprovada: "bg-emerald-500/10 text-emerald-400",
  pendente: "bg-amber-500/10 text-amber-400",
  recusada: "bg-zen-red/10 text-zen-red-bright",
};

const statusLabels: Record<Tx["status"], string> = {
  aprovada: "Aprovada",
  pendente: "Pendente",
  recusada: "Recusada",
};

export default function TransactionsTable() {
  return (
    <section className="rounded-2xl border border-zen-border bg-zen-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <span className="text-zen-red-bright">
            <IconReceipt className="h-4.5 w-4.5" />
          </span>
          Últimas transações
        </h2>
        <button className="text-[12.5px] font-semibold text-zen-red-bright transition hover:brightness-125">
          Ver todas →
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-zen-border text-[11px] uppercase tracking-wider text-zen-muted">
              <th className="pb-2.5 pr-4 font-bold">ID</th>
              <th className="pb-2.5 pr-4 font-bold">Cliente</th>
              <th className="pb-2.5 pr-4 font-bold">Método</th>
              <th className="pb-2.5 pr-4 font-bold">Valor</th>
              <th className="pb-2.5 pr-4 font-bold">Status</th>
              <th className="pb-2.5 font-bold">Data</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-zen-border/60 last:border-0 hover:bg-white/[0.02]"
              >
                <td className="py-3 pr-4 font-mono text-[12px] text-zinc-400">{tx.id}</td>
                <td className="py-3 pr-4 text-zinc-300">{tx.cliente}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                    {tx.metodo}
                  </span>
                </td>
                <td className="py-3 pr-4 font-bold">{tx.valor}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[tx.status]}`}
                  >
                    {statusLabels[tx.status]}
                  </span>
                </td>
                <td className="py-3 text-zen-muted">{tx.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
