export type CheckoutMode = "rapido" | "completo";

export type Product = {
  id: string;
  nome: string;
  descricao: string;
  /** Valor em centavos. */
  valor: number;
  modo: CheckoutMode;
  pix: boolean;
  credito: boolean;
  debito: boolean;
  parcelas: number;
  ativo: boolean;
  vendas: number;
  criadoEm: string;
};

const STORAGE_KEY = "zenpay_products";

export function brlFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function centsFromInput(raw: string): number {
  return parseInt(raw.replace(/\D/g, "") || "0", 10);
}

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Product[]) : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function newProductId(): string {
  return (
    Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
  );
}

export function checkoutPath(p: Product): string {
  const params = new URLSearchParams({
    desc: p.nome,
    valor: String(p.valor),
    pix: p.pix ? "1" : "0",
    credito: p.credito ? "1" : "0",
    debito: p.debito ? "1" : "0",
    parcelas: String(p.parcelas),
    modo: p.modo,
  });
  return `/pay/${p.id}?${params.toString()}`;
}
