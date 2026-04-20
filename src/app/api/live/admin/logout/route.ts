import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/live/auth";
import { logAdminAction } from "@/lib/live/db/admin-audit";
import { deleteAdminSession } from "@/lib/live/db/sessions";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await deleteAdminSession(token);
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  await logAdminAction({ action: "admin_logout" });
  return NextResponse.json({ success: true });
}
