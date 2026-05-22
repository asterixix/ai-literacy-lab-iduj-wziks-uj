import { SURVEY_LABEL_MAP, normalizeOptionLabel } from "@/lib/ankieta/schema";
import type { SurveyAnswers } from "@/lib/ankieta/validation";

type FlatValue = string;

export type FlatSurveyAnswers = Record<string, FlatValue>;

function toCsvCell(value: string): string {
  const normalized = value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const escaped = normalized.replaceAll("\"", "\"\"");
  return `"${escaped}"`;
}

export function flattenSurveyAnswers(answers: SurveyAnswers): FlatSurveyAnswers {
  const flat: FlatSurveyAnswers = {};

  const orderedKeys = Object.keys(SURVEY_LABEL_MAP);
  orderedKeys.forEach((key) => {
    const raw = answers[key];

    if (Array.isArray(raw)) {
      flat[key] = raw.map((value) => normalizeOptionLabel(key, value)).join(" | ");
      return;
    }

    if (typeof raw === "string") {
      flat[key] = normalizeOptionLabel(key, raw);
      return;
    }

    flat[key] = "";
  });

  return flat;
}

export function buildSingleResponseCsv(flat: FlatSurveyAnswers): string {
  const headers = Object.keys(SURVEY_LABEL_MAP);
  const headerRow = headers.map((key) => toCsvCell(`${key} :: ${SURVEY_LABEL_MAP[key].label}`)).join(",");
  const dataRow = headers.map((key) => toCsvCell(flat[key] ?? "")).join(",");

  return `${headerRow}\n${dataRow}\n`;
}

export function buildAggregateCsv(rows: FlatSurveyAnswers[]): string {
  const headers = Object.keys(SURVEY_LABEL_MAP);
  const headerRow = headers.map((key) => toCsvCell(`${key} :: ${SURVEY_LABEL_MAP[key].label}`)).join(",");
  const dataRows = rows.map((row) => headers.map((key) => toCsvCell(row[key] ?? "")).join(","));

  return `${headerRow}\n${dataRows.join("\n")}\n`;
}
