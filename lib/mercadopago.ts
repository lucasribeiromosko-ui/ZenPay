// ============================================================
//  ZenPay — Integração com o Mercado Pago (server-side)
//
//  A chave secreta (Access Token) só existe aqui, no servidor,
//  lida de uma variável de ambiente. Nunca vai para o frontend
//  nem para o git.
//
//  O cartão NUNCA chega aqui em texto: o backend recebe um TOKEN
//  gerado no navegador pelo SDK do Mercado Pago. Número do cartão
//  e CVV não passam pelo nosso servidor e não são armazenados.
// ============================================================

const MP_PAYMENTS_API = "https://api.mercadopago.com/v1/payments";

export type CardChargeInput = {
  /** Token do cartão gerado no navegador pelo SDK do MP. */
  token: string;
  /** Valor em reais, ex: 197.0 */
  transactionAmount: number;
  installments: number;
  /** ex: "visa", "master", "elo" */
  paymentMethodId: string;
  description: string;
  payer: {
    email: string;
    docType?: string; // "CPF"
    docNumber?: string;
  };
  /** Evita cobrança duplicada em reenvio. */
  idempotencyKey: string;
};

export type CardChargeResult = {
  ok: boolean;
  status: string; // approved | rejected | in_process | ...
  statusDetail: string;
  id?: string | number;
  message?: string;
};

/** Só está ativo quando o Access Token está configurado no ambiente. */
export function isMercadoPagoEnabled(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

export async function chargeCard(input: CardChargeInput): Promise<CardChargeResult> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      ok: false,
      status: "error",
      statusDetail: "mp_disabled",
      message: "Mercado Pago não configurado.",
    };
  }

  const body = {
    transaction_amount: Number(input.transactionAmount.toFixed(2)),
    token: input.token,
    description: input.description,
    installments: input.installments,
    payment_method_id: input.paymentMethodId,
    payer: {
      email: input.payer.email,
      ...(input.payer.docType && input.payer.docNumber
        ? { identification: { type: input.payer.docType, number: input.payer.docNumber } }
        : {}),
    },
  };

  let res: Response;
  try {
    res = await fetch(MP_PAYMENTS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      status: "error",
      statusDetail: "network_error",
      message: "Não foi possível falar com o Mercado Pago.",
    };
  }

  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    status_detail?: string;
    id?: string | number;
    message?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      status: "error",
      statusDetail: data.status_detail ?? "request_failed",
      message: data.message ?? "Falha ao processar no Mercado Pago.",
    };
  }

  const status = data.status ?? "unknown";
  return {
    ok: status === "approved",
    status,
    statusDetail: data.status_detail ?? "",
    id: data.id,
  };
}
