"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AntiCheat, type Threat } from "@/components/live/AntiCheat";
import { saveModuleProgress } from "@/lib/live/progress";
import type { QuizAnswer, QuizQuestion } from "@/lib/live/types";

const SECONDS_PER_QUESTION = 45;

interface AntiCheatNotice {
  threat: Threat;
  detectedAt: number;
  message: string;
  isError: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface PreparedQuestion extends QuizQuestion {
  shuffledOptions: string[];
  shuffledCorrectIndex: number;
}

function prepareQuestions(questions: QuizQuestion[]): PreparedQuestion[] {
  return shuffleArray(questions).map((q) => {
    const indices = shuffleArray([0, 1, 2, 3]);
    return {
      ...q,
      shuffledOptions: indices.map((i) => q.options[i]),
      shuffledCorrectIndex: indices.indexOf(q.correctIndex),
    };
  });
}

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimerBar({ timeLeft }: { timeLeft: number }) {
  const pct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const urgent = timeLeft <= 10;
  return (
    <div className="h-1.5 w-full overflow-hidden bg-muted">
      <div
        className={`h-full transition-all duration-1000 ease-linear ${urgent ? "bg-red-500" : "bg-primary"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TopicBadge({ topic }: { topic: string }) {
  return (
    <span className="inline-block border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {topic}
    </span>
  );
}

interface OptionButtonProps {
  label: string;
  text: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

function OptionButton({ label, text, selected, disabled, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 border px-4 py-3 text-left text-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      <span className="mt-px shrink-0 font-mono text-xs font-bold opacity-60">{label}</span>
      <span className="leading-relaxed">{text}</span>
    </button>
  );
}

// ─── Anti-cheat notice ────────────────────────────────────────────────────────

function AntiCheatNoticeBox(props: {
  notice: AntiCheatNotice;
  reportFile: File | null;
  reportNote: string;
  reportMessage: string | null;
  reportPending: boolean;
  onReportFileChange: (file: File | null) => void;
  onReportNoteChange: (value: string) => void;
  onSubmitReport: () => void;
}) {
  const {
    notice,
    reportFile,
    reportNote,
    reportMessage,
    reportPending,
    onReportFileChange,
    onReportNoteChange,
    onSubmitReport,
  } = props;

  return (
    <div
      className={`mx-auto mt-6 w-full max-w-2xl space-y-3 border px-4 py-3 text-sm ${notice.isError ? "border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/20" : "border-amber-500 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20"}`}
    >
      <div className="space-y-1">
        <p className="font-semibold">Wykryto naruszenie antycheat</p>
        <p className="text-muted-foreground">{notice.threat.reason}</p>
        <p>{notice.message}</p>
      </div>

      <div className="space-y-2 border border-border bg-background p-3">
        <p className="text-xs text-muted-foreground">
          Jeśli to pomyłka, możesz zgłosić incydent do admina i dołączyć screenshot do weryfikacji.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => onReportFileChange(e.target.files?.[0] ?? null)}
          className="w-full border border-border bg-background px-2 py-1.5 text-xs"
        />
        <textarea
          value={reportNote}
          onChange={(e) => onReportNoteChange(e.target.value)}
          rows={3}
          placeholder="Opisz krótko, dlaczego to mogła być pomyłka (opcjonalnie)."
          className="w-full border border-border bg-background px-2 py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={onSubmitReport}
          disabled={!reportFile || reportPending}
          className="border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reportPending ? "Wysyłanie..." : "Zgłoś do admina"}
        </button>
        {reportMessage && <p className="text-xs text-muted-foreground">{reportMessage}</p>}
        {reportFile && <p className="text-xs text-muted-foreground">Plik: {reportFile.name}</p>}
      </div>
    </div>
  );
}

// ─── Results ─────────────────────────────────────────────────────────────────

interface ResultsProps {
  questions: PreparedQuestion[];
  answers: QuizAnswer[];
}

function Results({ questions, answers }: ResultsProps) {
  const correct = answers.filter((a) => a.correct).length;
  const total = questions.length;
  const pct = Math.round((correct / total) * 100);

  const grade =
    pct >= 90
      ? "Doskonale!"
      : pct >= 70
        ? "Dobrze!"
        : pct >= 50
          ? "Nieźle — wróć do trudniejszych tematów."
          : "Wróć do materiałów i spróbuj ponownie.";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10">
      <div className="space-y-3 border border-border p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Wyniki quizu
        </p>
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black tabular-nums">{correct}</span>
          <span className="text-2xl text-muted-foreground">/ {total}</span>
          <span className="ml-auto text-3xl font-bold tabular-nums">{pct}%</span>
        </div>
        <p className="font-medium">{grade}</p>
        <div className="h-2 w-full overflow-hidden bg-muted">
          <div
            className={`h-full ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Link
        href="/live/profil"
        className="flex items-center justify-between border border-primary bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
      >
        <span>Mój panel uczestnika</span>
        <span>→</span>
      </Link>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Omówienie odpowiedzi</h2>
        {questions.map((q, idx) => {
          const answer = answers[idx];
          const wasCorrect = answer?.correct ?? false;
          const timedOut = answer?.timedOut ?? false;
          const selectedIdx = answer?.selectedIndex ?? null;

          return (
            <div
              key={q.id}
              className={`space-y-3 border p-4 ${wasCorrect ? "border-green-400 dark:border-green-700" : "border-red-300 dark:border-red-800"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <TopicBadge topic={q.topic} />
                  <p className="font-medium leading-snug">{q.question}</p>
                </div>
                <span
                  className={`shrink-0 text-lg font-black ${wasCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {wasCorrect ? "✓" : "✗"}
                </span>
                <span className="sr-only">
                  {wasCorrect ? "Poprawna odpowiedz" : "Bledna odpowiedz"}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                {timedOut && (
                  <p className="text-yellow-700 dark:text-yellow-400">
                    Czas upłynął — brak odpowiedzi.
                  </p>
                )}
                {!timedOut && selectedIdx !== null && !wasCorrect && (
                  <p className="text-red-700 dark:text-red-400">
                    Twoja odpowiedź:{" "}
                    <strong>
                      {OPTION_LABELS[selectedIdx]}. {q.shuffledOptions[selectedIdx]}
                    </strong>
                  </p>
                )}
                <p
                  className={wasCorrect ? "text-green-700 dark:text-green-400" : "text-foreground"}
                >
                  Poprawna odpowiedź:{" "}
                  <strong>
                    {OPTION_LABELS[q.shuffledCorrectIndex]}.{" "}
                    {q.shuffledOptions[q.shuffledCorrectIndex]}
                  </strong>
                </p>
              </div>

              <details className="group">
                <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
                  Wyjaśnienie ▸
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {q.explanation}
                </p>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main QuizPlayer ──────────────────────────────────────────────────────────

interface QuizPlayerProps {
  moduleSlug: string;
  moduleTitle: string;
  moduleNumber: number;
  questions: QuizQuestion[];
  existingAttempt?: {
    score: number;
    totalQuestions: number;
    pointsEarned: number;
    completedAt: string;
  } | null;
}

type Phase = "intro" | "question" | "results";

export function QuizPlayer({
  moduleSlug,
  moduleTitle,
  moduleNumber,
  questions,
  existingAttempt,
}: QuizPlayerProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [prepared, setPrepared] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [antiCheatNotice, setAntiCheatNotice] = useState<AntiCheatNotice | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const submitRef = useRef(false);
  const advancingRef = useRef(false);
  const antiCheatHandledRef = useRef(false);

  const currentQuestion = prepared[currentIndex];

  const handleDetection = useCallback(
    async (threat: Threat) => {
      if (antiCheatHandledRef.current) return;
      antiCheatHandledRef.current = true;

      const detectedAt = Date.now();
      setAntiCheatNotice({
        threat,
        detectedAt,
        message: "Wykrycie zapisano. Trwa naliczanie kary -25 pkt.",
        isError: false,
      });

      try {
        const res = await fetch("/api/live/quiz/anti-cheat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleSlug,
            threatType: threat.type,
            threatReason: threat.reason,
            detectedAt,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          alreadyApplied?: boolean;
          pointsDelta?: number;
        } | null;

        if (!res.ok) {
          setAntiCheatNotice({
            threat,
            detectedAt,
            message:
              data?.error ??
              "Nie udało się naliczyć kary automatycznie. Możesz zgłosić to do admina ze screenshotem.",
            isError: true,
          });
          return;
        }

        if (data?.alreadyApplied) {
          setAntiCheatNotice({
            threat,
            detectedAt,
            message: "Wykrycie odnotowane. Kara za ten quiz była już wcześniej naliczona.",
            isError: false,
          });
          return;
        }

        setAntiCheatNotice({
          threat,
          detectedAt,
          message: `Naliczono karę ${data?.pointsDelta ?? -25} pkt. Quiz możesz kontynuować.`,
          isError: false,
        });
      } catch {
        setAntiCheatNotice({
          threat,
          detectedAt,
          message:
            "Nie udało się naliczyć kary automatycznie. Możesz zgłosić to do admina ze screenshotem.",
          isError: true,
        });
      }
    },
    [moduleSlug],
  );

  const submitAntiCheatReport = useCallback(async () => {
    if (!antiCheatNotice || !reportFile) return;

    setReportPending(true);
    setReportMessage(null);
    try {
      const formData = new FormData();
      formData.append("exerciseSlug", `quiz:${moduleSlug}`);
      formData.append("kind", "anti_cheat_report");
      formData.append("reportNote", reportNote);
      formData.append(
        "reportContext",
        JSON.stringify({
          moduleSlug,
          threatType: antiCheatNotice.threat.type,
          threatReason: antiCheatNotice.threat.reason,
          detectedAt: antiCheatNotice.detectedAt,
        }),
      );
      formData.append("file", reportFile);

      const res = await fetch("/api/live/screenshots/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        screenshotId?: string;
      } | null;
      if (!res.ok) {
        setReportMessage(payload?.error ?? "Nie udało się wysłać zgłoszenia.");
        return;
      }

      setReportMessage(`Zgłoszenie wysłane do admina (ID: ${payload?.screenshotId ?? "-"}).`);
      setReportFile(null);
      setReportNote("");
    } catch {
      setReportMessage("Nie udało się wysłać zgłoszenia.");
    } finally {
      setReportPending(false);
    }
  }, [antiCheatNotice, moduleSlug, reportFile, reportNote]);

  // Save progress to localStorage when quiz completes
  useEffect(() => {
    if (phase !== "results" || prepared.length === 0 || answers.length === 0) return;
    const score = answers.filter((a) => a.correct).length;
    saveModuleProgress(moduleSlug, {
      moduleSlug,
      moduleNumber,
      moduleTitle,
      score,
      total: prepared.length,
      pct: Math.round((score / prepared.length) * 100),
      completedAt: Date.now(),
      questions: prepared.map((q, i) => {
        const a = answers[i];
        return {
          questionId: q.id,
          topic: q.topic,
          question: q.question,
          correct: a?.correct ?? false,
          timedOut: a?.timedOut ?? false,
          selectedOption: a?.selectedIndex != null ? q.shuffledOptions[a.selectedIndex] : null,
          correctOption: q.shuffledOptions[q.shuffledCorrectIndex],
          explanation: q.explanation,
        };
      }),
    });

    if (submitRef.current) return;
    submitRef.current = true;

    const payloadAnswers = answers.map((answer, idx) => ({
      questionId: answer.questionId,
      selectedOption: answer.selectedIndex ?? -1,
      correct: answer.correct,
      points: answer.correct ? 10 : 0,
      questionIndex: idx,
    }));

    fetch("/api/live/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleSlug,
        totalQuestions: prepared.length,
        answers: payloadAnswers,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setSavedMessage(data.error ?? "Nie udalo sie zapisac quizu.");
          return;
        }
        if (data.alreadySubmitted) {
          setSavedMessage("Quiz byl juz zapisany w bazie.");
          return;
        }
        setSavedMessage(`Zapisano quiz. +${data.pointsEarned ?? 0} pkt`);
      })
      .catch(() => {
        setSavedMessage("Nie udalo sie zapisac quizu.");
      });
  }, [answers, moduleNumber, moduleSlug, moduleTitle, phase, prepared]);

  function startQuiz() {
    if (existingAttempt) return;

    const shuffled = prepareQuestions(questions);
    setPrepared(shuffled);
    setAnswers([]);
    setCurrentIndex(0);
    setTimeLeft(SECONDS_PER_QUESTION);
    setSelectedOption(null);
    setIsAdvancing(false);
    advancingRef.current = false;
    setPhase("question");
  }

  const advance = useCallback(
    (selectedIdx: number | null, timedOut: boolean) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setIsAdvancing(true);

      const q = prepared[currentIndex];
      const correct = selectedIdx !== null && selectedIdx === q.shuffledCorrectIndex;

      setAnswers((prev) => [
        ...prev,
        { questionId: q.id, selectedIndex: selectedIdx, correct, timedOut },
      ]);

      const delay = timedOut ? 300 : 400;
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= prepared.length) {
          setPhase("results");
        } else {
          setCurrentIndex(nextIndex);
          setTimeLeft(SECONDS_PER_QUESTION);
          setSelectedOption(null);
          setIsAdvancing(false);
          advancingRef.current = false;
        }
      }, delay);
    },
    [prepared, currentIndex],
  );

  useEffect(() => {
    if (phase !== "question") return;
    if (isAdvancing) return;
    if (timeLeft <= 0) {
      advance(null, true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft, isAdvancing, advance]);

  function handleOptionClick(optionIndex: number) {
    if (isAdvancing || selectedOption !== null) return;
    setSelectedOption(optionIndex);
    advance(optionIndex, false);
  }

  const questionKey = useMemo(
    () => `${currentIndex}-${prepared[currentIndex]?.id}`,
    [currentIndex, prepared],
  );

  // ── Intro ──
  if (phase === "intro") {
    const completedAtLabel = existingAttempt
      ? new Date(existingAttempt.completedAt).toLocaleString("pl-PL")
      : null;
    const existingPct = existingAttempt
      ? Math.round((existingAttempt.score / existingAttempt.totalQuestions) * 100)
      : null;

    return (
      <>
        <AntiCheat onDetect={handleDetection} active={!existingAttempt} />
        {antiCheatNotice && (
          <AntiCheatNoticeBox
            notice={antiCheatNotice}
            reportFile={reportFile}
            reportNote={reportNote}
            reportMessage={reportMessage}
            reportPending={reportPending}
            onReportFileChange={setReportFile}
            onReportNoteChange={setReportNote}
            onSubmitReport={submitAntiCheatReport}
          />
        )}
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Moduł {moduleNumber} — Quiz na żywo
              </p>
              <h1 className="text-3xl font-black tracking-tight">{moduleTitle}</h1>
            </div>

            <div className="space-y-2 border border-border p-5 text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Zasady quizu</p>
              <ul className="list-inside list-disc space-y-1">
                <li>{questions.length} pytań wielokrotnego wyboru</li>
                <li>{SECONDS_PER_QUESTION} sekund na każde pytanie</li>
                <li>Kolejność pytań i odpowiedzi jest losowa</li>
                <li>Wyniki i wyjaśnienia zobaczysz na końcu</li>
                <li>Naruszenie antycheat skutkuje karą -25 pkt, ale quiz trwa dalej</li>
              </ul>
            </div>

            {existingAttempt ? (
              <div className="space-y-3 border border-border bg-muted px-4 py-3 text-left text-sm">
                <p className="font-semibold text-foreground">Ten quiz jest już ukończony.</p>
                <p>
                  Wynik:{" "}
                  <strong>
                    {existingAttempt.score}/{existingAttempt.totalQuestions}
                  </strong>
                  {typeof existingPct === "number" ? ` (${existingPct}%)` : ""}
                </p>
                <p>
                  Punkty: <strong>+{existingAttempt.pointsEarned}</strong>
                </p>
                {completedAtLabel && <p>Ukończono: {completedAtLabel}</p>}
                <Link
                  href="/live/profil"
                  className="mt-2 inline-flex items-center justify-center border border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Przejdź do profilu
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={startQuiz}
                className="w-full border border-primary bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Rozpocznij quiz
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Results ──
  if (phase === "results") {
    return (
      <>
        <AntiCheat onDetect={handleDetection} active={false} />
        {antiCheatNotice && (
          <AntiCheatNoticeBox
            notice={antiCheatNotice}
            reportFile={reportFile}
            reportNote={reportNote}
            reportMessage={reportMessage}
            reportPending={reportPending}
            onReportFileChange={setReportFile}
            onReportNoteChange={setReportNote}
            onSubmitReport={submitAntiCheatReport}
          />
        )}
        {savedMessage && (
          <div className="mx-auto mt-6 w-full max-w-2xl border border-border bg-muted px-4 py-2 text-sm">
            {savedMessage}
          </div>
        )}
        <Results questions={prepared} answers={answers} />
      </>
    );
  }

  // ── Question ──
  if (!currentQuestion) return null;

  return (
    <>
      <AntiCheat onDetect={handleDetection} active={phase === "question"} />
      {antiCheatNotice && (
        <AntiCheatNoticeBox
          notice={antiCheatNotice}
          reportFile={reportFile}
          reportNote={reportNote}
          reportMessage={reportMessage}
          reportPending={reportPending}
          onReportFileChange={setReportFile}
          onReportNoteChange={setReportNote}
          onSubmitReport={submitAntiCheatReport}
        />
      )}
      <div
        key={questionKey}
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col px-4 py-6"
        style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}
      >
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">
              Pytanie {currentIndex + 1} z {prepared.length}
            </span>
            <span
              className={`font-mono tabular-nums font-bold ${timeLeft <= 10 ? "text-red-600 dark:text-red-400" : ""}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {timeLeft}s
            </span>
          </div>
          <TimerBar timeLeft={timeLeft} />

          <div className="flex gap-1">
            {prepared.map((question, i) => (
              <div
                key={question.id}
                className={`h-1 flex-1 ${
                  i < currentIndex
                    ? "bg-primary"
                    : i === currentIndex
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <TopicBadge topic={currentQuestion.topic} />
          <p className="text-base font-medium leading-relaxed sm:text-lg">
            {currentQuestion.question}
          </p>
        </div>

        <div className="space-y-2">
          {currentQuestion.shuffledOptions.map((opt, i) => (
            <OptionButton
              key={`${currentQuestion.id}-${OPTION_LABELS[i]}`}
              label={OPTION_LABELS[i]}
              text={opt}
              selected={selectedOption === i}
              disabled={isAdvancing}
              onClick={() => handleOptionClick(i)}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Kliknij wybraną odpowiedź — wyniki zobaczysz na końcu quizu
        </p>
      </div>
    </>
  );
}
