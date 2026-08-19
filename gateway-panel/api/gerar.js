// ============================================================================
//  Vercel Serverless Function — cria um pagamento REAL na gateway escolhida.
//
//  POR QUE AQUI (e não no frontend): a CHAVE SECRETA de cada gateway fica em
//  variável de ambiente (process.env.*), configurada no painel da Vercel.
//  O navegador NUNCA vê a chave — ele só chama esta função.
//
//  Cada gateway tem sua própria API. Preencha `url` e o corpo do request com
//  o que a DOC de cada uma pedir (você me manda as docs e eu completo).
// ============================================================================

const GATEWAY_CFG = {
  lofypay:   { url: "https://api.lofypay.com/v1/charges",     key: () => process.env.LOFYPAY_SECRET },
  sharpify:  { url: "https://api.sharpify.com/v1/payments",   key: () => process.env.SHARPIFY_SECRET },
  bravopay:  { url: "https://api.bravopay.com/v1/charges",    key: () => process.env.BRAVOPAY_SECRET },
  dominipay: { url: "https://api.dominipay.com/v1/pix",       key: () => process.env.DOMINIPAY_SECRET },
  goatpay:   { url: "https://api.goatpay.com/v1/charges",     key: () => process.env.GOATPAY_SECRET },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Use POST" });
  }
  const { gateway, valor, descricao } = req.body || {};
  const cfg = GATEWAY_CFG[gateway];

  if (!cfg) return res.status(400).json({ erro: "Gateway inválida" });
  const secret = cfg.key();
  if (!secret) {
    return res.status(400).json({ erro: `Configure a variável de ambiente da ${gateway} na Vercel.` });
  }
  const centavos = Math.round((Number(valor) || 0) * 100);
  if (centavos <= 0) return res.status(400).json({ erro: "Valor inválido" });

  try {
    // ⚠️ Ajuste headers e body conforme a DOC da gateway escolhida.
    const r = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: centavos,
        currency: "BRL",
        description: descricao || "Cobrança",
        payment_method: "pix",
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ erro: "Gateway recusou", detalhe: data });

    // Devolve ao frontend o que ele precisa mostrar (QR Code / copia-e-cola).
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
