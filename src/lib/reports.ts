export interface Report {
  slug: string;
  title: string;
  description: string;
  edition: string;
  publishedAt: string;
}

export const reports: Report[] = [
  {
    slug: "edycja-2026",
    title: "Raport Edycja 2026",
    description:
      "Raport ewaluacyjny z realizacji warsztatów AI Literacy Lab — wyniki pre-post, satysfakcja uczestników, analiza jakościowa i rekomendacje.",
    edition: "2026",
    publishedAt: "czerwiec 2026",
  },
];

export function getReportBySlug(slug: string): Report | undefined {
  return reports.find((report) => report.slug === slug);
}
