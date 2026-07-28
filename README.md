# ZenPay

Gateway de pagamentos com painel do vendedor e checkout público, em tema
vermelho sangue, cinza e preto.

O projeto está na **fase visual**: toda a interface funciona e os dados ficam
salvos no navegador. Ainda não há integração com processador de pagamento nem
banco de dados — o PIX e o cartão são simulações fiéis do fluxo real.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build && npm start
```

## Como funciona

Ao abrir a raiz do site o visitante cai direto no painel, mas ele aparece
bloqueado e desfocado atrás de um pop-up de login/criar conta. A sessão é
guardada em `localStorage` (`zenpay_user`) — ainda não há autenticação real.

O checkout em `/pay/[id]` é público e não exige login, como tem que ser.

### Rotas

| Rota | O que é |
| --- | --- |
| `/` | Painel do vendedor, com login obrigatório em pop-up |
| `/pay/[id]` | Checkout público de um produto ou link de pagamento |

### Páginas do painel

- **Dashboard** — saldo, ações rápidas, indicadores do dia, receita por hora, status dos pedidos e últimas transações
- **Análises** — indicadores do período, receita por dia e pedidos por dia
- **Transações** — filtros, busca, exportação e detalhe de cada transação (com taxa e valor líquido)
- **Clientes** — leads e compradores
- **Produtos & Checkouts** — cria produtos e gera checkout para cada um
- **Links de Pagamento** — cria link avulso com valor e formas de pagamento
- **Temas** — bio link estilo Linktree com pré-visualização
- **Recebimento** — chave PIX, conta bancária e tabela de taxas
- **Notificações** — eventos de venda, canais e resumos

**Saque em Cripto**, **Trackeamento** e **API & Webhooks** aparecem no menu com
cadeado: são recursos ainda não disponíveis e abrem uma tela explicando o que
virá. Para liberar um deles, tire o `locked: true` do item em
`components/Sidebar.tsx` e o nome da lista `LOCKED` em `components/Dashboard.tsx`.

### Formas de pagamento

Tanto produtos quanto links de pagamento deixam escolher, por cobrança, quais
formas aceitar:

- **PIX** — QR Code e copia e cola
- **Cartão de crédito** — com parcelamento de até 12x
- **Cartão de débito** — à vista

O checkout mostra apenas os métodos habilitados naquela cobrança. Produtos no
modo **Completo** pedem nome, e-mail e CPF antes do pagamento (viram lead); no
modo **Rápido** o comprador vai direto pagar.

## Onde os dados ficam hoje

Tudo em `localStorage`, no navegador de quem está usando:

| Chave | Conteúdo |
| --- | --- |
| `zenpay_user` | Sessão do vendedor logado |
| `zenpay_products` | Produtos criados |
| `zenpay_paylinks` | Links de pagamento criados |

Isso significa que os dados não são compartilhados entre navegadores nem entre
dispositivos — é proposital enquanto o back-end não existe.

## Deploy

Hospedado na Vercel, com deploy de produção a partir da branch `main`. O
`vercel.json` fixa o framework como Next.js — importante porque o repositório
foi importado quando só tinha o README, e sem isso a Vercel trata o projeto
como site estático e devolve 404.

Se a produção ficar presa numa implantação antiga, confira em
**Settings → Build and Deployment** se o Framework Preset está em *Next.js* e
se o Root Directory está vazio (a raiz do repositório).

## Banco de dados (Neon)

O banco ainda não está ligado à aplicação, mas o schema já está pronto em
[`db/schema.sql`](db/schema.sql). Para preparar:

1. No console do Neon, abra o **SQL Editor** e execute o conteúdo de
   `db/schema.sql`. Ele cria as tabelas e pode ser rodado mais de uma vez.
2. Copie a connection string do Neon — use a do **pooler** (o host tem
   `-pooler`), que é a recomendada para funções serverless.
3. Na Vercel, em **Settings → Environment Variables**, adicione:

   | Nome | Valor |
   | --- | --- |
   | `DATABASE_URL` | a connection string do pooler |
   | `AUTH_SECRET` | valor aleatório (`openssl rand -base64 32`) |

4. Faça um redeploy para as variáveis valerem.

Valores em dinheiro são guardados em **centavos** (`INTEGER`), nunca em
`float` — é o que evita erro de arredondamento em cobrança.

### Tabelas

| Tabela | Guarda |
| --- | --- |
| `users` | Vendedores que entram no painel |
| `payout_settings` | Chave PIX, conta bancária e carteira cripto |
| `products` | Produtos e a configuração de checkout de cada um |
| `payment_links` | Links de pagamento avulsos |
| `customers` | Compradores/leads do checkout completo |
| `transactions` | Cada cobrança, com método, status, taxa e líquido |
| `withdrawals` | Saques em PIX e em cripto |
| `webhooks` | Endpoints que recebem os eventos |
| `api_keys` | Chaves pública e secreta (secreta só em hash) |
| `tracking_pixels` | Meta, Google Ads, TikTok e GTM |

## Próximos passos

1. Ligar a aplicação ao Neon, substituindo o `localStorage`
2. Autenticação real, substituindo o login visual
3. Integração com processador de pagamento para PIX e cartão
4. Webhooks de verdade nos eventos já listados na tela de API

> A string de conexão do banco deve entrar como variável de ambiente na Vercel,
> nunca no código. Se uma credencial já tiver sido compartilhada em conversa ou
> commit, troque a senha antes de usá-la.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS. Os gráficos e
o QR Code são SVG escritos à mão, sem bibliotecas externas.
