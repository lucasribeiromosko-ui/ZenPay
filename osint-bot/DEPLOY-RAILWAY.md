# 🚂 Deploy do bot OSINT no Railway (sem usar seu PC)

Tudo pelo navegador, direto do GitHub. O bot fica ligado 24h.

> Você só precisa de: a conta do Discord com o **bot já criado** (Application ID
> + Token — veja o `README.md`, seção "Criar a aplicação no Discord") e uma conta
> gratuita no Railway.

---

## Passo 1 — Convidar o bot para o seu servidor
(Isso é separado da hospedagem e só precisa ser feito uma vez.)
1. <https://discord.com/developers/applications> → sua aplicação → **OAuth2 → URL Generator**.
2. Marque `bot` e `applications.commands`; em permissões, `Send Messages` e `Embed Links`.
3. Abra a URL gerada e adicione o bot ao seu servidor.

## Passo 2 — Criar o projeto no Railway
1. Acesse <https://railway.app> e clique em **Login** → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo**.
   - Se pedir, autorize o Railway a ver seus repositórios e escolha o **ZenPay**.
3. Selecione o repositório **ZenPay**.

## Passo 3 — Apontar para a pasta certa e a branch
O bot está na subpasta `osint-bot`, então:
1. Abra o serviço criado → aba **Settings**.
2. Em **Source** → **Root Directory**, coloque:  `osint-bot`
3. Ainda em Source, confira que a **Branch** é:
   `claude/discord-nuke-bot-fearsec-o8yjzk`
   (ou a branch onde está o código; depois você pode juntar na `main`).

> O Railway vai detectar o `Dockerfile` automaticamente e construir a imagem.

## Passo 4 — Colocar o Token (e chaves opcionais)
1. Aba **Variables** → **New Variable**.
2. Adicione:

| Nome | Valor | Obrigatório? |
|------|-------|--------------|
| `DISCORD_TOKEN` | seu token do bot | ✅ sim |
| `GUILD_ID` | ID do seu servidor (comandos aparecem na hora) | opcional, recomendado |
| `SHODAN_API_KEY` | chave do Shodan | opcional (`/shodan`) |
| `HIBP_API_KEY` | chave do Have I Been Pwned | opcional (`/breach`) |

> 🔒 O token fica guardado **na sua conta do Railway**, não no código. Nunca
> comite ele no GitHub.

## Passo 5 — Deploy
1. O Railway já dispara o build sozinho após salvar as variáveis (ou clique em
   **Deploy**).
2. Abra a aba **Deployments** → **View Logs**.
3. Quando aparecer nos logs:
   ```
   Conectado como FearSec OSINT (id=...)
   Sincronizados N comandos ...
   ```
   está no ar! 🎉
4. Vá ao Discord e digite `/osint`.

---

## Atualizações automáticas
Toda vez que o código for atualizado nessa branch no GitHub, o Railway
**refaz o deploy sozinho**. Não precisa fazer nada.

## Deu erro? Onde olhar
- **Logs em Deployments** mostram o motivo. Erros comuns:
  - `defina DISCORD_TOKEN` → faltou a variável no Passo 4.
  - `LoginFailure` / token inválido → token errado ou precisa **Reset Token**.
  - Comandos não aparecem → sem `GUILD_ID` o registro global leva até ~1h;
    adicione o `GUILD_ID` para aparecer na hora.
- Me manda o **texto do erro** dos logs que eu te ajudo.

## Custo
O Railway dá um crédito mensal gratuito que cobre um bot pequeno como este.
Se um dia passar do crédito, o custo é de centavos — dá pra acompanhar o uso
no painel (**Usage**).
