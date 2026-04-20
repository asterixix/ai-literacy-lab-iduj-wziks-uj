"use client";

import { useState } from "react";

import { PLATFORMS, type PlatformPrivacy } from "@/lib/live/privacy-data";

const PLATFORM_ICONS: Record<string, string> = {
  chatgpt: "🤖",
  claude: "🌿",
  gemini: "✦",
  copilot: "🪟",
  perplexity: "🔍",
  lechat: "💬",
};

function CheckItem({
  id,
  label,
  detail,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${checked ? "border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/30" : "border-border hover:bg-muted"}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-snug">{label}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </label>
  );
}

function PlatformDetail({ platform }: { platform: PlatformPrivacy }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allDone = platform.optOutSteps.every((_, i) => checked[`step-${i}`]);

  function toggle(key: string, val: boolean) {
    setChecked((prev) => ({ ...prev, [key]: val }));
    if (val) {
      void fetch("/api/live/exercises/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: "prywatnosc",
          eventType: "privacy_checkbox",
          metadata: { platformId: platform.id, key },
          dedupeKey: `${platform.id}:${key}`,
        }),
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`border px-2.5 py-1 text-xs font-medium ${platform.trainsOnFreeData ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400" : "border-green-400 text-green-700 dark:border-green-700 dark:text-green-400"}`}
        >
          {platform.trainsOnFreeData
            ? "Trenuje na Twoich danych (darmowe konto)"
            : "Nie trenuje na Twoich danych"}
        </span>
        <span
          className={`border px-2.5 py-1 text-xs font-medium ${platform.optOutAvailable ? "border-green-400 text-green-700 dark:border-green-700 dark:text-green-400" : "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"}`}
        >
          {platform.optOutAvailable ? "Opt-out dostępny" : "Brak opt-out"}
        </span>
        <span className="border border-border px-2.5 py-1 text-xs text-muted-foreground">
          Retencja: {platform.dataRetention}
        </span>
      </div>

      {/* Data collected */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Co platforma zbiera
        </h3>
        <ul className="space-y-1">
          {platform.dataCollected.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-muted-foreground">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Opt-out checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Jak wyłączyć trenowanie — checklist
          </h3>
          {allDone && (
            <span className="font-mono text-xs font-bold text-green-600 dark:text-green-400">
              Gotowe ✓
            </span>
          )}
        </div>
        <div className="space-y-2">
          {platform.optOutSteps.map((s, i) => (
            <CheckItem
              key={s.step}
              id={`${platform.id}-step-${i}`}
              label={`${i + 1}. ${s.step}`}
              detail={s.detail}
              checked={!!checked[`step-${i}`]}
              onChange={(v) => toggle(`step-${i}`, v)}
            />
          ))}
        </div>

        <a
          href={platform.settingsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          Otwórz ustawienia {platform.name} →
        </a>
      </div>

      {/* Notes */}
      {platform.notes && (
        <div className="border-l-2 border-muted pl-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{platform.notes}</p>
        </div>
      )}

      {/* Policy link */}
      <a
        href={platform.policyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-muted-foreground underline hover:text-foreground"
      >
        Polityka prywatności {platform.company} →
      </a>
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Platforma
            </th>
            <th className="py-2 px-2 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Trenuje (free)
            </th>
            <th className="py-2 px-2 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Opt-out
            </th>
            <th className="py-2 pl-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Retencja danych
            </th>
          </tr>
        </thead>
        <tbody>
          {PLATFORMS.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="py-2.5 pr-4 font-medium">
                {PLATFORM_ICONS[p.id]} {p.name}
              </td>
              <td className="py-2.5 px-2 text-center">
                {p.trainsOnFreeData ? (
                  <span className="text-red-600 dark:text-red-400 font-bold">Tak</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 font-bold">Nie</span>
                )}
              </td>
              <td className="py-2.5 px-2 text-center">
                {p.optOutAvailable ? (
                  <span className="text-green-600 dark:text-green-400">Tak</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Nie</span>
                )}
              </td>
              <td className="py-2.5 pl-4 text-xs text-muted-foreground">{p.dataRetention}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrivacyTest() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const selected = PLATFORMS.find((p) => p.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Platform selector */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Wybierz platformę, z której korzystasz, i przejdź przez checklist wyłączenia trenowania
          modelu na Twoich danych.
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                setSelectedId(p.id);
                setShowComparison(false);
              }}
              className={`flex items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors ${
                selectedId === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span>{PLATFORM_ICONS[p.id]}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform detail */}
      {selected && !showComparison && (
        <div className="border border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">
              {PLATFORM_ICONS[selected.id]} {selected.name}
              <span className="ml-2 font-normal text-muted-foreground text-sm">
                ({selected.company})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Zmień ✕
            </button>
          </div>
          <PlatformDetail platform={selected} />
        </div>
      )}

      {/* Comparison table toggle */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            const next = !showComparison;
            setShowComparison(next);
            setSelectedId(null);
            if (next) {
              void fetch("/api/live/exercises/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  exerciseSlug: "prywatnosc",
                  eventType: "privacy_comparison_view",
                  dedupeKey: "comparison-table",
                }),
              });
            }
          }}
          className="flex w-full items-center justify-between border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span>Porównanie polityk prywatności — wszystkie platformy</span>
          <span className="font-mono text-xs text-muted-foreground">
            {showComparison ? "▲ Ukryj" : "▼ Pokaż"}
          </span>
        </button>
        {showComparison && (
          <div className="border border-border p-4">
            <ComparisonTable />
          </div>
        )}
      </div>
    </div>
  );
}
