import type { Metadata } from "next";

import { SurveyWizard } from "@/components/ankieta/SurveyWizard";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Ankieta ewaluacyjna",
  description: "Anonimowa ankieta ewaluacyjna po cyklu warsztatów AI Literacy Lab.",
  alternates: {
    canonical: buildCanonicalPath("/ankieta"),
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AnkietaPage() {
  return (
    <div className="container-wide py-12">
      <div className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase text-muted-foreground">AI Literacy Lab</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Ankieta ewaluacyjna</h1>
        <p className="max-w-3xl text-muted-foreground">
          Ankieta jest w pełni anonimowa. Nie zbieramy adresów e-mail, imion ani nazwisk. Twoje odpowiedzi posłużą wyłącznie do oceny jakości warsztatów i udoskonalenia kolejnych edycji programu.
        </p>
      </div>
      <SurveyWizard />
    </div>
  );
}
