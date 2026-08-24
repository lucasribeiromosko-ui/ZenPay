// ============================================================================
//  Vercel Serverless Function — cria um pagamento PIX real (CentralPay).
//  Integrações: LofyPay e Sharpify.
//
//  SEGURANÇA: chaves só em process.env (Environment Variables da Vercel).
//  O navegador nunca vê a chave — ele só chama esta função.
//
//  Variáveis necessárias na Vercel:
//    LOFYPAY_SECRET            (sk_live_… da LofyPay)
//    SHARPIFY_CLIENT_ID        (x-sharpify-client-id)
//    SHARPIFY_CLIENT_SECRET    (x-sharpify-client-secret)
//    CENTRALPAY_API_KEY        (chave que o seu Python/painel envia em x-api-key)
// ============================================================================

import { autorizado } from "./_auth.js";

const ADAPTERS = {
  // ------------------------------------------------------------- LofyPay
  //  POST https://app.lofypay.com/api/v1/gateway  (Bearer sk_live)
  //  valor em REAIS. Resposta: { status:"success", paymentCode, idTransaction,
  //  paymentCodeBase64? }. HTTP 200 pode conter { status:"error", message }.
  lofypay: {
    envs: ["LOFYPAY_SECRET"],
    async create({ valor, descricao, pagador, secret }) {
      // secret (opcional) vem do painel Central Lofy (conta selecionada);
      // se não vier, usa a env var LOFYPAY_SECRET.
      const token = secret || process.env.LOFYPAY_SECRET;
      const r = await fetch("https://app.lofypay.com/api/v1/gateway", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(valor),
          method: "pix",
          external_reference: "CENTRALPAY-" + Date.now(),
          client: { name: (pagador || "Cliente").slice(0, 80) },
          ...(descricao ? { metadata: { order_id: descricao.slice(0, 60) } } : {}),
        }),
      });
      const d = await r.json().catch(() => ({}));
      const ok = r.ok && (d.status === "success" || d.status === "OK") && d.idTransaction;
      if (!ok) {
        return { ok: false, status: r.status, erro: d.message || d.error || "Gateway recusou", raw: d };
      }
      return {
        ok: true,
        id: d.idTransaction,
        status: "aguardando pagamento",
        code: d.paymentCode || null,      // Pix copia-e-cola
        qr: d.paymentCodeBase64 || null,  // QR em base64 (opcional)
        link: null,
        raw: d,
      };
    },
  },

  // ------------------------------------------------------------- Sharpify
  //  POST https://api.sharpify.com.br/api/v1/checkout/payment-link/create
  //  Headers x-sharpify-client-id / x-sharpify-client-secret. valor em REAIS.
  //  Resposta: { data: PaymentLinkProps } com payment.gateway.data = {code,qrCode,paymentLink}
  sharpify: {
    envs: ["SHARPIFY_CLIENT_ID", "SHARPIFY_CLIENT_SECRET"],
    async create({ valor, descricao }) {
      const nome = (descricao || "Cobrança CentralPay").slice(0, 60);
      const r = await fetch("https://api.sharpify.com.br/api/v1/checkout/payment-link/create", {
        method: "POST",
        headers: {
          "x-sharpify-client-id": process.env.SHARPIFY_CLIENT_ID,
          "x-sharpify-client-secret": process.env.SHARPIFY_CLIENT_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nome,
          description: descricao || undefined,
          amount: Number(valor),
          gatewayMethod: "PIX",
        }),
      });
      const d = await r.json().catch(() => ({}));
      const pp = d.data;
      if (!r.ok || !pp) {
        return { ok: false, status: r.status, erro: d.message || d.error || "Gateway recusou", raw: d };
      }
      const gw = (pp.payment && pp.payment.gateway && pp.payment.gateway.data) || {};
      return {
        ok: true,
        id: pp.id,
        status: pp.status || "PENDING",
        code: gw.code || null,          // Pix copia-e-cola
        qr: gw.qrCode || null,          // QR (base64 ou url)
        link: gw.paymentLink || null,   // link de checkout
        raw: pp,
      };
    },
  },

  // ------------------------------------------------------------- IcePay
  //  POST https://api.icepay.com.br/api/v1/pix/create  (Bearer). valor em REAIS.
  //  Resposta: { success:true, data:{ id, copy_paste, qr_code, qr_code_base64, status } }
  icepay: {
    envs: ["ICEPAY_SECRET"],
    async create({ valor, descricao, pagador, secret }) {
      const token = secret || process.env.ICEPAY_SECRET;
      const base = "https://api.icepay.com.br/api/v1";
      const call = (path) => fetch(base + path, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(valor),
          external_id: "CENTRALPAY-" + Date.now(),
          description: (descricao || "Cobranca CentralPay").slice(0, 120),
          payer: { name: (pagador || "Cliente").slice(0, 80) },
        }),
      });
      // docs divergem entre /pix/create e /pix/charge — tenta um, cai pro outro no 404
      let r = await call("/pix/create");
      if (r.status === 404) r = await call("/pix/charge");
      const d = await r.json().catch(() => ({}));
      const dd = d.data || d;
      const ok = r.ok && d.success !== false && dd && dd.id;
      if (!ok) return { ok: false, status: r.status, erro: d.message || d.error || "Gateway recusou", raw: d };
      return {
        ok: true,
        id: dd.id,
        status: dd.status || "pending",
        code: dd.copy_paste || dd.qr_code || null,
        qr: dd.qr_code_base64 || null,
        link: null,
        raw: dd,
      };
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });
  if (!autorizado(req, res)) return;

  const { gateway, valor, descricao, pagador, secret } = req.body || {};
  const adapter = ADAPTERS[gateway];
  if (!adapter) return res.status(400).json({ erro: "Gateway não integrada (use lofypay ou sharpify)" });

  // Se o painel mandou uma secret (conta do Central Lofy), não exige a env var.
  const faltando = secret ? [] : adapter.envs.filter((e) => !process.env[e]);
  if (faltando.length) return res.status(400).json({ erro: `Configure na Vercel: ${faltando.join(", ")}` });
  if (!(Number(valor) > 0)) return res.status(400).json({ erro: "Valor inválido" });

  try {
    const out = await adapter.create({ valor, descricao, pagador, secret });
    if (!out.ok) return res.status(502).json({ erro: out.erro, detalhe: out.raw });

    // Monta o link de pagamento HOSPEDADO NA CENTRALPAY (QR + copia-e-cola),
    // pra nunca redirecionar pro link cru da gateway terceirizada.
    if (out.code) {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || "https";
      const payload = Buffer.from(JSON.stringify({
        id: out.id, code: out.code, valor: Number(valor), gateway,
      })).toString("base64url");
      out.pay_url = `${proto}://${host}/pay.html#${payload}`;
    } else {
      out.pay_url = out.link || null;
    }
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
