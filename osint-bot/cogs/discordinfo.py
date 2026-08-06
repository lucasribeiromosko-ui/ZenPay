"""Ferramentas de Discord: investigar conta/servidor, decodificar snowflake, ping."""
import re

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, http, reply

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

    # -------------------------------------------------------------- INVITE
    @app_commands.command(name="invite", description="Investiga um convite do Discord: servidor, ID, membros e criação.")
    @app_commands.describe(convite="Link ou código, ex.: discord.gg/abcd ou abcd")
    async def invite_cmd(self, interaction: discord.Interaction, convite: str):
        code = convite.strip().rstrip("/").split("/")[-1].split("?")[0]
        if not re.match(r"^[A-Za-z0-9-]{1,25}$", code):
            return await reply.send(interaction, embeds.error_embed("Convite inválido", "Use `discord.gg/codigo` ou só o código."))
        await reply.defer(interaction)
        try:
            data = await http.fetch_json(
                f"https://discord.com/api/v10/invites/{code}?with_counts=true&with_expiration=true")
        except Exception:
            return await reply.send(interaction, embeds.error_embed("Convite não encontrado", "Expirou, é inválido ou o servidor foi removido."))
        guild = data.get("guild") or {}
        channel = data.get("channel") or {}
        inviter = data.get("inviter") or {}
        gid = guild.get("id")
        e = embeds.info_embed(f"Convite — {guild.get('name') or 'servidor'}")
        if guild.get("icon") and gid:
            e.set_thumbnail(url=f"https://cdn.discordapp.com/icons/{gid}/{guild['icon']}.png")
        embeds.add_field(e, "Servidor", guild.get("name"))
        embeds.add_field(e, "ID do servidor", gid, inline=True)
        if gid and str(gid).isdigit():
            embeds.add_field(e, "Criado em", f"<t:{_snowflake_ts(int(gid))}:D>", inline=True)
        embeds.add_field(e, "Membros", data.get("approximate_member_count"), inline=True)
        embeds.add_field(e, "Online agora", data.get("approximate_presence_count"), inline=True)
        embeds.add_field(e, "Canal", f"#{channel.get('name')}" if channel.get("name") else "—", inline=True)
        if inviter:
            embeds.add_field(e, "Convidado por", f"@{inviter.get('username')} (ID {inviter.get('id')})")
        if guild.get("description"):
            embeds.add_field(e, "Descrição", guild["description"][:300])
        e.set_footer(text=f"{config.BRAND_NAME} • dados públicos do convite")
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
