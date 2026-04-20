import { sql } from "./client";

export interface EdenApiKeyRecord {
  participant_id: string;
  encrypted_key: string;
  iv: string;
  auth_tag: string;
  updated_at: Date;
}

export async function upsertEdenApiKey(data: {
  participantId: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
}): Promise<void> {
  await sql`
    INSERT INTO eden_api_keys (participant_id, encrypted_key, iv, auth_tag)
    VALUES (${data.participantId}, ${data.encryptedKey}, ${data.iv}, ${data.authTag})
    ON CONFLICT (participant_id) DO UPDATE SET
      encrypted_key = EXCLUDED.encrypted_key,
      iv = EXCLUDED.iv,
      auth_tag = EXCLUDED.auth_tag,
      updated_at = NOW()
  `;
}

export async function getEdenApiKey(participantId: string): Promise<EdenApiKeyRecord | null> {
  const rows = (await sql`
    SELECT * FROM eden_api_keys WHERE participant_id = ${participantId}
  `) as EdenApiKeyRecord[];
  return rows[0] ?? null;
}

export async function deleteEdenApiKey(participantId: string): Promise<void> {
  await sql`DELETE FROM eden_api_keys WHERE participant_id = ${participantId}`;
}
