"""Helpers para criar embeds bonitos e consistentes."""
import discord
import config


def base_embed(title: str, description: str = "", color: int = config.INFO_COLOR) -> discord.Embed:
    """Cria um embed padrão com o rodapé da marca."""
    embed = discord.Embed(title=title, description=description, color=color)
    embed.set_footer(text=f"{config.BRAND_NAME} • use com responsabilidade e permissão")
    return embed


def ok_embed(title: str, description: str = "") -> discord.Embed:
    return base_embed(f"✅ {title}", description, config.BRAND_COLOR)


def info_embed(title: str, description: str = "") -> discord.Embed:
    return base_embed(f"🔎 {title}", description, config.INFO_COLOR)


def error_embed(title: str, description: str = "") -> discord.Embed:
    return base_embed(f"⚠️ {title}", description, config.ERROR_COLOR)


def add_field(embed: discord.Embed, name: str, value, inline: bool = False):
    """Adiciona um campo, truncando com segurança para os limites do Discord."""
    if value is None or value == "":
        value = "—"
    text = str(value)
    if len(text) > 1024:
        text = text[:1015] + "…"
    embed.add_field(name=name[:256], value=text, inline=inline)
    return embed
