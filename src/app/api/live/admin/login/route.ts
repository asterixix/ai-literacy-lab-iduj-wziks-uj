import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/live/auth";
import { logAdminAction } from "@/lib/live/db/admin-audit";
import { createAdminSession } from "@/lib/live/db/sessions";
import { generateSessionToken } from "@/lib/live/security";

const ADMIN_MAX_AGE = 60 * 60 * 4;

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || body.password !== adminPassword) {
    return NextResponse.json({ error: "Nieprawidłowe hasło admina." }, { status: 401 });
  }

  const token = generateSessionToken();
  await createAdminSession(token);
  await logAdminAction({ action: "admin_login" });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });

  return NextResponse.json({ success: true });
}
