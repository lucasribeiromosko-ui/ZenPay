"""Guarda de URL contra SSRF: só permite http/https apontando para IP público."""
import asyncio
import socket
from urllib.parse import urlparse

from utils.validators import is_public_ip


async def resolve_public_url(raw: str):
    """Valida uma URL e garante que o host resolve só para IPs públicos.

    Retorna (url_normalizada, host) se OK, ou (None, motivo) se rejeitada.
    """
    if not raw:
        return None, "URL vazia."
    url = raw.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url  # assume https se faltar esquema

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return None, "Só aceito http/https."
    host = parsed.hostname
    if not host:
        return None, "Host inválido na URL."

    try:
        infos = await asyncio.to_thread(socket.getaddrinfo, host, None)
    except Exception:
        return None, f"Não consegui resolver `{host}`."

    ips = {i[4][0] for i in infos}
    for ip in ips:
        if not is_public_ip(ip):
            # bloqueia localhost / redes internas (anti-SSRF)
            return None, f"`{host}` aponta para IP interno/privado — bloqueado."
    return url, host
