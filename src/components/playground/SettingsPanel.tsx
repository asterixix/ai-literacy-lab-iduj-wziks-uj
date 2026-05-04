"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { listModels, type EdenModel } from "@/lib/eden-ai";
import {
  type PlaygroundSettings,
  DEFAULT_PARAMS,
  setApiKey as saveApiKey,
  clearApiKey,
} from "@/lib/playground-storage";

interface SettingsPanelProps {
  apiKey: string;
  settings: PlaygroundSettings;
  onSettingsChange: (settings: PlaygroundSettings) => void;
  onApiKeyChange: (key: string) => void;
}

/**
 * Format pricing info for display.
 * Extracts prompt/input and completion/output costs per 1M tokens.
 * Handles various pricing formats from different providers.
 */
function formatPricing(pricing: Record<string, unknown>): { formatted: string; raw: Record<string, unknown> } {
  try {
    // Try various field names for input/prompt costs
    const inputCost =
      pricing.prompt ||
      pricing.input ||
      pricing.input_cost_per_token ||
      pricing.prompt_cost_per_token;

    // Try various field names for output/completion costs
    const outputCost =
      pricing.completion ||
      pricing.output ||
      pricing.output_cost_per_token ||
      pricing.completion_cost_per_token;

    if (!inputCost && !outputCost) {
      return { formatted: "", raw: pricing };
    }

    const parts: string[] = [];
    if (inputCost) {
      const val = Number(inputCost);
      // Convert to per 1M tokens if needed (if < 0.01, likely per token not per M)
      const displayVal = val < 0.01 ? val * 1_000_000 : val;
      parts.push(`$${displayVal.toFixed(2)}`);
    }
    if (outputCost) {
      const val = Number(outputCost);
      const displayVal = val < 0.01 ? val * 1_000_000 : val;
      parts.push(`$${displayVal.toFixed(2)}`);
    }

    return { formatted: parts.join(" / "), raw: pricing };
  } catch (err) {
    console.error("Error formatting pricing:", err, pricing);
    return { formatted: "", raw: pricing };
  }
}

/**
 * Extract total cost for sorting (input + output).
 */
function extractTotalCost(pricing: Record<string, unknown>): number {
  try {
    const inputCost =
      pricing.prompt ||
      pricing.input ||
      pricing.input_cost_per_token ||
      pricing.prompt_cost_per_token;
    const outputCost =
      pricing.completion ||
      pricing.output ||
      pricing.output_cost_per_token ||
      pricing.completion_cost_per_token;

    let total = 0;
    if (inputCost) {
      const val = Number(inputCost);
      total += val < 0.01 ? val * 1_000_000 : val;
    }
    if (outputCost) {
      const val = Number(outputCost);
      total += val < 0.01 ? val * 1_000_000 : val;
    }
    return total;
  } catch {
    return Infinity; // Sort unpriceable models to the end
  }
}

/**
 * Sort models by the given criteria.
 */
function sortModels(
  models: EdenModel[],
  sortType: "name" | "cheapest" | "expensive",
): EdenModel[] {
  const sorted = [...models];

  if (sortType === "name") {
    sorted.sort((a, b) => a.id.localeCompare(b.id));
  } else if (sortType === "cheapest") {
    sorted.sort((a, b) => extractTotalCost(a.pricing) - extractTotalCost(b.pricing));
  } else if (sortType === "expensive") {
    sorted.sort((a, b) => extractTotalCost(b.pricing) - extractTotalCost(a.pricing));
  }

  return sorted;
}

export function SettingsPanel({
  apiKey,
  settings,
  onSettingsChange,
  onApiKeyChange,
}: SettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [models, setModels] = useState<EdenModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelSortType, setModelSortType] = useState<"name" | "cheapest" | "expensive">("name");

  // Load models
  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError(null);
    try {
      const res = await listModels(apiKey);
      // Filter to chat models only
      const chatModels = res.data
        .filter(
          (m) =>
            m.id.includes("gpt") ||
            m.id.includes("claude") ||
            m.id.includes("gemini") ||
            m.id.includes("llama") ||
            m.id.includes("mistral") ||
            m.id.includes("qwen") ||
            m.id.includes("deepseek") ||
            m.id.includes("o1") ||
            m.id.includes("o3") ||
            m.id.includes("o4") ||
            m.id.includes("@edenai"),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
      setModels(chatModels);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : "Nie udało się pobrać listy modeli");
    } finally {
      setModelsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleKeyUpdate = () => {
    const trimmed = newKey.trim();
    if (trimmed) {
      saveApiKey(trimmed);
      onApiKeyChange(trimmed);
      setNewKey("");
    }
  };

  const handleKeyRemove = () => {
    clearApiKey();
    onApiKeyChange("");
  };

  const updateSettings = (partial: Partial<PlaygroundSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const updateParams = (partial: Partial<typeof DEFAULT_PARAMS>) => {
    onSettingsChange({
      ...settings,
      params: { ...settings.params, ...partial },
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">Ustawienia</h2>
        <p className="text-xs text-muted-foreground">
          Konfiguruj klucz API, model i parametry czatu
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ── API Key ──────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <KeyRound className="size-4" />
            Klucz API
          </h3>
          <div className="rounded-sm border border-border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Aktywny klucz:</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {showKey ? apiKey : `••••••••${apiKey.slice(-4)}`}
              </code>
              <button
                onClick={() => setShowKey((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={showKey ? "Ukryj klucz" : "Pokaż klucz"}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Nowy klucz API…"
                className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
              />
              <Button size="sm" onClick={handleKeyUpdate} disabled={!newKey.trim()}>
                Zaktualizuj
              </Button>
              <Button variant="outline" size="sm" onClick={handleKeyRemove}>
                Usuń
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Klucz jest przechowywany wyłącznie w LocalStorage Twojej przeglądarki.
            </p>
          </div>
        </section>

        <Separator />

        {/* ── Model ────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Model czatu</h3>
          <div className="space-y-2">
            {/* Sort buttons */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={modelSortType === "name" ? "default" : "outline"}
                onClick={() => setModelSortType("name")}
                className="text-xs"
              >
                A-Z
              </Button>
              <Button
                size="sm"
                variant={modelSortType === "cheapest" ? "default" : "outline"}
                onClick={() => setModelSortType("cheapest")}
                className="text-xs"
              >
                Najtańsze
              </Button>
              <Button
                size="sm"
                variant={modelSortType === "expensive" ? "default" : "outline"}
                onClick={() => setModelSortType("expensive")}
                className="text-xs"
              >
                Najdroższe
              </Button>
            </div>

            {/* Model select */}
            <div className="flex items-center gap-2">
              <select
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              >
                <option value="@edenai">@edenai (routing automatyczny)</option>
                {sortModels(models, modelSortType).map((m) => {
                  const { formatted: pricing } = formatPricing(m.pricing);
                  const ctx = m.context_length ? ` ${(m.context_length / 1000).toFixed(0)}k` : "";
                  const price = pricing ? ` [${pricing}]` : "";
                  return (
                    <option key={m.id} value={m.id}>
                      {m.id}
                      {ctx}
                      {price}
                    </option>
                  );
                })}
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadModels}
                disabled={modelsLoading}
                aria-label="Odśwież listę modeli"
              >
                <RefreshCw className={`size-4 ${modelsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Model info card */}
            {settings.model !== "@edenai" && (
              (() => {
                const currentModel = models.find((m) => m.id === settings.model);
                if (!currentModel) return null;

                const { formatted: pricingFormatted, raw: pricingRaw } = formatPricing(
                  currentModel.pricing,
                );
                const ctxInfo = currentModel.context_length
                  ? `${(currentModel.context_length / 1000).toFixed(0)}k tokens`
                  : "";

                // Debug: log pricing data to console
                if (!pricingFormatted && Object.keys(pricingRaw).length > 0) {
                  console.warn(
                    `Model ${currentModel.id} has pricing data but couldn't parse standard token rates:`,
                    pricingRaw,
                  );
                }

                return (
                  <div className="rounded-sm border border-border bg-muted p-3 text-xs text-muted-foreground space-y-1">
                    {ctxInfo && <p>Kontekst: {ctxInfo}</p>}
                    {pricingFormatted ? (
                      <p>
                        Koszt: <span className="font-mono">{pricingFormatted}</span> za 1M
                        tokenów (input / output)
                      </p>
                    ) : Object.keys(pricingRaw).length === 0 ? (
                      <p className="text-yellow-600 dark:text-yellow-500">
                        ⚠️ Dane pricing nie są dostępne (brak uprawnień)
                      </p>
                    ) : (
                      <p className="text-yellow-600 dark:text-yellow-500">
                        ℹ️ Pricing dostępne ale w specjalnym formacie (np. po obrazach)
                      </p>
                    )}
                    {currentModel.description && <p className="mt-2">{currentModel.description}</p>}
                  </div>
                );
              })()
            )}

            {modelsError && <p className="text-xs text-red-500">{modelsError}</p>}
            {modelsLoading && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Ładowanie listy modeli…
              </p>
            )}
          </div>
        </section>

        <Separator />

        {/* ── System Prompt ─────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">System prompt</h3>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
            placeholder="Np. Jesteś pomocnym asystentem edukacyjnym…"
            rows={4}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            Instrukcja dla modelu, która określa jego zachowanie w rozmowie.
          </p>
        </section>

        <Separator />

        {/* ── Parameters ───────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Parametry modelu</h3>
          <div className="space-y-4">
            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm">Temperature</label>
                <span className="text-xs text-muted-foreground">{settings.params.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.params.temperature}
                onChange={(e) => updateParams({ temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Niższe wartości = bardziej deterministyczne, wyższe = bardziej kreatywne
              </p>
            </div>

            {/* Max tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm">Max tokens</label>
                <span className="text-xs text-muted-foreground">{settings.params.max_tokens}</span>
              </div>
              <input
                type="range"
                min="1"
                max="16384"
                step="256"
                value={settings.params.max_tokens}
                onChange={(e) => updateParams({ max_tokens: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm">Top P</label>
                <span className="text-xs text-muted-foreground">{settings.params.top_p}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.params.top_p}
                onChange={(e) => updateParams({ top_p: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Frequency penalty */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm">Frequency penalty</label>
                <span className="text-xs text-muted-foreground">
                  {settings.params.frequency_penalty}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={settings.params.frequency_penalty}
                onChange={(e) =>
                  updateParams({
                    frequency_penalty: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            {/* Presence penalty */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm">Presence penalty</label>
                <span className="text-xs text-muted-foreground">
                  {settings.params.presence_penalty}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={settings.params.presence_penalty}
                onChange={(e) =>
                  updateParams({
                    presence_penalty: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSettings({ params: { ...DEFAULT_PARAMS } })}
          >
            Przywróć domyślne
          </Button>
        </section>

        <Separator />

        {/* ── Fallbacks ─────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Modele fallback</h3>
          <p className="text-xs text-muted-foreground">
            Modele alternatywne wypróbowywane w kolejności, gdy główny model zawiedzie.
          </p>
          <div className="space-y-2">
            {settings.fallbacks.map((fb, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={fb}
                  onChange={(e) => {
                    const updated = [...settings.fallbacks];
                    updated[i] = e.target.value;
                    updateSettings({ fallbacks: updated });
                  }}
                  placeholder="np. anthropic/claude-3-5-sonnet"
                  className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = settings.fallbacks.filter((_, idx) => idx !== i);
                    updateSettings({ fallbacks: updated });
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateSettings({
                  fallbacks: [...settings.fallbacks, ""],
                })
              }
              disabled={settings.fallbacks.length >= 3}
            >
              + Dodaj fallback
            </Button>
          </div>
        </section>

        <Separator />

        {/* ── Pre/Post Hooks ────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Pre-hooks & Post-hooks</h3>
          <p className="text-xs text-muted-foreground">
            Pre-hooks przetwarzają dane wejściowe przed modelem (np. pdf_text_extract). Post-hooks
            przetwarzają wyjście po modelu (np. json_heal).
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pre-hooks</label>
            {settings.preHooks.map((hook, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={hook.action}
                  onChange={(e) => {
                    const updated = [...settings.preHooks];
                    updated[i] = { ...updated[i], action: e.target.value };
                    updateSettings({ preHooks: updated });
                  }}
                  placeholder="np. pdf_text_extract"
                  className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = settings.preHooks.filter((_, idx) => idx !== i);
                    updateSettings({ preHooks: updated });
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateSettings({
                  preHooks: [...settings.preHooks, { action: "" }],
                })
              }
            >
              + Dodaj pre-hook
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Post-hooks</label>
            {settings.postHooks.map((hook, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={hook.action}
                  onChange={(e) => {
                    const updated = [...settings.postHooks];
                    updated[i] = { ...updated[i], action: e.target.value };
                    updateSettings({ postHooks: updated });
                  }}
                  placeholder="np. json_heal"
                  className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = settings.postHooks.filter((_, idx) => idx !== i);
                    updateSettings({ postHooks: updated });
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateSettings({
                  postHooks: [...settings.postHooks, { action: "" }],
                })
              }
            >
              + Dodaj post-hook
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
