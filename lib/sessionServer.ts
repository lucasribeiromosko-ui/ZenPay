import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "./authUsers";
import { authReady } from "./db";

// Resolve o e-mail do vendedor logado a partir do cookie de sessão.
export function currentSellerEmail(): string | null {
  if (!authReady()) return null;
  return readSession(cookies().get(SESSION_COOKIE)?.value);
}
