"""Configuração central do bot — lê variáveis de ambiente do arquivo .env."""
import os
from dotenv import load_dotenv

load_dotenv()

# Token obrigatório
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "").strip()

# ID do servidor (opcional) — se definido, sincroniza comandos só nele (instantâneo)
_guild = os.getenv("GUILD_ID", "").strip()
GUILD_ID = int(_guild) if _guild.isdigit() else None

# Chaves opcionais
SHODAN_API_KEY = os.getenv("SHODAN_API_KEY", "").strip()
HIBP_API_KEY = os.getenv("HIBP_API_KEY", "").strip()

# Identidade da FearSec exibida nos rodapés dos embeds
BRAND_NAME = "FearSec OSINT"
BRAND_COLOR = 0x2ECC71  # verde
ERROR_COLOR = 0xE74C3C  # vermelho
INFO_COLOR = 0x3498DB   # azul

# User-Agent usado nas requisições HTTP
USER_AGENT = "FearSec-OSINT-Bot/1.0 (+https://github.com; educational OSINT)"
