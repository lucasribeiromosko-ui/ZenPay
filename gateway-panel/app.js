// ============================================================================
//  CentralPay — lógica do painel (frontend). Usa dados de DEMO.
//  Para gerar pagamentos/saques de verdade, o frontend chama /api/* (serverless
//  na Vercel), que fala com cada gateway usando a CHAVE SECRETA em variável de
//  ambiente. Nunca coloque chave secreta neste arquivo. Ver README.
// ============================================================================
const gwById = (id) => GATEWAYS.find((g) => g.id === id) || GATEWAYS[0];
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const view = () => document.getElementById("view");

const PAGES = {
  inicio:       { title: "Início",           sub: "Visão geral da sua operação" },
  estatisticas: { title: "Estatísticas",     sub: "Histórico, pagadores e desempenho" },
  carteira:     { title: "Carteira",         sub: "Saldo e saques" },
  gerar:        { title: "Gerar pagamento",  sub: "Escolha a gateway e veja as taxas" },
};

// -------------------------------------------------------------- gráfico (SVG)
function chartSVG(values) {
  const w = 720, h = 180, pad = 8;
  const max = Math.max(...values, 1);
  const bw = (w - pad * 2) / values.length;
  const bars = values.map((v, i) => {
    const bh = Math.max(3, (v / max) * (h - 30));
    const x = pad + i * bw + bw * 0.15;
    const y = h - bh - 6;
    return `<rect class="bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${bh.toFixed(1)}" rx="4"></rect>`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0.35"/>
    </linearGradient></defs>${bars}</svg>`;
}

function statusBadge(s) {
  const map = { pago: "Pago", pendente: "Pendente", med: "MED / contestado" };
  return `<span class="badge ${s}">${map[s] || s}</span>`;
}

// ============================================================ TELA: INÍCIO
function renderInicio() {
  const v = view();
  v.innerHTML = `
    <div class="grid cols-4">
      <div class="card stat glow"><div class="ic">◈</div><div class="label">Saldo disponível</div><div class="value">${money(DEMO.saldoDisponivel)}</div><div class="delta up">+ pronto para saque</div></div>
      <div class="card stat"><div class="ic">↗</div><div class="label">Entrou (mês)</div><div class="value">${money(DEMO.entrouMes)}</div><div class="delta up">▲ este mês</div></div>
      <div class="card stat"><div class="ic">↙</div><div class="label">Saiu (mês)</div><div class="value">${money(DEMO.saiuMes)}</div><div class="delta down">▼ saques + taxas</div></div>
      <div class="card stat"><div class="ic">✦</div><div class="label">Vendas (mês)</div><div class="value">${DEMO.vendasMes}</div><div class="delta up">pagamentos aprovados</div></div>
    </div>

    <div class="section-title"><h2>Faturamento — últimos 14 dias</h2><span class="hint">demonstração</span></div>
    <div class="card">${chartSVG(DEMO.faturamento)}<div class="legend"><span class="li">Recebido por dia</span></div></div>

    <div class="section-title"><h2>Pagamentos recentes</h2><a data-route="estatisticas" class="hint" style="cursor:pointer">ver todos →</a></div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Pagador</th><th>Gateway</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody>${DEMO.pagamentos.slice(0, 5).map(rowPagamento).join("")}</tbody>
    </table></div>`;
}

function rowPagamento(p) {
  const g = gwById(p.gateway);
  return `<tr>
    <td class="gtag">${p.id}</td>
    <td>${p.pagador}</td>
    <td><span class="gw dot" style="background:${g.cor};padding:0;border:0;width:9px;height:9px;display:inline-block;border-radius:2px;margin-right:7px"></span>${g.nome}</td>
    <td class="num">${money(p.valor)}</td>
    <td>${statusBadge(p.status)}</td>
  </tr>`;
}

// ====================================================== TELA: ESTATÍSTICAS
function renderEstatisticas() {
  const v = view();
  v.innerHTML = `
    <div class="grid cols-3">
      <div class="card stat"><div class="label">Ticket médio</div><div class="value">${money(DEMO.entrouMes / DEMO.vendasMes)}</div></div>
      <div class="card stat"><div class="label">Aprovação</div><div class="value">92%</div><div class="delta up">pagos / gerados</div></div>
      <div class="card stat"><div class="label">MEDs no período</div><div class="value">${DEMO.pagamentos.filter(p=>p.status==="med").length}</div><div class="delta down">contestações</div></div>
    </div>

    <div class="section-title"><h2>Consultar pagador</h2><span class="hint">busca por nome ou ID</span></div>
    <div class="card">
      <div class="field" style="margin:0"><input id="busca" placeholder="Ex.: Empresa Alpha, TX-10293…" oninput="filtrarPagamentos()"></div>
    </div>

    <div class="section-title"><h2>Histórico de pagamentos</h2>
      <select id="periodo" onchange="filtrarPagamentos()" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);padding:7px 11px;border-radius:9px;font-size:13px">
        <option value="all">Todo o período</option><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option>
      </select>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Data</th><th>Pagador</th><th>Gateway</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody id="tbodyPag">${DEMO.pagamentos.map(rowPagFull).join("")}</tbody>
    </table></div>
    <p class="note">💡 A coluna <b>Gateway</b> mostra de onde veio cada pagamento (ex.: se veio da LofyPay). Com a integração real, dá pra clicar e ver os detalhes completos do pagador que a gateway retorna.</p>`;
}

function rowPagFull(p) {
  const g = gwById(p.gateway);
  return `<tr data-nome="${p.pagador.toLowerCase()}" data-id="${p.id.toLowerCase()}" data-data="${p.data}">
    <td class="gtag">${p.id}</td><td class="muted">${p.data}</td><td>${p.pagador}</td>
    <td><span style="background:${g.cor};width:9px;height:9px;display:inline-block;border-radius:2px;margin-right:7px"></span>${g.nome}</td>
    <td class="num">${money(p.valor)}</td><td>${statusBadge(p.status)}</td></tr>`;
}

function filtrarPagamentos() {
  const q = (document.getElementById("busca")?.value || "").toLowerCase().trim();
  const per = document.getElementById("periodo")?.value || "all";
  document.querySelectorAll("#tbodyPag tr").forEach((tr) => {
    const okText = !q || tr.dataset.nome.includes(q) || tr.dataset.id.includes(q);
    let okPer = true;
    if (per === "hoje") okPer = tr.dataset.data.startsWith("2026-08-19");
    else if (per === "7") okPer = tr.dataset.data >= "2026-08-13";
    tr.style.display = okText && okPer ? "" : "none";
  });
}

// =========================================================== TELA: CARTEIRA
function renderCarteira() {
  const v = view();
  v.innerHTML = `
    <div class="grid cols-2">
      <div class="card stat glow"><div class="label">Saldo disponível</div><div class="value">${money(DEMO.saldoDisponivel)}</div><div class="delta up">liberado para saque</div></div>
      <div class="card stat"><div class="label">Saldo pendente</div><div class="value">${money(DEMO.saldoPendente)}</div><div class="delta">aguardando liberação (prazo da gateway)</div></div>
    </div>

    <div class="section-title"><h2>Solicitar saque</h2></div>
    <div class="grid cols-2">
      <div class="card">
        <div class="field"><label>Valor do saque</label><input id="sqValor" type="number" min="0" step="0.01" placeholder="0,00" oninput="calcSaque()"></div>
        <div class="field"><label>Sacar pela gateway</label><select id="sqGw" onchange="calcSaque()">${GATEWAYS.map(g=>`<option value="${g.id}">${g.nome} — saque ${g.taxaSaque}% + ${money(g.taxaSaqueFixa)}</option>`).join("")}</select></div>
        <button class="btn block" onclick="pedirSaque()">Solicitar saque</button>
        <p class="note">O saque real é processado pela API da gateway (serverless). Aqui é a simulação com a taxa.</p>
      </div>
      <div class="card">
        <div class="section-title" style="margin:0 0 8px"><h2 style="font-size:15px">Resumo do saque</h2></div>
        <div class="breakdown" id="sqBreak"><p class="muted center" style="padding:20px 0">Digite um valor para ver a taxa e o líquido.</p></div>
      </div>
    </div>

    <div class="section-title"><h2>Histórico de saques</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Data</th><th class="num">Valor</th><th>Status</th></tr></thead>
      <tbody>${DEMO.saques.map(s=>`<tr><td class="gtag">${s.id}</td><td class="muted">${s.data}</td><td class="num">${money(s.valor)}</td><td>${statusBadge(s.status)}</td></tr>`).join("")}</tbody>
    </table></div>`;
}

function calcSaque() {
  const val = parseFloat(document.getElementById("sqValor").value) || 0;
  const g = gwById(document.getElementById("sqGw").value);
  const taxa = val * (g.taxaSaque / 100) + g.taxaSaqueFixa;
  const liq = Math.max(0, val - taxa);
  document.getElementById("sqBreak").innerHTML = `
    <div class="brow"><span class="k">Valor solicitado</span><span class="v">${money(val)}</span></div>
    <div class="brow neg"><span class="k">Taxa de saque (${g.nome})</span><span class="v">- ${money(taxa)}</span></div>
    <div class="brow total"><span class="k">Você recebe</span><span class="v">${money(liq)}</span></div>`;
}
function pedirSaque() {
  const val = parseFloat(document.getElementById("sqValor").value) || 0;
  if (val <= 0) return alert("Digite um valor de saque válido.");
  if (val > DEMO.saldoDisponivel) return alert("Valor maior que o saldo disponível.");
  alert("✅ Saque solicitado (simulação).\nNa versão conectada, isso dispara a API da gateway via /api/saque.");
}

// ==================================================== TELA: GERAR PAGAMENTO
let gwSel = GATEWAYS[0].id;
function renderGerar() {
  const v = view();
  v.innerHTML = `
    <div class="grid cols-2">
      <div class="card">
        <div class="field" style="margin-bottom:20px"><label>Escolha a gateway</label>
          <div class="gw-grid" id="gwGrid">${GATEWAYS.map(gwCard).join("")}</div>
        </div>
        <div class="field"><label>Valor da cobrança (R$)</label><input id="pgValor" type="number" min="0" step="0.01" placeholder="0,00" oninput="calcGerar()"></div>
        <div class="field"><label>Descrição (opcional)</label><input id="pgDesc" placeholder="Ex.: Desenvolvimento de site institucional"></div>
        <div class="field"><label>Cliente (opcional)</label><input id="pgCliente" placeholder="Nome do pagador — ajuda na conciliação/MED"></div>
        <button class="btn block" onclick="gerarPagamento()">Gerar cobrança</button>
      </div>
      <div class="card glow">
        <div class="section-title" style="margin:0 0 10px"><h2 style="font-size:15px">Detalhamento das taxas</h2><span class="hint" id="gwLabel"></span></div>
        <div class="breakdown" id="pgBreak"></div>
      </div>
    </div>
    <div id="pgResult" style="margin-top:16px"></div>
    <p class="note">As taxas exibidas vêm de <code>gateways.js</code> — ajuste com os valores reais de cada gateway. A cobrança de verdade é criada pela API da gateway escolhida (serverless <code>/api/gerar</code>).</p>`;
  selGw(gwSel);
}

function gwCard(g) {
  return `<div class="gw ${g.id===gwSel?"sel":""}" data-id="${g.id}" onclick="selGw('${g.id}')">
    <span class="prazo">${g.prazo}</span>
    <div class="nome"><span class="dot" style="background:${g.cor}"></span>${g.nome}</div>
    <div class="fee">Receber: <b>${g.taxaReceber}% + ${money(g.taxaReceberFixa)}</b><br>Sacar: <b>${g.taxaSaque}% + ${money(g.taxaSaqueFixa)}</b></div>
  </div>`;
}
function selGw(id) {
  gwSel = id;
  document.querySelectorAll("#gwGrid .gw").forEach(c => c.classList.toggle("sel", c.dataset.id === id));
  document.getElementById("gwLabel").textContent = gwById(id).nome;
  calcGerar();
}
function calcGerar() {
  const val = parseFloat(document.getElementById("pgValor")?.value) || 0;
  const g = gwById(gwSel);
  const t = calcularTaxas(g, val);
  document.getElementById("pgBreak").innerHTML = `
    <div class="brow"><span class="k">Valor da cobrança</span><span class="v">${money(t.bruto)}</span></div>
    <div class="brow neg"><span class="k">Taxa de recebimento (${g.taxaReceber}% + ${money(g.taxaReceberFixa)})</span><span class="v">- ${money(t.taxaReceber)}</span></div>
    <div class="brow"><span class="k">Cai na sua conta</span><span class="v">${money(t.liquidoRecebido)}</span></div>
    <div class="brow neg"><span class="k">Taxa de saque estimada (${g.taxaSaque}% + ${money(g.taxaSaqueFixa)})</span><span class="v">- ${money(t.taxaSaque)}</span></div>
    <div class="brow total"><span class="k">Líquido final (após sacar)</span><span class="v">${money(t.liquidoFinal)}</span></div>`;
}
async function gerarPagamento() {
  const val = parseFloat(document.getElementById("pgValor").value) || 0;
  if (val <= 0) return alert("Digite o valor da cobrança.");
  const g = gwById(gwSel);
  const desc = document.getElementById("pgDesc").value.trim();
  const cliente = document.getElementById("pgCliente").value.trim();
  const box = document.getElementById("pgResult");
  box.innerHTML = `<div class="card"><p class="muted center" style="padding:16px 0">Gerando cobrança na ${g.nome}…</p></div>`;
  try {
    const r = await fetch("/api/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gateway: g.id, valor: val, descricao: desc, pagador: cliente }),
    });
    const d = await r.json();
    if (!r.ok || d.erro) {
      box.innerHTML = `<div class="card"><div class="brow neg"><span class="k">⚠️ ${d.erro || "Falha ao gerar"}</span></div>
        <p class="note">${d.detalhe ? "Detalhe: <code>" + JSON.stringify(d.detalhe).slice(0, 200) + "</code>" : "Configure as chaves da " + g.nome + " nas Environment Variables da Vercel."}</p></div>`;
      return;
    }
    box.innerHTML = `<div class="card glow">
      <div class="section-title" style="margin:0 0 10px"><h2 style="font-size:15px">✅ Cobrança gerada — ${g.nome}</h2><span class="gtag">${d.id || ""}</span></div>
      ${d.code ? `<div class="field"><label>Pix copia-e-cola</label><input readonly value="${d.code}" onclick="this.select()"></div>` : ""}
      ${d.qr ? `<div class="center"><img alt="QR" src="${/^(https?:|data:)/.test(d.qr) ? d.qr : "data:image/png;base64," + d.qr}" style="max-width:200px;border-radius:12px;background:#fff;padding:8px"></div>` : ""}
      ${d.link ? `<a class="btn block" href="${d.link}" target="_blank" rel="noopener">Abrir link de pagamento</a>` : ""}
      <p class="note">Mande isso ao cliente. Status: <b>${d.status || "aguardando"}</b>.</p>
    </div>`;
  } catch (e) {
    box.innerHTML = `<div class="card"><div class="brow neg"><span class="k">⚠️ Erro de conexão</span></div><p class="note">${e}</p></div>`;
  }
}

// ------------------------------------------------------------------- router
function go(route) {
  route = PAGES[route] ? route : "inicio";
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.route === route));
  document.getElementById("pageTitle").textContent = PAGES[route].title;
  document.getElementById("pageSub").textContent = PAGES[route].sub;
  ({ inicio: renderInicio, estatisticas: renderEstatisticas, carteira: renderCarteira, gerar: renderGerar }[route])();
  document.getElementById("sidebar").classList.remove("open");
  location.hash = route;
}

document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-route]");
  if (nav) { e.preventDefault(); go(nav.dataset.route); }
  if (e.target.id === "menuBtn") document.getElementById("sidebar").classList.toggle("open");
});

go((location.hash || "#inicio").slice(1));
