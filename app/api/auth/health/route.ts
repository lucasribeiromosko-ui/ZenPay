import { NextResponse } from "next/server";
import { dbConfigured, getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/authUsers";

export const dynamic = "force-dynamic";

// Diagnóstico do banco. Abra /api/auth/health no navegador para ver se o
// Neon está conectado e a tabela de contas existe.

export async function GET() {
  if (!dbConfigured()) {
    return NextResponse.json({ configured: false, db: "sem DATABASE_URL" });
  }
  try {
    await ensureSchema();
    const sql = getSql();
    const rows = (await sql`SELECT count(*)::int AS total FROM users`) as { total: number }[];
    return NextResponse.json({ configured: true, db: "ok", contas: rows[0]?.total ?? 0 });
  } catch (e) {
    return NextResponse.json(
      { configured: true, db: "erro", detalhe: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
