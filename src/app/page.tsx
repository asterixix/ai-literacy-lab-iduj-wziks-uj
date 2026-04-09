import type { Metadata } from "next";

import { AboutSection } from "@/components/sections/AboutSection";
import { GuestLectureSection } from "@/components/sections/GuestLectureSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ModulesPreviewSection } from "@/components/sections/ModulesPreviewSection";
import { WorkshopRegistrationSection } from "@/components/sections/WorkshopRegistrationSection";
import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Strona główna",
  description: "Przegląd projektu AI Literacy Lab, modułów warsztatowych i materiałów edukacyjnych.",
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
      <WorkshopRegistrationSection />
      <GuestLectureSection />
      <ModulesPreviewSection />
      <AboutSection />
    </>
  );
}
