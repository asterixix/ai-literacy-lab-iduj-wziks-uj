import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export async function createParticipantSession(
  participantId: string,
  token: string,
): Promise<void> {
  await ensureLiveSchema();
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await sql`
    INSERT INTO participant_sessions (token, participant_id, expires_at)
    VALUES (${token}, ${participantId}, ${expires.toISOString()})
  `;
}

export async function getParticipantIdBySession(token: string): Promise<string | null> {
  await ensureLiveSchema();
  const rows = (await sql`
    SELECT participant_id FROM participant_sessions
    WHERE token = ${token} AND expires_at > NOW()
  `) as { participant_id: string }[];
  return (rows[0] as { participant_id: string } | undefined)?.participant_id ?? null;
}

export async function deleteParticipantSession(token: string): Promise<void> {
  await ensureLiveSchema();
  await sql`DELETE FROM participant_sessions WHERE token = ${token}`;
}

export async function createAdminSession(token: string): Promise<void> {
  await ensureLiveSchema();
  const expires = new Date(Date.now() + 4 * 60 * 60 * 1000);
  await sql`
    INSERT INTO admin_sessions (token, expires_at)
    VALUES (${token}, ${expires.toISOString()})
  `;
}

export async function isAdminSessionValid(token: string): Promise<boolean> {
  await ensureLiveSchema();
  const rows = (await sql`
    SELECT 1 FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()
  `) as unknown[];
  return rows.length > 0;
}

export async function deleteAdminSession(token: string): Promise<void> {
  await ensureLiveSchema();
  await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
}

export async function pruneExpiredSessions(): Promise<void> {
  await ensureLiveSchema();
  await sql`DELETE FROM participant_sessions WHERE expires_at < NOW()`;
  await sql`DELETE FROM admin_sessions WHERE expires_at < NOW()`;
}
