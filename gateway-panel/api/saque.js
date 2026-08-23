// ============================================================================
//  Vercel Serverless Function — solicita um saque/cashout (CentralPay).
//  Integração de saque: LofyPay.
//
//  SEGURANÇA: chaves só em process.env (Environment Variables da Vercel).
//  Autenticação: header x-api-key === CENTRALPAY_API_KEY.
// ============================================================================

import { autorizado } from "./_auth.js";

// Detecta o tipo de chave Pix. Valores conforme docs LofyPay (MAIÚSCULO):
// CPF · CNPJ · EMAIL · TELEFONE · EVP (aleatória).
function tipoChave(k) {
  const v = String(k || "").trim();
  const dig = v.replace(/\D/g, "");
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return "EMAIL";
  if (/^\d{11}$/.test(dig) && dig === v.replace(/[.\-]/g, "")) return "CPF";
  if (/^\d{14}$/.test(dig)) return "CNPJ";
  if (/^\+?\d{10,13}$/.test(dig) && dig.length >= 10 && dig.length <= 13) return "TELEFONE";
  return "EVP"; // chave aleatória
}

const ADAPTERS = {
  // --------------------------------------------------------------- LofyPay
  //  POST https://app.lofypay.com/api/v1/cashout
  //  body { amount, name, cpf, keypix, tipo_chave }
  lofypay: {
    envs: ["LOFYPAY_SECRET"],
    async cashout({ valor, keypix, nome, cpf, secret }) {
      const token = secret || process.env.LOFYPAY_SECRET;
      const r = await fetch("https://app.lofypay.com/api/v1/cashout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(valor),
          name: (nome || "Titular").slice(0, 80),
          cpf: (cpf || "").replace(/\D/g, ""),
          keypix: String(keypix).trim(),
          tipo_chave: tipoChave(keypix),
        }),
      });
      const d = await r.json().catch(() => ({}));
      // docs LofyPay: sucesso = d.success === true (200); id = withdrawalId; status = PROCESSING/PENDING_REVIEW…
      const ok = d.success === true || (r.ok && (d.withdrawalId || d.id));
      if (!ok) return { ok: false, status: r.status, erro: d.message || `${d.code || "Saque recusado"}`, raw: d };
      return { ok: true, id: d.withdrawalId || d.id || null, status: d.status || "PROCESSING", raw: d };
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Use POST" });
  if (!autorizado(req, res)) return;

  const { gateway, valor, keypix, nome, cpf, secret } = req.body || {};
  const adapter = ADAPTERS[gateway];
  if (!adapter) return res.status(400).json({ erro: "Saque disponível via API apenas para: lofypay" });
  if (!(Number(valor) > 0)) return res.status(400).json({ erro: "Valor inválido" });
  if (!keypix) return res.status(400).json({ erro: "Informe a chave Pix (keypix)" });

  const faltando = secret ? [] : adapter.envs.filter((e) => !process.env[e]);
  if (faltando.length) return res.status(400).json({ erro: `Configure na Vercel: ${faltando.join(", ")}` });

  try {
    const out = await adapter.cashout({ valor, keypix, nome, cpf, secret });
    if (!out.ok) return res.status(502).json({ erro: out.erro, detalhe: out.raw });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ erro: "Falha ao contatar a gateway", detalhe: String(e) });
  }
}
