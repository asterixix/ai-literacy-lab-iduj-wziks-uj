export const AI_TOOL_CATEGORIES = [
  "ogolne",
  "nauka",
  "programowanie",
  "grafiki",
  "wideo",
  "audio",
  "biznes",
] as const;

export type AiToolCategory = (typeof AI_TOOL_CATEGORIES)[number];

export const AI_TOOL_ACCESS_LEVELS = [
  "platny",
  "darmowy-z-ograniczeniami",
  "darmowy",
  "open-source",
] as const;

export type AiToolAccess = (typeof AI_TOOL_ACCESS_LEVELS)[number];

export const CATEGORY_LABELS: Record<AiToolCategory, string> = {
  ogolne: "Ogólne",
  nauka: "Nauka",
  programowanie: "Programowanie",
  grafiki: "Grafiki",
  wideo: "Wideo",
  audio: "Audio",
  biznes: "Biznes",
};

export const ACCESS_LABELS: Record<AiToolAccess, string> = {
  platny: "Płatny",
  "darmowy-z-ograniczeniami": "Darmowy z ograniczeniami",
  darmowy: "Darmowy",
  "open-source": "Open source",
};

export interface AiToolSourceMeta {
  id: string;
  name: string;
  url: string;
  author: string;
}

export interface AiTool {
  id: string;
  name: string;
  url: string;
  description: string;
  features: string[];
  category: AiToolCategory;
  access: AiToolAccess;
  sourceCategory: string;
  sources: string[];
}

export interface AiToolsDatabase {
  syncedAt: string;
  sources: AiToolSourceMeta[];
  tools: AiTool[];
}
