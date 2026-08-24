// ============================================================================
//  Vercel Serverless Function — consulta o status de um pagamento (CentralPay).
//  Integrações: LofyPay e Sharpify.
//
//  SEGURANÇA: chaves só em process.env (Environment Variables da Vercel).
//  Autenticação: header x-api-key === CENTRALPAY_API_KEY.
// ============================================================================

import { autorizado } from "./_auth.js";

// Normaliza os vários rótulos de status das gateways para algo legível.
function normalizar(s) {
  const t = String(s || "").toLowerCase();
  if (/paid|approved|success|pago|completed|paid_out/.test(t)) return "pago";
  if (/pend|aguard|waiting|created|processing/.test(t)) return "pendente";
  if (/cancel|expired|refus|failed|declin/.test(t)) return "cancelado";
  if (/refund|charge|contest|med|dispute/.test(t)) return "med";
  return s || "desconhecido";
}

const ADAPTERS = {
  // --------------------------------------------------------------- LofyPay
  //  POST https://app.lofypay.com/api/v1/status   body { idtransaction }
  lofypay: {
    envs: ["LOFYPAY_SECRET"],
    async check({ id, secret }) {
      const token = secret || process.env.LOFYPAY_SECRET;
      const r = await fetch("https://app.lofypay.com/api/v1/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idtransaction: id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, status: r.status, erro: d.message || d.error || "Falha na consulta", raw: d };
      const bruto = d.status || d.paymentStatus || (d.data && d.data.status) || "";
      return { ok: true, id, status: normalizar(bruto), bruto, raw: d };
    },
  },

  // -------------------------------------------------------------- Sharpify
  //  GET https://api.sharpify.com.br/api/v1/checkout/payment-link/get?id=...
  sharpify: {
    envs: ["SHARPIFY_CLIENT_ID", "SHARPIFY_CLIENT_SECRET"],
    async check({ id }) {
      const url = `https://api.sharpify.com.br/api/v1/checkout/payment-link/get?id=${encodeURIComponent(id)}`;
      const r = await fetch(url, {
        method: "GET",
        headers: {
          "x-sharpify-client-id": process.env.SHARPIFY_CLIENT_ID,
          "x-sharpify-client-secret": process.env.SHARPIFY_CLIENT_SECRET,
        },
      });
      const d = await r.json().catch(() => ({}));
      const pp = d.data || d;
      if (!r.ok || !pp) return { ok: false, status: r.status, erro: d.message || d.error || "Falha na consulta", raw: d };
      const bruto = pp.status || (pp.payment && pp.payment.status) || "";
      return { ok: true, id, status: normalizar(bruto), bruto, raw: pp };
    },
  },

  // ---------------------------------------------------------------- IcePay
  //  GET https://api.icepay.com.br/api/v1/pix/status?transaction_id=uuid  (Bearer)
  icepay: {
    envs: ["ICEPAY_SECRET"],
    async check({ id, secret }) {
      const token = secret || process.env.ICEPAY_SECRET;
      const url = `https://api.icepay.com.br/api/v1/pix/status?transaction_id=${encodeURIComponent(id)}`;
      const r = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json().catch(() => ({}));
      const dd = d.data || d;
      if (!r.ok) return { ok: false, status: r.status, erro: d.message || d.error || "Falha na consulta", raw: d };
      const bruto = dd.status || "";
      return { ok: true, id, status: normalizar(bruto), bruto, raw: dd };
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });
  if (!autorizado(req, res)) return;

  const { gateway, id, secret } = req.body || {};
  const adapter = ADAPTERS[gateway];
  if (!adapter) return res.status(400).json({ erro: "Gateway não integrada (use lofypay ou sharpify)" });
  if (!id) return res.status(400).json({ erro: "Informe o id do pagamento" });

  const faltando = secret ? [] : adapter.envs.filter((e) => !process.env[e]);
  if (faltando.length) return res.status(400).json({ erro: `Configure na Vercel: ${faltando.join(", ")}` });

  try {
    const out = await adapter.check({ id, secret });
    if (!out.ok) return res.status(502).json({ erro: out.erro, detalhe: out.raw });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
