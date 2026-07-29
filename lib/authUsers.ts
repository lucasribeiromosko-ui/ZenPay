import crypto from "crypto";
import { getSql } from "./db";

// Autenticação de vendedores (contas reais no Neon).
// Senha guardada como hash scrypt (nunca em texto). Sessão em cookie
// httpOnly assinado com AUTH_SECRET.

export const SESSION_COOKIE = "zenpay_session";

function secret(): string {
  return process.env.AUTH_SECRET || "zenpay-dev-secret-troque-isto";
}

function scrypt(pw: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(pw, salt, 64, (err, dk) => (err ? reject(err) : resolve(dk.toString("hex"))));
  });
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(pw, salt);
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const dk = await scrypt(pw, salt);
  const a = Buffer.from(dk, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Sessão (cookie assinado) ----

export function makeSession(email: string): string {
  const payload = Buffer.from(email.toLowerCase()).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSession(token?: string): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return Buffer.from(payload, "base64url").toString();
}

// ---- Contas ----

export type DbUser = { id: string; nome: string; email: string; senha_hash: string };

// Cria a tabela de contas na primeira vez, para bastar configurar o
// DATABASE_URL sem precisar rodar SQL manual. Idempotente.
let schemaReady: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  const sql = getSql();
  schemaReady = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  })().catch((e) => {
    schemaReady = null; // permite tentar de novo no próximo request
    throw e;
  });
  return schemaReady;
}

export async function getUser(email: string): Promise<DbUser | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, nome, email, senha_hash FROM users WHERE email = ${email.toLowerCase()}
  `) as DbUser[];
  return rows[0] ?? null;
}

export async function createUser(nome: string, email: string, password: string) {
  await ensureSchema();
  const sql = getSql();
  const senha_hash = await hashPassword(password);
  const rows = (await sql`
    INSERT INTO users (nome, email, senha_hash)
    VALUES (${nome}, ${email.toLowerCase()}, ${senha_hash})
    RETURNING id, nome, email
  `) as { id: string; nome: string; email: string }[];
  return rows[0];
}

export async function setPassword(email: string, password: string): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const senha_hash = await hashPassword(password);
  const rows = (await sql`
    UPDATE users SET senha_hash = ${senha_hash}, atualizado_em = now()
    WHERE email = ${email.toLowerCase()}
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}
