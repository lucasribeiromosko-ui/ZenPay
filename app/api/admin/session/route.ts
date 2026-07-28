import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, tokenValid } from "@/lib/adminAuth";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return NextResponse.json({ ok: tokenValid(token) });
}
