// ============================================================================
//  Vercel Serverless Function — consulta o saldo de uma conta (CentralPay).
//  Integração: LofyPay.
//
//  ATENÇÃO: a LofyPay não documentou (nos docs que temos) um endpoint oficial
//  de saldo. Aqui tentamos o padrão /api/v1/balance (mesmo estilo dos outros
//  endpoints deles). Se a LofyPay usar outro caminho/campo, me manda o doc que
//  eu ajusto — a resposta é lida de forma flexível (vários nomes de campo).
//
//  SEGURANÇA: chave só em process.env OU enviada pelo painel (conta do Lofy).
//  Autenticação: header x-api-key === CENTRALPAY_API_KEY.
// ============================================================================
import { autorizado } from "./_auth.js";

// Lê o saldo de várias formas possíveis de resposta.
function extrairSaldo(d) {
  if (d == null) return null;
  const cand = [
    d.balance, d.available, d.available_balance, d.availableBalance,
    d.saldo, d.saldo_disponivel, d.amount, d.value,
    d.data && (d.data.balance ?? d.data.available ?? d.data.saldo ?? d.data.amount),
    d.wallet && (d.wallet.balance ?? d.wallet.available),
  ];
  for (const v of cand) if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
  return null;
}

const ADAPTERS = {
  lofypay: {
    envs: ["LOFYPAY_SECRET"],
    async saldo({ secret }) {
      const token = secret || process.env.LOFYPAY_SECRET;
      const r = await fetch("https://app.lofypay.com/api/v1/balance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, status: r.status, erro: d.message || d.error || "Falha ao consultar saldo", raw: d };
      const saldo = extrairSaldo(d);
      if (saldo == null) return { ok: false, status: r.status, erro: "Resposta sem campo de saldo reconhecido", raw: d };
      return { ok: true, saldo, raw: d };
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });
  if (!autorizado(req, res)) return;

  const { gateway, secret } = req.body || {};
  const adapter = ADAPTERS[gateway];
  if (!adapter) return res.status(400).json({ erro: "Saldo disponível via API apenas para: lofypay" });

  const faltando = secret ? [] : adapter.envs.filter((e) => !process.env[e]);
  if (faltando.length) return res.status(400).json({ erro: `Configure na Vercel: ${faltando.join(", ")}` });

  try {
    const out = await adapter.saldo({ secret });
    if (!out.ok) return res.status(502).json({ erro: out.erro, detalhe: out.raw });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
