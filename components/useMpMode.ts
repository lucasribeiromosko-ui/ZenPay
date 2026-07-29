"use client";

import { useEffect, useState } from "react";

export type MpMode = {
  pixReal: boolean;
  cardReal: boolean;
  testMode: boolean;
};

// Lê o modo do Mercado Pago em runtime (teste x produção x sandbox).
export function useMpMode(): MpMode | null {
  const [mode, setMode] = useState<MpMode | null>(null);
  useEffect(() => {
    let cancel = false;
    fetch("/api/pay/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((m: MpMode) => {
        if (!cancel) setMode(m);
      })
      .catch(() => {
        if (!cancel) setMode({ pixReal: false, cardReal: false, testMode: true });
      });
    return () => {
      cancel = true;
    };
  }, []);
  return mode;
}
