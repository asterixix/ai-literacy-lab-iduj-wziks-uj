import type { AiTool, AiToolsDatabase } from "@/lib/ai-tools-types";
import { ACCESS_LABELS, CATEGORY_LABELS } from "@/lib/ai-tools-types";

import aiToolsData from "@/data/ai-tools.json";

export type { AiTool, AiToolsDatabase };
export { ACCESS_LABELS, AI_TOOL_ACCESS_LEVELS, AI_TOOL_CATEGORIES, CATEGORY_LABELS } from "@/lib/ai-tools-types";

export interface AiToolView extends AiTool {
  categoryLabel: string;
  accessLabel: string;
  featuresText: string;
}

export function getAiToolsDatabase(): AiToolsDatabase {
  return aiToolsData as AiToolsDatabase;
}

export function toAiToolViews(tools: AiTool[]): AiToolView[] {
  return tools.map((tool) => ({
    ...tool,
    categoryLabel: CATEGORY_LABELS[tool.category],
    accessLabel: ACCESS_LABELS[tool.access],
    featuresText: tool.features.join(", "),
  }));
}

export function formatSyncDate(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}
