import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { logAdminAction } from "@/lib/live/db/admin-audit";
import { getParticipantExerciseEvents } from "@/lib/live/db/exercises";
import {
  getParticipantById,
  resetParticipant,
  updateParticipantProfile,
} from "@/lib/live/db/participants";
import { getParticipantTransactions } from "@/lib/live/db/points";
import { getParticipantQuizAttempts } from "@/lib/live/db/quizzes";
import { getParticipantScreenshots } from "@/lib/live/db/screenshots";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const admin = await requireAdminFromApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const participant = await getParticipantById(id);
  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [quizAttempts, exerciseEvents, transactions, screenshots] = await Promise.all([
    getParticipantQuizAttempts(id),
    getParticipantExerciseEvents(id),
    getParticipantTransactions(id),
    getParticipantScreenshots(id),
  ]);

  return NextResponse.json({
    participant,
    quizAttempts,
    exerciseEvents,
    transactions,
    screenshots,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdminFromApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    nickname?: string;
    avatarSeed?: string;
    reset?: boolean;
  } | null;

  if (body?.reset) {
    await resetParticipant(id);
    await logAdminAction({ action: "participant_reset", targetParticipantId: id });
    return NextResponse.json({ success: true });
  }

  await updateParticipantProfile(id, {
    nickname: body?.nickname,
    avatar_seed: body?.avatarSeed,
  });
  await logAdminAction({
    action: "participant_profile_updated",
    targetParticipantId: id,
    metadata: { nickname: body?.nickname, avatarSeed: body?.avatarSeed },
  });

  return NextResponse.json({ success: true });
}
