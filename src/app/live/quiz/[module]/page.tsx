import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/live/QuizPlayer";
import { getParticipantIdFromSession } from "@/lib/live/auth-server";
import { getQuizAttempt } from "@/lib/live/db/quizzes";
import { getLiveModule } from "@/lib/live/registry";

interface Props {
  params: Promise<{ module: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module: moduleSlug } = await params;
  const mod = getLiveModule(moduleSlug);
  return {
    title: mod ? `Quiz: ${mod.title}` : "Quiz",
    robots: { index: false, follow: false },
  };
}

export default async function QuizPage({ params }: Props) {
  const { module: moduleSlug } = await params;
  const mod = getLiveModule(moduleSlug);
  if (!mod) notFound();

  const participantId = await getParticipantIdFromSession();
  const existingAttempt = participantId ? await getQuizAttempt(participantId, moduleSlug) : null;
  const existingAttemptSummary = existingAttempt
    ? {
        score: existingAttempt.score,
        totalQuestions: existingAttempt.total_questions,
        pointsEarned: existingAttempt.points_earned,
        completedAt:
          existingAttempt.completed_at instanceof Date
            ? existingAttempt.completed_at.toISOString()
            : String(existingAttempt.completed_at),
      }
    : null;

  return (
    <QuizPlayer
      moduleSlug={moduleSlug}
      moduleTitle={mod.title}
      moduleNumber={mod.moduleNumber}
      questions={mod.questions}
      existingAttempt={existingAttemptSummary}
    />
  );
}
