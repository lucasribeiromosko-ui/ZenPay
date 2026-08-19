"""
CentralPay — cliente Python.

Gere pagamentos Pix, consulte status e solicite saques direto do seu projeto.
As chaves das gateways ficam SÓ na Vercel (Environment Variables) — aqui você
usa apenas a sua CENTRALPAY_API_KEY (o header x-api-key).

Uso rápido:

    from centralpay import CentralPay

    cp = CentralPay("https://SEU-PROJETO.vercel.app", "SUA_CHAVE")

    # gerar cobrança
    pix = cp.gerar(valor=10.00, gateway="lofypay", descricao="Pedido #1")
    print(pix["code"])   # Pix copia-e-cola
    print(pix["id"])     # id p/ consultar depois

    # consultar status
    st = cp.status(pix["id"], gateway="lofypay")
    print(st["status"])  # pago / pendente / cancelado

    # solicitar saque (LofyPay)
    cp.saque(valor=5.00, keypix="sua-chave@pix.com", nome="Fulano", cpf="00000000000")

Requer: pip install requests
"""

import requests


class CentralPayError(Exception):
    """Erro retornado pela API do CentralPay."""


class CentralPay:
    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base = base_url.rstrip("/")
        self.timeout = timeout
        self.headers = {"x-api-key": api_key, "Content-Type": "application/json"}

    def _post(self, path: str, payload: dict) -> dict:
        r = requests.post(
            f"{self.base}{path}", json=payload, headers=self.headers, timeout=self.timeout
        )
        try:
            data = r.json()
        except ValueError:
            raise CentralPayError(f"Resposta inválida ({r.status_code}): {r.text[:200]}")
        if not r.ok or data.get("erro"):
            raise CentralPayError(data.get("erro") or f"HTTP {r.status_code}")
        return data

    def gerar(self, valor: float, gateway: str = "lofypay",
              descricao: str = "", pagador: str = "") -> dict:
        """Cria uma cobrança Pix. Retorna {id, status, code, qr, link}."""
        return self._post("/api/gerar", {
            "gateway": gateway, "valor": valor,
            "descricao": descricao, "pagador": pagador,
        })

    def status(self, id: str, gateway: str = "lofypay") -> dict:
        """Consulta o status de um pagamento. Retorna {id, status, bruto}."""
        return self._post("/api/status", {"gateway": gateway, "id": id})

    def saque(self, valor: float, keypix: str, nome: str = "", cpf: str = "",
              gateway: str = "lofypay") -> dict:
        """Solicita um saque (LofyPay). Retorna {id, status}."""
        return self._post("/api/saque", {
            "gateway": gateway, "valor": valor,
            "keypix": keypix, "nome": nome, "cpf": cpf,
        })


if __name__ == "__main__":
    import os

    BASE = os.environ.get("CENTRALPAY_BASE", "https://SEU-PROJETO.vercel.app")
    KEY = os.environ.get("CENTRALPAY_API_KEY", "SUA_CHAVE")

    cp = CentralPay(BASE, KEY)
    cobranca = cp.gerar(valor=10.00, gateway="lofypay", descricao="Teste via Python")
    print("Cobrança criada:")
    print("  id  :", cobranca.get("id"))
    print("  pix :", cobranca.get("code"))

    st = cp.status(cobranca["id"], gateway="lofypay")
    print("Status atual:", st.get("status"))
