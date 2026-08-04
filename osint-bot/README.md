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

## 🧰 Ferramentas incluídas

| Categoria | Comando | O que faz |
|-----------|---------|-----------|
| 🌐 Domínios | `/whois exemplo.com` | Quem registrou, quando e onde |
| | `/dns exemplo.com` | Registros A, AAAA, MX, NS, TXT, CNAME, SOA |
| | `/subdomains exemplo.com` | Descobre subdomínios (Certificate Transparency) |
| | `/tls exemplo.com` | Detalhes do certificado SSL/TLS |
| 📡 Rede/IP | `/ip 8.8.8.8` | País, provedor, ASN, sinais de VPN/hosting |
| | `/reversedns 8.8.8.8` | Nome (PTR) de um IP, ou IPs de um domínio |
| | `/shodan 8.8.8.8` | Portas e serviços expostos *(chave opcional)* |
| 👤 Identidade | `/username fulano` | Procura o `@` em 12+ sites públicos |
| | `/email pessoa@x.com` | Valida formato + checa MX do domínio |
| | `/breach pessoa@x.com` | Aparece em vazamentos? *(chave HIBP opcional)* |
| 🖼️ Arquivos | `/exif [anexo]` | Câmera, data e GPS de uma foto |
| ℹ️ Ajuda | `/osint` | Abre o painel com menu de categorias |
| | `/ajuda` | Lista rápida de todos os comandos |

Nenhuma chave de API é obrigatória — o bot funciona "de fábrica". `/shodan` e
`/breach` só pedem uma chave gratuita se você quiser usá-los.

---

## 🚀 Como colocar pra rodar (passo a passo)

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
│   ├── network.py      # /ip /reversedns /shodan
│   ├── identity.py     # /username /email /breach
│   └── files.py        # /exif
└── utils/              # helpers (embeds, http, validação)
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
