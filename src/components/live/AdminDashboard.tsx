"use client";

import { useCallback, useEffect, useState } from "react";

interface Participant {
  id: string;
  nickname: string;
  total_points: number;
  active_title: string;
}

interface Screenshot {
  id: string;
  participant_id: string;
  exercise_slug: string;
  github_url: string | null;
  blob_url: string;
  report_kind: "exercise" | "anti_cheat_report";
  report_note: string | null;
  status: string;
}

interface Workshop {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface LeaderboardRow {
  id: string;
  nickname: string;
  total_points: number;
}

export function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [pointsToGrant, setPointsToGrant] = useState<number>(100);
  const [pointsReason, setPointsReason] = useState<string>("Dodatkowa aktywność");
  const [status, setStatus] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [participantsRes, screenshotsRes, workshopsRes, leaderboardRes] = await Promise.all([
      fetch("/api/live/admin/participants", { cache: "no-store" }),
      fetch("/api/live/admin/screenshots/pending", { cache: "no-store" }),
      fetch("/api/live/admin/workshops", { cache: "no-store" }),
      fetch("/api/live/admin/leaderboard", { cache: "no-store" }),
    ]);

    if (participantsRes.ok) {
      const data = await participantsRes.json();
      setParticipants(data.participants ?? []);
      if (!selectedParticipant && data.participants?.length > 0) {
        setSelectedParticipant(data.participants[0].id);
      }
    }
    if (screenshotsRes.ok) {
      const data = await screenshotsRes.json();
      setScreenshots(data.screenshots ?? []);
    }
    if (workshopsRes.ok) {
      const data = await workshopsRes.json();
      setWorkshops(data.workshops ?? []);
    }
    if (leaderboardRes.ok) {
      const data = await leaderboardRes.json();
      setLeaderboard(data.rows ?? []);
    }
  }, [selectedParticipant]);

  useEffect(() => {
    void loadAll();
    const intervalId = setInterval(() => {
      void loadAll();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [loadAll]);

  async function grantPoints() {
    if (!selectedParticipant) return;
    const res = await fetch(`/api/live/admin/participants/${selectedParticipant}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pointsToGrant, reason: pointsReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Nie udało się przyznać punktów.");
      return;
    }
    setStatus("Punkty przyznane.");
    await loadAll();
  }

  async function reviewScreenshot(
    id: string,
    decision: "approved" | "rejected",
    options?: { refundPenalty?: boolean; extraPoints?: number },
  ) {
    const res = await fetch(`/api/live/admin/screenshots/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: decision,
        refundPenalty: options?.refundPenalty ?? false,
        extraPoints: options?.extraPoints ?? 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Nie udało się zmoderować screena.");
      return;
    }
    if (decision === "approved" && options?.refundPenalty) {
      setStatus("Zgłoszenie zatwierdzone, zwrócono 25 pkt.");
    } else {
      setStatus(`Screenshot ${decision === "approved" ? "zatwierdzony" : "odrzucony"}.`);
    }
    await loadAll();
  }

  async function createWorkshop() {
    const name = window.prompt("Nazwa nowego warsztatu", "Nowy warsztat");
    if (!name) return;

    const res = await fetch("/api/live/admin/workshops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? "Nie udało się utworzyć warsztatu.");
      return;
    }
    setStatus(`Aktywowano warsztat ${data.workshop.id}.`);
    await loadAll();
  }

  async function exportCsv() {
    window.open("/api/live/admin/export", "_blank", "noopener,noreferrer");
  }

  async function logout() {
    await fetch("/api/live/admin/logout", { method: "POST" });
    window.location.href = "/live";
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4 border border-border p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            AI Literacy Lab
          </p>
          <h1 className="text-3xl font-black tracking-tight">Panel admina</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={createWorkshop}
            className="border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Nowy warsztat
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Eksport CSV
          </button>
          <button
            type="button"
            onClick={logout}
            className="border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Wyloguj
          </button>
        </div>
      </header>

      {status && <p className="border border-border bg-muted px-3 py-2 text-sm">{status}</p>}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 border border-border p-4">
          <h2 className="font-bold">Uczestnicy ({participants.length})</h2>
          {participants.map((participant) => (
            <button
              key={participant.id}
              type="button"
              onClick={() => setSelectedParticipant(participant.id)}
              className={`w-full border p-2 text-left text-sm ${selectedParticipant === participant.id ? "border-primary" : "border-border"}`}
            >
              <p className="font-semibold">{participant.nickname}</p>
              <p className="text-xs text-muted-foreground">
                {participant.total_points} pkt • {participant.active_title}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-3 border border-border p-4">
          <h2 className="font-bold">Bonusowe punkty</h2>
          <select
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            className="w-full border border-border bg-background px-2 py-1.5 text-sm"
          >
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.nickname} ({participant.id})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={pointsToGrant}
            onChange={(e) => setPointsToGrant(Number(e.target.value))}
            className="w-full border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={pointsReason}
            onChange={(e) => setPointsReason(e.target.value)}
            className="w-full border border-border bg-background px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={grantPoints}
            className="border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Przyznaj punkty
          </button>
        </div>

        <div className="space-y-2 border border-border p-4">
          <h2 className="font-bold">Warsztaty</h2>
          {workshops.map((workshop) => (
            <div key={workshop.id} className="border border-border p-2 text-sm">
              <p className="font-semibold">{workshop.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{workshop.id}</p>
              <p className="text-xs text-muted-foreground">
                {workshop.is_active ? "AKTYWNY" : "archiwalny"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 border border-border p-4">
        <h2 className="font-bold">Screenshoty do moderacji ({screenshots.length})</h2>
        {screenshots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak oczekujących screenshotów.</p>
        ) : (
          screenshots.map((shot) => (
            <div key={shot.id} className="space-y-2 border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`/api/live/admin/screenshots/${shot.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {shot.id}
                </a>
                <span className="text-muted-foreground">{shot.exercise_slug}</span>
                {shot.report_kind === "anti_cheat_report" && (
                  <span className="border border-amber-500 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    odwołanie antycheat
                  </span>
                )}
                {shot.github_url && (
                  <a
                    href={shot.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-xs"
                  >
                    GitHub
                  </a>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  {shot.participant_id}
                </span>
                <div className="ml-auto flex gap-2">
                  {shot.report_kind === "anti_cheat_report" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          reviewScreenshot(shot.id, "approved", { refundPenalty: true })
                        }
                        className="border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Zatwierdź + zwróć 25 pkt
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewScreenshot(shot.id, "approved")}
                        className="border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Zatwierdź bez zwrotu
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reviewScreenshot(shot.id, "approved")}
                      className="border border-border px-2 py-1 text-xs hover:bg-muted"
                    >
                      Zatwierdź
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => reviewScreenshot(shot.id, "rejected")}
                    className="border border-border px-2 py-1 text-xs hover:bg-muted"
                  >
                    Odrzuć
                  </button>
                </div>
              </div>
              {shot.report_note && (
                <p className="text-xs text-muted-foreground">
                  Notatka uczestnika: {shot.report_note}
                </p>
              )}
            </div>
          ))
        )}
      </section>

      <section className="space-y-2 border border-border p-4">
        <h2 className="font-bold">Live leaderboard</h2>
        {leaderboard.map((row, index) => (
          <div
            key={row.id}
            className="flex items-center justify-between border border-border p-2 text-sm"
          >
            <span>
              #{index + 1} {row.nickname}
            </span>
            <span className="font-mono">{row.total_points} pkt</span>
          </div>
        ))}
      </section>
    </div>
  );
}
