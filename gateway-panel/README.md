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

## ⚙️ Gateways
LofyPay · Sharpify · BravoPay · Dominipay · GoatPay
> As **taxas** ficam em `gateways.js` (`taxaReceber`, `taxaReceberFixa`,
> `taxaSaque`, `taxaSaqueFixa`). Os valores atuais são **placeholders** — troque
> pelos reais de cada gateway.

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
   - `LOFYPAY_SECRET`, `SHARPIFY_SECRET`, `BRAVOPAY_SECRET`, `DOMINIPAY_SECRET`, `GOATPAY_SECRET`
2. Abra `api/gerar.js` e ajuste, para cada gateway, a **URL** e o **corpo do
   request** conforme a **documentação** dela (headers, campos, etc.).
3. (Opcional) Crie `api/saque.js` no mesmo molde para os saques.
4. No `app.js`, troque as simulações (`gerarPagamento`, `pedirSaque`) por um
   `fetch("/api/gerar", { method:"POST", body: JSON.stringify({...}) })` e mostre
   o QR Code / Pix copia-e-cola que a gateway retornar.

> 💡 Me manda as **docs das APIs** e eu completo o `api/gerar.js` e o `api/saque.js`
> de cada gateway, além de plugar o resultado (QR Code) na tela.

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
