import type { Metadata } from "next";

import { AboutSection } from "@/components/sections/AboutSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ModulesPreviewSection } from "@/components/sections/ModulesPreviewSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { ThanksSection } from "@/components/sections/ThanksSection";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Strona główna",
  description:
    "Podsumowanie edycji 2026 AI Literacy Lab: statystyki uczestnictwa, podziękowania oraz materiały warsztatowe.",
  alternates: {
    canonical: buildCanonicalPath("/"),
  },
  openGraph: {
    url: buildCanonicalPath("/"),
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <ThanksSection />
      <ModulesPreviewSection />
      <AboutSection />
    </>
  );
}
