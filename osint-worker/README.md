# 🛡️ FearSec OSINT — Cloudflare Worker

Versão do bot OSINT que roda **serverless no Cloudflare Workers**, no modelo
**Interactions** (o Discord chama seu Worker a cada `/comando`). Não precisa de
servidor ligado 24h e o plano gratuito da Cloudflare já dá conta.

> ⚖️ **Uso responsável.** Só consulta **fontes públicas/abertas** (DNS-over-HTTPS,
> RDAP, Certificate Transparency, geolocalização de IP, perfis públicos, HIBP).
> Feito para investigar **infraestrutura maliciosa** com autorização. **Não faz**
> consulta de dados pessoais vazados, CPF/endereço, doxxing ou assédio.

## 🧰 Comandos

| Categoria | Comando | O que faz |
|-----------|---------|-----------|
| 🌐 Domínios | `/whois` | Registro do domínio (via RDAP) |
| | `/dns` | Registros A, AAAA, MX, NS, TXT, CNAME, SOA (DoH) |
| | `/subdomains` | Subdomínios via Certificate Transparency |
| 📡 Rede/IP | `/ip` | País, provedor, ASN, coordenadas |
| | `/ipwhois` | Dono do bloco de IP + contato de abuse (RDAP) |
| | `/reversedns` | PTR de um IP, ou IPs de um domínio |
| | `/shodan` | Portas/serviços expostos *(chave opcional)* |
| 🕸️ Web | `/headers` | Cabeçalhos HTTP, tecnologias, headers de segurança |
| | `/webscan` | E-mails, links e metadados de uma página |
| 👤 Identidade | `/username` | Procura o `@` em 12+ sites públicos |
| | `/email` | Valida formato + MX do domínio |
| | `/breach` | Vazamentos por e-mail (HIBP) *(chave opcional)* |
| #️⃣ Hash | `/hash` | Identifica e quebra hashes (MD5/SHA, dicionário) |
| ℹ️ | `/osint`, `/ajuda` | Painel e lista de comandos |

> Diferenças da versão Python: `/whois` e `/ipwhois` usam **RDAP**; **`/exif` e
> `/tls` não estão nesta versão** (o Worker não processa imagem/socket bruto bem).
> A versão Python completa continua na pasta `../osint-bot`.

---

## 🚀 Deploy na Cloudflare (passo a passo)

Você faz tudo com a **sua** conta — o token do Discord e as chaves nunca saem da
sua máquina/conta.

### 1. Criar a aplicação no Discord
1. <https://discord.com/developers/applications> → **New Application**.
2. Em **General Information**, copie o **Application ID** e a **Public Key**.
3. Aba **Bot** → **Reset Token** → copie o token (guarde; usado só no passo 4).

### 2. Instalar e configurar o projeto
```bash
cd osint-worker
npm install                     # instala o wrangler (CLI da Cloudflare)
```
Abra `wrangler.toml` e preencha `APPLICATION_ID` e `DISCORD_PUBLIC_KEY` com os
valores do passo 1.

### 3. Publicar o Worker
```bash
npx wrangler login              # abre o navegador p/ logar na SUA conta Cloudflare
npx wrangler deploy
```
No fim, o comando mostra a URL pública do Worker, algo como:
`https://fearsec-osint.SEU-SUBDOMINIO.workers.dev`  ← **copie essa URL**.

### 4. Registrar os comandos no Discord
Rode uma vez (o token é usado só aqui, localmente):
```bash
# Linux/Mac
DISCORD_TOKEN=seu_token APPLICATION_ID=seu_app_id node register.js

# Windows (PowerShell)
$env:DISCORD_TOKEN="seu_token"; $env:APPLICATION_ID="seu_app_id"; node register.js
```
Dica: adicione `GUILD_ID=id_do_seu_servidor` para os comandos aparecerem **na
hora** só no seu servidor (sem ele, o global leva até ~1h).

### 5. Apontar o Discord para o Worker
1. No Developer Portal → **General Information** → campo
   **Interactions Endpoint URL**: cole a URL do Worker (passo 3) e **Save**.
2. O Discord envia um PING de validação; se o Worker estiver no ar, salva com ✅.

### 6. Adicionar o bot ao servidor
Aba **OAuth2 → URL Generator** → marque `applications.commands` (e `bot`) →
abra a URL gerada → escolha seu servidor. Pronto: digite `/osint`. 🎉

---

## 🔑 Chaves opcionais (segredos)
Não vão no `wrangler.toml`. Configure pelo terminal:
```bash
npx wrangler secret put SHODAN_API_KEY     # p/ /shodan  — https://account.shodan.io
npx wrangler secret put HIBP_API_KEY       # p/ /breach  — https://haveibeenpwned.com/API/Key
```

## 🗂️ Estrutura
```
osint-worker/
├── wrangler.toml        # config do Worker (vars públicas)
├── commands.js          # definição dos slash commands
├── register.js          # registra os comandos (roda 1x, local)
└── src/
    ├── index.js         # entrada: valida assinatura e roteia
    ├── discord.js       # embeds, verificação Ed25519, follow-up
    ├── util.js          # validação, DNS-over-HTTPS, fetch
    ├── md5.js           # MD5 (WebCrypto não tem)
    └── tools.js         # todas as ferramentas
```

### Como funciona (rápido)
O Discord assina cada requisição (Ed25519); o Worker valida em `src/index.js`.
Comandos rápidos respondem na hora; os que fazem consulta externa respondem
"pensando…" (deferred) e o Worker termina em segundo plano via `ctx.waitUntil`,
editando a resposta original. Nenhum estado é guardado — 100% stateless.
