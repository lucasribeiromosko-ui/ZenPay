# Imagem do bot OSINT (Python). Funciona no Railway, Fly.io, Koyeb, Render, etc.
FROM python:3.12-slim

# Evita prompts e deixa os logs saírem na hora (bom para ver no painel do host)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Instala dependências primeiro (aproveita cache de build)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código
COPY . .

# Bot de gateway não expõe porta HTTP — só roda o processo
CMD ["python", "bot.py"]
