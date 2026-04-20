import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { logAdminAction } from "@/lib/live/db/admin-audit";
import { grantPoints } from "@/lib/live/rewards";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    points?: number;
    reason?: string;
  } | null;

  if (!body || typeof body.points !== "number" || !body.reason?.trim()) {
    return NextResponse.json({ error: "Niepoprawne dane." }, { status: 400 });
  }

  const totalPoints = await grantPoints({
    participantId: id,
    points: Math.round(body.points),
    reason: body.reason.trim(),
    reasonCode: "admin_bonus",
    createdBy: "admin",
  });

  await logAdminAction({
    action: "participant_points_granted",
    targetParticipantId: id,
    metadata: { points: body.points, reason: body.reason },
  });

  return NextResponse.json({ success: true, totalPoints });
}
