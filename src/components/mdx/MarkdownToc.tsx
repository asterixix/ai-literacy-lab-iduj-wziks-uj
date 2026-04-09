import type { TocItem } from "@/lib/toc";

interface MarkdownTocProps {
  items: TocItem[];
  title?: string;
}

export function MarkdownToc({ items, title = "Spis treści" }: MarkdownTocProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-black uppercase tracking-tight">{title}</h2>
      <nav aria-label={title}>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={
                  item.level === 3
                    ? "block pl-4 hover:text-foreground"
                    : "block font-semibold text-foreground/90 hover:text-foreground"
                }
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
