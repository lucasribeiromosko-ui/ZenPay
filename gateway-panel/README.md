# 🖤💜 CentralPay — Painel de Gateways

Painel de pagamentos com tema **preto meia-noite + roxo** para vender
**sites, produtos digitais e serviços**. Mostra estatísticas, saldo, carteira/saque
e gera cobranças escolhendo entre várias gateways — sempre exibindo **a taxa
completa** de cada uma (receber **e** sacar).

> Feito para deploy na **Vercel**. O frontend é estático; as chamadas reais às
> gateways passam por **Vercel Functions** (`/api`), onde as chaves secretas
> ficam seguras em variáveis de ambiente.

## 🧩 Telas
- **Início** — saldo, quanto entrou/saiu no mês, nº de vendas, gráfico de faturamento e últimos pagamentos.
- **Estatísticas** — ticket médio, aprovação, MEDs, histórico completo, **consultar pagador** (busca por nome/ID) e filtro por período. Cada pagamento mostra **de qual gateway veio** (ex.: LofyPay).
- **Carteira** — saldo disponível/pendente + **solicitar saque** (mostra a taxa de saque e o líquido).
- **Gerar pagamento** — escolhe a gateway (cards com as taxas), digita o valor e vê o **detalhamento completo**: taxa de recebimento → o que cai → taxa de saque → líquido final.

## ⚙️ Gateways integradas
**LofyPay** e **Sharpify** (Pix).
> As **taxas** exibidas ficam em `gateways.js` — são **placeholders**, ajuste
> pelos valores reais do seu contrato. A cobrança de verdade é criada pela API
> real de cada gateway (`api/gerar.js`).

---

## 🚀 Deploy na Vercel (pelo navegador)
1. Acesse <https://vercel.com> → **Add New → Project** → importe o repositório.
2. Em **Root Directory**, selecione **`gateway-panel`**.
3. **Framework Preset:** `Other` (é site estático + funções). Deploy.
4. Pronto — a Vercel serve o `index.html` e detecta as funções em `/api` sozinha.

## 🔐 Conectar as gateways de verdade (o passo seguro)
As chaves **secretas** NUNCA vão no frontend. Elas ficam nas **Environment
Variables** da Vercel:

1. No projeto da Vercel → **Settings → Environment Variables** → adicione:
   - `LOFYPAY_SECRET` — a `sk_live_…` da LofyPay
   - `SHARPIFY_CLIENT_ID` — o `x-sharpify-client-id`
   - `SHARPIFY_CLIENT_SECRET` — o `x-sharpify-client-secret`
2. Redeploy. Pronto — a tela **Gerar pagamento** já cria o Pix real:
   `api/gerar.js` chama `POST /api/v1/gateway` (LofyPay) e
   `POST /api/v1/checkout/payment-link/create` (Sharpify), e a tela mostra o
   Pix copia-e-cola, o QR Code e (Sharpify) o link.

> ⚠️ **Nunca** coloque a `sk_live` nem o `client_secret` no frontend nem no
> repositório — só nas Environment Variables da Vercel.
>
> Próximos (posso deixar prontos): `api/saque.js` (LofyPay `POST /api/v1/cashout`)
> e os **webhooks** (`notification_url` / eventos assinados) para atualizar o
> status dos pagamentos e saques automaticamente.

---

## 🗂️ Estrutura
```
gateway-panel/
├── index.html      # estrutura do painel
├── styles.css      # tema preto meia-noite + roxo
├── gateways.js     # config das gateways + motor de taxas
├── data.js         # dados de DEMONSTRAÇÃO (troque pelos reais via API)
├── app.js          # telas (Início, Estatísticas, Carteira, Gerar)
└── api/
    └── gerar.js    # function serverless (chave secreta segura)
```

## ✅ Estado atual (v1)
Painel completo e navegável com **motor de taxas funcionando** e dados de
demonstração. Falta apenas **plugar as APIs reais** das gateways (precisa das
docs + chaves) — a arquitetura já está pronta e segura para isso.
