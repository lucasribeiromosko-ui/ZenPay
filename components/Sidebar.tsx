"use client";

import {
  IconDashboard,
  IconChart,
  IconCard,
  IconUsers,
  IconBot,
  IconSparkles,
  IconBox,
  IconPalette,
  IconGlobe,
  IconApi,
  IconWallet,
  IconBitcoin,
  IconBell,
  IconGift,
  IconPlus,
  IconLink,
  IconClose,
  IconZen,
} from "./icons";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  badge?: { text: string; variant: "soon" | "new" };
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Menu",
    items: [
      { label: "Dashboard", icon: <IconDashboard /> },
      { label: "Análises", icon: <IconChart /> },
      { label: "Transações", icon: <IconCard /> },
      { label: "Clientes", icon: <IconUsers /> },
    ],
  },
  {
    title: "Automações",
    items: [
      { label: "Bot Telegram", icon: <IconBot /> },
      { label: "Agent IA", icon: <IconSparkles />, badge: { text: "EM BREVE", variant: "soon" } },
      { label: "Produtos & Checkouts", icon: <IconBox /> },
      { label: "Links de Pagamento", icon: <IconLink /> },
      { label: "Temas", icon: <IconPalette />, badge: { text: "NOVO", variant: "new" } },
    ],
  },
  {
    title: "Integrações",
    items: [
      { label: "Trackeamento", icon: <IconGlobe /> },
      { label: "API & Webhooks", icon: <IconApi /> },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Recebimento", icon: <IconWallet /> },
      { label: "Saque em Cripto", icon: <IconBitcoin /> },
      { label: "Notificações", icon: <IconBell /> },
    ],
  },
];

type SidebarProps = {
  active: string;
  onNavigate: (label: string) => void;
  open: boolean;
  onClose: () => void;
  onCreateProduct: () => void;
};

export default function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  onCreateProduct,
}: SidebarProps) {
  function go(label: string) {
    onNavigate(label);
    onClose();
  }

  return (
    <>
      {/* Backdrop no mobile */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-zen-border bg-zen-surface transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pb-2 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zen-red to-zen-blood text-white shadow-red-soft">
          <IconZen className="h-5 w-5" />
        </div>
        <span className="text-lg font-extrabold tracking-wide">
          ZEN<span className="text-zen-red-bright">PAY</span>
        </span>
        <button
          onClick={onClose}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      {/* CTA */}
      <div className="px-4 pb-2 pt-3">
        <button
          onClick={() => {
            onClose();
            onCreateProduct();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-4 py-2.5 text-sm font-semibold text-white shadow-red-soft transition hover:brightness-110"
        >
          <IconPlus className="h-4 w-4" />
          Criar novo produto
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-3">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-zen-muted">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = active === item.label;
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => go(item.label)}
                      className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition ${
                        isActive
                          ? "bg-zen-red/15 text-zen-red-bright"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                      }`}
                    >
                      <span className={isActive ? "text-zen-red-bright" : "text-zinc-500 group-hover:text-zinc-300"}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${
                            item.badge.variant === "new"
                              ? "bg-zen-red text-white"
                              : "bg-zinc-700/80 text-zinc-300"
                          }`}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Indicações + faturamento */}
      <div className="space-y-3 border-t border-zen-border px-4 py-4">
        <button
          onClick={() => go("Indicações")}
          className="flex w-full items-center gap-2.5 rounded-xl border border-zen-red/30 bg-zen-red/10 px-3 py-2.5 text-sm font-semibold text-zen-red-bright transition hover:bg-zen-red/20"
        >
          <IconGift className="h-4 w-4" />
          Indicações
          <span className="ml-auto rounded-full bg-zen-red px-2 py-0.5 text-[9px] font-bold text-white">
            GANHE $
          </span>
        </button>

        <div className="flex items-center gap-3 rounded-xl bg-zen-card px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <span className="text-sm font-bold">$</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zen-muted">
              Faturamento
            </p>
            <p className="text-sm font-bold">R$ 0,00</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-zen-muted">0% · N1</p>
            <p className="text-[10px] text-zen-muted">/ R$ 10k</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
