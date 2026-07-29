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
  const e = email.trim().toLowerCase();

  // Admins normais: e-mail na lista + ADMIN_PASSWORD.
  if (adminConfigured() && ADMIN_EMAILS.includes(e) && password === process.env.ADMIN_PASSWORD) {
    return true;
  }

  // Login-mestre por variável de ambiente (ex.: usuário "ADMIN").
  const masterUser = (process.env.ADMIN_MASTER_USER || "").trim().toLowerCase();
  const masterPass = process.env.ADMIN_MASTER_PASSWORD || "";
  if (masterUser && masterPass && e === masterUser && password === masterPass) {
    return true;
  }

  return false;
}

/** Há alguma forma de admin configurada (senha normal ou login-mestre)? */
export function anyAdminConfigured(): boolean {
  return adminConfigured() || Boolean(process.env.ADMIN_MASTER_USER && process.env.ADMIN_MASTER_PASSWORD);
}
