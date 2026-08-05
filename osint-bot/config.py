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
# NVD (https://nvd.nist.gov/developers/request-an-api-key) — para /cve.
# Sem chave funciona, mas com limite baixo (~5 req/30s).
NVD_API_KEY = os.getenv("NVD_API_KEY", "").strip()
# Cookie de sessão do Instagram (opcional) — faz o /instagram funcionar mesmo
# a partir de servidores/datacenter. Pegue o valor do cookie "sessionid" da
# sua conta logada no navegador. Risco: automação pode sinalizar a conta.
IG_SESSIONID = os.getenv("IG_SESSIONID", "").strip()
# Proxy (opcional) usado SÓ nas requisições ao Instagram. Um proxy residencial
# contorna o bloqueio por IP de datacenter. Ex.: http://usuario:senha@host:porta
IG_PROXY = os.getenv("IG_PROXY", "").strip() or None

# Identidade da FearSec exibida nos rodapés dos embeds
BRAND_NAME = "FearSec OSINT"
BRAND_COLOR = 0x2ECC71  # verde
ERROR_COLOR = 0xE74C3C  # vermelho
INFO_COLOR = 0x3498DB   # azul

# User-Agent usado nas requisições HTTP
USER_AGENT = "FearSec-OSINT-Bot/1.0 (+https://github.com; educational OSINT)"
