"use client";

import { PageHeader, MiniStat, FakeSelect } from "./shared";
import {
  IconTrendUp,
  IconCart,
  IconClock,
  IconGift,
  IconSearch,
  IconDownload,
  IconEye,
  IconLink,
  IconBox,
} from "../icons";

type Tx = {
  data: string;
  status: "pendente" | "paga" | "recusada";
  origem: "checkout" | "link";
  produto: string | null;
  cliente: { nome: string; email: string } | null;
  valor: string;
};

const txs: Tx[] = [
  {
    data: "27/07/2026, 21:40",
    status: "pendente",
    origem: "link",
    produto: null,
    cliente: null,
    valor: "R$ 100,00",
  },
  {
    data: "27/07/2026, 21:38",
    status: "pendente",
    origem: "checkout",
    produto: "Produto Teste",
    cliente: { nome: "Mariana Silva", email: "mariana.silva@mail.com" },
    valor: "R$ 1.200,00",
  },
  {
    data: "27/07/2026, 21:38",
    status: "pendente",
    origem: "checkout",
    produto: "Produto Teste",
    cliente: { nome: "Rafael Araujo", email: "rafael.araujo@mail.com" },
    valor: "R$ 1.200,00",
  },
  {
    data: "27/07/2026, 13:20",
    status: "pendente",
    origem: "link",
    produto: null,
    cliente: null,
    valor: "R$ 20,00",
  },
];

const statusStyle: Record<Tx["status"], string> = {
  paga: "bg-emerald-500/10 text-emerald-400",
  pendente: "bg-amber-500/10 text-amber-400",
  recusada: "bg-zen-red/10 text-zen-red-bright",
};

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        subtitle="Tudo que entrou — pagas e pendentes — com origem, cliente e detalhes."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          icon={<IconTrendUp className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Total recebido"
          value="R$ 0,00"
          sub="0 pagas"
          highlight
        />
        <MiniStat
          icon={<IconCart className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Vendas pagas"
          value="R$ 0,00"
          sub="0 pedidos · ticket R$ 0,00"
        />
        <MiniStat
          icon={<IconClock className="h-4 w-4" />}
          iconClass="bg-amber-500/10 text-amber-400"
          label="Pendentes"
          value="R$ 2.520,00"
          sub="4 pendentes"
        />
        <MiniStat
          icon={<IconGift className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Indicações"
          value="R$ 0,00"
          sub="bônus por indicação"
        />
      </div>

      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <FakeSelect label="Hoje" />
          <FakeSelect label="Todos status" />
          <FakeSelect label="Todas origens" />

          <div className="relative min-w-[200px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar cliente, produto, e-mail..."
              className="w-full rounded-xl border border-zen-border bg-zen-bg py-2 pl-10 pr-4 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>

          <button className="flex items-center gap-2 rounded-xl border border-zen-border bg-zen-bg px-4 py-2 text-[12.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
            <IconDownload className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        {/* Tabela */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-zen-border text-[11px] uppercase tracking-wider text-zen-muted">
                <th className="pb-2.5 pr-4 font-bold">Data</th>
                <th className="pb-2.5 pr-4 font-bold">Status</th>
                <th className="pb-2.5 pr-4 font-bold">Origem</th>
                <th className="pb-2.5 pr-4 font-bold">Produto</th>
                <th className="pb-2.5 pr-4 font-bold">Cliente</th>
                <th className="pb-2.5 pr-4 text-right font-bold">Valor</th>
                <th className="pb-2.5 font-bold" />
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => (
                <tr key={i} className="border-b border-zen-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-3.5 pr-4 text-zinc-300">{tx.data}</td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusStyle[tx.status]}`}
                    >
                      <IconClock className="h-3 w-3" />
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {tx.origem === "link" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <IconLink className="h-3 w-3" />
                        Link Rápido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-zen-red/30 bg-zen-red/5 px-2 py-0.5 text-[11px] font-semibold text-zen-red-bright">
                        <IconBox className="h-3 w-3" />
                        Checkout
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{tx.produto ?? "—"}</td>
                  <td className="py-3.5 pr-4">
                    {tx.cliente ? (
                      <div>
                        <p className="font-semibold text-zinc-200">{tx.cliente.nome}</p>
                        <p className="text-[11.5px] text-zen-muted">{tx.cliente.email}</p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-bold">{tx.valor}</td>
                  <td className="py-3.5 text-right">
                    <button className="text-zinc-500 transition hover:text-white" title="Ver detalhes">
                      <IconEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
