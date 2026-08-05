"""Utilidades: Base64 (codificar/decodificar) e análise de User-Agent."""
import base64 as b64

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds
from utils import reply

# (marcador no texto, rótulo) — ordem importa (mais específico primeiro)
OS_HINTS = [
    ("windows nt 10", "Windows 10/11"), ("windows nt", "Windows"),
    ("iphone", "iOS (iPhone)"), ("ipad", "iPadOS"), ("android", "Android"),
    ("mac os x", "macOS"), ("cros", "ChromeOS"), ("linux", "Linux"),
]
BROWSER_HINTS = [
    ("edg/", "Edge"), ("opr/", "Opera"), ("chrome/", "Chrome"),
    ("firefox/", "Firefox"), ("safari/", "Safari"),
]
BOT_HINTS = ["bot", "crawler", "spider", "curl", "wget", "python-requests", "postman"]


class Toolbox(commands.Cog):
    """Ferramentas utilitárias."""

    def __init__(self, bot):
        self.bot = bot

    # --------------------------------------------------------------- BASE64
    @app_commands.command(name="base64", description="Codifica ou decodifica um texto em Base64.")
    @app_commands.describe(acao="Codificar ou decodificar", texto="O texto de entrada")
    @app_commands.choices(acao=[
        app_commands.Choice(name="codificar (encode)", value="encode"),
        app_commands.Choice(name="decodificar (decode)", value="decode"),
    ])
    async def base64_cmd(self, interaction: discord.Interaction,
                         acao: app_commands.Choice[str], texto: str):
        try:
            if acao.value == "encode":
                out = b64.b64encode(texto.encode("utf-8")).decode("ascii")
            else:
                padded = texto.strip() + "=" * (-len(texto.strip()) % 4)
                out = b64.b64decode(padded).decode("utf-8", "replace")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha", f"Não consegui processar.\n`{e}`"))
        e = embeds.info_embed(f"Base64 — {acao.name}")
        embeds.add_field(e, "Resultado", f"```\n{out[:1000]}\n```")
        await reply.send(interaction, e)

    # ------------------------------------------------------------ USERAGENT
    @app_commands.command(name="useragent", description="Analisa uma string de User-Agent (SO, navegador, tipo).")
    @app_commands.describe(ua="Cole a string do User-Agent")
    async def useragent_cmd(self, interaction: discord.Interaction, ua: str):
        low = ua.strip().lower()
        os_name = next((label for m, label in OS_HINTS if m in low), "desconhecido")
        browser = next((label for m, label in BROWSER_HINTS if m in low), "desconhecido")
        is_bot = any(b in low for b in BOT_HINTS)
        is_mobile = any(m in low for m in ("mobile", "iphone", "android"))
        e = embeds.info_embed("Análise de User-Agent", f"```\n{ua.strip()[:300]}\n```")
        embeds.add_field(e, "Sistema", os_name, inline=True)
        embeds.add_field(e, "Navegador", browser, inline=True)
        embeds.add_field(e, "Dispositivo", "📱 Móvel" if is_mobile else "💻 Desktop", inline=True)
        embeds.add_field(e, "Tipo", "🤖 Bot/automação" if is_bot else "👤 Navegador humano", inline=True)
        await reply.send(interaction, e)


async def setup(bot):
    await bot.add_cog(Toolbox(bot))
