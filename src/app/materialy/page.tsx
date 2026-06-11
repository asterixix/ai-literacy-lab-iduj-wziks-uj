import type { Metadata } from "next";
import Link from "next/link";

import { MaterialCard } from "@/components/MaterialCard";
import { getMaterialOverviewContent } from "@/lib/mdx";
import { lectureMaterials, workshopMaterials } from "@/lib/materials";
import { buildCanonicalPath } from "@/lib/seo";
import type { Material } from "@/types";

export const metadata: Metadata = {
  title: "Materiały",
  description: "Materiały OER projektu AI Literacy Lab publikowane na licencji CC BY-SA 4.0.",
  alternates: {
    canonical: buildCanonicalPath("/materialy"),
  },
  openGraph: {
    url: buildCanonicalPath("/materialy"),
  },
};

function MaterialGrid({ items }: { items: Material[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          readUrl={material.readPage ? `/materialy/${material.id}` : undefined}
          downloadUrl={`/materialy/${material.id}/download`}
        />
      ))}
    </div>
  );
}

export default async function MaterialsPage() {
  const { content } = await getMaterialOverviewContent();
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_URL ??
    "https://github.com/asterixix/ai-literacy-lab-iduj-wziks-uj";

  return (
    <div className="container-wide py-14">
      <header className="mb-8 space-y-3">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Materiały edukacyjne</h1>
        <p className="inline-block border border-border px-3 py-1 font-mono text-xs uppercase text-muted-foreground">
          Open Educational Resources · CC BY-SA 4.0
        </p>
      </header>

      <article className="mb-10 max-w-3xl space-y-4 text-muted-foreground [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground [&_p]:leading-relaxed">
        {content}
      </article>

      <section className="mb-10 space-y-4">
        <header className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">Materiały z wykładu otwartego</h2>
          <p className="text-sm text-muted-foreground">
            Wykład{" "}
            <span className="font-medium text-foreground">
              Artificial Intelligence + Cybersecurity. Nowy wymiar cyberbezpieczeństwa.
            </span>
          </p>
        </header>
        <MaterialGrid items={lectureMaterials} />
      </section>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">Materiały z warsztatów</h2>
          <p className="text-sm text-muted-foreground">
            Prompty, case studies, przewodnik po narzędziach i lista źródeł z edycji 2026 AI
            Literacy Lab.
          </p>
        </header>
        <MaterialGrid items={workshopMaterials} />
      </section>

      <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        Repozytorium projektu:{" "}
        <Link
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          GitHub
        </Link>
      </div>
    </div>
  );
}
