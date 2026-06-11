import type { Material } from "@/types";

export const materials: Material[] = [
  {
    id: "wyklad-ai-cybersecurity",
    title: "Prezentacja wykładu: AI + Cyberbezpieczeństwo",
    description:
      "Slajdy z wykładu otwartego „Artificial Intelligence + Cybersecurity. Nowy wymiar cyberbezpieczeństwa.”",
    formats: ["PDF"],
    category: "lecture",
    available: true,
    fileName: "Wykład.pdf",
  },
  {
    id: "podrecznik-ai-cybersecurity",
    title: "Podręcznik do wykładu AI + Cyberbezpieczeństwo",
    description:
      "Materiał uzupełniający — podstawy AI, zagrożenia związane z wykorzystaniem modeli językowych oraz dobre praktyki bezpieczeństwa.",
    formats: ["PDF"],
    category: "lecture",
    available: true,
    fileName: "Podrecznik.pdf",
  },
  {
    id: "ai-cybersecurity-demo",
    title: "Demo: AI w cyberbezpieczeństwie",
    description:
      "Materiały demonstracyjne z wykładu — przykłady zastosowań AI w kontekście analizy zagrożeń i testów bezpieczeństwa.",
    formats: ["PDF"],
    category: "lecture",
    available: true,
    fileName: "AI-CyberSecurity_Demo.pdf",
  },
  {
    id: "prompts",
    title: "Zbiór 100+ promptów akademickich",
    description: "Gotowe prompty do researchu, analizy i pisania.",
    formats: ["Markdown"],
    category: "prompts",
    available: false,
    availableDate: "22.05.2026",
    readPage: true,
  },
  {
    id: "case-studies",
    title: "10 case studies wdrożeń AI",
    description: "Analizy realnych przykładów zastosowań AI.",
    formats: ["Markdown"],
    category: "case-study",
    available: false,
    availableDate: "22.05.2026",
    readPage: true,
  },
  {
    id: "guide",
    title: "Przewodnik po narzędziach AI",
    description: "Porównanie narzędzi, checklisty i rekomendacje użycia.",
    formats: ["Markdown"],
    category: "guide",
    available: false,
    availableDate: "22.05.2026",
    readPage: true,
  },
  {
    id: "resources",
    title: "Lista zasobów do dalszej nauki",
    description: "Źródła, kursy i publikacje rozszerzające tematykę warsztatów.",
    formats: ["Markdown"],
    category: "resources",
    available: false,
    availableDate: "22.05.2026",
    readPage: true,
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL,
  },
];

export const getMaterialById = (id: string): Material | undefined =>
  materials.find((material) => material.id === id);

export const availableMaterials = materials.filter((material) => material.available);
export const upcomingMaterials = materials.filter((material) => !material.available);
