import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { getParticipantsByWorkshop } from "@/lib/live/db/participants";
import { getActiveWorkshop } from "@/lib/live/db/workshops";

export async function GET() {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workshop = await getActiveWorkshop();
  if (!workshop) {
    return NextResponse.json({ error: "No active workshop" }, { status: 404 });
  }

  const participants = await getParticipantsByWorkshop(workshop.id);

  const csvRows = [
    "id,nickname,total_points,active_title,active_theme,active_font,created_at,last_seen_at",
    ...participants.map((p) =>
      [
        p.id,
        JSON.stringify(p.nickname),
        p.total_points,
        p.active_title,
        p.active_theme,
        p.active_font,
        new Date(p.created_at).toISOString(),
        new Date(p.last_seen_at).toISOString(),
      ].join(","),
    ),
  ];

  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=live-${workshop.id}-participants.csv`,
    },
  });
}
