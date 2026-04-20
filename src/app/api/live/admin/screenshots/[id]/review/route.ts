import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { logAdminAction } from "@/lib/live/db/admin-audit";
import { getScreenshotById, reviewScreenshot } from "@/lib/live/db/screenshots";
import { getScreenshotPendingReward } from "@/lib/live/points-engine";
import { grantPoints } from "@/lib/live/rewards";

interface Params {
  params: Promise<{ id: string }>;
}

const ANTICHEAT_PENALTY_REFUND = 25;

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdminFromApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: "approved" | "rejected";
    reviewerNote?: string;
    extraPoints?: number;
    refundPenalty?: boolean;
  } | null;

  if (!body?.status) {
    return NextResponse.json({ error: "Brak statusu." }, { status: 400 });
  }

  const screenshot = await getScreenshotById(id);
  if (!screenshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (screenshot.status !== "pending") {
    return NextResponse.json({ error: "To zgłoszenie zostało już rozpatrzone." }, { status: 409 });
  }

  const bonusPoints =
    body.status === "approved" ? Math.max(0, Math.round(body.extraPoints ?? 0)) : 0;
  const approvedExercisePoints =
    body.status === "approved" && screenshot.report_kind === "exercise"
      ? getScreenshotPendingReward(screenshot.exercise_slug)
      : 0;
  const refundPoints =
    body.status === "approved" &&
    body.refundPenalty === true &&
    screenshot.report_kind === "anti_cheat_report"
      ? ANTICHEAT_PENALTY_REFUND
      : 0;
  const totalAwardedPoints = approvedExercisePoints + bonusPoints + refundPoints;

  await reviewScreenshot({
    screenshotId: id,
    status: body.status,
    reviewerNote: body.reviewerNote,
    pointsAwarded: totalAwardedPoints,
  });

  let totalPoints: number | null = null;
  if (body.status === "approved" && totalAwardedPoints > 0) {
    const reason =
      approvedExercisePoints > 0
        ? `Akceptacja screenshotu: ${screenshot.exercise_slug}`
        : refundPoints > 0
          ? `Zwrot kary antycheat: ${screenshot.exercise_slug}`
          : `Bonus za screenshot: ${screenshot.exercise_slug}`;
    const reasonCode =
      approvedExercisePoints > 0
        ? "screenshot_approved"
        : refundPoints > 0
          ? "quiz_anticheat_refund"
          : "screenshot_bonus";

    totalPoints = await grantPoints({
      participantId: screenshot.participant_id,
      points: totalAwardedPoints,
      reason,
      reasonCode,
      createdBy: "admin",
      metadata: {
        screenshotId: id,
        approvedExercisePoints,
        bonusPoints,
        refundPoints,
      },
    });
  }

  await logAdminAction({
    action: "screenshot_reviewed",
    targetParticipantId: screenshot.participant_id,
    metadata: {
      screenshotId: id,
      status: body.status,
      extraPoints: body.extraPoints ?? 0,
      refundPenalty: body.refundPenalty ?? false,
      totalAwardedPoints,
    },
  });

  return NextResponse.json({ success: true, totalPoints });
}
