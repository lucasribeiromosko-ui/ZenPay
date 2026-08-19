// ============================================================================
//  CentralPay — armazenamento REAL (sem dados fictícios).
//
//  Guarda no navegador (localStorage) apenas o que VOCÊ realmente fez pelo
//  painel: cobranças geradas e saques solicitados. O saldo e as estatísticas
//  são CALCULADOS a partir dessas movimentações reais — nada é inventado.
//
//  Uma cobrança só entra no "saldo disponível" depois de ser confirmada como
//  paga (botão "Verificar status" ou "Atualizar status", que chamam /api/status).
// ============================================================================
const STORE_KEY = "centralpay_dados_v1";

function _load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY));
    if (d && Array.isArray(d.movimentos) && Array.isArray(d.saques)) return d;
  } catch (e) {}
  return { movimentos: [], saques: [] };
}
function _save(d) { localStorage.setItem(STORE_KEY, JSON.stringify(d)); }

const _mesAtual = () => new Date().toISOString().slice(0, 7);   // "2026-08"
const _hoje = () => new Date().toISOString().slice(0, 10);      // "2026-08-19"

const DB = {
  movimentos() { return _load().movimentos; },
  saques() { return _load().saques; },

  addMovimento(m) {
    const d = _load();
    d.movimentos.unshift(m);
    _save(d);
  },
  patchMovimento(id, patch) {
    const d = _load();
    const m = d.movimentos.find((x) => x.id === id);
    if (m) { Object.assign(m, patch); _save(d); }
    return m;
  },
  addSaque(s) {
    const d = _load();
    d.saques.unshift(s);
    _save(d);
  },

  // Métricas reais derivadas das movimentações.
  metrics() {
    const d = _load();
    const mes = _mesAtual();
    let saldoDisponivel = 0, saldoPendente = 0, entrouMes = 0, vendasMes = 0, meds = 0;

    for (const m of d.movimentos) {
      const g = (typeof gwById === "function") ? gwById(m.gateway) : null;
      const liq = g ? calcularTaxas(g, m.valor).liquidoRecebido : m.valor;
      if (m.status === "pago") {
        saldoDisponivel += liq;
        if ((m.data || "").slice(0, 7) === mes) { entrouMes += m.valor; vendasMes++; }
      } else if (m.status === "pendente" || m.status === "aguardando pagamento") {
        saldoPendente += liq;
      } else if (m.status === "med") {
        meds++;
      }
    }

    let saiuMes = 0;
    for (const s of d.saques) {
      saldoDisponivel -= Number(s.valor) || 0;
      if ((s.data || "").slice(0, 7) === mes) saiuMes += Number(s.valor) || 0;
    }

    // Faturamento (recebido pago) por dia — últimos 14 dias.
    const dias = [];
    const base = new Date();
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(base); dt.setDate(base.getDate() - i);
      dias.push(dt.toISOString().slice(0, 10));
    }
    const faturamento = dias.map((dia) =>
      d.movimentos
        .filter((m) => m.status === "pago" && (m.data || "").slice(0, 10) === dia)
        .reduce((s, m) => s + (Number(m.valor) || 0), 0)
    );

    const totalGerados = d.movimentos.length;
    const pagos = d.movimentos.filter((m) => m.status === "pago").length;
    const aprovacao = totalGerados ? Math.round((pagos / totalGerados) * 100) : 0;

    return {
      saldoDisponivel: Math.max(0, saldoDisponivel),
      saldoPendente,
      entrouMes, saiuMes, vendasMes, meds,
      faturamento, totalGerados, pagos, aprovacao,
      temDados: totalGerados > 0 || d.saques.length > 0,
    };
  },
};

if (typeof module !== "undefined") module.exports = { DB };
