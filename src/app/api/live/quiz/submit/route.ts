import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { getQuizAttempt, saveQuizAttempt } from "@/lib/live/db/quizzes";
import { calculateQuizPoints } from "@/lib/live/points-engine";
import { grantPoints } from "@/lib/live/rewards";

interface QuizAnswerPayload {
  questionId: string;
  selectedOption: number;
  correct: boolean;
  points: number;
}

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    moduleSlug?: string;
    totalQuestions?: number;
    answers?: QuizAnswerPayload[];
  } | null;

  if (!body?.moduleSlug || !Array.isArray(body.answers) || !body.totalQuestions) {
    return NextResponse.json({ error: "Niepoprawne dane quizu." }, { status: 400 });
  }

  const existingAttempt = await getQuizAttempt(participantId, body.moduleSlug);
  if (existingAttempt) {
    return NextResponse.json({
      alreadySubmitted: true,
      message: "Ten quiz zostal juz zapisany.",
      existingAttempt: {
        score: existingAttempt.score,
        totalQuestions: existingAttempt.total_questions,
        pointsEarned: existingAttempt.points_earned,
        completedAt:
          existingAttempt.completed_at instanceof Date
            ? existingAttempt.completed_at.toISOString()
            : String(existingAttempt.completed_at),
      },
    });
  }

  const correctCount = body.answers.filter((answer) => answer.correct).length;
  const pointsEarned = calculateQuizPoints(correctCount);

  const saved = await saveQuizAttempt({
    participant_id: participantId,
    module_slug: body.moduleSlug,
    score: correctCount,
    max_score: body.totalQuestions,
    correct_count: correctCount,
    total_questions: body.totalQuestions,
    answers: body.answers,
    points_earned: pointsEarned,
  });

  if (!saved) {
    const alreadySaved = await getQuizAttempt(participantId, body.moduleSlug);
    return NextResponse.json({
      alreadySubmitted: true,
      message: "Ten quiz zostal juz zapisany.",
      existingAttempt: alreadySaved
        ? {
            score: alreadySaved.score,
            totalQuestions: alreadySaved.total_questions,
            pointsEarned: alreadySaved.points_earned,
            completedAt:
              alreadySaved.completed_at instanceof Date
                ? alreadySaved.completed_at.toISOString()
                : String(alreadySaved.completed_at),
          }
        : null,
    });
  }

  const totalPoints = await grantPoints({
    participantId,
    points: pointsEarned,
    reason: `Quiz ${body.moduleSlug}: ${correctCount}/${body.totalQuestions}`,
    reasonCode: "quiz_completion",
    metadata: {
      moduleSlug: body.moduleSlug,
      correctCount,
      totalQuestions: body.totalQuestions,
    },
  });

  return NextResponse.json({
    success: true,
    pointsEarned,
    totalPoints,
  });
}
