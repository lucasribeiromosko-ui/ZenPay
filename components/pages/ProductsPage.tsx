"use client";

import { PageHeader, MiniStat, FakeSelect } from "./shared";
import {
  IconBox,
  IconCart,
  IconTrendUp,
  IconPlus,
  IconSearch,
  IconCopy,
  IconEdit,
  IconLink,
} from "../icons";

type Product = {
  nome: string;
  preco: string;
  tipo: string;
  vendas: number;
  status: "ativo" | "pausado";
};

const products: Product[] = [
  {
    nome: "Produto Teste",
    preco: "R$ 1.200,00",
    tipo: "Checkout Completo",
    vendas: 0,
    status: "ativo",
  },
];

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Produtos & Checkouts"
          subtitle="Crie produtos, gere checkouts e venda com PIX em segundos."
        />
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-5 py-2.5 text-sm font-semibold text-white shadow-red-soft transition hover:brightness-110">
          <IconPlus className="h-4 w-4" />
          Criar novo produto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<IconBox className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Produtos ativos"
          value="1"
          highlight
        />
        <MiniStat
          icon={<IconCart className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Vendas totais"
          value="0"
        />
        <MiniStat
          icon={<IconTrendUp className="h-4 w-4" />}
          iconClass="bg-emerald-500/10 text-emerald-400"
          label="Receita por produtos"
          value="R$ 0,00"
        />
      </div>

      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar produto..."
              className="w-full rounded-xl border border-zen-border bg-zen-bg py-2 pl-10 pr-4 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>
          <FakeSelect label="Todos os status" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.nome}
              className="group rounded-2xl border border-zen-border bg-zen-bg p-4 transition hover:border-zen-red/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-zen-red/25 to-zen-blood/25 text-zen-red-bright">
                  <IconBox className="h-5 w-5" />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    p.status === "ativo"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-500/10 text-zinc-400"
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <h3 className="mt-3 text-[15px] font-bold">{p.nome}</h3>
              <p className="text-[12px] text-zen-muted">{p.tipo}</p>

              <div className="mt-3 flex items-end justify-between">
                <p className="text-xl font-extrabold text-zen-red-bright">{p.preco}</p>
                <p className="text-[12px] text-zen-muted">{p.vendas} vendas</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-1.5 rounded-lg border border-zen-border bg-zen-card py-2 text-[11.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
                  <IconCopy className="h-3.5 w-3.5" />
                  Copiar
                </button>
                <button className="flex items-center justify-center gap-1.5 rounded-lg border border-zen-border bg-zen-card py-2 text-[11.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
                  <IconLink className="h-3.5 w-3.5" />
                  Checkout
                </button>
                <button className="flex items-center justify-center gap-1.5 rounded-lg border border-zen-border bg-zen-card py-2 text-[11.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
                  <IconEdit className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>
            </div>
          ))}

          {/* Card de criar */}
          <button className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zen-border text-zen-muted transition hover:border-zen-red/50 hover:text-zen-red-bright">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current">
              <IconPlus className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-semibold">Criar novo produto</span>
          </button>
        </div>
      </section>
    </div>
  );
}
