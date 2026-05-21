"use client";

import MiniSearch from "minisearch";
import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { HighlightText, extractSearchTerms } from "@/components/narzedzia/highlight-text";
import { useInfiniteScroll } from "@/components/narzedzia/use-infinite-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiToolView, AiToolsDatabase } from "@/lib/ai-tools";
import {
  ACCESS_LABELS,
  AI_TOOL_ACCESS_LEVELS,
  AI_TOOL_CATEGORIES,
  CATEGORY_LABELS,
  formatSyncDate,
} from "@/lib/ai-tools";
import type { AiToolAccess, AiToolCategory } from "@/lib/ai-tools-types";

const PAGE_SIZE = 30;
const DEBOUNCE_MS = 200;

type SortKey = "name" | "category" | "access";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Alfabetycznie" },
  { value: "category", label: "Kategoria" },
  { value: "access", label: "Dostęp" },
];

function compareTools(a: AiToolView, b: AiToolView, sort: SortKey): number {
  if (sort === "category") {
    return (
      a.categoryLabel.localeCompare(b.categoryLabel, "pl") ||
      a.name.localeCompare(b.name, "pl")
    );
  }
  if (sort === "access") {
    return (
      a.accessLabel.localeCompare(b.accessLabel, "pl") ||
      a.name.localeCompare(b.name, "pl")
    );
  }
  return a.name.localeCompare(b.name, "pl");
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: AiToolView[]): string {
  const header = [
    "Nazwa",
    "Kategoria",
    "Dostęp",
    "Funkcje",
    "Opis",
    "Kategoria źródłowa",
    "Link",
    "Źródła",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [
      row.name,
      row.categoryLabel,
      row.accessLabel,
      row.featuresText,
      row.description,
      row.sourceCategory,
      row.url,
      row.sources.join("; "),
    ]
      .map(escape)
      .join(","),
  );
  return [header.map(escape).join(","), ...lines].join("\n");
}

interface AiToolsDirectoryProps {
  database: AiToolsDatabase;
  tools: AiToolView[];
}

export function AiToolsDirectory({ database, tools }: AiToolsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AiToolCategory | "all">("all");
  const [accessFilter, setAccessFilter] = useState<AiToolAccess | "all">("all");
  const [sort, setSort] = useState<SortKey>("name");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const miniSearch = useMemo(() => {
    const engine = new MiniSearch({
      fields: ["name", "description", "featuresText", "categoryLabel", "accessLabel", "sourceCategory"],
      storeFields: ["id"],
      searchOptions: {
        prefix: true,
        fuzzy: 0.15,
        boost: { name: 3, featuresText: 2, categoryLabel: 1.5 },
      },
    });
    engine.addAll(tools);
    return engine;
  }, [tools]);

  const searchTerms = useMemo(() => extractSearchTerms(debouncedQuery), [debouncedQuery]);

  const filtered = useMemo(() => {
    let ids: string[] | null = null;

    if (debouncedQuery.trim()) {
      const results = miniSearch.search(debouncedQuery.trim(), { combineWith: "AND" });
      ids = results.map((result) => result.id);
    }

    const idSet = ids ? new Set(ids) : null;

    const rows = tools.filter((tool) => {
      if (idSet && !idSet.has(tool.id)) return false;
      if (categoryFilter !== "all" && tool.category !== categoryFilter) return false;
      if (accessFilter !== "all" && tool.access !== accessFilter) return false;
      return true;
    });

    return [...rows].sort((a, b) => compareTools(a, b, sort));
  }, [tools, miniSearch, debouncedQuery, categoryFilter, accessFilter, sort]);

  const { visibleItems, visibleCount, totalCount, hasMore, sentinelRef } =
    useInfiniteScroll(filtered, PAGE_SIZE);

  return (
    <div className="space-y-8">
      <section className="space-y-4 border border-border bg-card p-5">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Szukaj</span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nazwa, opis, funkcje, kategoria, dostęp…"
                className="h-10 w-full rounded-sm border border-input bg-background pr-3 pl-9 text-sm"
                aria-label="Szukaj narzędzi AI"
              />
            </div>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Kategoria</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as AiToolCategory | "all")}
              className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="all">Wszystkie</option>
              {AI_TOOL_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Dostęp</span>
            <select
              value={accessFilter}
              onChange={(event) => setAccessFilter(event.target.value as AiToolAccess | "all")}
              className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="all">Wszystkie</option>
              {AI_TOOL_ACCESS_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {ACCESS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Sortowanie</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Wyniki: <span className="font-semibold text-foreground">{filtered.length}</span> z{" "}
            {tools.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTextFile("narzedzia-ai.csv", toCsv(filtered), "text/csv;charset=utf-8")}
            >
              <Download className="size-3.5" />
              Eksport CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTextFile(
                  "narzedzia-ai.json",
                  JSON.stringify(filtered, null, 2),
                  "application/json",
                )
              }
            >
              <Download className="size-3.5" />
              Eksport JSON
            </Button>
          </div>
        </div>
      </section>

      <div className="hidden overflow-x-auto border border-border md:block">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/50 font-mono text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Nazwa</th>
              <th className="px-4 py-3 font-semibold">Kategoria</th>
              <th className="px-4 py-3 font-semibold">Dostęp</th>
              <th className="px-4 py-3 font-semibold">Funkcje</th>
              <th className="px-4 py-3 font-semibold">Opis</th>
              <th className="px-4 py-3 font-semibold">Link</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((tool) => (
              <tr key={tool.id} className="border-b border-border align-top last:border-b-0">
                <td className="px-4 py-3 font-semibold">
                  <HighlightText text={tool.name} terms={searchTerms} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <HighlightText text={tool.categoryLabel} terms={searchTerms} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    <HighlightText text={tool.sourceCategory} terms={searchTerms} />
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <HighlightText text={tool.accessLabel} terms={searchTerms} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tool.features.slice(0, 4).map((feature) => (
                      <Badge key={feature} variant="outline" className="font-normal">
                        <HighlightText text={feature} terms={searchTerms} />
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="max-w-sm px-4 py-3 text-muted-foreground">
                  <HighlightText text={tool.description} terms={searchTerms} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    Otwórz
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {visibleItems.map((tool) => (
          <article key={tool.id} className="space-y-3 border border-border p-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black">
                <HighlightText text={tool.name} terms={searchTerms} />
              </h2>
              <p className="text-xs text-muted-foreground">
                <HighlightText text={tool.sourceCategory} terms={searchTerms} />
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                <HighlightText text={tool.categoryLabel} terms={searchTerms} />
              </Badge>
              <Badge variant="outline">
                <HighlightText text={tool.accessLabel} terms={searchTerms} />
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {tool.features.slice(0, 5).map((feature) => (
                <Badge key={feature} variant="outline" className="font-normal">
                  <HighlightText text={feature} terms={searchTerms} />
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <HighlightText text={tool.description} terms={searchTerms} />
            </p>
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm underline-offset-4 hover:underline"
            >
              Otwórz narzędzie
            </a>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Brak wyników dla podanych filtrów. Spróbuj zmienić frazę lub kategorię.
        </p>
      ) : null}

      <div
        className="flex flex-col items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <p>
          Wyświetlono{" "}
          <span className="font-semibold text-foreground">{visibleCount}</span> z{" "}
          <span className="font-semibold text-foreground">{totalCount}</span>
        </p>
        {hasMore ? (
          <>
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
            <p className="font-mono text-xs uppercase">Przewiń w dół, aby załadować kolejne…</p>
          </>
        ) : totalCount > 0 ? (
          <p className="font-mono text-xs uppercase">To wszystkie wyniki</p>
        ) : null}
      </div>

      <footer className="space-y-6 border-t border-border pt-8 text-sm text-muted-foreground">
        <div className="space-y-2">
          <h2 className="text-base font-black text-foreground">Źródła danych</h2>
          <p>
            Ostatnia synchronizacja z GitHub:{" "}
            <time dateTime={database.syncedAt}>{formatSyncDate(database.syncedAt)}</time>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {database.sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  {source.name}
                </a>
                {" — "}
                podziękowania dla: {source.author}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-black text-foreground">Informacje prawne</h2>
          <p>
            Lista ma charakter edukacyjny i informacyjny. AI Literacy Lab nie jest powiązany z
            wymienionymi usługami, nie prowadzi sprzedaży ani nie otrzymuje prowizji za kliknięcia.
            Linki zewnętrzne otwierają się w nowej karcie — przed użyciem w zajęciach sprawdź
            regulamin, politykę prywatności (RODO) oraz aktualny model cenowy narzędzia.
          </p>
          <p>
            Dane pochodzą z publicznych repozytoriów społecznościowych; nie gwarantujemy pełnej
            aktualności ani dostępności usług. Metadane (kategoria, dostęp, opis) są generowane
            automatycznie na podstawie treści list — mogą wymagać weryfikacji ręcznej.
          </p>
        </div>
      </footer>
    </div>
  );
}
