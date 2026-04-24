"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  QUIZ_M1_DURATION_SECONDS,
  QUIZ_M1_MAX_VIOLATIONS,
  type MatchingQuestion,
  type MultipleChoiceQuestion,
  type QuizQuestion,
  quizM1Questions,
  quizM1Sources,
  type SequenceQuestion,
  type SingleChoiceQuestion,
} from "@/lib/quiz-m1";

type QuizStatus = "idle" | "running" | "finished" | "invalidated";

type PreparedQuestion =
  | {
      kind: "single";
      question: SingleChoiceQuestion;
      options: Array<{ id: string; text: string }>;
    }
  | {
      kind: "multiple";
      question: MultipleChoiceQuestion;
      options: Array<{ id: string; text: string }>;
    }
  | {
      kind: "sequence";
      question: SequenceQuestion;
      initialOrder: string[];
    }
  | {
      kind: "matching";
      question: MatchingQuestion;
      leftOrder: string[];
      rightOrder: string[];
    };

type UserAnswer =
  | { kind: "single"; value: string | null }
  | { kind: "multiple"; value: string[] }
  | { kind: "sequence"; value: string[] }
  | { kind: "matching"; value: Record<string, string> };

type QuestionReport = {
  questionId: string;
  title: string;
  prompt: string;
  earned: number;
  max: number;
  userAnswerText: string;
  correctAnswerText: string;
  explanation: string;
  sourceIds: string[];
};

type FinalReport = {
  total: number;
  max: number;
  percent: number;
  details: QuestionReport[];
  reason: "completed" | "timeout" | "violations";
};

const KEY_COMBOS_BLOCKED = [
  "F12",
  "PrintScreen",
  "Control+Shift+I",
  "Control+Shift+J",
  "Control+Shift+C",
  "Control+Shift+K",
  "Control+U",
  "Control+S",
  "Control+P",
  "Control+C",
  "Control+V",
  "Control+X",
  "Meta+Alt+I",
  "Meta+Shift+C",
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildPreparedQuestions(): PreparedQuestion[] {
  const questionOrder = shuffle(quizM1Questions);

  return questionOrder.map((question): PreparedQuestion => {
    if (question.kind === "single") {
      return {
        kind: "single",
        question,
        options: shuffle(question.options),
      };
    }

    if (question.kind === "multiple") {
      return {
        kind: "multiple",
        question,
        options: shuffle(question.options),
      };
    }

    if (question.kind === "sequence") {
      return {
        kind: "sequence",
        question,
        initialOrder: shuffle(question.items.map((item) => item.id)),
      };
    }

    return {
      kind: "matching",
      question,
      leftOrder: shuffle(question.leftItems.map((item) => item.id)),
      rightOrder: shuffle(question.rightItems.map((item) => item.id)),
    };
  });
}

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function keyComboFromEvent(event: KeyboardEvent): string {
  const segments: string[] = [];

  if (event.ctrlKey) {
    segments.push("Control");
  }

  if (event.metaKey) {
    segments.push("Meta");
  }

  if (event.altKey) {
    segments.push("Alt");
  }

  if (event.shiftKey) {
    segments.push("Shift");
  }

  const normalizedKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  segments.push(normalizedKey);

  return segments.join("+");
}

function getCorrectAnswerText(question: QuizQuestion): string {
  if (question.kind === "single") {
    return question.options.find((option) => option.id === question.correctOptionId)?.text ?? "";
  }

  if (question.kind === "multiple") {
    return question.options
      .filter((option) => question.correctOptionIds.includes(option.id))
      .map((option) => option.text)
      .join(" | ");
  }

  if (question.kind === "sequence") {
    return question.correctOrder
      .map((itemId) => question.items.find((item) => item.id === itemId)?.text ?? "")
      .join(" -> ");
  }

  return question.leftItems
    .map((left) => {
      const rightId = question.correctPairs[left.id];
      const right = question.rightItems.find((item) => item.id === rightId);
      return `${left.text} -> ${right?.text ?? ""}`;
    })
    .join(" | ");
}

function isQuestionAnswered(question: PreparedQuestion, answer: UserAnswer | undefined): boolean {
  if (!answer) {
    return false;
  }

  if (question.kind === "single") {
    return answer.kind === "single" && Boolean(answer.value);
  }

  if (question.kind === "multiple") {
    return answer.kind === "multiple" && answer.value.length > 0;
  }

  if (question.kind === "sequence") {
    return answer.kind === "sequence" && answer.value.length === question.question.items.length;
  }

  return (
    answer.kind === "matching" &&
    question.question.leftItems.every((leftItem) => {
      const selected = answer.value[leftItem.id];
      return Boolean(selected);
    })
  );
}

function defaultAnswers(preparedQuestions: PreparedQuestion[]): Record<string, UserAnswer> {
  const initial: Record<string, UserAnswer> = {};

  preparedQuestions.forEach((prepared) => {
    const questionId = prepared.question.id;

    if (prepared.kind === "single") {
      initial[questionId] = { kind: "single", value: null };
      return;
    }

    if (prepared.kind === "multiple") {
      initial[questionId] = { kind: "multiple", value: [] };
      return;
    }

    if (prepared.kind === "sequence") {
      initial[questionId] = { kind: "sequence", value: [...prepared.initialOrder] };
      return;
    }

    const matchingAnswer: Record<string, string> = {};
    prepared.question.leftItems.forEach((left) => {
      matchingAnswer[left.id] = "";
    });

    initial[questionId] = { kind: "matching", value: matchingAnswer };
  });

  return initial;
}

function QuizM1Client() {
  const [status, setStatus] = useState<QuizStatus>("idle");
  const [preparedQuestions, setPreparedQuestions] = useState<PreparedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [violations, setViolations] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(QUIZ_M1_DURATION_SECONDS);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const lastViolationAtRef = useRef<number>(0);

  const sourceMap = useMemo(() => {
    return Object.fromEntries(quizM1Sources.map((source) => [source.id, source]));
  }, []);

  const currentQuestion = preparedQuestions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.question.id] : undefined;

  const finalizeQuiz = useCallback((reason: FinalReport["reason"], nextViolations?: string[]) => {
    if (status !== "running") {
      return;
    }

    const details: QuestionReport[] = preparedQuestions.map((prepared) => {
      const question = prepared.question;
      const answer = answers[question.id];

      if (!answer) {
        return {
          questionId: question.id,
          title: question.title,
          prompt: question.prompt,
          earned: 0,
          max: 1,
          userAnswerText: "Brak odpowiedzi",
          correctAnswerText: getCorrectAnswerText(question),
          explanation: question.explanation,
          sourceIds: question.sourceIds,
        };
      }

      if (question.kind === "single" && answer.kind === "single") {
        const selectedText = question.options.find((option) => option.id === answer.value)?.text ?? "Brak odpowiedzi";
        const earned = answer.value === question.correctOptionId ? 1 : 0;

        return {
          questionId: question.id,
          title: question.title,
          prompt: question.prompt,
          earned,
          max: 1,
          userAnswerText: selectedText,
          correctAnswerText: getCorrectAnswerText(question),
          explanation: question.explanation,
          sourceIds: question.sourceIds,
        };
      }

      if (question.kind === "multiple" && answer.kind === "multiple") {
        const selectedSet = new Set(answer.value);
        const correctSet = new Set(question.correctOptionIds);
        const incorrectPool = question.options.filter((option) => !correctSet.has(option.id));

        const correctlySelected = answer.value.filter((optionId) => correctSet.has(optionId)).length;
        const incorrectlySelected = answer.value.filter((optionId) => !correctSet.has(optionId)).length;
        const positivePart = correctlySelected / question.correctOptionIds.length;
        const negativePart = incorrectlySelected / Math.max(incorrectPool.length, 1);
        const earned = Math.max(0, Number((positivePart - negativePart).toFixed(2)));

        const selectedText =
          question.options
            .filter((option) => selectedSet.has(option.id))
            .map((option) => option.text)
            .join(" | ") || "Brak odpowiedzi";

        return {
          questionId: question.id,
          title: question.title,
          prompt: question.prompt,
          earned,
          max: 1,
          userAnswerText: selectedText,
          correctAnswerText: getCorrectAnswerText(question),
          explanation: question.explanation,
          sourceIds: question.sourceIds,
        };
      }

      if (question.kind === "sequence" && answer.kind === "sequence") {
        const perfect = answer.value.join("|") === question.correctOrder.join("|");
        const userSequence = answer.value
          .map((id) => question.items.find((item) => item.id === id)?.text ?? "")
          .join(" -> ");

        return {
          questionId: question.id,
          title: question.title,
          prompt: question.prompt,
          earned: perfect ? 1 : 0,
          max: 1,
          userAnswerText: userSequence,
          correctAnswerText: getCorrectAnswerText(question),
          explanation: question.explanation,
          sourceIds: question.sourceIds,
        };
      }

      if (question.kind === "matching" && answer.kind === "matching") {
        const perfect = question.leftItems.every((left) => answer.value[left.id] === question.correctPairs[left.id]);
        const userPairs = question.leftItems
          .map((left) => {
            const rightId = answer.value[left.id];
            const right = question.rightItems.find((item) => item.id === rightId);
            return `${left.text} -> ${right?.text ?? "brak"}`;
          })
          .join(" | ");

        return {
          questionId: question.id,
          title: question.title,
          prompt: question.prompt,
          earned: perfect ? 1 : 0,
          max: 1,
          userAnswerText: userPairs,
          correctAnswerText: getCorrectAnswerText(question),
          explanation: question.explanation,
          sourceIds: question.sourceIds,
        };
      }

      return {
        questionId: question.id,
        title: question.title,
        prompt: question.prompt,
        earned: 0,
        max: 1,
        userAnswerText: "Brak odpowiedzi",
        correctAnswerText: getCorrectAnswerText(question),
        explanation: question.explanation,
        sourceIds: question.sourceIds,
      };
    });

    const total = Number(details.reduce((sum, item) => sum + item.earned, 0).toFixed(2));
    const max = details.length;
    const percent = Number(((total / Math.max(max, 1)) * 100).toFixed(2));

    setReport({
      total,
      max,
      percent,
      details,
      reason,
    });

    if (reason === "violations") {
      setViolations(nextViolations ?? []);
      setStatus("invalidated");
      return;
    }

    setStatus("finished");
  }, [answers, preparedQuestions, status]);

  const registerViolation = useCallback((reason: string) => {
    const now = Date.now();
    if (now - lastViolationAtRef.current < 1200) {
      return;
    }

    lastViolationAtRef.current = now;

    setViolations((prev) => {
      const next = [...prev, `${prev.length + 1}. ${reason}`];
      if (next.length >= QUIZ_M1_MAX_VIOLATIONS) {
        finalizeQuiz("violations", next);
      }
      return next;
    });
  }, [finalizeQuiz]);

  const startQuiz = async () => {
    const nextPrepared = buildPreparedQuestions();
    setPreparedQuestions(nextPrepared);
    setAnswers(defaultAnswers(nextPrepared));
    setCurrentIndex(0);
    setViolations([]);
    setReport(null);
    setStartError(null);
    setRemainingSeconds(QUIZ_M1_DURATION_SECONDS);
    startedAtRef.current = Date.now();

    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(Boolean(document.fullscreenElement));
      setStatus("running");
    } catch {
      setStatus("idle");
      setStartError("Nie udało się uruchomić pełnego ekranu. Test wymaga trybu pełnoekranowego.");
    }
  };

  const restartQuiz = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }

    setStatus("idle");
    setPreparedQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setViolations([]);
    setReport(null);
    setRemainingSeconds(QUIZ_M1_DURATION_SECONDS);
    setIsFullscreen(false);
    setStartError(null);
    startedAtRef.current = null;
  };

  const requestFullscreenAgain = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(Boolean(document.fullscreenElement));
    } catch {
      registerViolation("Odmowa wejścia w tryb pełnoekranowy.");
    }
  };

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        registerViolation("Wyjście z trybu pełnoekranowego.");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        registerViolation("Wykryto przełączenie karty lub minimalizację okna.");
      }
    };

    const onBlur = () => {
      registerViolation("Wykryto utratę fokusu okna.");
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
      registerViolation("Próba użycia prawego przycisku myszy.");
    };

    const onCopyLike = (event: Event) => {
      event.preventDefault();
      registerViolation("Próba kopiowania, wklejania lub wycinania treści.");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const combo = keyComboFromEvent(event);
      if (KEY_COMBOS_BLOCKED.includes(combo)) {
        event.preventDefault();
        registerViolation(`Próba użycia skrótu klawiszowego (${combo}).`);
      }
    };

    const devtoolsInterval = window.setInterval(() => {
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);
      if (widthGap > 160 || heightGap > 160) {
        registerViolation("Wykryto otwarte narzędzia deweloperskie.");
      }
    }, 2000);

    window.addEventListener("blur", onBlur);
    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("copy", onCopyLike);
    window.addEventListener("cut", onCopyLike);
    window.addEventListener("paste", onCopyLike);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(devtoolsInterval);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("copy", onCopyLike);
      window.removeEventListener("cut", onCopyLike);
      window.removeEventListener("paste", onCopyLike);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [registerViolation, status]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const timer = window.setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }

      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const remaining = Math.max(QUIZ_M1_DURATION_SECONDS - elapsed, 0);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
        finalizeQuiz("timeout");
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [finalizeQuiz, status]);

  const updateSingle = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        kind: "single",
        value: optionId,
      },
    }));
  };

  const toggleMultiple = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      if (!current || current.kind !== "multiple") {
        return prev;
      }

      const next = current.value.includes(optionId)
        ? current.value.filter((value) => value !== optionId)
        : [...current.value, optionId];

      return {
        ...prev,
        [questionId]: {
          kind: "multiple",
          value: next,
        },
      };
    });
  };

  const moveSequenceItem = (questionId: string, fromIndex: number, toIndex: number) => {
    if (toIndex < 0) {
      return;
    }

    setAnswers((prev) => {
      const current = prev[questionId];
      if (!current || current.kind !== "sequence") {
        return prev;
      }

      if (toIndex >= current.value.length) {
        return prev;
      }

      const nextOrder = [...current.value];
      const [moved] = nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, moved);

      return {
        ...prev,
        [questionId]: {
          kind: "sequence",
          value: nextOrder,
        },
      };
    });
  };

  const setMatching = (questionId: string, leftId: string, rightId: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      if (!current || current.kind !== "matching") {
        return prev;
      }

      return {
        ...prev,
        [questionId]: {
          kind: "matching",
          value: {
            ...current.value,
            [leftId]: rightId,
          },
        },
      };
    });
  };

  const nextQuestion = () => {
    if (!currentQuestion) {
      return;
    }

    if (!isQuestionAnswered(currentQuestion, currentAnswer)) {
      return;
    }

    if (currentIndex === preparedQuestions.length - 1) {
      finalizeQuiz("completed");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="container-wide py-14">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase text-muted-foreground">Quiz Pre-Moduł 1</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Sprawdź się z wiedzy o AI</h1>
        <p className="max-w-3xl text-muted-foreground">
          Test zawiera 14 pytań i trwa 5 minut. Wymagany jest pełny ekran. Po 3 naruszeniach zasad próba zostaje
          unieważniona.
        </p>
      </header>

      {status === "idle" && (
        <section className="space-y-5 border border-border bg-card p-6">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Tryb: 1 pytanie na ekran, losowa kolejność pytań i odpowiedzi.</li>
            <li>Punktacja: single 1 pkt, multiple częściowo punktowane z karą, sequence/matching 1 pkt tylko za pełną poprawność.</li>
            <li>Zabezpieczenia: są. I tyle powiem w tym temacie xd.</li>
          </ul>
          {startError && <p className="text-sm font-semibold text-foreground">{startError}</p>}
          <Button onClick={startQuiz}>Rozpocznij quiz</Button>
        </section>
      )}

      {status === "invalidated" && report && (
        <section className="space-y-6 border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">Wynik końcowy</p>
              <p className="text-2xl font-black">Próba unieważniona</p>
            </div>
            <div className="space-y-1 text-right text-sm">
              <p className="text-muted-foreground">Powód zakończenia: naruszenia</p>
              <Button variant="outline" onClick={restartQuiz}>Zacznij jeszcze raz</Button>
            </div>
          </div>

          <div className="border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Próba została unieważniona po 3 naruszeniach zasad.</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {violations.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {status === "finished" && report && (
        <section className="space-y-6 border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">Wynik końcowy</p>
              <p className="text-2xl font-black">{report.total.toFixed(2)} / {report.max} pkt ({report.percent.toFixed(2)}%)</p>
            </div>
            <div className="space-y-1 text-right text-sm">
              <p className="text-muted-foreground">Powód zakończenia: {report.reason === "completed" ? "ukończono" : report.reason === "timeout" ? "limit czasu" : "naruszenia"}</p>
              <Button variant="outline" onClick={restartQuiz}>Zacznij jeszcze raz</Button>
            </div>
          </div>

          <div className="border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Raport zawiera wszystkie odpowiedzi, poprawne rozwiązania, uzasadnienia oraz źródła.
          </div>

          <div className="space-y-5">
            {report.details.map((item) => (
              <article key={item.questionId} className="space-y-3 border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold">{item.title}</h2>
                  <p className="font-mono text-xs uppercase text-muted-foreground">{item.earned.toFixed(2)} / {item.max.toFixed(2)} pkt</p>
                </div>
                <p className="text-sm">{item.prompt}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Twoja odpowiedź:</span> {item.userAnswerText}</p>
                  <p><span className="font-semibold">Poprawna odpowiedź:</span> {item.correctAnswerText}</p>
                  <p className="text-muted-foreground">{item.explanation}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Źródła:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {item.sourceIds.map((sourceId) => {
                      const source = sourceMap[sourceId];
                      if (!source) {
                        return null;
                      }

                      return (
                        <li key={`${item.questionId}-${source.id}`}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                            {source.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <h2 className="mb-2 text-lg font-bold">Naukowe pierdololo</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {quizM1Sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {status === "running" && currentQuestion && !report && (
        <section className="space-y-6 border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="font-mono text-xs uppercase text-muted-foreground">
              Pytanie {currentIndex + 1} / {preparedQuestions.length}
            </p>
            <div className="text-right">
              <p className="font-mono text-xs uppercase text-muted-foreground">Czas</p>
              <p className="text-xl font-black">{formatSeconds(remainingSeconds)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">{currentQuestion.question.title}</h2>
            <p className="text-muted-foreground">{currentQuestion.question.prompt}</p>
          </div>

          {!isFullscreen && (
            <div className="space-y-3 border border-border bg-muted/50 p-4">
              <p className="text-sm font-semibold">Treść quizu jest ukryta poza trybem pełnoekranowym.</p>
              <Button onClick={requestFullscreenAgain}>Wróć do pełnego ekranu</Button>
            </div>
          )}

          {isFullscreen && (
            <>
              {currentQuestion.kind === "single" && currentAnswer?.kind === "single" && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer gap-3 border border-border p-3">
                      <input
                        type="radio"
                        name={currentQuestion.question.id}
                        checked={currentAnswer.value === option.id}
                        onChange={() => updateSingle(currentQuestion.question.id, option.id)}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.kind === "multiple" && currentAnswer?.kind === "multiple" && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer gap-3 border border-border p-3">
                      <input
                        type="checkbox"
                        checked={currentAnswer.value.includes(option.id)}
                        onChange={() => toggleMultiple(currentQuestion.question.id, option.id)}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.kind === "sequence" && currentAnswer?.kind === "sequence" && (
                <ol className="space-y-2">
                  {currentAnswer.value.map((itemId, index) => {
                    const item = currentQuestion.question.items.find((entry) => entry.id === itemId);
                    if (!item) {
                      return null;
                    }

                    return (
                      <li key={item.id} className="flex items-center justify-between gap-4 border border-border p-3">
                        <span className="text-sm"><span className="font-mono text-xs">{index + 1}.</span> {item.text}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveSequenceItem(currentQuestion.question.id, index, index - 1)}
                          >
                            W górę
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveSequenceItem(currentQuestion.question.id, index, index + 1)}
                          >
                            W dół
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {currentQuestion.kind === "matching" && currentAnswer?.kind === "matching" && (
                <div className="space-y-3">
                  {currentQuestion.leftOrder.map((leftId) => {
                    const left = currentQuestion.question.leftItems.find((entry) => entry.id === leftId);
                    if (!left) {
                      return null;
                    }

                    return (
                      <div key={left.id} className="grid gap-2 border border-border p-3 md:grid-cols-2 md:items-center">
                        <p className="font-semibold">{left.text}</p>
                        <select
                          className="h-9 rounded-sm border border-input bg-background px-2 text-sm"
                          value={currentAnswer.value[left.id] ?? ""}
                          onChange={(event) => setMatching(currentQuestion.question.id, left.id, event.target.value)}
                        >
                          <option value="">Wybierz dopasowanie</option>
                          {currentQuestion.rightOrder.map((rightId) => {
                            const right = currentQuestion.question.rightItems.find((entry) => entry.id === rightId);
                            if (!right) {
                              return null;
                            }

                            return (
                              <option key={right.id} value={right.id}>
                                {right.text}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Naruszenia: {violations.length}/{QUIZ_M1_MAX_VIOLATIONS}
                </p>
                <Button onClick={nextQuestion} disabled={!isQuestionAnswered(currentQuestion, currentAnswer)}>
                  {currentIndex === preparedQuestions.length - 1 ? "Zakończ quiz" : "Dalej"}
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export { QuizM1Client };
