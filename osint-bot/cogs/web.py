"""Ferramentas web: análise de cabeçalhos HTTP + detecção de tecnologias,
e varredura de página (e-mails, links e metadados).

Todas as URLs passam por uma guarda anti-SSRF (só IP público, http/https).
"""
import re
from urllib.parse import urlparse

import discord
from discord import app_commands
from discord.ext import commands

from utils import embeds, http
from utils import reply
from utils.safeurl import resolve_public_url
from utils.validators import clean_domain

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
        await reply.defer(interaction)
        safe, info = await resolve_public_url(url)
        if not safe:
            return await reply.send(interaction, embeds.error_embed("URL bloqueada", info))
        try:
            session = await http.get_session()
            async with session.get(safe, allow_redirects=True) as resp:
                headers = dict(resp.headers)
                final_url = str(resp.url)
                status = resp.status
                body = await resp.content.read(60000)  # lê só o começo p/ detectar tech
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha ao acessar", f"`{e}`"))

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
        await reply.send(interaction, e)

    # ---------------------------------------------------------------- WEBSCAN
    @app_commands.command(name="webscan", description="Extrai e-mails, links e metadados de uma página.")
    @app_commands.describe(url="Ex.: exemplo.com")
    async def webscan_cmd(self, interaction: discord.Interaction, url: str):
        await reply.defer(interaction)
        safe, info = await resolve_public_url(url)
        if not safe:
            return await reply.send(interaction, embeds.error_embed("URL bloqueada", info))
        try:
            session = await http.get_session()
            async with session.get(safe, allow_redirects=True) as resp:
                raw = await resp.content.read(400000)
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha ao acessar", f"`{e}`"))

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
        await reply.send(interaction, e)


    # ---------------------------------------------------------------- ROBOTS
    @app_commands.command(name="robots", description="Lê o robots.txt e sitemaps de um site (revela caminhos escondidos).")
    @app_commands.describe(url="Ex.: exemplo.com")
    async def robots_cmd(self, interaction: discord.Interaction, url: str):
        await reply.defer(interaction)
        safe, info = await resolve_public_url(url)
        if not safe:
            return await reply.send(interaction, embeds.error_embed("URL bloqueada", info))
        p = urlparse(safe)
        base = f"{p.scheme}://{p.hostname}"
        try:
            session = await http.get_session()
            async with session.get(base + "/robots.txt", allow_redirects=True) as resp:
                status = resp.status
                text = (await resp.text())[:8000] if status == 200 else ""
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha ao acessar", f"`{e}`"))
        e = embeds.info_embed(f"robots.txt — {info}")
        if status != 200 or not text.strip():
            embeds.add_field(e, "Resultado", f"Sem robots.txt acessível (HTTP {status}).")
            return await reply.send(interaction, e)
        disallow, sitemaps = [], []
        for line in text.splitlines():
            low = line.lower().strip()
            if low.startswith("disallow:"):
                v = line.split(":", 1)[1].strip()
                if v:
                    disallow.append(v)
            elif low.startswith("sitemap:"):
                sitemaps.append(line.split(":", 1)[1].strip())
        embeds.add_field(e, f"🚫 Disallow ({len(disallow)})", "\n".join(disallow[:20]) or "nenhum")
        if sitemaps:
            embeds.add_field(e, "🗺️ Sitemaps", "\n".join(sitemaps[:5]))
        await reply.send(interaction, e)

    # --------------------------------------------------------------- WAYBACK
    @app_commands.command(name="wayback", description="Histórico de um site no Wayback Machine (archive.org).")
    @app_commands.describe(url="Ex.: exemplo.com")
    async def wayback_cmd(self, interaction: discord.Interaction, url: str):
        await reply.defer(interaction)
        domain = clean_domain(url) or url.strip()
        try:
            avail = await http.fetch_json(f"https://archive.org/wayback/available?url={domain}")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}`"))
        snap = (avail.get("archived_snapshots") or {}).get("closest") or {}
        e = embeds.info_embed(f"Wayback Machine — {domain}")
        if snap:
            ts = snap.get("timestamp", "")
            pretty = f"{ts[:4]}-{ts[4:6]}-{ts[6:8]}" if len(ts) >= 8 else ts
            embeds.add_field(e, "Snapshot mais recente", f"[{pretty}]({snap.get('url')})")
            embeds.add_field(e, "Status HTTP no arquivo", snap.get("status"), inline=True)
        else:
            embeds.add_field(e, "Resultado", "Nenhum snapshot arquivado encontrado.")
        embeds.add_field(e, "📅 Ver todos os capturas", f"[Calendário completo](https://web.archive.org/web/*/{domain})")
        await reply.send(interaction, e)


    # ------------------------------------------------------------ UNSHORTEN
    @app_commands.command(name="unshorten", description="Expande um link encurtado/disfarçado e mostra os redirecionamentos.")
    @app_commands.describe(url="Ex.: https://bit.ly/xxxx")
    async def unshorten_cmd(self, interaction: discord.Interaction, url: str):
        await reply.defer(interaction)
        safe, info = await resolve_public_url(url)
        if not safe:
            return await reply.send(interaction, embeds.error_embed("URL bloqueada", info))
        try:
            session = await http.get_session()
            async with session.get(safe, allow_redirects=True) as resp:
                chain = [str(h.url) for h in resp.history] + [str(resp.url)]
                status = resp.status
                final_host = urlparse(str(resp.url)).hostname
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha ao seguir", f"`{e}`"))
        e = embeds.info_embed(f"Redirecionamentos — {info}",
                              f"{len(chain)} passo(s) até o destino final.")
        hops = "\n".join(f"`{i+1}.` {u}" for i, u in enumerate(chain))
        embeds.add_field(e, "Cadeia", hops[:1024])
        embeds.add_field(e, "🎯 Destino final", f"[{final_host}]({chain[-1]})")
        embeds.add_field(e, "Status HTTP", status, inline=True)
        if len(chain) > 1:
            embeds.add_field(e, "⚠️ Atenção", "Link com redirecionamento — comum em phishing e rastreadores.")
        e.set_footer(text="FearSec OSINT • destino revelado sem você precisar clicar")
        await reply.send(interaction, e)

    # ------------------------------------------------------------ SCREENSHOT
    @app_commands.command(name="screenshot", description="Tira um print de um site (preview sem precisar visitar).")
    @app_commands.describe(url="Ex.: exemplo.com")
    async def screenshot_cmd(self, interaction: discord.Interaction, url: str):
        await reply.defer(interaction)
        safe, info = await resolve_public_url(url)
        if not safe:
            return await reply.send(interaction, embeds.error_embed("URL bloqueada", info))
        shot = f"https://image.thum.io/get/width/1200/noanimate/{safe}"
        e = embeds.info_embed(f"Screenshot — {info}", f"Preview de {safe}")
        e.set_image(url=shot)
        embeds.add_field(e, "Abrir imagem", f"[clique aqui]({shot})", inline=True)
        embeds.add_field(e, "Abrir site", f"[{info}]({safe})", inline=True)
        e.set_footer(text="FearSec OSINT • preview gerado sob demanda; pode levar alguns segundos.")
        await reply.send(interaction, e)

    # -------------------------------------------------------------- URLSCAN
    @app_commands.command(name="urlscan", description="Scans recentes de um domínio no urlscan.io (útil para phishing/scam).")
    @app_commands.describe(dominio="Ex.: exemplo.com")
    async def urlscan_cmd(self, interaction: discord.Interaction, dominio: str):
        domain = clean_domain(dominio)
        if not domain:
            return await reply.send(interaction, embeds.error_embed("Domínio inválido", "Ex.: `exemplo.com`"))
        await reply.defer(interaction)
        try:
            data = await http.fetch_json(f"https://urlscan.io/api/v1/search/?q=domain:{domain}&size=6")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}`"))
        results = data.get("results", [])
        if not results:
            return await reply.send(interaction, embeds.info_embed(
                f"urlscan.io — {domain}", "Nenhum scan público encontrado para este domínio."))
        e = embeds.info_embed(f"urlscan.io — {domain}",
                              f"{data.get('total', 0)} scan(s) no total — mostrando até 6:")
        for r in results[:6]:
            page = r.get("page", {})
            task = r.get("task", {})
            when = (task.get("time") or "")[:10]
            ip = page.get("ip") or "?"
            link = r.get("result", "")
            embeds.add_field(e, (page.get("url") or domain)[:90],
                             f"[ver scan]({link}) • {when} • IP: `{ip}` • {page.get('server') or ''}")
        e.set_footer(text="FearSec OSINT • fonte: urlscan.io (scans públicos)")
        await reply.send(interaction, e)


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
