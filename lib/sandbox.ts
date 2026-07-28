// ============================================================
//  ZenPay — Sandbox de cartão (modo teste)
//
//  IMPORTANTE: este é um ambiente de TESTE.
//  - Só os cartões de teste abaixo são aceitos.
//  - Um cartão real NÃO é processado nem armazenado — é recusado
//    na hora, exatamente como no sandbox de Stripe/Mercado Pago.
//  - Número do cartão e CVV vivem só no formulário, na memória do
//    navegador. Nada disso é salvo, enviado ou exposto em lugar nenhum.
// ============================================================

export type SandboxOutcome =
  | { ok: true; brand: string; last4: string }
  | { ok: false; reason: string };

type TestCard = {
  /** Número sem espaços. */
  pan: string;
  brand: string;
  /** Se aprova ou o motivo da recusa. */
  result: "aprovado" | string;
};

// Cartões de teste da ZenPay (não pertencem a ninguém, não movem dinheiro).
export const TEST_CARDS: { pan: string; brand: string; label: string }[] = [
  { pan: "4242 4242 4242 4242", brand: "Visa", label: "Aprova" },
  { pan: "5555 5555 5555 4444", brand: "Mastercard", label: "Aprova" },
  { pan: "4000 0000 0000 0002", brand: "Visa", label: "Recusa" },
  { pan: "4000 0000 0000 9995", brand: "Visa", label: "Saldo insuficiente" },
  { pan: "4000 0000 0000 0069", brand: "Visa", label: "Cartão expirado" },
];

const REGISTRY: TestCard[] = [
  { pan: "4242424242424242", brand: "Visa", result: "aprovado" },
  { pan: "5555555555554444", brand: "Mastercard", result: "aprovado" },
  { pan: "4000000000000002", brand: "Visa", result: "Cartão recusado pelo emissor." },
  { pan: "4000000000009995", brand: "Visa", result: "Saldo insuficiente." },
  { pan: "4000000000000069", brand: "Visa", result: "Cartão expirado." },
];

/** Algoritmo de Luhn — valida o dígito verificador do cartão. */
export function luhnValid(pan: string): boolean {
  const digits = pan.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Valida validade MM/AA e retorna se ainda não venceu. */
export function expiryValid(exp: string): boolean {
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const mes = parseInt(m[1], 10);
  const ano = 2000 + parseInt(m[2], 10);
  if (mes < 1 || mes > 12) return false;
  // Último dia do mês de validade
  const fim = new Date(ano, mes, 1).getTime();
  return fim > Date.now();
}

/**
 * Avalia uma tentativa de pagamento no sandbox.
 * Só reconhece cartões de teste — qualquer outro número é recusado
 * sem processar, para deixar claro que é um ambiente de teste.
 */
export function evaluateSandboxCard(
  panRaw: string,
  exp: string,
  cvv: string
): SandboxOutcome {
  const pan = panRaw.replace(/\D/g, "");

  if (cvv.length < 3) {
    return { ok: false, reason: "CVV inválido." };
  }
  if (!expiryValid(exp)) {
    return { ok: false, reason: "Validade inválida ou vencida." };
  }

  const card = REGISTRY.find((c) => c.pan === pan);
  if (!card) {
    return {
      ok: false,
      reason:
        "Use um cartão de teste. Em sandbox, cartões reais não são processados.",
    };
  }
  if (card.result !== "aprovado") {
    return { ok: false, reason: card.result };
  }

  // Aprovado — devolve só o que é seguro guardar: bandeira e 4 últimos.
  return { ok: true, brand: card.brand, last4: pan.slice(-4) };
}
