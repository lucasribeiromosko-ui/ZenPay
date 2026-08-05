"""Painel de ajuda interativo — pensado para iniciantes.

/osint abre um menu com categorias; ao escolher uma, o bot explica
cada comando daquela categoria, com exemplo de uso.
"""
import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds

CATEGORIES = {
    "domain": {
        "label": "🌐 Domínios",
        "desc": "WHOIS, DNS, subdomínios, certificado TLS",
        "commands": [
            ("/whois exemplo.com", "Quem registrou o domínio, quando e onde."),
            ("/dns exemplo.com", "Registros DNS: A, MX, TXT, NS…"),
            ("/subdomains exemplo.com", "Descobre subdomínios (Certificate Transparency)."),
            ("/tls exemplo.com", "Detalhes do certificado SSL/TLS."),
        ],
    },
    "network": {
        "label": "📡 Rede / IP",
        "desc": "Geolocalização, DNS reverso, portas (Shodan)",
        "commands": [
            ("/ip 8.8.8.8", "País, provedor, ASN e sinais de VPN/hosting."),
            ("/reversedns 8.8.8.8", "Nome (PTR) de um IP, ou IPs de um domínio."),
            ("/ipwhois 8.8.8.8", "Dono do bloco de IP e contato de abuse (RDAP)."),
            ("/shodan 8.8.8.8", "Portas e serviços expostos (precisa de chave)."),
        ],
    },
    "web": {
        "label": "🕸️ Web",
        "desc": "Cabeçalhos, tecnologias, e-mails e links de um site",
        "commands": [
            ("/headers exemplo.com", "Cabeçalhos HTTP + tecnologias + headers de segurança."),
            ("/webscan exemplo.com", "Extrai e-mails, links e metadados da página."),
        ],
    },
    "crypto": {
        "label": "#️⃣ Hash",
        "desc": "Identificar e quebrar hashes (dicionário)",
        "commands": [
            ("/hash <hash>", "Identifica o tipo e tenta quebrar (senhas fracas)."),
        ],
    },
    "recon": {
        "label": "🎯 Recon",
        "desc": "Reconhecimento passivo (sem tocar no alvo)",
        "commands": [
            ("/dork exemplo.com", "Gera buscas Google (dorks) prontas p/ investigação."),
        ],
    },
    "identity": {
        "label": "👤 Identidade",
        "desc": "Username em sites, e-mail, vazamentos",
        "commands": [
            ("/username fulano", "Procura o @ em 12+ sites públicos."),
            ("/email pessoa@x.com", "Valida formato e checa se recebe e-mail (MX)."),
            ("/breach pessoa@x.com", "Aparece em vazamentos? (Have I Been Pwned)."),
        ],
    },
    "files": {
        "label": "🖼️ Arquivos",
        "desc": "Metadados de imagens (EXIF/GPS)",
        "commands": [
            ("/exif [anexo]", "Câmera, data e coordenadas GPS da foto."),
        ],
    },
}


class CategorySelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(value=key, label=cat["label"], description=cat["desc"])
            for key, cat in CATEGORIES.items()
        ]
        super().__init__(placeholder="Escolha uma categoria de ferramentas…", options=options)

    async def callback(self, interaction: discord.Interaction):
        cat = CATEGORIES[self.values[0]]
        e = embeds.info_embed(f"Ferramentas — {cat['label']}", cat["desc"])
        for cmd, desc in cat["commands"]:
            embeds.add_field(e, cmd, desc)
        await interaction.response.edit_message(embed=e, view=self.view)


class PanelView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=180)
        self.add_item(CategorySelect())


class Panel(commands.Cog):
    """Menu de ajuda e boas-vindas."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="osint", description="Abre o painel OSINT com todas as ferramentas.")
    async def osint_cmd(self, interaction: discord.Interaction):
        e = embeds.base_embed(
            "🛡️ Painel OSINT — FearSec",
            "Bem-vindo! Este bot reúne ferramentas de **inteligência de fontes abertas**.\n\n"
            "👉 Use o menu abaixo para explorar por categoria, ou digite `/` e veja "
            "todos os comandos.\n\n"
            "**Categorias disponíveis:**\n"
            + "\n".join(f"{c['label']} — {c['desc']}" for c in CATEGORIES.values()),
            config.BRAND_COLOR,
        )
        e.add_field(
            name="⚖️ Uso responsável",
            value=(
                "Só fontes **públicas/abertas**. Use apenas para investigar "
                "infraestrutura maliciosa e com autorização. Não faça assédio, "
                "doxxing ou consulta de dados pessoais vazados."
            ),
            inline=False,
        )
        await interaction.response.send_message(embed=e, view=PanelView())

    @app_commands.command(name="ajuda", description="Lista rápida de todos os comandos.")
    async def ajuda_cmd(self, interaction: discord.Interaction):
        e = embeds.info_embed("Todos os comandos")
        for cat in CATEGORIES.values():
            lines = "\n".join(f"`{cmd}` — {desc}" for cmd, desc in cat["commands"])
            embeds.add_field(e, cat["label"], lines)
        await interaction.response.send_message(embed=e, ephemeral=True)


async def setup(bot):
    await bot.add_cog(Panel(bot))
