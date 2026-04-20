import { ensureLiveSchema } from "./bootstrap";
import { sql } from "./client";

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  correct: boolean;
  points: number;
}

export interface QuizAttempt {
  id: number;
  participant_id: string;
  module_slug: string;
  score: number;
  max_score: number;
  correct_count: number;
  total_questions: number;
  answers: QuizAnswer[];
  points_earned: number;
  completed_at: Date;
}

export async function saveQuizAttempt(data: {
  participant_id: string;
  module_slug: string;
  score: number;
  max_score: number;
  correct_count: number;
  total_questions: number;
  answers: QuizAnswer[];
  points_earned: number;
}): Promise<QuizAttempt | null> {
  await ensureLiveSchema();
  const rows = (await sql`
    INSERT INTO quiz_attempts
      (participant_id, module_slug, score, max_score, correct_count, total_questions, answers, points_earned)
    VALUES (
      ${data.participant_id}, ${data.module_slug}, ${data.score}, ${data.max_score},
      ${data.correct_count}, ${data.total_questions}, ${JSON.stringify(data.answers)}, ${data.points_earned}
    )
    ON CONFLICT (participant_id, module_slug) DO NOTHING
    RETURNING *
  `) as QuizAttempt[];
  return (rows[0] as QuizAttempt) ?? null;
}

export async function getParticipantQuizAttempts(participantId: string): Promise<QuizAttempt[]> {
  await ensureLiveSchema();
  return (await sql`
    SELECT * FROM quiz_attempts WHERE participant_id = ${participantId} ORDER BY completed_at DESC
  `) as QuizAttempt[];
}

export async function getQuizAttempt(
  participantId: string,
  moduleSlug: string,
): Promise<QuizAttempt | null> {
  await ensureLiveSchema();
  const rows = (await sql`
    SELECT * FROM quiz_attempts WHERE participant_id = ${participantId} AND module_slug = ${moduleSlug}
  `) as QuizAttempt[];
  return (rows[0] as QuizAttempt) ?? null;
}
