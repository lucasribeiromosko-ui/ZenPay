"""Validação/sanitização de entradas — evita SSRF e entradas malformadas."""
import ipaddress
import re

import tldextract

_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})+$"
)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Usa a Public Suffix List embutida (sem baixar nada em runtime).
_extract = tldextract.TLDExtract(suffix_list_urls=())


def registrable_domain(domain: str) -> str:
    """Reduz um domínio ao domínio registrável (ex.: sub.exemplo.com -> exemplo.com).

    Lida com TLDs compostos (.com.br, .co.uk) via Public Suffix List.
    """
    if not domain:
        return domain
    ext = _extract(domain)
    return ext.registered_domain or domain


def clean_domain(raw: str) -> str | None:
    """Extrai um domínio limpo de algo como 'https://Sub.Exemplo.com/x'.

    Retorna None se não parecer um domínio válido.
    """
    if not raw:
        return None
    s = raw.strip().lower()
    s = re.sub(r"^[a-z]+://", "", s)   # remove esquema
    s = s.split("/")[0]                 # remove caminho
    s = s.split("?")[0]
    s = s.split(":")[0]                 # remove porta
    s = s.strip(".")
    if _DOMAIN_RE.match(s):
        return s
    return None


def is_valid_email(raw: str) -> bool:
    return bool(_EMAIL_RE.match(raw.strip()))


def parse_ip(raw: str):
    """Retorna um objeto IPv4Address/IPv6Address ou None."""
    try:
        return ipaddress.ip_address(raw.strip())
    except ValueError:
        return None


def is_public_ip(raw: str) -> bool:
    """True somente se for um IP público (bloqueia privados/loopback/reservados)."""
    ip = parse_ip(raw)
    if ip is None:
        return False
    return not (ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local or ip.is_multicast)
