"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

async function readJsonResponse(
  response: Response,
): Promise<{ error?: string; participantId?: string; generatedPassword?: string }> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as {
      error?: string;
      participantId?: string;
      generatedPassword?: string;
    };
  } catch {
    return { error: text };
  }
}

export function PasswordGate() {
  const [mode, setMode] = useState<"register" | "login" | "admin">("register");

  const [workshopPassword, setWorkshopPassword] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [participantPassword, setParticipantPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [generatedCredentials, setGeneratedCredentials] = useState<{
    participantId: string;
    generatedPassword: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (mode === "register") {
          const res = await fetch("/api/live/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workshopPassword }),
          });
          const data = await readJsonResponse(res);
          if (!res.ok) {
            setError(data.error ?? "Rejestracja nieudana.");
            return;
          }

          if (!data.participantId || !data.generatedPassword) {
            setError("Rejestracja nieudana: brak danych logowania z serwera.");
            return;
          }

          setGeneratedCredentials({
            participantId: data.participantId,
            generatedPassword: data.generatedPassword,
          });
          setWorkshopPassword("");
          return;
        }

        if (mode === "login") {
          const res = await fetch("/api/live/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantId, password: participantPassword }),
          });
          const data = await readJsonResponse(res);
          if (!res.ok) {
            setError(data.error ?? "Logowanie nieudane.");
            return;
          }
          router.push("/live/profil");
          return;
        }

        const adminRes = await fetch("/api/live/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPassword }),
        });
        const adminData = await readJsonResponse(adminRes);
        if (!adminRes.ok) {
          setError(adminData.error ?? "Logowanie admina nieudane.");
          return;
        }
        router.push("/live/admin");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nieznany błąd";
        setError(message);
      }
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="live-auth-surface w-full max-w-sm space-y-8 p-6 sm:p-7">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            AI Literacy Lab — Warsztaty na żywo
          </p>
          <h1 className="text-3xl font-black tracking-tight">Live Access</h1>
          <p className="text-sm text-muted-foreground">
            Załóż konto uczestnika, zaloguj się lub wejdź jako admin.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2 border border-border p-1">
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`px-2 py-1 text-xs ${mode === "register" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Rejestracja
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-2 py-1 text-xs ${mode === "login" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`px-2 py-1 text-xs ${mode === "admin" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="workshop-password" className="text-sm font-medium">
                Hasło warsztatu
              </label>
              <input
                id="workshop-password"
                type="password"
                value={workshopPassword}
                onChange={(e) => setWorkshopPassword(e.target.value)}
                autoComplete="off"
                required
                disabled={isPending}
                className="w-full border border-border bg-background px-3 py-2 text-sm font-mono outline-none ring-ring focus:ring-1 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          )}

          {mode === "login" && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="participant-id" className="text-sm font-medium">
                  ID uczestnika
                </label>
                <input
                  id="participant-id"
                  type="text"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  autoComplete="off"
                  required
                  disabled={isPending}
                  className="w-full border border-border bg-background px-3 py-2 text-sm font-mono outline-none ring-ring focus:ring-1 disabled:opacity-50"
                  placeholder="lab-xxxxxxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="participant-password" className="text-sm font-medium">
                  Hasło uczestnika
                </label>
                <input
                  id="participant-password"
                  type="password"
                  value={participantPassword}
                  onChange={(e) => setParticipantPassword(e.target.value)}
                  autoComplete="off"
                  required
                  disabled={isPending}
                  className="w-full border border-border bg-background px-3 py-2 text-sm font-mono outline-none ring-ring focus:ring-1 disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          {mode === "admin" && (
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-medium">
                Hasło admina
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="off"
                required
                disabled={isPending}
                className="w-full border border-border bg-background px-3 py-2 text-sm font-mono outline-none ring-ring focus:ring-1 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {generatedCredentials && (
            <div className="space-y-1 border border-green-500/50 bg-green-500/10 p-3 text-xs">
              <p className="font-bold">Dane logowania (pokazane tylko raz):</p>
              <p>
                ID: <span className="font-mono">{generatedCredentials.participantId}</span>
              </p>
              <p>
                Hasło: <span className="font-mono">{generatedCredentials.generatedPassword}</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "Przetwarzam..."
              : mode === "register"
                ? "Utwórz konto"
                : mode === "login"
                  ? "Zaloguj"
                  : "Wejdź do admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
