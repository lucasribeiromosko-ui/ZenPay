import { NextResponse } from "next/server";
import { currentSellerEmail } from "@/lib/sessionServer";
import { signSeller } from "@/lib/transactions";

export const dynamic = "force-dynamic";

// Devolve um token assinado do vendedor logado, para embutir nos links de
// checkout. Assim o pagamento é atribuído à conta certa (sem expor o e-mail
// em texto e sem poder ser adulterado).
export async function GET() {
  const email = currentSellerEmail();
  if (!email) return NextResponse.json({ ok: false, token: null });
  return NextResponse.json({ ok: true, token: signSeller(email) });
}
