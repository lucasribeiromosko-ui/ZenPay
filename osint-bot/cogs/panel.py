"""Ajuda e navegação: /painel (menu interativo), /ajuda (lista completa)
e /tutorial (guia passo a passo). Tudo respondido de forma privada.
"""
import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, reply

# Registro central de categorias -> comandos.
# Cada comando: (uso, descrição, exemplo)
CATEGORIES = {
    "dominio": {
        "label": "🌐 Domínio & DNS",
        "desc": "Investigar domínios e registros DNS",
        "commands": [
            ("/whois", "Quem registrou o domínio, datas e servidores.", "/whois exemplo.com"),
            ("/dns", "Registros DNS (A, MX, TXT, NS…).", "/dns exemplo.com"),
            ("/subdomains", "Descobre subdomínios (Certificate Transparency).", "/subdomains exemplo.com"),
            ("/tls", "Detalhes do certificado SSL/TLS.", "/tls exemplo.com"),
        ],
    },
    "rede": {
        "label": "📡 IP & Rede",
        "desc": "Geolocalizar IPs e mapear infraestrutura",
        "commands": [
            ("/ip", "País, provedor, ASN e sinais de VPN/hosting.", "/ip 8.8.8.8"),
            ("/ipwhois", "Dono do bloco de IP e contato de abuse (RDAP).", "/ipwhois 8.8.8.8"),
            ("/reversedns", "Nome (PTR) de um IP, ou IPs de um domínio.", "/reversedns 8.8.8.8"),
            ("/asn", "Prefixos de IP e organização de um ASN.", "/asn AS15169"),
            ("/shodan", "Portas e serviços expostos (precisa de chave).", "/shodan 8.8.8.8"),
        ],
    },
    "web": {
        "label": "🕸️ Web & Sites",
        "desc": "Analisar sites, tecnologias e histórico",
        "commands": [
            ("/headers", "Cabeçalhos HTTP, tecnologias e segurança.", "/headers exemplo.com"),
            ("/webscan", "Extrai e-mails, links e metadados da página.", "/webscan exemplo.com"),
            ("/robots", "Lê robots.txt e sitemap (caminhos escondidos).", "/robots exemplo.com"),
            ("/wayback", "Histórico do site no Wayback Machine.", "/wayback exemplo.com"),
        ],
    },
    "pessoas": {
        "label": "👤 Pessoas & Identidade",
        "desc": "Rastrear identidades digitais públicas",
        "commands": [
            ("/username", "Procura o @ em 12+ sites públicos.", "/username fulano"),
            ("/email", "Valida e-mail e checa MX do domínio.", "/email a@b.com"),
            ("/breach", "E-mail em vazamentos (grátis).", "/breach a@b.com"),
            ("/phone", "Valida telefone: país, operadora, tipo.", "/phone +5511999998888"),
        ],
    },
    "arquivos": {
        "label": "🖼️ Arquivos & Imagem",
        "desc": "Metadados e busca reversa de imagens",
        "commands": [
            ("/exif", "Câmera, data e GPS de uma foto.", "/exif [anexo]"),
            ("/reverseimage", "Links de busca reversa (Google, Yandex…).", "/reverseimage [url]"),
        ],
    },
    "seguranca": {
        "label": "🔐 Segurança & Hash",
        "desc": "Hashes e vulnerabilidades",
        "commands": [
            ("/hash", "Identifica e quebra hash (MD5/SHA).", "/hash e10adc39…"),
            ("/cve", "Detalhes de uma vulnerabilidade (CVE).", "/cve CVE-2021-44228"),
        ],
    },
    "busca": {
        "label": "🔎 Busca & Dorks",
        "desc": "Achar conteúdo público na web",
        "commands": [
            ("/buscar", "Acha arquivos públicos por título e tipo (Drive, PDF, planilha…).", "/buscar termo:folha de pagamento onde:Planilhas"),
            ("/dork", "Investiga UM domínio: arquivos, logins e brechas expostas.", "/dork exemplo.com"),
        ],
    },
    "ferramentas": {
        "label": "🧰 Ferramentas",
        "desc": "Utilidades do dia a dia",
        "commands": [
            ("/base64", "Codifica/decodifica Base64.", "/base64 decode aGVsbG8="),
            ("/useragent", "Analisa uma string de User-Agent.", "/useragent Mozilla/5.0…"),
        ],
    },
    "ajuda": {
        "label": "ℹ️ Ajuda",
        "desc": "Como usar o bot",
        "commands": [
            ("/painel", "Menu interativo com todas as categorias.", "/painel"),
            ("/ajuda", "Lista rápida de todos os comandos.", "/ajuda"),
            ("/tutorial", "Guia passo a passo para começar.", "/tutorial"),
        ],
    },
}


def _category_embed(key: str) -> discord.Embed:
    cat = CATEGORIES[key]
    e = embeds.info_embed(f"Ferramentas — {cat['label']}", cat["desc"])
    for usage, desc, example in cat["commands"]:
        embeds.add_field(e, f"{usage} — {desc}", f"Ex.: `{example}`")
    return e


class CategorySelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(value=key, label=cat["label"], description=cat["desc"][:100])
            for key, cat in CATEGORIES.items()
        ]
        super().__init__(placeholder="Escolha uma categoria de ferramentas…", options=options)

    async def callback(self, interaction: discord.Interaction):
        await interaction.response.edit_message(embed=_category_embed(self.values[0]), view=self.view)


class PanelView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=300)
        self.add_item(CategorySelect())


def _panel_home() -> discord.Embed:
    total = sum(len(c["commands"]) for c in CATEGORIES.values())
    e = embeds.base_embed(
        "🛡️ Painel OSINT — FearSec",
        "Central de **inteligência de fontes abertas**. Use o menu abaixo para "
        "explorar por categoria, ou digite `/` e veja todos os comandos.\n\n"
        + "\n".join(f"{c['label']} — {c['desc']}" for c in CATEGORIES.values()),
        config.BRAND_COLOR,
    )
    e.add_field(
        name="⚖️ Uso responsável",
        value=("Só fontes **públicas/abertas**, para investigar infraestrutura "
               "maliciosa com autorização. Nada de doxxing ou dados pessoais vazados."),
        inline=False,
    )
    e.set_footer(text=f"{config.BRAND_NAME} • {total} ferramentas • resposta privada")
    return e


class Panel(commands.Cog):
    """Menu, ajuda e tutorial."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="painel", description="Abre o painel OSINT com o menu de categorias.")
    async def painel_cmd(self, interaction: discord.Interaction):
        await reply.send(interaction, _panel_home(), view=PanelView())

    @app_commands.command(name="osint", description="Abre o painel OSINT (igual /painel).")
    async def osint_cmd(self, interaction: discord.Interaction):
        await reply.send(interaction, _panel_home(), view=PanelView())

    @app_commands.command(name="ajuda", description="Lista rápida de todos os comandos.")
    async def ajuda_cmd(self, interaction: discord.Interaction):
        e = embeds.info_embed("Todos os comandos", "Digite o comando e preencha o campo pedido.")
        for cat in CATEGORIES.values():
            lines = "\n".join(f"`{usage}` — {desc}" for usage, desc, _ in cat["commands"])
            embeds.add_field(e, cat["label"], lines)
        await reply.send(interaction, e)

    @app_commands.command(name="tutorial", description="Guia passo a passo para começar a investigar.")
    async def tutorial_cmd(self, interaction: discord.Interaction):
        e = embeds.base_embed(
            "📚 Tutorial — como usar o FearSec OSINT",
            "Bem-vindo! Aqui vai um roteiro rápido para começar suas investigações.",
            config.INFO_COLOR,
        )
        embeds.add_field(e, "1️⃣ Como funciona",
            "Digite `/` e escolha um comando. O bot pede o dado (domínio, IP, e-mail…) "
            "e responde **só para você** (ninguém mais vê).")
        embeds.add_field(e, "2️⃣ Investigando um site/domínio",
            "`/whois` → dono e datas\n`/dns` → servidores\n`/subdomains` → subdomínios\n"
            "`/headers` → tecnologias\n`/webscan` → e-mails e links\n`/dork` → brechas do domínio")
        embeds.add_field(e, "🔎 Achar arquivos públicos (`/buscar`)",
            "Escolha **o tipo** (Google Drive, PDF, planilha, Trello…) e digite **o título** "
            "que procura. O bot monta a busca pronta. Ex.: `/buscar` termo `contrato 2024` onde `PDF`.")
        embeds.add_field(e, "3️⃣ Investigando um IP",
            "`/ip` → localização e provedor\n`/ipwhois` → dono do bloco + abuse\n"
            "`/asn` → toda a rede de uma empresa\n`/shodan` → portas expostas (com chave)")
        embeds.add_field(e, "4️⃣ Investigando uma pessoa/identidade",
            "`/username` → perfis em 12+ sites\n`/email` → valida e-mail\n"
            "`/breach` → apareceu em vazamentos?\n`/phone` → país e operadora")
        embeds.add_field(e, "5️⃣ Imagens e arquivos",
            "`/exif` → data, câmera e **GPS** de uma foto\n`/reverseimage` → onde mais a imagem aparece")
        embeds.add_field(e, "6️⃣ Segurança",
            "`/hash` → identifica/quebra hash\n`/cve` → detalhes de uma vulnerabilidade")
        embeds.add_field(e, "💡 Dica de ouro",
            "Comece sempre pelo `/painel` para ver tudo organizado. E lembre: cruze "
            "as evidências — um resultado sozinho raramente prova algo.")
        e.set_footer(text=f"{config.BRAND_NAME} • investigue com ética e autorização")
        await reply.send(interaction, e)


async def setup(bot):
    await bot.add_cog(Panel(bot))
