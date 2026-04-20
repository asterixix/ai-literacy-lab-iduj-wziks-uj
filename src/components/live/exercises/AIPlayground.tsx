"use client";

import { useCallback, useId, useRef, useState } from "react";

import {
  EDEN_MODELS,
  type EdenModel,
  edenSettings,
  formatCost,
  type GenerationParams,
  groupByProvider,
  PROVIDER_ORDER,
  TIER_LABELS,
} from "@/lib/live/eden-models";

const MAX_MODELS = 4;
const MAX_CHARS = 3500; // ≈ 1000 tokens

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelResult {
  text: string | null;
  cost: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  error: string | null;
}

interface ConversationTurn {
  id: string;
  prompt: string;
  results: Record<string, ModelResult>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: EdenModel["tier"] }) {
  const colors: Record<EdenModel["tier"], string> = {
    free: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    cheap: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    mid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    premium: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-1.5 py-0.5 font-mono text-[10px] uppercase ${colors[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

function ModelResultCard({
  provider,
  model,
  result,
}: {
  provider: string;
  model: EdenModel | undefined;
  result: ModelResult;
}) {
  return (
    <div
      className={`flex flex-col gap-3 border p-4 ${result.error ? "border-red-300 dark:border-red-800" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {model?.providerLabel ?? provider}
          </p>
          <p className="font-semibold text-sm">{model?.displayName ?? provider}</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{result.latencyMs}ms</span>
      </div>

      {result.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
      ) : (
        <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">{result.text}</p>
      )}

      {!result.error && (
        <div className="flex flex-wrap gap-3 border-t border-border pt-2 text-xs text-muted-foreground font-mono">
          {result.inputTokens !== null && <span>In: {result.inputTokens}t</span>}
          {result.outputTokens !== null && <span>Out: {result.outputTokens}t</span>}
          {result.cost !== null && (
            <span className="ml-auto font-medium text-foreground">{formatCost(result.cost)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function ModelSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-3 border border-border p-4 animate-pulse">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
        <div className="h-3 w-4/6 rounded bg-muted" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIPlayground() {
  const idPrefix = useId();
  const [selectedModels, setSelectedModels] = useState<EdenModel[]>([]);
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(true);

  // Generation parameters
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [topK, setTopK] = useState(50);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [paramsOpen, setParamsOpen] = useState(false);

  const conversationEndRef = useRef<HTMLDivElement>(null);

  const grouped = groupByProvider(EDEN_MODELS);
  const estimatedTokens = estimateTokens(prompt);
  const canSend =
    selectedModels.length > 0 && prompt.trim().length > 0 && !loading && estimatedTokens <= 1000;

  function toggleModel(model: EdenModel) {
    setSelectedModels((prev) => {
      const exists = prev.some((m) => m.provider === model.provider && m.modelId === model.modelId);
      if (exists)
        return prev.filter((m) => !(m.provider === model.provider && m.modelId === model.modelId));

      const withoutProvider = prev.filter((m) => m.provider !== model.provider);
      if (withoutProvider.length >= MAX_MODELS) return prev;

      return [...withoutProvider, model];
    });
  }

  const sendPrompt = useCallback(async () => {
    if (!canSend) return;
    const userPrompt = prompt.trim();
    setPrompt("");
    setLoading(true);
    setGlobalError(null);
    setSelectorOpen(false);

    // Build history from previous turns (first model's responses as assistant side)
    const firstProvider = selectedModels[0]?.provider;
    const history = turns.flatMap((t) => {
      const assistantText = firstProvider ? t.results[firstProvider]?.text : null;
      return [
        { role: "user" as const, content: t.prompt },
        ...(assistantText ? [{ role: "assistant" as const, content: assistantText }] : []),
      ];
    });

    // Generate unique turn ID (crypto-based to avoid collisions)
    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    setTurns((prev) => [...prev, { id: turnId, prompt: userPrompt, results: {} }]);

    setTimeout(() => conversationEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch("/api/live/eden-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providers: selectedModels.map((m) => m.provider),
          settings: edenSettings(selectedModels),
          prompt: userPrompt,
          history,
          params: {
            temperature,
            top_p: topP,
            top_k: topK,
            max_tokens: maxTokens,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
          } as GenerationParams,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setGlobalError(data.error ?? `HTTP ${res.status}`);
        setTurns((prev) => prev.filter((t) => t.id !== turnId));
        return;
      }

      setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, results: data.results } : t)));

      // Extract input and output tokens per model
      const inputTokensPerModel: number[] = [];
      const outputTokensPerModel: number[] = [];
      for (const provider of selectedModels) {
        const result = data.results?.[provider.provider];
        if (result) {
          if (typeof result.inputTokens === "number") inputTokensPerModel.push(result.inputTokens);
          if (typeof result.outputTokens === "number")
            outputTokensPerModel.push(result.outputTokens);
        }
      }

      // Count custom parameters (non-default values)
      let customParamCount = 0;
      if (temperature !== 0.7) customParamCount++;
      if (topP !== 1.0) customParamCount++;
      if (topK !== 50) customParamCount++;
      if (maxTokens !== 2000) customParamCount++;
      if (frequencyPenalty !== 0) customParamCount++;
      if (presencePenalty !== 0) customParamCount++;

      void fetch("/api/live/exercises/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: "porownanie",
          eventType: "prompt_sent",
          inputTokensPerModel,
          outputTokensPerModel,
          customParamCount,
          metadata: {
            providers: selectedModels.map((m) => m.provider),
            promptLength: userPrompt.length,
            temperature,
            topP,
            topK,
            maxTokens,
            frequencyPenalty,
            presencePenalty,
          },
          dedupeKey: turnId,
          noDedup: true,
        }),
      });

      setTimeout(() => conversationEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setGlobalError(msg);
      setTurns((prev) => prev.filter((t) => t.id !== turnId));
    } finally {
      setLoading(false);
    }
  }, [
    canSend,
    prompt,
    selectedModels,
    turns,
    temperature,
    topP,
    topK,
    maxTokens,
    frequencyPenalty,
    presencePenalty,
  ]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendPrompt();
    }
  }

  const gridCols =
    selectedModels.length <= 1
      ? "grid-cols-1"
      : selectedModels.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="flex flex-col gap-6">
      {/* Model selector */}
      <div className="border border-border">
        <button
          type="button"
          onClick={() => setSelectorOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span>
            Wybrane modele:{" "}
            {selectedModels.length === 0
              ? "brak (wybierz 1–4)"
              : selectedModels.map((m) => m.displayName).join(", ")}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {selectedModels.length}/{MAX_MODELS} {selectorOpen ? "▲" : "▼"}
          </span>
        </button>

        {selectorOpen && (
          <div className="border-t border-border p-4 space-y-4 max-h-80 overflow-y-auto">
            {PROVIDER_ORDER.filter((p) => grouped[p]).map((providerKey) => (
              <div key={providerKey}>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {grouped[providerKey][0].providerLabel}
                </p>
                <div className="space-y-1">
                  {grouped[providerKey].map((model) => {
                    const isSelected = selectedModels.some(
                      (m) => m.provider === model.provider && m.modelId === model.modelId,
                    );
                    const providerSelected = selectedModels.some(
                      (m) => m.provider === model.provider,
                    );
                    const isDisabled =
                      !isSelected && !providerSelected && selectedModels.length >= MAX_MODELS;
                    return (
                      <button
                        type="button"
                        key={`${model.provider}/${model.modelId}`}
                        onClick={() => toggleModel(model)}
                        disabled={isDisabled}
                        className={`flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <span className="flex-1 font-medium">{model.displayName}</span>
                        <TierBadge tier={model.tier} />
                        <span className="font-mono text-xs opacity-70">
                          ${model.inputCostPer1M.toFixed(2)}/1M
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation */}
      {turns.length > 0 && (
        <div className="space-y-6">
          {turns.map((turn) => (
            <div key={turn.id} className="space-y-3">
              {/* User bubble */}
              <div className="flex justify-end">
                <div className="max-w-xl border border-border bg-muted px-4 py-2 text-sm leading-relaxed">
                  {turn.prompt}
                </div>
              </div>

              {/* Model responses */}
              {Object.keys(turn.results).length === 0 && loading ? (
                <div className={`grid gap-3 ${gridCols}`}>
                  {selectedModels.map((m) => (
                    <ModelSkeleton key={`${m.provider}/${m.modelId}`} label={m.displayName} />
                  ))}
                </div>
              ) : (
                <div className={`grid gap-3 ${gridCols}`}>
                  {selectedModels.map((m) => {
                    const result = turn.results[m.provider];
                    if (!result) return null;
                    return (
                      <ModelResultCard
                        key={`${m.provider}/${m.modelId}`}
                        provider={m.provider}
                        model={m}
                        result={result}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <p
          role="alert"
          className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {globalError}
        </p>
      )}

      {/* Generation parameters */}
      <div className="border border-border">
        <button
          type="button"
          onClick={() => setParamsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span>Parametry generacji</span>
          <span className="text-xs text-muted-foreground">{paramsOpen ? "▲" : "▼"}</span>
        </button>

        {paramsOpen && (
          <div className="border-t border-border p-4 space-y-4">
            {/* Temperature */}
            <div>
              <label
                htmlFor={`${idPrefix}-temperature`}
                className="flex items-center justify-between text-sm font-medium mb-2"
              >
                <span>Temperatura: {temperature.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">(0.0 - 2.0)</span>
              </label>
              <input
                id={`${idPrefix}-temperature`}
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wyższa wartość = bardziej kreatywne odpowiedzi
              </p>
            </div>

            {/* Top P */}
            <div>
              <label
                htmlFor={`${idPrefix}-top-p`}
                className="flex items-center justify-between text-sm font-medium mb-2"
              >
                <span>Top-P (Nucleus): {topP.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">(0.0 - 1.0)</span>
              </label>
              <input
                id={`${idPrefix}-top-p`}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wybiera tokeny z najmniejszego zbioru o skumulowanym prawdopodobieństwie
              </p>
            </div>

            {/* Top K */}
            <div>
              <label
                htmlFor={`${idPrefix}-top-k`}
                className="flex items-center justify-between text-sm font-medium mb-2"
              >
                <span>Top-K: {topK}</span>
                <span className="text-xs text-muted-foreground">(1 - 100)</span>
              </label>
              <input
                id={`${idPrefix}-top-k`}
                type="range"
                min="1"
                max="100"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Wybiera K najbardziej prawdopodobnych tokenów
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label
                htmlFor={`${idPrefix}-max-tokens`}
                className="flex items-center justify-between text-sm font-medium mb-2"
              >
                <span>Maks. tokeny: {maxTokens}</span>
                <span className="text-xs text-muted-foreground">(1 - 4000)</span>
              </label>
              <input
                id={`${idPrefix}-max-tokens`}
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maksymalna długość odpowiedzi modelu
              </p>
            </div>

            {/* Frequency Penalty */}
            <div>
              <label
                htmlFor={`${idPrefix}-frequency-penalty`}
                className="flex items-center justify-between text-sm font-medium mb-2"
              >
                <span>Frequency Penalty: {frequencyPenalty.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">(-2.0 - 2.0)</span>
              </label>
              <input
                id={`${idPrefix}-frequency-penalty`}
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={frequencyPenalty}
                onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Karze model za powtarzanie tokenów — wyższa wartość = mniej powtórzeń
              </p>
            </div>

            {/* Presence Penalty */}
            <div>
              <label
                htmlFor={`${idPrefix}-presence-penalty`}
                className="flex items-center justify-between text-sm font-medium mb-2"
              >
                <span>Presence Penalty: {presencePenalty.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">(-2.0 - 2.0)</span>
              </label>
              <input
                id={`${idPrefix}-presence-penalty`}
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={presencePenalty}
                onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Karze za dowolne użycie tokena — zachęca do nowych tematów
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-4 border border-border bg-background shadow-sm">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedModels.length === 0
              ? "Najpierw wybierz co najmniej jeden model powyżej…"
              : "Wpisz prompt i kliknij Wyślij (lub Ctrl+Enter)…"
          }
          disabled={loading || selectedModels.length === 0}
          rows={4}
          className="w-full resize-none bg-transparent px-4 pt-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2">
          <span
            className={`font-mono text-xs ${estimatedTokens > 900 ? "text-red-600 dark:text-red-400 font-bold" : "text-muted-foreground"}`}
          >
            ≈{estimatedTokens} / 1000 tokenów
          </span>
          <div className="flex items-center gap-3">
            {turns.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTurns([]);
                  setSelectorOpen(true);
                  setGlobalError(null);
                }}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Wyczyść rozmowę
              </button>
            )}
            <button
              type="button"
              onClick={sendPrompt}
              disabled={!canSend}
              className="border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Wysyłam…" : `Wyślij do ${selectedModels.length || "?"} modeli`}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Wysyłane przez serwer — klucz API Eden AI nie jest widoczny w przeglądarce.
      </p>
    </div>
  );
}
