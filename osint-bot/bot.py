"""
FearSec OSINT Bot — ponto de entrada.

Bot de Discord com ferramentas de inteligência de fontes abertas (OSINT).
Trabalha somente com dados públicos/abertos. Uso educacional e autorizado.

Rodar:  python bot.py
"""
import asyncio
import logging
import sys

import discord
from discord.ext import commands

import config
from utils import http

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
log = logging.getLogger("osint-bot")

COGS = ["cogs.panel", "cogs.domain", "cogs.network", "cogs.identity", "cogs.files"]


class OSINTBot(commands.Bot):
    def __init__(self):
        # OSINT não precisa ler conteúdo de mensagens: só slash commands.
        intents = discord.Intents.default()
        super().__init__(command_prefix="!", intents=intents, help_command=None)

    async def setup_hook(self):
        for ext in COGS:
            try:
                await self.load_extension(ext)
                log.info("Cog carregado: %s", ext)
            except Exception as e:
                log.exception("Falha ao carregar %s: %s", ext, e)

        # Sincroniza os comandos de barra
        if config.GUILD_ID:
            guild = discord.Object(id=config.GUILD_ID)
            self.tree.copy_global_to(guild=guild)
            synced = await self.tree.sync(guild=guild)
            log.info("Sincronizados %d comandos no servidor %s (instantâneo).", len(synced), config.GUILD_ID)
        else:
            synced = await self.tree.sync()
            log.info("Sincronizados %d comandos globalmente (pode levar até ~1h).", len(synced))

    async def on_ready(self):
        log.info("Conectado como %s (id=%s)", self.user, self.user.id)
        await self.change_presence(
            activity=discord.Activity(type=discord.ActivityType.watching, name="/osint • FearSec")
        )

    async def close(self):
        await http.close_session()
        await super().close()


def main():
    if not config.DISCORD_TOKEN:
        print("ERRO: defina DISCORD_TOKEN no arquivo .env (copie de .env.example).")
        sys.exit(1)
    bot = OSINTBot()
    try:
        bot.run(config.DISCORD_TOKEN, log_handler=None)
    except discord.LoginFailure:
        print("ERRO: token inválido. Confira o DISCORD_TOKEN no .env.")
        sys.exit(1)


if __name__ == "__main__":
    main()
