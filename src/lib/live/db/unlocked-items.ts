import { getDefaultItemIds } from "@/lib/live/catalog";
import { sql } from "./client";

export async function unlockItem(participantId: string, itemId: string): Promise<void> {
  await sql`
    INSERT INTO unlocked_items (participant_id, item_id)
    VALUES (${participantId}, ${itemId})
    ON CONFLICT (participant_id, item_id) DO NOTHING
  `;
}

export async function getUnlockedItemIds(participantId: string): Promise<string[]> {
  const rows = await sql`
    SELECT item_id FROM unlocked_items
    WHERE participant_id = ${participantId}
  `;
  const owned = rows.map((row) => String((row as { item_id: string }).item_id));
  const withDefaults = new Set([...getDefaultItemIds(), ...owned]);
  return Array.from(withDefaults);
}
