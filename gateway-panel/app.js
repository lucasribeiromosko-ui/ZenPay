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
  view().innerHTML = `
    <div class="grid cols-4">
      ${statCard("◈", "Saldo disponível", DEMO.saldoDisponivel, "+ pronto para saque", "up", true)}
      ${statCard("↗", "Entrou (mês)", DEMO.entrouMes, "▲ este mês", "up")}
      ${statCard("↙", "Saiu (mês)", DEMO.saiuMes, "▼ saques + taxas", "down")}
      ${statCard("✦", "Vendas (mês)", DEMO.vendasMes, "pagamentos aprovados", "up", false, false)}
    </div>
    <div class="section-title"><h2>Faturamento — últimos 14 dias</h2><span class="hint">demonstração</span></div>
    <div class="card">${chartSVG(DEMO.faturamento)}<div class="legend"><span class="li">Recebido por dia</span></div></div>
    <div class="section-title"><h2>Pagamentos recentes</h2><a data-route="estatisticas" class="hint">ver todos →</a></div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Pagador</th><th>Gateway</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody>${DEMO.pagamentos.slice(0, 5).map(rowPag).join("")}</tbody>
    </table></div>`;
  runCountUps();
}
function statCard(ic, label, val, delta, dir, glow = false, isMoney = true) {
  return `<div class="card stat ${glow ? "glow" : ""}"><div class="ic">${ic}</div>
    <div class="label">${label}</div>
    <div class="value" data-to="${val}" data-money="${isMoney ? 1 : 0}">${isMoney ? "R$ 0,00" : "0"}</div>
    <div class="delta ${dir}">${delta}</div></div>`;
}
function rowPag(p) {
  const g = gwById(p.gateway);
  return `<tr><td class="gtag">${p.id}</td><td>${p.pagador}</td>
    <td><span class="gdot" style="background:${g.cor}"></span>${g.nome}</td>
    <td class="num">${money(p.valor)}</td><td>${statusBadge(p.status)}</td></tr>`;
}

// ====================================================== TELA: ESTATÍSTICAS
function renderEstatisticas() {
  view().innerHTML = `
    <div class="grid cols-3">
      ${statCard("◎", "Ticket médio", DEMO.entrouMes / DEMO.vendasMes, "por venda", "up")}
      <div class="card stat"><div class="label">Aprovação</div><div class="value" data-to="92" data-money="0">0</div><div class="delta up">% pagos / gerados</div></div>
      <div class="card stat"><div class="label">MEDs no período</div><div class="value" data-to="${DEMO.pagamentos.filter(p => p.status === "med").length}" data-money="0">0</div><div class="delta down">contestações</div></div>
    </div>
    <div class="section-title"><h2>Consultar pagador</h2><span class="hint">nome ou ID</span></div>
    <div class="card"><div class="field" style="margin:0"><input id="busca" placeholder="Ex.: Empresa Alpha, TX-10293…" oninput="filtrarPag()"></div></div>
    <div class="section-title"><h2>Histórico de pagamentos</h2>
      <select id="periodo" onchange="filtrarPag()" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);padding:8px 12px;border-radius:10px;font-size:13px">
        <option value="all">Todo o período</option><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option></select>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Data</th><th>Pagador</th><th>Gateway</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody id="tb">${DEMO.pagamentos.map(rowPagFull).join("")}</tbody></table></div>`;
  runCountUps();
}
function rowPagFull(p) {
  const g = gwById(p.gateway);
  return `<tr data-n="${p.pagador.toLowerCase()}" data-i="${p.id.toLowerCase()}" data-d="${p.data}">
    <td class="gtag">${p.id}</td><td class="muted">${p.data}</td><td>${p.pagador}</td>
    <td><span class="gdot" style="background:${g.cor}"></span>${g.nome}</td>
    <td class="num">${money(p.valor)}</td><td>${statusBadge(p.status)}</td></tr>`;
}
function filtrarPag() {
  const q = (document.getElementById("busca")?.value || "").toLowerCase().trim();
  const per = document.getElementById("periodo")?.value || "all";
  view().querySelectorAll("#tb tr").forEach((tr) => {
    const okT = !q || tr.dataset.n.includes(q) || tr.dataset.i.includes(q);
    let okP = true;
    if (per === "hoje") okP = tr.dataset.d.startsWith("2026-08-19");
    else if (per === "7") okP = tr.dataset.d >= "2026-08-13";
    tr.style.display = okT && okP ? "" : "none";
  });
}

// =========================================================== TELA: CARTEIRA
function renderCarteira() {
  view().innerHTML = `
    <div class="grid cols-2">
      ${statCard("◈", "Saldo disponível", DEMO.saldoDisponivel, "liberado para saque", "up", true)}
      ${statCard("◷", "Saldo pendente", DEMO.saldoPendente, "aguardando liberação", "down")}
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
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>Data</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody>${DEMO.saques.map(s => `<tr><td class="gtag">${s.id}</td><td class="muted">${s.data}</td><td class="num">${money(s.valor)}</td><td>${statusBadge(s.status)}</td></tr>`).join("")}</tbody></table></div>`;
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
  if (ok) toast("Saque solicitado ✅", "ok", `ID ${d.id || ""} • ${d.status || "processando"}`);
  else toast("Não foi possível sacar", "err", d.erro || "Verifique a chave de acesso e as configs.");
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
  if (g.limiteDiario) limites.push(`até ${money(g.limiteDiario)}/dia`);
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
  const el = document.getElementById("stStatus"); el.innerHTML = `<span class="spinner" style="display:inline-block;width:12px;height:12px"></span> consultando…`;
  const { ok, d } = await api("/api/status", { gateway, id });
  el.innerHTML = ok ? `Status: <b>${d.status || "?"}</b>` : `Status: <b>—</b>`;
  if (ok && /pa(id|go)|approved|paid_out/i.test(d.status || "")) toast("Pagamento confirmado! 🎉", "ok");
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

// ------------------------------------------------------------------- router
function go(route) {
  route = PAGES[route] ? route : "inicio";
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.route === route));
  document.getElementById("pageTitle").textContent = PAGES[route].title;
  document.getElementById("pageSub").textContent = PAGES[route].sub;
  ({ inicio: renderInicio, estatisticas: renderEstatisticas, carteira: renderCarteira, gerar: renderGerar, api: renderApi }[route])();
  document.getElementById("sidebar").classList.remove("open");
  location.hash = route;
}
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-route]");
  if (nav) { e.preventDefault(); go(nav.dataset.route); }
  if (e.target.id === "menuBtn") document.getElementById("sidebar").classList.toggle("open");
});

// chave de acesso (localStorage)
const keyInput = document.getElementById("apiKeyInput");
keyInput.value = getKey();
document.getElementById("apiKeySt").textContent = getKey() ? "✅ chave salva" : "necessária para operações reais";
keyInput.addEventListener("input", () => {
  localStorage.setItem("centralpay_key", keyInput.value.trim());
  document.getElementById("apiKeySt").textContent = keyInput.value.trim() ? "✅ chave salva" : "necessária para operações reais";
});

go((location.hash || "#inicio").slice(1));
