"""Ferramentas web: análise de cabeçalhos HTTP + detecção de tecnologias,
e varredura de página (e-mails, links e metadados).

Todas as URLs passam por uma guarda anti-SSRF (só IP público, http/https).
"""
import re

import discord
from discord import app_commands
from discord.ext import commands

from utils import embeds, http
from utils.safeurl import resolve_public_url

# Assinaturas simples: cabeçalho/HTML -> tecnologia
TECH_HINTS = {
    "server": {"cloudflare": "Cloudflare", "nginx": "Nginx", "apache": "Apache", "microsoft-iis": "IIS"},
    "x-powered-by": {"php": "PHP", "express": "Express", "asp.net": "ASP.NET", "next.js": "Next.js"},
}
HTML_HINTS = {
    "wp-content": "WordPress", "/_next/": "Next.js", "cdn.shopify": "Shopify",
    "wix.com": "Wix", "static.parastorage": "Wix", "drupal": "Drupal",
    "joomla": "Joomla", "gtag(": "Google Analytics", "react": "React",
}

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
LINK_RE = re.compile(r'href=[\'"]?(https?://[^\'" >]+)', re.IGNORECASE)
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_RE = re.compile(
    r'<meta[^>]+(?:name|property)=[\'"]([^\'"]+)[\'"][^>]+content=[\'"]([^\'"]*)[\'"]',
    re.IGNORECASE,
)


class Web(commands.Cog):
    """Análise de sites por fontes abertas."""

    def __init__(self, bot):
        self.bot = bot

    # ---------------------------------------------------------------- HEADERS
    @app_commands.command(name="headers", description="Cabeçalhos HTTP e tecnologias detectadas de um site.")
    @app_commands.describe(url="Ex.: exemplo.com ou https://exemplo.com")
    async def headers_cmd(self, interaction: discord.Interaction, url: str):
        await interaction.response.defer()
        safe, info = await resolve_public_url(url)
        if not safe:
            return await interaction.followup.send(embed=embeds.error_embed("URL bloqueada", info))
        try:
            session = await http.get_session()
            async with session.get(safe, allow_redirects=True) as resp:
                headers = dict(resp.headers)
                final_url = str(resp.url)
                status = resp.status
                body = await resp.content.read(60000)  # lê só o começo p/ detectar tech
        except Exception as e:
            return await interaction.followup.send(embed=embeds.error_embed("Falha ao acessar", f"`{e}`"))

        html = body.decode("utf-8", "ignore").lower()
        e = embeds.info_embed(f"Headers — {info}", f"HTTP {status} • {final_url}")

        interesting = ["server", "x-powered-by", "content-type", "location",
                       "strict-transport-security", "content-security-policy",
                       "x-frame-options", "set-cookie"]
        shown = []
        for h in interesting:
            for k, v in headers.items():
                if k.lower() == h:
                    shown.append(f"**{k}:** {str(v)[:120]}")
                    break
        embeds.add_field(e, "Cabeçalhos", "\n".join(shown) or "—")

        techs = _detect_tech(headers, html)
        embeds.add_field(e, "🧪 Tecnologias (palpite)", ", ".join(techs) if techs else "não identificado")

        sec = [h for h in ["strict-transport-security", "content-security-policy",
                           "x-frame-options", "x-content-type-options"]
               if any(k.lower() == h for k in headers)]
        embeds.add_field(e, "🛡️ Headers de segurança presentes", f"{len(sec)}/4: " + (", ".join(sec) or "nenhum"))
        await interaction.followup.send(embed=e)

    # ---------------------------------------------------------------- WEBSCAN
    @app_commands.command(name="webscan", description="Extrai e-mails, links e metadados de uma página.")
    @app_commands.describe(url="Ex.: exemplo.com")
    async def webscan_cmd(self, interaction: discord.Interaction, url: str):
        await interaction.response.defer()
        safe, info = await resolve_public_url(url)
        if not safe:
            return await interaction.followup.send(embed=embeds.error_embed("URL bloqueada", info))
        try:
            session = await http.get_session()
            async with session.get(safe, allow_redirects=True) as resp:
                raw = await resp.content.read(400000)
        except Exception as e:
            return await interaction.followup.send(embed=embeds.error_embed("Falha ao acessar", f"`{e}`"))

        text = raw.decode("utf-8", "ignore")
        emails = sorted(set(EMAIL_RE.findall(text)))
        links = sorted(set(LINK_RE.findall(text)))
        title_m = TITLE_RE.search(text)
        metas = {k.lower(): v for k, v in META_RE.findall(text)}

        e = embeds.ok_embed(f"Webscan — {info}")
        if title_m:
            embeds.add_field(e, "Título", title_m.group(1).strip()[:200])
        for key, label in [("description", "Descrição"), ("og:site_name", "Site (OG)"),
                           ("generator", "Gerado por"), ("author", "Autor")]:
            if metas.get(key):
                embeds.add_field(e, label, metas[key][:200])
        embeds.add_field(e, f"📧 E-mails ({len(emails)})",
                         "\n".join(emails[:15]) if emails else "nenhum encontrado")
        ext_links = [l for l in links if info not in l][:15]
        embeds.add_field(e, f"🔗 Links externos ({len(ext_links)} de {len(links)})",
                         "\n".join(ext_links) if ext_links else "—")
        await interaction.followup.send(embed=e)


def _detect_tech(headers: dict, html: str):
    found = set()
    lower_headers = {k.lower(): str(v).lower() for k, v in headers.items()}
    for header, mapping in TECH_HINTS.items():
        val = lower_headers.get(header, "")
        for needle, name in mapping.items():
            if needle in val:
                found.add(name)
    for needle, name in HTML_HINTS.items():
        if needle in html:
            found.add(name)
    return sorted(found)


async def setup(bot):
    await bot.add_cog(Web(bot))
