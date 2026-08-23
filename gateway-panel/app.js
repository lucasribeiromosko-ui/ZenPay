// ============================================================================
//  CentralPay — painel (frontend). Chamadas reais via /api/* (serverless).
//  A chave de acesso (CENTRALPAY_API_KEY) fica no navegador (localStorage) e vai
//  no header x-api-key. Nunca coloque chave de GATEWAY aqui — essas ficam só na
//  Vercel (Environment Variables), lidas pelas funções /api.
// ============================================================================
const gwById = (id) => GATEWAYS.find((g) => g.id === id) || GATEWAYS[0];
const view = () => document.getElementById("view");

const PAGES = {
  inicio:       { title: "Início",           sub: "Visão geral da sua operação" },
  estatisticas: { title: "Estatísticas",     sub: "Histórico, pagadores e desempenho" },
  carteira:     { title: "Carteira",         sub: "Saldo e saques" },
  gerar:        { title: "Gerar pagamento",  sub: "Escolha a gateway e veja as taxas" },
  lofys:        { title: "Central Lofy",      sub: "Suas contas LofyPay em um só lugar" },
  api:          { title: "API & Docs",       sub: "Integre e teste em Python" },
};

// -------------------------------------------------------------- API helpers
const getKey = () => localStorage.getItem("centralpay_key") || "";
async function api(path, body) {
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": getKey() },
      body: JSON.stringify(body || {}),
    });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok && !d.erro, status: r.status, d };
  } catch (e) {
    return { ok: false, status: 0, d: { erro: "Erro de conexão", detalhe: String(e) } };
  }
}

// ----------------------------------------------------------------- toasts
function toast(title, type = "", sub = "") {
  const box = document.getElementById("toasts");
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.innerHTML = `<b>${title}</b>${sub ? `<small>${sub}</small>` : ""}`;
  box.appendChild(t);
  setTimeout(() => { t.style.transition = "opacity .3s,transform .3s"; t.style.opacity = "0"; t.style.transform = "translateX(30px)"; setTimeout(() => t.remove(), 300); }, 4200);
}

// ------------------------------------------------------------ count-up anim
function countUp(node) {
  const to = parseFloat(node.dataset.to) || 0;
  const isMoney = node.dataset.money === "1";
  const dur = 900, start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    const v = to * (1 - Math.pow(1 - p, 3));
    node.textContent = isMoney ? money(v) : Math.round(v).toLocaleString("pt-BR");
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const runCountUps = () => view().querySelectorAll("[data-to]").forEach(countUp);

// -------------------------------------------------------------- gráfico
function chartSVG(values) {
  const w = 760, h = 190, pad = 8;
  const max = Math.max(...values, 1);
  const bw = (w - pad * 2) / values.length;
  const bars = values.map((v, i) => {
    const bh = Math.max(3, (v / max) * (h - 26));
    const x = pad + i * bw + bw * 0.16, y = h - bh - 6;
    return `<rect class="bar" style="animation-delay:${i * 45}ms" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.68).toFixed(1)}" height="${bh.toFixed(1)}" rx="5"></rect>`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#6d28d9" stop-opacity=".4"/></linearGradient>
      <linearGradient id="pgh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e9d5ff"/><stop offset="100%" stop-color="#8b5cf6" stop-opacity=".6"/></linearGradient>
    </defs>${bars}</svg>`;
}
const statusBadge = (s) => `<span class="badge ${s}">${({ pago: "Pago", pendente: "Pendente", med: "MED / contestado" })[s] || s}</span>`;

// ============================================================ TELA: INÍCIO
function renderInicio() {
  const m = DB.metrics();
  const movs = DB.movimentos();
  const temPendentes = movs.some((x) => x.status === "pendente" || x.status === "aguardando pagamento");
  view().innerHTML = `
    <div class="grid cols-4">
      ${statCard("◈", "Saldo disponível", m.saldoDisponivel, "confirmado e pronto p/ saque", "up", true)}
      ${statCard("↗", "Entrou (mês)", m.entrouMes, "vendas pagas no mês", "up")}
      ${statCard("↙", "Saiu (mês)", m.saiuMes, "saques solicitados", "down")}
      ${statCard("✦", "Vendas (mês)", m.vendasMes, "pagamentos confirmados", "up", false, false)}
    </div>
    <div class="section-title"><h2>Faturamento — últimos 14 dias</h2>
      ${temPendentes ? `<button class="btn ghost" style="padding:7px 12px;font-size:13px" onclick="atualizarTodos(this)">↻ Atualizar status</button>` : `<span class="hint">recebido por dia</span>`}
    </div>
    <div class="card">${chartSVG(m.faturamento)}<div class="legend"><span class="li">Recebido por dia (pago)</span></div></div>
    <div class="section-title"><h2>Pagamentos recentes</h2>${movs.length ? `<a data-route="estatisticas" class="hint">ver todos →</a>` : ""}</div>
    ${movs.length ? `<div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Descrição / Cliente</th><th>Gateway</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody>${movs.slice(0, 6).map(rowPag).join("")}</tbody>
    </table></div>` : emptyState("Nenhuma cobrança ainda", "Gere sua primeira cobrança em <b>Gerar pagamento</b>. O que você criar aparece aqui — com dados reais.", "gerar", "＋ Gerar pagamento")}`;
  runCountUps();
}
function emptyState(titulo, texto, rota, btn) {
  return `<div class="card empty"><div class="empty-ic">◇</div><h3>${titulo}</h3><p>${texto}</p>${rota ? `<button class="btn" data-route="${rota}">${btn}</button>` : ""}</div>`;
}
function statCard(ic, label, val, delta, dir, glow = false, isMoney = true) {
  return `<div class="card stat ${glow ? "glow" : ""}"><div class="ic">${ic}</div>
    <div class="label">${label}</div>
    <div class="value" data-to="${val}" data-money="${isMoney ? 1 : 0}">${isMoney ? "R$ 0,00" : "0"}</div>
    <div class="delta ${dir}">${delta}</div></div>`;
}
function statusKey(s) {
  const t = String(s || "").toLowerCase();
  if (/pago|paid|approved/.test(t)) return "pago";
  if (/med|contest|charge|refund/.test(t)) return "med";
  if (/cancel|expир|expired|falh|fail/.test(t)) return "cancelado";
  return "pendente";
}
function idCurto(id) { const s = String(id || "—"); return s.length > 14 ? s.slice(0, 6) + "…" + s.slice(-4) : s; }
function rowPag(p) {
  const g = gwById(p.gateway);
  const desc = p.descricao || p.pagador || "—";
  return `<tr><td class="gtag" title="${p.id || ""}">${idCurto(p.id)}</td><td>${desc}</td>
    <td><span class="gdot" style="background:${g.cor}"></span>${g.nome}</td>
    <td class="num">${money(p.valor)}</td><td>${statusBadge(statusKey(p.status))}</td></tr>`;
}

// ====================================================== TELA: ESTATÍSTICAS
function renderEstatisticas() {
  const m = DB.metrics();
  const movs = DB.movimentos();
  const ticket = m.pagos ? m.entrouMes / (m.vendasMes || m.pagos) : 0;
  view().innerHTML = `
    <div class="grid cols-3">
      ${statCard("◎", "Ticket médio", ticket, "por venda paga", "up")}
      <div class="card stat"><div class="label">Aprovação</div><div class="value" data-to="${m.aprovacao}" data-money="0">0</div><div class="delta up">% pagos / gerados</div></div>
      <div class="card stat"><div class="label">Contestações (MED)</div><div class="value" data-to="${m.meds}" data-money="0">0</div><div class="delta down">no período</div></div>
    </div>
    <div class="section-title"><h2>Consultar cobrança</h2><span class="hint">descrição, cliente ou ID</span></div>
    <div class="card"><div class="field" style="margin:0"><input id="busca" placeholder="Ex.: Pedido #1, ID da transação…" oninput="filtrarPag()"></div></div>
    <div class="section-title"><h2>Histórico de pagamentos</h2>
      <select id="periodo" onchange="filtrarPag()" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);padding:8px 12px;border-radius:10px;font-size:13px">
        <option value="all">Todo o período</option><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option></select>
    </div>
    ${movs.length ? `<div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Data</th><th>Descrição / Cliente</th><th>Gateway</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody id="tb">${movs.map(rowPagFull).join("")}</tbody></table></div>`
      : emptyState("Sem pagamentos no histórico", "Assim que você gerar cobranças, elas aparecem aqui com dados reais.", "gerar", "＋ Gerar pagamento")}`;
  runCountUps();
}
function rowPagFull(p) {
  const g = gwById(p.gateway);
  const desc = (p.descricao || p.pagador || "—");
  const dia = (p.data || "").slice(0, 10);
  return `<tr data-n="${desc.toLowerCase()}" data-i="${String(p.id || "").toLowerCase()}" data-d="${dia}">
    <td class="gtag" title="${p.id || ""}">${idCurto(p.id)}</td><td class="muted">${dia || "—"}</td><td>${desc}</td>
    <td><span class="gdot" style="background:${g.cor}"></span>${g.nome}</td>
    <td class="num">${money(p.valor)}</td><td>${statusBadge(statusKey(p.status))}</td></tr>`;
}
function filtrarPag() {
  const q = (document.getElementById("busca")?.value || "").toLowerCase().trim();
  const per = document.getElementById("periodo")?.value || "all";
  view().querySelectorAll("#tb tr").forEach((tr) => {
    const okT = !q || tr.dataset.n.includes(q) || tr.dataset.i.includes(q);
    let okP = true;
    const hoje = new Date().toISOString().slice(0, 10);
    const seteAtras = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
    if (per === "hoje") okP = tr.dataset.d === hoje;
    else if (per === "7") okP = tr.dataset.d >= seteAtras;
    tr.style.display = okT && okP ? "" : "none";
  });
}

// =========================================================== TELA: CARTEIRA
function renderCarteira() {
  const m = DB.metrics();
  const saques = DB.saques();
  view().innerHTML = `
    <div class="grid cols-2">
      ${statCard("◈", "Saldo disponível", m.saldoDisponivel, "confirmado (pago) − saques", "up", true)}
      ${statCard("◷", "Saldo pendente", m.saldoPendente, "cobranças ainda não pagas", "down")}
    </div>
    <div class="section-title"><h2>Solicitar saque</h2></div>
    <div class="grid cols-2">
      <div class="card">
        <div class="field"><label>Valor do saque</label><input id="sqValor" type="number" min="0" step="0.01" placeholder="0,00" oninput="calcSaque()"></div>
        <div class="field"><label>Chave Pix de destino</label><input id="sqPix" placeholder="CPF / e-mail / telefone / aleatória"></div>
        <div class="grid cols-2" style="gap:12px">
          <div class="field"><label>Nome do titular</label><input id="sqNome" placeholder="Nome completo"></div>
          <div class="field"><label>CPF do titular</label><input id="sqCpf" placeholder="Somente números"></div>
        </div>
        <div class="field"><label>Sacar pela gateway</label><select id="sqGw" onchange="calcSaque()">${GATEWAYS.map(g => `<option value="${g.id}">${g.nome} — saque ${g.resumoSaque}</option>`).join("")}</select></div>
        <button class="btn block" id="sqBtn" onclick="pedirSaque()">Solicitar saque</button>
      </div>
      <div class="card">
        <div class="section-title" style="margin:0 0 10px"><h2 style="font-size:15px">Resumo</h2></div>
        <div class="breakdown" id="sqBreak"><p class="muted center" style="padding:22px 0">Digite um valor para ver a taxa e o líquido.</p></div>
      </div>
    </div>
    <div class="section-title"><h2>Histórico de saques</h2></div>
    ${saques.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Data</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody>${saques.map(s => `<tr><td class="gtag" title="${s.id || ""}">${idCurto(s.id)}</td><td class="muted">${(s.data || "").slice(0,10)}</td><td class="num">${money(s.valor)}</td><td>${statusBadge(statusKey(s.status))}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="card"><p class="muted center" style="padding:20px 0">Nenhum saque solicitado ainda.</p></div>`}`;
  runCountUps();
}
function calcSaque() {
  const val = parseFloat(document.getElementById("sqValor").value) || 0;
  const g = gwById(document.getElementById("sqGw").value);
  const taxa = val * (g.taxaSaque / 100) + g.taxaSaqueFixa;
  document.getElementById("sqBreak").innerHTML = `
    <div class="brow"><span class="k">Valor solicitado</span><span class="v">${money(val)}</span></div>
    <div class="brow neg"><span class="k">Taxa de saque (${g.nome})</span><span class="v">- ${money(taxa)}</span></div>
    <div class="brow total"><span class="k">Você recebe</span><span class="v">${money(Math.max(0, val - taxa))}</span></div>`;
}
async function pedirSaque() {
  const val = parseFloat(document.getElementById("sqValor").value) || 0;
  const pix = document.getElementById("sqPix").value.trim();
  const g = document.getElementById("sqGw").value;
  if (val <= 0) return toast("Valor inválido", "err", "Digite o valor do saque.");
  if (!pix) return toast("Falta a chave Pix", "err", "Informe a chave de destino.");
  const btn = document.getElementById("sqBtn"); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Processando…`;
  const { ok, d } = await api("/api/saque", {
    gateway: g, valor: val, keypix: pix,
    nome: document.getElementById("sqNome").value.trim(),
    cpf: document.getElementById("sqCpf").value.trim(),
  });
  btn.disabled = false; btn.textContent = "Solicitar saque";
  if (ok) {
    DB.addSaque({ id: d.id || ("SAQ-" + Date.now()), gateway: g, valor: val, keypix: pix, status: d.status || "processando", data: new Date().toISOString() });
    toast("Saque solicitado ✅", "ok", `${money(val)} • ${d.status || "processando"}`);
    renderCarteira();
  } else {
    toast("Não foi possível sacar", "err", d.erro || "Verifique a chave de acesso e as configs.");
  }
}

// ==================================================== TELA: GERAR PAGAMENTO
let gwSel = GATEWAYS[0].id;
function renderGerar() {
  view().innerHTML = `
    <div class="grid cols-2">
      <div class="card">
        <div class="field" style="margin-bottom:20px"><label>Escolha a gateway</label><div class="gw-grid" id="gwGrid">${GATEWAYS.map(gwCard).join("")}</div></div>
        <div class="field"><label>Valor da cobrança (R$)</label><input id="pgValor" type="number" min="0" step="0.01" placeholder="0,00" oninput="calcGerar()"></div>
        <div class="field"><label>Descrição (opcional)</label><input id="pgDesc" placeholder="Ex.: Desenvolvimento de site institucional"></div>
        <div class="field"><label>Cliente (opcional)</label><input id="pgCliente" placeholder="Nome do pagador — ajuda na conciliação/MED"></div>
        <button class="btn block" id="pgBtn" onclick="gerarPagamento()">⚡ Gerar cobrança</button>
      </div>
      <div class="card glow">
        <div class="section-title" style="margin:0 0 10px"><h2 style="font-size:15px">Detalhamento das taxas</h2><span class="hint" id="gwLabel"></span></div>
        <div class="breakdown" id="pgBreak"></div>
      </div>
    </div>
    <div id="pgResult" style="margin-top:18px"></div>`;
  selGw(gwSel);
}
function gwCard(g) {
  const limites = [];
  if (g.min) limites.push(`mín. ${money(g.min)}`);
  if (g.limiteDiario) limites.push(`até ${money(g.limiteDiario)} por cobrança`);
  return `<div class="gw ${g.id === gwSel ? "sel" : ""}" data-id="${g.id}" onclick="selGw('${g.id}')">
    <span class="gw-check">✓</span>
    <div class="gw-head"><span class="dot" style="background:${g.cor}"></span><span class="nome">${g.nome}</span><span class="prazo">⚡ ${g.prazo}</span></div>
    <div class="gw-fees">
      <div class="gw-fee"><span class="lbl">Para receber</span><span class="val">${g.resumoReceber}</span></div>
      <div class="gw-fee"><span class="lbl">Para sacar</span><span class="val">${g.resumoSaque}</span></div>
    </div>
    <div class="gw-note">${g.liquidacao}</div>
    ${limites.length ? `<div class="gw-limits">${limites.map(l => `<span class="chip">${l}</span>`).join("")}</div>` : ""}
  </div>`;
}
function selGw(id) {
  gwSel = id;
  view().querySelectorAll("#gwGrid .gw").forEach((c) => c.classList.toggle("sel", c.dataset.id === id));
  document.getElementById("gwLabel").textContent = gwById(id).nome;
  calcGerar();
}
function feeLabel(pct, fixa) {
  if (pct && fixa) return `${pct}% + ${money(fixa)}`;
  if (pct) return `${pct}%`;
  return `${money(fixa)} fixo`;
}
function calcGerar() {
  const val = parseFloat(document.getElementById("pgValor")?.value) || 0;
  const g = gwById(gwSel), t = calcularTaxas(g, val);
  const aviso = val > 0 ? validarValor(g, val) : null;
  document.getElementById("pgBreak").innerHTML = `
    <div class="brow"><span class="k">Valor da cobrança</span><span class="v">${money(t.bruto)}</span></div>
    <div class="brow neg"><span class="k">Taxa p/ receber (${feeLabel(g.taxaReceber, g.taxaReceberFixa)})</span><span class="v">- ${money(t.taxaReceber)}</span></div>
    <div class="brow"><span class="k">Cai na sua conta</span><span class="v">${money(t.liquidoRecebido)}</span></div>
    <div class="brow neg"><span class="k">Taxa p/ sacar (${feeLabel(g.taxaSaque, g.taxaSaqueFixa)})</span><span class="v">- ${money(t.taxaSaque)}</span></div>
    <div class="brow total"><span class="k">Líquido final (após sacar)</span><span class="v">${money(t.liquidoFinal)}</span></div>
    ${aviso ? `<div class="brow warn"><span class="k">⚠️ ${aviso}</span></div>` : ""}`;
}
const qrSrc = (q) => (/^(https?:|data:)/.test(q) ? q : "data:image/png;base64," + q);
async function gerarPagamento() {
  const val = parseFloat(document.getElementById("pgValor").value) || 0;
  const g = gwById(gwSel);
  const aviso = validarValor(g, val);
  if (aviso) return toast("Valor inválido", "err", aviso);
  const btn = document.getElementById("pgBtn"); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Gerando…`;
  const box = document.getElementById("pgResult");
  const { ok, d } = await api("/api/gerar", {
    gateway: g.id, valor: val,
    descricao: document.getElementById("pgDesc").value.trim(),
    pagador: document.getElementById("pgCliente").value.trim(),
  });
  btn.disabled = false; btn.innerHTML = "⚡ Gerar cobrança";
  if (!ok) {
    box.innerHTML = "";
    return toast("Não foi possível gerar", "err", d.erro || "Verifique a chave de acesso e as configs da Vercel.");
  }
  DB.addMovimento({
    id: d.id || ("TX-" + Date.now()), gateway: g.id, valor: val,
    descricao: document.getElementById("pgDesc").value.trim(),
    pagador: document.getElementById("pgCliente").value.trim(),
    status: "pendente", code: d.code || null, link: d.link || null,
    data: new Date().toISOString(),
  });
  toast("Cobrança gerada ✅", "ok", `${g.nome} • ${money(val)}`);
  box.innerHTML = `<div class="card glow">
    <div class="section-title" style="margin:0 0 16px"><h2 style="font-size:16px">✅ Cobrança gerada — ${g.nome}</h2><span class="gtag">${d.id || ""}</span></div>
    <div class="pixbox">
      ${d.qr ? `<div class="qr"><img src="${qrSrc(d.qr)}" alt="QR Code Pix"></div>` : ""}
      <div style="flex:1;min-width:240px">
        ${d.code ? `<div class="field" style="margin:0 0 12px"><label>Pix copia-e-cola</label><div class="copyrow"><input id="pixCode" readonly value="${d.code}"><button class="btn ghost" onclick="copyPix()">Copiar</button></div></div>` : ""}
        ${d.link ? `<a class="btn block" href="${d.link}" target="_blank" rel="noopener" style="margin-bottom:10px">Abrir link de pagamento</a>` : ""}
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn ghost" onclick="verificarStatus('${g.id}','${d.id}')">Verificar status</button>
          <span class="muted" id="stStatus" style="font-size:13px">Status: <b>${d.status || "aguardando"}</b></span>
        </div>
      </div>
    </div></div>`;
}
function copyPix() {
  const i = document.getElementById("pixCode"); i.select();
  navigator.clipboard?.writeText(i.value).then(() => toast("Copiado!", "ok", "Pix copia-e-cola na área de transferência.")).catch(() => {});
}
async function verificarStatus(gateway, id) {
  if (!id) return;
  const el = document.getElementById("stStatus");
  if (el) el.innerHTML = `<span class="spinner" style="display:inline-block;width:12px;height:12px"></span> consultando…`;
  const { ok, d } = await api("/api/status", { gateway, id });
  if (el) el.innerHTML = ok ? `Status: <b>${d.status || "?"}</b>` : `Status: <b>—</b>`;
  if (ok && d.status) {
    DB.patchMovimento(id, { status: statusKey(d.status) });
    if (/pa(id|go)|approved|paid_out/i.test(d.status)) toast("Pagamento confirmado! 🎉", "ok", "Saldo atualizado.");
  }
  return ok ? statusKey(d.status) : null;
}
// Atualiza o status de todas as cobranças pendentes de uma vez.
async function atualizarTodos(btn) {
  const pend = DB.movimentos().filter((x) => x.status === "pendente" || x.status === "aguardando pagamento");
  if (!pend.length) return toast("Nada pendente", "", "Não há cobranças aguardando confirmação.");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Atualizando…`; }
  let confirmados = 0;
  for (const m of pend) {
    const s = await verificarStatus(m.gateway, m.id);
    if (s === "pago") confirmados++;
  }
  toast("Status atualizado", "ok", confirmados ? `${confirmados} pagamento(s) confirmado(s).` : "Nenhuma mudança.");
  renderInicio();
}

// ========================================================= TELA: API & DOCS
function renderApi() {
  const base = location.origin;
  view().innerHTML = `
    <div class="card">
      <div class="section-title" style="margin:0 0 10px"><h2 style="font-size:16px">Sua API</h2><span class="hint">para gerar pagamentos e consultar via Python</span></div>
      <div class="brow"><span class="k">Base URL</span><span class="v gtag">${base}</span></div>
      <div class="brow"><span class="k">Autenticação</span><span class="v">header <code>x-api-key: SUA_CHAVE</code></span></div>
      <div class="brow"><span class="k">POST /api/gerar</span><span class="v muted">cria cobrança Pix</span></div>
      <div class="brow"><span class="k">POST /api/status</span><span class="v muted">consulta status de um pagamento</span></div>
      <div class="brow"><span class="k">POST /api/saque</span><span class="v muted">solicita saque (LofyPay)</span></div>
      <p class="note">🔑 Defina <code>CENTRALPAY_API_KEY</code> nas Environment Variables da Vercel e use o mesmo valor no seu Python (e na barra lateral do painel).</p>
    </div>
    <div class="section-title"><h2>Exemplo em Python</h2><span class="hint">requests</span></div>
    <div class="card"><pre style="margin:0;overflow-x:auto;font-family:var(--mono);font-size:13px;line-height:1.6;color:#d7d2f0">${pyExample(base)}</pre></div>
    <div class="section-title"><h2>cURL</h2></div>
    <div class="card"><pre style="margin:0;overflow-x:auto;font-family:var(--mono);font-size:13px;line-height:1.6;color:#d7d2f0">curl -X POST ${base}/api/gerar \\
  -H "x-api-key: SUA_CHAVE" -H "Content-Type: application/json" \\
  -d '{"gateway":"lofypay","valor":10.00,"descricao":"Teste"}'</pre></div>
    <p class="note">O arquivo <code>centralpay.py</code> (no repositório) já traz um cliente pronto — importa e usa direto.</p>`;
}
function pyExample(base) {
  return `import requests

BASE = "${base}"
KEY  = "SUA_CHAVE"   # a mesma CENTRALPAY_API_KEY da Vercel
H = {"x-api-key": KEY, "Content-Type": "application/json"}

# 1) gerar um pagamento Pix
r = requests.post(f"{BASE}/api/gerar",
    json={"gateway": "lofypay", "valor": 10.00, "descricao": "Pedido #1"}, headers=H)
p = r.json()
print("Pix:", p.get("code"))       # copia-e-cola
print("ID :", p.get("id"))

# 2) consultar o status
s = requests.post(f"{BASE}/api/status",
    json={"gateway": "lofypay", "id": p["id"]}, headers=H).json()
print("Status:", s.get("status"))`.replace(/</g, "&lt;");
}

// ====================================================== TELA: CENTRAL LOFY
//  Gerenciador multi-conta LofyPay. As contas (nome + 2 secret keys) ficam
//  SÓ no navegador (localStorage) — nunca no repositório. A chave selecionada
//  é enviada por requisição pra função /api, que a usa pra falar com a LofyPay.
const LOFY_KEY = "centralpay_lofys";
function getLofys() { try { return JSON.parse(localStorage.getItem(LOFY_KEY)) || []; } catch (e) { return []; } }
function saveLofys(arr) { localStorage.setItem(LOFY_KEY, JSON.stringify(arr)); pushContas(arr); }

// --- sincronização na nuvem (compartilhada com o sócio) ---
let _syncOn = false; // vira true quando o servidor tem sync (KV) configurado
async function pushSync(store, data) {
  const { ok } = await api("/api/sync", { store, data });
  if (ok) _syncOn = true;
  return ok;
}
async function pullSync(store) {
  const { ok, d } = await api("/api/sync", { store });
  if (ok) _syncOn = true;
  return { ok, data: ok ? d.data : null };
}

// contas Lofy
async function pushContas(arr) { pushSync("contas", arr); }
async function pullContas() {
  const { ok, data } = await pullSync("contas");
  if (!ok) return;
  if (Array.isArray(data)) {
    localStorage.setItem(LOFY_KEY, JSON.stringify(data));
    if (currentRoute === "lofys") renderLofys(true);
  } else {
    // servidor nunca teve contas (null): sobe as locais nesta 1ª sincronização
    const local = getLofys();
    if (local.length) pushSync("contas", local);
  }
}

// histórico (movimentos + saques) — merge por id pra não sobrescrever o do sócio
function mergeById(local, remote) {
  const map = {};
  (remote || []).forEach((x) => { if (x && x.id) map[x.id] = x; });
  (local || []).forEach((x) => {
    if (!x || !x.id) return;
    const ex = map[x.id];
    if (!ex) map[x.id] = x;
    else if (x.status === "pago" && ex.status !== "pago") map[x.id] = x; // mantém o "pago"
  });
  return Object.values(map);
}
async function pushDados(d) { pushSync("dados", d || DB.snapshot()); }
async function pullDados() {
  const { ok, data } = await pullSync("dados");
  if (!ok) return;
  if (!data) {
    // servidor nunca teve histórico: sobe o local nesta 1ª sincronização
    const local = DB.snapshot();
    if (local.movimentos.length || local.saques.length) pushSync("dados", local);
    return;
  }
  const local = DB.snapshot();
  const merged = {
    movimentos: mergeById(local.movimentos, data.movimentos || []),
    saques: mergeById(local.saques, data.saques || []),
  };
  DB.hydrate(merged);
  // se o merge acrescentou algo que não estava no servidor, devolve a união
  if (merged.movimentos.length > (data.movimentos || []).length ||
      merged.saques.length > (data.saques || []).length) {
    pushSync("dados", merged);
  }
  rerenderCurrent();
}
function lofyById(id) { return getLofys().find((c) => c.id === id); }
const maskKey = (k) => { const s = String(k || ""); return s.length > 8 ? s.slice(0, 4) + "••••" + s.slice(-4) : "••••"; };

// cache dos saldos consultados (por conta), no navegador
const SALDO_KEY = "centralpay_saldos";
function getSaldos() { try { return JSON.parse(localStorage.getItem(SALDO_KEY)) || {}; } catch (e) { return {}; } }
function setSaldo(id, valor) { const s = getSaldos(); s[id] = { valor, ts: Date.now() }; localStorage.setItem(SALDO_KEY, JSON.stringify(s)); }
function saldoDe(id) { const s = getSaldos()[id]; return s ? s.valor : null; }
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const LIMITE_POR_CONTA = 500; // R$ por conta
function lofyCapBar(contas) {
  const total = contas.length * LIMITE_POR_CONTA;
  const hoje = new Date().toISOString().slice(0, 10);
  const usado = DB.movimentos()
    .filter((m) => m.gateway === "lofypay" && m.status === "pago" && (m.data || "").slice(0, 10) === hoje)
    .reduce((s, m) => s + (Number(m.valor) || 0), 0);
  const pct = total ? Math.min(100, (usado / total) * 100) : 0;
  const restante = Math.max(0, total - usado);
  return `<div class="cap-card">
    <div class="cap-head">
      <div>
        <div class="cap-label">Capacidade de movimentação hoje</div>
        <div class="cap-total">${money(usado)} <span>/ ${money(total)}</span></div>
      </div>
      <div class="cap-side">
        <div class="cap-meta">${contas.length} conta(s) × ${money(LIMITE_POR_CONTA)}</div>
        <div class="cap-rest">${money(restante)} disponível</div>
      </div>
    </div>
    <div class="cap-track"><div class="cap-fill" style="width:${pct}%"></div></div>
  </div>`;
}
function renderLofys(skipPull) {
  const contas = getLofys();
  if (!skipPull) pullContas();   // busca a versão compartilhada e re-renderiza
  view().innerHTML = `
    ${lofyCapBar(contas)}
    <div class="section-title"><h2>Suas contas LofyPay</h2>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="hint">${contas.length} conta(s) • ${_syncOn ? "☁️ sincronizado" : "local"}</span>
        <button class="btn ghost" style="padding:7px 12px;font-size:13px" onclick="atualizarPainel(this)">↻ Atualizar</button>
      </div>
    </div>
    ${contas.length ? "" : `<p class="note" style="margin:0 0 14px">Você ainda não tem contas. Clique em <b>＋ Adicionar conta</b> e cole a Secret Key da sua LofyPay.</p>`}
    <div class="lofy-grid">
      ${contas.map(lofyCard).join("")}
      <div class="lofy-card add" onclick="abrirFormLofy()">
        <div class="plus">＋</div><div class="add-t">Adicionar conta</div>
        <div class="add-sub">nome + Secret Key</div>
      </div>
    </div>
    <p class="note" style="margin-top:18px">${_syncOn
      ? "☁️ As contas ficam salvas na nuvem e são compartilhadas — você e seu sócio veem as mesmas contas."
      : "🔒 As chaves ficam neste navegador. Para compartilhar com seu sócio, ative a sincronização (KV) na Vercel — veja a aba API & Docs."}</p>`;
}
function lofyCard(c) {
  return `<div class="lofy-card" onclick="abrirLofy('${c.id}')" title="Abrir ${esc(c.nome)}">
    <div class="lofy-actions">
      <button class="lofy-ico" title="Editar conta" onclick="event.stopPropagation();abrirFormLofy('${c.id}')">✎</button>
      <button class="lofy-ico del" title="Remover conta" onclick="event.stopPropagation();removerLofy('${c.id}')">✕</button>
    </div>
    <div class="lofy-logo">L</div>
    <div class="lofy-nome">${esc(c.nome)}</div>
    <div class="lofy-key">${maskKey(c.key1)}</div>
    ${lofySaldoLinha(c.id)}
    <div class="lofy-open">Gerar cobrança &nbsp;•&nbsp; Sacar &nbsp;→</div>
  </div>`;
}
function lofySaldoLinha(id) {
  const s = saldoDe(id);
  if (s == null)
    return `<button class="saldo-btn" onclick="event.stopPropagation();consultarSaldo('${id}')">💰 Consultar saldo</button>`;
  return `<div class="saldo-box">
    <span class="saldo-val">${money(s)}</span>
    <button class="saldo-refresh" title="Atualizar saldo" onclick="event.stopPropagation();consultarSaldo('${id}')">↻</button>
  </div>`;
}

// ---- modal genérico ----
function modal(html) {
  fecharModal();
  const ov = document.createElement("div");
  ov.className = "overlay"; ov.id = "overlay";
  ov.innerHTML = `<div class="modal">${html}</div>`;
  ov.addEventListener("click", (e) => { if (e.target === ov) fecharModal(); });
  document.body.appendChild(ov);
}
function fecharModal() { const o = document.getElementById("overlay"); if (o) o.remove(); }

// Abre o formulário. Sem id = adicionar; com id = editar (campos pré-preenchidos).
function abrirFormLofy(id) {
  const editar = !!id;
  const c = editar ? (lofyById(id) || {}) : {};
  const btnToggle = `<button type="button" class="peek" onclick="const i=this.previousElementSibling;i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'👁':'🙈'">👁</button>`;
  modal(`
    <div class="section-title" style="margin:0 0 14px"><h2 style="font-size:17px">${editar ? "✎ Editar conta" : "＋ Adicionar conta LofyPay"}</h2></div>
    <div class="field"><label>Nome da conta</label><input id="loNome" value="${esc(c.nome)}" placeholder="Ex.: Loja 1 / Conta principal"></div>
    <div class="field"><label>Secret Key (usada para gerar/sacar)</label><div class="copyrow"><input id="loKey1" type="password" value="${esc(c.key1)}" placeholder="sk_live_..." autocomplete="off">${btnToggle}</div></div>
    <div class="field"><label>Segunda key (opcional)</label><div class="copyrow"><input id="loKey2" type="password" value="${esc(c.key2)}" placeholder="chave secundária, se tiver" autocomplete="off">${btnToggle}</div></div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn ghost" style="flex:1" onclick="fecharModal()">Cancelar</button>
      <button class="btn" style="flex:1" onclick="salvarLofy('${id || ""}')">${editar ? "Salvar alterações" : "Salvar conta"}</button>
    </div>`);
  setTimeout(() => document.getElementById("loNome")?.focus(), 60);
}
function salvarLofy(id) {
  const nome = document.getElementById("loNome").value.trim();
  const key1 = document.getElementById("loKey1").value.trim();
  const key2 = document.getElementById("loKey2").value.trim();
  if (!nome) return toast("Falta o nome", "err", "Dê um nome pra identificar a conta.");
  if (!key1) return toast("Falta a Secret Key", "err", "Cole a chave usada para gerar/sacar.");
  const contas = getLofys();
  if (id) {
    const c = contas.find((x) => x.id === id);
    if (c) { c.nome = nome; c.key1 = key1; c.key2 = key2; }
    saveLofys(contas); fecharModal(); toast("Conta atualizada ✅", "ok", nome); renderLofys();
  } else {
    contas.push({ id: "lofy_" + Math.random().toString(36).slice(2, 9), nome, key1, key2 });
    saveLofys(contas); fecharModal(); toast("Conta adicionada ✅", "ok", nome); renderLofys();
  }
}
function removerLofy(id) {
  const c = lofyById(id); if (!c) return;
  if (!confirm(`Remover a conta "${c.nome}"? As chaves saem deste navegador.`)) return;
  saveLofys(getLofys().filter((x) => x.id !== id));
  toast("Conta removida", "", c.nome); renderLofys();
}

// ---- detalhe da conta: receber cobrança / sacar ----
function abrirLofy(id) {
  const c = lofyById(id); if (!c) return;
  view().innerHTML = `
    <button class="btn ghost" onclick="renderLofys()" style="padding:8px 14px;margin-bottom:14px">← Voltar às contas</button>
    <div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      <div class="lofy-logo" style="margin:0">L</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:17px">${esc(c.nome)}</div>
        <div class="muted" style="font-size:12px;font-family:var(--mono)">LofyPay • ${maskKey(c.key1)}</div>
      </div>
      <button class="btn ghost" onclick="abrirFormLofy('${c.id}')">✎ Editar</button>
    </div>
    <div class="grid cols-2">
      <div class="card">
        <div class="section-title" style="margin:0 0 12px"><h2 style="font-size:15px">📥 Receber cobrança</h2></div>
        <div class="field"><label>Valor (R$)</label><input id="locVal" type="number" min="0" step="0.01" placeholder="0,00"></div>
        <div class="field"><label>Descrição (opcional)</label><input id="locDesc" placeholder="Ex.: Pedido #1"></div>
        <button class="btn block" id="loGerarBtn" onclick="gerarLofy('${id}')">⚡ Gerar cobrança</button>
        <div id="loGerarRes" style="margin-top:14px"></div>
      </div>
      <div class="card">
        <div class="section-title" style="margin:0 0 12px"><h2 style="font-size:15px">🏦 Sacar</h2></div>
        <div class="field"><label>Valor (R$)</label><input id="losVal" type="number" min="0" step="0.01" placeholder="0,00"></div>
        <div class="field"><label>Chave Pix de destino</label><input id="losPix" placeholder="CPF / e-mail / telefone / aleatória"></div>
        <div class="grid cols-2" style="gap:12px">
          <div class="field"><label>Nome do titular</label><input id="losNome" placeholder="Nome completo"></div>
          <div class="field"><label>CPF</label><input id="losCpf" placeholder="Só números"></div>
        </div>
        <button class="btn block" id="loSacarBtn" onclick="sacarLofy('${id}')">Solicitar saque</button>
        <div id="loSacarRes" style="margin-top:14px"></div>
      </div>
    </div>`;
}

async function gerarLofy(id) {
  const c = lofyById(id); if (!c) return;
  const val = parseFloat(document.getElementById("locVal").value) || 0;
  if (val <= 0) return toast("Valor inválido", "err", "Digite o valor da cobrança.");
  const btn = document.getElementById("loGerarBtn"); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Gerando…`;
  const { ok, d } = await api("/api/gerar", {
    gateway: "lofypay", valor: val, secret: c.key1,
    descricao: document.getElementById("locDesc").value.trim(), pagador: c.nome,
  });
  btn.disabled = false; btn.innerHTML = "⚡ Gerar cobrança";
  const box = document.getElementById("loGerarRes");
  if (!ok) { box.innerHTML = ""; return toast("Não deu certo", "err", d.erro || "Confira a Secret Key da conta."); }
  DB.addMovimento({ id: d.id || ("TX-" + Date.now()), gateway: "lofypay", valor: val, descricao: document.getElementById("locDesc").value.trim(), pagador: c.nome, status: "pendente", code: d.code || null, data: new Date().toISOString() });
  toast("Cobrança gerada ✅", "ok", `${c.nome} • ${money(val)}`);
  box.innerHTML = `
    ${d.code ? `<div class="field" style="margin:0 0 10px"><label>Pix copia-e-cola</label><div class="copyrow"><input id="loPixCode" readonly value="${d.code}"><button class="btn ghost" onclick="copyLoPix()">Copiar</button></div></div>` : ""}
    ${d.pay_url ? `<a class="btn block" href="${d.pay_url}" target="_blank" rel="noopener">Abrir página de pagamento</a>` : ""}`;
}
function copyLoPix() { const i = document.getElementById("loPixCode"); i.select(); navigator.clipboard?.writeText(i.value).then(() => toast("Copiado!", "ok")).catch(() => {}); }

async function sacarLofy(id) {
  const c = lofyById(id); if (!c) return;
  const val = parseFloat(document.getElementById("losVal").value) || 0;
  const pix = document.getElementById("losPix").value.trim();
  if (val <= 0) return toast("Valor inválido", "err", "Digite o valor do saque.");
  if (!pix) return toast("Falta a chave Pix", "err", "Informe a chave de destino.");
  const btn = document.getElementById("loSacarBtn"); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Processando…`;
  const { ok, d } = await api("/api/saque", {
    gateway: "lofypay", valor: val, keypix: pix, secret: c.key1,
    nome: document.getElementById("losNome").value.trim(), cpf: document.getElementById("losCpf").value.trim(),
  });
  btn.disabled = false; btn.textContent = "Solicitar saque";
  if (ok) { DB.addSaque({ id: d.id || ("SAQ-" + Date.now()), gateway: "lofypay", valor: val, keypix: pix, status: d.status || "processando", data: new Date().toISOString() }); toast("Saque solicitado ✅", "ok", `${c.nome} • ${money(val)}`); document.getElementById("loSacarRes").innerHTML = `<p class="note" style="margin:0">Solicitado • ${d.status || "processando"}</p>`; }
  else toast("Não foi possível sacar", "err", d.erro || "Confira a Secret Key da conta.");
}

// consulta o saldo de uma conta LofyPay (via /api/saldo, usando a secret dela)
async function consultarSaldo(id, opts) {
  opts = opts || {};
  const c = lofyById(id); if (!c) return false;
  const { ok, d } = await api("/api/saldo", { gateway: "lofypay", secret: c.key1 });
  if (ok && d.saldo != null) { setSaldo(id, Number(d.saldo)); }
  else if (!opts.silent) { toast("Não consegui o saldo", "err", (d && d.erro) || "Confira a Secret Key da conta."); }
  if (!opts.noRender && currentRoute === "lofys") renderLofys(true);
  return ok;
}
// atualiza o saldo de TODAS as contas de uma vez
async function atualizarSaldos() {
  const contas = getLofys();
  await Promise.all(contas.map((c) => consultarSaldo(c.id, { silent: true, noRender: true })));
  if (currentRoute === "lofys") renderLofys(true);
}
// botão ↻ Atualizar: re-sincroniza e atualiza todos os saldos
async function atualizarPainel(btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Atualizando…`; }
  await pullContas();
  await pullDados();
  await atualizarSaldos();
  toast("Painel atualizado", "ok");
}

// ------------------------------------------------------------------- router
const RENDERERS = { inicio: renderInicio, estatisticas: renderEstatisticas, carteira: renderCarteira, gerar: renderGerar, lofys: renderLofys, api: renderApi };
let currentRoute = "inicio";
function rerenderCurrent() { (RENDERERS[currentRoute] || renderInicio)(true); }
function go(route) {
  route = PAGES[route] ? route : "inicio";
  currentRoute = route;
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.route === route));
  document.getElementById("pageTitle").textContent = PAGES[route].title;
  document.getElementById("pageSub").textContent = PAGES[route].sub;
  RENDERERS[route]();
  document.getElementById("sidebar").classList.remove("open");
  location.hash = route;
}
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-route]");
  if (nav) { e.preventDefault(); go(nav.dataset.route); }
  if (e.target.id === "menuBtn") document.getElementById("sidebar").classList.toggle("open");
});

// ============================================================ LOGIN (trava)
//  ATENÇÃO: isto é uma trava só do NAVEGADOR (frontend). A senha fica visível
//  no código, então NÃO é segurança de verdade — serve pra impedir acesso
//  casual ao painel. A proteção real das operações é a CENTRALPAY_API_KEY,
//  validada no servidor (x-api-key) nas funções /api.
const AUTH_USER = "Lucas";
const AUTH_PASS = "lucas0";
const AUTH_FLAG = "centralpay_auth";
const estaLogado = () => { try { return localStorage.getItem(AUTH_FLAG) === "1"; } catch (e) { return false; } };

function mostrarLogin() {
  document.querySelector(".app").style.display = "none";
  const ov = document.createElement("div");
  ov.className = "login-screen"; ov.id = "loginScreen";
  ov.innerHTML = `
    <form class="login-box" onsubmit="return fazerLogin(event)">
      <div class="login-logo">C</div>
      <h1>CentralPay</h1>
      <p class="muted" style="margin:0 0 18px">Entre para acessar o painel</p>
      <div class="field"><label>Usuário</label><input id="logUser" autocomplete="username" placeholder="Usuário"></div>
      <div class="field"><label>Senha</label><input id="logPass" type="password" autocomplete="current-password" placeholder="Senha"></div>
      <button class="btn block" type="submit">Entrar</button>
      <div class="login-err" id="logErr"></div>
    </form>`;
  document.body.appendChild(ov);
  setTimeout(() => document.getElementById("logUser")?.focus(), 60);
}
function fazerLogin(e) {
  e.preventDefault();
  const u = document.getElementById("logUser").value.trim();
  const p = document.getElementById("logPass").value;
  if (u === AUTH_USER && p === AUTH_PASS) {
    try { localStorage.setItem(AUTH_FLAG, "1"); } catch (er) {}
    document.getElementById("loginScreen")?.remove();
    document.querySelector(".app").style.display = "";
    iniciarApp();
  } else {
    document.getElementById("logErr").textContent = "Usuário ou senha incorretos.";
    document.getElementById("logPass").value = "";
  }
  return false;
}
function logout() {
  try { localStorage.removeItem(AUTH_FLAG); } catch (e) {}
  location.reload();
}

function iniciarApp() {
  const keyInput = document.getElementById("apiKeyInput");
  keyInput.value = getKey();
  document.getElementById("apiKeySt").textContent = getKey() ? "✅ chave salva" : "necessária para operações reais";
  keyInput.addEventListener("input", () => {
    localStorage.setItem("centralpay_key", keyInput.value.trim());
    document.getElementById("apiKeySt").textContent = keyInput.value.trim() ? "✅ chave salva" : "necessária para operações reais";
  });
  go((location.hash || "#inicio").slice(1));
  pullContas(); // sincroniza as contas compartilhadas
  pullDados();  // sincroniza o histórico compartilhado
}

// ponto de entrada: exige login antes de abrir o painel
if (estaLogado()) iniciarApp();
else mostrarLogin();
