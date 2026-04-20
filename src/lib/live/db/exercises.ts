import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export interface ExerciseEvent {
  id: number;
  participant_id: string;
  exercise_slug: string;
  event_type: string;
  metadata: Record<string, unknown>;
  points_earned: number;
  created_at: Date;
}

export async function recordExerciseEvent(data: {
  participant_id: string;
  exercise_slug: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  points_earned: number;
}): Promise<void> {
  await ensureLiveSchema();
  await sql`
    INSERT INTO exercise_events (participant_id, exercise_slug, event_type, metadata, points_earned)
    VALUES (
      ${data.participant_id}, ${data.exercise_slug}, ${data.event_type},
      ${JSON.stringify(data.metadata ?? {})}, ${data.points_earned}
    )
  `;
}

export async function getParticipantExerciseEvents(
  participantId: string,
): Promise<ExerciseEvent[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT * FROM exercise_events WHERE participant_id = ${participantId} ORDER BY created_at DESC
  `) as ExerciseEvent[];
}

export async function getExerciseSummary(
  participantId: string,
): Promise<{ exercise_slug: string; total_points: number; event_count: number }[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT exercise_slug,
           SUM(points_earned)::int AS total_points,
           COUNT(*)::int AS event_count
    FROM exercise_events
    WHERE participant_id = ${participantId}
    GROUP BY exercise_slug
  `) as { exercise_slug: string; total_points: number; event_count: number }[];
}

export async function hasExerciseEvent(
  participantId: string,
  exerciseSlug: string,
  eventType: string,
): Promise<boolean> {
  await ensureLiveSchema();
  const rows = (await sql`
    SELECT 1 AS found FROM exercise_events
    WHERE participant_id = ${participantId}
      AND exercise_slug = ${exerciseSlug}
      AND event_type = ${eventType}
    LIMIT 1
  `) as Array<{ found: number }>;
  return rows.length > 0;
}
