// Lista de e-mails com acesso ao painel de admin.
// Arquivo sem dependências de servidor, para poder ser usado também no
// cliente (ex.: decidir se mostra o link de admin na sidebar).

export const ADMIN_EMAILS = [
  "lucasribeiromosko@gmail.com",
  "zenpay.suport@gmail.com",
  "hypex100kk@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}
