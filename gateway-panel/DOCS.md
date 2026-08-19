# CentralPay — API & Docs

API própria para **gerar pagamentos Pix**, **consultar status** e **solicitar saques**
integrando as gateways **LofyPay** e **Sharpify**. As chaves das gateways ficam só na
Vercel (Environment Variables) — seu código nunca as vê.

- **Base URL:** `https://SEU-PROJETO.vercel.app`
- **Autenticação:** header `x-api-key: SUA_CHAVE` (a mesma `CENTRALPAY_API_KEY` da Vercel)
- **Formato:** JSON em todos os endpoints (`POST`)

---

## Taxas reais

| Gateway  | Para receber      | Para sacar      | Liberação           | Mínimo | Limite/dia |
|----------|-------------------|-----------------|---------------------|--------|------------|
| Sharpify | 1% + R$0,40       | R$2,00          | 100% automático, na hora | R$3,00 | R$500,00 |
| LofyPay  | R$0,50 fixo       | R$0,50 fixo     | descontado na venda aprovada | — | — |

> A taxa de recebimento é descontada quando a venda é aprovada. O valor mínimo e o
> limite diário da Sharpify são validados antes de gerar a cobrança.

---

## Endpoints

### `POST /api/gerar` — criar cobrança Pix

**Body**
```json
{ "gateway": "lofypay", "valor": 10.00, "descricao": "Pedido #1", "pagador": "Empresa Alpha" }
```
`gateway`: `"lofypay"` ou `"sharpify"`. `valor` em **reais**.

**Resposta**
```json
{ "id": "abc123", "status": "aguardando pagamento", "code": "00020126...Pix", "qr": "iVBORw0K...", "link": null }
```
- `code` — Pix copia-e-cola
- `qr` — QR em base64 (ou URL, na Sharpify)
- `link` — link de checkout (Sharpify)

### `POST /api/status` — consultar pagamento

**Body**
```json
{ "gateway": "lofypay", "id": "abc123" }
```

**Resposta**
```json
{ "id": "abc123", "status": "pago", "bruto": "approved" }
```
`status` normalizado: `pago` · `pendente` · `cancelado` · `med` · `desconhecido`.

### `POST /api/saque` — solicitar saque (LofyPay)

**Body**
```json
{ "gateway": "lofypay", "valor": 5.00, "keypix": "chave@pix.com", "nome": "Fulano", "cpf": "00000000000" }
```

**Resposta**
```json
{ "id": "cash_1", "status": "processando" }
```

---

## Python (cliente pronto: `centralpay.py`)

```python
from centralpay import CentralPay

cp = CentralPay("https://SEU-PROJETO.vercel.app", "SUA_CHAVE")

# 1) gerar cobrança
pix = cp.gerar(valor=10.00, gateway="lofypay", descricao="Pedido #1")
print(pix["code"])   # copia-e-cola
print(pix["id"])

# 2) consultar status
st = cp.status(pix["id"], gateway="lofypay")
print(st["status"])  # pago / pendente / cancelado

# 3) saque (LofyPay)
cp.saque(valor=5.00, keypix="sua-chave@pix.com", nome="Fulano", cpf="00000000000")
```

Sem o cliente, com `requests` puro:

```python
import requests

BASE = "https://SEU-PROJETO.vercel.app"
H = {"x-api-key": "SUA_CHAVE", "Content-Type": "application/json"}

r = requests.post(f"{BASE}/api/gerar",
    json={"gateway": "lofypay", "valor": 10.00, "descricao": "Pedido #1"}, headers=H)
print(r.json())
```

---

## cURL

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/gerar \
  -H "x-api-key: SUA_CHAVE" -H "Content-Type: application/json" \
  -d '{"gateway":"lofypay","valor":10.00,"descricao":"Teste"}'
```

---

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | O que é |
|----------|---------|
| `LOFYPAY_SECRET` | `sk_live_...` da LofyPay |
| `SHARPIFY_CLIENT_ID` | `x-sharpify-client-id` |
| `SHARPIFY_CLIENT_SECRET` | `x-sharpify-client-secret` |
| `CENTRALPAY_API_KEY` | chave que você inventa e usa no `x-api-key` |

> **Nunca** coloque essas chaves no código nem no repositório — só nas Environment
> Variables da Vercel. Se alguma chave já apareceu em texto/chat, **gere uma nova**
> no painel da gateway (rotacione).

Enquanto `CENTRALPAY_API_KEY` não estiver definida, a API aceita chamadas sem
autenticação (modo de teste). Assim que você definir, o header `x-api-key` passa a
ser obrigatório.
