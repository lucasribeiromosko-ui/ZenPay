"use client";

import { useState } from "react";
import { IconHeadset, IconGlobe, IconUser, IconLogout, IconZen, IconMenu } from "./icons";

type TopbarProps = {
  userName: string | null;
  onLogout: () => void;
  onOpenMenu: () => void;
};

export default function Topbar({ userName, onLogout, onOpenMenu }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zen-border bg-zen-bg/80 px-4 backdrop-blur-md lg:px-8">
      {/* Menu + logo no mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={onOpenMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zen-border bg-zen-card text-zinc-300 transition hover:border-zen-red/50 hover:text-white"
          aria-label="Abrir menu"
        >
          <IconMenu className="h-4.5 w-4.5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zen-red to-zen-blood text-white">
          <IconZen className="h-4 w-4" />
        </div>
        <span className="font-extrabold tracking-wide">
          ZEN<span className="text-zen-red-bright">PAY</span>
        </span>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button className="hidden items-center gap-2 rounded-full border border-zen-red/40 bg-zen-red/10 px-4 py-1.5 text-[13px] font-semibold text-zen-red-bright transition hover:bg-zen-red/20 sm:flex">
          <IconHeadset className="h-4 w-4" />
          Falar com Gerente
        </button>
        <button className="hidden items-center gap-2 rounded-full border border-zinc-600/60 bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-zinc-300 transition hover:bg-white/10 sm:flex">
          <IconGlobe className="h-4 w-4" />
          Grupo Networking
        </button>

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zen-border bg-zen-card text-zinc-300 transition hover:border-zen-red/50 hover:text-white"
          >
            <IconUser className="h-4.5 w-4.5" />
          </button>

          {menuOpen && userName && (
            <div className="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-zen-border bg-zen-card shadow-xl animate-pop-in">
              <div className="border-b border-zen-border px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-zen-muted">Logado como</p>
                <p className="truncate text-sm font-semibold">{userName}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-zen-red-bright transition hover:bg-zen-red/10"
              >
                <IconLogout className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
