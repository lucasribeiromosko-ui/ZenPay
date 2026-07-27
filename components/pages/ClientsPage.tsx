"use client";

import { PageHeader, MiniStat } from "./shared";
import { IconUsers, IconSearch, IconDownload, IconInfo } from "../icons";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Sua base de leads e compradores em todos os produtos."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniStat
          icon={<IconUsers className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Leads totais"
          value="0"
        />
        <MiniStat
          icon={<IconUsers className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Compradores"
          value="0"
        />
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 rounded-2xl border border-zen-red/25 bg-zen-red/5 px-4 py-3.5">
        <span className="mt-0.5 text-zen-red-bright">
          <IconInfo className="h-4 w-4" />
        </span>
        <p className="text-[13px] leading-relaxed text-zinc-300">
          Os leads só aparecem aqui quando o comprador preenche o checkout no modo{" "}
          <span className="font-bold text-white">Completo</span> (nome, CPF e email). Produtos no
          modo <span className="font-bold text-white">Rápido</span> não geram leads identificáveis.
        </p>
      </div>

      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, email ou documento..."
              className="w-full rounded-xl border border-zen-border bg-zen-bg py-2 pl-10 pr-4 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-zen-border bg-zen-bg px-4 py-2 text-[12.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
            <IconDownload className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-zen-border text-[11px] uppercase tracking-wider text-zen-muted">
                <th className="pb-2.5 pr-4 font-bold">Cliente</th>
                <th className="pb-2.5 pr-4 font-bold">Contato</th>
                <th className="pb-2.5 pr-4 font-bold">Pedidos</th>
                <th className="pb-2.5 pr-4 font-bold">Total gasto</th>
                <th className="pb-2.5 font-bold">Última compra</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5}>
                  <p className="py-14 text-center text-[13px] text-zen-muted">
                    Nenhum cliente ainda. Crie um produto e divulgue seu link!
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
