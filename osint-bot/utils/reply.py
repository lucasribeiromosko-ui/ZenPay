"""Respostas SEMPRE privadas (ephemeral): só quem executou o comando vê.

Centraliza o envio para garantir que nenhuma ferramenta responda em público.
"""
import discord


async def defer(interaction: discord.Interaction):
    """Mostra 'pensando…' de forma privada."""
    await interaction.response.defer(ephemeral=True)


async def send(interaction: discord.Interaction, embed: discord.Embed, view: discord.ui.View | None = None):
    """Envia o embed de forma privada, tenha havido defer ou não."""
    kwargs = {"embed": embed, "ephemeral": True}
    if view is not None:
        kwargs["view"] = view
    if interaction.response.is_done():
        return await interaction.followup.send(**kwargs)
    return await interaction.response.send_message(**kwargs)
