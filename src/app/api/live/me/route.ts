import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { getExerciseSummary, getParticipantExerciseEvents } from "@/lib/live/db/exercises";
import { getParticipantById } from "@/lib/live/db/participants";
import { getParticipantTransactions } from "@/lib/live/db/points";
import { getParticipantQuizAttempts } from "@/lib/live/db/quizzes";
import { getParticipantScreenshots } from "@/lib/live/db/screenshots";
import { getUnlockedItemIds } from "@/lib/live/db/unlocked-items";

export async function GET() {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let participant: Awaited<ReturnType<typeof getParticipantById>>;
  try {
    participant = await getParticipantById(participantId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ error: `Database unavailable: ${message}` }, { status: 503 });
  }

  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const results = await Promise.allSettled([
    getParticipantQuizAttempts(participantId),
    getParticipantExerciseEvents(participantId),
    getExerciseSummary(participantId),
    getParticipantTransactions(participantId),
    getParticipantScreenshots(participantId),
    getUnlockedItemIds(participantId),
  ]);

  const [
    quizAttemptsResult,
    exerciseEventsResult,
    exerciseSummaryResult,
    transactionsResult,
    screenshotsResult,
    unlockedItemsResult,
  ] = results;

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("/api/live/me partial data error:", result.reason);
    }
  }

  const quizAttempts = quizAttemptsResult.status === "fulfilled" ? quizAttemptsResult.value : [];
  const exerciseEvents =
    exerciseEventsResult.status === "fulfilled" ? exerciseEventsResult.value : [];
  const exerciseSummary =
    exerciseSummaryResult.status === "fulfilled" ? exerciseSummaryResult.value : [];
  const transactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : [];
  const screenshots = screenshotsResult.status === "fulfilled" ? screenshotsResult.value : [];
  const unlockedItems = unlockedItemsResult.status === "fulfilled" ? unlockedItemsResult.value : [];

  return NextResponse.json({
    participant: {
      id: participant.id,
      workshopId: participant.workshop_id,
      nickname: participant.nickname,
      avatarSeed: participant.avatar_seed,
      activeAvatar: participant.active_avatar,
      favoriteAnimal: participant.favorite_animal,
      activeTheme: participant.active_theme,
      activeFont: participant.active_font,
      activeTitle: participant.active_title,
      activeFrame: participant.active_frame,
      totalPoints: participant.total_points,
    },
    quizAttempts,
    exerciseEvents,
    exerciseSummary,
    transactions,
    screenshots,
    unlockedItems,
  });
}
