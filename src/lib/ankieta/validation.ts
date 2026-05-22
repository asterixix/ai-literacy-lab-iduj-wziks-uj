import { SURVEY_SECTIONS, type SectionQuestion } from "@/lib/ankieta/schema";

export type SurveyAnswers = Record<string, string | string[]>;

export type SurveyValidationResult = {
  ok: boolean;
  errors: string[];
};

function hasNonEmptyText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getTextLength(value: unknown): number {
  return typeof value === "string" ? value.trim().length : 0;
}

function validateQuestion(question: SectionQuestion, answers: SurveyAnswers, errors: string[]) {
  if (question.kind === "single") {
    const value = answers[question.id];
    if (question.required && !hasNonEmptyText(value)) {
      errors.push(`Brak odpowiedzi: ${question.label}`);
      return;
    }

    if (typeof value === "string" && question.hasOther && value === "other") {
      const otherValue = answers[`${question.id}_other`];
      if (!hasNonEmptyText(otherValue)) {
        errors.push(`Uzupełnij pole "Inne" dla: ${question.label}`);
      }
    }

    return;
  }

  if (question.kind === "multi") {
    const value = answers[question.id];
    const items = Array.isArray(value) ? value : [];

    if (question.required && items.length === 0) {
      errors.push(`Wybierz przynajmniej jedną odpowiedź: ${question.label}`);
    }

    if (question.hasOther && items.includes("other")) {
      const otherValue = answers[`${question.id}_other`];
      if (!hasNonEmptyText(otherValue)) {
        errors.push(`Uzupełnij pole "Inne" dla: ${question.label}`);
      }
    }

    return;
  }

  if (question.kind === "text") {
    const value = answers[question.id];
    if (question.required && !hasNonEmptyText(value)) {
      errors.push(`Brak odpowiedzi: ${question.label}`);
      return;
    }

    if (question.minLength && getTextLength(value) < question.minLength) {
      errors.push(`Za krótka odpowiedź: ${question.label}`);
    }

    return;
  }

  if (question.kind === "pairedLevel") {
    const before = answers[`${question.id}_before`];
    const now = answers[`${question.id}_now`];

    if (question.required && !hasNonEmptyText(before)) {
      errors.push(`Brak odpowiedzi PRZED: ${question.label}`);
    }

    if (question.required && !hasNonEmptyText(now)) {
      errors.push(`Brak odpowiedzi TERAZ: ${question.label}`);
    }

    return;
  }

  if (question.kind === "matrix") {
    if (question.mode === "single-choice") {
      question.rows.forEach((row) => {
        const key = `${question.id}_${row.value}`;
        const value = answers[key];
        if (question.required && !hasNonEmptyText(value)) {
          errors.push(`Brak odpowiedzi: ${question.label} / ${row.label}`);
        }
      });
      return;
    }

    question.rows.forEach((row) => {
      question.columns.forEach((column) => {
        const key = `${question.id}_${row.value}_${column.value}`;
        const value = answers[key];
        if (question.required && !hasNonEmptyText(value)) {
          errors.push(`Brak odpowiedzi: ${question.label} / ${row.label} / ${column.label}`);
        }
      });
    });
  }
}

export function validateSurveyAnswers(answers: SurveyAnswers): SurveyValidationResult {
  const errors: string[] = [];

  SURVEY_SECTIONS.forEach((section) => {
    section.questions.forEach((question) => {
      validateQuestion(question, answers, errors);
    });
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function filterSurveyAnswers(rawAnswers: unknown): SurveyAnswers {
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    return {};
  }

  const entries = Object.entries(rawAnswers as Record<string, unknown>).map(([key, value]) => {
    if (typeof value === "string") {
      return [key, value.trim()] as const;
    }

    if (Array.isArray(value)) {
      const arrayValue = value.filter((item): item is string => typeof item === "string");
      return [key, arrayValue] as const;
    }

    return [key, ""] as const;
  });

  return Object.fromEntries(entries);
}
