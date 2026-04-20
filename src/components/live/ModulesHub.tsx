"use client";

import { useCallback, useEffect, useState } from "react";

interface MePayload {
  screenshots: Array<{
    id: string;
    exercise_slug: string;
    github_url: string | null;
    status: "pending" | "approved" | "rejected";
    points_awarded: number;
    blob_url: string;
  }>;
}

const EXERCISES = [
  { slug: "prompt-refinement", label: "Ćwiczenie 1 — Prompt Refinement Workshop", reward: 50 },
  { slug: "peer-review-promptow", label: "Ćwiczenie 3 — Peer-review promptów", reward: 50 },
  {
    slug: "ai-literacy-przeglad-literatury",
    label: "Ćwiczenie 1 — Przegląd literatury o AI literacy",
    reward: 50,
  },
  {
    slug: "ai-literacy-notatka-badawcza",
    label: "Ćwiczenie 2 — Notatka badawcza z artykułu",
    reward: 50,
  },
  { slug: "ai-literacy-mapa-pola", label: "Ćwiczenie 3 — Mapa pola badawczego", reward: 50 },
  {
    slug: "zero-to-script",
    label: "Ćwiczenie 1 — Zero to Script: analiza CSV w Replit",
    reward: 50,
  },
  { slug: "debugging-challenge", label: "Ćwiczenie 2 — Debugging Challenge: 3 bugi", reward: 50 },
  { slug: "security-review", label: "Ćwiczenie 3 — Security Review: ocena kodu AI", reward: 50 },
  {
    slug: "ai-prototyp-strony",
    label: "Ćwiczenie 4 — Prototyp strony AI Literacy Lab",
    reward: 250,
  },
  { slug: "porownanie", label: "Porównanie modeli", reward: 50 },
  { slug: "prywatnosc", label: "Test prywatności", reward: 50 },
  { slug: "lm-studio", label: "LM Studio", reward: 50 },
];

const PROTOTYPE_EXERCISE_SLUG = "ai-prototyp-strony";

export function ModulesHub() {
  const [me, setMe] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [uploadExercise, setUploadExercise] = useState("porownanie");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadGithubUrl, setUploadGithubUrl] = useState("");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const selectedExercise =
    EXERCISES.find((exercise) => exercise.slug === uploadExercise) ?? EXERCISES[0];
  const requiresGithubUrl = uploadExercise === PROTOTYPE_EXERCISE_SLUG;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/live/me", { cache: "no-store" });
      const mePayload = (await meRes.json()) as MePayload & { error?: string };

      if (!meRes.ok) {
        setStatusMessage(mePayload.error ?? "Nie udało się pobrać danych modułów.");
        return;
      }

      setMe({ screenshots: mePayload.screenshots ?? [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function uploadScreenshot() {
    if (!uploadFile) return;

    setUploadMessage(null);
    const formData = new FormData();
    formData.append("exerciseSlug", uploadExercise);
    formData.append("githubUrl", uploadGithubUrl.trim());
    formData.append("file", uploadFile);

    const res = await fetch("/api/live/screenshots/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      setUploadMessage(payload.error ?? "Upload nieudany.");
      return;
    }

    setUploadMessage(
      "Screenshot wysłany do moderacji. Punkty zostaną przyznane po akceptacji admina.",
    );
    setUploadFile(null);
    if (requiresGithubUrl) {
      setUploadGithubUrl("");
    }
    await loadData();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Ładowanie modułów...</p>;
  }

  if (!me) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        {statusMessage ?? "Brak danych modułów."}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold">
            Zadanie: screenshot do moderacji (+{selectedExercise.reward} pkt)
          </h2>
          <p className="text-xs text-muted-foreground">Pozycja przeniesiona z profilu do modułów</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={uploadExercise}
            onChange={(e) => setUploadExercise(e.target.value)}
            className="border border-border bg-background px-3 py-2 text-sm"
          >
            {EXERCISES.map((exercise) => (
              <option key={exercise.slug} value={exercise.slug}>
                {exercise.label}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {requiresGithubUrl && (
          <input
            type="url"
            value={uploadGithubUrl}
            onChange={(e) => setUploadGithubUrl(e.target.value)}
            placeholder="https://github.com/uzytkownik/repo"
            className="w-full border border-border bg-background px-3 py-2 text-sm"
          />
        )}

        {requiresGithubUrl && (
          <p className="text-xs text-muted-foreground">
            Dla tego ćwiczenia podaj link GitHub do prototypu. Admin może kliknąć i zweryfikować
            repozytorium.
          </p>
        )}

        <button
          type="button"
          onClick={uploadScreenshot}
          disabled={!uploadFile || (requiresGithubUrl && !uploadGithubUrl.trim())}
          className="border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Wyślij screenshot
        </button>

        {uploadMessage && <p className="text-xs text-muted-foreground">{uploadMessage}</p>}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Ostatnie zgłoszenia</h3>
          {me.screenshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak screenshotów.</p>
          ) : (
            me.screenshots.slice(0, 6).map((shot) => (
              <div key={shot.id} className="space-y-1 border border-border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/api/live/screenshots/${shot.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {shot.exercise_slug}
                  </a>
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    {shot.status}
                  </span>
                </div>
                {shot.github_url && (
                  <a
                    href={shot.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-muted-foreground underline"
                  >
                    Repozytorium GitHub
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
    </div>
  );
}
