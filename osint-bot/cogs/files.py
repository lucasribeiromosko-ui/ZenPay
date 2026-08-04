"""Ferramenta de arquivos: extração de metadados EXIF de imagens."""
import io

import discord
from discord import app_commands
from discord.ext import commands

from PIL import Image, ExifTags

import config
from utils import embeds

GPS_TAGS = {v: k for k, v in ExifTags.GPSTAGS.items()}
MAX_BYTES = 15 * 1024 * 1024  # 15 MB


class Files(commands.Cog):
    """Análise de metadados de arquivos."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="exif", description="Extrai metadados EXIF de uma imagem (câmera, data, GPS).")
    @app_commands.describe(imagem="Anexe uma imagem (JPG/TIFF costumam ter EXIF).")
    async def exif_cmd(self, interaction: discord.Interaction, imagem: discord.Attachment):
        if imagem.size > MAX_BYTES:
            return await interaction.response.send_message(
                embed=embeds.error_embed("Arquivo grande demais", "Limite de 15 MB."), ephemeral=True)
        if not (imagem.content_type or "").startswith("image/"):
            return await interaction.response.send_message(
                embed=embeds.error_embed("Não é imagem", "Anexe um arquivo de imagem."), ephemeral=True)

        await interaction.response.defer()
        raw = await imagem.read()
        try:
            img = Image.open(io.BytesIO(raw))
            exif = img._getexif()
        except Exception as ex:
            return await interaction.followup.send(
                embed=embeds.error_embed("Falha ao ler", f"`{ex}`"))

        e = embeds.info_embed(f"EXIF — {imagem.filename}")
        embeds.add_field(e, "Dimensões", f"{img.width} × {img.height}px", inline=True)
        embeds.add_field(e, "Formato", img.format, inline=True)

        if not exif:
            embeds.add_field(e, "Metadados", "Nenhum EXIF encontrado (removido ou não suportado).")
            e.set_footer(text=f"{config.BRAND_NAME} • sem EXIF ≠ sem pistas; veja formato/tamanho.")
            return await interaction.followup.send(embed=e)

        tags = {ExifTags.TAGS.get(k, k): v for k, v in exif.items()}
        for label, key in [
            ("Câmera/Fabricante", "Make"),
            ("Modelo", "Model"),
            ("Software", "Software"),
            ("Data original", "DateTimeOriginal"),
        ]:
            if key in tags:
                embeds.add_field(e, label, str(tags[key])[:100], inline=True)

        coords = _extract_gps(tags.get("GPSInfo"))
        if coords:
            lat, lon = coords
            maps = f"https://www.google.com/maps?q={lat},{lon}"
            embeds.add_field(e, "📍 GPS", f"`{lat:.6f}, {lon:.6f}`\n[Ver no mapa]({maps})")
        await interaction.followup.send(embed=e)


def _extract_gps(gps_info):
    """Converte o bloco GPSInfo do EXIF em (lat, lon) decimais, ou None."""
    if not gps_info:
        return None
    try:
        def to_deg(values, ref):
            d, m, s = [float(x) for x in values]
            dec = d + m / 60 + s / 3600
            if ref in ("S", "W"):
                dec = -dec
            return dec

        lat = to_deg(gps_info[GPS_TAGS["GPSLatitude"]], gps_info[GPS_TAGS["GPSLatitudeRef"]])
        lon = to_deg(gps_info[GPS_TAGS["GPSLongitude"]], gps_info[GPS_TAGS["GPSLongitudeRef"]])
        return (lat, lon)
    except Exception:
        return None


async def setup(bot):
    await bot.add_cog(Files(bot))
