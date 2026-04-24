import type { Metadata } from "next";

import { PojeciaNieMamClient } from "@/components/glossary/PojeciaNieMamClient";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pojęcia ni mom, więc chce wiedzieć wincyj",
  description:
    "Ukryty słownik pojęć AI Literacy Lab tłumaczący prostym językiem pojęcia z modułów, quizu i materiałów.",
  alternates: {
    canonical: buildCanonicalPath("/pojecia-nie-mam"),
  },
  openGraph: {
    url: buildCanonicalPath("/pojecia-nie-mam"),
    title: "Pojęcia ni mom, więc chce wiedzieć wincyj",
    description:
      "Ukryty słownik pojęć AI Literacy Lab tłumaczący prostym językiem pojęcia z modułów, quizu i materiałów.",
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

export default function PojeciaNieMamPage() {
  return <PojeciaNieMamClient />;
}
