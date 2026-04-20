import { module01 } from "@/content/live/module-01";
import type { LiveModule } from "./types";

const registry: Record<string, LiveModule> = {
  "01": module01,
};

export function getLiveModule(slug: string): LiveModule | undefined {
  return registry[slug];
}

export function getLiveModuleSlugs(): string[] {
  return Object.keys(registry);
}
