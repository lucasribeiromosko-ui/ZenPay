"""Ferramentas de reconhecimento passivo que não fazem requisição de rede:
gerador de Google Dorks prontos para investigação de um domínio/alvo.
"""
from urllib.parse import quote_plus

import discord
from discord import app_commands
from discord.ext import commands

from utils import embeds
from utils.validators import clean_domain

# Cada dork: (rótulo, query com {d} = domínio)
DORKS = [
    ("📄 Documentos expostos", 'site:{d} (ext:pdf OR ext:doc OR ext:xls OR ext:csv)'),
    ("🔐 Páginas de login", 'site:{d} (inurl:login OR inurl:admin OR inurl:signin)'),
    ("📂 Listagem de diretórios", 'site:{d} intitle:"index of"'),
    ("⚙️ Arquivos de config/backup", 'site:{d} (ext:env OR ext:bak OR ext:sql OR ext:log OR ext:ini)'),
    ("🐛 Páginas de erro/debug", 'site:{d} (intext:"sql syntax near" OR intext:"stack trace" OR "warning: mysql")'),
    ("📁 Repositórios e Git", 'site:{d} (inurl:.git OR intitle:"index of" ".git")'),
    ("👤 E-mails e contatos", 'site:{d} (intext:"@{d}")'),
    ("☁️ Subdomínios indexados", 'site:*.{d} -site:www.{d}'),
    ("📊 Painéis e dashboards", 'site:{d} (inurl:dashboard OR inurl:portal OR inurl:panel)'),
    ("🗄️ Buckets e storage", '"{d}" (site:s3.amazonaws.com OR site:blob.core.windows.net OR site:storage.googleapis.com)'),
]


class Recon(commands.Cog):
    """Reconhecimento passivo (sem tocar no alvo)."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="dork", description="Gera buscas Google (dorks) prontas para investigar um domínio.")
    @app_commands.describe(dominio="Ex.: exemplo.com")
    async def dork_cmd(self, interaction: discord.Interaction, dominio: str):
        domain = clean_domain(dominio)
        if not domain:
            return await interaction.response.send_message(
                embed=embeds.error_embed("Domínio inválido", f"`{dominio}` não parece um domínio válido."),
                ephemeral=True,
            )
        e = embeds.info_embed(
            f"Google Dorks — {domain}",
            "Buscas prontas para reconhecimento passivo. Clique para abrir no Google.",
        )
        for label, template in DORKS:
            query = template.replace("{d}", domain)
            url = "https://www.google.com/search?q=" + quote_plus(query)
            embeds.add_field(e, label, f"[`{query}`]({url})")
        e.set_footer(text="FearSec OSINT • reconhecimento passivo: só consulta o índice público do Google.")
        await interaction.response.send_message(embed=e)


async def setup(bot):
    await bot.add_cog(Recon(bot))
