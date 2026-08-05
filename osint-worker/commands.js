// Definições dos slash commands (usadas pelo register.js).
// STRING = 3, ATTACHMENT = 11 (não usamos aqui).
const S = 3;
const dominio = { type: S, name: "dominio", description: "Ex.: exemplo.com", required: true };
const ipOpt = { type: S, name: "ip", description: "Ex.: 8.8.8.8", required: true };
const urlOpt = { type: S, name: "url", description: "Ex.: exemplo.com", required: true };

export const COMMANDS = [
  { name: "osint", description: "Abre o painel OSINT com todas as ferramentas." },
  { name: "ajuda", description: "Lista todos os comandos disponíveis." },

  { name: "whois", description: "Dados de registro de um domínio (RDAP).", options: [dominio] },
  { name: "dns", description: "Registros DNS (A, AAAA, MX, NS, TXT, CNAME, SOA).", options: [dominio] },
  { name: "subdomains", description: "Descobre subdomínios via Certificate Transparency.", options: [dominio] },

  { name: "ip", description: "Geolocalização e provedor (ASN) de um IP.", options: [ipOpt] },
  { name: "ipwhois", description: "Dono do bloco de IP e contato de abuse (RDAP).", options: [ipOpt] },
  {
    name: "reversedns", description: "PTR de um IP, ou IPs de um domínio.",
    options: [{ type: S, name: "alvo", description: "Um IP ou um domínio", required: true }],
  },
  { name: "shodan", description: "Portas e serviços expostos de um IP (requer chave).", options: [ipOpt] },

  { name: "headers", description: "Cabeçalhos HTTP e tecnologias de um site.", options: [urlOpt] },
  { name: "webscan", description: "Extrai e-mails, links e metadados de uma página.", options: [urlOpt] },

  {
    name: "username", description: "Procura um @username em vários sites públicos.",
    options: [{ type: S, name: "username", description: "Nome de usuário (sem @)", required: true }],
  },
  {
    name: "email", description: "Valida formato e checa MX do domínio do e-mail.",
    options: [{ type: S, name: "email", description: "Ex.: pessoa@exemplo.com", required: true }],
  },
  {
    name: "breach", description: "Verifica se um e-mail apareceu em vazamentos (HIBP, requer chave).",
    options: [{ type: S, name: "email", description: "Ex.: pessoa@exemplo.com", required: true }],
  },

  {
    name: "hash", description: "Identifica o tipo de um hash e tenta quebrá-lo.",
    options: [
      { type: S, name: "valor", description: "O hash em hexadecimal", required: true },
      { type: S, name: "palavra", description: "(opcional) testa se esta palavra gera o hash", required: false },
    ],
  },
];
