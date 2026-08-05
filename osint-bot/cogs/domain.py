"""Ferramentas de domínio: WHOIS, DNS, subdomínios (Certificate Transparency) e TLS."""
import asyncio
import ssl
import socket
from datetime import datetime, timezone

import discord
from discord import app_commands
from discord.ext import commands

import dns.asyncresolver
import whois

from utils import embeds, http
from utils import reply
from utils.validators import clean_domain, registrable_domain

DNS_RECORDS = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]


class Domain(commands.Cog):
    """Investigação de domínios a partir de fontes públicas."""

    def __init__(self, bot):
        self.bot = bot

    # ---------------------------------------------------------------- WHOIS
    @app_commands.command(name="whois", description="Dados de registro de um domínio (dono, datas, servidores).")
    @app_commands.describe(dominio="Ex.: exemplo.com")
    async def whois_cmd(self, interaction: discord.Interaction, dominio: str):
        domain = clean_domain(dominio)
        if not domain:
            return await reply.send(interaction, embeds.error_embed("Domínio inválido", f"`{dominio}` não parece um domínio válido."))
        reg = registrable_domain(domain)
        await reply.defer(interaction)

        # 1) RDAP (mais confiável e estruturado); 2) python-whois como reserva
        data = await _whois_via_rdap(reg)
        if not data or not (data.get("created") or data.get("registrar")):
            legacy = await _whois_via_legacy(reg)
            if legacy and (legacy.get("created") or legacy.get("registrar")):
                data = legacy
        if not data:
            return await reply.send(interaction, embeds.error_embed(
                "Sem dados de registro", f"Não encontrei registro para `{reg}` (pode não existir ou o TLD não expor)."))

        e = embeds.info_embed(f"WHOIS — {reg}")
        if reg != domain:
            embeds.add_field(e, "ℹ️ Observação", f"`{domain}` é um subdomínio. Mostrando o registro de **{reg}**.")
        embeds.add_field(e, "Registrar", data.get("registrar"))
        embeds.add_field(e, "Organização", data.get("org"))
        embeds.add_field(e, "País", data.get("country"), inline=True)
        embeds.add_field(e, "Criado em", data.get("created"), inline=True)
        embeds.add_field(e, "Expira em", data.get("expires"), inline=True)
        if data.get("updated"):
            embeds.add_field(e, "Atualizado em", data.get("updated"), inline=True)
        if data.get("status"):
            embeds.add_field(e, "Status", data.get("status"))
        if data.get("nameservers"):
            embeds.add_field(e, "Name servers", "\n".join(data["nameservers"][:8]))
        e.set_footer(text=f"FearSec OSINT • fonte: {data.get('source', '—')}")
        await reply.send(interaction, e)

    # ------------------------------------------------------------------ DNS
    @app_commands.command(name="dns", description="Consulta registros DNS (A, AAAA, MX, NS, TXT, CNAME, SOA).")
    @app_commands.describe(dominio="Ex.: exemplo.com")
    async def dns_cmd(self, interaction: discord.Interaction, dominio: str):
        domain = clean_domain(dominio)
        if not domain:
            return await reply.send(interaction, embeds.error_embed("Domínio inválido", f"`{dominio}` não parece um domínio válido."))
        await reply.defer(interaction)

        resolver = dns.asyncresolver.Resolver()
        resolver.lifetime = 8.0
        e = embeds.info_embed(f"DNS — {domain}")
        found_any = False
        for rec in DNS_RECORDS:
            try:
                answers = await resolver.resolve(domain, rec)
                values = [r.to_text() for r in answers]
                if values:
                    found_any = True
                    embeds.add_field(e, rec, "\n".join(values[:10]))
            except Exception:
                continue  # sem esse tipo de registro
        if not found_any:
            e = embeds.error_embed(f"DNS — {domain}", "Nenhum registro encontrado (domínio pode não existir).")
        await reply.send(interaction, e)

    # ----------------------------------------------------------- SUBDOMAINS
    @app_commands.command(name="subdomains", description="Descobre subdomínios via Certificate Transparency (crt.sh).")
    @app_commands.describe(dominio="Ex.: exemplo.com")
    async def subdomains_cmd(self, interaction: discord.Interaction, dominio: str):
        domain = clean_domain(dominio)
        if not domain:
            return await reply.send(interaction, embeds.error_embed("Domínio inválido", f"`{dominio}` não parece um domínio válido."))
        await reply.defer(interaction)
        try:
            data = await http.fetch_json(f"https://crt.sh/?q=%25.{domain}&output=json")
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha na consulta", f"crt.sh não respondeu.\n`{e}`"))

        subs = set()
        for entry in data or []:
            name = entry.get("name_value", "")
            for line in name.splitlines():
                line = line.strip().lstrip("*.").lower()
                if line.endswith(domain):
                    subs.add(line)
        subs.discard(domain)
        ordered = sorted(subs)

        if not ordered:
            return await reply.send(interaction, embeds.error_embed(f"Subdomínios — {domain}", "Nenhum subdomínio encontrado no CT logs."))

        e = embeds.ok_embed(f"Subdomínios — {domain}", f"**{len(ordered)}** encontrados (Certificate Transparency).")
        chunk = "\n".join(f"• {s}" for s in ordered[:40])
        embeds.add_field(e, "Lista (até 40)", chunk)
        if len(ordered) > 40:
            embeds.add_field(e, "Obs.", f"+{len(ordered) - 40} não exibidos.")
        await reply.send(interaction, e)

    # ------------------------------------------------------------------ TLS
    @app_commands.command(name="tls", description="Detalhes do certificado TLS/SSL de um domínio.")
    @app_commands.describe(dominio="Ex.: exemplo.com")
    async def tls_cmd(self, interaction: discord.Interaction, dominio: str):
        domain = clean_domain(dominio)
        if not domain:
            return await reply.send(interaction, embeds.error_embed("Domínio inválido", f"`{dominio}` não parece um domínio válido."))
        await reply.defer(interaction)
        try:
            cert = await asyncio.to_thread(_get_cert, domain)
        except Exception as e:
            return await reply.send(interaction, embeds.error_embed("Falha no TLS", f"Não consegui obter o certificado de `{domain}`.\n`{e}`"))

        e = embeds.info_embed(f"Certificado TLS — {domain}")
        subject = dict(x[0] for x in cert.get("subject", []))
        issuer = dict(x[0] for x in cert.get("issuer", []))
        embeds.add_field(e, "Emitido para (CN)", subject.get("commonName"))
        embeds.add_field(e, "Emissor", issuer.get("organizationName") or issuer.get("commonName"))
        embeds.add_field(e, "Válido de", cert.get("notBefore"), inline=True)
        embeds.add_field(e, "Válido até", cert.get("notAfter"), inline=True)
        sans = [v for (k, v) in cert.get("subjectAltName", []) if k == "DNS"]
        if sans:
            embeds.add_field(e, f"SANs ({len(sans)})", "\n".join(sans[:15]))
        await reply.send(interaction, e)


async def _whois_via_rdap(domain: str):
    """Consulta RDAP e normaliza os campos. Retorna dict ou None."""
    try:
        j = await http.fetch_json(f"https://rdap.org/domain/{domain}")
    except Exception:
        return None
    events = {}
    for ev in j.get("events", []):
        events[ev.get("eventAction")] = (ev.get("eventDate") or "")[:10]
    registrar = org = country = None
    for ent in j.get("entities", []):
        roles = ent.get("roles") or []
        fn, _c = _vcard_fn_country(ent.get("vcardArray"))
        if "registrar" in roles and not registrar:
            registrar = fn
        if ("registrant" in roles or "administrative" in roles):
            org = org or fn
            country = country or _c
    ns = [n.get("ldhName", "").lower() for n in j.get("nameservers", []) if n.get("ldhName")]
    return {
        "registrar": registrar,
        "org": org,
        "country": country,
        "created": events.get("registration"),
        "expires": events.get("expiration"),
        "updated": events.get("last changed"),
        "status": ", ".join(j.get("status", [])) or None,
        "nameservers": ns,
        "source": "RDAP",
    }


async def _whois_via_legacy(domain: str):
    """python-whois (porta 43) como reserva. Retorna dict normalizado ou None."""
    try:
        data = await asyncio.to_thread(whois.whois, domain)
    except Exception:
        return None
    if not data:
        return None
    ns = data.get("name_servers")
    if isinstance(ns, (list, set)):
        ns_list = sorted({str(n).lower() for n in ns})
    elif ns:
        ns_list = [str(ns).lower()]
    else:
        ns_list = []
    return {
        "registrar": _first(data.get("registrar")),
        "org": _first(data.get("org")),
        "country": _first(data.get("country")),
        "created": _fmt_date(data.get("creation_date")),
        "expires": _fmt_date(data.get("expiration_date")),
        "updated": _fmt_date(data.get("updated_date")),
        "status": None,
        "nameservers": ns_list,
        "source": "WHOIS (porta 43)",
    }


def _vcard_fn_country(vcard):
    """Extrai (nome, país) de um vcardArray do RDAP."""
    fn = country = None
    if not vcard or len(vcard) < 2:
        return fn, country
    for item in vcard[1]:
        if not isinstance(item, list) or len(item) < 4:
            continue
        if item[0] == "fn":
            fn = item[3]
        elif item[0] == "adr" and isinstance(item[3], list):
            country = item[3][-1] or None
    return fn, country


def _get_cert(domain: str) -> dict:
    """Conecta na porta 443 e retorna o certificado apresentado (bloqueante)."""
    ctx = ssl.create_default_context()
    with socket.create_connection((domain, 443), timeout=8) as sock:
        with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
            return ssock.getpeercert()


def _first(value):
    """WHOIS às vezes devolve lista; pega o primeiro item."""
    if isinstance(value, (list, tuple)):
        return value[0] if value else None
    return value


def _fmt_date(value):
    d = _first(value)
    if isinstance(d, datetime):
        return d.astimezone(timezone.utc).strftime("%Y-%m-%d")
    return str(d) if d else None


async def setup(bot):
    await bot.add_cog(Domain(bot))
