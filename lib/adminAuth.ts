import crypto from "crypto";

// Autenticação da área de admin (server-side).
// Só este e-mail pode entrar, e a senha fica numa variável de ambiente
// (ADMIN_PASSWORD) — nunca no código.

// E-mails com acesso ao painel de admin (comparados em minúsculas).
// Todos usam a mesma senha (ADMIN_PASSWORD). Senha por usuário só quando
// houver o back-end de autenticação.
export const ADMIN_EMAILS = [
  "lucasribeiromosko@gmail.com",
  "zenpay.suport@gmail.com",
  "hypex100kk@gmail.com",
];

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
