import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authReady } from "@/lib/db";
import { readSession, getUser, SESSION_COOKIE } from "@/lib/authUsers";
import { isAdminEmail } from "@/lib/adminEmails";

export const dynamic = "force-dynamic";

export async function GET() {
  // Sem banco → o front usa o fluxo antigo (localStorage).
  if (!authReady()) {
    return NextResponse.json({ configured: false, user: null });
  }

  const token = cookies().get(SESSION_COOKIE)?.value;
  const email = readSession(token);
  if (!email) {
    return NextResponse.json({ configured: true, user: null });
  }

  try {
    const user = await getUser(email);
    if (!user) {
      return NextResponse.json({ configured: true, user: null });
    }
    return NextResponse.json({
      configured: true,
      user: { email: user.email, nome: user.nome, isAdmin: isAdminEmail(user.email) },
    });
  } catch {
    return NextResponse.json({ configured: true, user: null });
  }
}
