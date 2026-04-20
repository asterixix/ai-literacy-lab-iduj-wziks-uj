import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export interface Workshop {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  archived_at: Date | null;
}

async function runWithSchemaRetry<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Error && (error as { code?: string }).code === "42P01") {
      await ensureLiveSchema();
      return action();
    }
    throw error;
  }
}

export async function getActiveWorkshop(): Promise<Workshop | null> {
  await ensureLiveSchema();
  const rows = await runWithSchemaRetry(
    async () => (await sql`SELECT * FROM workshops WHERE is_active = TRUE LIMIT 1`) as Workshop[],
  );
  return (rows[0] as Workshop) ?? null;
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  await ensureLiveSchema();
  const rows = await runWithSchemaRetry(
    async () => (await sql`SELECT * FROM workshops WHERE id = ${id}`) as Workshop[],
  );
  return (rows[0] as Workshop) ?? null;
}

export async function getAllWorkshops(): Promise<Workshop[]> {
  await ensureLiveSchema();
  return runWithSchemaRetry(
    async () => (await sql`SELECT * FROM workshops ORDER BY created_at DESC`) as Workshop[],
  );
}

export async function createWorkshop(
  id: string,
  name: string,
  description?: string,
): Promise<Workshop> {
  await ensureLiveSchema();
  await runWithSchemaRetry(async () => {
    await sql`UPDATE workshops SET is_active = FALSE, archived_at = NOW() WHERE is_active = TRUE`;
  });
  const rows = await runWithSchemaRetry(
    async () =>
      (await sql`
    INSERT INTO workshops (id, name, description, is_active)
    VALUES (${id}, ${name}, ${description ?? null}, TRUE)
    RETURNING *
  `) as Workshop[],
  );
  return rows[0] as Workshop;
}

export async function archiveWorkshop(id: string): Promise<void> {
  await ensureLiveSchema();
  await runWithSchemaRetry(async () => {
    await sql`UPDATE workshops SET is_active = FALSE, archived_at = NOW() WHERE id = ${id}`;
  });
}

export async function ensureWorkshopExists(): Promise<Workshop> {
  await ensureLiveSchema();
  const active = await getActiveWorkshop();
  if (active) return active;

  const envId = process.env.WORKSHOP_ID ?? `wsh_${Date.now()}`;
  const envName = process.env.WORKSHOP_NAME ?? "Warsztaty AI Literacy Lab";
  return createWorkshop(envId, envName);
}
