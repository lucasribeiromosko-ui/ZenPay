// ============================================================================
//  Sincronização compartilhada (você + sócio). Guarda blobs nomeados num KV
//  (Vercel KV / Upstash Redis). Protegido pela CENTRALPAY_API_KEY (x-api-key).
//
//  POST { store }              -> { data: <valor|null> }   (ler)
//  POST { store, data }        -> { ok: true }             (gravar)
//
//  stores permitidos: "contas" (contas Lofy) e "dados" (histórico).
//
//  Variáveis (a Vercel cria ao conectar um KV/Upstash ao projeto):
//    KV_REST_API_URL / KV_REST_API_TOKEN
//    ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// ============================================================================
import { autorizado } from "./_auth.js";

const STORES = { contas: "centralpay_contas", dados: "centralpay_dados" };
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvCmd(cmd) {
  const r = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });
  if (!autorizado(req, res)) return;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(400).json({
      erro: "Sincronização não configurada. Conecte um KV (Vercel Storage → Upstash Redis) ao projeto e faça Redeploy.",
    });
  }

  const { store, data } = req.body || {};
  const key = STORES[store];
  if (!key) return res.status(400).json({ erro: "store inválido (use contas ou dados)" });

  try {
    if (data !== undefined && data !== null) {
      await kvCmd(["SET", key, JSON.stringify(data)]);
      return res.status(200).json({ ok: true });
    }
    const g = await kvCmd(["GET", key]);
    let val = null;
    try { val = JSON.parse(g.result); } catch (e) {}
    return res.status(200).json({ ok: true, data: val });
  } catch (e) {
    return res.status(500).json({ erro: "Falha na sincronização", detalhe: String(e) });
  }
}
