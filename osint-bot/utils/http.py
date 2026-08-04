"""Cliente HTTP assíncrono compartilhado, com timeout e User-Agent padrão."""
import aiohttp
import config

_session: aiohttp.ClientSession | None = None


async def get_session() -> aiohttp.ClientSession:
    """Retorna uma sessão aiohttp única (criada sob demanda)."""
    global _session
    if _session is None or _session.closed:
        timeout = aiohttp.ClientTimeout(total=15)
        _session = aiohttp.ClientSession(
            timeout=timeout,
            headers={"User-Agent": config.USER_AGENT},
        )
    return _session


async def fetch_json(url: str, **kwargs):
    """GET que retorna JSON. Levanta exceção em erro de rede/timeout."""
    session = await get_session()
    async with session.get(url, **kwargs) as resp:
        resp.raise_for_status()
        return await resp.json(content_type=None)


async def fetch_text(url: str, **kwargs) -> str:
    """GET que retorna texto puro."""
    session = await get_session()
    async with session.get(url, **kwargs) as resp:
        resp.raise_for_status()
        return await resp.text()


async def close_session():
    global _session
    if _session and not _session.closed:
        await _session.close()
