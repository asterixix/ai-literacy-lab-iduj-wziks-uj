import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { recordExerciseEvent } from "@/lib/live/db/exercises";
import { createScreenshot, type ScreenshotKind } from "@/lib/live/db/screenshots";
import { PROTOTYPE_EXERCISE_SLUG } from "@/lib/live/points-engine";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const REPORT_KINDS = new Set<ScreenshotKind>(["exercise", "anti_cheat_report"]);

function getBlobTokenFromEnv(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Brak tokena Vercel Blob w ENV (BLOB_READ_WRITE_TOKEN).");
  }
  return token;
}

function normalizeGithubUrl(value: string): string | null {
  if (!value.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const isHttps = parsed.protocol === "https:";
  const host = parsed.hostname.toLowerCase();
  const isGithubHost =
    host === "github.com" || host === "www.github.com" || host === "gist.github.com";

  if (!isHttps || !isGithubHost) {
    return null;
  }

  return parsed.toString();
}

function parseReportContext(raw: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof raw !== "string" || !raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore malformed report context.
  }

  return {};
}

function isPrivateStoreAccessError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("Cannot use public access on a private store");
}

async function uploadBlobWithFallback(
  pathname: string,
  file: File,
): Promise<{ blobUrl: string; access: "public" | "private" }> {
  const token = getBlobTokenFromEnv();

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      token,
    });
    return { blobUrl: blob.url, access: "public" };
  } catch (error) {
    if (!isPrivateStoreAccessError(error)) {
      throw error;
    }

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      token,
    });

    return { blobUrl: blob.downloadUrl, access: "private" };
  }
}

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const exerciseSlug = String(formData.get("exerciseSlug") ?? "");
  const rawGithubUrl = String(formData.get("githubUrl") ?? "");
  const kindRaw = String(formData.get("kind") ?? "exercise") as ScreenshotKind;
  const reportNote = String(formData.get("reportNote") ?? "").trim();
  const reportContext = parseReportContext(formData.get("reportContext"));
  const file = formData.get("file");

  if (!exerciseSlug || !(file instanceof File)) {
    return NextResponse.json({ error: "Brakuje pliku lub slugu ćwiczenia." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Obsługiwane są PNG, JPG, WEBP." }, { status: 400 });
  }

  if (!REPORT_KINDS.has(kindRaw)) {
    return NextResponse.json({ error: "Nieznany typ zgłoszenia." }, { status: 400 });
  }

  const githubUrl = normalizeGithubUrl(rawGithubUrl);
  if (kindRaw === "exercise" && exerciseSlug === PROTOTYPE_EXERCISE_SLUG && !githubUrl) {
    return NextResponse.json(
      { error: "Dla ćwiczenia prototypu podaj poprawny link do GitHub (https://github.com/...)." },
      { status: 400 },
    );
  }

  const screenshotId = `ss_${nanoid(12)}`;
  const pathname = `live/${participantId}/${screenshotId}-${file.name}`;
  const uploaded = await uploadBlobWithFallback(pathname, file);

  await createScreenshot({
    id: screenshotId,
    participantId,
    exerciseSlug,
    githubUrl: githubUrl ?? undefined,
    blobUrl: uploaded.blobUrl,
    kind: kindRaw,
    reportNote: reportNote || undefined,
    reportContext,
  });

  if (kindRaw === "exercise") {
    await recordExerciseEvent({
      participant_id: participantId,
      exercise_slug: exerciseSlug,
      event_type: `screenshot_uploaded:${screenshotId}`,
      metadata: {
        screenshotId,
        blobUrl: uploaded.blobUrl,
        blobAccess: uploaded.access,
        githubUrl,
      },
      points_earned: 0,
    });
  }

  return NextResponse.json({
    success: true,
    screenshotId,
    blobUrl: uploaded.blobUrl,
    pointsEarned: 0,
    totalPoints: null,
  });
}
