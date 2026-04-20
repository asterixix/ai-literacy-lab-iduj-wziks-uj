export type OS = "mac" | "windows" | "linux";
export type RamTier = "low" | "mid" | "high" | "ultra";

export interface ModelRec {
  name: string;
  /** Hugging Face / LM Studio search string */
  searchTerm: string;
  /** Quantization tag to pick */
  quantTag: string;
  /** Approximate file size in GB */
  sizeGB: number;
  /** Min RAM needed (model size + 2GB OS overhead) */
  minRamGB: number;
  description: string;
}

export const RAM_TIERS: Record<RamTier, { label: string; ramGb: string; models: ModelRec[] }> = {
  low: {
    label: "Do 6 GB RAM",
    ramGb: "≤6 GB",
    models: [
      {
        name: "Phi-3.5 Mini",
        searchTerm: "Phi-3.5-mini-instruct-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 2.2,
        minRamGB: 4,
        description:
          "Najlepszy mały model Microsoftu — zaskakująco dobry przy tak małym rozmiarze.",
      },
      {
        name: "Llama 3.2 1B",
        searchTerm: "Llama-3.2-1B-Instruct-GGUF",
        quantTag: "Q8_0",
        sizeGB: 1.3,
        minRamGB: 3,
        description:
          "Najmniejszy model Mety — szybki, dobry do prostych zadań i starszych komputerów.",
      },
      {
        name: "Qwen 2.5 1.5B",
        searchTerm: "Qwen2.5-1.5B-Instruct-GGUF",
        quantTag: "Q8_0",
        sizeGB: 1.6,
        minRamGB: 3,
        description: "Zaskakująco sprawny model Alibaby do zadań wielojęzycznych.",
      },
    ],
  },
  mid: {
    label: "8–12 GB RAM",
    ramGb: "8–12 GB",
    models: [
      {
        name: "Llama 3.2 3B",
        searchTerm: "Llama-3.2-3B-Instruct-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 2.0,
        minRamGB: 6,
        description: "Dobry balans między rozmiarem a jakością. Świetny do codziennych zadań.",
      },
      {
        name: "Phi-3 Mini 4K",
        searchTerm: "Phi-3-mini-4k-instruct-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 2.3,
        minRamGB: 6,
        description:
          "Microsoft Phi-3 Mini z krótszym oknem kontekstu — szybki na słabszym sprzęcie.",
      },
      {
        name: "Gemma 2 2B",
        searchTerm: "gemma-2-2b-it-GGUF",
        quantTag: "Q8_0",
        sizeGB: 2.9,
        minRamGB: 6,
        description: "Mały model Google Gemma 2 — dobra jakość jak na swój rozmiar.",
      },
    ],
  },
  high: {
    label: "16 GB RAM",
    ramGb: "16 GB",
    models: [
      {
        name: "Llama 3.1 8B",
        searchTerm: "Meta-Llama-3.1-8B-Instruct-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 4.9,
        minRamGB: 8,
        description: "Doskonały model ogólnego przeznaczenia. Złoty standard dla 8B modeli.",
      },
      {
        name: "Mistral 7B v0.3",
        searchTerm: "Mistral-7B-Instruct-v0.3-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 4.1,
        minRamGB: 8,
        description: "Klasyczny model Mistral — niezawodny i szybki do pisania i analizy.",
      },
      {
        name: "Qwen 2.5 7B",
        searchTerm: "Qwen2.5-7B-Instruct-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 4.7,
        minRamGB: 8,
        description: "Jeden z najlepszych 7B modeli do zadań wielojęzycznych i kodowania.",
      },
    ],
  },
  ultra: {
    label: "32+ GB RAM",
    ramGb: "32+ GB",
    models: [
      {
        name: "Llama 3.1 8B (Q8)",
        searchTerm: "Meta-Llama-3.1-8B-Instruct-GGUF",
        quantTag: "Q8_0",
        sizeGB: 8.5,
        minRamGB: 14,
        description: "Pełna precyzja modelu 8B — najlepsza jakość przy tym rozmiarze.",
      },
      {
        name: "Llama 3.3 70B (Q2)",
        searchTerm: "Llama-3.3-70B-Instruct-GGUF",
        quantTag: "IQ2_M",
        sizeGB: 24.0,
        minRamGB: 28,
        description: "Flagowy model Mety — bardzo wysoka jakość. Wymaga mocnego komputera.",
      },
      {
        name: "Mixtral 8×7B",
        searchTerm: "Mixtral-8x7B-Instruct-v0.1-GGUF",
        quantTag: "Q4_K_M",
        sizeGB: 26.0,
        minRamGB: 30,
        description: "Architektura Mixture of Experts — szybki jak 7B, jakość jak 45B.",
      },
    ],
  },
};

export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "os",
    title: "Twój system operacyjny",
    description: "Wybierz system, z którego korzystasz.",
  },
  {
    id: "hardware",
    title: "Zasoby sprzętowe",
    description: "Ile RAM ma Twój komputer? To określi, który model będzie działał płynnie.",
  },
  {
    id: "download",
    title: "Pobierz LM Studio",
    description: "Pobierz instalator LM Studio dla swojego systemu.",
  },
  { id: "install", title: "Instalacja", description: "Zainstaluj LM Studio na swoim komputerze." },
  {
    id: "model",
    title: "Wybierz i pobierz model",
    description: "Znajdź rekomendowany model w LM Studio i pobierz go.",
  },
  {
    id: "chat",
    title: "Pierwsze uruchomienie",
    description: "Załaduj model i przetestuj go w czacie.",
  },
  {
    id: "api",
    title: "Lokalny endpoint API",
    description: "Uruchom lokalny serwer i wyślij pierwsze zapytanie przez API.",
  },
];

export const OS_LABELS: Record<OS, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
};

export const DOWNLOAD_URLS: Record<OS, string> = {
  mac: "https://lmstudio.ai/download?os=mac",
  windows: "https://lmstudio.ai/download?os=win",
  linux: "https://lmstudio.ai/download?os=linux",
};

export const INSTALL_STEPS: Record<OS, string[]> = {
  mac: [
    "Otwórz pobrany plik .dmg",
    "Przeciągnij ikonę LM Studio do folderu Applications",
    "Uruchom LM Studio z Launchpada lub folderu Aplikacje",
    "Przy pierwszym uruchomieniu: zezwól na otwarcie aplikacji (Preferencje → Prywatność i ochrona)",
  ],
  windows: [
    "Uruchom pobrany instalator .exe",
    "Kliknij Dalej → Zainstaluj (można zostawić domyślne ścieżki)",
    "Poczekaj na zakończenie instalacji (~1 minuta)",
    "Uruchom LM Studio ze Startmenu lub pulpitu",
  ],
  linux: [
    "Nadaj uprawnienia do pliku AppImage: chmod +x LM-Studio-*.AppImage",
    "Uruchom: ./LM-Studio-*.AppImage",
    "Opcjonalnie: zainstaluj AppImageLauncher dla lepszej integracji z systemem",
    'LM Studio poprosi o zainstalowanie "libfuse2" jeśli go brakuje: sudo apt install libfuse2',
  ],
};
