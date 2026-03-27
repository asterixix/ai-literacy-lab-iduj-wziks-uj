import { cn } from "@/lib/utils";

interface TimelineItemProps {
  phase: string;
  period: string;
  items: string[];
  highlight?: boolean;
}

export function TimelineItem({ phase, period, items, highlight = false }: TimelineItemProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[20px_1fr] gap-4 border-l border-border pl-4",
        highlight ? "border-accent" : "border-border",
      )}
    >
      <div
        className={cn(
          "relative -left-[26px] mt-1 size-3 rounded-full border border-border bg-background",
          highlight ? "border-accent bg-foreground" : "",
        )}
        aria-hidden
      />
      <div className="space-y-2 pb-6">
        <p className="font-mono text-xs uppercase text-muted-foreground">{period}</p>
        <h3 className="text-lg font-black tracking-tight">{phase}</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
