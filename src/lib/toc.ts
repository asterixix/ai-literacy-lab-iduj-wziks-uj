export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function stripFrontmatter(source: string): string {
  return source.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function normalizeToSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || "sekcja";
}

export function createHeadingSlugger() {
  const counts = new Map<string, number>();

  return (text: string): string => {
    const base = normalizeToSlug(text);
    const current = counts.get(base) ?? 0;
    counts.set(base, current + 1);

    return current === 0 ? base : `${base}-${current + 1}`;
  };
}

export function extractTocFromMdx(source: string): TocItem[] {
  const slugify = createHeadingSlugger();
  const content = stripFrontmatter(source);
  const lines = content.split(/\r?\n/);
  const toc: TocItem[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      continue;
    }

    const match = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length as 2 | 3;
    const text = stripInlineMarkdown(match[2].replace(/\s+#*\s*$/, ""));
    if (!text) {
      continue;
    }

    toc.push({
      id: slugify(text),
      text,
      level,
    });
  }

  return toc;
}