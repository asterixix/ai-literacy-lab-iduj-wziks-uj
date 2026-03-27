import type { Module } from "@/types";

export const modules: Module[] = [
  {
    slug: "podstawy-ai",
    number: 1,
    title: "Podstawy AI – LLM, RAG, Agenty AI, MCP",
    titleEn: "AI Fundamentals – LLMs, RAG, AI Agents, MCP",
    duration: "2 godziny",
    description:
      "Wprowadzenie do podstawowych pojęć AI generatywnej: jak działają LLM-y, RAG i agenty AI oraz jak używać ich odpowiedzialnie w środowisku akademickim.",
    tags: ["LLM", "RAG", "Agenty AI", "MCP"],
    instructor: "Artur Sendyka",
    objectives: [
      "Wyjaśnia różnice między LLM, RAG i agentem AI.",
      "Rozpoznaje ograniczenia modeli i ich konsekwencje.",
      "Wskazuje przykłady użycia AI w pracy studenta i badacza.",
    ],
    tools: ["OpenRouter API", "Miro", "Przeglądarka internetowa"],
    dates: [
      { group: "Grupa 1", date: "14.04.2026", time: "17:00-19:00" },
      { group: "Grupa 2", date: "15.04.2026", time: "17:00-19:00" },
    ],
  },
  {
    slug: "ai-na-codzien",
    number: 2,
    title: "AI na co dzień – produktywność, research i organizacja pracy",
    titleEn: "AI in Daily Work – Productivity, Research, and Organization",
    duration: "2 godziny",
    description:
      "Praktyczne scenariusze wykorzystania AI w codziennej nauce: notatki, streszczenia, planowanie i weryfikacja informacji.",
    tags: ["Produktywność", "Research", "Notatki", "Workflow"],
    instructor: "Artur Sendyka",
    objectives: [
      "Projektuje własny workflow pracy z narzędziami AI.",
      "Stosuje dobre praktyki walidacji treści generowanych przez modele.",
      "Rozumie ryzyka automatyzacji i zależności od narzędzi.",
    ],
    tools: ["ChatGPT", "Claude", "Perplexity", "Notion"],
    dates: [
      { group: "Grupa 1", date: "21.04.2026", time: "17:00-19:00" },
      { group: "Grupa 2", date: "22.04.2026", time: "17:00-19:00" },
    ],
  },
  {
    slug: "prompt-engineering",
    number: 3,
    title: "Prompt Engineering – techniki, struktury i iteracje",
    titleEn: "Prompt Engineering – Techniques, Structures, and Iteration",
    duration: "2 godziny",
    description:
      "Warsztat budowania skutecznych promptów: role, kontekst, ograniczenia, format odpowiedzi i iteracyjne poprawianie jakości wyników.",
    tags: ["Prompty", "LLM", "Iteracja", "Jakość wyników"],
    instructor: "Artur Sendyka",
    objectives: [
      "Tworzy prompty dla różnych zadań akademickich.",
      "Poprawia odpowiedzi modelu przez iteracje i doprecyzowanie.",
      "Stosuje checklistę jakości i bezpieczeństwa promptów.",
    ],
    tools: ["ChatGPT", "Gemini", "Prompt templates"],
    dates: [
      { group: "Grupa 1", date: "28.04.2026", time: "17:00-19:00" },
      { group: "Grupa 2", date: "29.04.2026", time: "17:00-19:00" },
    ],
  },
  {
    slug: "ai-w-nauce",
    number: 4,
    title: "AI w nauce – metodologia, cytowanie i etyka",
    titleEn: "AI in Research – Methodology, Citation, and Ethics",
    duration: "2 godziny",
    description:
      "Jak odpowiedzialnie używać AI w procesie badawczym: planowanie, analiza literatury, transparentność i zgodność z zasadami etycznymi.",
    tags: ["Metodologia", "Etyka", "Cytowanie", "Badania"],
    instructor: "Artur Sendyka",
    objectives: [
      "Ocenia, kiedy użycie AI w badaniach jest metodologicznie uzasadnione.",
      "Dokumentuje wykorzystanie AI zgodnie ze standardami transparentności.",
      "Uwzględnia ryzyka biasu i halucynacji w analizie wyników.",
    ],
    tools: ["Zotero", "Scopus", "Google Scholar", "LLM assistants"],
    dates: [
      { group: "Grupa 1", date: "05.05.2026", time: "17:00-19:00" },
      { group: "Grupa 2", date: "06.05.2026", time: "17:00-19:00" },
    ],
  },
  {
    slug: "ai-programowanie",
    number: 5,
    title: "AI i programowanie – od pomysłu do prototypu",
    titleEn: "AI and Coding – From Idea to Prototype",
    duration: "2 godziny",
    description:
      "Praca z narzędziami AI wspierającymi programowanie: generowanie, refaktoryzacja, testowanie i ocena jakości kodu.",
    tags: ["Kod", "Prototypowanie", "Refaktoryzacja", "Testy"],
    instructor: "Artur Sendyka",
    objectives: [
      "Buduje prosty prototyp z pomocą narzędzi AI.",
      "Weryfikuje poprawność i bezpieczeństwo wygenerowanego kodu.",
      "Rozumie granice automatyzacji pracy programistycznej.",
    ],
    tools: ["Cursor", "GitHub Copilot", "VS Code", "pnpm"],
    dates: [
      { group: "Grupa 1", date: "12.05.2026", time: "17:00-19:00" },
      { group: "Grupa 2", date: "13.05.2026", time: "17:00-19:00" },
    ],
  },
];

export const getModuleBySlug = (slug: string): Module | undefined =>
  modules.find((module) => module.slug === slug);
