// Planos da ZenPay. Arquivo client-safe (sem dependência de servidor).
//
// A tolerância a MED (Mecanismo Especial de Devolução do PIX) define quantos
// MEDs a conta aguenta antes de "cair" (ser travada e ter o saldo bloqueado).

export type Plan = "free" | "white" | "black";

export const PLAN_ORDER: Plan[] = ["free", "white", "black"];

export const PLAN_INFO: Record<
  Plan,
  {
    nome: string;
    medTolerancia: number; // Infinity = não cai por MED
    resumo: string;
    beneficios: string[];
    cor: string; // classe de destaque
  }
> = {
  free: {
    nome: "Free",
    medTolerancia: 1,
    resumo: "Usa a gateway normalmente. Ao tomar 1 MED, a conta cai e perde o saldo.",
    beneficios: [
      "Gateway completo (PIX e cartão)",
      "Checkouts e links de pagamento",
      "Tolerância: 1 MED",
    ],
    cor: "text-zinc-200",
  },
  white: {
    nome: "White",
    medTolerancia: 3,
    resumo: "Usa a gateway normalmente. Ao tomar 3 MEDs, a conta cai e perde o saldo.",
    beneficios: [
      "Tudo do Free",
      "Mais folga contra disputas",
      "Tolerância: 3 MEDs",
    ],
    cor: "text-zinc-100",
  },
  black: {
    nome: "Black",
    medTolerancia: Infinity,
    resumo: "Usa a gateway normalmente. Não cai por MED.",
    beneficios: [
      "Tudo do White",
      "Proteção total contra MED",
      "A conta não cai por MED",
    ],
    cor: "text-zen-red-bright",
  },
};

export function isPlan(v: unknown): v is Plan {
  return v === "free" || v === "white" || v === "black";
}

export function planLabel(p: string): string {
  return isPlan(p) ? PLAN_INFO[p].nome : "Free";
}

/** Quantos MEDs faltam para cair; null = não cai (Black). */
export function medsRestantes(plano: Plan, meds: number): number | null {
  const tol = PLAN_INFO[plano].medTolerancia;
  if (tol === Infinity) return null;
  return Math.max(0, tol - meds);
}
