// Utilitários compartilhados: validação, DNS-over-HTTPS, fetch com timeout.

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function cleanDomain(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "").split("/")[0].split("?")[0].split(":")[0];
  s = s.replace(/^\.+|\.+$/g, "");
  return DOMAIN_RE.test(s) ? s : null;
}

export function isValidEmail(raw) {
  return EMAIL_RE.test(String(raw || "").trim());
}

export function isIPv4(raw) {
  const m = String(raw || "").trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  return m.slice(1).every((o) => Number(o) >= 0 && Number(o) <= 255);
}

// Consulta DNS-over-HTTPS na Cloudflare (1.1.1.1).
export async function doh(name, type) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const r = await fetchT(url, { headers: { accept: "application/dns-json" } });
  return await r.json();
}

// fetch com timeout (Workers cortam requests longas de qualquer forma).
export async function fetchT(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: { "user-agent": "FearSec-OSINT-Worker/1.0", ...(opts.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

// Lê o nome (fn) de uma entidade RDAP (vcardArray).
export function vcardName(entity) {
  const v = entity && entity.vcardArray;
  if (!v || v.length < 2) return null;
  for (const item of v[1]) {
    if (Array.isArray(item) && item[0] === "fn") return item[3];
  }
  return null;
}
