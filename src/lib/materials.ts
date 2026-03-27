import type { Material } from "@/types";

export const materials: Material[] = [
  {
    id: "prompts",
    title: "Zbiór 100+ promptów akademickich",
    description: "Gotowe prompty do researchu, analizy i pisania.",
    formats: ["Markdown"],
    category: "prompts",
    available: false,
    availableDate: "22.05.2026",
  },
  {
    id: "case-studies",
    title: "10 case studies wdrożeń AI",
    description: "Analizy realnych przykładów zastosowań AI.",
    formats: ["Markdown"],
    category: "case-study",
    available: false,
    availableDate: "22.05.2026",
  },
  {
    id: "guide",
    title: "Przewodnik po narzędziach AI",
    description: "Porównanie narzędzi, checklisty i rekomendacje użycia.",
    formats: ["Markdown"],
    category: "guide",
    available: false,
    availableDate: "22.05.2026",
  },
  {
    id: "resources",
    title: "Lista zasobów do dalszej nauki",
    description: "Źródła, kursy i publikacje rozszerzające tematykę warsztatów.",
    formats: ["Markdown"],
    category: "resources",
    available: false,
    availableDate: "22.05.2026",
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL,
  },
];

export const getMaterialById = (id: string): Material | undefined => materials.find((material) => material.id === id);
