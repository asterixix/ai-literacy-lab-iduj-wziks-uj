"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  type LiveProgress,
  type ModuleProgress,
  type QuestionResult,
  readProgress,
} from "@/lib/live/progress";
import { getLiveModuleSlugs } from "@/lib/live/registry";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByTopic(
  questions: QuestionResult[],
): Record<string, { correct: number; total: number }> {
  return questions.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = { correct: 0, total: 0 };
    acc[q.topic].total++;
    if (q.correct) acc[q.topic].correct++;
    return acc;
  }, {});
}

function ScoreBadge({ pct }: { pct: number }) {
  const color =
    pct >= 70
      ? "text-green-700 dark:text-green-400"
      : pct >= 50
        ? "text-yellow-700 dark:text-yellow-400"
        : "text-red-700 dark:text-red-400";
  return <span className={`tabular-nums font-black text-2xl ${color}`}>{pct}%</span>;
}

function ModuleCard({ mod }: { mod: ModuleProgress }) {
  const [open, setOpen] = useState(false);
  const topicStats = groupByTopic(mod.questions);

  return (
    <div className="border border-border">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted transition-colors"
        aria-expanded={open}
      >
        <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
          Moduł {mod.moduleNumber}
        </span>
        <span className="flex-1 font-medium text-sm leading-snug">{mod.moduleTitle}</span>
        <div className="shrink-0 text-right space-y-0.5">
          <ScoreBadge pct={mod.pct} />
          <p className="font-mono text-xs text-muted-foreground">
            {mod.score}/{mod.total} pkt
          </p>
        </div>
        <span className="ml-2 text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-5">
          <p className="text-xs text-muted-foreground font-mono">
            Ukończono: {formatDate(mod.completedAt)}
          </p>

          {/* Per-topic breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Wyniki per temat
            </p>
            <div className="space-y-1.5">
              {Object.entries(topicStats).map(([topic, stats]) => {
                const topicPct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={topic} className="flex items-center gap-3 text-sm">
                    <span className="w-36 shrink-0 font-mono text-xs text-muted-foreground truncate">
                      {topic}
                    </span>
                    <div className="flex-1 h-1.5 overflow-hidden bg-muted">
                      <div
                        className={`h-full ${topicPct >= 70 ? "bg-green-500" : topicPct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${topicPct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question-by-question */}
          <details>
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none">
              Szczegóły pytań ▸
            </summary>
            <div className="mt-3 space-y-2">
              {mod.questions.map((q, i) => (
                <div
                  key={q.questionId}
                  className={`border p-3 text-sm space-y-1 ${q.correct ? "border-green-300 dark:border-green-800" : "border-red-200 dark:border-red-900"}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 font-black ${q.correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {q.correct ? "✓" : "✗"}
                    </span>
                    <p className="font-medium leading-snug">
                      {i + 1}. {q.question}
                    </p>
                  </div>
                  {!q.correct && (
                    <div className="ml-5 space-y-0.5 text-xs text-muted-foreground">
                      {q.timedOut ? (
                        <p className="text-yellow-700 dark:text-yellow-400">
                          Czas upłynął — brak odpowiedzi.
                        </p>
                      ) : (
                        <p>
                          Twoja odpowiedź:{" "}
                          <span className="text-red-600 dark:text-red-400">{q.selectedOption}</span>
                        </p>
                      )}
                      <p>
                        Poprawna:{" "}
                        <span className="text-green-700 dark:text-green-400 font-medium">
                          {q.correctOption}
                        </span>
                      </p>
                    </div>
                  )}
                  <details className="ml-5">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                      Wyjaśnienie ▸
                    </summary>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {q.explanation}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function EmptyModuleSlot({ slug, index }: { slug: string; index: number }) {
  return (
    <div className="flex items-center gap-4 border border-dashed border-border px-5 py-4 opacity-50">
      <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
        Moduł {index + 1}
      </span>
      <span className="flex-1 text-sm text-muted-foreground italic">
        Quiz modułu {slug} — nieukończony
      </span>
      <Link
        href={`/live/quiz/${slug}`}
        className="shrink-0 border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
      >
        Zrób quiz →
      </Link>
    </div>
  );
}

export function ParticipantPanel() {
  const [progress, setProgress] = useState<LiveProgress | null>(null);
  const allSlugs = getLiveModuleSlugs();

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  if (!progress) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Ładowanie…</p>
      </div>
    );
  }

  const completedCount = Object.keys(progress.modules).length;
  const totalModules = allSlugs.length;
  const avgPct =
    completedCount > 0
      ? Math.round(
          Object.values(progress.modules).reduce((sum, m) => sum + m.pct, 0) / completedCount,
        )
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          AI Literacy Lab — Warsztaty na żywo
        </p>
        <h1 className="text-3xl font-black tracking-tight">Panel uczestnika</h1>
      </header>

      {/* Summary bar */}
      <div className="grid grid-cols-3 divide-x divide-border border border-border">
        <div className="px-4 py-3 space-y-0.5 text-center">
          <p className="text-2xl font-black tabular-nums">{completedCount}</p>
          <p className="font-mono text-xs text-muted-foreground uppercase">
            z {totalModules} quizów
          </p>
        </div>
        <div className="px-4 py-3 space-y-0.5 text-center">
          <p className="text-2xl font-black tabular-nums">{avgPct !== null ? `${avgPct}%` : "—"}</p>
          <p className="font-mono text-xs text-muted-foreground uppercase">Średni wynik</p>
        </div>
        <div className="px-4 py-3 space-y-0.5 text-center">
          <p className="text-2xl font-black tabular-nums">
            {completedCount > 0
              ? Object.values(progress.modules).reduce((s, m) => s + m.score, 0)
              : "—"}
          </p>
          <p className="font-mono text-xs text-muted-foreground uppercase">Łączne punkty</p>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Postęp per moduł
        </h2>
        <div className="space-y-2">
          {allSlugs.map((slug, i) => {
            const mod = progress.modules[slug];
            return mod ? (
              <ModuleCard key={slug} mod={mod} />
            ) : (
              <EmptyModuleSlot key={slug} slug={slug} index={i} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
