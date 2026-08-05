// Entrada do Cloudflare Worker: valida a assinatura do Discord e roteia
// as interações (slash commands) para as ferramentas.
import { verifyRequest, editOriginal, errorEmbed } from "./discord.js";
import { tools, INSTANT } from "./tools.js";

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "content-type": "application/json" } });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("FearSec OSINT Worker está no ar. Configure o endpoint no Discord Developer Portal.", {
        status: 200,
      });
    }

    const { valid, body } = await verifyRequest(request, env.DISCORD_PUBLIC_KEY);
    if (!valid) return new Response("assinatura inválida", { status: 401 });

    const interaction = JSON.parse(body);

    // PING do Discord (validação do endpoint)
    if (interaction.type === 1) return json({ type: 1 });

    // Slash command
    if (interaction.type === 2) {
      const name = interaction.data.name;
      const handler = tools[name];
      if (!handler) {
        return json({ type: 4, data: { embeds: [errorEmbed("Comando desconhecido", name)] } });
      }

      // Comandos instantâneos respondem na hora
      if (INSTANT.has(name)) {
        try {
          const em = await handler(interaction.data, env);
          return json({ type: 4, data: { embeds: [em] } });
        } catch (e) {
          return json({ type: 4, data: { embeds: [errorEmbed("Erro", String(e.message || e))] } });
        }
      }

      // Demais: "pensando…" (type 5) e trabalho em segundo plano
      ctx.waitUntil(
        (async () => {
          let em;
          try {
            em = await handler(interaction.data, env);
          } catch (e) {
            em = errorEmbed("Erro na ferramenta", "`" + String(e.message || e) + "`");
          }
          await editOriginal(env, interaction.token, { embeds: [em] });
        })()
      );
      return json({ type: 5 });
    }

    return json({ type: 4, data: { content: "Interação não suportada." } });
  },
};
