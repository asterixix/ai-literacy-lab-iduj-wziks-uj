"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { SURVEY_SECTIONS, type SectionQuestion, type SurveySection } from "@/lib/ankieta/schema";
import type { SurveyAnswers } from "@/lib/ankieta/validation";

const DEVICE_LOCK_KEY = "ai-literacy-lab-survey-submitted";

type SubmitState = "idle" | "submitting" | "success" | "error";

function hasValue(value: string | string[] | undefined): boolean {
  if (!value) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value.trim().length > 0;
}

function getQuestionIssues(section: SurveySection, answers: SurveyAnswers): Record<string, string[]> {
  const issues: Record<string, string[]> = {};
  const pushIssue = (questionId: string, message: string) => {
    issues[questionId] = [...(issues[questionId] ?? []), message];
  };

  section.questions.forEach((question) => {
    if (question.kind === "single") {
      const value = answers[question.id];
      if (question.required && !hasValue(value)) {
        pushIssue(question.id, "Brak wymaganej odpowiedzi.");
      }
      if (question.hasOther && value === "other" && !hasValue(answers[`${question.id}_other`])) {
        pushIssue(question.id, "Uzupełnij pole \"Inne\".");
      }
      return;
    }

    if (question.kind === "multi") {
      const value = answers[question.id];
      const selected = Array.isArray(value) ? value : [];
      if (question.required && selected.length === 0) {
        pushIssue(question.id, "Wybierz co najmniej jedną odpowiedź.");
      }
      if (question.hasOther && selected.includes("other") && !hasValue(answers[`${question.id}_other`])) {
        pushIssue(question.id, "Uzupełnij pole \"Inne\".");
      }
      return;
    }

    if (question.kind === "text") {
      const value = answers[question.id];
      if (question.required && !hasValue(value)) {
        pushIssue(question.id, "Brak wymaganej odpowiedzi.");
      }
      if (question.minLength && typeof value === "string" && value.trim().length < question.minLength) {
        pushIssue(question.id, `Odpowiedź jest za krótka (min. ${question.minLength} znaków).`);
      }
      return;
    }

    if (question.kind === "pairedLevel") {
      if (!hasValue(answers[`${question.id}_before`])) {
        pushIssue(question.id, "Uzupełnij poziom PRZED.");
      }
      if (!hasValue(answers[`${question.id}_now`])) {
        pushIssue(question.id, "Uzupełnij poziom TERAZ.");
      }
      return;
    }

    if (question.kind === "matrix") {
      if (question.mode === "single-choice") {
        question.rows.forEach((row) => {
          if (!hasValue(answers[`${question.id}_${row.value}`])) {
            pushIssue(question.id, `Brak odpowiedzi dla: ${row.label}`);
          }
        });
        return;
      }

      question.rows.forEach((row) => {
        question.columns.forEach((column) => {
          if (!hasValue(answers[`${question.id}_${row.value}_${column.value}`])) {
            pushIssue(question.id, `Brak odpowiedzi dla: ${row.label} / ${column.label}`);
          }
        });
      });
    }
  });

  return issues;
}

function renderQuestion(
  question: SectionQuestion,
  answers: SurveyAnswers,
  onSingle: (key: string, value: string) => void,
  onMulti: (key: string, value: string) => void,
  onText: (key: string, value: string) => void,
  issueMessages: string[],
) {
  const hasError = issueMessages.length > 0;
  const baseFieldsetClass = `space-y-3 border p-4 ${hasError ? "border-red-600 dark:border-red-500 bg-red-50/40 dark:bg-red-950/20" : "border-border"}`;

  if (question.kind === "single") {
    return (
      <fieldset key={question.id} className={baseFieldsetClass}>
        <legend className="font-semibold">{question.label} *</legend>
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.value} className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name={question.id}
                className="mt-1"
                checked={answers[question.id] === option.value}
                onChange={() => onSingle(question.id, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {question.hasOther && answers[question.id] === "other" && (
          <input
            type="text"
            className="h-10 w-full border border-input bg-background px-3 text-sm"
            placeholder="Doprecyzuj"
            value={typeof answers[`${question.id}_other`] === "string" ? answers[`${question.id}_other`] : ""}
            onChange={(event) => onText(`${question.id}_other`, event.target.value)}
          />
        )}
        {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
      </fieldset>
    );
  }

  if (question.kind === "multi") {
    const selected = Array.isArray(answers[question.id]) ? answers[question.id] : [];
    return (
      <fieldset key={question.id} className={baseFieldsetClass}>
        <legend className="font-semibold">{question.label} *</legend>
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.value} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(option.value)}
                onChange={() => onMulti(question.id, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {question.hasOther && selected.includes("other") && (
          <input
            type="text"
            className="h-10 w-full border border-input bg-background px-3 text-sm"
            placeholder="Doprecyzuj"
            value={typeof answers[`${question.id}_other`] === "string" ? answers[`${question.id}_other`] : ""}
            onChange={(event) => onText(`${question.id}_other`, event.target.value)}
          />
        )}
        {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
      </fieldset>
    );
  }

  if (question.kind === "text") {
    const answerValue = answers[question.id];
    const value = typeof answerValue === "string" ? answerValue : "";
    const minLength = question.minLength ?? 0;
    const remaining = Math.max(minLength - value.trim().length, 0);
    const lengthOk = minLength === 0 || remaining === 0;

    return (
      <fieldset key={question.id} className={baseFieldsetClass}>
        <legend className="font-semibold">
          {question.label}
          {question.required ? " *" : ""}
        </legend>
        {question.textarea ? (
          <textarea
            className="min-h-32 w-full border border-input bg-background px-3 py-2 text-sm"
            value={value}
            placeholder={question.placeholder}
            onChange={(event) => onText(question.id, event.target.value)}
          />
        ) : (
          <input
            type="text"
            className="h-10 w-full border border-input bg-background px-3 text-sm"
            value={value}
            placeholder={question.placeholder}
            onChange={(event) => onText(question.id, event.target.value)}
          />
        )}
        {minLength > 0 ? (
          <p
            className={`text-xs ${
              lengthOk ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
            }`}
          >
            {lengthOk
              ? `Odpowiedź ma wymaganą długość (min. ${minLength} znaków).`
              : `Brakuje jeszcze ${remaining} znaków (min. ${minLength}).`}
          </p>
        ) : null}
        {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
      </fieldset>
    );
  }

  if (question.kind === "pairedLevel") {
    return (
      <fieldset key={question.id} className={baseFieldsetClass}>
        <legend className="font-semibold">{question.label} *</legend>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">{question.beforeLabel}</p>
            {question.options.map((option) => (
              <label key={`${question.id}-before-${option.value}`} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`${question.id}_before`}
                  className="mt-1"
                  checked={answers[`${question.id}_before`] === option.value}
                  onChange={() => onSingle(`${question.id}_before`, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{question.nowLabel}</p>
            {question.options.map((option) => (
              <label key={`${question.id}-now-${option.value}`} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`${question.id}_now`}
                  className="mt-1"
                  checked={answers[`${question.id}_now`] === option.value}
                  onChange={() => onSingle(`${question.id}_now`, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
      </fieldset>
    );
  }

  if (question.kind === "matrix" && question.mode === "single-choice") {
    return (
      <fieldset key={question.id} className={baseFieldsetClass}>
        <legend className="font-semibold">{question.label} *</legend>
        <div className="space-y-3">
          {question.rows.map((row) => (
            <div key={`${question.id}_${row.value}`} className="space-y-2 border border-border/70 p-3">
              <p className="text-sm font-medium">{row.label}</p>
              <select
                className="h-10 w-full border border-input bg-background px-3 text-sm"
                value={typeof answers[`${question.id}_${row.value}`] === "string" ? answers[`${question.id}_${row.value}`] : ""}
                onChange={(event) => onSingle(`${question.id}_${row.value}`, event.target.value)}
              >
                <option value="">Wybierz</option>
                {question.columns.map((column) => (
                  <option key={column.value} value={column.value}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
      </fieldset>
    );
  }

  if (question.kind === "matrix" && question.mode === "dual-scale") {
    return (
      <fieldset key={question.id} className={baseFieldsetClass}>
        <legend className="font-semibold">{question.label} *</legend>
        <div className="space-y-3">
          {question.rows.map((row) => (
            <div key={`${question.id}_${row.value}`} className="grid gap-2 border border-border/70 p-3 md:grid-cols-3 md:items-center">
              <p className="text-sm font-medium md:col-span-1">{row.label}</p>
              <select
                className="h-10 border border-input bg-background px-3 text-sm"
                value={typeof answers[`${question.id}_${row.value}_before`] === "string" ? answers[`${question.id}_${row.value}_before`] : ""}
                onChange={(event) => onSingle(`${question.id}_${row.value}_before`, event.target.value)}
              >
                <option value="">PRZED (1-5)</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              <select
                className="h-10 border border-input bg-background px-3 text-sm"
                value={typeof answers[`${question.id}_${row.value}_now`] === "string" ? answers[`${question.id}_${row.value}_now`] : ""}
                onChange={(event) => onSingle(`${question.id}_${row.value}_now`, event.target.value)}
              >
                <option value="">TERAZ (1-5)</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          ))}
        </div>
        {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
      </fieldset>
    );
  }

  return (
    <fieldset key={question.id} className={baseFieldsetClass}>
      <legend className="font-semibold">{question.label} *</legend>
      <div className="space-y-3">
        {question.rows.map((row) => (
          <div key={`${question.id}_${row.value}`} className="grid gap-2 border border-border/70 p-3 md:grid-cols-3 md:items-center">
            <p className="text-sm font-medium md:col-span-1">{row.label}</p>
            <select
              className="h-10 border border-input bg-background px-3 text-sm"
              value={typeof answers[`${question.id}_${row.value}_before`] === "string" ? answers[`${question.id}_${row.value}_before`] : ""}
              onChange={(event) => onSingle(`${question.id}_${row.value}_before`, event.target.value)}
            >
              <option value="">PRZED</option>
              <option value="yes">Tak</option>
              <option value="no">Nie</option>
            </select>
            <select
              className="h-10 border border-input bg-background px-3 text-sm"
              value={typeof answers[`${question.id}_${row.value}_now`] === "string" ? answers[`${question.id}_${row.value}_now`] : ""}
              onChange={(event) => onSingle(`${question.id}_${row.value}_now`, event.target.value)}
            >
              <option value="">TERAZ</option>
              <option value="yes">Tak</option>
              <option value="no">Nie</option>
            </select>
          </div>
        ))}
      </div>
      {hasError ? <p className="text-xs text-red-700 dark:text-red-300">{issueMessages[0]}</p> : null}
    </fieldset>
  );
}

export function SurveyWizard() {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [startedAt] = useState<number>(() => Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [isSurveyOpen, setIsSurveyOpen] = useState(true);
  const [blockedReason, setBlockedReason] = useState<string>("");
  const [statusError, setStatusError] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(DEVICE_LOCK_KEY) === "1";
  });

  const section = SURVEY_SECTIONS[sectionIndex];
  const isLastSection = sectionIndex === SURVEY_SECTIONS.length - 1;
  const progress = ((sectionIndex + 1) / SURVEY_SECTIONS.length) * 100;

  const questionIssues = useMemo(() => getQuestionIssues(section, answers), [answers, section]);
  const sectionErrors = useMemo(
    () => Object.values(questionIssues).flat(),
    [questionIssues],
  );

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch("/api/ankieta/status", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          isOpen?: boolean;
          blockedReason?: string | null;
          error?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Nie udało się pobrać statusu ankiety.");
        }

        setIsSurveyOpen(Boolean(payload.isOpen));
        setBlockedReason(payload.blockedReason ?? "");
      } catch (error) {
        setStatusError(error instanceof Error ? error.message : "Błąd pobierania statusu.");
      }
    };

    loadStatus().catch(() => undefined);
  }, []);

  const setSingle = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const toggleMulti = (key: string, value: string) => {
    setAnswers((current) => {
      const selected = Array.isArray(current[key]) ? current[key] : [];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return { ...current, [key]: next };
    });
  };

  const setText = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const nextSection = () => {
    if (sectionErrors.length > 0) {
      setSubmitError("Uzupełnij wszystkie wymagane pola w tej sekcji.");
      return;
    }
    setSubmitError("");
    setSectionIndex((current) => Math.min(current + 1, SURVEY_SECTIONS.length - 1));
  };

  const previousSection = () => {
    setSubmitError("");
    setSectionIndex((current) => Math.max(current - 1, 0));
  };

  const submitSurvey = async () => {
    if (sectionErrors.length > 0) {
      setSubmitError("Uzupełnij wszystkie wymagane pola przed wysłaniem.");
      return;
    }

    setSubmitState("submitting");
    setSubmitError("");

    try {
      const response = await fetch("/api/ankieta/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          startedAt,
          honeypot,
        }),
      });

      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Nie udało się wysłać ankiety.");
      }

      window.localStorage.setItem(DEVICE_LOCK_KEY, "1");
      setIsLocked(true);
      setSubmitState("success");
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "Wystąpił nieznany błąd.");
    }
  };

  if (isLocked && submitState !== "success") {
    return (
      <section className="border border-border bg-card p-6">
        <h1 className="text-2xl font-black">Ankieta została już wypełniona na tym urządzeniu.</h1>
        <p className="mt-3 text-muted-foreground">
          Dziękujemy za udział. Zgodnie z ustawieniami formularza nie można wysłać odpowiedzi drugi raz z tego samego urządzenia.
        </p>
      </section>
    );
  }

  if (submitState === "success") {
    return (
      <section className="space-y-4 border border-border bg-card p-6">
        <h1 className="text-2xl font-black">Dziękujemy serdecznie za udział w ankiecie!</h1>
        <p className="text-muted-foreground">
          Twoja anonimowa odpowiedź została zapisana. Jeśli chcesz być na bieżąco z kolejnymi inicjatywami, dołącz do Koła Naukowego Zarządzania Informacją UJ.
        </p>
        <Link
          href="https://forms.cloud.microsoft/e/BK6NYkxNuj"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          Dołącz do Koła Naukowego Zarządzania Informacją UJ
        </Link>
      </section>
    );
  }

  if (!isSurveyOpen) {
    return (
      <section className="space-y-4 border border-border bg-card p-6">
        <h1 className="text-2xl font-black">Ankieta jest obecnie wstrzymana.</h1>
        <p className="text-muted-foreground">
          {blockedReason || "Wypełnianie ankiety zostało czasowo zablokowane przez administratora."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 border border-border bg-card p-6">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase text-muted-foreground">
          Krok {sectionIndex + 1} z {SURVEY_SECTIONS.length}
        </p>
        <h1 className="text-3xl font-black">{section.title}</h1>
        {section.description ? <p className="text-muted-foreground">{section.description}</p> : null}
      </div>

      <div className="h-2 w-full bg-muted">
        <div className="h-2 bg-foreground transition-all" style={{ width: `${progress}%` }} />
      </div>

      {section.id === "H" ? (
        <div className="border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Administratorem danych w ramach ewaluacji projektu jest realizator programu AI Literacy Lab. Dane są przetwarzane anonimowo, wyłącznie do celów oceny jakości warsztatów, raportowania ID.UJ oraz ewentualnych analiz naukowych w obszarze dydaktyki i AI literacy.
        </div>
      ) : null}

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
      />

      <div className="space-y-4">
        {section.questions.map((question) =>
          renderQuestion(
            question,
            answers,
            setSingle,
            toggleMulti,
            setText,
            questionIssues[question.id] ?? [],
          ),
        )}
      </div>

      {submitError ? <p className="text-sm font-semibold text-foreground">{submitError}</p> : null}
      {statusError ? <p className="text-sm font-semibold text-foreground">{statusError}</p> : null}
      {sectionErrors.length > 0 ? (
        <p className="text-sm text-muted-foreground">Brakujące pola w tej sekcji: {sectionErrors.length}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button variant="outline" onClick={previousSection} disabled={sectionIndex === 0}>
          Wstecz
        </Button>
        {!isLastSection ? (
          <Button onClick={nextSection}>Dalej</Button>
        ) : (
          <Button onClick={submitSurvey} disabled={submitState === "submitting"}>
            {submitState === "submitting" ? "Wysyłanie..." : "Wyślij anonimową ankietę"}
          </Button>
        )}
      </div>
    </section>
  );
}
