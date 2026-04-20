import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { hasQuizAntiCheatPenalty } from "@/lib/live/db/points";
import { grantPoints } from "@/lib/live/rewards";

const PENALTY_POINTS = -25;

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    moduleSlug?: string;
    threatType?: string;
    threatReason?: string;
    detectedAt?: number;
  } | null;

  if (!body?.moduleSlug || !body?.threatType || !body?.threatReason) {
    return NextResponse.json({ error: "Niepoprawne dane antycheat." }, { status: 400 });
  }

  const alreadyApplied = await hasQuizAntiCheatPenalty(participantId, body.moduleSlug);
  if (alreadyApplied) {
    return NextResponse.json({ success: true, alreadyApplied: true, pointsDelta: 0 });
  }

  const totalPoints = await grantPoints({
    participantId,
    points: PENALTY_POINTS,
    reason: `Kara antycheat: ${body.moduleSlug}`,
    reasonCode: "quiz_anticheat_penalty",
    metadata: {
      moduleSlug: body.moduleSlug,
      threatType: body.threatType,
      threatReason: body.threatReason,
      detectedAt: body.detectedAt ?? Date.now(),
    },
  });

  return NextResponse.json({
    success: true,
    alreadyApplied: false,
    pointsDelta: PENALTY_POINTS,
    totalPoints,
  });
}
