"use client";

import { useState } from "react";

import {
  DOWNLOAD_URLS,
  INSTALL_STEPS,
  type OS,
  OS_LABELS,
  RAM_TIERS,
  type RamTier,
  WIZARD_STEPS,
} from "@/lib/live/lm-studio-data";

const OS_ICONS: Record<OS, string> = { mac: "🍎", windows: "🪟", linux: "🐧" };
const RAM_TIER_ORDER: RamTier[] = ["low", "mid", "high", "ultra"];

function StepProgress({ current, total }: { current: number; total: number }) {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div className="flex items-center gap-1">
      {steps.map((stepNumber) => (
        <div
          key={stepNumber}
          className={`flex-1 h-1 ${stepNumber - 1 < current ? "bg-primary" : stepNumber - 1 === current ? "bg-primary/40" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? "Skopiowano ✓" : "Kopiuj"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function LMStudioWizard() {
  const [step, setStep] = useState(0);
  const [os, setOs] = useState<OS | null>(null);
  const [ramTier, setRamTier] = useState<RamTier | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  function markDone(i: number) {
    setCompletedSteps((prev) => new Set([...prev, i]));

    const eventType = i >= 2 ? "lm_mark_done" : "lm_step_completed";
    void fetch("/api/live/exercises/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseSlug: "lm-studio",
        eventType,
        metadata: { step: i, stepTitle: WIZARD_STEPS[i]?.title ?? "unknown" },
        dedupeKey: `step-${i}-${eventType}`,
      }),
    });
  }
  function next() {
    if (step < WIZARD_STEPS.length - 1) setStep((s) => s + 1);
  }
  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const canAdvance = (() => {
    if (step === 0) return os !== null;
    if (step === 1) return ramTier !== null;
    return true;
  })();

  const selectedModel = ramTier ? RAM_TIERS[ramTier].models[0] : null;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>
            Krok {step + 1} z {WIZARD_STEPS.length}
          </span>
          <span>{WIZARD_STEPS[step].title}</span>
        </div>
        <StepProgress current={step} total={WIZARD_STEPS.length} />
      </div>

      {/* Step content */}
      <div className="min-h-80 space-y-5 border border-border p-6">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Krok {step + 1}
          </p>
          <h2 className="text-xl font-black tracking-tight">{WIZARD_STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground">{WIZARD_STEPS[step].description}</p>
        </div>

        {/* ── Step 0: OS ── */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Twój system operacyjny:</p>
            <div className="flex flex-wrap gap-3">
              {(["mac", "windows", "linux"] as OS[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOs(o)}
                  className={`flex items-center gap-2 border px-4 py-3 text-sm font-medium transition-colors ${os === o ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                >
                  <span className="text-lg">{OS_ICONS[o]}</span>
                  <span>{OS_LABELS[o]}</span>
                </button>
              ))}
            </div>
            {os && (
              <div className="border border-border p-4 text-sm space-y-1">
                <p className="font-medium">Minimalne wymagania — {OS_LABELS[os]}:</p>
                <ul className="list-inside list-disc text-muted-foreground space-y-0.5">
                  <li>8 GB RAM (4 GB min. dla najmniejszych modeli)</li>
                  <li>10 GB wolnego miejsca na dysku (SSD zalecany)</li>
                  {os === "mac" && (
                    <li>macOS 12 Monterey lub nowszy; Apple Silicon lub Intel 2018+</li>
                  )}
                  {os === "windows" && (
                    <li>Windows 10/11 (64-bit); opcjonalne: GPU NVIDIA dla akceleracji</li>
                  )}
                  {os === "linux" && (
                    <li>Ubuntu 20.04+ lub kompatybilna dystrybucja; glibc 2.31+</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Hardware / RAM ── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Ile RAM ma Twój komputer?</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RAM_TIER_ORDER.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setRamTier(tier)}
                  className={`flex items-center justify-between border px-4 py-3 text-left text-sm transition-colors ${ramTier === tier ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                >
                  <span className="font-medium">{RAM_TIERS[tier].label}</span>
                </button>
              ))}
            </div>
            {ramTier && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Rekomendowane modele dla {RAM_TIERS[ramTier].label}:
                </p>
                {RAM_TIERS[ramTier].models.map((m, i) => (
                  <div
                    key={`${m.searchTerm}-${m.quantTag}`}
                    className={`border p-3 text-sm space-y-0.5 ${i === 0 ? "border-primary" : "border-border opacity-80"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{m.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{m.sizeGB} GB</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                    {i === 0 && <p className="font-mono text-xs text-primary">← Zalecany</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Download ── */}
        {step === 2 && os && (
          <div className="space-y-4">
            <p className="text-sm">Pobierz LM Studio ze strony oficjalnej:</p>
            <a
              href={DOWNLOAD_URLS[os]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between border border-primary bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <span>
                {OS_ICONS[os]} Pobierz LM Studio dla {OS_LABELS[os]}
              </span>
              <span>↗</span>
            </a>
            <div className="border border-border p-4 text-sm space-y-1">
              <p className="font-medium">Informacje o pobieraniu:</p>
              <ul className="list-inside list-disc text-muted-foreground space-y-0.5">
                {os === "mac" && <li>Plik .dmg — ok. 200 MB</li>}
                {os === "windows" && <li>Instalator .exe — ok. 170 MB</li>}
                {os === "linux" && <li>Plik AppImage — ok. 180 MB</li>}
                <li>Strona: lmstudio.ai (developer: LM Studio Inc.)</li>
                <li>LM Studio jest darmowe do użytku osobistego</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Step 3: Install ── */}
        {step === 3 && os && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Instalacja na {OS_LABELS[os]}:</p>
            <ol className="space-y-2">
              {INSTALL_STEPS[os].map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-border font-mono text-xs">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            {os === "linux" && (
              <CodeBlock
                lang="bash"
                code={`# Nadaj uprawnienia i uruchom:\nchmod +x LM-Studio-*.AppImage\n./LM-Studio-*.AppImage\n\n# Jeśli brakuje libfuse2 (Ubuntu 22.04+):\nsudo apt install libfuse2`}
              />
            )}
          </div>
        )}

        {/* ── Step 4: Download model ── */}
        {step === 4 && selectedModel && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Pobierz model w LM Studio:</p>
            <ol className="space-y-3">
              {[
                "Uruchom LM Studio i kliknij ikonę lupy (Discover) w lewym panelu.",
                `W polu wyszukiwania wpisz: ${selectedModel.searchTerm}`,
                `Kliknij na wynik i wybierz wersję z tagiem: ${selectedModel.quantTag}`,
                `Kliknij Download i poczekaj na pobranie (~${selectedModel.sizeGB} GB).`,
              ].map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-border font-mono text-xs">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="border border-border p-3 text-sm space-y-1">
              <p className="font-mono text-xs text-muted-foreground">Szukaj w LM Studio:</p>
              <p className="font-mono font-medium">{selectedModel.searchTerm}</p>
              <p className="font-mono text-xs text-muted-foreground">
                Wersja: <span className="text-foreground">{selectedModel.quantTag}</span> (
                {selectedModel.sizeGB} GB)
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Modele GGUF to skompresowane wersje do uruchomienia na CPU (bez dedykowanego GPU).{" "}
              {selectedModel.quantTag} to dobry balans między jakością a rozmiarem.
            </p>
          </div>
        )}

        {/* ── Step 5: First chat ── */}
        {step === 5 && selectedModel && (
          <div className="space-y-4">
            <ol className="space-y-3">
              {[
                "Kliknij ikonę czatu (Chat) w lewym panelu LM Studio.",
                "Na górze okna kliknij rozwijane menu modeli i wybierz pobrany model.",
                "Kliknij Load model — pierwsze ładowanie zajmuje kilka sekund.",
                'Wpisz w polu czatu: "Cześć! Opisz siebie w 2 zdaniach."',
                "Naciśnij Enter i obserwuj generowanie odpowiedzi.",
              ].map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-border font-mono text-xs">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="border-l-2 border-muted pl-4">
              <p className="text-xs text-muted-foreground">
                Model działa w 100% lokalnie — żadne dane nie opuszczają Twojego komputera. Bez
                internetu, bez API key, bez kosztów.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 6: Local API ── */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Uruchom lokalny serwer API:</p>
            <ol className="space-y-2">
              {[
                "Kliknij ikonę serwera (Local Server / Developer) w lewym panelu.",
                "Kliknij Start Server — LM Studio uruchomi serwer na porcie 1234.",
                "Teraz możesz wysyłać zapytania jak do OpenAI API.",
              ].map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-border font-mono text-xs">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm font-medium mt-4">Testuj z terminala:</p>
            <CodeBlock
              lang="bash"
              code={`curl http://localhost:1234/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Cześć!"}]}'`}
            />
            <p className="text-sm font-medium">Lub z Pythona (openai SDK):</p>
            <CodeBlock
              lang="python"
              code={`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"  # dowolna wartość
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Cześć! Opisz się w jednym zdaniu."}]
)
print(response.choices[0].message.content)`}
            />
            <div className="border border-green-400 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950/30">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Gratulacje! Masz działający lokalny LLM na własnym komputerze.
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Ten sam model możesz teraz zintegrować z dowolną aplikacją używającą OpenAI SDK —
                wystarczy zmienić base_url.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-40"
        >
          ← Wstecz
        </button>
        <div className="flex gap-2">
          {completedSteps.has(step) ? (
            <span className="font-mono text-xs font-bold text-green-600 dark:text-green-400 self-center">
              Krok wykonany ✓
            </span>
          ) : step >= 2 ? (
            <button
              type="button"
              onClick={() => markDone(step)}
              className="border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted"
            >
              Oznacz jako wykonane
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            disabled={step === WIZARD_STEPS.length - 1 || !canAdvance}
            className="border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Dalej →
          </button>
        </div>
      </div>
    </div>
  );
}
