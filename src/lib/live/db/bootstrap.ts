import { sql } from "./client";
import { readLiveSchemaStatements } from "./schema-utils";

let bootstrapPromise: Promise<void> | null = null;

async function hasWorkshopsTable(): Promise<boolean> {
  const rows = (await sql`
    SELECT to_regclass('public.workshops') AS regclass
  `) as Array<{ regclass: string | null }>;
  return Boolean(rows[0]?.regclass);
}

async function applySchemaWithPg(statements: string[]): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    for (const statement of statements) {
      await pool.query(statement);
    }
  } finally {
    await pool.end();
  }
}

async function ensureParticipantColumns(): Promise<void> {
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS active_avatar TEXT NOT NULL DEFAULT 'avatar-default'
  `;
}

async function ensureScreenshotColumns(): Promise<void> {
  await sql`
    ALTER TABLE IF EXISTS screenshots
    ADD COLUMN IF NOT EXISTS github_url TEXT
  `;
  await sql`
    ALTER TABLE screenshots
    ADD COLUMN IF NOT EXISTS report_kind TEXT NOT NULL DEFAULT 'exercise'
  `;
  await sql`
    ALTER TABLE screenshots
    ADD COLUMN IF NOT EXISTS report_note TEXT
  `;
  await sql`
    ALTER TABLE screenshots
    ADD COLUMN IF NOT EXISTS report_context JSONB NOT NULL DEFAULT '{}'
  `;
}

export async function ensureLiveSchema(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      if (await hasWorkshopsTable()) {
        await ensureParticipantColumns();
        await ensureScreenshotColumns();
        return;
      }

      const statements = await readLiveSchemaStatements();
      await applySchemaWithPg(statements);
      await ensureParticipantColumns();
      await ensureScreenshotColumns();

      if (!(await hasWorkshopsTable())) {
        throw new Error("Live schema bootstrap did not create the workshops table.");
      }
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}
