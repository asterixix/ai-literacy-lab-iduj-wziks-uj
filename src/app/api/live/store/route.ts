import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { UNLOCK_ITEMS } from "@/lib/live/catalog";
import { getParticipantById } from "@/lib/live/db/participants";
import { getParticipantSpentPoints } from "@/lib/live/db/points";
import { getUnlockedItemIds } from "@/lib/live/db/unlocked-items";

export async function GET() {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participant = await getParticipantById(participantId);
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const [ownedItemIds, spentPoints] = await Promise.all([
    getUnlockedItemIds(participantId),
    getParticipantSpentPoints(participantId),
  ]);

  const availablePoints = Math.max(0, participant.total_points - spentPoints);

  return NextResponse.json({
    items: UNLOCK_ITEMS,
    ownedItemIds,
    totalPoints: participant.total_points,
    spentPoints,
    availablePoints,
  });
}
