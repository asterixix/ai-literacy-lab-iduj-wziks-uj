"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDiceBearAvatarUrl } from "@/lib/live/avatar";
import { getUnlockItem, UNLOCK_ITEMS } from "@/lib/live/catalog";
import {
  getLiveAvatarAuraClass,
  getLiveFontClass,
  getLiveFrameClass,
  getLiveThemeClass,
} from "@/lib/live/cosmetics";

interface MePayload {
  participant: {
    id: string;
    workshopId: string;
    nickname: string;
    avatarSeed: string;
    activeAvatar: string;
    favoriteAnimal: string;
    activeTheme: string;
    activeFont: string;
    activeTitle: string;
    activeFrame: string;
    totalPoints: number;
  };
  quizAttempts: Array<{
    module_slug: string;
    score: number;
    total_questions: number;
    points_earned: number;
    completed_at: string;
  }>;
  exerciseSummary: Array<{
    exercise_slug: string;
    total_points: number;
    event_count: number;
  }>;
  transactions: Array<{
    id: number;
    points: number;
    reason: string;
    created_at: string;
  }>;
  screenshots: Array<{
    id: string;
    exercise_slug: string;
    status: string;
    points_awarded: number;
    blob_url: string;
  }>;
  unlockedItems: string[];
}

interface StorePayload {
  items: Array<{
    id: string;
    category: string;
    name: string;
    pointsCost: number;
    rarity: "common" | "rare" | "epic" | "legendary";
    description: string;
  }>;
  ownedItemIds: string[];
  totalPoints: number;
  spentPoints: number;
  availablePoints: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  theme: "Skórki i motywy",
  font: "Czcionki",
  frame: "Ramki",
  title: "Tytuły",
  avatar: "Specjalne avatary",
};

const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
} as const;

const RARITY_CLASS = {
  common: "border-zinc-500/40 text-zinc-600 dark:text-zinc-300",
  rare: "border-sky-500/40 text-sky-700 dark:text-sky-300",
  epic: "border-fuchsia-500/40 text-fuchsia-700 dark:text-fuchsia-300",
  legendary: "border-amber-500/50 text-amber-700 dark:text-amber-300",
} as const;

export function ParticipantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [edenKey, setEdenKey] = useState("");
  const [edenMessage, setEdenMessage] = useState<string | null>(null);

  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedFont, setSelectedFont] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedFrame, setSelectedFrame] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  const [store, setStore] = useState<StorePayload | null>(null);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, storeRes] = await Promise.all([
        fetch("/api/live/me", { cache: "no-store" }),
        fetch("/api/live/store", { cache: "no-store" }),
      ]);

      const mePayload = await meRes.json();
      const storePayload = (await storeRes.json()) as StorePayload & { error?: string };

      if (!meRes.ok) {
        setError(mePayload.error ?? "Nie można pobrać profilu.");
        return;
      }

      if (!storeRes.ok) {
        setError(storePayload.error ?? "Nie można pobrać sklepu.");
        return;
      }

      setData(mePayload);
      setStore(storePayload);
      setSelectedTheme(mePayload.participant.activeTheme);
      setSelectedFont(mePayload.participant.activeFont);
      setSelectedTitle(mePayload.participant.activeTitle);
      setSelectedFrame(mePayload.participant.activeFrame);
      setSelectedAvatar(mePayload.participant.activeAvatar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const unlocked = useMemo(() => {
    if (!data) return [];
    return UNLOCK_ITEMS.filter((item) => data.unlockedItems.includes(item.id));
  }, [data]);

  const themes = unlocked.filter((item) => item.category === "theme");
  const fonts = unlocked.filter((item) => item.category === "font");
  const titles = unlocked.filter((item) => item.category === "title");
  const frames = unlocked.filter((item) => item.category === "frame");
  const avatars = unlocked.filter((item) => item.category === "avatar");

  async function saveProfileStyle() {
    const res = await fetch("/api/live/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeTheme: selectedTheme,
        activeFont: selectedFont,
        activeTitle: selectedTitle,
        activeFrame: selectedFrame,
        activeAvatar: selectedAvatar,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error ?? "Nie udało się zapisać stylu.");
      return;
    }
    await loadMe();
    router.refresh();
  }

  async function saveEdenKey() {
    setEdenMessage(null);
    const res = await fetch("/api/live/eden-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: edenKey }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setEdenMessage(payload.error ?? "Nie udało się zapisać klucza.");
      return;
    }
    setEdenMessage("Klucz Eden AI zapisany.");
    setEdenKey("");
  }

  async function buyItem(itemId: string) {
    if (!store) return;

    const res = await fetch("/api/live/store/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error ?? "Nie udało się kupić przedmiotu.");
      return;
    }

    await loadMe();
  }

  async function logout() {
    await fetch("/api/live/logout", { method: "POST" });
    window.location.href = "/live";
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error ?? "Błąd ładowania."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border border-border p-5">
        <div className="flex items-center gap-4">
          <div className={`live-avatar-frame ${getLiveFrameClass(data.participant.activeFrame)}`}>
            <Image
              src={buildDiceBearAvatarUrl(
                data.participant.avatarSeed,
                data.participant.activeAvatar,
              )}
              alt="Avatar uczestnika"
              width={64}
              height={64}
              className={`h-16 w-16 rounded-full bg-muted ${getLiveAvatarAuraClass(data.participant.activeAvatar)}`}
              unoptimized
            />
          </div>
          <div>
            <p className="font-mono text-xs text-muted-foreground">{data.participant.id}</p>
            <h1
              className={`text-2xl font-black tracking-tight ${getLiveFontClass(data.participant.activeFont)}`}
            >
              {data.participant.nickname}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getUnlockItem(data.participant.activeTitle)?.name ?? data.participant.activeTitle} •{" "}
              {data.participant.favoriteAnimal} •{" "}
              {getUnlockItem(data.participant.activeAvatar)?.name ?? data.participant.activeAvatar}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-muted-foreground">Punkty</p>
          <p className="text-3xl font-black tabular-nums">{data.participant.totalPoints}</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/live/leaderboard"
          className="border border-border p-4 text-sm transition hover:bg-muted"
        >
          Leaderboard warsztatu →
        </Link>
        <Link
          href="/live/cwiczenia"
          className="border border-border p-4 text-sm transition hover:bg-muted"
        >
          Moduły →
        </Link>
        <button
          type="button"
          onClick={logout}
          className="border border-border p-4 text-left text-sm transition hover:bg-muted"
        >
          Wyloguj
        </button>
      </div>

      <section className="space-y-4 border border-border p-5">
        <h2 className="text-lg font-bold">Wygląd profilu (odblokowania)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Motyw</span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5"
            >
              {themes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Czcionka</span>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5"
            >
              {fonts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Tytuł</span>
            <select
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5"
            >
              {titles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Ramka avatara</span>
            <select
              value={selectedFrame}
              onChange={(e) => setSelectedFrame(e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5"
            >
              {frames.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span>Avatar</span>
            <select
              value={selectedAvatar}
              onChange={(e) => setSelectedAvatar(e.target.value)}
              className="w-full border border-border bg-background px-2 py-1.5"
            >
              {avatars.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={saveProfileStyle}
          className="border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Zapisz wygląd
        </button>
      </section>

      <section className="space-y-4 border border-border p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Sklep punktów</h2>
            <p className="text-sm text-muted-foreground">
              Punkty wydane w sklepie nie odejmują się od punktów rankingowych.
            </p>
          </div>
          <div className="grid gap-1 text-right text-xs text-muted-foreground">
            <span>Zdobyte: {store?.totalPoints ?? 0} pkt</span>
            <span>Wydane: {store?.spentPoints ?? 0} pkt</span>
            <span className="font-semibold text-foreground">
              Dostępne w sklepie: {store?.availablePoints ?? 0} pkt
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {store &&
            Object.entries(CATEGORY_LABELS).map(([category, title]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-semibold">{title}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {store.items
                    .filter((item) => item.category === category)
                    .map((item) => {
                      const owned = store.ownedItemIds.includes(item.id);
                      const canAfford = store.availablePoints >= item.pointsCost;
                      const avatarSeed = data.participant.avatarSeed;
                      const activeAvatar = data.participant.activeAvatar;
                      return (
                        <div key={item.id} className="space-y-2 border border-border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium">{item.name}</p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RARITY_CLASS[item.rarity]}`}
                            >
                              {RARITY_LABELS[item.rarity]}
                            </span>
                          </div>
                          {item.category === "theme" && (
                            <div
                              className={`border border-border p-2 ${getLiveThemeClass(item.id)}`}
                            >
                              <div className="space-y-1 bg-card p-2 text-card-foreground">
                                <p className="font-mono text-[10px] text-muted-foreground">
                                  Podgląd motywu
                                </p>
                                <p className="text-xs font-semibold">{data.participant.nickname}</p>
                              </div>
                            </div>
                          )}
                          {item.category === "font" && (
                            <div className="border border-border bg-muted/40 p-2">
                              <p className="font-mono text-[10px] text-muted-foreground">
                                Podgląd czcionki
                              </p>
                              <p className={`text-sm font-semibold ${getLiveFontClass(item.id)}`}>
                                {data.participant.nickname}
                              </p>
                            </div>
                          )}
                          {item.category === "title" && (
                            <div className="border border-border bg-muted/40 p-2">
                              <p className="font-mono text-[10px] text-muted-foreground">
                                Podgląd tytułu
                              </p>
                              <p className="text-xs text-muted-foreground">{item.name}</p>
                            </div>
                          )}
                          {item.category === "frame" && (
                            <div className="flex items-center gap-3 border border-border bg-muted/40 p-2">
                              <div className={`live-avatar-frame ${getLiveFrameClass(item.id)}`}>
                                <Image
                                  src={buildDiceBearAvatarUrl(avatarSeed, activeAvatar)}
                                  alt={`Podgląd ramki ${item.name}`}
                                  width={34}
                                  height={34}
                                  className={`h-8.5 w-8.5 rounded-full ${getLiveAvatarAuraClass(activeAvatar)}`}
                                  unoptimized
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Podgląd ramki</p>
                            </div>
                          )}
                          {item.category === "avatar" && (
                            <div className="flex items-center gap-3 border border-border bg-muted/40 p-2">
                              <div
                                className={`live-avatar-frame ${getLiveFrameClass(data.participant.activeFrame)}`}
                              >
                                <Image
                                  src={buildDiceBearAvatarUrl(avatarSeed, item.id)}
                                  alt={`Podgląd avatara ${item.name}`}
                                  width={34}
                                  height={34}
                                  className={`h-8.5 w-8.5 rounded-full ${getLiveAvatarAuraClass(item.id)}`}
                                  unoptimized
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Podgląd avatara</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs">{item.pointsCost} pkt</span>
                            {owned ? (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Kupione
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => buyItem(item.id)}
                                disabled={!canAfford}
                                className="border border-border px-2 py-1 text-xs transition hover:bg-muted disabled:opacity-50"
                              >
                                Kup
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="space-y-3 border border-border p-5">
        <h2 className="text-lg font-bold">Klucz Eden AI</h2>
        <p className="text-sm text-muted-foreground">
          Klucz zapisuje się jednorazowo i jest szyfrowany w bazie.
        </p>
        <input
          type="password"
          value={edenKey}
          onChange={(e) => setEdenKey(e.target.value)}
          className="w-full border border-border bg-background px-3 py-2 text-sm font-mono"
          placeholder="eden-api-key..."
        />
        <button
          type="button"
          onClick={saveEdenKey}
          className="border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Zapisz klucz
        </button>
        {edenMessage && <p className="text-xs text-muted-foreground">{edenMessage}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 border border-border p-4">
          <h3 className="font-bold">Quizy</h3>
          {data.quizAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zapisanych quizów.</p>
          ) : (
            data.quizAttempts.map((attempt) => (
              <div key={attempt.module_slug} className="border border-border p-2 text-sm">
                <p className="font-medium">Moduł {attempt.module_slug}</p>
                <p className="text-xs text-muted-foreground">
                  Wynik: {attempt.score}/{attempt.total_questions} • +{attempt.points_earned} pkt
                </p>
              </div>
            ))
          )}
        </div>
        <div className="space-y-2 border border-border p-4">
          <h3 className="font-bold">Ćwiczenia</h3>
          {data.exerciseSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak aktywności ćwiczeniowej.</p>
          ) : (
            data.exerciseSummary.map((exercise) => (
              <div key={exercise.exercise_slug} className="border border-border p-2 text-sm">
                <p className="font-medium">{exercise.exercise_slug}</p>
                <p className="text-xs text-muted-foreground">
                  Eventy: {exercise.event_count} • +{exercise.total_points} pkt
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-2 border border-border p-4">
        <h3 className="font-bold">Historia punktów</h3>
        {data.transactions.slice(0, 20).map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between border border-border p-2 text-sm"
          >
            <span>{tx.reason}</span>
            <span className="font-mono">{tx.points > 0 ? `+${tx.points}` : tx.points} pkt</span>
          </div>
        ))}
      </section>
    </div>
  );
}
