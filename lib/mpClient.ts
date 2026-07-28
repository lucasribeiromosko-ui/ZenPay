// Helpers do Mercado Pago para o lado do cliente (navegador).
// A Public Key pode aparecer no frontend — é pública mesmo.

export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

/** Cobrança real ativa quando a Public Key está configurada. */
export function mercadoPagoEnabled(): boolean {
  return Boolean(MP_PUBLIC_KEY);
}

/**
 * Está em modo teste quando não há Mercado Pago (nosso sandbox) ou
 * quando a credencial é de teste (prefixo TEST-). Com credencial de
 * produção (APP_USR-), é cobrança real.
 */
export function mpTestMode(): boolean {
  return !MP_PUBLIC_KEY || MP_PUBLIC_KEY.startsWith("TEST");
}
