const PROGRESS_KEY = "live_progress";

export interface QuestionResult {
  questionId: string;
  topic: string;
  question: string;
  correct: boolean;
  timedOut: boolean;
  selectedOption: string | null;
  correctOption: string;
  explanation: string;
}

export interface ModuleProgress {
  moduleSlug: string;
  moduleNumber: number;
  moduleTitle: string;
  score: number;
  total: number;
  pct: number;
  completedAt: number;
  questions: QuestionResult[];
}

export interface LiveProgress {
  modules: Record<string, ModuleProgress>;
}

export function readProgress(): LiveProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as LiveProgress) : { modules: {} };
  } catch {
    return { modules: {} };
  }
}

export function saveModuleProgress(moduleSlug: string, data: ModuleProgress): void {
  try {
    const existing = readProgress();
    existing.modules[moduleSlug] = data;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable — progress not persisted
  }
}
