import { neon } from "@neondatabase/serverless";

// Conexão com o Neon (Postgres). A string vem de DATABASE_URL (variável
// de ambiente na Vercel) — nunca do código.

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  return neon(url);
}
