export interface LiveExercise {
  slug: string;
  moduleNumber: number;
  title: string;
  description: string;
  duration: string;
}

export const EXERCISES: LiveExercise[] = [
  {
    slug: "porownanie",
    moduleNumber: 2,
    title: "Porównanie modeli AI — na żywo",
    description:
      "Wyślij ten sam prompt do maksymalnie 4 modeli AI jednocześnie i porównaj jakość, szybkość i koszt odpowiedzi.",
    duration: "20 min",
  },
  {
    slug: "prywatnosc",
    moduleNumber: 2,
    title: "Test prywatności",
    description:
      "Sprawdź, które platformy AI trenują modele na Twoich danych i jak wyłączyć tę opcję krok po kroku.",
    duration: "15 min",
  },
  {
    slug: "lm-studio",
    moduleNumber: 2,
    title: "Instalacja i konfiguracja LM Studio",
    description:
      "Krok po kroku: pobierz, zainstaluj i uruchom lokalny model AI na własnym komputerze bez dostępu do internetu.",
    duration: "25 min",
  },
  {
    slug: "asystent-badawczy",
    moduleNumber: 3,
    title: "Zbuduj asystenta badawczego",
    description:
      "Stwórz zaawansowanego asystenta AI z RAG-iem (TXT), system promptem, podpięciem MCP i wyborem modelu z Eden AI. Zdobywaj punkty za każdy dodany element, input tokeny i output tokeny.",
    duration: "30 min",
  },
];

export function getExercise(slug: string): LiveExercise | undefined {
  return EXERCISES.find((e) => e.slug === slug);
}
