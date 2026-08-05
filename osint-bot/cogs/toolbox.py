"""Utilidades: /whatisthis (identifica o que é), Base64 e User-Agent."""
import base64 as b64
import re

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds
from utils import reply
from utils.validators import parse_ip, is_valid_email, clean_domain

_CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,}$", re.I)
_MAC_RE = re.compile(r"^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$", re.I)
_HEX_RE = re.compile(r"^[0-9a-f]+$", re.I)
_B64_RE = re.compile(r"^[A-Za-z0-9+/]+={0,2}$")
_IPPORT_RE = re.compile(r"^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$")
_HASH_LENS = {32: "MD5", 40: "SHA-1", 56: "SHA-224", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512"}


def _identify(value: str):
    """Detecta o tipo do valor. Retorna (emoji, tipo, componentes, comandos)."""
    v = value.strip()
    low = v.lower()

    if _CVE_RE.match(v):
        return "🐛", "Identificador de vulnerabilidade (CVE)", [], [f"/cve {v.upper()}"]
    if is_valid_email(v):
        return "📧", "Endereço de e-mail", [], [f"/email {v}", f"/breach {v}"]
    m = _IPPORT_RE.match(v)
    if m and parse_ip(m.group(1)):
        ip, port = m.group(1), m.group(2)
        return ("🌐", "Endereço IP com porta",
                [("IP", ip), ("Porta", port)],
                [f"/ip {ip}", f"/ipwhois {ip}", f"/reversedns {ip}", f"/shodan {ip}"])
    if parse_ip(v):
        return "🌐", "Endereço IP", [], [f"/ip {v}", f"/ipwhois {v}", f"/reversedns {v}", f"/shodan {v}"]
    if re.match(r"^AS\d+$", v, re.I):
        return "📡", "Número de sistema autônomo (ASN)", [], [f"/asn {v.upper()}"]
    if re.match(r"^\+\d[\d\s\-()]{6,}$", v):
        return "📱", "Número de telefone", [], [f"/phone {v}"]
    if low.startswith(("http://", "https://")):
        return ("🔗", "URL / link", [],
                [f"/headers {v}", f"/webscan {v}", f"/robots {v}", f"/wayback {v}"])
    if _MAC_RE.match(v):
        return "🖧", "Endereço MAC (placa de rede)", [("Fabricante", "consulte a OUI online")], []
    if "mozilla/" in low or "applewebkit" in low or low.startswith(("curl/", "wget/")):
        return "🧭", "String de User-Agent", [], [f"/useragent {v[:80]}"]
    if _HEX_RE.match(v) and len(v) in _HASH_LENS:
        return "#️⃣", f"Hash ({_HASH_LENS[len(v)]})", [], [f"/hash {v}"]
    d = clean_domain(v)
    if d:
        return ("🌐", "Domínio / site", [],
                [f"/whois {d}", f"/dns {d}", f"/subdomains {d}", f"/headers {d}", f"/dork {d}"])
    if (_B64_RE.match(v) and len(v) % 4 == 0 and len(v) >= 8
            and (v.endswith("=") or "+" in v or "/" in v)):
        return "🔐", "Possível texto em Base64", [], [f"/base64 (decode) {v[:40]}"]
    if re.match(r"^@?[\w.\-]{2,40}$", v):
        return "👤", "Possível nome de usuário", [], [f"/username {v.lstrip('@')}"]
    return None, None, [], []

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

    # ----------------------------------------------------------- WHATISTHIS
    @app_commands.command(name="whatisthis", description="Cole qualquer coisa e o bot diz o que é e qual comando usar.")
    @app_commands.describe(valor="IP, domínio, e-mail, telefone, hash, URL, CVE, username…")
    async def whatisthis_cmd(self, interaction: discord.Interaction, valor: str):
        emoji, tipo, comps, cmds = _identify(valor)
        if not tipo:
            e = embeds.error_embed("Não reconheci", f"Não consegui identificar `{valor.strip()[:80]}`.\n"
                                   "Tente um IP, domínio, e-mail, telefone (+55…), hash, URL, CVE ou username.")
            return await reply.send(interaction, e)
        e = embeds.info_embed(f"{emoji} Isto é: {tipo}", f"`{valor.strip()[:200]}`")
        for name, detail in comps:
            embeds.add_field(e, name, detail, inline=True)
        if cmds:
            embeds.add_field(e, "✅ Comandos recomendados",
                             "\n".join(f"`{c}`" for c in cmds))
        else:
            embeds.add_field(e, "ℹ️ Observação", "Ainda não tenho um comando específico para este tipo.")
        e.set_footer(text=f"{config.BRAND_NAME} • copie um comando acima para investigar")
        await reply.send(interaction, e)

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
