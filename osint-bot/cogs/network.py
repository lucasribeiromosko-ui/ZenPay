"""Ferramentas de rede: geolocalização de IP, DNS reverso e Shodan (opcional)."""
import asyncio
import re
import socket

import discord
from discord import app_commands
from discord.ext import commands

import config
from utils import embeds, http
from utils import reply
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
            return await reply.send(interaction, embeds.error_embed("IP inválido", "Informe um endereço IP **público** válido."))
        await reply.defer(interaction)
        try:
            # ip-api.com — gratuito, sem chave (uso não-comercial)
            fields = "status,message,query,country,regionName,city,isp,org,as,reverse,proxy,hosting"
            data = await http.fetch_json(f"http://ip-api.com/json/{ip.strip()}?fields={fields}")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}`"))
        if data.get("status") != "success":
            return await reply.send(interaction, embeds.error_embed("Sem resultado", data.get("message", "IP não encontrado.")))

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
        await reply.send(interaction, e)

    # -------------------------------------------------------- REVERSE DNS
    @app_commands.command(name="reversedns", description="Resolve o nome (PTR) de um IP e vice-versa.")
    @app_commands.describe(alvo="Um IP (8.8.8.8) ou um domínio (exemplo.com)")
    async def reversedns_cmd(self, interaction: discord.Interaction, alvo: str):
        await reply.defer(interaction)
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
                    return await reply.send(interaction, embeds.error_embed("Entrada inválida", "Informe um IP ou domínio válido."))
                infos = await asyncio.to_thread(socket.getaddrinfo, domain, None)
                ips = sorted({i[4][0] for i in infos})
                embeds.add_field(e, "IPs resolvidos", "\n".join(ips))
        except Exception as ex:
            return await reply.send(interaction, embeds.error_embed("Sem resultado", f"Não foi possível resolver `{alvo}`.\n`{ex}`"))
        await reply.send(interaction, e)

    # --------------------------------------------------------------- IPWHOIS
    @app_commands.command(name="ipwhois", description="Dono do bloco de IP (RDAP): organização, rede e abuse.")
    @app_commands.describe(ip="Ex.: 8.8.8.8")
    async def ipwhois_cmd(self, interaction: discord.Interaction, ip: str):
        if not is_public_ip(ip):
            return await reply.send(interaction, embeds.error_embed("IP inválido", "Informe um IP público válido."))
        await reply.defer(interaction)
        try:
            # RDAP oficial via redirecionador da IANA (cobre ARIN/RIPE/LACNIC/APNIC)
            data = await http.fetch_json(f"https://rdap.org/ip/{ip.strip()}")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha no RDAP", f"`{e}`"))

        e = embeds.info_embed(f"IP WHOIS (RDAP) — {ip.strip()}")
        embeds.add_field(e, "Nome da rede", data.get("name"))
        embeds.add_field(e, "Faixa", f"{data.get('startAddress','?')} – {data.get('endAddress','?')}", inline=True)
        embeds.add_field(e, "País", data.get("country"), inline=True)
        # extrai organização e contato de abuse das entidades
        org, abuse = _rdap_entities(data.get("entities", []))
        if org:
            embeds.add_field(e, "Organização", org)
        if abuse:
            embeds.add_field(e, "📮 Contato de abuse", abuse)
        await reply.send(interaction, e)

    # ------------------------------------------------------------------- ASN
    @app_commands.command(name="asn", description="Prefixos de IP e organização de um ASN.")
    @app_commands.describe(asn="Ex.: AS15169 ou 15169")
    async def asn_cmd(self, interaction: discord.Interaction, asn: str):
        raw = asn.strip().upper().replace("AS", "")
        if not raw.isdigit():
            return await reply.send(interaction, embeds.error_embed("ASN inválido", "Use `AS15169` ou `15169`."))
        await reply.defer(interaction)
        try:
            ov = await http.fetch_json(f"https://stat.ripe.net/data/as-overview/data.json?resource=AS{raw}")
            pf = await http.fetch_json(f"https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS{raw}")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}`"))
        holder = (ov.get("data") or {}).get("holder")
        prefixes = [p.get("prefix") for p in (pf.get("data") or {}).get("prefixes", [])]
        v4 = [p for p in prefixes if p and ":" not in p]
        v6 = [p for p in prefixes if p and ":" in p]
        e = embeds.info_embed(f"ASN — AS{raw}", holder or "")
        embeds.add_field(e, "Organização", holder)
        embeds.add_field(e, f"Prefixos IPv4 ({len(v4)})", "\n".join(v4[:25]) or "—")
        if v6:
            embeds.add_field(e, f"Prefixos IPv6 ({len(v6)})", "\n".join(v6[:10]))
        if len(v4) > 25:
            embeds.add_field(e, "Obs.", f"+{len(v4) - 25} prefixos IPv4 não exibidos.")
        await reply.send(interaction, e)

    # ------------------------------------------------------------------- MAC
    @app_commands.command(name="mac", description="Fabricante (vendor) de um endereço MAC de placa de rede.")
    @app_commands.describe(mac="Ex.: 00:1A:2B:3C:4D:5E")
    async def mac_cmd(self, interaction: discord.Interaction, mac: str):
        m = mac.strip()
        if not re.match(r"^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$", m):
            return await reply.send(interaction, embeds.error_embed(
                "MAC inválido", "Formato: `00:1A:2B:3C:4D:5E`."))
        await reply.defer(interaction)
        try:
            session = await http.get_session()
            async with session.get(f"https://api.macvendors.com/{m}") as resp:
                if resp.status == 404:
                    return await reply.send(interaction, embeds.error_embed(
                        "Fabricante não encontrado", f"Nenhum fabricante registrado para `{m}`."))
                if resp.status != 200:
                    return await reply.send(interaction, embeds.error_embed(
                        "Consulta indisponível", f"O serviço respondeu {resp.status} (limite de uso). Tente em instantes."))
                vendor = (await resp.text()).strip()
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"`{e}`"))
        e = embeds.info_embed(f"MAC — {m}")
        embeds.add_field(e, "Fabricante (OUI)", vendor or "—")
        embeds.add_field(e, "Prefixo OUI", m[:8].upper(), inline=True)
        await reply.send(interaction, e)

    # ---------------------------------------------------------------- SHODAN
    @app_commands.command(name="shodan", description="Portas e serviços expostos de um IP (requer chave Shodan).")
    @app_commands.describe(ip="Ex.: 8.8.8.8")
    async def shodan_cmd(self, interaction: discord.Interaction, ip: str):
        if not config.SHODAN_API_KEY:
            return await reply.send(interaction, embeds.error_embed(
                    "Shodan não configurado",
                    "Adicione `SHODAN_API_KEY` no `.env` para usar este comando.\n"
                    "Crie uma chave grátis em https://account.shodan.io",
                ))
        if not is_public_ip(ip):
            return await reply.send(interaction, embeds.error_embed("IP inválido", "Informe um IP público válido."))
        await reply.defer(interaction)
        try:
            data = await http.fetch_json(
                f"https://api.shodan.io/shodan/host/{ip.strip()}?key={config.SHODAN_API_KEY}")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha no Shodan", f"`{e}` (IP pode não estar indexado)."))

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
        await reply.send(interaction, e)


def _rdap_entities(entities):
    """Extrai (organização, contato_abuse) de uma lista de entidades RDAP."""
    org = None
    abuse = None
    for ent in entities or []:
        roles = ent.get("roles", [])
        name, email = _vcard_name_email(ent.get("vcardArray"))
        if ("registrant" in roles or "administrative" in roles) and name and not org:
            org = name
        if "abuse" in roles:
            abuse = email or name
        # entidades aninhadas (abuse costuma vir dentro de outra)
        sub_org, sub_abuse = _rdap_entities(ent.get("entities", []))
        org = org or sub_org
        abuse = abuse or sub_abuse
    return org, abuse


def _vcard_name_email(vcard):
    """Lê nome e e-mail de um vcardArray do RDAP."""
    name = email = None
    if not vcard or len(vcard) < 2:
        return name, email
    for item in vcard[1]:
        if not isinstance(item, list) or len(item) < 4:
            continue
        if item[0] == "fn":
            name = item[3]
        elif item[0] == "email":
            email = item[3]
    return name, email


async def setup(bot):
    await bot.add_cog(Network(bot))
