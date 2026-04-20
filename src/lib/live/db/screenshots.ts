import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export type ScreenshotStatus = "pending" | "approved" | "rejected";
export type ScreenshotKind = "exercise" | "anti_cheat_report";

export interface ScreenshotRecord {
  id: string;
  participant_id: string;
  exercise_slug: string;
  github_url: string | null;
  blob_url: string;
  report_kind: ScreenshotKind;
  report_note: string | null;
  report_context: Record<string, unknown>;
  status: ScreenshotStatus;
  points_awarded: number;
  reviewer_note: string | null;
  uploaded_at: Date;
  reviewed_at: Date | null;
}

export async function createScreenshot(data: {
  id: string;
  participantId: string;
  exerciseSlug: string;
  githubUrl?: string;
  blobUrl: string;
  kind?: ScreenshotKind;
  reportNote?: string;
  reportContext?: Record<string, unknown>;
}): Promise<void> {
  await ensureLiveSchema();
  await sql`
    INSERT INTO screenshots (
      id,
      participant_id,
      exercise_slug,
      github_url,
      blob_url,
      report_kind,
      report_note,
      report_context
    )
    VALUES (
      ${data.id},
      ${data.participantId},
      ${data.exerciseSlug},
      ${data.githubUrl ?? null},
      ${data.blobUrl},
      ${data.kind ?? "exercise"},
      ${data.reportNote ?? null},
      ${JSON.stringify(data.reportContext ?? {})}
    )
  `;
}

export async function listPendingScreenshots(workshopId: string): Promise<ScreenshotRecord[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT s.*
    FROM screenshots s
    JOIN participants p ON p.id = s.participant_id
    WHERE p.workshop_id = ${workshopId} AND s.status = 'pending'
    ORDER BY s.uploaded_at ASC
  `) as ScreenshotRecord[];
}

export async function getScreenshotById(screenshotId: string): Promise<ScreenshotRecord | null> {
  await ensureLiveSchema();
  const rows =
    (await sql`SELECT * FROM screenshots WHERE id = ${screenshotId}`) as ScreenshotRecord[];
  return (rows[0] as ScreenshotRecord) ?? null;
}

export async function reviewScreenshot(data: {
  screenshotId: string;
  status: Extract<ScreenshotStatus, "approved" | "rejected">;
  reviewerNote?: string;
  pointsAwarded?: number;
}): Promise<void> {
  await ensureLiveSchema();
  await sql`
    UPDATE screenshots
    SET status = ${data.status},
        reviewer_note = ${data.reviewerNote ?? null},
        points_awarded = ${data.pointsAwarded ?? 0},
        reviewed_at = NOW()
    WHERE id = ${data.screenshotId}
  `;
}

export async function getParticipantScreenshots(
  participantId: string,
): Promise<ScreenshotRecord[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT * FROM screenshots
    WHERE participant_id = ${participantId}
    ORDER BY uploaded_at DESC
  `) as ScreenshotRecord[];
}
