"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import LoginModal from "./LoginModal";
import BalanceCard from "./BalanceCard";
import StatCard from "./StatCard";
import PeriodFilter from "./PeriodFilter";
import RevenueChart from "./RevenueChart";
import StatusDonut from "./StatusDonut";
import TransactionsTable from "./TransactionsTable";
import AnalyticsPage from "./pages/AnalyticsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ClientsPage from "./pages/ClientsPage";
import ProductsPage from "./pages/ProductsPage";
import ThemesPage from "./pages/ThemesPage";
import PaymentLinksPage from "./pages/PaymentLinksPage";
import ProductModal from "./ProductModal";
import { Product, loadProducts, saveProducts } from "@/lib/products";
import { isAdminEmail } from "@/lib/adminEmails";
import { ReceivingPage, NotificationsPage } from "./pages/SettingsPages";
import TrackingPage from "./pages/TrackingPage";
import ApiWebhooksPage from "./pages/ApiWebhooksPage";
import PlansPage from "./pages/PlansPage";
import LockedPage from "./pages/LockedPage";
import {
  IconTrendUp,
  IconClock,
  IconPercent,
  IconReceipt,
  IconBox,
} from "./icons";

const STORAGE_KEY = "zenpay_user";

/** Recursos ainda não disponíveis — aparecem com cadeado no menu. */
const LOCKED = ["Saque em Cripto"];

export default function Dashboard() {
  const [user, setUser] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [productModal, setProductModal] = useState(false);

  function handleCreateProduct(p: Product) {
    saveProducts([p, ...loadProducts()]);
    window.dispatchEvent(new Event("zenpay:products"));
    setProductModal(false);
    setActive("Produtos & Checkouts");
  }

  // dbAuth = autenticação real (Neon) ligada. Sem ela, usa localStorage.
  const [dbAuth, setDbAuth] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { configured: boolean; user: { email: string } | null }) => {
        if (cancel) return;
        if (s.configured) {
          setDbAuth(true);
          setUser(s.user ? s.user.email : null);
        } else {
          setDbAuth(false);
          setUser(localStorage.getItem(STORAGE_KEY));
        }
        setReady(true);
      })
      .catch(() => {
        if (cancel) return;
        setDbAuth(false);
        setUser(localStorage.getItem(STORAGE_KEY));
        setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  function handleLogin(identity: string) {
    // Com banco, a sessão já foi criada pela API (cookie). Sem banco, guarda local.
    if (!dbAuth) localStorage.setItem(STORAGE_KEY, identity);
    setUser(identity);
  }

  async function handleLogout() {
    if (dbAuth) {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(null);
  }

  const locked = ready && !user;

  return (
    <div className="min-h-screen bg-zen-bg">
      <Sidebar
        active={active}
        onNavigate={setActive}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCreateProduct={() => setProductModal(true)}
        isAdmin={isAdminEmail(user)}
      />

      <div className="lg:pl-[248px]">
        <Topbar
          userName={user}
          onLogout={handleLogout}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main
          className={`mx-auto max-w-[1200px] space-y-6 px-4 py-6 lg:px-8 ${
            locked ? "pointer-events-none select-none blur-[2px]" : ""
          }`}
          aria-hidden={locked}
        >
          {active === "Análises" ? (
            <AnalyticsPage />
          ) : active === "Transações" ? (
            <TransactionsPage />
          ) : active === "Clientes" ? (
            <ClientsPage />
          ) : active === "Produtos & Checkouts" ? (
            <ProductsPage onCreateClick={() => setProductModal(true)} />
          ) : active === "Links de Pagamento" ? (
            <PaymentLinksPage />
          ) : active === "Recebimento" ? (
            <ReceivingPage />
          ) : active === "Notificações" ? (
            <NotificationsPage />
          ) : active === "Trackeamento" ? (
            <TrackingPage />
          ) : active === "API & Webhooks" ? (
            <ApiWebhooksPage />
          ) : active === "Planos" ? (
            <PlansPage />
          ) : LOCKED.includes(active) ? (
            <LockedPage titulo={active} />
          ) : active === "Temas" ? (
            <ThemesPage />
          ) : active === "Dashboard" ? (
            <>
              <BalanceCard onQuickPay={() => setActive("Links de Pagamento")} />

              {/* Stat cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={<IconTrendUp className="h-4.5 w-4.5" />}
                  iconClass="bg-emerald-500/10 text-emerald-400"
                  label="Vendas no período"
                  value="R$ 0,00"
                  sub="Hoje · 0 vendas aprovadas"
                  trend="0%"
                  underline
                />
                <StatCard
                  icon={<IconClock className="h-4.5 w-4.5" />}
                  iconClass="bg-amber-500/10 text-amber-400"
                  label="Vendas pendentes"
                  value="R$ 120,00"
                  sub="2 aguardando PIX"
                />
                <StatCard
                  icon={<IconPercent className="h-4.5 w-4.5" />}
                  iconClass="bg-zen-red/10 text-zen-red-bright"
                  label="Taxa de conversão"
                  value="0.0%"
                  sub="0 de 2 PIX"
                />
                <StatCard
                  icon={<IconReceipt className="h-4.5 w-4.5" />}
                  iconClass="bg-zinc-500/10 text-zinc-300"
                  label="Ticket médio"
                  value="R$ 0,00"
                  sub="Média por venda paga"
                  underline
                />
              </div>

              <PeriodFilter />

              {/* Gráficos */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_1fr]">
                <RevenueChart />
                <StatusDonut />
              </div>

              <TransactionsTable />
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zen-border bg-zen-card/50 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zen-red/10 text-zen-red-bright">
                <IconBox className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{active}</h2>
                <p className="mt-1 max-w-sm text-[13px] text-zen-muted">
                  Esta área está em construção. Em breve você poderá gerenciar{" "}
                  <span className="font-semibold text-zinc-300">{active}</span> por aqui.
                </p>
              </div>
              <button
                onClick={() => setActive("Dashboard")}
                className="rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-5 py-2 text-sm font-semibold text-white shadow-red-soft transition hover:brightness-110"
              >
                Voltar ao Dashboard
              </button>
            </div>
          )}
        </main>
      </div>

      {productModal && !locked && (
        <ProductModal onClose={() => setProductModal(false)} onCreate={handleCreateProduct} />
      )}

      {locked && <LoginModal onLogin={handleLogin} useApi={dbAuth} />}
    </div>
  );
}
