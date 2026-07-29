import crypto from "crypto";
import { ADMIN_EMAILS } from "./adminEmails";

// Autenticação da área de admin (server-side).
// Só os e-mails de ADMIN_EMAILS entram, todos com a mesma senha, que fica
// numa variável de ambiente (ADMIN_PASSWORD) — nunca no código.

export { ADMIN_EMAILS };

export const ADMIN_COOKIE = "zenpay_admin";

function secret(): string {
  return process.env.AUTH_SECRET || "zenpay-dev-secret-troque-isto";
}

/** Token opaco que vai no cookie httpOnly — assinado com o AUTH_SECRET. */
export function makeToken(): string {
  return crypto.createHmac("sha256", secret()).update("zenpay-admin").digest("hex");
}

export function tokenValid(token?: string): boolean {
  if (!token) return false;
  const expected = makeToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Só funciona se a senha de admin estiver configurada no ambiente. */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function credentialsOk(email: string, password: string): boolean {
  return (
    adminConfigured() &&
    ADMIN_EMAILS.includes(email.trim().toLowerCase()) &&
    password === process.env.ADMIN_PASSWORD
  );
}
