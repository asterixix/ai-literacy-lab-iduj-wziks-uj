"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, RefreshCw, AlertCircle, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCredits, getConsumptions } from "@/lib/eden-ai";

interface CostsPanelProps {
  apiKey: string;
}

interface CostEntry {
  feature: string;
  subfeature: string;
  totalCost: number;
  details: number;
  costPerProvider: Record<string, number>;
}

export function CostsPanel({ apiKey }: CostsPanelProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialError, setPartialError] = useState<string | null>(null);
  const [noPermissions, setNoPermissions] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPartialError(null);
    setNoPermissions(false);
    try {
      // Fetch credits — gracefully handles 403
      const creditsRes = await getCredits(apiKey);
      const hasNoPermissions = creditsRes._noPermissions === true;
      setCredits(creditsRes.credits);

      // Fetch consumptions — handle gracefully if fails
      let consumptionsRes = null;
      let consumptionsFailed = false;
      try {
        consumptionsRes = await getConsumptions(apiKey, {
          begin: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
            .toISOString()
            .split("T")[0],
          end: new Date().toISOString().split("T")[0],
          step: 4,
        });
      } catch (consumErr) {
        // If consumptions fail with 403, it's a permission issue
        if (consumErr instanceof Error && consumErr.message.includes("403")) {
          consumptionsFailed = true;
        } else {
          throw consumErr;
        }
      }

      // If either endpoint has _noPermissions or consumptions failed with 403, mark no permissions
      if (hasNoPermissions || consumptionsFailed) {
        setNoPermissions(true);
        setCredits(0);
        setCosts([]);
        return;
      }

      // Process consumption data if available
      if (consumptionsRes && consumptionsRes.response && consumptionsRes.response.length > 0) {
        const entries: CostEntry[] = [];
        const data = consumptionsRes.response[0]?.data ?? {};
        for (const month of Object.values(data)) {
          for (const [subfeatureKey, entry] of Object.entries(month as Record<string, unknown>)) {
            const e = entry as {
              total_cost: number;
              details: number;
              cost_per_provider: Record<string, number>;
            };
            const [feature, subfeature] = subfeatureKey.split("__");
            entries.push({
              feature: feature ?? "",
              subfeature: subfeature ?? "",
              totalCost: e.total_cost,
              details: e.details,
              costPerProvider: e.cost_per_provider,
            });
          }
        }

        // Aggregate by feature/subfeature
        const aggregated = new Map<string, CostEntry>();
        for (const entry of entries) {
          const key = `${entry.feature}__${entry.subfeature}`;
          const existing = aggregated.get(key);
          if (existing) {
            existing.totalCost += entry.totalCost;
            existing.details += entry.details;
            for (const [provider, cost] of Object.entries(entry.costPerProvider)) {
              existing.costPerProvider[provider] = (existing.costPerProvider[provider] ?? 0) + cost;
            }
          } else {
            aggregated.set(key, { ...entry, costPerProvider: { ...entry.costPerProvider } });
          }
        }

        setCosts(Array.from(aggregated.values()).sort((a, b) => b.totalCost - a.totalCost));
      } else {
        setCosts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const featureLabels: Record<string, string> = {
    text: "Tekst",
    image: "Obraz",
    audio: "Audio",
    video: "Wideo",
    ocr: "OCR",
    translation: "Tłumaczenie",
  };

  const subfeatureLabels: Record<string, string> = {
    chat: "Czat",
    generation: "Generowanie",
    embeddings: "Embeddings",
    sentiment_analysis: "Analiza sentymentu",
    ai_detection: "Wykrywanie AI",
    moderation: "Moderacja",
    summarization: "Podsumowanie",
    ocr: "OCR",
    question_answer: "Q&A",
    explicit_content: "Treści nieodpowiednie",
    speech_to_text: "Mowa→Tekst",
    text_to_speech: "Tekst→Mowa",
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">Monitorowanie kosztów</h2>
          <p className="text-xs text-muted-foreground">Śledź zużycie kredytów i koszty API</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="ml-1.5">Odśwież</span>
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* No permissions warning */}
      {noPermissions && !error && (
        <div className="flex items-center gap-2 border-b border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-700 dark:text-blue-400">
          <AlertCircle className="size-4 shrink-0" />
          Token użytkownika z limitem — monitorowanie kosztów niedostępne. Pełne statystyki są dostępne dla tokenów admin.
        </div>
      )}

      {/* Partial error (warning) */}
      {partialError && !error && !noPermissions && (
        <div className="flex items-center gap-2 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="size-4 shrink-0" />
          {partialError}
        </div>
      )}

      {/* Credits card */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3 rounded-sm border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
            <Wallet className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dostępne kredyty</p>
            <p className="text-2xl font-bold">
              {noPermissions ? "Niedostępne" : credits !== null ? `$${credits.toFixed(2)}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="flex-1 overflow-y-auto p-4">
        {noPermissions ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-3 size-10 text-blue-500/50" />
            <p className="text-sm text-muted-foreground">
              Token użytkownika z limitem nie ma dostępu do pełnych statystyk kosztów.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Aby zobaczyć szczegółowe statystyki, użyj tokenu z uprawnieniami administratora.
            </p>
          </div>
        ) : costs.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingDown className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Brak danych o kosztach za ostatnie 3 miesiące.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Podział kosztów
            </h3>
            {costs.map((entry, i) => (
              <div key={i} className="rounded-sm border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {featureLabels[entry.feature] ?? entry.feature} →{" "}
                      {subfeatureLabels[entry.subfeature] ?? entry.subfeature}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.details} {entry.details === 1 ? "wywołanie" : "wywołań"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCost(entry.totalCost)}</p>
                </div>
                {Object.keys(entry.costPerProvider).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(entry.costPerProvider).map(([provider, cost]) => (
                      <Badge key={provider} variant="outline" className="text-xs">
                        {provider}: {formatCost(cost)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
