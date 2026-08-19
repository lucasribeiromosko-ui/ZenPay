// ============================================================================
//  Dados de DEMONSTRAÇÃO.
//  Quando você conectar as gateways de verdade (via /api), estes valores
//  serão substituídos pelas respostas reais das APIs. Ver README.
// ============================================================================
const DEMO = {
  saldoDisponivel: 8421.57,
  saldoPendente: 1290.00,
  entrouMes: 14730.90,
  saiuMes: 6120.00,
  vendasMes: 38,

  // faturamento dos últimos 14 dias (para o gráfico)
  faturamento: [210, 340, 180, 520, 610, 430, 700, 560, 880, 640, 910, 1020, 760, 1180],

  // pagamentos recentes
  pagamentos: [
    { id: "TX-10293", data: "2026-08-19 14:22", pagador: "Empresa Alpha LTDA", gateway: "lofypay",   valor: 1200.00, status: "pago" },
    { id: "TX-10292", data: "2026-08-19 11:07", pagador: "João P. (MEI)",       gateway: "goatpay",   valor: 350.00,  status: "pago" },
    { id: "TX-10291", data: "2026-08-18 19:41", pagador: "Studio Beta",         gateway: "sharpify",  valor: 2400.00, status: "pago" },
    { id: "TX-10290", data: "2026-08-18 16:15", pagador: "Marina Souza",        gateway: "dominipay", valor: 180.00,  status: "med" },
    { id: "TX-10289", data: "2026-08-18 09:58", pagador: "Loja Gamma",          gateway: "lofypay",   valor: 890.00,  status: "pago" },
    { id: "TX-10288", data: "2026-08-17 22:03", pagador: "Delta Servicos",      gateway: "bravopay",  valor: 1500.00, status: "pago" },
    { id: "TX-10287", data: "2026-08-17 15:30", pagador: "Pedro Almeida",       gateway: "goatpay",   valor: 260.00,  status: "pendente" },
    { id: "TX-10286", data: "2026-08-16 12:44", pagador: "Agência Zeta",        gateway: "sharpify",  valor: 3200.00, status: "pago" },
  ],

  saques: [
    { id: "SQ-402", data: "2026-08-15", valor: 3000.00, status: "pago" },
    { id: "SQ-401", data: "2026-08-08", valor: 2500.00, status: "pago" },
  ],
};

if (typeof module !== "undefined") module.exports = { DEMO };
