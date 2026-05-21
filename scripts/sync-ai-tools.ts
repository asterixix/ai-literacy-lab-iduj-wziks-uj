import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  classifyAccess,
  classifyCategory,
  extractFeatures,
  toPolishDescription,
} from "./lib/ai-tools-classifier";
import {
  normalizeUrl,
  parseAwesomeReadme,
  slugifyId,
  type ParsedListEntry,
} from "./lib/parse-awesome-readme";
import type { AiTool, AiToolsDatabase } from "../src/lib/ai-tools-types";
import {
  ACCESS_LABELS,
  CATEGORY_LABELS,
} from "../src/lib/ai-tools-types";

const SOURCES = [
  {
    id: "awesome-generative-ai",
    name: "Awesome Generative AI",
    url: "https://github.com/steven2358/awesome-generative-ai",
    author: "Steven Tey i współtwórcy",
    rawUrl:
      "https://raw.githubusercontent.com/steven2358/awesome-generative-ai/main/README.md",
  },
  {
    id: "awesome-ai-tools",
    name: "Awesome AI Tools",
    url: "https://github.com/mahseema/awesome-ai-tools",
    author: "mahseema i współtwórcy",
    rawUrl: "https://raw.githubusercontent.com/mahseema/awesome-ai-tools/main/README.md",
  },
  {
    id: "awesome-vibe-coding",
    name: "Awesome Vibe Coding",
    url: "https://github.com/ai-for-developers/awesome-vibe-coding",
    author: "AI for Developers i współtwórcy",
    rawUrl:
      "https://raw.githubusercontent.com/ai-for-developers/awesome-vibe-coding/main/readme.md",
  },
  {
    id: "free-ai-tools",
    name: "Free AI Tools",
    url: "https://github.com/ShaikhWarsi/free-ai-tools",
    author: "Shaikh Warsi i współtwórcy",
    rawUrl: "https://raw.githubusercontent.com/ShaikhWarsi/free-ai-tools/main/README.md",
    fromFreeList: true,
  },
  {
    id: "collective-ai-tools",
    name: "Collective AI Tools",
    url: "https://github.com/Hyraze/collective-ai-tools",
    author: "Hyraze i współtwórcy",
    rawUrl: "https://raw.githubusercontent.com/Hyraze/collective-ai-tools/main/README.md",
  },
  {
    id: "awesome-ai-openbestof",
    name: "Awesome AI (openbestof)",
    url: "https://github.com/openbestof/awesome-ai",
    author: "openbestof i współtwórcy",
    rawUrl: "https://raw.githubusercontent.com/openbestof/awesome-ai/main/readme.md",
  },
  {
    id: "awesome-ai-brandonhimpfen",
    name: "Awesome AI (brandonhimpfen)",
    url: "https://github.com/brandonhimpfen/awesome-ai",
    author: "brandonhimpfen i współtwórcy",
    rawUrl: "https://raw.githubusercontent.com/brandonhimpfen/awesome-ai/main/README.md",
  },
  {
    id: "awesome-ai-agents-2026",
    name: "Awesome AI Agents 2026",
    url: "https://github.com/caramaschiHG/awesome-ai-agents-2026",
    author: "caramaschiHG i współtwórcy",
    rawUrl:
      "https://raw.githubusercontent.com/caramaschiHG/awesome-ai-agents-2026/main/README.md",
  },
  {
    id: "awesome-ai-abordage",
    name: "Awesome AI (abordage)",
    url: "https://github.com/abordage/awesome-ai",
    author: "abordage i współtwórcy",
    rawUrl: "https://raw.githubusercontent.com/abordage/awesome-ai/main/README.md",
  },
] as const;

async function fetchReadme(rawUrl: string): Promise<string> {
  const response = await fetch(rawUrl, {
    headers: { Accept: "text/plain", "User-Agent": "ai-literacy-lab-sync" },
  });
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać ${rawUrl}: ${response.status}`);
  }
  return response.text();
}

function mergeEntry(
  existing: AiTool,
  incoming: ParsedListEntry,
  sourceId: string,
): AiTool {
  const sources = existing.sources.includes(sourceId)
    ? existing.sources
    : [...existing.sources, sourceId];

  const description =
    incoming.description.length > existing.description.length
      ? toPolishDescription(
          incoming.name,
          incoming.description,
          existing.category,
        )
      : existing.description;

  const features = [
    ...new Set([...existing.features, ...extractFeatures(incoming.sourceCategory, incoming.description, existing.category)]),
  ].slice(0, 10);

  return {
    ...existing,
    name: existing.name.length >= incoming.name.length ? existing.name : incoming.name,
    description,
    features,
    sourceCategory: existing.sourceCategory || incoming.sourceCategory,
    sources,
  };
}

function ensureUniqueId(baseId: string, used: Set<string>, url: string): string {
  if (!used.has(baseId)) {
    used.add(baseId);
    return baseId;
  }

  const suffix = Buffer.from(url).toString("base64url").slice(-6);
  let candidate = `${baseId}-${suffix}`;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${baseId}-${suffix}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

async function main() {
  const merged = new Map<string, AiTool>();
  const usedIds = new Set<string>();

  for (const source of SOURCES) {
    console.log(`Pobieranie: ${source.name}…`);
    const markdown = await fetchReadme(source.rawUrl);
    const entries = parseAwesomeReadme(markdown);
    console.log(`  → ${entries.length} pozycji`);

    for (const entry of entries) {
      const key = normalizeUrl(entry.url);
      const category = classifyCategory(entry.sourceCategory, entry.name, entry.description);
      const access = classifyAccess(
        entry.description,
        entry.url,
        "fromFreeList" in source && source.fromFreeList === true,
      );

      const tool: AiTool = {
        id: ensureUniqueId(slugifyId(entry.name, entry.url), usedIds, entry.url),
        name: entry.name,
        url: entry.url,
        description: toPolishDescription(entry.name, entry.description, category),
        features: extractFeatures(entry.sourceCategory, entry.description, category),
        category,
        access,
        sourceCategory: entry.sourceCategory,
        sources: [source.id],
      };

      const prev = merged.get(key);
      if (prev) {
        merged.set(key, mergeEntry(prev, entry, source.id));
      } else {
        merged.set(key, tool);
      }
    }
  }

  const uniqueIds = new Set<string>();
  for (const tool of merged.values()) {
    tool.id = ensureUniqueId(slugifyId(tool.name, tool.url), uniqueIds, tool.url);
  }

  const tools = [...merged.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pl"),
  );

  const database: AiToolsDatabase = {
    syncedAt: new Date().toISOString(),
    sources: SOURCES.map(({ id, name, url, author }) => ({ id, name, url, author })),
    tools,
  };

  const outDir = path.join(process.cwd(), "src", "data");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "ai-tools.json");
  await writeFile(outPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");

  console.log(`\nZapisano ${tools.length} narzędzi → ${outPath}`);
  console.log(`Kategorie: ${Object.entries(CATEGORY_LABELS).map(([k, v]) => `${v}: ${tools.filter((t) => t.category === k).length}`).join(", ")}`);
  console.log(`Dostęp: ${Object.entries(ACCESS_LABELS).map(([k, v]) => `${v}: ${tools.filter((t) => t.access === k).length}`).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
