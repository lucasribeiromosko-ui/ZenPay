// Registra os slash commands no Discord. Rode UMA vez (e sempre que
// adicionar/mudar comandos):
//
//   DISCORD_TOKEN=seu_token APPLICATION_ID=seu_app_id node register.js
//
// (opcional) GUILD_ID=seu_servidor -> registra só no seu servidor (aparece na hora).
//
// O token é usado SÓ aqui, na sua máquina, e nunca vai pro Worker.
import { COMMANDS } from "./commands.js";

const TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = process.env.APPLICATION_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !APP_ID) {
  console.error("ERRO: defina DISCORD_TOKEN e APPLICATION_ID como variáveis de ambiente.");
  console.error('Ex.: DISCORD_TOKEN=xxx APPLICATION_ID=123 node register.js');
  process.exit(1);
}

const url = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const res = await fetch(url, {
  method: "PUT",
  headers: { Authorization: `Bot ${TOKEN}`, "content-type": "application/json" },
  body: JSON.stringify(COMMANDS),
});

if (res.ok) {
  const data = await res.json();
  console.log(`✅ ${data.length} comandos registrados ${GUILD_ID ? "no servidor (instantâneo)" : "globalmente (até ~1h)"}.`);
} else {
  console.error(`❌ Falha (${res.status}):`, await res.text());
  process.exit(1);
}
