-- AI Literacy Lab — Live Workshop Database Schema
-- Run once against your Neon DB to initialize.

CREATE TABLE IF NOT EXISTS workshops (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS participants (
  id             TEXT PRIMARY KEY,
  workshop_id    TEXT NOT NULL REFERENCES workshops(id),
  nickname       TEXT NOT NULL,
  avatar_seed    TEXT NOT NULL,
  favorite_animal TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  active_theme   TEXT NOT NULL DEFAULT 'theme-default',
  active_font    TEXT NOT NULL DEFAULT 'font-default',
  active_title   TEXT NOT NULL DEFAULT 'title-nowicjusz',
  active_frame   TEXT NOT NULL DEFAULT 'frame-none',
  active_avatar  TEXT NOT NULL DEFAULT 'avatar-default',
  total_points   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participant_sessions (
  token          TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token      TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id             SERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  points         INTEGER NOT NULL,
  reason         TEXT NOT NULL,
  reason_code    TEXT NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_by     TEXT NOT NULL DEFAULT 'system',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id               SERIAL PRIMARY KEY,
  participant_id   TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  module_slug      TEXT NOT NULL,
  score            INTEGER NOT NULL,
  max_score        INTEGER NOT NULL,
  correct_count    INTEGER NOT NULL,
  total_questions  INTEGER NOT NULL,
  answers          JSONB NOT NULL,
  points_earned    INTEGER NOT NULL,
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, module_slug)
);

CREATE TABLE IF NOT EXISTS exercise_events (
  id             SERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  exercise_slug  TEXT NOT NULL,
  event_type     TEXT NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}',
  points_earned  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eden_api_keys (
  participant_id TEXT PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  encrypted_key  TEXT NOT NULL,
  iv             TEXT NOT NULL,
  auth_tag       TEXT NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS screenshots (
  id             TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  exercise_slug  TEXT NOT NULL,
  github_url     TEXT,
  blob_url       TEXT NOT NULL,
  report_kind    TEXT NOT NULL DEFAULT 'exercise',
  report_note    TEXT,
  report_context JSONB NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'pending',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  reviewer_note  TEXT,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS unlocked_items (
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  item_id        TEXT NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (participant_id, item_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id                    SERIAL PRIMARY KEY,
  action                TEXT NOT NULL,
  target_participant_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_workshop ON participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_participant ON point_transactions(participant_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_participant ON quiz_attempts(participant_id);
CREATE INDEX IF NOT EXISTS idx_exercise_events_participant ON exercise_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_participant ON screenshots(participant_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_status ON screenshots(status);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_expires ON participant_sessions(expires_at);
