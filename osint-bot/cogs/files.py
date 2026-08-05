"""Ferramenta de arquivos: metadados EXIF e busca reversa de imagens."""
import io
from urllib.parse import quote_plus

import discord
from discord import app_commands
from discord.ext import commands

from PIL import Image, ExifTags

import config
from utils import embeds
from utils import reply

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
            return await reply.send(interaction, embeds.error_embed("Arquivo grande demais", "Limite de 15 MB."))
        if not (imagem.content_type or "").startswith("image/"):
            return await reply.send(interaction, embeds.error_embed("Não é imagem", "Anexe um arquivo de imagem."))

        await reply.defer(interaction)
        raw = await imagem.read()
        try:
            img = Image.open(io.BytesIO(raw))
            exif = img._getexif()
        except Exception as ex:
            return await reply.send(interaction, embeds.error_embed("Falha ao ler", f"`{ex}`"))

        e = embeds.info_embed(f"EXIF — {imagem.filename}")
        embeds.add_field(e, "Dimensões", f"{img.width} × {img.height}px", inline=True)
        embeds.add_field(e, "Formato", img.format, inline=True)

        if not exif:
            embeds.add_field(e, "Metadados", "Nenhum EXIF encontrado (removido ou não suportado).")
            e.set_footer(text=f"{config.BRAND_NAME} • sem EXIF ≠ sem pistas; veja formato/tamanho.")
            return await reply.send(interaction, e)

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
        await reply.send(interaction, e)


    # -------------------------------------------------------- REVERSE IMAGE
    @app_commands.command(name="reverseimage", description="Gera links de busca reversa de imagem (Google, Yandex, Bing, TinEye).")
    @app_commands.describe(imagem="Anexe uma imagem", url="ou cole a URL de uma imagem pública")
    async def reverseimage_cmd(self, interaction: discord.Interaction,
                               imagem: discord.Attachment = None, url: str = None):
        img_url = None
        if imagem is not None:
            if not (imagem.content_type or "").startswith("image/"):
                return await reply.send(interaction, embeds.error_embed("Não é imagem", "Anexe um arquivo de imagem."))
            img_url = imagem.url
        elif url:
            img_url = url.strip()
        if not img_url:
            return await reply.send(interaction, embeds.error_embed(
                "Faltou a imagem", "Anexe uma imagem **ou** cole a URL de uma imagem pública."))
        q = quote_plus(img_url)
        engines = {
            "🔍 Google Lens": f"https://lens.google.com/uploadbyurl?url={q}",
            "🟡 Yandex": f"https://yandex.com/images/search?rpt=imageview&url={q}",
            "🔵 Bing": f"https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:{q}",
            "👁️ TinEye": f"https://www.tineye.com/search?url={q}",
        }
        e = embeds.info_embed("Busca reversa de imagem", "Clique para descobrir onde a imagem aparece na web:")
        for name, link in engines.items():
            embeds.add_field(e, name, f"[abrir busca]({link})", inline=True)
        e.set_footer(text=f"{config.BRAND_NAME} • a imagem precisa estar acessível publicamente pela URL.")
        await reply.send(interaction, e)


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
