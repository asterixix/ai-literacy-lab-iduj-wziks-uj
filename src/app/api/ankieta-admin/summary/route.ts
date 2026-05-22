import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SURVEY_ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/ankieta/admin-auth";
import {
  getSurveyResponses,
  getSurveySchemaHealth,
  getSurveySettings,
  parseJsonRecord,
} from "@/lib/ankieta/db";
import type { SurveyAnswers } from "@/lib/ankieta/validation";

function calculateDistribution(values: string[]) {
  const distribution: Record<string, number> = {};
  values.forEach((value) => {
    if (!value) {
      return;
    }
    distribution[value] = (distribution[value] ?? 0) + 1;
  });
  return distribution;
}

function calculateNpsBreakdown(values: string[]) {
  let detractors = 0;
  let passives = 0;
  let promoters = 0;

  values.forEach((value) => {
    const score = Number(value);
    if (Number.isNaN(score)) {
      return;
    }

    if (score <= 6) {
      detractors += 1;
      return;
    }

    if (score <= 8) {
      passives += 1;
      return;
    }

    promoters += 1;
  });

  const total = detractors + passives + promoters;
  const score = total > 0 ? Math.round((promoters / total) * 100 - (detractors / total) * 100) : null;

  return {
    detractors,
    passives,
    promoters,
    total,
    score,
  };
}

function calculateAverage(values: string[]): number | null {
  const numbers = values
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
  if (numbers.length === 0) {
    return null;
  }
  const sum = numbers.reduce((acc, value) => acc + value, 0);
  return Number((sum / numbers.length).toFixed(2));
}

function extractNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

function calculateB1Gains(rows: Array<Record<string, string>>) {
  const topicKeys = [
    "llm",
    "rag",
    "agents",
    "mcp",
    "prompt",
  ] as const;

  const result = topicKeys.map((topic) => {
    const deltas = rows
      .map((row) => {
        const before = extractNumber(row[`B1_${topic}_before`]);
        const now = extractNumber(row[`B1_${topic}_now`]);
        if (before === null || now === null) {
          return null;
        }
        return now - before;
      })
      .filter((delta): delta is number => delta !== null);

    if (deltas.length === 0) {
      return { topic, avgGain: 0 };
    }

    const avgGain = Number((deltas.reduce((acc, item) => acc + item, 0) / deltas.length).toFixed(2));
    return { topic, avgGain };
  });

  const overall = result.length
    ? Number((result.reduce((acc, item) => acc + item.avgGain, 0) / result.length).toFixed(2))
    : 0;

  return { topics: result, overall };
}

function calculatePairedGain(
  rows: Array<Record<string, string>>,
  beforeKey: string,
  nowKey: string,
  map: Record<string, number>,
) {
  const deltas = rows
    .map((row) => {
      const before = map[row[beforeKey] ?? ""];
      const now = map[row[nowKey] ?? ""];
      if (!before || !now) {
        return null;
      }
      return now - before;
    })
    .filter((delta): delta is number => delta !== null);

  if (deltas.length === 0) {
    return null;
  }

  return Number((deltas.reduce((acc, item) => acc + item, 0) / deltas.length).toFixed(2));
}

function normalizeDateKey(input: unknown): string | null {
  if (typeof input === "string") {
    const value = input.trim();
    if (!value) {
      return null;
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  if (input instanceof Date) {
    return input.toISOString().slice(0, 10);
  }

  if (typeof input === "number") {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().slice(0, 10);
  }

  return null;
}

function calculateTimeline(rows: Array<{ createdAt: unknown }>) {
  const byDay: Record<string, number> = {};

  rows.forEach((row) => {
    const day = normalizeDateKey(row.createdAt);
    if (!day) {
      return;
    }
    byDay[day] = (byDay[day] ?? 0) + 1;
  });

  return Object.entries(byDay)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, count]) => ({ day, count }));
}

function calculateMatrixRowAverages(
  rows: Array<Record<string, string>>,
  prefix: string,
  rowKeys: string[],
) {
  return rowKeys.map((rowKey) => {
    const values = rows
      .map((row) => extractNumber(row[`${prefix}_${rowKey}`]))
      .filter((value): value is number => value !== null);

    const average =
      values.length > 0
        ? Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2))
        : null;

    return {
      key: rowKey,
      average,
      count: values.length,
    };
  });
}

function calculateAttendanceVsSatisfaction(rows: Array<Record<string, string>>) {
  const result: Record<string, Record<string, number>> = {};
  rows.forEach((row) => {
    const attendance = row.A3 ?? "brak";
    const satisfaction = row.C1 ?? "brak";
    result[attendance] ??= {};
    result[attendance][satisfaction] = (result[attendance][satisfaction] ?? 0) + 1;
  });
  return result;
}

function calculateToolsUsage(rows: Array<Record<string, string>>) {
  const counter: Record<string, number> = {};

  rows.forEach((row) => {
    const raw = row.B5 ?? "";
    raw
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((tool) => {
        counter[tool] = (counter[tool] ?? 0) + 1;
      });
  });

  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .map(([tool, count]) => ({ tool, count }));
}

function normalizeSurveyForMetrics(survey: SurveyAnswers): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(survey).forEach(([key, value]) => {
    if (typeof value === "string") {
      result[key] = value;
      return;
    }
    if (Array.isArray(value)) {
      result[key] = value[0] ?? "";
      return;
    }
    result[key] = "";
  });
  return result;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SURVEY_ADMIN_COOKIE)?.value;

  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Brak autoryzacji." }, { status: 401 });
  }

  try {
    const rows = await getSurveyResponses();
    const settings = await getSurveySettings();
    const health = await getSurveySchemaHealth();
    const parsedRows = rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      flat: parseJsonRecord<Record<string, string>>(row.flat_data),
      survey: normalizeSurveyForMetrics(parseJsonRecord<SurveyAnswers>(row.survey_data)),
    }));

    const surveyRows = parsedRows.map((row) => row.survey);
    const timeline = calculateTimeline(parsedRows.map((row) => ({ createdAt: row.createdAt })));
    const b1Gains = calculateB1Gains(surveyRows);
    const b2Gain = calculatePairedGain(surveyRows, "B2_before", "B2_now", {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
    });
    const b4Gain = calculatePairedGain(surveyRows, "B4_before", "B4_now", {
      beginner: 1,
      basic: 2,
      intermediate: 3,
      advanced: 4,
      expert: 5,
    });
    const npsBreakdown = calculateNpsBreakdown(parsedRows.map((row) => row.flat.F2 ?? ""));
    const materialRows = calculateMatrixRowAverages(parsedRows.map((row) => row.flat), "D1", [
      "clarity",
      "structure",
      "fit",
      "practicality",
      "completeness",
      "visual",
      "freshness",
      "availability",
    ]);
    const teachingRows = calculateMatrixRowAverages(parsedRows.map((row) => row.flat), "E1", [
      "knowledge",
      "explain",
      "flexibility",
      "engagement",
    ]);
    const methodologyRows = calculateMatrixRowAverages(parsedRows.map((row) => row.flat), "E2", [
      "logic",
      "balance",
      "pace",
      "methods",
      "exercise_quality",
      "discussion_space",
    ]);
    const logisticsRows = calculateMatrixRowAverages(parsedRows.map((row) => row.flat), "F1", [
      "communication",
      "time",
      "length",
      "count",
      "platform",
    ]);
    const attendanceVsSatisfaction = calculateAttendanceVsSatisfaction(parsedRows.map((row) => row.flat));
    const toolsUsage = calculateToolsUsage(parsedRows.map((row) => row.flat));

    const summary = {
      count: parsedRows.length,
      groupDistribution: calculateDistribution(parsedRows.map((row) => row.flat.A1 ?? "")),
      modeDistribution: calculateDistribution(parsedRows.map((row) => row.flat.A2 ?? "")),
      attendanceDistribution: calculateDistribution(parsedRows.map((row) => row.flat.A3 ?? "")),
      c3Distribution: calculateDistribution(parsedRows.map((row) => row.flat.C3 ?? "")),
      c4Distribution: calculateDistribution(parsedRows.map((row) => row.flat.C4 ?? "")),
      c5Distribution: calculateDistribution(parsedRows.map((row) => row.flat.C5 ?? "")),
      c1Average: calculateAverage(parsedRows.map((row) => row.flat.C1 ?? "")),
      npsAverage: calculateAverage(parsedRows.map((row) => row.flat.F2 ?? "")),
      consentYesCount: parsedRows.filter((row) => row.flat.H1?.startsWith("Tak")).length,
      certificateIncludedCount: parsedRows.length,
      timeline,
      b1Gains,
      b2Gain,
      b4Gain,
      npsBreakdown,
      matrixAverages: {
        D1: materialRows,
        E1: teachingRows,
        E2: methodologyRows,
        F1: logisticsRows,
      },
      attendanceVsSatisfaction,
      toolsUsage,
      settings,
      dbHealth: health,
    };

    return NextResponse.json({
      ok: true,
      summary,
      responses: parsedRows.slice(0, 150),
    });
  } catch (error) {
    console.error("Survey summary error", error);
    return NextResponse.json({ ok: false, error: "Nie udało się pobrać danych." }, { status: 500 });
  }
}
