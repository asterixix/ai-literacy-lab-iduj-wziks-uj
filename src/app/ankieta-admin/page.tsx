import type { Metadata } from "next";

import { SurveyAdminClient } from "@/components/ankieta/SurveyAdminClient";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Panel ankiety",
  description: "Panel administracyjny ankiety AI Literacy Lab.",
  alternates: {
    canonical: buildCanonicalPath("/ankieta-admin"),
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AnkietaAdminPage() {
  return (
    <div className="container-wide py-12">
      <SurveyAdminClient />
    </div>
  );
}
