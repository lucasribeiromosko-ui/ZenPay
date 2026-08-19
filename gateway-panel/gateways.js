// ============================================================================
//  Configuração das gateways
//  As taxas abaixo são PLACEHOLDERS — troque pelos valores REAIS de cada
//  gateway (você acha na página de taxas / na dashboard de cada uma).
//
//  taxaReceber      = % cobrado sobre cada pagamento recebido
//  taxaReceberFixa  = valor fixo (R$) somado por transação
//  taxaSaque        = % cobrado sobre cada saque
//  taxaSaqueFixa    = valor fixo (R$) por saque
//  prazo            = prazo de liberação do dinheiro
// ============================================================================
// Gateways integradas (LofyPay + Sharpify). As TAXAS são placeholders —
// ajuste com os valores reais do seu contrato de cada gateway.
const GATEWAYS = [
  { id: "lofypay",  nome: "LofyPay",  cor: "#8b5cf6", taxaReceber: 4.99, taxaReceberFixa: 0.49, taxaSaque: 1.50, taxaSaqueFixa: 3.67, prazo: "D+2", metodos: ["Pix"] },
  { id: "sharpify", nome: "Sharpify", cor: "#a855f7", taxaReceber: 3.99, taxaReceberFixa: 0.39, taxaSaque: 1.99, taxaSaqueFixa: 2.50, prazo: "D+1", metodos: ["Pix"] },
];

// Calcula o que o cliente recebe e o que sobra após taxas.
function calcularTaxas(gateway, valorBruto) {
  const v = Number(valorBruto) || 0;
  const taxaReceber = v * (gateway.taxaReceber / 100) + gateway.taxaReceberFixa;
  const liquidoRecebido = Math.max(0, v - taxaReceber);
  const taxaSaque = liquidoRecebido * (gateway.taxaSaque / 100) + gateway.taxaSaqueFixa;
  const liquidoFinal = Math.max(0, liquidoRecebido - taxaSaque);
  return {
    bruto: v,
    taxaReceber,
    liquidoRecebido,
    taxaSaque,
    liquidoFinal,
  };
}

const money = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

if (typeof module !== "undefined") module.exports = { GATEWAYS, calcularTaxas, money };
