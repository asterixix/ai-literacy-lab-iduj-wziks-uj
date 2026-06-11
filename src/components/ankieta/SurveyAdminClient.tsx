"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type TimelinePoint = {
  day: string;
  count: number;
};

type GainsByTopic = {
  topic: string;
  avgGain: number;
};

type MatrixRowAverage = {
  key: string;
  average: number | null;
  count: number;
};

type SummaryPayload = {
  count: number;
  groupDistribution: Record<string, number>;
  modeDistribution: Record<string, number>;
  attendanceDistribution: Record<string, number>;
  c3Distribution: Record<string, number>;
  c4Distribution: Record<string, number>;
  c5Distribution: Record<string, number>;
  c1Average: number | null;
  npsAverage: number | null;
  consentYesCount: number;
  certificateIncludedCount: number;
  timeline: TimelinePoint[];
  b1Gains: {
    topics: GainsByTopic[];
    overall: number;
  };
  b2Gain: number | null;
  b4Gain: number | null;
  npsBreakdown: {
    detractors: number;
    passives: number;
    promoters: number;
    total: number;
    score: number | null;
  };
  matrixAverages: {
    D1: MatrixRowAverage[];
    E1: MatrixRowAverage[];
    E2: MatrixRowAverage[];
    F1: MatrixRowAverage[];
  };
  attendanceVsSatisfaction: Record<string, Record<string, number>>;
  toolsUsage: Array<{ tool: string; count: number }>;
  settings: {
    isOpen: boolean;
    blockedReason: string | null;
    updatedAt: string;
  };
  dbHealth: {
    tables: Array<{ table_name: string }>;
    columns: Array<{ table_name: string; column_name: string }>;
    responseCount: number;
  };
};

type ResponsePreview = {
  id: string;
  createdAt: string;
  flat: Record<string, string>;
};

type WrittenResponse = {
  id: string;
  createdAt: string;
  fields: Record<string, string>;
};

type SummaryResponse = {
  ok: boolean;
  summary?: SummaryPayload;
  responses?: ResponsePreview[];
  writtenQuestionLabels?: Record<string, string>;
  writtenResponses?: WrittenResponse[];
  error?: string;
};

export function SurveyAdminClient() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "locked" | "ready">("loading");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [responses, setResponses] = useState<ResponsePreview[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [blockReasonInput, setBlockReasonInput] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);
  const [writtenQuestionLabels, setWrittenQuestionLabels] = useState<Record<string, string>>({});
  const [writtenResponses, setWrittenResponses] = useState<WrittenResponse[]>([]);
  const [writtenQuery, setWrittenQuery] = useState("");

  const fetchSummary = async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    try {
      const response = await fetch("/api/ankieta-admin/summary", { cache: "no-store" });
      if (response.status === 401) {
        setStatus("locked");
        return;
      }

      const payload = (await response.json()) as SummaryResponse;
      if (
        !response.ok ||
        !payload.ok ||
        !payload.summary ||
        !payload.responses ||
        !payload.writtenQuestionLabels ||
        !payload.writtenResponses
      ) {
        throw new Error(payload.error ?? "Nie udało się pobrać danych.");
      }

      setSummary(payload.summary);
      setResponses(payload.responses);
      setWrittenQuestionLabels(payload.writtenQuestionLabels);
      setWrittenResponses(payload.writtenResponses);
      setBlockReasonInput(payload.summary.settings.blockedReason ?? "");
      setLastSyncAt(new Date().toISOString());
      setStatus("ready");
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchSummary().catch((err) => {
      setStatus("locked");
      setError(err instanceof Error ? err.message : "Błąd pobierania danych.");
      setIsRefreshing(false);
    });
  }, []);

  useEffect(() => {
    if (!liveMode || status !== "ready") {
      return;
    }

    const interval = window.setInterval(() => {
      fetchSummary(true).catch(() => undefined);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [liveMode, status]);

  const login = async () => {
    setError("");
    const response = await fetch("/api/ankieta-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Nieprawidłowe hasło.");
      return;
    }
    await fetchSummary(false);
  };

  const updateSurveyStatus = async (isOpen: boolean) => {
    setError("");
    const response = await fetch("/api/ankieta-admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isOpen,
        blockedReason: isOpen ? null : blockReasonInput,
      }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Nie udało się zmienić statusu ankiety.");
      return;
    }

    await fetchSummary(false);
  };

  const deleteResponse = async (id: string) => {
    const shouldDelete = window.confirm(
      "Czy na pewno chcesz usunąć tę odpowiedź? Tej operacji nie można cofnąć.",
    );
    if (!shouldDelete) {
      return;
    }

    setDeletingResponseId(id);
    setError("");

    try {
      const response = await fetch(`/api/ankieta-admin/responses/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Nie udało się usunąć odpowiedzi.");
      }

      await fetchSummary(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Błąd usuwania odpowiedzi.");
    } finally {
      setDeletingResponseId(null);
    }
  };

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Ładowanie panelu…</p>;
  }

  if (status === "locked") {
    return (
      <section className="space-y-4 border border-border bg-card p-6">
        <h1 className="text-2xl font-black">Panel ankiety – logowanie</h1>
        <p className="text-sm text-muted-foreground">Podaj hasło ustawione w zmiennej środowiskowej.</p>
        <input
          type="password"
          className="h-10 w-full border border-input bg-background px-3 text-sm"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Hasło admina"
        />
        {error ? <p className="text-sm font-semibold">{error}</p> : null}
        <Button onClick={login}>Zaloguj</Button>
      </section>
    );
  }

  const renderDistribution = (title: string, distribution: Record<string, number>) => {
    const items = Object.entries(distribution);
    const max = Math.max(...items.map(([, count]) => count), 1);

    return (
      <article className="border border-border bg-card p-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-3 space-y-2 text-sm">
          {items.length === 0 ? <p className="text-muted-foreground">Brak danych.</p> : null}
          {items.map(([label, count]) => (
            <div key={`${title}-${label}`} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-muted-foreground">{label}</p>
                <p className="font-semibold">{count}</p>
              </div>
              <div className="h-2 w-full bg-muted">
                <div className="h-2 bg-foreground" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>
    );
  };

  const renderMatrixAverages = (
    title: string,
    rows: MatrixRowAverage[],
    labels: Record<string, string>,
  ) => {
    return (
      <article className="border border-border bg-card p-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-3 space-y-2 text-sm">
          {rows.map((row) => {
            const value = row.average ?? 0;
            return (
              <div key={`${title}-${row.key}`} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-muted-foreground">{labels[row.key] ?? row.key}</p>
                  <p className="font-semibold">{row.average ?? "-"}</p>
                </div>
                <div className="h-2 w-full bg-muted">
                  <div className="h-2 bg-foreground" style={{ width: `${(value / 5) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </article>
    );
  };

  const filteredWrittenResponses = writtenResponses.filter((response) => {
    if (!writtenQuery.trim()) {
      return true;
    }

    const query = writtenQuery.trim().toLowerCase();
    return Object.values(response.fields).some((value) => value.toLowerCase().includes(query));
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-6">
        <div>
          <h1 className="text-2xl font-black">Panel ankiety – podsumowanie</h1>
          <p className="text-sm text-muted-foreground">
            Podgląd odpowiedzi, statystyk, blokady formularza i eksportu zbiorczego CSV.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/ankieta-admin/export"
            className="inline-flex h-10 items-center border border-border px-4 text-sm font-semibold hover:bg-muted"
          >
            Pobierz CSV
          </a>
          <Button variant="outline" onClick={() => fetchSummary(false)} disabled={isRefreshing}>
            {isRefreshing ? "Odświeżanie..." : "Odśwież teraz"}
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Liczba odpowiedzi</p>
            <p className="text-3xl font-black">{summary.count}</p>
          </article>
          <article className="border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Średnia C1</p>
            <p className="text-3xl font-black">{summary.c1Average ?? "-"}</p>
          </article>
          <article className="border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Średnia NPS</p>
            <p className="text-3xl font-black">{summary.npsAverage ?? "-"}</p>
          </article>
        </div>
      ) : null}

      {summary ? (
        <article className="border border-border bg-card p-4">
          <h2 className="text-lg font-bold">NPS – promotorzy, pasywni, krytycy</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">NPS score</p>
              <p className="text-3xl font-black">{summary.npsBreakdown.score ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Promotorzy (9-10)</p>
              <p className="text-2xl font-bold">{summary.npsBreakdown.promoters}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Pasywni (7-8)</p>
              <p className="text-2xl font-bold">{summary.npsBreakdown.passives}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Krytycy (0-6)</p>
              <p className="text-2xl font-bold">{summary.npsBreakdown.detractors}</p>
            </div>
          </div>
          <div className="mt-4 flex h-3 w-full overflow-hidden border border-border">
            <div
              className="bg-zinc-800 dark:bg-zinc-200"
              style={{
                width: `${summary.npsBreakdown.total ? (summary.npsBreakdown.promoters / summary.npsBreakdown.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-zinc-500 dark:bg-zinc-500"
              style={{
                width: `${summary.npsBreakdown.total ? (summary.npsBreakdown.passives / summary.npsBreakdown.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-zinc-300 dark:bg-zinc-700"
              style={{
                width: `${summary.npsBreakdown.total ? (summary.npsBreakdown.detractors / summary.npsBreakdown.total) * 100 : 0}%`,
              }}
            />
          </div>
        </article>
      ) : null}

      {summary ? (
        <article className="space-y-4 border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Status ankiety i monitoring</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={liveMode}
                onChange={(event) => setLiveMode(event.target.checked)}
              />
              Tryb na żywo (odświeżanie co 5 s)
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Ostatnia synchronizacja:{" "}
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString("pl-PL") : "brak danych"}
          </p>
          <p className="text-sm text-muted-foreground">
            Status ankiety:{" "}
            <span className="font-semibold">{summary.settings.isOpen ? "Aktywna" : "Zablokowana"}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Ostatnia zmiana statusu: {new Date(summary.settings.updatedAt).toLocaleString("pl-PL")}
          </p>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              className="h-10 border border-input bg-background px-3 text-sm"
              placeholder="Powód blokady (opcjonalny)"
              value={blockReasonInput}
              onChange={(event) => setBlockReasonInput(event.target.value)}
            />
            <Button variant="outline" onClick={() => updateSurveyStatus(false)}>
              Zablokuj ankietę
            </Button>
            <Button onClick={() => updateSurveyStatus(true)}>Odblokuj ankietę</Button>
          </div>
          {summary.settings.blockedReason ? (
            <p className="text-sm text-muted-foreground">
              Komunikat blokady: {summary.settings.blockedReason}
            </p>
          ) : null}
        </article>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          {renderDistribution("Rozkład grup (A1)", summary.groupDistribution)}
          {renderDistribution("Tryb uczestnictwa (A2)", summary.modeDistribution)}
          {renderDistribution("Frekwencja (A3)", summary.attendanceDistribution)}
          {renderDistribution("Zakres merytoryczny (C3)", summary.c3Distribution)}
          {renderDistribution("Poziom trudności (C4)", summary.c4Distribution)}
          {renderDistribution("Realizacja celu (C5)", summary.c5Distribution)}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          {renderMatrixAverages("D1 – Średnie ocen materiałów (1–5)", summary.matrixAverages.D1, {
            clarity: "Klarowność",
            structure: "Struktura",
            fit: "Adekwatność do zajęć",
            practicality: "Praktyczna użyteczność",
            completeness: "Kompletność",
            visual: "Estetyka i czytelność",
            freshness: "Aktualność",
            availability: "Dostępność",
          })}
          {renderMatrixAverages("E1 – Średnie ocen prowadzącego (1–5)", summary.matrixAverages.E1, {
            knowledge: "Znajomość tematu",
            explain: "Tłumaczenie złożonych zagadnień",
            flexibility: "Elastyczność i reagowanie",
            engagement: "Zaangażowanie i pasja",
          })}
          {renderMatrixAverages("E2 – Średnie ocen metodyki (1–5)", summary.matrixAverages.E2, {
            logic: "Logika układu spotkań",
            balance: "Balans teoria-praktyka",
            pace: "Tempo",
            methods: "Zróżnicowanie metod",
            exercise_quality: "Jakość ćwiczeń",
            discussion_space: "Przestrzeń na pytania",
          })}
          {renderMatrixAverages("F1 – Średnie ocen organizacji (1–5)", summary.matrixAverages.F1, {
            communication: "Komunikacja przed warsztatami",
            time: "Dogodność terminu",
            length: "Długość spotkania",
            count: "Liczba spotkań",
            platform: "Jakość platformy/sali",
          })}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          <article className="border border-border bg-card p-4">
            <h2 className="text-lg font-bold">Przyrost kompetencji (rdzeń badania)</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Średni przyrost B1 (skala 1–5): {summary.b1Gains.overall}</li>
              <li>Średni przyrost B2 (poziom narzędzi GenAI): {summary.b2Gain ?? "-"}</li>
              <li>Średni przyrost B4 (AI w programowaniu): {summary.b4Gain ?? "-"}</li>
              <li>Zgoda H1 „Tak”: {summary.consentYesCount}</li>
              <li>Uwzględnione do ewaluacji certyfikatu: {summary.certificateIncludedCount}</li>
            </ul>
          </article>
          <article className="border border-border bg-card p-4">
            <h2 className="text-lg font-bold">B1 – przyrost per temat</h2>
            <div className="mt-3 space-y-2">
              {summary.b1Gains.topics.map((item) => (
                <div key={item.topic} className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">{item.topic}</p>
                    <p className="font-semibold">{item.avgGain}</p>
                  </div>
                  <div className="h-2 w-full bg-muted">
                    <div
                      className="h-2 bg-foreground"
                      style={{ width: `${Math.max(0, Math.min(100, (item.avgGain / 4) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {summary ? (
        <article className="border border-border bg-card p-4">
          <h2 className="text-lg font-bold">Frekwencja vs satysfakcja (A3 × C1)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4">Frekwencja</th>
                  <th className="py-2 pr-4">C1=1</th>
                  <th className="py-2 pr-4">C1=2</th>
                  <th className="py-2 pr-4">C1=3</th>
                  <th className="py-2 pr-4">C1=4</th>
                  <th className="py-2 pr-4">C1=5</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.attendanceVsSatisfaction).map(([attendance, buckets]) => (
                  <tr key={attendance} className="border-b border-border/70">
                    <td className="py-2 pr-4 text-muted-foreground">{attendance}</td>
                    <td className="py-2 pr-4">{buckets["1"] ?? 0}</td>
                    <td className="py-2 pr-4">{buckets["2"] ?? 0}</td>
                    <td className="py-2 pr-4">{buckets["3"] ?? 0}</td>
                    <td className="py-2 pr-4">{buckets["4"] ?? 0}</td>
                    <td className="py-2 pr-4">{buckets["5"] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {summary ? (
        <article className="border border-border bg-card p-4">
          <h2 className="text-lg font-bold">Narzędzia używane po warsztatach (B5)</h2>
          <div className="mt-3 space-y-2">
            {summary.toolsUsage.map((item) => (
              <div key={item.tool} className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-muted-foreground">{item.tool}</p>
                  <p className="font-semibold">{item.count}</p>
                </div>
                <div className="h-2 w-full bg-muted">
                  <div
                    className="h-2 bg-foreground"
                    style={{
                      width: `${summary.count > 0 ? (item.count / summary.count) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {summary ? (
        <article className="border border-border bg-card p-4">
          <h2 className="text-lg font-bold">Tempo napływu odpowiedzi (oś czasu)</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {summary.timeline.map((point) => (
              <div key={point.day} className="flex items-center justify-between border border-border/70 p-2 text-sm">
                <span className="text-muted-foreground">{point.day}</span>
                <span className="font-semibold">{point.count}</span>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {summary ? (
        <article className="border border-border bg-card p-4">
          <h2 className="text-lg font-bold">Kontrola integralności bazy</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>Tabele wykryte: {summary.dbHealth.tables.map((table) => table.table_name).join(", ")}</li>
            <li>Liczba kolumn wykrytych: {summary.dbHealth.columns.length}</li>
            <li>Liczba odpowiedzi wg DB: {summary.dbHealth.responseCount}</li>
          </ul>
        </article>
      ) : null}

      <article className="border border-border bg-card p-4">
        <h2 className="text-lg font-bold">Ostatnie odpowiedzi</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">A1</th>
                <th className="py-2 pr-4">A2</th>
                <th className="py-2 pr-4">C1</th>
                <th className="py-2 pr-4">F2</th>
                <th className="py-2 pr-4">H1</th>
                <th className="py-2 pr-4">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id} className="border-b border-border/70">
                  <td className="py-2 pr-4 text-muted-foreground">{new Date(response.createdAt).toLocaleString("pl-PL")}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{response.id}</td>
                  <td className="py-2 pr-4">{response.flat.A1}</td>
                  <td className="py-2 pr-4">{response.flat.A2}</td>
                  <td className="py-2 pr-4">{response.flat.C1}</td>
                  <td className="py-2 pr-4">{response.flat.F2}</td>
                  <td className="py-2 pr-4">{response.flat.H1}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      className="border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-60"
                      onClick={() => deleteResponse(response.id)}
                      disabled={deletingResponseId === response.id}
                    >
                      {deletingResponseId === response.id ? "Usuwanie..." : "Usuń"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Wszystkie odpowiedzi pisemne do analizy</h2>
          <p className="text-sm text-muted-foreground">
            Rekordy: {filteredWrittenResponses.length}/{writtenResponses.length}
          </p>
        </div>
        <input
          type="text"
          className="mt-3 h-10 w-full border border-input bg-background px-3 text-sm"
          placeholder="Szukaj frazy we wszystkich odpowiedziach otwartych..."
          value={writtenQuery}
          onChange={(event) => setWrittenQuery(event.target.value)}
        />

        <div className="mt-4 space-y-3">
          {filteredWrittenResponses.map((response) => (
            <details key={`written-${response.id}`} className="border border-border p-3">
              <summary className="cursor-pointer text-sm font-semibold">
                {new Date(response.createdAt).toLocaleString("pl-PL")} — {response.id}
              </summary>
              <div className="mt-3 space-y-3">
                {Object.entries(response.fields).map(([key, value]) => (
                  <div key={`${response.id}-${key}`} className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {writtenQuestionLabels[key] ?? key}
                    </p>
                    <div className="whitespace-pre-wrap border border-border/70 bg-muted/30 p-3 text-sm">
                      {value?.trim() ? value : "Brak odpowiedzi."}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {filteredWrittenResponses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak odpowiedzi pasujących do wyszukiwania.</p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
