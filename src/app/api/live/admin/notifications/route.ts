import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { listAdminAuditEvents } from "@/lib/live/db/admin-audit";

export async function GET() {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await listAdminAuditEvents(30);
  return NextResponse.json({ events });
}
