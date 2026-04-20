import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { logAdminAction } from "@/lib/live/db/admin-audit";
import { createWorkshop, getAllWorkshops } from "@/lib/live/db/workshops";

export async function GET() {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workshops = await getAllWorkshops();
  return NextResponse.json({ workshops });
}

export async function POST(request: Request) {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    description?: string;
  } | null;

  const workshopId = `wsh-${new Date().toISOString().slice(0, 10)}-${nanoid(6)}`;
  const workshop = await createWorkshop(
    workshopId,
    body?.name?.trim() || "Nowy warsztat",
    body?.description?.trim(),
  );
  await logAdminAction({
    action: "workshop_created",
    metadata: { workshopId: workshop.id, name: workshop.name },
  });

  return NextResponse.json({ workshop });
}
