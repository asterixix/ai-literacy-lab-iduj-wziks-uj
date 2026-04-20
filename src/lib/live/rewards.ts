import { getDefaultItemIds } from "@/lib/live/catalog";
import { addPoints } from "@/lib/live/db/participants";
import { recordPointTransaction } from "@/lib/live/db/points";
import { unlockItem } from "@/lib/live/db/unlocked-items";

export async function ensureDefaultUnlocks(participantId: string): Promise<void> {
  const defaultItems = getDefaultItemIds();
  await Promise.all(defaultItems.map((itemId) => unlockItem(participantId, itemId)));
}

export async function grantPoints(data: {
  participantId: string;
  points: number;
  reason: string;
  reasonCode: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}): Promise<number> {
  const updatedPoints = await addPoints(data.participantId, data.points);
  await recordPointTransaction({
    participant_id: data.participantId,
    points: data.points,
    reason: data.reason,
    reason_code: data.reasonCode,
    metadata: data.metadata,
    created_by: data.createdBy ?? "system",
  });
  await ensureDefaultUnlocks(data.participantId);
  return updatedPoints;
}
