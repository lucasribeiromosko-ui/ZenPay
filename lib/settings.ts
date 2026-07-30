import crypto from "crypto";
import { getSql } from "./db";

// Configurações do vendedor guardadas no banco: pixels de trackeamento,
// chaves de API e webhooks. Tabelas criadas sozinhas (idempotente).

let ready: Promise<void> | null = null;
export function ensureSettingsSchema(): Promise<void> {
  if (ready) return ready;
  const sql = getSql();
  ready = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_pixels (
        email TEXT PRIMARY KEY,
        meta_pixel TEXT,
        google_ads TEXT,
        tiktok_pixel TEXT,
        gtm_container TEXT,
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        email TEXT PRIMARY KEY,
        public_key TEXT NOT NULL,
        secret_hash TEXT NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        url TEXT NOT NULL,
        secret TEXT NOT NULL,
        ativo BOOLEAN NOT NULL DEFAULT true,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

// ---------------- Trackeamento ----------------

export type Tracking = {
  meta_pixel: string;
  google_ads: string;
  tiktok_pixel: string;
  gtm_container: string;
};

export async function getTracking(email: string): Promise<Tracking> {
  await ensureSettingsSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT meta_pixel, google_ads, tiktok_pixel, gtm_container
    FROM tracking_pixels WHERE email = ${email.toLowerCase()}
  `) as Partial<Tracking>[];
  const r = rows[0] ?? {};
  return {
    meta_pixel: r.meta_pixel ?? "",
    google_ads: r.google_ads ?? "",
    tiktok_pixel: r.tiktok_pixel ?? "",
    gtm_container: r.gtm_container ?? "",
  };
}

export async function saveTracking(email: string, t: Tracking) {
  await ensureSettingsSchema();
  const sql = getSql();
  await sql`
    INSERT INTO tracking_pixels (email, meta_pixel, google_ads, tiktok_pixel, gtm_container, atualizado_em)
    VALUES (${email.toLowerCase()}, ${t.meta_pixel}, ${t.google_ads}, ${t.tiktok_pixel}, ${t.gtm_container}, now())
    ON CONFLICT (email) DO UPDATE SET
      meta_pixel = EXCLUDED.meta_pixel,
      google_ads = EXCLUDED.google_ads,
      tiktok_pixel = EXCLUDED.tiktok_pixel,
      gtm_container = EXCLUDED.gtm_container,
      atualizado_em = now()
  `;
}

// ---------------- Chaves de API ----------------

function sha256(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export async function getPublicKey(email: string): Promise<string | null> {
  await ensureSettingsSchema();
  const sql = getSql();
  const rows = (await sql`SELECT public_key FROM api_keys WHERE email = ${email.toLowerCase()}`) as {
    public_key: string;
  }[];
  return rows[0]?.public_key ?? null;
}

/** Gera (ou regenera) o par de chaves. Devolve a secreta uma única vez. */
export async function rotateApiKey(email: string): Promise<{ publicKey: string; secretKey: string }> {
  await ensureSettingsSchema();
  const sql = getSql();
  const publicKey = "zpk_live_" + crypto.randomBytes(12).toString("hex");
  const secretKey = "zsk_live_" + crypto.randomBytes(24).toString("hex");
  await sql`
    INSERT INTO api_keys (email, public_key, secret_hash, criado_em)
    VALUES (${email.toLowerCase()}, ${publicKey}, ${sha256(secretKey)}, now())
    ON CONFLICT (email) DO UPDATE SET
      public_key = EXCLUDED.public_key,
      secret_hash = EXCLUDED.secret_hash,
      criado_em = now()
  `;
  return { publicKey, secretKey };
}

/** Autentica uma requisição da API pública pela chave secreta. */
export async function findEmailBySecret(secretKey: string): Promise<string | null> {
  await ensureSettingsSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT email FROM api_keys WHERE secret_hash = ${sha256(secretKey)}
  `) as { email: string }[];
  return rows[0]?.email ?? null;
}

// ---------------- Webhooks ----------------

export type Webhook = { id: string; url: string; secret: string; ativo: boolean; criado_em: string };

export async function listWebhooks(email: string): Promise<Webhook[]> {
  await ensureSettingsSchema();
  const sql = getSql();
  return (await sql`
    SELECT id, url, secret, ativo, criado_em FROM webhooks
    WHERE email = ${email.toLowerCase()} ORDER BY criado_em DESC
  `) as Webhook[];
}

export async function addWebhook(email: string, url: string): Promise<Webhook> {
  await ensureSettingsSchema();
  const sql = getSql();
  const secret = "whsec_" + crypto.randomBytes(16).toString("hex");
  const rows = (await sql`
    INSERT INTO webhooks (email, url, secret) VALUES (${email.toLowerCase()}, ${url}, ${secret})
    RETURNING id, url, secret, ativo, criado_em
  `) as Webhook[];
  return rows[0];
}

export async function removeWebhook(email: string, id: string) {
  await ensureSettingsSchema();
  const sql = getSql();
  await sql`DELETE FROM webhooks WHERE id = ${id} AND email = ${email.toLowerCase()}`;
}
