"use client";

// Gráfico de receita por hora (SVG puro, sem libs)
const hours = ["00h", "03h", "06h", "09h", "12h", "15h", "18h", "21h"];
const current = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const previous = [0, 0, 5, 0, 0, 10, 20, 35, 30, 45, 60, 40, 55, 70, 50, 65, 80, 60, 75, 55, 40, 30, 15, 5];

const W = 720;
const H = 220;
const PAD_X = 8;
const PAD_Y = 12;
const MAX = Math.max(...previous, ...current, 1);

function toPath(data: number[]): string {
  const stepX = (W - PAD_X * 2) / (data.length - 1);
  return data
    .map((v, i) => {
      const x = PAD_X + i * stepX;
      const y = H - PAD_Y - (v / MAX) * (H - PAD_Y * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function RevenueChart() {
  const currentPath = toPath(current);
  const previousPath = toPath(previous);

  return (
    <section className="rounded-2xl border border-zen-border bg-zen-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="text-zen-red-bright">📈</span> Receita por hora
          </h2>
          <p className="mt-0.5 text-[12px] text-zen-muted">
            Últimas 24h · aprovados{" "}
            <span className="mx-1 inline-block h-0.5 w-4 translate-y-[-2px] bg-zen-red-bright align-middle" />
            atual
            <span className="mx-1 ml-2 inline-block w-4 translate-y-[-2px] border-t border-dashed border-zinc-500 align-middle" />
            anterior
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zen-muted">
            Total hoje
          </p>
          <p className="text-lg font-extrabold text-zen-red-bright">R$ 0,00</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H + 24}`}
          className="min-w-[560px]"
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfico de receita por hora"
        >
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade */}
          {[0.25, 0.5, 0.75, 1].map((f) => {
            const y = H - PAD_Y - f * (H - PAD_Y * 2);
            return (
              <line
                key={f}
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y}
                y2={y}
                stroke="#242428"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
            );
          })}
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={H - PAD_Y}
            y2={H - PAD_Y}
            stroke="#2e2e33"
            strokeWidth="1"
          />

          {/* Série anterior (tracejada) */}
          <path
            d={previousPath}
            fill="none"
            stroke="#57575e"
            strokeWidth="1.6"
            strokeDasharray="5 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Série atual */}
          <path
            d={`${currentPath} L${W - PAD_X},${H - PAD_Y} L${PAD_X},${H - PAD_Y} Z`}
            fill="url(#areaFill)"
          />
          <path
            d={currentPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Eixo X */}
          {hours.map((h, i) => {
            const x = PAD_X + (i * (W - PAD_X * 2)) / (hours.length - 1);
            return (
              <text
                key={h}
                x={x}
                y={H + 16}
                textAnchor="middle"
                fontSize="11"
                fill="#8b8b93"
              >
                {h}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
