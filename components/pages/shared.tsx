"use client";

import { IconChevronDown } from "../icons";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1 text-[13.5px] text-zen-muted">{subtitle}</p>
    </div>
  );
}

export function MiniStat({
  icon,
  iconClass,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition hover:border-zen-red/30 ${
        highlight
          ? "border-zen-red/40 bg-gradient-to-br from-zen-red/15 to-zen-card"
          : "border-zen-border bg-zen-card"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
          {icon}
        </span>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-zen-muted">
          {label}
        </p>
      </div>
      <p className="mt-2.5 text-[22px] font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-zen-muted">{sub}</p>}
    </div>
  );
}

export function FakeSelect({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-2 rounded-xl border border-zen-border bg-zen-card px-3.5 py-2 text-[12.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40">
      {label}
      <IconChevronDown className="h-3.5 w-3.5 text-zen-muted" />
    </button>
  );
}
