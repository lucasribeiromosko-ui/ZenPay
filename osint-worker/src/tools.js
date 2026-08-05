// Handlers das ferramentas. Cada um recebe (data, env) e devolve um embed.
import { embed, errorEmbed, okEmbed, opt, COLORS } from "./discord.js";
import { cleanDomain, isValidEmail, isIPv4, doh, fetchT, vcardName } from "./util.js";
import { md5 } from "./md5.js";

// -------------------------------------------------------------- DOMÍNIO
async function whois(data) {
  const domain = cleanDomain(opt(data, "dominio"));
  if (!domain) return errorEmbed("Domínio inválido", "Ex.: `exemplo.com`");
  const r = await fetchT(`https://rdap.org/domain/${domain}`, { headers: { accept: "application/rdap+json" } });
  if (!r.ok) return errorEmbed("WHOIS (RDAP) falhou", `Servidor respondeu ${r.status} para \`${domain}\`.`);
  const j = await r.json();
  const events = {};
  (j.events || []).forEach((e) => (events[e.eventAction] = (e.eventDate || "").slice(0, 10)));
  const reg = (j.entities || []).find((e) => (e.roles || []).includes("registrar"));
  const ns = (j.nameservers || []).map((n) => n.ldhName).join("\n");
  return embed({
    title: `WHOIS — ${domain}`,
    color: COLORS.info,
    fields: [
      { name: "Registrar", value: reg ? vcardName(reg) : null },
      { name: "Criado em", value: events.registration, inline: true },
      { name: "Expira em", value: events.expiration, inline: true },
      { name: "Atualizado", value: events["last changed"], inline: true },
      { name: "Status", value: (j.status || []).join(", ") },
      { name: "Name servers", value: ns },
    ],
  });
}

async function dns(data) {
  const domain = cleanDomain(opt(data, "dominio"));
  if (!domain) return errorEmbed("Domínio inválido", "Ex.: `exemplo.com`");
  const types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"];
  const results = await Promise.all(types.map((t) => doh(domain, t).catch(() => null)));
  const fields = [];
  types.forEach((t, i) => {
    const ans = (results[i] && results[i].Answer) || [];
    const vals = ans.map((a) => a.data);
    if (vals.length) fields.push({ name: t, value: vals.slice(0, 10).join("\n") });
  });
  if (!fields.length) return errorEmbed(`DNS — ${domain}`, "Nenhum registro encontrado.");
  return embed({ title: `DNS — ${domain}`, fields });
}

async function subdomains(data) {
  const domain = cleanDomain(opt(data, "dominio"));
  if (!domain) return errorEmbed("Domínio inválido", "Ex.: `exemplo.com`");
  const r = await fetchT(`https://crt.sh/?q=%25.${domain}&output=json`, {}, 12000);
  if (!r.ok) return errorEmbed("Falha na consulta", `crt.sh respondeu ${r.status}.`);
  const arr = await r.json();
  const subs = new Set();
  for (const e of arr || []) {
    for (let line of String(e.name_value || "").split("\n")) {
      line = line.trim().replace(/^\*\./, "").toLowerCase();
      if (line.endsWith(domain)) subs.add(line);
    }
  }
  subs.delete(domain);
  const ordered = [...subs].sort();
  if (!ordered.length) return errorEmbed(`Subdomínios — ${domain}`, "Nenhum encontrado no Certificate Transparency.");
  const fields = [{ name: "Lista (até 40)", value: ordered.slice(0, 40).map((s) => "• " + s).join("\n") }];
  if (ordered.length > 40) fields.push({ name: "Obs.", value: `+${ordered.length - 40} não exibidos.` });
  return embed({
    title: `Subdomínios — ${domain}`,
    description: `**${ordered.length}** encontrados (Certificate Transparency).`,
    color: COLORS.brand,
    fields,
  });
}

// ---------------------------------------------------------------- REDE
async function ip(data) {
  const val = String(opt(data, "ip") || "").trim();
  if (!isIPv4(val)) return errorEmbed("IP inválido", "Informe um IPv4 público. Ex.: `8.8.8.8`");
  const r = await fetchT(`https://ipwho.is/${val}`);
  const j = await r.json();
  if (!j.success) return errorEmbed("Sem resultado", j.message || "IP não encontrado.");
  const conn = j.connection || {};
  return embed({
    title: `IP — ${j.ip}`,
    fields: [
      { name: "Localização", value: [j.city, j.region, j.country].filter(Boolean).join(", ") },
      { name: "Provedor (ISP)", value: conn.isp },
      { name: "Organização", value: conn.org, inline: true },
      { name: "ASN", value: conn.asn ? `AS${conn.asn}` : null, inline: true },
      { name: "Coordenadas", value: j.latitude ? `${j.latitude}, ${j.longitude}` : null },
    ],
  });
}

async function ipwhois(data) {
  const val = String(opt(data, "ip") || "").trim();
  if (!isIPv4(val)) return errorEmbed("IP inválido", "Ex.: `8.8.8.8`");
  const r = await fetchT(`https://rdap.org/ip/${val}`, { headers: { accept: "application/rdap+json" } });
  if (!r.ok) return errorEmbed("Falha no RDAP", `Servidor respondeu ${r.status}.`);
  const j = await r.json();
  let org = null, abuse = null;
  const walk = (ents) => {
    for (const e of ents || []) {
      const roles = e.roles || [];
      const name = vcardName(e);
      if ((roles.includes("registrant") || roles.includes("administrative")) && name && !org) org = name;
      if (roles.includes("abuse") && name && !abuse) abuse = name;
      walk(e.entities);
    }
  };
  walk(j.entities);
  return embed({
    title: `IP WHOIS (RDAP) — ${val}`,
    fields: [
      { name: "Nome da rede", value: j.name },
      { name: "Faixa", value: `${j.startAddress || "?"} – ${j.endAddress || "?"}`, inline: true },
      { name: "País", value: j.country, inline: true },
      { name: "Organização", value: org },
      { name: "📮 Contato de abuse", value: abuse },
    ],
  });
}

async function reversedns(data) {
  const val = String(opt(data, "alvo") || "").trim();
  if (isIPv4(val)) {
    const arpa = val.split(".").reverse().join(".") + ".in-addr.arpa";
    const j = await doh(arpa, "PTR");
    const ptr = ((j.Answer || []).map((a) => a.data)).join("\n");
    return embed({ title: `Reverse DNS — ${val}`, fields: [{ name: "PTR (nome)", value: ptr || "nenhum" }] });
  }
  const domain = cleanDomain(val);
  if (!domain) return errorEmbed("Entrada inválida", "Informe um IP ou domínio.");
  const [a, aaaa] = await Promise.all([doh(domain, "A"), doh(domain, "AAAA")]);
  const ips = [...(a.Answer || []), ...(aaaa.Answer || [])].map((x) => x.data);
  return embed({ title: `Reverse DNS — ${domain}`, fields: [{ name: "IPs resolvidos", value: ips.join("\n") || "nenhum" }] });
}

async function shodan(data, env) {
  if (!env.SHODAN_API_KEY) {
    return errorEmbed("Shodan não configurado",
      "Rode `npx wrangler secret put SHODAN_API_KEY`.\nChave grátis: https://account.shodan.io");
  }
  const val = String(opt(data, "ip") || "").trim();
  if (!isIPv4(val)) return errorEmbed("IP inválido", "Ex.: `8.8.8.8`");
  const r = await fetchT(`https://api.shodan.io/shodan/host/${val}?key=${env.SHODAN_API_KEY}`);
  if (!r.ok) return errorEmbed("Falha no Shodan", `Respondeu ${r.status} (IP pode não estar indexado).`);
  const j = await r.json();
  return embed({
    title: `Shodan — ${j.ip_str || val}`,
    fields: [
      { name: "Organização", value: j.org, inline: true },
      { name: "SO", value: j.os, inline: true },
      { name: `Portas (${(j.ports || []).length})`, value: (j.ports || []).sort((a, b) => a - b).join(", ") },
      { name: "Hostnames", value: (j.hostnames || []).slice(0, 8).join("\n") },
      { name: "⚠️ CVEs", value: j.vulns ? Object.keys(j.vulns).slice(0, 15).join(", ") : null },
    ],
  });
}

// ------------------------------------------------------------ IDENTIDADE
const SITES = {
  GitHub: "https://github.com/{}", GitLab: "https://gitlab.com/{}",
  Instagram: "https://www.instagram.com/{}/", "X (Twitter)": "https://x.com/{}",
  TikTok: "https://www.tiktok.com/@{}", Reddit: "https://www.reddit.com/user/{}",
  Twitch: "https://www.twitch.tv/{}", YouTube: "https://www.youtube.com/@{}",
  Telegram: "https://t.me/{}", Steam: "https://steamcommunity.com/id/{}",
  Pinterest: "https://www.pinterest.com/{}/", Medium: "https://medium.com/@{}",
};
async function username(data) {
  const uname = String(opt(data, "username") || "").trim().replace(/^@/, "");
  if (!uname || uname.length > 40 || /[\s/]/.test(uname)) {
    return errorEmbed("Username inválido", "Use só o nome, sem espaços ou `/`.");
  }
  const entries = Object.entries(SITES);
  const checks = await Promise.all(entries.map(async ([name, tmpl]) => {
    const url = tmpl.replace("{}", encodeURIComponent(uname));
    try {
      const r = await fetchT(url, { redirect: "follow" }, 6000);
      if (r.status === 200) return { name, url, ok: true };
      if (r.status === 404 || r.status === 410) return { name, url, ok: false };
      return { name, url, ok: null };
    } catch { return { name, url, ok: null }; }
  }));
  const found = checks.filter((c) => c.ok === true);
  const maybe = checks.filter((c) => c.ok === null);
  return embed({
    title: `Username — ${uname}`,
    description: `Encontrado em **${found.length}** de ${entries.length} sites.`,
    color: COLORS.brand,
    footer: "FearSec OSINT • perfil existir ≠ ser a mesma pessoa. Confirme sempre.",
    fields: [
      { name: "✅ Perfis encontrados", value: found.map((c) => `[${c.name}](${c.url})`).join("\n") || "nenhum" },
      { name: "❔ Incerto (checar manual)", value: maybe.map((c) => `[${c.name}](${c.url})`).join("\n") },
    ],
  });
}

async function email(data) {
  const addr = String(opt(data, "email") || "").trim();
  if (!isValidEmail(addr)) return errorEmbed("E-mail inválido", "Formato incorreto.");
  const domain = addr.split("@")[1];
  const j = await doh(domain, "MX");
  const mx = (j.Answer || []).map((a) => a.data).sort();
  return embed({
    title: `E-mail — ${addr}`,
    fields: [
      { name: "Formato", value: "✅ válido", inline: true },
      { name: "Domínio aceita e-mail (MX)", value: mx.length ? "✅ sim" : "❌ sem MX", inline: true },
      { name: "Servidores MX", value: mx.slice(0, 6).join("\n") },
    ],
  });
}

async function breach(data, env) {
  if (!env.HIBP_API_KEY) {
    return errorEmbed("HIBP não configurado",
      "Rode `npx wrangler secret put HIBP_API_KEY`.\nChave: https://haveibeenpwned.com/API/Key");
  }
  const addr = String(opt(data, "email") || "").trim();
  if (!isValidEmail(addr)) return errorEmbed("E-mail inválido", "Formato incorreto.");
  const r = await fetchT(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(addr)}?truncateResponse=false`,
    { headers: { "hibp-api-key": env.HIBP_API_KEY } }
  );
  if (r.status === 404) return okEmbed("Nenhum vazamento", "Este e-mail não aparece nos vazamentos conhecidos.");
  if (!r.ok) return errorEmbed("Falha no HIBP", `Respondeu ${r.status}.`);
  const arr = await r.json();
  return embed({
    title: `⚠️ ${arr.length} vazamento(s)`,
    description: "Este e-mail aparece nos incidentes abaixo:",
    color: COLORS.error,
    footer: "FearSec OSINT • recomende trocar senha e ativar 2FA.",
    fields: arr.slice(0, 12).map((b) => ({
      name: `${b.Title} (${b.BreachDate})`,
      value: (b.DataClasses || []).slice(0, 6).join(", ") || "—",
    })),
  });
}

// ---------------------------------------------------------------- WEB
const TECH_HINTS = {
  server: { cloudflare: "Cloudflare", nginx: "Nginx", apache: "Apache", "microsoft-iis": "IIS" },
  "x-powered-by": { php: "PHP", express: "Express", "asp.net": "ASP.NET", "next.js": "Next.js" },
};
const HTML_HINTS = {
  "wp-content": "WordPress", "/_next/": "Next.js", "cdn.shopify": "Shopify",
  "wix.com": "Wix", drupal: "Drupal", joomla: "Joomla", "gtag(": "Google Analytics",
};
function normUrl(raw) {
  let u = String(raw || "").trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { const p = new URL(u); if (p.protocol !== "http:" && p.protocol !== "https:") return null; return p; }
  catch { return null; }
}
async function headers(data) {
  const p = normUrl(opt(data, "url"));
  if (!p) return errorEmbed("URL inválida", "Ex.: `exemplo.com`");
  const r = await fetchT(p.toString(), { redirect: "follow" });
  const html = (await r.text()).slice(0, 60000).toLowerCase();
  const h = Object.fromEntries([...r.headers.entries()]);
  const wanted = ["server", "x-powered-by", "content-type", "location",
    "strict-transport-security", "content-security-policy", "x-frame-options", "set-cookie"];
  const shown = wanted.filter((k) => h[k]).map((k) => `**${k}:** ${String(h[k]).slice(0, 120)}`);
  const techs = new Set();
  for (const [hdr, map] of Object.entries(TECH_HINTS)) {
    const v = (h[hdr] || "").toLowerCase();
    for (const [needle, name] of Object.entries(map)) if (v.includes(needle)) techs.add(name);
  }
  for (const [needle, name] of Object.entries(HTML_HINTS)) if (html.includes(needle)) techs.add(name);
  const sec = ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options"].filter((k) => h[k]);
  return embed({
    title: `Headers — ${p.hostname}`,
    description: `HTTP ${r.status} • ${r.url}`,
    fields: [
      { name: "Cabeçalhos", value: shown.join("\n") || "—" },
      { name: "🧪 Tecnologias (palpite)", value: [...techs].join(", ") || "não identificado" },
      { name: "🛡️ Headers de segurança", value: `${sec.length}/4: ${sec.join(", ") || "nenhum"}` },
    ],
  });
}
async function webscan(data) {
  const p = normUrl(opt(data, "url"));
  if (!p) return errorEmbed("URL inválida", "Ex.: `exemplo.com`");
  const r = await fetchT(p.toString(), { redirect: "follow" });
  const text = (await r.text()).slice(0, 400000);
  const emails = [...new Set(text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || [])].sort();
  const links = [...new Set([...text.matchAll(/href=['"]?(https?:\/\/[^'" >]+)/gi)].map((m) => m[1]))];
  const title = (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const metas = {};
  for (const m of text.matchAll(/<meta[^>]+(?:name|property)=['"]([^'"]+)['"][^>]+content=['"]([^'"]*)['"]/gi)) {
    metas[m[1].toLowerCase()] = m[2];
  }
  const ext = links.filter((l) => !l.includes(p.hostname)).slice(0, 15);
  return embed({
    title: `Webscan — ${p.hostname}`,
    color: COLORS.brand,
    fields: [
      { name: "Título", value: title ? title.trim().slice(0, 200) : null },
      { name: "Descrição", value: metas.description ? metas.description.slice(0, 200) : null },
      { name: "Gerado por", value: metas.generator },
      { name: `📧 E-mails (${emails.length})`, value: emails.slice(0, 15).join("\n") || "nenhum" },
      { name: `🔗 Links externos (${ext.length} de ${links.length})`, value: ext.join("\n") || "—" },
    ],
  });
}

// ---------------------------------------------------------------- HASH
const HASH_TYPES = { MD5: 32, "SHA-1": 40, "SHA-256": 64, "SHA-384": 96, "SHA-512": 128 };
const COMMON = ["123456", "password", "123456789", "12345678", "12345", "qwerty", "abc123",
  "111111", "senha", "123123", "admin", "1234567890", "000000", "iloveyou", "1q2w3e4r",
  "qwerty123", "root", "toor", "letmein", "welcome", "monkey", "dragon", "master", "shadow",
  "football", "666666", "121212", "superman", "1234", "senha123", "brasil", "mudar123", "password1"];

async function digest(algo, text) {
  if (algo === "MD5") return md5(text);
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hash(data) {
  const val = String(opt(data, "valor") || "").trim().toLowerCase();
  const word = opt(data, "palavra");
  if (!/^[a-f0-9]+$/.test(val)) return errorEmbed("Não parece um hash hex", "Cole só caracteres 0-9 a-f.");
  const candidates = Object.entries(HASH_TYPES).filter(([, len]) => len === val.length).map(([n]) => n);
  const fields = [{ name: "Tipo(s) provável(is)", value: candidates.join(", ") || "desconhecido" }];
  const pool = candidates.length ? candidates : Object.keys(HASH_TYPES);

  if (word) {
    let match = [];
    for (const algo of pool) if ((await digest(algo, word)) === val) match.push(algo);
    fields.push(match.length
      ? { name: "✅ Confere!", value: `\`${word}\` gera este hash (${match.join(", ")}).` }
      : { name: "❌ Não confere", value: `\`${word}\` não gera este hash.` });
    return embed({ title: `Hash (${val.length} chars)`, fields });
  }
  for (const algo of pool) {
    for (const pw of COMMON) {
      if ((await digest(algo, pw)) === val) {
        fields.push({ name: "🔓 Quebrado!", value: `Senha: \`${pw}\`  (${algo})` });
        return embed({ title: `Hash (${val.length} chars)`, color: COLORS.brand, fields,
          footer: "FearSec OSINT • senha fraca — mostre ao dono para trocar/ativar 2FA." });
      }
    }
  }
  fields.push({ name: "🔒 Não quebrado", value: "Não está na wordlist embutida. Use `palavra:` para testar uma específica." });
  return embed({ title: `Hash (${val.length} chars)`, fields });
}

// ------------------------------------------------------------ AJUDA/PAINEL
const CATS = [
  ["🌐 Domínios", ["`/whois` — dados de registro", "`/dns` — registros DNS", "`/subdomains` — via Certificate Transparency"]],
  ["📡 Rede/IP", ["`/ip` — geo + ASN", "`/ipwhois` — dono do bloco (RDAP)", "`/reversedns` — PTR / IPs", "`/shodan` — portas expostas *(chave)*"]],
  ["🕸️ Web", ["`/headers` — cabeçalhos + tecnologias", "`/webscan` — e-mails, links, metadados"]],
  ["👤 Identidade", ["`/username` — 12+ sites", "`/email` — MX", "`/breach` — vazamentos *(chave)*"]],
  ["#️⃣ Hash", ["`/hash` — identifica e quebra (dicionário)"]],
];
function panel() {
  return embed({
    title: "🛡️ Painel OSINT — FearSec",
    description: "Ferramentas de inteligência de fontes **abertas**. Digite `/` e escolha um comando.\n\n" +
      "⚖️ Só fontes públicas. Use para investigar infraestrutura maliciosa, com autorização. Nada de doxxing ou dados pessoais vazados.",
    color: COLORS.brand,
    fields: CATS.map(([label, cmds]) => ({ name: label, value: cmds.join("\n") })),
  });
}

export const INSTANT = new Set(["osint", "ajuda", "hash"]);
export const tools = {
  whois, dns, subdomains, ip, ipwhois, reversedns, shodan,
  username, email, breach, headers, webscan, hash,
  osint: () => panel(), ajuda: () => panel(),
};
