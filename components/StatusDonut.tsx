"use client";

import { IconClock } from "./icons";

const data = [
  { label: "Aprovadas", value: 0, color: "#22c55e" },
  { label: "Pendentes", value: 2, color: "#ef4444" },
];

const R = 70;
const STROKE = 22;
const C = 2 * Math.PI * R;

export default function StatusDonut() {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  let offset = 0;

  return (
    <section className="flex flex-col rounded-2xl border border-zen-border bg-zen-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <span className="text-zen-red-bright">
          <IconClock className="h-4.5 w-4.5" />
        </span>
        Status dos pedidos
      </h2>

      <div className="flex flex-1 items-center justify-center py-6">
        <div className="relative">
          <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Status dos pedidos">
            <circle
              cx="95"
              cy="95"
              r={R}
              fill="none"
              stroke="#242428"
              strokeWidth={STROKE}
            />
            {total > 0 &&
              data
                .filter((d) => d.value > 0)
                .map((d) => {
                  const frac = d.value / total;
                  const dash = frac * C;
                  const el = (
                    <circle
                      key={d.label}
                      cx="95"
                      cy="95"
                      r={R}
                      fill="none"
                      stroke={d.color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                      transform="rotate(-90 95 95)"
                    />
                  );
                  offset += dash;
                  return el;
                })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-extrabold">{total}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zen-muted">
              Total
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-zen-border pt-4">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-zinc-300">{d.label}</span>
            <span className="ml-auto font-bold">{d.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
