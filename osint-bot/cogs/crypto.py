"""Ferramenta de hash: identifica o tipo provável e tenta quebrar por dicionário.

Uso educacional/CTF/autorizado. A quebra é por força-bruta de dicionário
(uma wordlist pequena embutida), útil para senhas fracas em exercícios.
"""
import hashlib
import re

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds
from utils import reply

# tipo -> (tamanho hex, função hashlib)
HASH_TYPES = {
    "MD5": (32, "md5"),
    "SHA-1": (40, "sha1"),
    "SHA-224": (56, "sha224"),
    "SHA-256": (64, "sha256"),
    "SHA-384": (96, "sha384"),
    "SHA-512": (128, "sha512"),
}
HEX_RE = re.compile(r"^[a-fA-F0-9]+$")

# Wordlist pequena de senhas comuns (demonstração de senha fraca).
COMMON_PASSWORDS = [
    "123456", "password", "123456789", "12345678", "12345", "qwerty",
    "abc123", "111111", "senha", "123123", "admin", "1234567890",
    "000000", "iloveyou", "1q2w3e4r", "qwerty123", "root", "toor",
    "letmein", "welcome", "monkey", "dragon", "master", "shadow",
    "football", "666666", "121212", "flower", "hottie", "loveme",
    "zaq12wsx", "password1", "123321", "654321", "superman", "1234",
    "senha123", "brasil", "gremio", "flamengo", "corinthians", "mudar123",
]


class Crypto(commands.Cog):
    """Identificação e quebra de hashes (dicionário)."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="hash", description="Identifica o tipo de um hash e tenta quebrá-lo (dicionário).")
    @app_commands.describe(valor="Cole o hash (hex)", palavra="(opcional) teste se esta palavra gera o hash")
    async def hash_cmd(self, interaction: discord.Interaction, valor: str, palavra: str = None):
        h = valor.strip().lower()
        if not HEX_RE.match(h):
            return await reply.send(interaction, embeds.error_embed("Não parece um hash hex", "Cole apenas os caracteres 0-9 a-f."))
        candidates = [name for name, (length, _) in HASH_TYPES.items() if length == len(h)]
        e = embeds.info_embed(f"Hash ({len(h)} chars)")
        embeds.add_field(e, "Tipo(s) provável(is)", ", ".join(candidates) if candidates else "desconhecido")

        # 1) Se o usuário deu uma palavra, verifica diretamente
        if palavra:
            matches = [name for name in candidates if _digest(name, palavra) == h] or \
                      [name for name in HASH_TYPES if _digest(name, palavra) == h]
            if matches:
                embeds.add_field(e, "✅ Confere!", f"`{palavra}` gera este hash ({', '.join(matches)}).")
            else:
                embeds.add_field(e, "❌ Não confere", f"`{palavra}` não gera este hash.")
            return await reply.send(interaction, e)

        # 2) Tenta quebrar com a wordlist embutida
        await reply.defer(interaction)
        cracked = None
        for name in (candidates or HASH_TYPES.keys()):
            for pw in COMMON_PASSWORDS:
                if _digest(name, pw) == h:
                    cracked = (pw, name)
                    break
            if cracked:
                break

        if cracked:
            pw, name = cracked
            embeds.add_field(e, "🔓 Quebrado!", f"Senha: `{pw}`  ({name})")
            e.set_footer(text=f"{config.BRAND_NAME} • senha fraca — mostre ao dono para trocar/ativar 2FA.")
        else:
            embeds.add_field(e, "🔒 Não quebrado",
                             "Não está na wordlist de senhas comuns embutida.\n"
                             "Use `/hash valor: palavra:` para testar palavras específicas.")
        await reply.send(interaction, e)


def _digest(hash_name: str, text: str) -> str:
    algo = HASH_TYPES[hash_name][1]
    return hashlib.new(algo, text.encode("utf-8")).hexdigest()


async def setup(bot):
    await bot.add_cog(Crypto(bot))
