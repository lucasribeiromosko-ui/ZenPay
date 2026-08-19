// ============================================================================
//  Vercel Serverless Function — cria um pagamento REAL (CentralPay).
//
//  SEGURANÇA: as chaves ficam em variáveis de ambiente da Vercel (process.env).
//  O navegador nunca vê a chave secreta — ele só chama esta função.
//
//  ⚠️ Os endpoints/campos marcados com "CONFIRMAR" precisam bater com a DOC de
//  cada gateway. Me manda o exemplo de "criar pagamento" (request + response)
//  de cada doc que eu finalizo os campos exatos.
// ============================================================================

const ADAPTERS = {
  // -------------------------------------------------------------- LofyPay
  lofypay: {
    envs: ["LOFYPAY_SECRET"],
    build({ centavos, descricao, pagador }) {
      const secret = process.env.LOFYPAY_SECRET;
      return {
        url: "https://api.lofypay.com/v1/transactions", // CONFIRMAR na doc
        headers: {
          // CONFIRMAR: LofyPay usa Bearer com a sk_live (troque para Basic se a doc pedir)
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: {
          amount: centavos,
          payment_method: "pix",
          description: descricao || "Cobrança",
          customer: pagador ? { name: pagador } : undefined,
        },
      };
    },
    parse: (d) => ({
      id: d.id ?? d.transaction_id,
      status: d.status,
      qr: d.pix?.qr_code_base64 ?? d.qr_code_base64,
      code: d.pix?.copy_paste ?? d.pix_code ?? d.emv,
      link: d.checkout_url ?? d.payment_url,
    }),
  },

  // ------------------------------------------------------------- Sharpify
  sharpify: {
    envs: ["SHARPIFY_CLIENT_ID", "SHARPIFY_CLIENT_SECRET"],
    build({ centavos, descricao }) {
      const id = process.env.SHARPIFY_CLIENT_ID;
      const secret = process.env.SHARPIFY_CLIENT_SECRET;
      const basic = Buffer.from(`${id}:${secret}`).toString("base64");
      return {
        url: "https://api.sharpify.com.br/v1/payment-links", // CONFIRMAR na doc
        headers: {
          // CONFIRMAR: se a doc exigir trocar client_id/secret por um token OAuth
          // primeiro, a gente adiciona esse passo. Por ora, Basic auth.
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
        body: {
          amount: centavos,
          description: descricao || "Cobrança",
          payment_method: "pix",
        },
      };
    },
    parse: (d) => ({
      id: d.id,
      status: d.status,
      qr: d.pix?.qr_code_base64,
      code: d.pix?.copy_paste ?? d.pix?.code,
      link: d.url ?? d.payment_url ?? d.checkout_url,
    }),
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });

  const { gateway, valor, descricao, pagador } = req.body || {};
  const adapter = ADAPTERS[gateway];
  if (!adapter) return res.status(400).json({ erro: "Gateway não integrada" });

  const faltando = adapter.envs.filter((e) => !process.env[e]);
  if (faltando.length) {
    return res.status(400).json({ erro: `Configure na Vercel: ${faltando.join(", ")}` });
  }

  const centavos = Math.round((Number(valor) || 0) * 100);
  if (centavos <= 0) return res.status(400).json({ erro: "Valor inválido" });

  try {
    const { url, headers, body } = adapter.build({ centavos, descricao, pagador });
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ erro: "Gateway recusou", status: r.status, detalhe: data });
    return res.status(200).json({ ok: true, ...adapter.parse(data), raw: data });
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
