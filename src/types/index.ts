export interface ModuleDate {
  group: string;
  date: string;
  time: string;
}

export interface Module {
  slug: string;
  number: number;
  title: string;
  titleEn: string;
  duration: string;
  description: string;
  tags: string[];
  instructor: string;
  date?: string;
  dates?: ModuleDate[];
  objectives: string[];
  tools: string[];
}

export interface Material {
  id: string;
  title: string;
  description: string;
  formats: string[];
  category: "prompts" | "case-study" | "guide" | "resources" | "lecture";
  available: boolean;
  availableDate?: string;
  downloadUrl?: string;
  githubUrl?: string;
  /** MDX materials can be read in the browser; file materials are download-only. */
  readPage?: boolean;
  /** On-disk filename in src/content/materials/ for binary downloads. */
  fileName?: string;
}
