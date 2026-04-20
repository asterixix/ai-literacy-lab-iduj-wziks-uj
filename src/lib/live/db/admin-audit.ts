import { sql } from "./client";

export interface AdminAuditEvent {
  id: number;
  action: string;
  target_participant_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export async function logAdminAction(data: {
  action: string;
  targetParticipantId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await sql`
    INSERT INTO admin_audit_log (action, target_participant_id, metadata)
    VALUES (
      ${data.action},
      ${data.targetParticipantId ?? null},
      ${JSON.stringify(data.metadata ?? {})}
    )
  `;
}

export async function listAdminAuditEvents(limit = 200): Promise<AdminAuditEvent[]> {
  return (await sql`
    SELECT * FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as AdminAuditEvent[];
}
