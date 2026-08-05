"""Ferramentas de identidade: enumeração de username em sites públicos,
verificação de vazamentos (HIBP) e checagem de e-mail (formato + MX).

IMPORTANTE: só trabalha com dados que a própria pessoa tornou público
(perfis abertos) ou com serviços de defesa (HIBP). Não consulta bases
de dados pessoais vazadas nem faz "puxada" de CPF/endereço.
"""
import asyncio
import hashlib

import discord
from discord import app_commands
from discord.ext import commands

import dns.asyncresolver
import phonenumbers
from phonenumbers import geocoder, carrier, timezone as ph_tz, number_type, PhoneNumberType

import config
from utils import embeds, http
from utils import reply
from utils.validators import is_valid_email

# Sites com padrão de URL de perfil público previsível.
# {} é substituído pelo username.
SITES = {
    # Sites com 404 confiável (bons para confirmar existência)
    "GitHub": "https://github.com/{}",
    "GitLab": "https://gitlab.com/{}",
    "Reddit": "https://www.reddit.com/user/{}",
    "Telegram": "https://t.me/{}",
    "Steam": "https://steamcommunity.com/id/{}",
    "Keybase": "https://keybase.io/{}",
    "Replit": "https://replit.com/@{}",
    "PyPI": "https://pypi.org/user/{}/",
    "npm": "https://www.npmjs.com/~{}",
    "Docker Hub": "https://hub.docker.com/u/{}",
    "SoundCloud": "https://soundcloud.com/{}",
    "Vimeo": "https://vimeo.com/{}",
    "About.me": "https://about.me/{}",
    "Pastebin": "https://pastebin.com/u/{}",
    "Chess.com": "https://www.chess.com/member/{}",
    "Kick": "https://kick.com/{}",
    "Behance": "https://www.behance.net/{}",
    "DeviantArt": "https://www.deviantart.com/{}",
    "Linktree": "https://linktr.ee/{}",
    "Gravatar": "https://gravatar.com/{}",
    # Sites que costumam bloquear/mascarar (ficam no bucket "incerto")
    "Instagram": "https://www.instagram.com/{}/",
    "X (Twitter)": "https://x.com/{}",
    "TikTok": "https://www.tiktok.com/@{}",
    "Twitch": "https://www.twitch.tv/{}",
    "YouTube": "https://www.youtube.com/@{}",
    "Pinterest": "https://www.pinterest.com/{}/",
    "Medium": "https://medium.com/@{}",
}


class Identity(commands.Cog):
    """Investigação de identidades digitais em fontes públicas."""

    def __init__(self, bot):
        self.bot = bot

    # ------------------------------------------------------------ USERNAME
    @app_commands.command(name="username", description="Procura um @username em vários sites públicos.")
    @app_commands.describe(username="Nome de usuário (sem @)")
    async def username_cmd(self, interaction: discord.Interaction, username: str):
        uname = username.strip().lstrip("@")
        if not uname or len(uname) > 40 or "/" in uname or " " in uname:
            return await reply.send(interaction, embeds.error_embed("Username inválido", "Use apenas o nome, sem espaços ou `/`."))
        await reply.defer(interaction)

        results = await asyncio.gather(
            *[self._check_site(name, tmpl, uname) for name, tmpl in SITES.items()]
        )
        found = [(n, u) for (n, u, ok) in results if ok is True]
        maybe = [(n, u) for (n, u, ok) in results if ok is None]

        e = embeds.ok_embed(f"Username — {uname}", f"Encontrado em **{len(found)}** de {len(SITES)} sites.")
        if found:
            embeds.add_field(e, "✅ Perfis encontrados", "\n".join(f"[{n}]({u})" for n, u in found))
        if maybe:
            embeds.add_field(e, "❔ Incerto (checar manualmente)", "\n".join(f"[{n}]({u})" for n, u in maybe))
        if not found and not maybe:
            embeds.add_field(e, "Resultado", "Nenhum perfil público localizado com esse nome.")
        e.set_footer(text=f"{config.BRAND_NAME} • perfil existir ≠ ser a mesma pessoa. Confirme sempre.")
        await reply.send(interaction, e)

    async def _check_site(self, name: str, template: str, username: str):
        """Retorna (nome, url, ok) onde ok=True existe, False não, None incerto."""
        url = template.format(username)
        try:
            session = await http.get_session()
            async with session.get(url, allow_redirects=True) as resp:
                if resp.status == 200:
                    return (name, url, True)
                if resp.status in (404, 410):
                    return (name, url, False)
                return (name, url, None)  # 403/429/etc → incerto
        except Exception:
            return (name, url, None)

    # -------------------------------------------------------------- BREACH
    @app_commands.command(name="breach", description="Verifica se um e-mail apareceu em vazamentos de dados.")
    @app_commands.describe(email="Ex.: pessoa@exemplo.com")
    async def breach_cmd(self, interaction: discord.Interaction, email: str):
        if not is_valid_email(email):
            return await reply.send(interaction, embeds.error_embed("E-mail inválido", "Formato de e-mail incorreto."))
        # Resposta em modo privado (só quem chamou vê) — dado sensível
        await reply.defer(interaction)
        try:
            if config.HIBP_API_KEY:
                e = await self._breach_hibp(email.strip())
            else:
                e = await self._breach_xposedornot(email.strip())
        except Exception as ex:
            e = embeds.error_embed("Falha na consulta", f"`{ex}`")
        await reply.send(interaction, e)

    async def _breach_hibp(self, email: str) -> discord.Embed:
        """Have I Been Pwned (requer chave paga) — dados mais ricos."""
        url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}?truncateResponse=false"
        session = await http.get_session()
        async with session.get(url, headers={"hibp-api-key": config.HIBP_API_KEY}) as resp:
            if resp.status == 404:
                return embeds.ok_embed("Nenhum vazamento", "Este e-mail não aparece nos vazamentos conhecidos.")
            resp.raise_for_status()
            data = await resp.json()
        e = embeds.error_embed(f"⚠️ {len(data)} vazamento(s)", "Este e-mail aparece nos seguintes incidentes (HIBP):")
        for b in data[:12]:
            classes = ", ".join(b.get("DataClasses", [])[:6])
            embeds.add_field(e, f"{b.get('Title')} ({b.get('BreachDate')})", classes or "—")
        e.set_footer(text=f"{config.BRAND_NAME} • recomende trocar senha e ativar 2FA.")
        return e

    async def _breach_xposedornot(self, email: str) -> discord.Embed:
        """XposedOrNot — API pública e gratuita (não precisa de chave)."""
        url = f"https://api.xposedornot.com/v1/check-email/{email}"
        session = await http.get_session()
        async with session.get(url) as resp:
            if resp.status == 404:
                return embeds.ok_embed("Nenhum vazamento", "Este e-mail não aparece nos vazamentos conhecidos (XposedOrNot).")
            resp.raise_for_status()
            data = await resp.json()
        breaches = (data.get("breaches") or [[]])[0]  # formato: {"breaches": [[...]]}
        if not breaches:
            return embeds.ok_embed("Nenhum vazamento", "Este e-mail não aparece nos vazamentos conhecidos (XposedOrNot).")
        e = embeds.error_embed(f"⚠️ {len(breaches)} vazamento(s)", "Este e-mail aparece nos seguintes incidentes:")
        embeds.add_field(e, "Vazamentos", "\n".join(f"• {b}" for b in breaches[:20]))
        e.set_footer(text=f"{config.BRAND_NAME} • fonte: XposedOrNot (grátis) • troque senha e ative 2FA.")
        return e

    # --------------------------------------------------------------- EMAIL
    @app_commands.command(name="email", description="Relatório completo de um e-mail: MX, SPF/DMARC, provedor, Gravatar e vazamentos.")
    @app_commands.describe(email="Ex.: pessoa@exemplo.com")
    async def email_cmd(self, interaction: discord.Interaction, email: str):
        if not is_valid_email(email):
            return await reply.send(interaction, embeds.error_embed("E-mail inválido", "Formato incorreto."))
        await reply.defer(interaction)
        try:
            addr = email.strip().lower()
            domain = addr.split("@")[1]
            e = embeds.info_embed(f"E-mail — {addr}")

            # Tipo de provedor
            embeds.add_field(e, "Formato", "✅ válido", inline=True)
            embeds.add_field(e, "Tipo", _provider_label(domain), inline=True)

            # DNS: MX, SPF, DMARC
            resolver = dns.asyncresolver.Resolver()
            resolver.lifetime = 6.0
            mx = await _resolve(resolver, domain, "MX")
            mx_hosts = sorted(r.split()[-1].rstrip(".") for r in mx) if mx else []
            embeds.add_field(e, "Recebe e-mail (MX)", "✅ sim" if mx_hosts else "❌ sem MX", inline=True)
            if mx_hosts:
                embeds.add_field(e, "Servidores MX", "\n".join(mx_hosts[:5]))

            txt = await _resolve(resolver, domain, "TXT")
            has_spf = any("v=spf1" in t.lower() for t in txt)
            dmarc = await _resolve(resolver, f"_dmarc.{domain}", "TXT")
            has_dmarc = any("v=dmarc1" in t.lower() for t in dmarc)
            embeds.add_field(e, "Proteção anti-spoofing",
                             f"SPF: {'✅' if has_spf else '❌'}   DMARC: {'✅' if has_dmarc else '❌'}", inline=True)

            # Gravatar (perfil público ligado ao e-mail)
            gv = await _gravatar(addr)
            if gv:
                embeds.add_field(e, "Gravatar (perfil público)", gv)

            # Vazamentos (XposedOrNot, grátis)
            leaks = await _xposed_count(addr)
            if leaks is None:
                embeds.add_field(e, "Vazamentos", "não foi possível checar agora")
            elif leaks == 0:
                embeds.add_field(e, "Vazamentos", "✅ nenhum conhecido")
            else:
                embeds.add_field(e, "Vazamentos", f"⚠️ aparece em **{leaks}** vazamento(s) — use `/breach` para ver quais")

            e.set_footer(text=f"{config.BRAND_NAME} • dados técnicos públicos do e-mail/domínio")
        except Exception as ex:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{ex}`"))
        await reply.send(interaction, e)


    # --------------------------------------------------------------- PHONE
    @app_commands.command(name="phone", description="Valida um telefone: país, operadora e tipo (não identifica o dono).")
    @app_commands.describe(numero="Formato internacional, ex.: +5511999998888")
    async def phone_cmd(self, interaction: discord.Interaction, numero: str):
        try:
            num = phonenumbers.parse(numero.strip(), None)
        except Exception:
            return await reply.send(interaction, embeds.error_embed(
                "Número inválido", "Use o formato internacional com `+DDI`, ex.: `+5511999998888`."))
        valid = phonenumbers.is_valid_number(num)
        types = {
            PhoneNumberType.MOBILE: "Celular", PhoneNumberType.FIXED_LINE: "Fixo",
            PhoneNumberType.VOIP: "VoIP", PhoneNumberType.FIXED_LINE_OR_MOBILE: "Fixo/Celular",
            PhoneNumberType.TOLL_FREE: "0800", PhoneNumberType.PREMIUM_RATE: "Tarifado",
        }
        e = embeds.info_embed(f"Telefone — +{num.country_code} {num.national_number}")
        embeds.add_field(e, "Válido", "✅ sim" if valid else "❌ não", inline=True)
        embeds.add_field(e, "País/Região", geocoder.description_for_number(num, "pt") or "—", inline=True)
        embeds.add_field(e, "Operadora", carrier.name_for_number(num, "pt") or "—", inline=True)
        embeds.add_field(e, "Tipo", types.get(number_type(num), "outro"), inline=True)
        tzs = ph_tz.time_zones_for_number(num)
        embeds.add_field(e, "Fuso horário", ", ".join(tzs) if tzs else "—", inline=True)
        e.set_footer(text=f"{config.BRAND_NAME} • metadados públicos do número; NÃO revela o dono.")
        await reply.send(interaction, e)


# --------------------------------------------------------------- helpers e-mail
_FREE = {
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
    "yahoo.com", "yahoo.com.br", "icloud.com", "me.com", "proton.me",
    "protonmail.com", "gmx.com", "aol.com", "mail.com", "yandex.com",
    "zoho.com", "bol.com.br", "uol.com.br", "terra.com.br", "ig.com.br",
}
_DISPOSABLE = {
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
    "temp-mail.org", "trashmail.com", "yopmail.com", "getnada.com",
    "sharklasers.com", "throwawaymail.com", "maildrop.cc", "dispostable.com",
    "fakeinbox.com", "mohmal.com", "emailondeck.com",
}


def _provider_label(domain: str) -> str:
    if domain in _DISPOSABLE:
        return "🗑️ descartável/temporário"
    if domain in _FREE:
        return "📬 provedor gratuito"
    return "🏢 domínio próprio/corporativo"


async def _resolve(resolver, name, rtype):
    """Resolve um registro DNS; retorna lista de strings (ou [] em falha)."""
    try:
        answers = await resolver.resolve(name, rtype)
        return [r.to_text().strip('"') for r in answers]
    except Exception:
        return []


async def _gravatar(addr):
    """Se o e-mail tiver perfil público no Gravatar, retorna um resumo clicável."""
    h = hashlib.md5(addr.encode("utf-8")).hexdigest()
    try:
        session = await http.get_session()
        async with session.get(f"https://www.gravatar.com/{h}.json") as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
        entry = (data.get("entry") or [{}])[0]
        name = entry.get("displayName") or (entry.get("name") or {}).get("formatted")
        profile = entry.get("profileUrl") or f"https://gravatar.com/{h}"
        return f"[{name or 'ver perfil'}]({profile}) • avatar público"
    except Exception:
        return None


async def _xposed_count(addr):
    """Nº de vazamentos (XposedOrNot). 0 = nenhum, None = não checou."""
    try:
        session = await http.get_session()
        async with session.get(f"https://api.xposedornot.com/v1/check-email/{addr}") as resp:
            if resp.status == 404:
                return 0
            if resp.status != 200:
                return None
            data = await resp.json()
        return len((data.get("breaches") or [[]])[0])
    except Exception:
        return None


async def setup(bot):
    await bot.add_cog(Identity(bot))
