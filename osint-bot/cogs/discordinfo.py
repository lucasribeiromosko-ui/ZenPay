"""Ferramentas de Discord: investigar conta por ID, decodificar snowflake, ping."""
import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, reply

DISCORD_EPOCH = 1420070400000  # ms


def _snowflake_ts(sid: int) -> int:
    """Retorna o timestamp UNIX (segundos) de criação de um snowflake."""
    return ((sid >> 22) + DISCORD_EPOCH) // 1000


class DiscordInfo(commands.Cog):
    """Investigação de contas e IDs do Discord."""

    def __init__(self, bot):
        self.bot = bot

    # ------------------------------------------------------------- DISCORD
    @app_commands.command(name="discord", description="Investiga uma conta do Discord pelo ID (nome, criação, badges).")
    @app_commands.describe(user_id="ID numérico do usuário (ative o Modo Desenvolvedor para copiar)")
    async def discord_cmd(self, interaction: discord.Interaction, user_id: str):
        uid = user_id.strip()
        if not uid.isdigit() or len(uid) < 15:
            return await reply.send(interaction, embeds.error_embed(
                "ID inválido", "Cole o **ID numérico** do usuário (clique com o direito → Copiar ID)."))
        await reply.defer(interaction)
        try:
            user = await self.bot.fetch_user(int(uid))
        except discord.NotFound:
            return await reply.send(interaction, embeds.error_embed("Não encontrado", f"Nenhuma conta com o ID `{uid}`."))
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}`"))

        ts = int(user.created_at.timestamp())
        f = user.public_flags
        badge_map = [
            (f.staff, "Discord Staff"), (f.partner, "Partner"),
            (f.hypesquad, "HypeSquad Events"), (f.bug_hunter, "Bug Hunter"),
            (f.hypesquad_bravery, "HypeSquad Bravery"), (f.hypesquad_brilliance, "HypeSquad Brilliance"),
            (f.hypesquad_balance, "HypeSquad Balance"), (f.early_supporter, "Early Supporter"),
            (f.bug_hunter_level_2, "Bug Hunter II"), (f.verified_bot_developer, "Early Verified Bot Dev"),
            (f.discord_certified_moderator, "Certified Moderator"), (f.active_developer, "Active Developer"),
        ]
        badges = [name for cond, name in badge_map if cond]

        e = embeds.info_embed(f"Discord — {user}", f"**{user.global_name or user.name}**")
        e.set_thumbnail(url=user.display_avatar.url)
        embeds.add_field(e, "Username", f"@{user.name}", inline=True)
        embeds.add_field(e, "ID", user.id, inline=True)
        embeds.add_field(e, "Bot?", "🤖 sim" if user.bot else "👤 não", inline=True)
        embeds.add_field(e, "Conta criada", f"<t:{ts}:F>\n(<t:{ts}:R>)")
        embeds.add_field(e, "Badges", ", ".join(badges) if badges else "nenhuma pública")
        embeds.add_field(e, "Avatar", f"[abrir imagem]({user.display_avatar.url})", inline=True)
        if user.banner:
            embeds.add_field(e, "Banner", f"[abrir imagem]({user.banner.url})", inline=True)
        e.set_footer(text=f"{config.BRAND_NAME} • dados públicos da conta")
        await reply.send(interaction, e)

    # ----------------------------------------------------------- SNOWFLAKE
    @app_commands.command(name="snowflake", description="Decodifica um ID do Discord (usuário/msg/canal) para a data de criação.")
    @app_commands.describe(id="O ID numérico (snowflake)")
    async def snowflake_cmd(self, interaction: discord.Interaction, id: str):
        sid = id.strip()
        if not sid.isdigit() or len(sid) < 15:
            return await reply.send(interaction, embeds.error_embed("ID inválido", "Cole um ID numérico do Discord."))
        ts = _snowflake_ts(int(sid))
        e = embeds.info_embed(f"Snowflake — {sid}")
        embeds.add_field(e, "Criado em", f"<t:{ts}:F>")
        embeds.add_field(e, "Há quanto tempo", f"<t:{ts}:R>", inline=True)
        embeds.add_field(e, "UNIX", ts, inline=True)
        await reply.send(interaction, e)

    # ---------------------------------------------------------------- PING
    @app_commands.command(name="ping", description="Mostra a latência e o status do bot.")
    async def ping_cmd(self, interaction: discord.Interaction):
        ms = round(self.bot.latency * 1000)
        e = embeds.ok_embed("Pong 🏓", f"Latência do gateway: **{ms} ms**\nBot online e operante.")
        await reply.send(interaction, e)


async def setup(bot):
    await bot.add_cog(DiscordInfo(bot))
