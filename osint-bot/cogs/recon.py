"""Reconhecimento passivo (sem requisição de rede):
- /dork   : dorks focados em investigar UM domínio-alvo
- /buscar : acha ARQUIVOS/CONTEÚDO público por título e tipo (Drive, PDF…)
"""
from urllib.parse import quote_plus

import discord
from discord import app_commands
from discord.ext import commands

from utils import embeds
from utils import reply
from utils.validators import clean_domain

# /buscar — fontes de conteúdo público. key -> (rótulo, template com {q} = termo)
SEARCH_SOURCES = {
    "drive": ("📁 Google Drive", "site:drive.google.com {q}"),
    "docs": ("📄 Google Docs", "site:docs.google.com {q}"),
    "dropbox": ("📦 Dropbox", "site:dropbox.com {q}"),
    "onedrive": ("☁️ OneDrive", "(site:1drv.ms OR site:onedrive.live.com) {q}"),
    "pdf": ("📕 Arquivos PDF", "{q} filetype:pdf"),
    "planilha": ("📊 Planilhas (Excel/CSV)", "{q} (filetype:xlsx OR filetype:xls OR filetype:csv)"),
    "word": ("📝 Documentos Word", "{q} (filetype:doc OR filetype:docx)"),
    "slides": ("📽️ Apresentações", "{q} (filetype:ppt OR filetype:pptx)"),
    "s3": ("🪣 Buckets S3 (AWS)", "site:s3.amazonaws.com {q}"),
    "pastebin": ("📋 Pastebin", "site:pastebin.com {q}"),
    "trello": ("📌 Trello (quadros públicos)", "site:trello.com {q}"),
    "github": ("🐙 GitHub", "site:github.com {q}"),
}

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
            return await reply.send(interaction, embeds.error_embed("Domínio inválido", f"`{dominio}` não parece um domínio válido."))
        e = embeds.info_embed(
            f"Google Dorks — {domain}",
            "Buscas prontas para reconhecimento passivo. Clique para abrir no Google.",
        )
        for label, template in DORKS:
            query = template.replace("{d}", domain)
            url = "https://www.google.com/search?q=" + quote_plus(query)
            embeds.add_field(e, label, f"[`{query}`]({url})")
        e.set_footer(text="FearSec OSINT • reconhecimento passivo: só consulta o índice público do Google.")
        await reply.send(interaction, e)

    # ---------------------------------------------------------------- BUSCAR
    @app_commands.command(
        name="buscar",
        description="Acha arquivos/conteúdo PÚBLICO por título e tipo (Drive, PDF, planilha, Trello…).",
    )
    @app_commands.describe(
        termo="O que procurar — ex.: nome, título, assunto",
        onde="Onde / que tipo de arquivo procurar",
    )
    @app_commands.choices(onde=[
        app_commands.Choice(name=label, value=key)
        for key, (label, _) in SEARCH_SOURCES.items()
    ])
    async def buscar_cmd(self, interaction: discord.Interaction,
                         termo: str, onde: app_commands.Choice[str]):
        q = termo.strip()
        if not q:
            return await reply.send(interaction, embeds.error_embed("Faltou o termo", "Digite o que quer procurar."))
        label, template = SEARCH_SOURCES[onde.value]
        # frases entre aspas para busca exata
        term = f'"{q}"' if " " in q else q
        query = template.replace("{q}", term)
        url = "https://www.google.com/search?q=" + quote_plus(query)
        e = embeds.ok_embed(f"Busca pública — {label}", f"Procurando por **{q}**")
        embeds.add_field(e, "🔎 Abrir busca no Google", f"[clique aqui]({url})")
        embeds.add_field(e, "Query usada", f"`{query}`")
        e.set_footer(text="FearSec OSINT • só conteúdo indexado publicamente pelo Google. Use com ética.")
        await reply.send(interaction, e)


async def setup(bot):
    await bot.add_cog(Recon(bot))
