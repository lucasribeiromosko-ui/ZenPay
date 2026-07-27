"use client";

import { useEffect, useState } from "react";
import { PageHeader, MiniStat, FakeSelect } from "./shared";
import {
  Product,
  brlFromCents,
  loadProducts,
  saveProducts,
  checkoutPath,
} from "@/lib/products";
import {
  IconBox,
  IconCart,
  IconTrendUp,
  IconPlus,
  IconSearch,
  IconCopy,
  IconCheck,
  IconTrash,
  IconExternal,
  IconPix,
  IconCard,
} from "../icons";

export default function ProductsPage({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [busca, setBusca] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(loadProducts());
    function sync() {
      setProducts(loadProducts());
    }
    window.addEventListener("zenpay:products", sync);
    return () => window.removeEventListener("zenpay:products", sync);
  }, []);

  function update(next: Product[]) {
    setProducts(next);
    saveProducts(next);
  }

  async function copy(p: Product) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${checkoutPath(p)}`);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard bloqueado
    }
  }

  const filtrados = products.filter((p) =>
    p.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  const ativos = products.filter((p) => p.ativo).length;
  const vendas = products.reduce((acc, p) => acc + p.vendas, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Produtos & Checkouts"
          subtitle="Crie produtos, gere checkouts e venda com PIX ou cartão em segundos."
        />
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-5 py-2.5 text-sm font-semibold text-white shadow-red-soft transition hover:brightness-110"
        >
          <IconPlus className="h-4 w-4" />
          Criar novo produto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<IconBox className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Produtos ativos"
          value={String(ativos)}
          highlight
        />
        <MiniStat
          icon={<IconCart className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Vendas totais"
          value={String(vendas)}
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
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full rounded-xl border border-zen-border bg-zen-bg py-2 pl-10 pr-4 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>
          <FakeSelect label="Todos os status" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-zen-border bg-zen-bg p-4 transition hover:border-zen-red/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-zen-red/25 to-zen-blood/25 text-zen-red-bright">
                  <IconBox className="h-5 w-5" />
                </div>
                <button
                  onClick={() =>
                    update(
                      products.map((x) => (x.id === p.id ? { ...x, ativo: !x.ativo } : x))
                    )
                  }
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                    p.ativo
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                  }`}
                >
                  {p.ativo ? "ativo" : "pausado"}
                </button>
              </div>

              <h3 className="mt-3 truncate text-[15px] font-bold">{p.nome}</h3>
              <p className="text-[12px] text-zen-muted">
                Checkout {p.modo === "rapido" ? "Rápido" : "Completo"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {p.pix && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <IconPix className="h-2.5 w-2.5" /> PIX
                  </span>
                )}
                {p.credito && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zen-red/30 bg-zen-red/5 px-1.5 py-0.5 text-[10px] font-bold text-zen-red-bright">
                    <IconCard className="h-2.5 w-2.5" /> {p.parcelas}x
                  </span>
                )}
                {p.debito && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-500/30 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                    <IconCard className="h-2.5 w-2.5" /> Débito
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-end justify-between">
                <p className="text-xl font-extrabold text-zen-red-bright">
                  {brlFromCents(p.valor)}
                </p>
                <p className="text-[12px] text-zen-muted">{p.vendas} vendas</p>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                <button
                  onClick={() => copy(p)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[11.5px] font-semibold transition ${
                    copiedId === p.id
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-zen-border bg-zen-card text-zinc-300 hover:border-zen-red/40 hover:text-white"
                  }`}
                >
                  {copiedId === p.id ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" /> Copiar
                    </>
                  )}
                </button>
                <a
                  href={checkoutPath(p)}
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zen-border bg-zen-card py-2 text-[11.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white"
                >
                  <IconExternal className="h-3.5 w-3.5" /> Abrir
                </a>
                <button
                  onClick={() => update(products.filter((x) => x.id !== p.id))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zen-border bg-zen-card text-zinc-500 transition hover:border-zen-red/50 hover:text-zen-red-bright"
                  title="Excluir produto"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={onCreateClick}
            className="flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zen-border text-zen-muted transition hover:border-zen-red/50 hover:text-zen-red-bright"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current">
              <IconPlus className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-semibold">Criar novo produto</span>
          </button>
        </div>

        {products.length > 0 && filtrados.length === 0 && (
          <p className="py-8 text-center text-[13px] text-zen-muted">
            Nenhum produto encontrado para “{busca}”.
          </p>
        )}
      </section>
    </div>
  );
}
