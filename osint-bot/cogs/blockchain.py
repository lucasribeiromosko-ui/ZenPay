"""Ferramenta de blockchain: consulta pública de carteiras cripto (BTC/ETH).
Útil em investigações de golpe/extorsão, onde o criminoso pede cripto.
Fonte pública: Blockchair. Não identifica o dono — só o histórico on-chain.
"""
import re

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, http
from utils import reply

_ETH_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")
_BTC_RE = re.compile(r"^(bc1[a-z0-9]{6,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$")


class Blockchain(commands.Cog):
    """Consulta on-chain de carteiras."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="wallet", description="Consulta uma carteira cripto (BTC/ETH): saldo e transações.")
    @app_commands.describe(endereco="Endereço da carteira (Bitcoin ou Ethereum)")
    async def wallet_cmd(self, interaction: discord.Interaction, endereco: str):
        addr = endereco.strip()
        if _ETH_RE.match(addr):
            chain, unit, decimals, label = "ethereum", "ETH", 1e18, "Ethereum"
        elif _BTC_RE.match(addr):
            chain, unit, decimals, label = "bitcoin", "BTC", 1e8, "Bitcoin"
        else:
            return await reply.send(interaction, embeds.error_embed(
                "Endereço inválido", "Informe um endereço **Bitcoin** (1…/3…/bc1…) ou **Ethereum** (0x…)."))
        await reply.defer(interaction)
        try:
            data = await http.fetch_json(f"https://api.blockchair.com/{chain}/dashboards/address/{addr}")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}` (pode ser limite de uso)."))

        entry = (data.get("data") or {}).get(addr) or {}
        info = entry.get("address") or {}
        if not info:
            return await reply.send(interaction, embeds.error_embed(
                "Sem dados", f"Nenhuma informação on-chain para `{addr}` (carteira nova ou inexistente)."))

        def to_unit(v):
            try:
                return f"{(int(v) / decimals):.8f} {unit}"
            except (TypeError, ValueError):
                return "—"

        n_tx = info.get("transaction_count") or entry.get("transaction_count")
        e = embeds.info_embed(f"💰 Carteira {label}", f"`{addr}`")
        embeds.add_field(e, "Saldo atual", to_unit(info.get("balance")), inline=True)
        embeds.add_field(e, "Transações", n_tx if n_tx is not None else "—", inline=True)
        embeds.add_field(e, "Total recebido", to_unit(info.get("received")))
        embeds.add_field(e, "Total enviado", to_unit(info.get("spent")))
        first = info.get("first_seen_receiving")
        last = info.get("last_seen_spending") or info.get("last_seen_receiving")
        if first:
            embeds.add_field(e, "Primeira atividade", str(first)[:10], inline=True)
        if last:
            embeds.add_field(e, "Última atividade", str(last)[:10], inline=True)
        explorer = f"https://blockchair.com/{chain}/address/{addr}"
        embeds.add_field(e, "Explorer", f"[ver no Blockchair]({explorer})")
        e.set_footer(text=f"{config.BRAND_NAME} • histórico on-chain público; não revela o dono")
        await reply.send(interaction, e)


async def setup(bot):
    await bot.add_cog(Blockchain(bot))
