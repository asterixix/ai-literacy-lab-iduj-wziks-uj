import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { flattenSurveyAnswers } from "@/lib/ankieta/csv";
import { getSurveySettings, insertSurveyResponse } from "@/lib/ankieta/db";
import { filterSurveyAnswers, validateSurveyAnswers } from "@/lib/ankieta/validation";

const MIN_FORM_SECONDS = 45;
const MIN_INTERVAL_MS = 3000;
const MAX_ERROR_DETAILS = 5;

let lastSubmissionAt = 0;

type SubmitBody = {
  answers?: unknown;
  honeypot?: string;
  startedAt?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBody;
    const settings = await getSurveySettings();

    if (!settings.isOpen) {
      return NextResponse.json(
        {
          ok: false,
          error: settings.blockedReason ?? "Ankieta jest obecnie wstrzymana przez administratora.",
        },
        { status: 403 },
      );
    }

    if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
      return NextResponse.json({ ok: false, error: "Wystąpił błąd walidacji formularza." }, { status: 400 });
    }

    const now = Date.now();
    if (now - lastSubmissionAt < MIN_INTERVAL_MS) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Wykryto zbyt szybkie ponowne wysłanie. Odczekaj chwilę i spróbuj ponownie.",
        },
        { status: 429 },
      );
    }

    if (!body.startedAt || now - body.startedAt < MIN_FORM_SECONDS * 1000) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Ankieta została wysłana zbyt szybko. Upewnij się, że formularz został wypełniony poprawnie.",
        },
        { status: 400 },
      );
    }

    const answers = filterSurveyAnswers(body.answers);
    const validation = validateSurveyAnswers(answers);
    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Formularz zawiera błędy walidacji.",
          details: validation.errors.slice(0, MAX_ERROR_DETAILS),
        },
        { status: 400 },
      );
    }

    const responseId = randomUUID();
    const submittedAt = new Date().toISOString();
    const formDurationSeconds = String(Math.max(Math.floor((now - body.startedAt) / 1000), 0));
    const enrichedAnswers = {
      ...answers,
      meta_submitted_at: submittedAt,
      meta_form_duration_seconds: formDurationSeconds,
      meta_certificate_evaluation_included: "Tak",
    };

    const flatData = flattenSurveyAnswers(enrichedAnswers);

    await insertSurveyResponse({
      id: responseId,
      surveyData: enrichedAnswers,
      flatData,
    });

    lastSubmissionAt = now;

    return NextResponse.json({ ok: true, responseId });
  } catch (error) {
    console.error("Survey submit error", error);
    return NextResponse.json(
      { ok: false, error: "Nie udało się zapisać ankiety. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }
}
