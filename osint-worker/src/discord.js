// Helpers de Discord: verificação de assinatura, embeds e follow-up.

export const COLORS = { brand: 0x2ECC71, info: 0x3498DB, error: 0xE74C3C };
const FOOTER = "FearSec OSINT • use com responsabilidade e permissão";

// Monta um embed já com limites do Discord respeitados.
export function embed({ title, description = "", color = COLORS.info, fields = [], footer = FOOTER }) {
  return {
    title: String(title).slice(0, 256),
    description: String(description).slice(0, 4096),
    color,
    fields: fields
      .filter((f) => f && f.name)
      .map((f) => ({
        name: String(f.name).slice(0, 256),
        value: (f.value === "" || f.value == null ? "—" : String(f.value)).slice(0, 1024),
        inline: !!f.inline,
      })),
    footer: { text: footer },
  };
}

export function errorEmbed(title, description = "") {
  return embed({ title: "⚠️ " + title, description, color: COLORS.error });
}

export function okEmbed(title, description = "") {
  return embed({ title: "✅ " + title, description, color: COLORS.brand });
}

// ---- Verificação da assinatura Ed25519 (obrigatória pelo Discord) ----
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function verifyRequest(request, publicKey) {
  const sig = request.headers.get("X-Signature-Ed25519");
  const ts = request.headers.get("X-Signature-Timestamp");
  const body = await request.text();
  if (!sig || !ts) return { valid: false, body };
  try {
    const key = await crypto.subtle.importKey(
      "raw", hexToBytes(publicKey), { name: "Ed25519" }, false, ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "Ed25519", key, hexToBytes(sig), new TextEncoder().encode(ts + body)
    );
    return { valid, body };
  } catch {
    return { valid: false, body };
  }
}

// Edita a resposta "pensando..." depois que a ferramenta termina (deferred).
export async function editOriginal(env, token, data) {
  const url = `https://discord.com/api/v10/webhooks/${env.APPLICATION_ID}/${token}/messages/@original`;
  await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Lê o valor de uma opção do comando.
export function opt(data, name) {
  const o = (data.options || []).find((x) => x.name === name);
  return o ? o.value : undefined;
}
