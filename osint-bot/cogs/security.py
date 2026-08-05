"""Ferramentas de segurança: consulta de vulnerabilidades (CVE) pela NVD."""
import re

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, http
from utils import reply

CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,}$")


class Security(commands.Cog):
    """Consulta de vulnerabilidades públicas."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="cve", description="Detalhes de uma vulnerabilidade (CVE) pela base oficial NVD.")
    @app_commands.describe(id="Ex.: CVE-2021-44228")
    async def cve_cmd(self, interaction: discord.Interaction, id: str):
        cid = id.strip().upper()
        if not CVE_RE.match(cid):
            return await reply.send(interaction, embeds.error_embed("ID inválido", "Formato correto: `CVE-2021-44228`."))
        await reply.defer(interaction)
        headers = {"apiKey": config.NVD_API_KEY} if config.NVD_API_KEY else {}
        try:
            data = await http.fetch_json(
                f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cid}", headers=headers)
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed(
                "Falha na consulta", f"A base NVD não respondeu (pode ser limite de uso; tente em instantes).\n`{e}`"))

        vulns = data.get("vulnerabilities", [])
        if not vulns:
            return await reply.send(interaction, embeds.error_embed("Não encontrado", f"`{cid}` não existe na base NVD."))
        cve = vulns[0].get("cve", {})
        desc = next((d["value"] for d in cve.get("descriptions", []) if d.get("lang") == "en"), "—")

        score = sev = None
        metrics = cve.get("metrics", {})
        for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
            if metrics.get(key):
                m = metrics[key][0]
                cd = m.get("cvssData", {})
                score = cd.get("baseScore")
                sev = cd.get("baseSeverity") or m.get("baseSeverity")
                break

        refs = [u for r in cve.get("references", []) if (u := r.get("url"))][:5]
        published = (cve.get("published") or "")[:10]

        color = config.INFO_COLOR
        if isinstance(score, (int, float)):
            color = config.ERROR_COLOR if score >= 7 else config.BRAND_COLOR
        e = embeds.base_embed(f"🐛 {cid}", desc[:1500], color)
        embeds.add_field(e, "Publicado", published or "—", inline=True)
        embeds.add_field(e, "CVSS", f"{score} ({sev})" if score is not None else "sem score", inline=True)
        if refs:
            embeds.add_field(e, "Referências", "\n".join(refs))
        embeds.add_field(e, "Mais detalhes", f"[NVD](https://nvd.nist.gov/vuln/detail/{cid})", inline=True)
        e.set_footer(text=f"{config.BRAND_NAME} • fonte: NVD (NIST)")
        await reply.send(interaction, e)


async def setup(bot):
    await bot.add_cog(Security(bot))
