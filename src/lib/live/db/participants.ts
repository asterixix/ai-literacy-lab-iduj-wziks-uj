import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export interface Participant {
  id: string;
  workshop_id: string;
  nickname: string;
  avatar_seed: string;
  active_avatar: string;
  favorite_animal: string;
  password_hash: string;
  active_theme: string;
  active_font: string;
  active_title: string;
  active_frame: string;
  total_points: number;
  created_at: Date;
  last_seen_at: Date;
}

export type ParticipantPublic = Omit<Participant, "password_hash">;

export async function createParticipant(data: {
  id: string;
  workshop_id: string;
  nickname: string;
  avatar_seed: string;
  favorite_animal: string;
  password_hash: string;
}): Promise<Participant> {
  await ensureLiveSchema();
  const rows = (await sql`
    INSERT INTO participants (
      id, workshop_id, nickname, avatar_seed, favorite_animal, password_hash,
      active_theme, active_font, active_title, active_frame, active_avatar
    )
    VALUES (
      ${data.id}, ${data.workshop_id}, ${data.nickname}, ${data.avatar_seed}, ${data.favorite_animal}, ${data.password_hash},
      'theme-default', 'font-default', 'title-nowicjusz', 'frame-none', 'avatar-default'
    )
    RETURNING *
  `) as Participant[];
  return rows[0] as Participant;
}

export async function getParticipantById(id: string): Promise<Participant | null> {
  await ensureLiveSchema();
  const rows = (await sql`SELECT * FROM participants WHERE id = ${id}`) as Participant[];
  return (rows[0] as Participant) ?? null;
}

export async function getParticipantsByWorkshop(workshopId: string): Promise<ParticipantPublic[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT id, workshop_id, nickname, avatar_seed, favorite_animal,
          active_theme, active_font, active_title, active_frame, active_avatar,
           total_points, created_at, last_seen_at
    FROM participants
    WHERE workshop_id = ${workshopId}
    ORDER BY total_points DESC
  `) as ParticipantPublic[];
}

export async function updateLastSeen(id: string): Promise<void> {
  await ensureLiveSchema();
  await sql`UPDATE participants SET last_seen_at = NOW() WHERE id = ${id}`;
}

export async function updateParticipantProfile(
  id: string,
  data: {
    active_theme?: string;
    active_font?: string;
    active_title?: string;
    active_frame?: string;
    active_avatar?: string;
    nickname?: string;
    avatar_seed?: string;
  },
): Promise<void> {
  await ensureLiveSchema();
  const {
    active_theme,
    active_font,
    active_title,
    active_frame,
    active_avatar,
    nickname,
    avatar_seed,
  } = data;
  await sql`
    UPDATE participants SET
      active_theme = COALESCE(${active_theme ?? null}, active_theme),
      active_font  = COALESCE(${active_font ?? null}, active_font),
      active_title = COALESCE(${active_title ?? null}, active_title),
      active_frame = COALESCE(${active_frame ?? null}, active_frame),
      active_avatar = COALESCE(${active_avatar ?? null}, active_avatar),
      nickname     = COALESCE(${nickname ?? null}, nickname),
      avatar_seed  = COALESCE(${avatar_seed ?? null}, avatar_seed)
    WHERE id = ${id}
  `;
}

export async function addPoints(id: string, points: number): Promise<number> {
  await ensureLiveSchema();
  const rows = (await sql`
    UPDATE participants SET total_points = total_points + ${points}
    WHERE id = ${id}
    RETURNING total_points
  `) as { total_points: number }[];
  return (rows[0] as { total_points: number }).total_points;
}

export async function resetParticipant(id: string): Promise<void> {
  await ensureLiveSchema();
  await sql`
    UPDATE participants SET total_points = 0, active_theme = 'theme-default',
      active_font = 'font-default', active_title = 'title-nowicjusz', active_frame = 'frame-none', active_avatar = 'avatar-default'
    WHERE id = ${id}
  `;
  await sql`DELETE FROM point_transactions WHERE participant_id = ${id}`;
  await sql`DELETE FROM quiz_attempts WHERE participant_id = ${id}`;
  await sql`DELETE FROM exercise_events WHERE participant_id = ${id}`;
  await sql`DELETE FROM unlocked_items WHERE participant_id = ${id}`;
}
