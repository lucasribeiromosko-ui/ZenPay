"""Ferramentas de identidade: enumeração de username em sites públicos,
verificação de vazamentos (HIBP) e checagem de e-mail (formato + MX).

IMPORTANTE: só trabalha com dados que a própria pessoa tornou público
(perfis abertos) ou com serviços de defesa (HIBP). Não consulta bases
de dados pessoais vazadas nem faz "puxada" de CPF/endereço.
"""
import asyncio

import discord
from discord import app_commands
from discord.ext import commands

import dns.asyncresolver

import config
from utils import embeds, http
from utils.validators import is_valid_email

# Sites com padrão de URL de perfil público previsível.
# {} é substituído pelo username.
SITES = {
    "GitHub": "https://github.com/{}",
    "GitLab": "https://gitlab.com/{}",
    "Instagram": "https://www.instagram.com/{}/",
    "X (Twitter)": "https://x.com/{}",
    "TikTok": "https://www.tiktok.com/@{}",
    "Reddit": "https://www.reddit.com/user/{}",
    "Twitch": "https://www.twitch.tv/{}",
    "YouTube": "https://www.youtube.com/@{}",
    "Telegram": "https://t.me/{}",
    "Steam": "https://steamcommunity.com/id/{}",
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
            return await interaction.response.send_message(
                embed=embeds.error_embed("Username inválido", "Use apenas o nome, sem espaços ou `/`."),
                ephemeral=True,
            )
        await interaction.response.defer()

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
        await interaction.followup.send(embed=e)

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
    @app_commands.command(name="breach", description="Verifica se um e-mail apareceu em vazamentos (Have I Been Pwned).")
    @app_commands.describe(email="Ex.: pessoa@exemplo.com")
    async def breach_cmd(self, interaction: discord.Interaction, email: str):
        if not is_valid_email(email):
            return await interaction.response.send_message(
                embed=embeds.error_embed("E-mail inválido", "Formato de e-mail incorreto."), ephemeral=True)
        if not config.HIBP_API_KEY:
            return await interaction.response.send_message(
                embed=embeds.error_embed(
                    "HIBP não configurado",
                    "Adicione `HIBP_API_KEY` no `.env` para verificar vazamentos por e-mail.\n"
                    "Chave em https://haveibeenpwned.com/API/Key",
                ),
                ephemeral=True,
            )
        # Resposta em modo privado (só quem chamou vê) — dado sensível
        await interaction.response.defer(ephemeral=True)
        url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email.strip()}?truncateResponse=false"
        headers = {"hibp-api-key": config.HIBP_API_KEY}
        try:
            session = await http.get_session()
            async with session.get(url, headers=headers) as resp:
                if resp.status == 404:
                    return await interaction.followup.send(
                        embed=embeds.ok_embed("Nenhum vazamento", "Este e-mail não aparece nos vazamentos conhecidos."),
                        ephemeral=True,
                    )
                resp.raise_for_status()
                data = await resp.json()
        except Exception as ex:
            return await interaction.followup.send(
                embed=embeds.error_embed("Falha no HIBP", f"`{ex}`"), ephemeral=True)

        e = embeds.error_embed(f"⚠️ {len(data)} vazamento(s)", "Este e-mail aparece nos seguintes incidentes:")
        for b in data[:12]:
            classes = ", ".join(b.get("DataClasses", [])[:6])
            embeds.add_field(e, f"{b.get('Title')} ({b.get('BreachDate')})", classes or "—")
        e.set_footer(text=f"{config.BRAND_NAME} • recomende trocar senha e ativar 2FA.")
        await interaction.followup.send(embed=e, ephemeral=True)

    # --------------------------------------------------------------- EMAIL
    @app_commands.command(name="email", description="Valida formato e checa se o domínio do e-mail recebe mensagens (MX).")
    @app_commands.describe(email="Ex.: pessoa@exemplo.com")
    async def email_cmd(self, interaction: discord.Interaction, email: str):
        if not is_valid_email(email):
            return await interaction.response.send_message(
                embed=embeds.error_embed("E-mail inválido", "Formato incorreto."), ephemeral=True)
        await interaction.response.defer()
        domain = email.strip().split("@")[1]
        e = embeds.info_embed(f"E-mail — {email.strip()}")
        embeds.add_field(e, "Formato", "✅ válido", inline=True)
        try:
            resolver = dns.asyncresolver.Resolver()
            resolver.lifetime = 6.0
            answers = await resolver.resolve(domain, "MX")
            mx = sorted(str(r.exchange).rstrip(".") for r in answers)
            embeds.add_field(e, "Domínio aceita e-mail (MX)", "✅ sim", inline=True)
            embeds.add_field(e, "Servidores MX", "\n".join(mx[:6]))
        except Exception:
            embeds.add_field(e, "Domínio aceita e-mail (MX)", "❌ nenhum registro MX", inline=True)
        await interaction.followup.send(embed=e)


async def setup(bot):
    await bot.add_cog(Identity(bot))
