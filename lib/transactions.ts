import crypto from "crypto";
import { getSql } from "./db";

// Registro de transações e saldo por vendedor.

function secret(): string {
  return process.env.AUTH_SECRET || "zenpay-dev-secret-troque-isto";
}

// --- Token de vendedor (vincula um checkout público a uma conta) ---

export function signSeller(email: string): string {
  const p = Buffer.from(email.toLowerCase()).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update("seller:" + p).digest("base64url").slice(0, 24);
  return `${p}.${sig}`;
}

export function verifySeller(token?: string | null): string | null {
  if (!token) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const exp = crypto.createHmac("sha256", secret()).update("seller:" + p).digest("base64url").slice(0, 24);
  if (exp !== sig) return null;
  return Buffer.from(p, "base64url").toString();
}

// --- Taxas ---

export function calcFee(metodo: string, valorCents: number): { taxa: number; liquido: number } {
  const pct = metodo === "credito" ? 0.0699 : metodo === "debito" ? 0.0499 : 0.0399;
  const taxa = Math.round(valorCents * pct) + 100; // + R$ 1,00
  return { taxa, liquido: Math.max(0, valorCents - taxa) };
}

// --- Schema ---

let ready: Promise<void> | null = null;
export function ensureTxSchema(): Promise<void> {
  if (ready) return ready;
  const sql = getSql();
  ready = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_email TEXT NOT NULL,
        mp_payment_id TEXT UNIQUE,
        metodo TEXT NOT NULL,
        valor INTEGER NOT NULL,
        taxa INTEGER NOT NULL DEFAULT 0,
        liquido INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pendente',
        descricao TEXT,
        payer_email TEXT,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        pago_em TIMESTAMPTZ
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_email TEXT NOT NULL,
        valor INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'processando',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

// --- Operações ---

export async function recordTransaction(input: {
  sellerEmail: string;
  mpPaymentId: string | number | undefined;
  metodo: string;
  valorCents: number;
  status: string;
  descricao?: string;
  payerEmail?: string;
}) {
  await ensureTxSchema();
  const sql = getSql();
  const { taxa, liquido } = calcFee(input.metodo, input.valorCents);
  const mpId = input.mpPaymentId != null ? String(input.mpPaymentId) : null;
  const pago = input.status === "approved" || input.status === "paga";
  await sql`
    INSERT INTO transactions (seller_email, mp_payment_id, metodo, valor, taxa, liquido, status, descricao, payer_email, pago_em)
    VALUES (
      ${input.sellerEmail.toLowerCase()}, ${mpId}, ${input.metodo}, ${input.valorCents},
      ${taxa}, ${liquido}, ${normalizeStatus(input.status)}, ${input.descricao ?? null},
      ${input.payerEmail ?? null}, ${pago ? new Date().toISOString() : null}
    )
    ON CONFLICT (mp_payment_id) DO UPDATE SET
      status = EXCLUDED.status,
      pago_em = COALESCE(transactions.pago_em, EXCLUDED.pago_em)
  `;
}

function normalizeStatus(s: string): string {
  if (s === "approved" || s === "paga") return "paga";
  if (s === "rejected" || s === "recusada") return "recusada";
  if (s === "cancelled" || s === "expired" || s === "expirada") return "expirada";
  return "pendente";
}

export async function approveByMpId(mpPaymentId: string) {
  await ensureTxSchema();
  const sql = getSql();
  await sql`
    UPDATE transactions SET status = 'paga', pago_em = COALESCE(pago_em, now())
    WHERE mp_payment_id = ${String(mpPaymentId)}
  `;
}

export async function dashboardFor(email: string) {
  await ensureTxSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      COALESCE(SUM(liquido) FILTER (WHERE status = 'paga'), 0)::int AS liquido_pago,
      COALESCE(SUM(valor)   FILTER (WHERE status = 'paga'), 0)::int AS bruto_pago,
      COALESCE(COUNT(*)     FILTER (WHERE status = 'paga'), 0)::int AS vendas_pagas,
      COALESCE(SUM(valor)   FILTER (WHERE status = 'pendente'), 0)::int AS bruto_pendente,
      COALESCE(COUNT(*)     FILTER (WHERE status = 'pendente'), 0)::int AS qtd_pendente
    FROM transactions WHERE seller_email = ${email.toLowerCase()}
  `) as {
    liquido_pago: number;
    bruto_pago: number;
    vendas_pagas: number;
    bruto_pendente: number;
    qtd_pendente: number;
  }[];
  const w = (await sql`
    SELECT COALESCE(SUM(valor), 0)::int AS sacado FROM withdrawals
    WHERE seller_email = ${email.toLowerCase()} AND status <> 'falhou'
  `) as { sacado: number }[];
  const r = rows[0];
  const saldoDisponivel = Math.max(0, r.liquido_pago - (w[0]?.sacado ?? 0));
  return {
    saldoDisponivel,
    liquidoPago: r.liquido_pago,
    brutoPago: r.bruto_pago,
    vendasPagas: r.vendas_pagas,
    brutoPendente: r.bruto_pendente,
    qtdPendente: r.qtd_pendente,
  };
}

export async function listTransactions(email: string) {
  await ensureTxSchema();
  const sql = getSql();
  return (await sql`
    SELECT id, mp_payment_id, metodo, valor, taxa, liquido, status, descricao, payer_email, criado_em, pago_em
    FROM transactions WHERE seller_email = ${email.toLowerCase()}
    ORDER BY criado_em DESC LIMIT 100
  `) as Record<string, unknown>[];
}
