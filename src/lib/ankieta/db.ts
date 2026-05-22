import { neon } from "@neondatabase/serverless";

import type { FlatSurveyAnswers } from "@/lib/ankieta/csv";
import type { SurveyAnswers } from "@/lib/ankieta/validation";

type StoredSurveyRow = {
  id: string;
  created_at: string;
  flat_data: FlatSurveyAnswers | string;
  survey_data: SurveyAnswers | string;
};

type SurveySettingsRow = {
  id: number;
  is_open: boolean;
  blocked_reason: string | null;
  updated_at: string;
};

let initialized = false;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Brakuje zmiennej środowiskowej DATABASE_URL.");
  }

  return databaseUrl;
}

function getSqlClient() {
  return neon(getDatabaseUrl());
}

export async function ensureSurveySchema() {
  if (initialized) {
    return;
  }

  const sql = getSqlClient();
  await sql`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      survey_data JSONB NOT NULL,
      flat_data JSONB NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS survey_settings (
      id INTEGER PRIMARY KEY,
      is_open BOOLEAN NOT NULL DEFAULT TRUE,
      blocked_reason TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (id = 1)
    );
  `;

  await sql`
    INSERT INTO survey_settings (id, is_open, blocked_reason)
    VALUES (1, TRUE, NULL)
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`
    ALTER TABLE survey_settings
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
  `;

  await sql`
    ALTER TABLE survey_settings
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `;

  await sql`
    UPDATE survey_settings
    SET updated_at = NOW()
    WHERE updated_at IS NULL;
  `;

  await sql`
    CREATE OR REPLACE FUNCTION set_survey_settings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`
    DROP TRIGGER IF EXISTS survey_settings_updated_at_trigger ON survey_settings;
  `;

  await sql`
    CREATE TRIGGER survey_settings_updated_at_trigger
    BEFORE UPDATE ON survey_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_survey_settings_updated_at();
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS survey_admin_actions (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      action_type TEXT NOT NULL,
      payload JSONB
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS survey_admin_actions_created_at_idx
    ON survey_admin_actions (created_at DESC);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS survey_responses_created_at_idx
    ON survey_responses (created_at DESC);
  `;

  initialized = true;
}

export async function insertSurveyResponse(payload: {
  id: string;
  surveyData: SurveyAnswers;
  flatData: FlatSurveyAnswers;
}) {
  await ensureSurveySchema();
  const sql = getSqlClient();
  await sql`
    INSERT INTO survey_responses (id, survey_data, flat_data)
    VALUES (${payload.id}, ${JSON.stringify(payload.surveyData)}::jsonb, ${JSON.stringify(payload.flatData)}::jsonb);
  `;
}

export async function getSurveyResponses(limit = 5000): Promise<StoredSurveyRow[]> {
  await ensureSurveySchema();
  const sql = getSqlClient();

  const rows = await sql`
    SELECT id, created_at, flat_data, survey_data
    FROM survey_responses
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;

  return rows as StoredSurveyRow[];
}

export async function deleteSurveyResponse(id: string) {
  await ensureSurveySchema();
  const sql = getSqlClient();
  await sql`
    DELETE FROM survey_responses
    WHERE id = ${id};
  `;

  await sql`
    INSERT INTO survey_admin_actions (action_type, payload)
    VALUES (
      'survey_response_deleted',
      ${JSON.stringify({ id })}::jsonb
    );
  `;
}

export async function getSurveySettings() {
  await ensureSurveySchema();
  const sql = getSqlClient();
  const rows = await sql`
    SELECT id, is_open, blocked_reason, updated_at
    FROM survey_settings
    WHERE id = 1
    LIMIT 1;
  `;

  if (!rows[0]) {
    return {
      isOpen: true,
      blockedReason: null,
      updatedAt: new Date().toISOString(),
    };
  }

  const row = rows[0] as SurveySettingsRow;
  return {
    isOpen: row.is_open,
    blockedReason: row.blocked_reason,
    updatedAt: row.updated_at,
  };
}

export async function updateSurveySettings(payload: { isOpen: boolean; blockedReason: string | null }) {
  await ensureSurveySchema();
  const sql = getSqlClient();
  await sql`
    UPDATE survey_settings
    SET
      is_open = ${payload.isOpen},
      blocked_reason = ${payload.blockedReason}
    WHERE id = 1;
  `;

  await sql`
    INSERT INTO survey_admin_actions (action_type, payload)
    VALUES (
      'survey_status_change',
      ${JSON.stringify(payload)}::jsonb
    );
  `;
}

export async function getSurveySchemaHealth() {
  await ensureSurveySchema();
  const sql = getSqlClient();

  const tableRows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('survey_responses', 'survey_settings', 'survey_admin_actions');
  `;

  const columnRows = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('survey_responses', 'survey_settings', 'survey_admin_actions');
  `;

  const responseCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM survey_responses;
  `;

  return {
    tables: tableRows as Array<{ table_name: string }>,
    columns: columnRows as Array<{ table_name: string; column_name: string }>,
    responseCount: Number((responseCount[0] as { count: number }).count ?? 0),
  };
}

export function parseJsonRecord<T>(value: T | string): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value;
}
