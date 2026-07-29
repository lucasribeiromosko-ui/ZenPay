"use client";

import { useState } from "react";
import { IconMail, IconLock, IconEye, IconEyeOff } from "../icons";
import { LogoMark } from "../Logo";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        onSuccess();
      } else {
        setErro(data.message ?? "Não foi possível entrar.");
      }
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zen-bg p-4">
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-zen-border bg-zen-card p-7 shadow-red-glow">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-zen-red/25 blur-3xl" />
        <div className="relative">
          <div className="mb-5 flex flex-col items-center gap-3">
            <LogoMark className="h-14 w-14 rounded-2xl object-cover shadow-red-soft" />
            <div className="text-center">
              <h1 className="text-xl font-extrabold tracking-wide">
                ZEN<span className="text-zen-red-bright">PAY</span>{" "}
                <span className="align-middle text-[11px] font-bold tracking-widest text-zen-muted">
                  ADMIN
                </span>
              </h1>
              <p className="mt-1 text-[13px] text-zen-muted">Acesso restrito à operação</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <IconMail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="e-mail de admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zen-border bg-zen-bg py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
              />
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <IconLock className="h-4 w-4" />
              </span>
              <input
                type={show ? "text" : "password"}
                placeholder="senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zen-border bg-zen-bg py-2.5 pl-10 pr-11 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300"
              >
                {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>

            {erro && (
              <p className="rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-2.5 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar no painel admin"}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-600">
            Acesso monitorado · somente pessoal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
