// ============================================================================
//  Autenticação simples por chave (x-api-key) para as funções /api.
//
//  Defina CENTRALPAY_API_KEY nas Environment Variables da Vercel. Use a mesma
//  chave no header "x-api-key" (no painel: barra lateral; no Python: header H).
//
//  Se CENTRALPAY_API_KEY NÃO estiver definida, a autenticação fica desligada
//  (útil para testar). Assim que você definir, todas as chamadas passam a exigir.
// ============================================================================

// Retorna true se a requisição está autorizada; caso contrário responde 401.
export function autorizado(req, res) {
  const esperado = process.env.CENTRALPAY_API_KEY;
  if (!esperado) return true; // auth desligada enquanto a env não existir
  const recebido = req.headers["x-api-key"] || req.headers["X-Api-Key"] || "";
  if (recebido && String(recebido) === String(esperado)) return true;
  res.status(401).json({ erro: "Chave inválida (x-api-key)" });
  return false;
}
