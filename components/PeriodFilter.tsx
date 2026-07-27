"use client";

import { useState } from "react";
import { IconCalendar } from "./icons";

const periods = ["Hoje", "Ontem", "7 dias", "30 dias"];

export default function PeriodFilter() {
  const [active, setActive] = useState("Hoje");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[14px] font-semibold text-zinc-300">
        <IconCalendar className="h-4 w-4 text-zen-muted" />
        Período de análise
      </h2>

      <div className="flex items-center gap-1 rounded-xl border border-zen-border bg-zen-card p-1">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
              active === p
                ? "bg-zen-red text-white shadow-red-soft"
                : "text-zen-muted hover:text-zinc-200"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setActive("Custom")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
            active === "Custom"
              ? "bg-zen-red text-white shadow-red-soft"
              : "text-zen-muted hover:text-zinc-200"
          }`}
        >
          <IconCalendar className="h-3.5 w-3.5" />
          Custom
        </button>
      </div>
    </div>
  );
}
