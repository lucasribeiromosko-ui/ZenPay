"use client";

import { useEffect, useState } from "react";

// Token assinado do vendedor logado, para embutir nos links de checkout
// e atribuir os pagamentos à conta certa. null quando não há sessão/banco.
export function useSellerToken(): string | null {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    let cancel = false;
    fetch("/api/pay/seller-token", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancel && d.token) setToken(d.token);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);
  return token;
}
