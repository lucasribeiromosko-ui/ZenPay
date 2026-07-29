"use client";

import { useState } from "react";
import { IconMail, IconLock, IconEye, IconEyeOff } from "./icons";
import { LogoFull } from "./Logo";

type LoginModalProps = {
  onLogin: (email: string) => void;
  /** Quando true, autentica de verdade pela API (banco). */
  useApi?: boolean;
};

export default function LoginModal({ onLogin, useApi }: LoginModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    const minSenha = useApi ? 6 : 4;
    if (password.length < minSenha) {
      setError(`A senha precisa ter pelo menos ${minSenha} caracteres.`);
      return;
    }
    if (tab === "register" && !name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    setError(null);

    // Sem banco: comportamento antigo (visual).
    if (!useApi) {
      onLogin(tab === "register" ? name.trim() : email.trim());
      return;
    }

    // Com banco: autenticação real.
    setLoading(true);
    try {
      const url = tab === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          nome: name.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        onLogin(data.user?.email ?? email.trim());
      } else {
        setError(data.message ?? "Não foi possível entrar.");
      }
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop bloqueando o painel */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />

      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-zen-border bg-zen-card shadow-red-glow animate-pop-in">
        {/* Glow superior */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-zen-red/25 blur-3xl" />

        <div className="relative px-7 pb-7 pt-8">
          {/* Logo */}
          <div className="mb-5 flex flex-col items-center gap-3">
            <LogoFull className="h-16 w-auto rounded-xl object-contain shadow-red-soft" />
            <p className="text-center text-[13px] text-zen-muted">
              {tab === "login"
                ? "Faça login para acessar seu painel"
                : "Crie sua conta e comece a vender"}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-zen-bg p-1">
            <button
              type="button"
              onClick={() => { setTab("login"); setError(null); }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                tab === "login"
                  ? "bg-zen-red text-white shadow-red-soft"
                  : "text-zen-muted hover:text-zinc-200"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setTab("register"); setError(null); }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                tab === "register"
                  ? "bg-zen-red text-white shadow-red-soft"
                  : "text-zen-muted hover:text-zinc-200"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "register" && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                />
              </div>
            )}

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <IconMail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="seu@email.com"
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
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zen-border bg-zen-bg py-2.5 pl-10 pr-11 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300"
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-zen-red/30 bg-zen-red/10 px-3 py-2 text-[12.5px] font-medium text-zen-red-bright">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark py-2.5 text-sm font-bold text-white shadow-red-soft transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Aguarde…" : tab === "login" ? "Entrar no painel" : "Criar minha conta"}
            </button>
          </form>

          {tab === "login" && (
            <button
              type="button"
              className="mt-4 w-full text-center text-[12.5px] font-medium text-zen-muted transition hover:text-zinc-300"
            >
              Esqueci minha senha
            </button>
          )}

          <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-600">
            Ambiente protegido · ZenPay © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
