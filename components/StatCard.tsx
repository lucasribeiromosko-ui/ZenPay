"use client";

type StatCardProps = {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  sub: string;
  trend?: string;
  underline?: boolean;
};

export default function StatCard({
  icon,
  iconClass,
  label,
  value,
  sub,
  trend,
  underline,
}: StatCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-zen-border bg-zen-card p-5 transition hover:border-zen-red/30">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </span>
        {trend && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
            ↗ {trend}
          </span>
        )}
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-zen-muted">
        {label}
      </p>
      <p className="mt-1 text-[26px] font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[12px] text-zen-muted">{sub}</p>

      {underline && (
        <div className="mt-4 h-0.5 w-full rounded-full bg-gradient-to-r from-zen-red-bright/70 to-transparent" />
      )}
    </div>
  );
}
