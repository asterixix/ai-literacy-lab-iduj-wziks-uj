import type { AiToolAccess, AiToolCategory } from "../../src/lib/ai-tools-types";

const CATEGORY_KEYWORDS: Record<AiToolCategory, string[]> = {
  programowanie: [
    "code",
    "coding",
    "developer",
    "ide",
    "editor",
    "cli",
    "terminal",
    "git",
    "repository",
    "programming",
    "copilot",
    "agent",
    "refactor",
    "debug",
    "api",
    "sdk",
    "deploy",
    "full-stack",
    "vibe coding",
    "neovim",
    "vscode",
  ],
  grafiki: [
    "image",
    "photo",
    "art",
    "design",
    "illustration",
    "logo",
    "mockup",
    "ui",
    "visual",
    "diffusion",
    "midjourney",
    "dall",
    "stable diffusion",
    "3d",
  ],
  wideo: ["video", "animation", "film", "avatar", "clip", "motion"],
  audio: [
    "audio",
    "music",
    "voice",
    "speech",
    "sound",
    "podcast",
    "tts",
    "transcri",
    "whisper",
  ],
  biznes: [
    "marketing",
    "sales",
    "email",
    "seo",
    "ads",
    "crm",
    "business",
    "enterprise",
    "copywriting",
    "campaign",
  ],
  nauka: [
    "learn",
    "education",
    "course",
    "tutor",
    "student",
    "research",
    "academic",
    "study",
    "quiz",
    "flashcard",
  ],
  ogolne: ["chat", "llm", "assistant", "search", "writing", "text", "productivity"],
};

const SECTION_CATEGORY_MAP: Array<{ pattern: RegExp; category: AiToolCategory }> = [
  { pattern: /code|coding|cli|ide|editor|agent|program/i, category: "programowanie" },
  { pattern: /image|graphic|design|photo|art/i, category: "grafiki" },
  { pattern: /video|film/i, category: "wideo" },
  { pattern: /audio|music|voice|sound/i, category: "audio" },
  { pattern: /market|business|sales|seo|email/i, category: "biznes" },
  { pattern: /learn|education|course|tutor/i, category: "nauka" },
  { pattern: /text|chat|search|model/i, category: "ogolne" },
];

export function classifyCategory(
  sourceCategory: string,
  name: string,
  description: string,
): AiToolCategory {
  const haystack = `${sourceCategory} ${name} ${description}`.toLowerCase();
  const scores = new Map<AiToolCategory, number>();

  for (const { pattern, category } of SECTION_CATEGORY_MAP) {
    if (pattern.test(sourceCategory)) {
      scores.set(category, (scores.get(category) ?? 0) + 12);
    }
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    AiToolCategory,
    string[],
  ][]) {
    for (const keyword of keywords) {
      if (haystack.includes(keyword)) {
        scores.set(category, (scores.get(category) ?? 0) + 2);
      }
    }
  }

  let best: AiToolCategory = "ogolne";
  let bestScore = 0;
  for (const [category, score] of scores) {
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }

  return best;
}

export function classifyAccess(
  description: string,
  url: string,
  fromFreeList: boolean,
): AiToolAccess {
  const text = `${description} ${url}`.toLowerCase();

  if (
    text.includes("#opensource") ||
    text.includes("open source") ||
    text.includes("open-source") ||
    text.includes("open weight")
  ) {
    return "open-source";
  }

  if (
    text.includes("freemium") ||
    text.includes("free tier") ||
    text.includes("free plan") ||
    text.includes("limited free") ||
    text.includes("trial") ||
    text.includes("free with") ||
    text.includes("usage limit")
  ) {
    return "darmowy-z-ograniczeniami";
  }

  if (
    text.includes("free and open") ||
    text.includes("completely free") ||
    text.includes("100% free") ||
    (text.includes("free") && !text.includes("free trial"))
  ) {
    return "darmowy";
  }

  if (fromFreeList) {
    return "darmowy-z-ograniczeniami";
  }

  return "platny";
}

export function extractFeatures(
  sourceCategory: string,
  description: string,
  category: AiToolCategory,
): string[] {
  const features = new Set<string>();
  const section = sourceCategory.trim();
  if (section) {
    features.add(section);
  }

  const tags = description.match(/#[\w-]+/g);
  if (tags) {
    for (const tag of tags) {
      features.add(tag.replace("#", ""));
    }
  }

  const hints: Record<AiToolCategory, string[]> = {
    ogolne: ["czat", "tekst", "wyszukiwanie"],
    nauka: ["edukacja", "nauka"],
    programowanie: ["kod", "IDE", "agenci"],
    grafiki: ["obrazy", "grafika"],
    wideo: ["wideo"],
    audio: ["audio", "muzyka"],
    biznes: ["marketing", "biznes"],
  };

  for (const hint of hints[category]) {
    features.add(hint);
  }

  return [...features].slice(0, 8);
}

const PL_REPLACEMENTS: [RegExp, string][] = [
  [/open[- ]?source/gi, "otwartoźródłowe"],
  [/AI[- ]?powered/gi, "oparte na AI"],
  [/large language model/gi, "duży model językowy"],
  [/chatbot/gi, "chatbot"],
  [/image generation/gi, "generowanie obrazów"],
  [/text[- ]?to[- ]?speech/gi, "zamiana tekstu na mowę"],
  [/code generation/gi, "generowanie kodu"],
  [/writing assistant/gi, "asystent pisania"],
  [/search engine/gi, "wyszukiwarka"],
];

export function toPolishDescription(
  name: string,
  englishDescription: string,
  category: AiToolCategory,
): string {
  let text = englishDescription.replace(/#[\w-]+/g, "").trim();
  if (!text) {
    const fallbacks: Record<AiToolCategory, string> = {
      ogolne: `Narzędzie AI: ${name}.`,
      nauka: `Narzędzie AI wspierające naukę: ${name}.`,
      programowanie: `Narzędzie AI dla programistów: ${name}.`,
      grafiki: `Narzędzie AI do tworzenia grafiki: ${name}.`,
      wideo: `Narzędzie AI do pracy z wideo: ${name}.`,
      audio: `Narzędzie AI do audio: ${name}.`,
      biznes: `Narzędzie AI dla biznesu: ${name}.`,
    };
    return fallbacks[category];
  }

  for (const [pattern, replacement] of PL_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  if (text.length > 220) {
    const cut = text.slice(0, 217);
    const lastSpace = cut.lastIndexOf(" ");
    text = `${cut.slice(0, lastSpace > 80 ? lastSpace : 217)}…`;
  }

  if (!/[ąćęłńóśźż]/i.test(text)) {
    return `${name}: ${text}`;
  }

  return text;
}
