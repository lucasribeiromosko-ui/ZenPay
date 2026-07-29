"use client";

import { useEffect, useMemo, useState } from "react";
import { Account, AccountStatus, loadAccounts, saveAccounts } from "@/lib/adminData";
import { brlFromCents } from "@/lib/products";
import {
  IconShieldAlt,
  IconLogout,
  IconUsers,
  IconWallet,
  IconTrendUp,
  IconSearch,
  IconEye,
  IconLock,
  IconUnlock,
  IconSnow,
  IconBan,
  IconClose,
  IconCheck,
} from "../icons";

const statusBadge: Record<AccountStatus, string> = {
  ativo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  travado: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  banido: "bg-zen-red/10 text-zen-red-bright border-zen-red/30",
};

const statusLabel: Record<AccountStatus, string> = {
  ativo: "Ativo",
  travado: "Travado",
  banido: "Banido",
};

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | AccountStatus>("todos");
  const [detalhe, setDetalhe] = useState<Account | null>(null);

  async function refetch() {
    try {
      const res = await fetch("/api/admin/accounts", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (d.configured) {
        setConfigured(true);
        setAccounts(d.accounts as Account[]);
        setDetalhe((prev) =>
          prev ? (d.accounts as Account[]).find((a) => a.email === prev.email) ?? null : null
        );
        return;
      }
    } catch {
      // cai no modo demo
    }
    setConfigured(false);
    setAccounts(loadAccounts());
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modo demo (localStorage) — só quando não há banco.
  function mutateLocal(id: string, fn: (a: Account) => Account) {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? fn(a) : a));
      saveAccounts(next);
      setDetalhe((d) => (d && d.id === id ? next.find((a) => a.id === id) ?? null : d));
      return next;
    });
  }

  async function applyAction(a: Account, action: string, localFn: (x: Account) => Account) {
    if (configured) {
      await fetch("/api/admin/account-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: a.email, action }),
      }).catch(() => {});
      await refetch();
    } else {
      mutateLocal(a.id, localFn);
    }
  }

  const toggleTravaConta = (a: Account) =>
    applyAction(a, a.status === "travado" ? "unlock" : "lock", (x) => ({
      ...x,
      status: x.status === "travado" ? "ativo" : "travado",
    }));

  const toggleTravaSaldo = (a: Account) =>
    applyAction(a, a.saldoTravado ? "unfreeze" : "freeze", (x) => ({
      ...x,
      saldoTravado: !x.saldoTravado,
    }));

  const toggleBanir = (a: Account) =>
    applyAction(a, a.status === "banido" ? "unban" : "ban", (x) =>
      x.status === "banido"
        ? { ...x, status: "ativo", saldoTravado: false }
        : { ...x, status: "banido", saldoTravado: true }
    );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return accounts.filter((a) => {
      const okFiltro = filtro === "todos" || a.status === filtro;
      const okBusca =
        !q ||
        a.nome.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.documento.toLowerCase().includes(q);
      return okFiltro && okBusca;
    });
  }, [accounts, busca, filtro]);

  const totais = useMemo(() => {
    const ativas = accounts.filter((a) => a.status === "ativo").length;
    const volume = accounts.reduce((s, a) => s + a.volumeTotal, 0);
    const saldo = accounts.reduce((s, a) => s + a.saldoDisponivel + a.saldoALiberar, 0);
    return { total: accounts.length, ativas, volume, saldo };
  }, [accounts]);

  return (
    <div className="min-h-screen bg-zen-bg">
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zen-border bg-zen-bg/80 px-4 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zen-red to-zen-blood text-white">
            <IconShieldAlt className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold tracking-wide">
            ZEN<span className="text-zen-red-bright">PAY</span>
            <span className="ml-1.5 rounded bg-zen-red/15 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-zen-red-bright">
              ADMIN
            </span>
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-full border border-zen-border bg-zen-card px-4 py-1.5 text-[13px] font-semibold text-zinc-300 transition hover:border-zen-red/50 hover:text-white"
        >
          <IconLogout className="h-4 w-4" />
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8">
        {/* Aviso de dados de demonstração — só sem banco */}
        {configured === false && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-[12.5px] leading-relaxed text-amber-200/90">
            As contas abaixo são de <span className="font-bold">demonstração</span> enquanto o banco de
            dados não está ligado. As ações funcionam sobre esses dados e passarão a agir sobre as
            contas reais quando o back-end for conectado.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminStat icon={<IconUsers className="h-4 w-4" />} cls="bg-zen-red/15 text-zen-red-bright" label="Contas" value={String(totais.total)} />
          <AdminStat icon={<IconCheck className="h-4 w-4" />} cls="bg-emerald-500/10 text-emerald-400" label="Ativas" value={String(totais.ativas)} />
          <AdminStat icon={<IconTrendUp className="h-4 w-4" />} cls="bg-white/5 text-zinc-300" label="Volume processado" value={brlFromCents(totais.volume)} />
          <AdminStat icon={<IconWallet className="h-4 w-4" />} cls="bg-white/5 text-zinc-300" label="Saldo na plataforma" value={brlFromCents(totais.saldo)} />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou documento..."
              className="w-full rounded-xl border border-zen-border bg-zen-card py-2 pl-10 pr-4 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-zen-border bg-zen-card p-1">
            {(["todos", "ativo", "travado", "banido"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold capitalize transition ${
                  filtro === f ? "bg-zen-red text-white shadow-red-soft" : "text-zen-muted hover:text-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <section className="overflow-hidden rounded-2xl border border-zen-border bg-zen-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-zen-border text-[11px] uppercase tracking-wider text-zen-muted">
                  <th className="px-5 py-3 font-bold">Conta</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Saldo disponível</th>
                  <th className="px-3 py-3 font-bold">Volume</th>
                  <th className="px-3 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((a) => (
                  <tr key={a.id} className="border-b border-zen-border/60 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-100">{a.nome}</p>
                      <p className="text-[11.5px] text-zen-muted">{a.email}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase ${statusBadge[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                      {a.saldoTravado && a.status !== "banido" && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-400">
                          <IconSnow className="h-2.5 w-2.5" /> saldo
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 font-bold">{brlFromCents(a.saldoDisponivel)}</td>
                    <td className="px-3 py-3.5 text-zinc-300">{brlFromCents(a.volumeTotal)}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Ver tudo" onClick={() => setDetalhe(a)}>
                          <IconEye className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          title={a.status === "travado" ? "Destravar conta" : "Travar conta"}
                          disabled={a.status === "banido"}
                          active={a.status === "travado"}
                          onClick={() => toggleTravaConta(a)}
                        >
                          {a.status === "travado" ? <IconUnlock className="h-4 w-4" /> : <IconLock className="h-4 w-4" />}
                        </IconBtn>
                        <IconBtn
                          title={a.saldoTravado ? "Liberar saldo" : "Travar saldo"}
                          disabled={a.status === "banido"}
                          active={a.saldoTravado}
                          onClick={() => toggleTravaSaldo(a)}
                        >
                          <IconSnow className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          title={a.status === "banido" ? "Desbanir" : "Banir conta"}
                          danger
                          active={a.status === "banido"}
                          onClick={() => toggleBanir(a)}
                        >
                          <IconBan className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtradas.length === 0 && (
            <p className="py-10 text-center text-[13px] text-zen-muted">
              {configured && accounts.length === 0
                ? "Nenhuma conta criada ainda. Quando um vendedor se cadastrar, aparece aqui."
                : "Nenhuma conta encontrada."}
            </p>
          )}
        </section>
      </main>

      {detalhe && (
        <AccountDetail
          account={detalhe}
          onClose={() => setDetalhe(null)}
          onTravaConta={() => toggleTravaConta(detalhe)}
          onTravaSaldo={() => toggleTravaSaldo(detalhe)}
          onBanir={() => toggleBanir(detalhe)}
        />
      )}
    </div>
  );
}

function AdminStat({ icon, cls, label, value }: { icon: React.ReactNode; cls: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zen-border bg-zen-card p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cls}`}>{icon}</span>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-zen-muted">{label}</p>
      </div>
      <p className="mt-2.5 text-[22px] font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
  active,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? danger
            ? "border-zen-red/50 bg-zen-red/15 text-zen-red-bright"
            : "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : danger
            ? "border-zen-border bg-zen-bg text-zinc-400 hover:border-zen-red/50 hover:text-zen-red-bright"
            : "border-zen-border bg-zen-bg text-zinc-400 hover:border-zen-red/40 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ResetSenha({ email }: { email: string }) {
  const [nova, setNova] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    if (nova.length < 6) {
      setMsg({ ok: false, texto: "Mínimo de 6 caracteres." });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: nova }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg({ ok: Boolean(data.ok), texto: data.ok ? "Senha redefinida." : data.message ?? "Falhou." });
      if (data.ok) setNova("");
    } catch {
      setMsg({ ok: false, texto: "Falha de conexão." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-zen-border bg-zen-bg p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">
        Redefinir senha do vendedor
      </p>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          placeholder="nova senha (6+)"
          className="flex-1 rounded-lg border border-zen-border bg-zen-card px-3 py-2 text-[12.5px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60"
        />
        <button
          onClick={enviar}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-zen-red to-zen-red-dark px-4 text-[12.5px] font-bold text-white shadow-red-soft transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "…" : "Redefinir"}
        </button>
      </div>
      {msg && (
        <p className={`mt-2 text-[11.5px] font-medium ${msg.ok ? "text-emerald-400" : "text-zen-red-bright"}`}>
          {msg.texto}
        </p>
      )}
    </div>
  );
}

function AccountDetail({
  account,
  onClose,
  onTravaConta,
  onTravaSaldo,
  onBanir,
}: {
  account: Account;
  onClose: () => void;
  onTravaConta: () => void;
  onTravaSaldo: () => void;
  onBanir: () => void;
}) {
  const info: [string, string][] = [
    ["Documento", account.documento],
    ["Telefone", account.telefone],
    ["Chave PIX", account.chavePix],
    ["Criada em", account.criadoEm],
    ["Último acesso", account.ultimoAcesso],
    ["Vendas", String(account.vendas)],
    ["Chargebacks", String(account.chargebacks)],
    ["ID", account.id],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-zen-border bg-zen-card shadow-red-glow animate-pop-in">
        <div className="flex items-center gap-3 border-b border-zen-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zen-red/25 to-zen-blood/25 text-zen-red-bright">
            <IconUsers className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold">{account.nome}</h2>
            <p className="truncate text-[12px] text-zen-muted">{account.email}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase ${statusBadge[account.status]}`}>
            {statusLabel[account.status]}
          </span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white">
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Saldos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zen-border bg-zen-bg p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">Disponível</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-400">{brlFromCents(account.saldoDisponivel)}</p>
              {account.saldoTravado && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400">
                  <IconSnow className="h-3 w-3" /> saldo travado
                </p>
              )}
            </div>
            <div className="rounded-xl border border-zen-border bg-zen-bg p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zen-muted">A liberar</p>
              <p className="mt-1 text-xl font-extrabold">{brlFromCents(account.saldoALiberar)}</p>
              <p className="mt-1 text-[11px] text-zen-muted">Volume: {brlFromCents(account.volumeTotal)}</p>
            </div>
          </div>

          {/* Infos */}
          <div className="mt-4 rounded-xl border border-zen-border bg-zen-bg px-4">
            {info.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-zen-border py-2.5 last:border-0">
                <span className="text-[12.5px] text-zen-muted">{k}</span>
                <span className="text-right text-[13px] font-semibold">{v}</span>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={onTravaConta}
              disabled={account.status === "banido"}
              className="flex items-center justify-center gap-2 rounded-xl border border-zen-border bg-zen-bg py-2.5 text-[12.5px] font-semibold text-zinc-200 transition hover:border-amber-500/40 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {account.status === "travado" ? <IconUnlock className="h-4 w-4" /> : <IconLock className="h-4 w-4" />}
              {account.status === "travado" ? "Destravar conta" : "Travar conta"}
            </button>
            <button
              onClick={onTravaSaldo}
              disabled={account.status === "banido"}
              className="flex items-center justify-center gap-2 rounded-xl border border-zen-border bg-zen-bg py-2.5 text-[12.5px] font-semibold text-zinc-200 transition hover:border-sky-500/40 hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconSnow className="h-4 w-4" />
              {account.saldoTravado ? "Liberar saldo" : "Travar saldo"}
            </button>
            <button
              onClick={onBanir}
              className="flex items-center justify-center gap-2 rounded-xl border border-zen-red/40 bg-zen-red/10 py-2.5 text-[12.5px] font-semibold text-zen-red-bright transition hover:bg-zen-red/20"
            >
              <IconBan className="h-4 w-4" />
              {account.status === "banido" ? "Desbanir" : "Banir conta"}
            </button>
          </div>

          <ResetSenha email={account.email} />
        </div>
      </div>
    </div>
  );
}
