import Link from "next/link";
import { FileBarChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/reports";

export function ReportCard({ report }: { report: Report }) {
  return (
    <article className="space-y-4 border border-border p-5">
      <div className="flex items-center justify-between">
        <FileBarChart className="size-4 text-muted-foreground" aria-hidden />
        <p className="font-mono text-xs uppercase text-muted-foreground">
          Edycja {report.edition} · {report.publishedAt}
        </p>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black tracking-tight">{report.title}</h3>
        <p className="text-sm text-muted-foreground">{report.description}</p>
      </div>
      <Button
        nativeButton={false}
        variant="outline"
        className="w-full"
        render={<Link href={`/raporty/${report.slug}`} />}
      >
        Czytaj raport →
      </Button>
    </article>
  );
}
