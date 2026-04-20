import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { getUnlockItem, isDefaultItem } from "@/lib/live/catalog";
import { getParticipantById } from "@/lib/live/db/participants";
import { getParticipantSpentPoints, recordPointTransaction } from "@/lib/live/db/points";
import { getUnlockedItemIds, unlockItem } from "@/lib/live/db/unlocked-items";

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { itemId?: string } | null;
  if (!body?.itemId) {
    return NextResponse.json({ error: "Brakuje itemId." }, { status: 400 });
  }

  const item = getUnlockItem(body.itemId);
  if (!item) {
    return NextResponse.json({ error: "Nie znaleziono przedmiotu." }, { status: 404 });
  }

  if (isDefaultItem(item.id)) {
    return NextResponse.json(
      { error: "Ten przedmiot jest domyślnie odblokowany." },
      { status: 409 },
    );
  }

  const participant = await getParticipantById(participantId);
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const [ownedItemIds, spentPoints] = await Promise.all([
    getUnlockedItemIds(participantId),
    getParticipantSpentPoints(participantId),
  ]);

  if (ownedItemIds.includes(item.id)) {
    return NextResponse.json({ error: "Ten przedmiot został już kupiony." }, { status: 409 });
  }

  const availablePoints = Math.max(0, participant.total_points - spentPoints);
  if (item.pointsCost > availablePoints) {
    return NextResponse.json(
      {
        error: "Za mało punktów dostępnych w sklepie.",
        required: item.pointsCost,
        available: availablePoints,
      },
      { status: 400 },
    );
  }

  await unlockItem(participantId, item.id);
  await recordPointTransaction({
    participant_id: participantId,
    points: 0,
    reason: `Zakup w sklepie: ${item.name}`,
    reason_code: "store_purchase",
    metadata: {
      itemId: item.id,
      category: item.category,
      pointsSpent: item.pointsCost,
      rarity: item.rarity,
    },
    created_by: "participant",
  });

  const updatedSpent = spentPoints + item.pointsCost;
  return NextResponse.json({
    success: true,
    purchasedItemId: item.id,
    spentPoints: updatedSpent,
    availablePoints: Math.max(0, participant.total_points - updatedSpent),
  });
}
