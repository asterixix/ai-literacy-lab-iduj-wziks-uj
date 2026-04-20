import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { UNLOCK_ITEMS } from "@/lib/live/catalog";
import { getWorkshopLeaderboard } from "@/lib/live/db/leaderboard";
import { getParticipantById } from "@/lib/live/db/participants";

export async function GET() {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participant = await getParticipantById(participantId);
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const rows = await getWorkshopLeaderboard(participant.workshop_id);
  return NextResponse.json({ rows, totalStoreItems: UNLOCK_ITEMS.length });
}
