"""Gerador de senhas seguro + cofre pessoal por usuário.

- /gerar-senha : gera senha (números / letras / forte) de 8 a 28 caracteres,
  com opção de guardar com um nome.
- /senhas      : lista as senhas que VOCÊ guardou (resposta privada).
- /apagar-senha: apaga uma senha guardada.

Usa o módulo `secrets` (criptograficamente seguro). Cada usuário só vê as
próprias senhas. As respostas são privadas (ephemeral).
"""
import asyncio
import os
import secrets
import sqlite3
import string
from datetime import datetime, timezone

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, reply

_SYMBOLS = "!@#$%&*?-_+="


def _gerar(tipo: str, n: int) -> str:
    """Gera uma senha segura do tipo pedido."""
    if tipo == "numeros":
        pool = string.digits
    elif tipo == "letras":
        pool = string.ascii_letters
    else:  # forte: garante variedade
        cats = [string.ascii_lowercase, string.ascii_uppercase, string.digits, _SYMBOLS]
        chars = [secrets.choice(c) for c in cats]  # pelo menos 1 de cada
        todos = "".join(cats)
        chars += [secrets.choice(todos) for _ in range(n - len(chars))]
        secrets.SystemRandom().shuffle(chars)
        return "".join(chars)
    return "".join(secrets.choice(pool) for _ in range(n))


# ----------------------------------------------------------------- SQLite
def _conn():
    d = os.path.dirname(config.DB_PATH)
    if d:
        os.makedirs(d, exist_ok=True)
    c = sqlite3.connect(config.DB_PATH)
    c.execute("""CREATE TABLE IF NOT EXISTS senhas(
        user_id INTEGER, nome TEXT, senha TEXT, criado TEXT,
        PRIMARY KEY(user_id, nome))""")
    return c


def _db_save(uid, nome, senha, criado):
    c = _conn()
    try:
        c.execute("INSERT OR REPLACE INTO senhas VALUES(?,?,?,?)", (uid, nome, senha, criado))
        c.commit()
    finally:
        c.close()


def _db_list(uid):
    c = _conn()
    try:
        return c.execute("SELECT nome, senha, criado FROM senhas WHERE user_id=? ORDER BY nome", (uid,)).fetchall()
    finally:
        c.close()


def _db_delete(uid, nome):
    c = _conn()
    try:
        cur = c.execute("DELETE FROM senhas WHERE user_id=? AND nome=?", (uid, nome))
        c.commit()
        return cur.rowcount
    finally:
        c.close()


class Passwords(commands.Cog):
    """Gerador e cofre de senhas."""

    def __init__(self, bot):
        self.bot = bot

    # ------------------------------------------------------- GERAR SENHA
    @app_commands.command(name="gerar-senha", description="Gera uma senha segura e (opcional) guarda com um nome.")
    @app_commands.describe(
        tipo="Só números, só letras ou forte (misturada)",
        tamanho="De 8 a 28 caracteres",
        guardar_como="(opcional) nome para salvar no seu cofre, ex.: Discord",
    )
    @app_commands.choices(tipo=[
        app_commands.Choice(name="🔢 Só números", value="numeros"),
        app_commands.Choice(name="🔤 Só letras", value="letras"),
        app_commands.Choice(name="🛡️ Forte (misturada)", value="forte"),
    ])
    async def gerar_senha_cmd(
        self, interaction: discord.Interaction,
        tipo: app_commands.Choice[str],
        tamanho: app_commands.Range[int, 8, 28],
        guardar_como: str = None,
    ):
        senha = _gerar(tipo.value, tamanho)
        e = embeds.ok_embed("Senha gerada", f"Tipo: **{tipo.name}** · {tamanho} caracteres")
        embeds.add_field(e, "Sua senha", f"```\n{senha}\n```")

        if guardar_como:
            nome = guardar_como.strip()[:60]
            if not nome:
                embeds.add_field(e, "⚠️ Não guardei", "O nome ficou vazio.")
            else:
                criado = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                await asyncio.to_thread(_db_save, interaction.user.id, nome, senha, criado)
                embeds.add_field(e, "💾 Guardada no seu cofre", f"Nome: **{nome}** — veja com `/senhas`")
        else:
            embeds.add_field(e, "Dica", "Quer guardar? Use a opção `guardar_como` (ex.: `Discord`).")

        e.set_footer(text=f"{config.BRAND_NAME} • resposta privada • para contas críticas use um gerenciador dedicado")
        await reply.send(interaction, e)

    # ------------------------------------------------------------ SENHAS
    @app_commands.command(name="senhas", description="Mostra as senhas que você guardou (só você vê).")
    async def senhas_cmd(self, interaction: discord.Interaction):
        rows = await asyncio.to_thread(_db_list, interaction.user.id)
        if not rows:
            return await reply.send(interaction, embeds.info_embed(
                "Cofre vazio", "Você ainda não guardou nenhuma senha. Use `/gerar-senha` com a opção `guardar_como`."))
        e = embeds.info_embed("🔐 Seu cofre de senhas", f"{len(rows)} senha(s) guardada(s):")
        for nome, senha, criado in rows[:25]:
            embeds.add_field(e, f"{nome}  ·  {criado}", f"`{senha}`")
        e.set_footer(text=f"{config.BRAND_NAME} • só você vê isto • apague com /apagar-senha")
        await reply.send(interaction, e)

    # ------------------------------------------------------- APAGAR SENHA
    @app_commands.command(name="apagar-senha", description="Apaga uma senha guardada no seu cofre.")
    @app_commands.describe(nome="Nome exato da senha (como aparece em /senhas)")
    async def apagar_senha_cmd(self, interaction: discord.Interaction, nome: str):
        n = await asyncio.to_thread(_db_delete, interaction.user.id, nome.strip())
        if n:
            await reply.send(interaction, embeds.ok_embed("Apagada", f"A senha **{nome.strip()}** foi removida do seu cofre."))
        else:
            await reply.send(interaction, embeds.error_embed("Não encontrei", f"Nenhuma senha chamada **{nome.strip()}**. Veja os nomes em `/senhas`."))


async def setup(bot):
    await bot.add_cog(Passwords(bot))
