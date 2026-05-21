import type { Metadata } from "next";

import { AiToolsDirectory } from "@/components/narzedzia/AiToolsDirectory";
import { getAiToolsDatabase, toAiToolViews } from "@/lib/ai-tools";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Lista narzędzi AI",
  description:
    "Przeszukiwalna lista narzędzi AI do pracy, nauki i tworzenia — z kategoriami, informacją o dostępie i linkami do źródeł.",
  alternates: {
    canonical: buildCanonicalPath("/narzedzia"),
  },
  openGraph: {
    url: buildCanonicalPath("/narzedzia"),
  },
};

export default function NarzedziaPage() {
  const database = getAiToolsDatabase();
  const tools = toAiToolViews(database.tools);

  return (
    <div className="container-wide py-14">
      <header className="mb-8 space-y-3">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Lista narzędzi AI</h1>
        <p className="max-w-3xl text-muted-foreground">
          Katalog narzędzi zebrany z publicznych list społecznościowych. Wyszukuj po nazwie, opisie,
          funkcjach, kategorii i modelu dostępu.
        </p>
        <p className="inline-block border border-border px-3 py-1 font-mono text-xs uppercase text-muted-foreground">
          {tools.length} narzędzi · aktualizacja {new Intl.DateTimeFormat("pl-PL").format(new Date(database.syncedAt))}
        </p>
      </header>

      <AiToolsDirectory database={database} tools={tools} />
    </div>
  );
}
