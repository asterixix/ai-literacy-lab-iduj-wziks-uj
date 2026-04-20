import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { hasExerciseEvent, recordExerciseEvent } from "@/lib/live/db/exercises";
import {
  calculatePlaygroundPoints,
  calculatePromptTokenPoints,
  LM_STUDIO_DONE_POINTS,
  LM_STUDIO_STEP_POINTS,
  PRIVACY_CHECKBOX_POINTS,
  PRIVACY_COMPARISON_POINTS,
  PROMPT_SEND_POINTS,
  sanitizePoints,
} from "@/lib/live/points-engine";
import { grantPoints } from "@/lib/live/rewards";

function resolveEventPoints(payload: {
  exerciseSlug: string;
  eventType: string;
  tokenCount?: number;
  inputTokensPerModel?: number[];
  outputTokensPerModel?: number[];
  customParamCount?: number;
  elementCharCount?: number;
  customPoints?: number;
}): number {
  if (
    payload.eventType === "prompt_sent" &&
    (payload.exerciseSlug === "porownanie" || payload.exerciseSlug === "asystent-badawczy")
  ) {
    // Use new playground points calculation if token arrays are provided
    if (Array.isArray(payload.inputTokensPerModel) || Array.isArray(payload.outputTokensPerModel)) {
      return calculatePlaygroundPoints({
        inputTokensPerModel: payload.inputTokensPerModel,
        outputTokensPerModel: payload.outputTokensPerModel,
        customParamCount: payload.exerciseSlug === "porownanie" ? payload.customParamCount : 0,
      });
    }
    // Fallback to old calculation
    return PROMPT_SEND_POINTS + calculatePromptTokenPoints(payload.tokenCount ?? 0);
  }
  if (
    payload.eventType === "assistant_element_added" &&
    payload.exerciseSlug === "asystent-badawczy"
  ) {
    const charCount = Math.max(0, Math.floor(payload.elementCharCount ?? 0));
    if (charCount <= 0) return 0;
    return Math.max(2, Math.floor(charCount / 20) * 2);
  }
  if (payload.eventType === "privacy_checkbox" && payload.exerciseSlug === "prywatnosc") {
    return PRIVACY_CHECKBOX_POINTS;
  }
  if (payload.eventType === "privacy_comparison_view" && payload.exerciseSlug === "prywatnosc") {
    return PRIVACY_COMPARISON_POINTS;
  }
  if (payload.eventType === "lm_step_completed" && payload.exerciseSlug === "lm-studio") {
    return LM_STUDIO_STEP_POINTS;
  }
  if (payload.eventType === "lm_mark_done" && payload.exerciseSlug === "lm-studio") {
    return LM_STUDIO_DONE_POINTS;
  }
  return sanitizePoints(payload.customPoints);
}

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    exerciseSlug?: string;
    eventType?: string;
    metadata?: Record<string, unknown>;
    tokenCount?: number;
    inputTokensPerModel?: number[];
    outputTokensPerModel?: number[];
    customParamCount?: number;
    elementType?: string;
    elementCharCount?: number;
    customPoints?: number;
    dedupeKey?: string;
    noDedup?: boolean;
  } | null;

  if (!body?.exerciseSlug || !body.eventType) {
    return NextResponse.json({ error: "Niepoprawny event." }, { status: 400 });
  }

  // For playground events (prompt_sent), always require dedupeKey to track individual prompts.
  // For other events, dedupeKey is optional and defaults to eventType alone.
  let dedupeEvent: string;
  if (body.noDedup) {
    // For events that should never be deduplicated (e.g., each playground run is unique)
    dedupeEvent = `${body.eventType}:${body.dedupeKey ?? `${Date.now()}-${Math.random()}`}`;
  } else {
    dedupeEvent = body.dedupeKey ? `${body.eventType}:${body.dedupeKey}` : body.eventType;
  }

  const exists = await hasExerciseEvent(participantId, body.exerciseSlug, dedupeEvent);
  if (exists) {
    return NextResponse.json({ success: true, pointsEarned: 0, deduplicated: true });
  }

  const points = resolveEventPoints({
    exerciseSlug: body.exerciseSlug,
    eventType: body.eventType,
    tokenCount: body.tokenCount,
    inputTokensPerModel: body.inputTokensPerModel,
    outputTokensPerModel: body.outputTokensPerModel,
    customParamCount: body.customParamCount,
    elementCharCount: body.elementCharCount,
    customPoints: body.customPoints,
  });

  await recordExerciseEvent({
    participant_id: participantId,
    exercise_slug: body.exerciseSlug,
    event_type: dedupeEvent,
    metadata: body.metadata,
    points_earned: points,
  });

  let totalPoints: number | null = null;
  if (points > 0) {
    totalPoints = await grantPoints({
      participantId,
      points,
      reason: `${body.exerciseSlug}: ${body.eventType}`,
      reasonCode: "exercise_event",
      metadata: body.metadata,
    });
  }

  return NextResponse.json({
    success: true,
    pointsEarned: points,
    totalPoints,
  });
}
