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
// ============================================================================

const ADAPTERS = {
  // ------------------------------------------------------------- LofyPay
  //  POST https://app.lofypay.com/api/v1/gateway  (Bearer sk_live)
  //  valor em REAIS. Resposta: { status:"success", paymentCode, idTransaction,
  //  paymentCodeBase64? }. HTTP 200 pode conter { status:"error", message }.
  lofypay: {
    envs: ["LOFYPAY_SECRET"],
    async create({ valor, descricao, pagador }) {
      const r = await fetch("https://app.lofypay.com/api/v1/gateway", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LOFYPAY_SECRET}`,
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
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });

  const { gateway, valor, descricao, pagador } = req.body || {};
  const adapter = ADAPTERS[gateway];
  if (!adapter) return res.status(400).json({ erro: "Gateway não integrada (use lofypay ou sharpify)" });

  const faltando = adapter.envs.filter((e) => !process.env[e]);
  if (faltando.length) return res.status(400).json({ erro: `Configure na Vercel: ${faltando.join(", ")}` });
  if (!(Number(valor) > 0)) return res.status(400).json({ erro: "Valor inválido" });

  try {
    const out = await adapter.create({ valor, descricao, pagador });
    if (!out.ok) return res.status(502).json({ erro: out.erro, detalhe: out.raw });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
