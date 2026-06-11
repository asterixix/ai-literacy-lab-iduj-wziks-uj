import type { Metadata } from "next";

import { ReportCard } from "@/components/ReportCard";
import { getReportOverviewContent } from "@/lib/mdx";
import { reports } from "@/lib/reports";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Raporty",
  description:
    "Raporty ewaluacyjne z realizacji warsztatów AI Literacy Lab — wyniki ankiet, analizy kompetencji i rekomendacje.",
  alternates: {
    canonical: buildCanonicalPath("/raporty"),
  },
  openGraph: {
    url: buildCanonicalPath("/raporty"),
  },
};

export default async function ReportsPage() {
  const { content } = await getReportOverviewContent();

  return (
    <div className="container-wide py-14">
      <header className="mb-8 space-y-3">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Raporty</h1>
        <p className="inline-block border border-border px-3 py-1 font-mono text-xs uppercase text-muted-foreground">
          Ewaluacja projektu · ID.UJ
        </p>
      </header>

      <article className="mb-10 max-w-3xl space-y-4 text-muted-foreground [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-foreground [&_p]:leading-relaxed">
        {content}
      </article>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">Opublikowane raporty</h2>
          <p className="text-sm text-muted-foreground">
            Pełne raporty ewaluacyjne z poszczególnych edycji warsztatów.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <ReportCard key={report.slug} report={report} />
          ))}
        </div>
      </section>
    </div>
  );
}
