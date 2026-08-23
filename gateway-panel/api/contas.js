// ============================================================================
//  Sincronização das contas do Central Lofy (compartilhada entre você e o sócio).
//
//  Guarda a lista de contas num KV (Vercel KV / Upstash Redis) — assim os dois
//  veem as MESMAS contas de qualquer navegador. Protegido pela CENTRALPAY_API_KEY.
//
//  POST { }            -> devolve { contas: [...] }        (ler)
//  POST { contas:[...]}-> salva a lista e devolve { ok }   (gravar)
//
//  Variáveis (a Vercel cria sozinha ao conectar um KV/Upstash no projeto):
//    KV_REST_API_URL   / KV_REST_API_TOKEN         (Vercel KV)
//    ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// ============================================================================
import { autorizado } from "./_auth.js";

const KEY = "centralpay_contas";
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

  try {
    const { contas } = req.body || {};

    // Gravar
    if (Array.isArray(contas)) {
      await kvCmd(["SET", KEY, JSON.stringify(contas)]);
      return res.status(200).json({ ok: true, salvo: contas.length });
    }

    // Ler
    const g = await kvCmd(["GET", KEY]);
    let arr = [];
    try { arr = JSON.parse(g.result) || []; } catch (e) {}
    return res.status(200).json({ ok: true, contas: arr });
  } catch (e) {
    return res.status(500).json({ erro: "Falha na sincronização", detalhe: String(e) });
  }
}
