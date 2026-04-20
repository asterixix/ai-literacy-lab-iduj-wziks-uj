import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { getWorkshopLeaderboard } from "@/lib/live/db/leaderboard";
import { getActiveWorkshop } from "@/lib/live/db/workshops";

export async function GET() {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workshop = await getActiveWorkshop();
  if (!workshop) {
    return NextResponse.json({ rows: [] });
  }

  const rows = await getWorkshopLeaderboard(workshop.id);
  return NextResponse.json({ workshop, rows });
}
