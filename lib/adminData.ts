// Dados da área de admin.
//
// Enquanto o banco (Neon) não está ligado, as contas aqui são de
// DEMONSTRAÇÃO e ficam no localStorage. As ações (travar, travar saldo,
// banir) funcionam sobre esses dados. Quando o back-end entrar, este
// arquivo passa a ler/gravar as contas reais via API.

export type AccountStatus = "ativo" | "travado" | "banido";

export type Account = {
  id: string;
  nome: string;
  email: string;
  documento: string;
  telefone: string;
  criadoEm: string;
  ultimoAcesso: string;
  status: AccountStatus;
  /** Saldo bloqueado para saque, mesmo com a conta ativa. */
  saldoTravado: boolean;
  saldoDisponivel: number; // centavos
  saldoALiberar: number; // centavos
  volumeTotal: number; // centavos processados
  vendas: number;
  chargebacks: number;
  chavePix: string;
};

const STORAGE_KEY = "zenpay_admin_accounts";

const SEED: Account[] = [
  {
    id: "u_8f2a",
    nome: "Rafael Araújo",
    email: "rafael.araujo@mail.com",
    documento: "123.456.789-09",
    telefone: "(67) 99123-4567",
    criadoEm: "12/05/2026",
    ultimoAcesso: "há 2 horas",
    status: "ativo",
    saldoTravado: false,
    saldoDisponivel: 1284500,
    saldoALiberar: 342000,
    volumeTotal: 9820000,
    vendas: 214,
    chargebacks: 1,
    chavePix: "rafael.araujo@mail.com",
  },
  {
    id: "u_3d71",
    nome: "Mariana Silva",
    email: "mariana.silva@mail.com",
    documento: "987.654.321-00",
    telefone: "(11) 98888-1200",
    criadoEm: "03/06/2026",
    ultimoAcesso: "há 10 min",
    status: "ativo",
    saldoTravado: true,
    saldoDisponivel: 458000,
    saldoALiberar: 120000,
    volumeTotal: 3120000,
    vendas: 88,
    chargebacks: 0,
    chavePix: "5511988881200",
  },
  {
    id: "u_b04c",
    nome: "Loja Zenith Ltda",
    email: "financeiro@zenith.com.br",
    documento: "42.518.900/0001-77",
    telefone: "(41) 3033-8890",
    criadoEm: "21/03/2026",
    ultimoAcesso: "há 1 dia",
    status: "ativo",
    saldoTravado: false,
    saldoDisponivel: 7650000,
    saldoALiberar: 1890000,
    volumeTotal: 41200000,
    vendas: 903,
    chargebacks: 4,
    chavePix: "42518900000177",
  },
  {
    id: "u_9e15",
    nome: "Pedro Henrique",
    email: "pedro.hs@mail.com",
    documento: "321.654.987-11",
    telefone: "(85) 99777-3322",
    criadoEm: "28/06/2026",
    ultimoAcesso: "há 3 dias",
    status: "travado",
    saldoTravado: true,
    saldoDisponivel: 92000,
    saldoALiberar: 0,
    volumeTotal: 410000,
    vendas: 12,
    chargebacks: 3,
    chavePix: "pedro.hs@mail.com",
  },
  {
    id: "u_5a88",
    nome: "João Vitor",
    email: "joao.vitor@mail.com",
    documento: "555.222.888-33",
    telefone: "(21) 96543-2100",
    criadoEm: "09/07/2026",
    ultimoAcesso: "há 6 dias",
    status: "banido",
    saldoTravado: true,
    saldoDisponivel: 0,
    saldoALiberar: 0,
    volumeTotal: 156000,
    vendas: 5,
    chargebacks: 5,
    chavePix: "—",
  },
  {
    id: "u_1c30",
    nome: "Ana Beatriz",
    email: "ana.bia@mail.com",
    documento: "444.111.222-55",
    telefone: "(31) 98123-9000",
    criadoEm: "18/07/2026",
    ultimoAcesso: "há 25 min",
    status: "ativo",
    saldoTravado: false,
    saldoDisponivel: 234500,
    saldoALiberar: 88000,
    volumeTotal: 1180000,
    vendas: 41,
    chargebacks: 0,
    chavePix: "ana.bia@mail.com",
  },
];

export function loadAccounts(): Account[] {
  if (typeof window === "undefined") return SEED;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Account[];
  } catch {
    // storage corrompido — recai no seed
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return SEED;
}

export function saveAccounts(accounts: Account[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function resetAccounts(): Account[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return SEED;
}
