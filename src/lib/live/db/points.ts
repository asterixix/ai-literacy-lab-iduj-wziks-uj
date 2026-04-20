import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export interface PointTransaction {
  id: number;
  participant_id: string;
  points: number;
  reason: string;
  reason_code: string;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: Date;
}

export async function recordPointTransaction(data: {
  participant_id: string;
  points: number;
  reason: string;
  reason_code: string;
  metadata?: Record<string, unknown>;
  created_by?: string;
}): Promise<void> {
  await ensureLiveSchema();
  await sql`
    INSERT INTO point_transactions (participant_id, points, reason, reason_code, metadata, created_by)
    VALUES (
      ${data.participant_id},
      ${data.points},
      ${data.reason},
      ${data.reason_code},
      ${JSON.stringify(data.metadata ?? {})},
      ${data.created_by ?? "system"}
    )
  `;
}

export async function getParticipantTransactions(
  participantId: string,
): Promise<PointTransaction[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT * FROM point_transactions
    WHERE participant_id = ${participantId}
    ORDER BY created_at DESC
    LIMIT 100
  `) as PointTransaction[];
}

export async function getParticipantSpentPoints(participantId: string): Promise<number> {
  await ensureLiveSchema();
  const rows = (await sql`
    SELECT COALESCE(SUM((metadata->>'pointsSpent')::INTEGER), 0) AS spent
    FROM point_transactions
    WHERE participant_id = ${participantId}
      AND reason_code = 'store_purchase'
  `) as { spent: number | string }[];
  const value = rows[0]?.spent ?? 0;
  const spent = typeof value === "number" ? value : Number(value);
  return Number.isFinite(spent) ? spent : 0;
}

export async function hasQuizAntiCheatPenalty(
  participantId: string,
  moduleSlug: string,
): Promise<boolean> {
  await ensureLiveSchema();
  const rows = (await sql`
    SELECT 1
    FROM point_transactions
    WHERE participant_id = ${participantId}
      AND reason_code = 'quiz_anticheat_penalty'
      AND metadata->>'moduleSlug' = ${moduleSlug}
    LIMIT 1
  `) as Array<{ "?column?": number }>;
  return rows.length > 0;
}
