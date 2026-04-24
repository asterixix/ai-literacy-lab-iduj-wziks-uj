import type { Metadata } from "next";

import { QuizM1Client } from "@/components/quiz/QuizM1Client";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sprawdź się z wiedzy o AI",
  description: "Quiz merytoryczny AI Literacy Lab dla modułu M1.",
  alternates: {
    canonical: buildCanonicalPath("/quiz-m1"),
  },
  openGraph: {
    url: buildCanonicalPath("/quiz-m1"),
    title: "Sprawdź się z wiedzy o AI",
    description: "Quiz merytoryczny AI Literacy Lab dla modułu M1.",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};

export default function QuizM1Page() {
  return <QuizM1Client />;
}
