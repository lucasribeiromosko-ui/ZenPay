// ============================================================================
//  CentralPay — configuração das gateways (TAXAS REAIS)
//
//  taxaReceber      = % cobrado sobre cada pagamento recebido
//  taxaReceberFixa  = valor fixo (R$) somado por transação recebida
//  taxaSaque        = % cobrado sobre cada saque
//  taxaSaqueFixa    = valor fixo (R$) por saque
//  prazo            = quando o dinheiro fica disponível
//  min              = valor mínimo por cobrança (0 = sem mínimo)
//  limiteDiario     = teto de recebimento por dia (0 = sem limite)
//  liquidacao       = texto curto de como liquida
// ============================================================================
const GATEWAYS = [
  {
    id: "sharpify",
    nome: "Sharpify",
    cor: "#a855f7",
    taxaReceber: 1,          // 1% por transação
    taxaReceberFixa: 0.40,   // + R$0,40
    taxaSaque: 0,
    taxaSaqueFixa: 2.00,     // R$2,00 por saque
    prazo: "Na hora",
    min: 3.00,               // valor mínimo R$3,00
    limiteDiario: 1000000,   // limite por cobrança: R$1.000.000
    liquidacao: "100% automático — cai na hora",
    metodos: ["Pix"],
    resumoReceber: "1% + R$0,40",
    resumoSaque: "R$2,00 por saque",
  },
  {
    id: "lofypay",
    nome: "LofyPay",
    cor: "#8b5cf6",
    taxaReceber: 0,
    taxaReceberFixa: 0.50,   // R$0,50 fixo, descontado quando a venda é aprovada
    taxaSaque: 0,
    taxaSaqueFixa: 0.50,     // R$0,50 fixo por saque
    prazo: "Na hora",
    min: 0,
    limiteDiario: 0,
    liquidacao: "R$0,50 fixo — descontado na venda aprovada",
    metodos: ["Pix"],
    resumoReceber: "R$0,50 fixo",
    resumoSaque: "R$0,50 fixo",
  },
];

// Calcula o que sobra após taxas de recebimento e de saque.
function calcularTaxas(gateway, valorBruto) {
  const v = Number(valorBruto) || 0;
  const taxaReceber = v * (gateway.taxaReceber / 100) + gateway.taxaReceberFixa;
  const liquidoRecebido = Math.max(0, v - taxaReceber);
  const taxaSaque = liquidoRecebido * (gateway.taxaSaque / 100) + gateway.taxaSaqueFixa;
  const liquidoFinal = Math.max(0, liquidoRecebido - taxaSaque);
  return { bruto: v, taxaReceber, liquidoRecebido, taxaSaque, liquidoFinal };
}

// Valida se um valor respeita mínimo/limite da gateway. Retorna null se ok,
// ou uma string com o motivo do bloqueio.
function validarValor(gateway, valorBruto) {
  const v = Number(valorBruto) || 0;
  if (v <= 0) return "Digite um valor maior que zero.";
  if (gateway.min && v < gateway.min)
    return `${gateway.nome}: valor mínimo é ${money(gateway.min)}.`;
  if (gateway.limiteDiario && v > gateway.limiteDiario)
    return `${gateway.nome}: limite por cobrança é ${money(gateway.limiteDiario)}.`;
  return null;
}

const money = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

if (typeof module !== "undefined")
  module.exports = { GATEWAYS, calcularTaxas, validarValor, money };
