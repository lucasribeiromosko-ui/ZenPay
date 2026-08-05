# 🛡️ FearSec OSINT Bot

Bot de Discord com um **painel de ferramentas OSINT** (inteligência de fontes
abertas), pensado para ser **fácil de usar por iniciantes**. Todos os comandos
são de barra (`/`) e respondem com painéis organizados.

> ⚖️ **Uso responsável.** Este bot consulta **apenas fontes públicas/abertas**
> (WHOIS, DNS, Certificate Transparency, geolocalização de IP, perfis públicos,
> metadados de arquivos, Have I Been Pwned). Foi feito para **investigar
> infraestrutura maliciosa** (domínios de phishing, golpes, scam) de forma
> educacional e autorizada.
>
> **Ele NÃO faz** "puxada" de dados pessoais, consulta de CPF/endereço/telefone
> em bases vazadas, doxxing ou qualquer coisa que exponha pessoas. Não use para
> assédio. Isso é ilegal (LGPD) e vai contra o propósito da ferramenta.

---

> 🔒 **Privacidade:** todas as respostas são **privadas (ephemeral)** — só quem
> executou o comando vê o resultado. Nada aparece para o resto do servidor.

## 🧰 Ferramentas incluídas (29 comandos)

| Categoria | Comando | O que faz |
|-----------|---------|-----------|
| 🌐 Domínio & DNS | `/whois exemplo.com` | Quem registrou, quando e onde |
| | `/dns exemplo.com` | Registros A, AAAA, MX, NS, TXT, CNAME, SOA |
| | `/subdomains exemplo.com` | Subdomínios (Certificate Transparency) |
| | `/tls exemplo.com` | Certificado SSL/TLS |
| 📡 IP & Rede | `/ip 8.8.8.8` | País, provedor, ASN, VPN/hosting |
| | `/ipwhois 8.8.8.8` | Dono do bloco de IP + contato de abuse (RDAP) |
| | `/reversedns 8.8.8.8` | PTR de um IP, ou IPs de um domínio |
| | `/asn AS15169` | Prefixos de IP e organização de um ASN (RIPEstat) |
| | `/shodan 8.8.8.8` | Portas/serviços expostos *(chave opcional)* |
| 🕸️ Web & Sites | `/headers exemplo.com` | Cabeçalhos HTTP, tecnologias, segurança |
| | `/webscan exemplo.com` | Extrai e-mails, links e metadados |
| | `/robots exemplo.com` | robots.txt + sitemaps (caminhos escondidos) |
| | `/wayback exemplo.com` | Histórico no Wayback Machine (archive.org) |
| 👤 Pessoas | `/username fulano` | Procura o `@` em 12+ sites públicos |
| | `/email pessoa@x.com` | Relatório completo: MX, SPF/DMARC, provedor, Gravatar, vazamentos |
| | `/breach pessoa@x.com` | Vazamentos (grátis via XposedOrNot; HIBP se tiver chave) |
| | `/phone +5511999998888` | Valida telefone: país, operadora, tipo |
| 🖼️ Arquivos | `/exif [anexo]` | Câmera, data e GPS de uma foto |
| | `/reverseimage [anexo/url]` | Busca reversa (Google, Yandex, Bing, TinEye) |
| 🔐 Segurança | `/hash <hash>` | Identifica e quebra hash (MD5/SHA) |
| | `/cve CVE-2021-44228` | Detalhes de uma vulnerabilidade (NVD) |
| 🔎 Busca & Dorks | `/buscar termo onde` | Acha arquivos públicos por título e tipo (Drive, PDF, planilha, Trello…) |
| | `/dork exemplo.com` | Investiga um domínio: arquivos, logins e brechas expostas |
| 🧰 Ferramentas | `/base64 encode/decode` | Codifica/decodifica Base64 |
| | `/useragent <ua>` | Analisa uma string de User-Agent |
| ℹ️ Ajuda | `/painel` `/osint` | Menu interativo por categoria |
| | `/ajuda` | Lista rápida de todos os comandos |
| | `/tutorial` | Guia passo a passo para começar |

Nenhuma chave de API é obrigatória — o bot funciona "de fábrica". Só o `/shodan`
pede uma chave gratuita se você quiser usá-lo.

---

## ☁️ Rodar hospedado 24h (sem usar seu PC) — recomendado

Para o bot ficar sempre online sem depender do seu computador, faça o deploy
num host de aplicação. O projeto já vem pronto (`Dockerfile` + `railway.toml`):

- **Railway** (mais fácil, pelo navegador): siga o **[DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)**.
- Também funciona em **Fly.io**, **Koyeb**, **Render** e qualquer host que rode
  Docker — basta definir as variáveis de ambiente (`DISCORD_TOKEN`, etc.) no
  painel da plataforma.

> Nesses hosts você **não usa arquivo `.env`** — as variáveis são configuradas
> no painel do serviço. O `config.py` lê direto do ambiente.

---

## 💻 Rodar localmente (passo a passo)

### 1. Criar o bot no Discord
1. Acesse <https://discord.com/developers/applications> → **New Application**.
2. Menu **Bot** → **Reset Token** → copie o token (guarde com segurança).
3. Ainda em **Bot**, não precisa ativar nenhum "Privileged Intent" (o bot só usa
   comandos de barra).
4. Menu **OAuth2 → URL Generator**: marque os escopos `bot` e
   `applications.commands`. Em permissões, `Send Messages` e `Embed Links`
   bastam. Abra a URL gerada e adicione o bot ao **seu** servidor.

### 2. Instalar e configurar
```bash
# entre na pasta do bot
cd osint-bot

# (recomendado) ambiente virtual
python3 -m venv .venv && source .venv/bin/activate

# instale as dependências
pip install -r requirements.txt

# crie seu arquivo de configuração
cp .env.example .env
# abra o .env e cole seu DISCORD_TOKEN
```

Dica: coloque também o `GUILD_ID` do seu servidor no `.env` para os comandos
aparecerem **na hora** (sem ele, o Discord pode levar até ~1h para publicar os
comandos globalmente). Para pegar o ID: Configurações do Discord → Avançado →
ative **Modo desenvolvedor**, depois clique com o botão direito no servidor →
**Copiar ID**.

### 3. Rodar
```bash
python bot.py
```
Quando aparecer `Conectado como ...`, vá ao Discord e digite `/osint`.

---

## 🔑 Chaves opcionais

| Variável | Para quê | Onde obter (grátis) |
|----------|----------|---------------------|
| `SHODAN_API_KEY` | comando `/shodan` | <https://account.shodan.io> |
| `HIBP_API_KEY` | comando `/breach` por e-mail | <https://haveibeenpwned.com/API/Key> |

Sem elas, o bot avisa educadamente que o comando precisa da chave — o resto
continua funcionando normalmente.

---

## 🗂️ Estrutura do projeto

```
osint-bot/
├── bot.py              # ponto de entrada, carrega os módulos
├── config.py           # lê o .env
├── requirements.txt
├── .env.example        # modelo de configuração
├── cogs/               # cada arquivo = um grupo de ferramentas
│   ├── panel.py        # /osint e /ajuda (menu interativo)
│   ├── domain.py       # /whois /dns /subdomains /tls
│   ├── network.py      # /ip /reversedns /ipwhois /shodan
│   ├── identity.py     # /username /email /breach
│   ├── web.py          # /headers /webscan
│   ├── crypto.py       # /hash
│   └── files.py        # /exif
└── utils/              # helpers (embeds, http, validação, anti-SSRF)
```

### Adicionar sua própria ferramenta
1. Crie `cogs/minha_ferramenta.py` copiando o formato de um cog existente.
2. Adicione `"cogs.minha_ferramenta"` na lista `COGS` em `bot.py`.
3. Reinicie o bot. Pronto — arquitetura de plugins.

---

## 🧭 Boas práticas de OSINT

- **Confirme antes de concluir.** Um perfil existir com um username não prova
  que é a mesma pessoa. Cruze evidências.
- **Documente a fonte.** Anote de onde veio cada dado.
- **Respeite os Termos de Serviço** dos sites e a legislação (LGPD).
- **Foque em infraestrutura**, não em pessoas. O objetivo é entender domínios,
  servidores e golpes — não perseguir indivíduos.
