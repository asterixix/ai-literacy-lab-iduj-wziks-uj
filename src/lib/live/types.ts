export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LiveModule {
  moduleNumber: number;
  slug: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number | null;
  correct: boolean;
  timedOut: boolean;
}

export interface ShuffledQuestion extends QuizQuestion {
  originalId: string;
}
