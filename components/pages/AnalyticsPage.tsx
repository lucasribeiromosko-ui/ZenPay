"use client";

import { PageHeader, MiniStat, FakeSelect } from "./shared";
import {
  IconCalendar,
  IconCart,
  IconClock,
  IconTarget,
  IconCard,
  IconActivity,
  IconTrendUp,
  IconChart,
} from "../icons";

// Últimos 30 dias — receita zerada, 2 tentativas hoje
const days = Array.from({ length: 30 }, (_, i) => i);
const revenue = days.map(() => 0);
const orders = days.map((_, i) => (i === 29 ? 2 : 0));

const W = 720;
const H = 200;
const PAD = 12;

function dayLabel(i: number): string {
  // Rótulos fixos de exemplo (30 dias terminando hoje)
  const labels = ["27/06", "01/07", "05/07", "09/07", "13/07", "17/07", "21/07", "25/07"];
  const idx = Math.round((i / 29) * (labels.length - 1));
  return labels[idx];
}

export default function AnalyticsPage() {
  const maxOrders = Math.max(...orders, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análises"
        subtitle="Painel completo de vendas, conversão, fontes de tráfego e desempenho dos seus produtos."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-zinc-300">
          <IconCalendar className="h-4 w-4 text-zen-muted" />
          Período de análise
        </h2>
        <FakeSelect label="Últimos 30 dias" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MiniStat
          icon={<span className="text-sm font-bold">$</span>}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Receita"
          value="R$ 0,00"
          highlight
        />
        <MiniStat
          icon={<IconCart className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Vendas pagas"
          value="0"
        />
        <MiniStat
          icon={<IconClock className="h-4 w-4" />}
          iconClass="bg-amber-500/10 text-amber-400"
          label="PIX aguardando"
          value="2"
        />
        <MiniStat
          icon={<IconTarget className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Conversão"
          value="0.0%"
        />
        <MiniStat
          icon={<IconCard className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Ticket médio"
          value="R$ 0,00"
        />
        <MiniStat
          icon={<IconActivity className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Total de tentativas"
          value="2"
        />
      </div>

      {/* Vendas & Receita */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zen-red/15 text-zen-red-bright">
            <IconTrendUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[16px] font-bold">Vendas & Receita</h2>
            <p className="text-[12px] text-zen-muted">Como sua receita evoluiu no período</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_1fr]">
          {/* Receita por dia */}
          <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[14px] font-bold">
                <IconTrendUp className="h-4 w-4 text-zen-red-bright" />
                Receita por dia
              </h3>
              <span className="text-[12px] text-zen-muted">30 dias</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <svg viewBox={`0 0 ${W} ${H + 24}`} className="min-w-[520px]" preserveAspectRatio="none">
                {[0.25, 0.5, 0.75, 1].map((f) => {
                  const y = H - PAD - f * (H - PAD * 2);
                  return (
                    <line
                      key={f}
                      x1={PAD}
                      x2={W - PAD}
                      y1={y}
                      y2={y}
                      stroke="#242428"
                      strokeDasharray="4 6"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* linha de receita (zerada) */}
                <line
                  x1={PAD}
                  x2={W - PAD}
                  y1={H - PAD}
                  y2={H - PAD}
                  stroke="#ef4444"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                  const x = PAD + (i * (W - PAD * 2)) / 7;
                  return (
                    <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="11" fill="#8b8b93">
                      {dayLabel(Math.round((i / 7) * 29))}
                    </text>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Status dos pedidos — vazio */}
          <section className="flex flex-col rounded-2xl border border-zen-border bg-zen-card p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-bold">
              <IconClock className="h-4 w-4 text-zen-red-bright" />
              Status dos pedidos
            </h3>
            <div className="flex flex-1 items-center justify-center py-10">
              <p className="text-[13px] text-zen-muted">Sem pedidos pagos no período.</p>
            </div>
          </section>
        </div>
      </div>

      {/* Pedidos por dia */}
      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-bold">
          <IconChart className="h-4 w-4 text-zen-red-bright" />
          Pedidos por dia
        </h3>
        <div className="mt-4 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H + 24}`} className="min-w-[520px]" preserveAspectRatio="none">
            {[0.25, 0.5, 0.75, 1].map((f) => {
              const y = H - PAD - f * (H - PAD * 2);
              const v = Math.round(f * maxOrders);
              return (
                <g key={f}>
                  <line
                    x1={PAD + 16}
                    x2={W - PAD}
                    y1={y}
                    y2={y}
                    stroke="#242428"
                    strokeDasharray="4 6"
                    strokeWidth="1"
                  />
                  <text x={PAD} y={y + 4} fontSize="10" fill="#8b8b93">
                    {v}
                  </text>
                </g>
              );
            })}
            {orders.map((v, i) => {
              const bw = (W - PAD * 2 - 16) / orders.length;
              const x = PAD + 16 + i * bw;
              const h = (v / maxOrders) * (H - PAD * 2);
              return (
                <rect
                  key={i}
                  x={x + bw * 0.15}
                  y={H - PAD - h}
                  width={bw * 0.7}
                  height={Math.max(h, v > 0 ? 4 : 0)}
                  rx="2"
                  fill="#ef4444"
                  opacity={v > 0 ? 1 : 0}
                />
              );
            })}
            <line x1={PAD + 16} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#2e2e33" strokeWidth="1" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const x = PAD + 16 + (i * (W - PAD * 2 - 16)) / 7;
              return (
                <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="11" fill="#8b8b93">
                  {dayLabel(Math.round((i / 7) * 29))}
                </text>
              );
            })}
          </svg>
        </div>
      </section>
    </div>
  );
}
