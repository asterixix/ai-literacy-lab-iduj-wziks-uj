"use client";

import { useMemo, useState } from "react";

import { glossaryCategoryLabels, glossaryEntries, glossarySources, type GlossaryCategory } from "@/lib/glossary-pojecia";

const ALL_CATEGORIES = "all" as const;

type FilterCategory = GlossaryCategory | typeof ALL_CATEGORIES;

function getFirstLetter(term: string): string {
  const normalized = term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  const first = normalized.charAt(0);
  return /[A-Z]/.test(first) ? first : "#";
}

function PojeciaNieMamClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterCategory>(ALL_CATEGORIES);

  const categories = useMemo(() => Object.entries(glossaryCategoryLabels), []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return glossaryEntries.filter((entry) => {
      const categoryMatch = category === ALL_CATEGORIES || entry.category === category;
      if (!categoryMatch) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        entry.term,
        entry.simple,
        entry.analogy,
        entry.commonMistake,
        entry.promptExample,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [category, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();

    filtered.forEach((entry) => {
      const letter = getFirstLetter(entry.term);
      const current = map.get(letter) ?? [];
      current.push(entry);
      map.set(letter, current);
    });

    return Array.from(map.entries()).sort(([left], [right]) => left.localeCompare(right, "pl"));
  }, [filtered]);

  const letters = useMemo(() => grouped.map(([letter]) => letter), [grouped]);

  return (
    <div className="container-wide py-14">
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase text-muted-foreground">Ukryta strefa · słownik pojęć</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Pojęcia ni mom, więc chce wiedzieć wincyj</h1>
        <p className="max-w-3xl text-muted-foreground">
          Słownik tłumaczy pojęcia z kursu prostym językiem, czasem z lekkim sarkazmem, ale zawsze bez wyśmiewania
          ludzi. Tu roastujemy mity, nie osoby.
        </p>
      </header>

      <section className="mb-8 space-y-4 border border-border bg-card p-5">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <label className="space-y-2 text-sm">
            <span className="font-semibold">Szukaj pojęcia</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="np. RAG, tokenizacja, halucynacja, prompt injection"
              className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-semibold">Filtr kategorii</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as FilterCategory)}
              className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value={ALL_CATEGORIES}>Wszystkie kategorie</option>
              {categories.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
          <span className="font-semibold uppercase text-muted-foreground">Skok A-Z:</span>
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#litera-${letter}`}
              className="rounded-sm border border-border px-2 py-1 font-mono hover:bg-muted"
            >
              {letter}
            </a>
          ))}
        </div>

        <p className="font-mono text-xs uppercase text-muted-foreground">Wyniki: {filtered.length}</p>
      </section>

      <section className="space-y-8">
        {grouped.length === 0 && (
          <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
            Brak wyników. Spróbuj krótszego hasła albo zmień kategorię.
          </div>
        )}

        {grouped.map(([letter, entries]) => (
          <section key={letter} id={`litera-${letter}`} className="space-y-3">
            <h2 className="border-b border-border pb-2 text-2xl font-black">{letter}</h2>

            {entries.map((entry) => (
              <details key={entry.slug} className="group border border-border bg-card p-0 open:bg-muted/20">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
                  <span className="space-y-1">
                    <span className="block text-lg font-bold">{entry.term}</span>
                    <span className="block text-xs uppercase text-muted-foreground">
                      {glossaryCategoryLabels[entry.category]}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground group-open:hidden">Rozwiń</span>
                  <span className="hidden font-mono text-xs text-muted-foreground group-open:inline">Zwiń</span>
                </summary>

                <div className="space-y-4 border-t border-border p-4 text-sm">
                  <div>
                    <p className="mb-1 font-semibold">Po ludzku</p>
                    <p className="text-muted-foreground">{entry.simple}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-semibold">Analogią z życia</p>
                    <p className="text-muted-foreground">{entry.analogy}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-semibold">Najczęstsza pomyłka</p>
                    <p className="text-muted-foreground">{entry.commonMistake}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-semibold">Mini-przykład promptu</p>
                    <p className="border border-border bg-background p-3 font-mono text-xs">{entry.promptExample}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-semibold">Źródła</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {entry.sourceIds.map((sourceId) => {
                        const source = glossarySources[sourceId];
                        if (!source) {
                          return null;
                        }

                        return (
                          <li key={`${entry.slug}-${source.id}`}>
                            {source.type === "external" ? (
                              <a href={source.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                                {source.label}
                              </a>
                            ) : (
                              <a href={source.href} className="underline-offset-4 hover:underline">
                                {source.label}
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </section>
        ))}
      </section>
    </div>
  );
}

export { PojeciaNieMamClient };
