import type { Metadata } from "next";
import Link from "next/link";

import { MaterialCard } from "@/components/MaterialCard";
import { getMaterialOverviewContent } from "@/lib/mdx";
import { materials } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Materiały",
  description: "Materiały OER projektu AI Literacy Lab publikowane na licencji CC BY-SA 4.0.",
};

export default async function MaterialsPage() {
  const { content } = await getMaterialOverviewContent();
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/asterixix/ai-literacy-lab-iduj-wziks-uj";

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

      <section className="grid gap-4 md:grid-cols-2">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            readUrl={`/materialy/${material.id}`}
            downloadUrl={`/materialy/${material.id}/download`}
          />
        ))}
      </section>

      <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        Repozytorium projektu:{" "}
        <Link href={githubUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
          GitHub
        </Link>
      </div>
    </div>
  );
}
