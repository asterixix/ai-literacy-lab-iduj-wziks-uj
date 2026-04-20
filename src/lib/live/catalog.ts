export type UnlockCategory = "theme" | "font" | "frame" | "title" | "avatar";

export type UnlockRarity = "common" | "rare" | "epic" | "legendary";

export interface UnlockItem {
  id: string;
  category: UnlockCategory;
  name: string;
  pointsCost: number;
  rarity: UnlockRarity;
  description: string;
}

export const UNLOCK_ITEMS: UnlockItem[] = [
  {
    id: "theme-default",
    category: "theme",
    name: "Klasyczny Lab",
    pointsCost: 0,
    rarity: "common",
    description: "Domyślny styl warsztatów.",
  },
  {
    id: "theme-matrix",
    category: "theme",
    name: "Matrix Terminal",
    pointsCost: 280,
    rarity: "common",
    description: "Neonowy, techniczny klimat.",
  },
  {
    id: "theme-sunrise",
    category: "theme",
    name: "Sunrise Glass",
    pointsCost: 420,
    rarity: "rare",
    description: "Jasny motyw ze szklanym efektem.",
  },
  {
    id: "theme-arctic",
    category: "theme",
    name: "Arctic Data",
    pointsCost: 560,
    rarity: "rare",
    description: "Chłodna estetyka danych.",
  },
  {
    id: "theme-noir",
    category: "theme",
    name: "Noir Console",
    pointsCost: 740,
    rarity: "epic",
    description: "Kontrastowy motyw premium.",
  },
  {
    id: "theme-cyber",
    category: "theme",
    name: "Cyber Grid",
    pointsCost: 980,
    rarity: "epic",
    description: "Turniejowy motyw dla power-userów.",
  },
  {
    id: "theme-solar-flare",
    category: "theme",
    name: "Solar Flare",
    pointsCost: 1220,
    rarity: "epic",
    description: "Ciepłe gradienty i energia hackathonu.",
  },
  {
    id: "theme-ocean-core",
    category: "theme",
    name: "Ocean Core",
    pointsCost: 1380,
    rarity: "epic",
    description: "Minimalistyczny motyw deep focus.",
  },
  {
    id: "theme-auric",
    category: "theme",
    name: "Auric Rank",
    pointsCost: 1650,
    rarity: "legendary",
    description: "Złoty motyw dla ścisłej czołówki.",
  },
  {
    id: "theme-diamond",
    category: "theme",
    name: "Diamond Flux",
    pointsCost: 2100,
    rarity: "legendary",
    description: "Najwyższa liga stylistyczna.",
  },

  {
    id: "font-default",
    category: "font",
    name: "System Mono",
    pointsCost: 0,
    rarity: "common",
    description: "Domyślna czcionka profilu.",
  },
  {
    id: "font-tech",
    category: "font",
    name: "Tech Slab",
    pointsCost: 180,
    rarity: "common",
    description: "Techniczny charakter.",
  },
  {
    id: "font-neo",
    category: "font",
    name: "Neo Grotesk",
    pointsCost: 340,
    rarity: "rare",
    description: "Nowoczesny wygląd interfejsu.",
  },
  {
    id: "font-editorial",
    category: "font",
    name: "Editorial Serif",
    pointsCost: 520,
    rarity: "rare",
    description: "Elegancki styl prezentacyjny.",
  },
  {
    id: "font-pixel",
    category: "font",
    name: "Pixel Ops",
    pointsCost: 760,
    rarity: "epic",
    description: "Retro estetyka grywalizacji.",
  },
  {
    id: "font-ink",
    category: "font",
    name: "Ink Narrative",
    pointsCost: 940,
    rarity: "epic",
    description: "Styl opowieści i długich odpowiedzi.",
  },
  {
    id: "font-vector",
    category: "font",
    name: "Vector Sans",
    pointsCost: 1200,
    rarity: "legendary",
    description: "Supersharp, minimalistyczna typografia.",
  },

  {
    id: "frame-none",
    category: "frame",
    name: "Brak ramki",
    pointsCost: 0,
    rarity: "common",
    description: "Bez dekoracji avatara.",
  },
  {
    id: "frame-neon",
    category: "frame",
    name: "Neon Edge",
    pointsCost: 260,
    rarity: "common",
    description: "Jasna obwódka avatara.",
  },
  {
    id: "frame-data",
    category: "frame",
    name: "Data Rings",
    pointsCost: 420,
    rarity: "rare",
    description: "Koncentryczne ramki danych.",
  },
  {
    id: "frame-crown",
    category: "frame",
    name: "Crown Orbit",
    pointsCost: 640,
    rarity: "epic",
    description: "Ramka lidera.",
  },
  {
    id: "frame-holo",
    category: "frame",
    name: "Holo Prism",
    pointsCost: 860,
    rarity: "epic",
    description: "Efekt hologramu przy avatarze.",
  },
  {
    id: "frame-legend",
    category: "frame",
    name: "Legend Halo",
    pointsCost: 1280,
    rarity: "legendary",
    description: "Ramka premium dla top rankingu.",
  },

  {
    id: "title-nowicjusz",
    category: "title",
    name: "Nowicjusz",
    pointsCost: 0,
    rarity: "common",
    description: "Start warsztatu.",
  },
  {
    id: "title-eksplorator",
    category: "title",
    name: "Eksplorator Promptów",
    pointsCost: 180,
    rarity: "common",
    description: "Pierwsze postępy.",
  },
  {
    id: "title-analityk",
    category: "title",
    name: "Analityk AI",
    pointsCost: 340,
    rarity: "rare",
    description: "Solidna regularność.",
  },
  {
    id: "title-architekt",
    category: "title",
    name: "Architekt Workflow",
    pointsCost: 520,
    rarity: "rare",
    description: "Skuteczne łączenie narzędzi.",
  },
  {
    id: "title-strateg",
    category: "title",
    name: "Strateg Agentów",
    pointsCost: 760,
    rarity: "epic",
    description: "Wysoki poziom sprawności.",
  },
  {
    id: "title-mentor",
    category: "title",
    name: "Mentor Zespołu",
    pointsCost: 940,
    rarity: "epic",
    description: "Pomaga innym i dowozi wynik.",
  },
  {
    id: "title-lab-hero",
    category: "title",
    name: "Bohater Labu",
    pointsCost: 1280,
    rarity: "legendary",
    description: "Najbardziej aktywni uczestnicy.",
  },
  {
    id: "title-mistrz",
    category: "title",
    name: "Mistrz Warsztatu",
    pointsCost: 1700,
    rarity: "legendary",
    description: "Elita danej edycji.",
  },

  {
    id: "avatar-default",
    category: "avatar",
    name: "Adventurer Base",
    pointsCost: 0,
    rarity: "common",
    description: "Podstawowy avatar DiceBear.",
  },
  {
    id: "avatar-scout",
    category: "avatar",
    name: "Scout Operator",
    pointsCost: 220,
    rarity: "common",
    description: "Lekki styl terenowy.",
  },
  {
    id: "avatar-neon-fox",
    category: "avatar",
    name: "Neon Fox",
    pointsCost: 380,
    rarity: "rare",
    description: "Szybki i sprytny styl.",
  },
  {
    id: "avatar-data-wizard",
    category: "avatar",
    name: "Data Wizard",
    pointsCost: 560,
    rarity: "rare",
    description: "Estetyka analityka danych.",
  },
  {
    id: "avatar-cyber-samurai",
    category: "avatar",
    name: "Cyber Samurai",
    pointsCost: 760,
    rarity: "epic",
    description: "Wysoka precyzja i dyscyplina.",
  },
  {
    id: "avatar-orbit-hacker",
    category: "avatar",
    name: "Orbit Hacker",
    pointsCost: 920,
    rarity: "epic",
    description: "Motyw orbitalny i futurystyczny.",
  },
  {
    id: "avatar-phoenix",
    category: "avatar",
    name: "Prompt Phoenix",
    pointsCost: 1280,
    rarity: "legendary",
    description: "Powraca z najlepszym promptem.",
  },
  {
    id: "avatar-quantum-owl",
    category: "avatar",
    name: "Quantum Owl",
    pointsCost: 1600,
    rarity: "legendary",
    description: "Najrzadsza maskotka rankingu.",
  },
];

export function getUnlockItem(itemId: string): UnlockItem | undefined {
  return UNLOCK_ITEMS.find((entry) => entry.id === itemId);
}

export function getDefaultItemId(category: UnlockCategory): string {
  if (category === "theme") return "theme-default";
  if (category === "font") return "font-default";
  if (category === "frame") return "frame-none";
  if (category === "avatar") return "avatar-default";
  return "title-nowicjusz";
}

export function getDefaultItemIds(): string[] {
  return [
    getDefaultItemId("theme"),
    getDefaultItemId("font"),
    getDefaultItemId("frame"),
    getDefaultItemId("title"),
    getDefaultItemId("avatar"),
  ];
}

export function isDefaultItem(itemId: string): boolean {
  return getDefaultItemIds().includes(itemId);
}
