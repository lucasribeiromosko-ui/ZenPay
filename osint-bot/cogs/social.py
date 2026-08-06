"""Redes sociais e identidade:
- /instagram : dados públicos de um perfil do Instagram (nome, bio, seguidores…)
- /sherlock  : varredura de um @username em dezenas de sites (estilo Sherlock)

Só usa dados PÚBLICOS de perfis públicos. Não acessa mensagens, contas
privadas, listas de seguidores nem nada que exija login.
"""
import asyncio
import re

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, http
from utils import reply

_IG_USER_RE = re.compile(r"^[A-Za-z0-9._]{1,30}$")
_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Sites para o /sherlock: (nome, template com {}, 404_confiável)
# 404_confiável=True -> HTTP 200 significa "existe". False -> marca "incerto".
SHERLOCK_SITES = [
    ("GitHub", "https://github.com/{}", True),
    ("GitLab", "https://gitlab.com/{}", True),
    ("Bitbucket", "https://bitbucket.org/{}/", True),
    ("Reddit", "https://www.reddit.com/user/{}", True),
    ("Telegram", "https://t.me/{}", True),
    ("Steam", "https://steamcommunity.com/id/{}", True),
    ("Keybase", "https://keybase.io/{}", True),
    ("Replit", "https://replit.com/@{}", True),
    ("PyPI", "https://pypi.org/user/{}/", True),
    ("npm", "https://www.npmjs.com/~{}", True),
    ("Docker Hub", "https://hub.docker.com/u/{}", True),
    ("SoundCloud", "https://soundcloud.com/{}", True),
    ("Vimeo", "https://vimeo.com/{}", True),
    ("About.me", "https://about.me/{}", True),
    ("Pastebin", "https://pastebin.com/u/{}", True),
    ("Chess.com", "https://www.chess.com/member/{}", True),
    ("Kick", "https://kick.com/{}", True),
    ("Behance", "https://www.behance.net/{}", True),
    ("DeviantArt", "https://www.deviantart.com/{}", True),
    ("Linktree", "https://linktr.ee/{}", True),
    ("Gravatar", "https://gravatar.com/{}", True),
    ("Wattpad", "https://www.wattpad.com/user/{}", True),
    ("Buy Me a Coffee", "https://www.buymeacoffee.com/{}", True),
    ("Ko-fi", "https://ko-fi.com/{}", True),
    ("Gumroad", "https://{}.gumroad.com/", True),
    ("Last.fm", "https://www.last.fm/user/{}", True),
    ("Flickr", "https://www.flickr.com/people/{}", True),
    ("Dribbble", "https://dribbble.com/{}", True),
    ("Product Hunt", "https://www.producthunt.com/@{}", True),
    ("Patreon", "https://www.patreon.com/{}", True),
    ("Roblox", "https://www.roblox.com/user.aspx?username={}", True),
    ("itch.io", "https://{}.itch.io/", True),
    ("HackerOne", "https://hackerone.com/{}", True),
    ("CodePen", "https://codepen.io/{}", True),
    ("Dev.to", "https://dev.to/{}", True),
    ("Hashnode", "https://hashnode.com/@{}", True),
    ("Trakt", "https://trakt.tv/users/{}", True),
    ("Slides", "https://slides.com/{}", True),
    ("Kaggle", "https://www.kaggle.com/{}", True),
    ("VSCO", "https://vsco.co/{}", True),
    ("Fiverr", "https://www.fiverr.com/{}", True),
    ("Tumblr", "https://{}.tumblr.com/", True),
    ("Blogger", "https://{}.blogspot.com/", True),
    ("WordPress", "https://{}.wordpress.com/", True),
    ("Genius", "https://genius.com/{}", True),
    # Costumam bloquear/mascarar -> ficam como "incerto"
    ("Instagram", "https://www.instagram.com/{}/", False),
    ("X (Twitter)", "https://x.com/{}", False),
    ("TikTok", "https://www.tiktok.com/@{}", False),
    ("Twitch", "https://www.twitch.tv/{}", False),
    ("YouTube", "https://www.youtube.com/@{}", False),
    ("Pinterest", "https://www.pinterest.com/{}/", False),
    ("Facebook", "https://www.facebook.com/{}", False),
    ("Medium", "https://medium.com/@{}", False),
]


class Social(commands.Cog):
    """Perfis públicos em redes sociais."""

    def __init__(self, bot):
        self.bot = bot

    # ------------------------------------------------------------ INSTAGRAM
    @app_commands.command(name="instagram", description="Dados públicos de um perfil do Instagram (nome, bio, seguidores…).")
    @app_commands.describe(usuario="@ do perfil, ex.: instagram")
    async def instagram_cmd(self, interaction: discord.Interaction, usuario: str):
        user = usuario.strip().lstrip("@").lower()
        if not _IG_USER_RE.match(user):
            return await reply.send(interaction, embeds.error_embed(
                "Usuário inválido", "Use só o @ do perfil, ex.: `instagram`."))
        await reply.defer(interaction)
        # 1) API oficial (dados ricos); 2) fallback via metadados da página (og:)
        status, data = await _ig_api(user)
        diag = f"API={data}"
        if status == "blocked":
            status, data = await _ig_html(user)
            diag += f" · HTML={data}"

        if status == "notfound":
            return await reply.send(interaction, embeds.error_embed(
                "Perfil não encontrado", f"`@{user}` não existe ou foi removido."))
        if status != "ok":
            e = embeds.error_embed("Instagram bloqueou a leitura automática",
                "O Instagram recusa consultas vindas de **servidores** (o bot roda em "
                "datacenter). É proteção anti-bot do Instagram, não um erro do bot.")
            embeds.add_field(e, "Ver o perfil direto", f"https://www.instagram.com/{user}/")
            if config.IG_SESSIONID:
                proxy_hint = ("\n**429 = o IP do servidor está bloqueado pelo Instagram.** "
                              "A única solução real é um **proxy residencial** na variável "
                              "`IG_PROXY`.") if not config.IG_PROXY else ""
                embeds.add_field(e, "🔎 Diagnóstico (cookie configurado)",
                    f"`{diag}`\n401 = cookie inválido/expirado • 429 = IP bloqueado • "
                    f"302/login = cookie não autenticou.{proxy_hint}")
            else:
                embeds.add_field(e, "🔓 Como fazer funcionar",
                    "Defina a variável **`IG_SESSIONID`** no Railway com o cookie `sessionid` "
                    "da sua conta logada. Aí o bot lê perfis públicos normalmente.")
            return await reply.send(interaction, e)

        verified = data.get("is_verified")
        e = embeds.info_embed(f"📸 Instagram — @{user}",
                              f"**{data.get('full_name') or '—'}**" + ("  ☑️" if verified else ""))
        if data.get("profile_pic"):
            e.set_thumbnail(url=data["profile_pic"])
        embeds.add_field(e, "Seguidores", data.get("followers") or "—", inline=True)
        embeds.add_field(e, "Seguindo", data.get("following") or "—", inline=True)
        embeds.add_field(e, "Publicações", data.get("posts") or "—", inline=True)
        if data.get("is_private") is not None:
            embeds.add_field(e, "Conta", "🔒 privada" if data["is_private"] else "🌐 pública", inline=True)
        if data.get("category"):
            embeds.add_field(e, "Categoria", data["category"], inline=True)
        if data.get("uid"):
            embeds.add_field(e, "ID numérico", data["uid"], inline=True)
        if data.get("biography"):
            embeds.add_field(e, "Bio", data["biography"][:500])
        if data.get("external_url"):
            embeds.add_field(e, "Link externo", data["external_url"])
        embeds.add_field(e, "Perfil", f"https://www.instagram.com/{user}/")
        src = "API" if data.get("source") == "api" else "metadados públicos"
        e.set_footer(text=f"{config.BRAND_NAME} • dados públicos do perfil • fonte: {src}")
        await reply.send(interaction, e)

    # --------------------------------------------------------------- GITHUB
    @app_commands.command(name="github", description="Dados públicos de um perfil do GitHub (nome, empresa, local, e-mail).")
    @app_commands.describe(usuario="Nome de usuário do GitHub")
    async def github_cmd(self, interaction: discord.Interaction, usuario: str):
        user = usuario.strip().lstrip("@")
        if not re.match(r"^[A-Za-z0-9-]{1,39}$", user):
            return await reply.send(interaction, embeds.error_embed("Usuário inválido", "Nome de usuário do GitHub incorreto."))
        await reply.defer(interaction)
        try:
            data = await http.fetch_json(f"https://api.github.com/users/{user}")
        except Exception:
            return await reply.send(interaction, embeds.error_embed("Não encontrado", f"`{user}` não existe no GitHub (ou limite de uso)."))
        created = (data.get("created_at") or "")[:10]
        e = embeds.info_embed(f"🐙 GitHub — @{data.get('login', user)}",
                              f"**{data.get('name') or '—'}**")
        if data.get("avatar_url"):
            e.set_thumbnail(url=data["avatar_url"])
        if data.get("bio"):
            embeds.add_field(e, "Bio", data["bio"][:300])
        embeds.add_field(e, "Repositórios", data.get("public_repos", 0), inline=True)
        embeds.add_field(e, "Seguidores", data.get("followers", 0), inline=True)
        embeds.add_field(e, "Criado em", created, inline=True)
        for label, key in [("Empresa", "company"), ("Local", "location"),
                           ("E-mail público", "email"), ("Site/blog", "blog"),
                           ("Twitter/X", "twitter_username")]:
            if data.get(key):
                embeds.add_field(e, label, str(data[key])[:100], inline=True)
        embeds.add_field(e, "Perfil", data.get("html_url", f"https://github.com/{user}"))
        e.set_footer(text=f"{config.BRAND_NAME} • dados públicos do GitHub")
        await reply.send(interaction, e)

    # ------------------------------------------------------------- SHERLOCK
    @app_commands.command(name="sherlock", description="Procura um @username em dezenas de sites (varredura completa).")
    @app_commands.describe(username="Nome de usuário (sem @)")
    async def sherlock_cmd(self, interaction: discord.Interaction, username: str):
        uname = username.strip().lstrip("@")
        if not uname or len(uname) > 40 or "/" in uname or " " in uname:
            return await reply.send(interaction, embeds.error_embed(
                "Username inválido", "Use apenas o nome, sem espaços ou `/`."))
        await reply.defer(interaction)

        results = await asyncio.gather(*[_check(name, tmpl, rel, uname) for name, tmpl, rel in SHERLOCK_SITES])
        found = [(n, u) for (n, u, st) in results if st is True]
        maybe = [(n, u) for (n, u, st) in results if st is None]
        n_not = sum(1 for (_, _, st) in results if st is False)

        e = embeds.ok_embed(f"Sherlock — {uname}",
                            f"Encontrado em **{len(found)}** de {len(SHERLOCK_SITES)} sites "
                            f"• {len(maybe)} incertos • {n_not} sem conta.")
        _add_links(e, "✅ Perfis encontrados", found)
        _add_links(e, "❔ Incerto (checar manual)", maybe[:20])
        e.set_footer(text=f"{config.BRAND_NAME} • existir ≠ ser a mesma pessoa. Cruze as evidências.")
        await reply.send(interaction, e)


def _fmt_int(n):
    try:
        return f"{int(n):,}".replace(",", ".")
    except (TypeError, ValueError):
        return None


async def _ig_api(user: str):
    """API oficial web_profile_info. ('ok', normalizado) | 'notfound' | 'blocked'."""
    url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={user}"
    headers = {
        "x-ig-app-id": "936619743392459",
        "User-Agent": _UA,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"https://www.instagram.com/{user}/",
    }
    if config.IG_SESSIONID:
        headers["Cookie"] = f"sessionid={config.IG_SESSIONID}"
    try:
        session = await http.get_session()
        async with session.get(url, headers=headers, proxy=config.IG_PROXY) as resp:
            if resp.status == 404:
                return "notfound", None
            if resp.status != 200:
                return "blocked", resp.status
            payload = await resp.json(content_type=None)
    except Exception as ex:
        return "blocked", str(ex)[:40]
    u = (payload.get("data") or {}).get("user")
    if not u:
        return "notfound", None
    return "ok", {
        "full_name": u.get("full_name"),
        "biography": u.get("biography"),
        "followers": _fmt_int((u.get("edge_followed_by") or {}).get("count")),
        "following": _fmt_int((u.get("edge_follow") or {}).get("count")),
        "posts": _fmt_int((u.get("edge_owner_to_timeline_media") or {}).get("count")),
        "is_private": u.get("is_private"),
        "is_verified": u.get("is_verified"),
        "external_url": u.get("external_url"),
        "profile_pic": u.get("profile_pic_url_hd") or u.get("profile_pic_url"),
        "uid": u.get("id"),
        "category": u.get("category_name"),
        "source": "api",
    }


async def _ig_html(user: str):
    """Fallback: lê os metadados og: da página pública (funciona quando a API bloqueia)."""
    url = f"https://www.instagram.com/{user}/"
    headers = {"User-Agent": _UA, "Accept-Language": "en-US,en;q=0.9"}
    if config.IG_SESSIONID:
        headers["Cookie"] = f"sessionid={config.IG_SESSIONID}"
    try:
        session = await http.get_session()
        async with session.get(url, headers=headers, allow_redirects=True, proxy=config.IG_PROXY) as resp:
            if resp.status == 404:
                return "notfound", None
            if resp.status != 200:
                return "blocked", resp.status
            html = await resp.text()
    except Exception as ex:
        return "blocked", str(ex)[:40]

    def meta(prop):
        m = re.search(rf'<meta property="{re.escape(prop)}" content="([^"]*)"', html)
        return m.group(1) if m else None

    # RIGOROSO: só confia se o og:title for do perfil pedido (contém (@user))
    # e se houver os contadores na og:description da própria página.
    title = meta("og:title") or ""
    if f"@{user}".lower() not in title.lower().replace(" ", ""):
        return "blocked", "pagina-muro"  # Instagram não serviu o perfil real
    desc = meta("og:description") or ""
    counts = re.search(r'([\d.,KMkm]+)\s+Followers,\s*([\d.,KMkm]+)\s+Following,\s*([\d.,KMkm]+)\s+Posts', desc)
    if not counts:
        return "blocked", "sem contadores"
    tm = re.search(r'^(.*?)\s*\(@', title)
    return "ok", {
        "full_name": tm.group(1).strip() if tm else None,
        "biography": None,
        "followers": counts.group(1),
        "following": counts.group(2),
        "posts": counts.group(3),
        "is_private": None,
        "is_verified": None,
        "external_url": None,
        "profile_pic": meta("og:image"),
        "uid": None,
        "category": None,
        "source": "html",
    }


async def _check(name, template, reliable, uname):
    """Retorna (nome, url, status) — True existe, False não, None incerto."""
    url = template.format(uname)
    try:
        session = await http.get_session()
        async with session.get(url, allow_redirects=True, headers={"User-Agent": _UA}) as resp:
            if resp.status == 200:
                return (name, url, True if reliable else None)
            if resp.status in (404, 410):
                return (name, url, False)
            return (name, url, None)
    except Exception:
        return (name, url, None)


def _add_links(embed, title, items):
    """Adiciona links em um ou mais campos, respeitando o limite de 1024."""
    if not items:
        embeds.add_field(embed, title, "nenhum")
        return
    line = ""
    part = 1
    for n, u in items:
        piece = f"[{n}]({u})  "
        if len(line) + len(piece) > 1000:
            embeds.add_field(embed, f"{title} ({part})", line)
            line = ""
            part += 1
        line += piece
    if line:
        embeds.add_field(embed, title if part == 1 else f"{title} ({part})", line)


async def setup(bot):
    await bot.add_cog(Social(bot))
