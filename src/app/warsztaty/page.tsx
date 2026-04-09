import type { Metadata } from "next";

import { ModuleCard } from "@/components/ModuleCard";
import { buildCanonicalPath } from "@/lib/seo";
import { modules } from "@/lib/modules";

export const metadata: Metadata = {
  title: "Warsztaty",
  description: "Pełny plan warsztatów AI Literacy Lab.",
  alternates: {
    canonical: buildCanonicalPath("/warsztaty"),
  },
  openGraph: {
    url: buildCanonicalPath("/warsztaty"),
  },
};

export default function WarsztatyPage() {
  return (
    <div className="container-wide py-14">
      <header className="mb-10 space-y-3">
        <p className="font-mono text-xs uppercase text-muted-foreground">5 spotkań · 10h warsztatów</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Warsztaty</h1>
        <p className="max-w-3xl text-muted-foreground">Plan obejmuje pięć modułów praktycznych.</p>
      </header>
      <div className="space-y-4">
        {modules.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </div>
    </div>
  );
}
