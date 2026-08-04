"""Ferramentas de rede: geolocalização de IP, DNS reverso e Shodan (opcional)."""
import asyncio
import socket

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, http
from utils.validators import parse_ip, is_public_ip, clean_domain


class Network(commands.Cog):
    """Investigação de IPs e infraestrutura de rede."""

    def __init__(self, bot):
        self.bot = bot

    # ------------------------------------------------------------- IP INFO
    @app_commands.command(name="ip", description="Geolocalização e provedor (ASN) de um IP público.")
    @app_commands.describe(ip="Ex.: 8.8.8.8")
    async def ip_cmd(self, interaction: discord.Interaction, ip: str):
        if not is_public_ip(ip):
            return await interaction.response.send_message(
                embed=embeds.error_embed("IP inválido", "Informe um endereço IP **público** válido."),
                ephemeral=True,
            )
        await interaction.response.defer()
        try:
            # ip-api.com — gratuito, sem chave (uso não-comercial)
            fields = "status,message,query,country,regionName,city,isp,org,as,reverse,proxy,hosting"
            data = await http.fetch_json(f"http://ip-api.com/json/{ip.strip()}?fields={fields}")
        except Exception as e:
            return await interaction.followup.send(
                embed=embeds.error_embed("Falha na consulta", f"`{e}`")
            )
        if data.get("status") != "success":
            return await interaction.followup.send(
                embed=embeds.error_embed("Sem resultado", data.get("message", "IP não encontrado."))
            )

        e = embeds.info_embed(f"IP — {data.get('query')}")
        loc = ", ".join(filter(None, [data.get("city"), data.get("regionName"), data.get("country")]))
        embeds.add_field(e, "Localização", loc)
        embeds.add_field(e, "Provedor (ISP)", data.get("isp"))
        embeds.add_field(e, "Organização", data.get("org"), inline=True)
        embeds.add_field(e, "ASN", data.get("as"), inline=True)
        embeds.add_field(e, "rDNS", data.get("reverse"))
        flags = []
        if data.get("proxy"):
            flags.append("🕵️ proxy/VPN")
        if data.get("hosting"):
            flags.append("🖥️ hosting/datacenter")
        if flags:
            embeds.add_field(e, "Sinais", " • ".join(flags))
        await interaction.followup.send(embed=e)

    # -------------------------------------------------------- REVERSE DNS
    @app_commands.command(name="reversedns", description="Resolve o nome (PTR) de um IP e vice-versa.")
    @app_commands.describe(alvo="Um IP (8.8.8.8) ou um domínio (exemplo.com)")
    async def reversedns_cmd(self, interaction: discord.Interaction, alvo: str):
        await interaction.response.defer()
        alvo = alvo.strip()
        e = embeds.info_embed(f"Reverse DNS — {alvo}")
        try:
            if parse_ip(alvo):
                host = await asyncio.to_thread(socket.gethostbyaddr, alvo)
                embeds.add_field(e, "PTR (nome)", host[0])
                if host[1]:
                    embeds.add_field(e, "Aliases", "\n".join(host[1]))
            else:
                domain = clean_domain(alvo)
                if not domain:
                    return await interaction.followup.send(
                        embed=embeds.error_embed("Entrada inválida", "Informe um IP ou domínio válido."))
                infos = await asyncio.to_thread(socket.getaddrinfo, domain, None)
                ips = sorted({i[4][0] for i in infos})
                embeds.add_field(e, "IPs resolvidos", "\n".join(ips))
        except Exception as ex:
            return await interaction.followup.send(
                embed=embeds.error_embed("Sem resultado", f"Não foi possível resolver `{alvo}`.\n`{ex}`"))
        await interaction.followup.send(embed=e)

    # ---------------------------------------------------------------- SHODAN
    @app_commands.command(name="shodan", description="Portas e serviços expostos de um IP (requer chave Shodan).")
    @app_commands.describe(ip="Ex.: 8.8.8.8")
    async def shodan_cmd(self, interaction: discord.Interaction, ip: str):
        if not config.SHODAN_API_KEY:
            return await interaction.response.send_message(
                embed=embeds.error_embed(
                    "Shodan não configurado",
                    "Adicione `SHODAN_API_KEY` no `.env` para usar este comando.\n"
                    "Crie uma chave grátis em https://account.shodan.io",
                ),
                ephemeral=True,
            )
        if not is_public_ip(ip):
            return await interaction.response.send_message(
                embed=embeds.error_embed("IP inválido", "Informe um IP público válido."), ephemeral=True)
        await interaction.response.defer()
        try:
            data = await http.fetch_json(
                f"https://api.shodan.io/shodan/host/{ip.strip()}?key={config.SHODAN_API_KEY}")
        except Exception as e:
            return await interaction.followup.send(
                embed=embeds.error_embed("Falha no Shodan", f"`{e}` (IP pode não estar indexado)."))

        e = embeds.info_embed(f"Shodan — {data.get('ip_str', ip)}")
        embeds.add_field(e, "Organização", data.get("org"), inline=True)
        embeds.add_field(e, "SO", data.get("os") or "—", inline=True)
        ports = data.get("ports", [])
        embeds.add_field(e, f"Portas abertas ({len(ports)})", ", ".join(map(str, sorted(ports))) or "—")
        hostnames = data.get("hostnames", [])
        if hostnames:
            embeds.add_field(e, "Hostnames", "\n".join(hostnames[:8]))
        vulns = data.get("vulns", [])
        if vulns:
            embeds.add_field(e, "⚠️ CVEs relatadas", ", ".join(sorted(vulns)[:15]))
        await interaction.followup.send(embed=e)


async def setup(bot):
    await bot.add_cog(Network(bot))
