export interface ParsedListEntry {
  name: string;
  url: string;
  description: string;
  sourceCategory: string;
}

const LIST_ITEM_RE =
  /^[\*\-]\s+(?:\*\*[^*]*\*\*\s*)*(?:\[[^\]]*\]\([^)]*\)\s*)*\[([^\]]+)\]\(([^)]+)\)\s*(?:\*\*)?\s*(?:[-–—:]|\s+[-–—]\s+|\s*\?\s*|\s*\()\s*(.*)$/;

const NUMBERED_ITEM_RE =
  /^\d+\.\s+(?:\*\*[^*]*\*\*\s*)*\[([^\]]+)\]\(([^)]+)\)\s*(?:\*\*)?\s*(?:[-–—:]|\s+[-–—]\s+)?\s*(.*)$/;

const HEADING_LINK_RE = /^#{3,6}\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:[-–—:]\s*(.*))?$/;

const MARKDOWN_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

const SKIP_SECTION_RE =
  /^(recommended reading|articles?(\s*&\s*updates)?|contributing|contents?|table of contents|more lists?|milestones?|learning resources?|what is|overview|reach thousands|sponsor|newsletter(s)?|discoveries|why this repo|support this project|updates?|quick comparison|recommended stacks?|comparison notes?|education & student programs?|paid tiers comparison|model price comparison|rate limit comparison|commercial use summary|best models by use case|legend|license|related resources?|related awesome lists?|learn ai free|nvidia platform extensions?|pricing|books?|community|newsletters? and communities?|market stats|feedback|credits?|code of conduct)$/i;

const SKIP_URL_RE =
  /(?:twitter\.com|x\.com\/|medium\.com|nytimes\.com|wsj\.com|wired\.com|arstechnica\.com|reddit\.com|substack\.com|linkedin\.com\/posts|youtube\.com\/watch|\.edu\/news|sequoiacap\.com\/article|hai\.stanford\.edu\/news|fireship\.io\/|\/r\/\w+|img\.shields\.io|badge\.svg|trackawesomelist\.com|fossa\.com|github\.com\/[^/]+\/free-ai-tools(?:\/|$)|contributing\.md|license)/i;

const SKIP_DESC_RE =
  /^(article|an op-ed|announcement of|presentation of|paper |blog post|podcast|newsletter|course |book |video \(mindset|reddit:|op-ed|milestone)/i;

function cleanSectionTitle(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s*<!--.*?-->\s*/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\?+/g, "")
    .trim();
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/\*\*/g, "")
    .replace(/`+/g, "")
    .replace(/[☆⭐?]\s*[\d,]+/g, "")
    .replace(/\s+#\w+/g, "")
    .replace(/\s+\d+\s*$/g, "")
    .replace(/\s*\[verify[^\]]*\]/gi, "")
    .replace(/\s*⭐\s*NEW\b/gi, "")
    .trim();
}

function shouldSkipEntry(url: string, description: string, section: string): boolean {
  if (SKIP_SECTION_RE.test(section.trim())) {
    return true;
  }
  if (!isExternalUrl(url)) {
    return true;
  }
  if (SKIP_URL_RE.test(url)) {
    return true;
  }
  if (SKIP_DESC_RE.test(description.trim())) {
    return true;
  }
  if (/awesome[\w-]*\/blob|github\.com\/[^/]+\/awesome/i.test(url)) {
    return true;
  }
  return false;
}

function pushEntry(
  entries: ParsedListEntry[],
  seen: Set<string>,
  entry: ParsedListEntry,
  section: string,
): void {
  if (shouldSkipEntry(entry.url, entry.description, section)) {
    return;
  }

  const key = `${entry.url}::${entry.name}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  entries.push(entry);
}

function parseListLine(
  line: string,
  sourceCategory: string,
  section: string,
  entries: ParsedListEntry[],
  seen: Set<string>,
): void {
  const listMatch = line.match(LIST_ITEM_RE) ?? line.match(NUMBERED_ITEM_RE);
  if (!listMatch) {
    return;
  }

  const [, name, url, rawDesc] = listMatch;
  const description = cleanDescription(rawDesc ?? "");

  pushEntry(
    entries,
    seen,
    {
      name: name.trim(),
      url: url.trim(),
      description,
      sourceCategory,
    },
    section,
  );
}

function parseHeadingLink(
  line: string,
  sourceCategory: string,
  section: string,
  entries: ParsedListEntry[],
  seen: Set<string>,
): void {
  const match = line.match(HEADING_LINK_RE);
  if (!match) {
    return;
  }

  const [, name, url, rawDesc] = match;
  pushEntry(
    entries,
    seen,
    {
      name: name.trim(),
      url: url.trim(),
      description: cleanDescription(rawDesc ?? ""),
      sourceCategory,
    },
    section,
  );
}

function parseTableRow(
  line: string,
  sourceCategory: string,
  section: string,
  entries: ParsedListEntry[],
  seen: Set<string>,
): void {
  if (!line.startsWith("|") || line.includes("---")) {
    return;
  }

  const cells = line
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  if (cells.length === 0 || /^agent$/i.test(cells[0]) || /^tool$/i.test(cells[0])) {
    return;
  }

  const links: { name: string; url: string; cellIndex: number }[] = [];
  cells.forEach((cell, index) => {
    for (const match of cell.matchAll(MARKDOWN_LINK_RE)) {
      const [, name, url] = match;
      if (isExternalUrl(url)) {
        links.push({ name: name.trim(), url: url.trim(), cellIndex: index });
      }
    }
  });

  if (links.length === 0) {
    return;
  }

  for (const link of links) {
    const detailCells = cells
      .slice(link.cellIndex + 1)
      .filter((cell) => cell && !/^no$/i.test(cell));

    const contextDescription = cleanDescription(detailCells.join(" · ").slice(0, 280));

    pushEntry(
      entries,
      seen,
      {
        name: link.name,
        url: link.url,
        description: contextDescription,
        sourceCategory,
      },
      section,
    );
  }
}

export function parseAwesomeReadme(markdown: string): ParsedListEntry[] {
  const entries: ParsedListEntry[] = [];
  const seen = new Set<string>();
  let section = "General";
  let subsection = "";
  let inTableOfContents = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = cleanSectionTitle(headingMatch[2]);

      if (/^table of contents$/i.test(title)) {
        inTableOfContents = true;
        continue;
      }

      if (inTableOfContents && level <= 2) {
        inTableOfContents = false;
      }

      if (inTableOfContents) {
        continue;
      }

      if (level <= 2) {
        section = title;
        subsection = "";
      } else if (level === 3) {
        subsection = title;
      } else {
        parseHeadingLink(
          line,
          subsection ? `${section} › ${subsection}` : section,
          section,
          entries,
          seen,
        );
        continue;
      }

      if (level >= 4) {
        parseHeadingLink(
          line,
          subsection ? `${section} › ${subsection}` : section,
          section,
          entries,
          seen,
        );
      }
      continue;
    }

    if (inTableOfContents) {
      continue;
    }

    const sourceCategory = subsection ? `${section} › ${subsection}` : section;

    if (line.startsWith("|")) {
      parseTableRow(line, sourceCategory, section, entries, seen);
      continue;
    }

    if (line.startsWith("*") || line.startsWith("-") || /^\d+\.\s/.test(line)) {
      if (!/\]\(https?:\/\//i.test(line)) {
        continue;
      }
      parseListLine(line, sourceCategory, section, entries, seen);
    }
  }

  return entries;
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    let path = parsed.pathname.replace(/\/$/, "");
    if (path === "") path = "/";
    parsed.pathname = path;
    const host = parsed.hostname.replace(/^www\./, "");
    return `${parsed.protocol}//${host}${path}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

export function slugifyId(name: string, url: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "").split(".")[0];
    } catch {
      return "tool";
    }
  })();

  return `${base}-${host}`.slice(0, 80);
}
