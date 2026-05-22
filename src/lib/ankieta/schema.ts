export type Option = {
  value: string;
  label: string;
};

export type SingleQuestion = {
  kind: "single";
  id: string;
  label: string;
  required?: boolean;
  options: Option[];
  hasOther?: boolean;
};

export type MultiQuestion = {
  kind: "multi";
  id: string;
  label: string;
  required?: boolean;
  options: Option[];
  hasOther?: boolean;
};

export type TextQuestion = {
  kind: "text";
  id: string;
  label: string;
  required?: boolean;
  minLength?: number;
  textarea?: boolean;
  placeholder?: string;
};

export type MatrixQuestion = {
  kind: "matrix";
  mode: "single-choice" | "dual-scale" | "dual-yesno";
  id: string;
  label: string;
  required?: boolean;
  rows: Option[];
  columns: Option[];
};

export type PairedLevelQuestion = {
  kind: "pairedLevel";
  id: string;
  label: string;
  required?: boolean;
  beforeLabel: string;
  nowLabel: string;
  options: Option[];
};

export type SectionQuestion =
  | SingleQuestion
  | MultiQuestion
  | TextQuestion
  | MatrixQuestion
  | PairedLevelQuestion;

export type SurveySection = {
  id: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  title: string;
  description?: string;
  questions: SectionQuestion[];
};

const scale1to5: Option[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];

const beforeNowColumns: Option[] = [
  { value: "before", label: "Mój poziom PRZED warsztatami (1-5)" },
  { value: "now", label: "Mój poziom TERAZ (1-5)" },
];

const yesNoColumns: Option[] = [
  { value: "before", label: "Znałem/-am PRZED (wg pamięci)" },
  { value: "now", label: "Znam i potrafię wyjaśnić TERAZ" },
];

const b2b4Levels: Option[] = [
  { value: "A", label: "(A) Nie korzystałem/-am" },
  { value: "B", label: "(B) Używałem/-am sporadycznie do prostych promptów" },
  {
    value: "C",
    label: "(C) Używam do weryfikacji informacji z dostępem do narzędzi MCP",
  },
  {
    value: "D",
    label: "(D) Używam na co dzień z narzędziami MCP, pamięcią i RAG (np. funkcja \"Projekty\")",
  },
  {
    value: "E",
    label: "(E) Używam intensywnie z MCP, RAG, skillami, instrukcjami systemowymi itp.",
  },
];

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: "A",
    title: "SEKCJA A – Metadane (minimalne, wyłącznie do analiz zbiorczych)",
    questions: [
      {
        kind: "single",
        id: "A1",
        label: "A1. W której grupie uczestniczyłeś/-aś?",
        required: true,
        options: [
          { value: "g1", label: "Grupa 1 – Wtorek 18:30–20:30 (WZiKS, stacjonarnie)" },
          { value: "g2", label: "Grupa 2 – Środa 18:00–20:00 (Teams, zdalnie)" },
        ],
      },
      {
        kind: "single",
        id: "A2",
        label: "A2. W jakim trybie faktycznie uczestniczyłeś/-aś w zajęciach?",
        required: true,
        options: [
          { value: "onsite", label: "Wyłącznie stacjonarnie" },
          { value: "remote", label: "Wyłącznie zdalnie" },
          { value: "hybrid", label: "Hybrydowo (część stacjonarnie, część zdalnie)" },
        ],
      },
      {
        kind: "single",
        id: "A3",
        label: "A3. Na ilu spotkaniach byłeś/-aś obecny/-a?",
        required: true,
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
          { value: "5", label: "5 (wszystkie)" },
        ],
      },
      {
        kind: "single",
        id: "A4",
        label: "A4. Twój wydział:",
        required: true,
        hasOther: true,
        options: [
          {
            value: "wziks",
            label: "WZiKS (Wydział Zarządzania i Komunikacji Społecznej)",
          },
          { value: "other", label: "Inny wydział UJ (jaki?)" },
        ],
      },
      {
        kind: "single",
        id: "A5",
        label: "A5. Stopień i rok studiów:",
        required: true,
        hasOther: true,
        options: [
          { value: "lic_1", label: "I stopień (licencjat) – rok 1" },
          { value: "lic_2", label: "I stopień (licencjat) – rok 2" },
          { value: "lic_3", label: "I stopień (licencjat) – rok 3" },
          { value: "mgr_1", label: "II stopień (magister) – rok 1" },
          { value: "mgr_2", label: "II stopień (magister) – rok 2" },
          { value: "jednolite", label: "Jednolite magisterskie – rok ______" },
          { value: "phd", label: "Doktorant/-ka" },
        ],
      },
    ],
  },
  {
    id: "B",
    title: "SEKCJA B – Retrospektywna samoocena kompetencji",
    description:
      "W tej sekcji oceniasz swój poziom kompetencji DWUKROTNIE: PRZED i TERAZ. Skala 1–5, gdzie 1 = brak wiedzy/umiejętności, 5 = poziom ekspercki.",
    questions: [
      {
        kind: "matrix",
        mode: "dual-scale",
        id: "B1",
        label:
          "B1. Ogólna znajomość tematyki AI (LLMy, RAG, Agenty AI, MCP, Prompt Engineering)",
        required: true,
        columns: beforeNowColumns,
        rows: [
          {
            value: "llm",
            label: "Rozumienie czym są LLMy, jak działają, jakie mają ograniczenia",
          },
          { value: "rag", label: "Retrieval-Augmented Generation (RAG) – koncepcja i zastosowania" },
          { value: "agents", label: "Agenty AI – architektura, role, autonomia" },
          { value: "mcp", label: "Model Context Protocol (MCP) – idea i integracje" },
          { value: "prompt", label: "Metodologia Prompt Engineering" },
        ],
      },
      {
        kind: "pairedLevel",
        id: "B2",
        label: "B2. Biegłość w korzystaniu z narzędzi GenAI",
        required: true,
        beforeLabel: "Mój poziom PRZED",
        nowLabel: "Mój poziom TERAZ",
        options: b2b4Levels,
      },
      {
        kind: "matrix",
        mode: "dual-yesno",
        id: "B3",
        label:
          "B3. Znajomość konkretnych tematów – umiejętność wyjaśnienia komuś innemu (uzupełnij wg pamięci)",
        required: true,
        columns: yesNoColumns,
        rows: [
          {
            value: "prompt_structure",
            label: "Struktura dobrego promptu (kontekst, cel, instrukcje, format odpowiedzi)",
          },
          {
            value: "params",
            label: "Parametry generowania modelu (temperatura, top-p, max_tokens i ich wpływ)",
          },
          {
            value: "advanced",
            label: "Techniki zaawansowane (few-shot learning, chain of thought, iteracyjne doprecyzowanie)",
          },
          {
            value: "agent_config",
            label: "Konfiguracja agenta AI (rola, instrukcje, parametry do powtarzalnych zadań)",
          },
          {
            value: "research_agents",
            label: "Agenci do zadań badawczych (np. przegląd literatury, analiza źródeł naukowych)",
          },
          {
            value: "hallucinations",
            label: "Halucynacje w LLM i weryfikacja odpowiedzi (kiedy nie ufać modelowi)",
          },
          {
            value: "peer_review",
            label: "Peer review i ocena jakości promptów (testowanie i poprawa promptów)",
          },
          {
            value: "tools",
            label: "Praktyczne narzędzia (API LLM, edytory z integracją AI, interfejsy do konfiguracji agentów)",
          },
        ],
      },
      {
        kind: "pairedLevel",
        id: "B4",
        label: "B4. Poziom pracy z AI w programowaniu – retrospektywnie",
        required: true,
        beforeLabel: "Byłem/-am tutaj PRZED",
        nowLabel: "Jestem tutaj TERAZ",
        options: [
          {
            value: "beginner",
            label:
              "Zaczynający – Nie używam regularnie asystentów kodu (GitHub Copilot, Claude itp.). Nie wiem, jak je efektywnie wykorzystać.",
          },
          {
            value: "basic",
            label:
              "Podstawowy – Korzystam do generowania fragmentów i wyjaśniania kodu. Generuję szkielet aplikacji, ale kod wymaga znacznych poprawek.",
          },
          {
            value: "intermediate",
            label:
              "Średniozaawansowany – Efektywnie pracuję z asystentem kodu, poprawiam sugestie i debuguję. Znam podstawowe zagrożenia.",
          },
          {
            value: "advanced",
            label:
              "Zaawansowany – Asystent kodu to codzienne narzędzie. Iteracyjnie pracuję nad kodem, wiem kiedy AI nie ufać. Wdrażam dobre praktyki bezpieczeństwa.",
          },
          {
            value: "expert",
            label:
              "Ekspert – Mogę uczyć innych ograniczeń narzędzi, robić code review kodu AI i wdrażać bezpieczeństwo w zespołach.",
          },
        ],
      },
      {
        kind: "multi",
        id: "B5",
        label:
          "B5. Z których narzędzi faktycznie korzystasz po warsztatach? (zaznacz wszystkie, z których korzystasz samodzielnie)",
        required: true,
        hasOther: true,
        options: [
          { value: "chatgpt", label: "ChatGPT (darmowy / Plus / Pro)" },
          { value: "claude", label: "Claude.ai (darmowy / Pro / Max)" },
          { value: "gemini", label: "Gemini (Google)" },
          { value: "perplexity", label: "Perplexity (darmowy / Pro)" },
          { value: "lm_studio", label: "LM Studio (lokalne modele)" },
          { value: "local_gui", label: "Msty / Jan.ai / Cherry Studio (lokalne GUI dla LLM)" },
          { value: "ai_code", label: "GitHub Copilot / Cursor / Windsurf (AI do kodu)" },
          { value: "other", label: "Inne" },
        ],
      },
    ],
  },
  {
    id: "C",
    title: "SEKCJA C – Spełnienie oczekiwań",
    questions: [
      {
        kind: "single",
        id: "C1",
        label: "C1. W jakim stopniu warsztaty spełniły Twoje oczekiwania?",
        required: true,
        options: [
          { value: "1", label: "1 – Zupełnie nie spełniły" },
          { value: "2", label: "2 – Raczej nie spełniły" },
          { value: "3", label: "3 – Częściowo spełniły" },
          { value: "4", label: "4 – W dużym stopniu spełniły" },
          { value: "5", label: "5 – W pełni spełniły, a nawet przekroczyły oczekiwania" },
        ],
      },
      {
        kind: "text",
        id: "C2",
        label:
          "C2. Przypomnij sobie swoje oczekiwania sprzed rozpoczęcia warsztatów. Które z nich zostały spełnione, a które nie?",
        required: true,
        textarea: true,
        minLength: 80,
        placeholder: "Minimum 2–3 zdania.",
      },
      {
        kind: "single",
        id: "C3",
        label: "C3. Czy zakres merytoryczny warsztatów był:",
        required: true,
        options: [
          {
            value: "much_too_narrow",
            label: "Zdecydowanie za wąski – zabrakło mi wielu istotnych tematów",
          },
          { value: "too_narrow", label: "Raczej za wąski – kilka tematów bym dodał/-a" },
          { value: "just_right", label: "W sam raz – odpowiedni do czasu i założeń" },
          { value: "too_wide", label: "Raczej za szeroki – niektóre tematy można by pominąć" },
          {
            value: "much_too_wide",
            label: "Zdecydowanie za szeroki – za dużo materiału, za mało czasu na przyswojenie",
          },
        ],
      },
      {
        kind: "single",
        id: "C4",
        label: "C4. Czy poziom zaawansowania warsztatów był dla Ciebie:",
        required: true,
        options: [
          {
            value: "much_too_low",
            label: "Zdecydowanie za niski – większość treści już znałem/-am",
          },
          { value: "too_low", label: "Raczej za niski" },
          { value: "right", label: "Odpowiedni – dostosowany do mojego poziomu" },
          { value: "too_high", label: "Raczej za wysoki – momentami trudno było nadążyć" },
          { value: "much_too_high", label: "Zdecydowanie za wysoki – gubiłem/-am się regularnie" },
        ],
      },
      {
        kind: "single",
        id: "C5",
        label:
          "C5. Czy po zakończeniu warsztatów czujesz, że jesteś w stanie zrealizować cel zadeklarowany przed startem?",
        required: true,
        options: [
          { value: "yes", label: "Tak, w pełni" },
          { value: "rather_yes", label: "Raczej tak" },
          { value: "partially", label: "Częściowo – potrzebuję jeszcze samodzielnej praktyki" },
          { value: "rather_no", label: "Raczej nie – warsztaty nie dały mi wystarczających podstaw" },
          { value: "no", label: "Nie – nie widzę obecnie zastosowania" },
        ],
      },
    ],
  },
  {
    id: "D",
    title: "SEKCJA D – Jakość materiałów szkoleniowych",
    questions: [
      {
        kind: "matrix",
        mode: "single-choice",
        id: "D1",
        label: "D1. Oceń materiały szkoleniowe (1–5):",
        required: true,
        columns: scale1to5,
        rows: [
          {
            value: "clarity",
            label: "Klarowność i zrozumiałość – materiały były napisane przystępnym językiem",
          },
          {
            value: "structure",
            label: "Struktura i logika – układ treści ułatwiał naukę, a nie rozpraszał",
          },
          {
            value: "fit",
            label: "Adekwatność do zajęć – materiały pokrywały się z tym, co było omawiane",
          },
          {
            value: "practicality",
            label:
              "Praktyczna użyteczność – przykłady, case studies, ćwiczenia były osadzone w realnych scenariuszach",
          },
          {
            value: "completeness",
            label:
              "Kompletność – materiały stanowią samodzielne źródło wiedzy po zakończeniu warsztatów",
          },
          {
            value: "visual",
            label: "Estetyka i czytelność wizualna – slajdy, diagramy, układ graficzny",
          },
          {
            value: "freshness",
            label: "Aktualność – materiały odzwierciedlają stan wiedzy i narzędzi na rok 2026",
          },
          {
            value: "availability",
            label: "Dostępność – łatwo było znaleźć, pobrać, otworzyć wszystkie materiały",
          },
        ],
      },
      {
        kind: "single",
        id: "D2",
        label: "D2. Który element materiałów był dla Ciebie najbardziej wartościowy?",
        required: true,
        hasOther: true,
        options: [
          { value: "slides", label: "Prezentacje / slajdy z zajęć" },
          { value: "worksheets", label: "Karty pracy / szablony promptów" },
          { value: "links", label: "Listy linków i narzędzi" },
          { value: "repo", label: "Repozytorium z kodem / przykładami" },
          { value: "recordings", label: "Nagrania zajęć (jeśli dotyczy)" },
          { value: "case_studies", label: "Case studies / przykłady z życia wzięte" },
          { value: "exercises", label: "Ćwiczenia praktyczne na zajęciach" },
          { value: "other", label: "Inne" },
        ],
      },
      {
        kind: "text",
        id: "D3",
        label: "D3. Czego zabrakło Ci w materiałach? Co byś dodał/-a lub zmienił/-a?",
        required: true,
        textarea: true,
        minLength: 20,
      },
    ],
  },
  {
    id: "E",
    title: "SEKCJA E – Jakość prowadzenia zajęć",
    questions: [
      {
        kind: "matrix",
        mode: "single-choice",
        id: "E1",
        label: "E1. Kompetencje prowadzącego/-ych (1–5):",
        required: true,
        columns: scale1to5,
        rows: [
          {
            value: "knowledge",
            label: "Znajomość tematu – prowadzący/-a wykazywał/-a głęboką, praktyczną wiedzę",
          },
          {
            value: "explain",
            label: "Umiejętność tłumaczenia złożonych zagadnień – prostym, zrozumiałym językiem",
          },
          {
            value: "flexibility",
            label:
              "Elastyczność i reagowanie na potrzeby grupy – dostosowywanie tempa, powtarzanie, odpowiadanie na pytania",
          },
          {
            value: "engagement",
            label: "Zaangażowanie i pasja – energia, entuzjazm, motywowanie do nauki",
          },
        ],
      },
      {
        kind: "matrix",
        mode: "single-choice",
        id: "E2",
        label: "E2. Metodyka i struktura zajęć (1–5):",
        required: true,
        columns: scale1to5,
        rows: [
          {
            value: "logic",
            label:
              "Logiczny układ spotkań – kolejność tematów była przemyślana i budowała fundament pod kolejne zagadnienia",
          },
          {
            value: "balance",
            label: "Balans teoria–praktyka – proporcje między wykładem a ćwiczeniami własnymi",
          },
          { value: "pace", label: "Tempo prowadzenia – ani za szybko, ani za wolno" },
          {
            value: "methods",
            label: "Zróżnicowanie metod – wykład, dyskusja, ćwiczenia, live demo, Q&A",
          },
          {
            value: "exercise_quality",
            label: "Jakość ćwiczeń praktycznych – były angażujące, realistyczne i uczyły konkretnych umiejętności",
          },
          {
            value: "discussion_space",
            label:
              "Przestrzeń na pytania i dyskusję – mogłem/-am swobodnie pytać i dostawałem/-am rzeczowe odpowiedzi",
          },
        ],
      },
      {
        kind: "matrix",
        mode: "single-choice",
        id: "E3",
        label: "E3. Wsparcie poza zajęciami (jeśli dotyczy):",
        required: true,
        columns: [...scale1to5, { value: "nd", label: "N/D" }],
        rows: [
          {
            value: "availability",
            label: "Dostępność prowadzącego między zajęciami (Teams, e-mail, forum)",
          },
          { value: "feedback", label: "Jakość feedbacku do zadań domowych / ćwiczeń" },
        ],
      },
      {
        kind: "text",
        id: "E4",
        label: "E4. Co najbardziej doceniasz w sposobie prowadzenia zajęć?",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "E5",
        label: "E5. Co Twoim zdaniem można poprawić w metodyce lub stylu prowadzenia?",
        required: true,
        textarea: true,
        minLength: 20,
      },
    ],
  },
  {
    id: "F",
    title: "SEKCJA F – Organizacja i logistyka",
    questions: [
      {
        kind: "matrix",
        mode: "single-choice",
        id: "F1",
        label: "F1. Oceń aspekty organizacyjne (1–5):",
        required: true,
        columns: scale1to5,
        rows: [
          {
            value: "communication",
            label: "Komunikacja przed warsztatami (przypomnienia, informacje organizacyjne)",
          },
          { value: "time", label: "Dogodność terminu i godziny zajęć" },
          { value: "length", label: "Długość pojedynczego spotkania (2h)" },
          { value: "count", label: "Liczba spotkań w cyklu (5)" },
          { value: "platform", label: "Jakość platformy / sali (Teams / sala WZiKS)" },
        ],
      },
      {
        kind: "single",
        id: "F2",
        label: "F2. Czy poleciłbyś/-abyś te warsztaty innym studentom? (NPS 0–10)",
        required: true,
        options: Array.from({ length: 11 }, (_, number) => ({
          value: String(number),
          label: String(number),
        })),
      },
    ],
  },
  {
    id: "G",
    title: "SEKCJA G – Pogłębione pytania jakościowe",
    questions: [
      {
        kind: "text",
        id: "G1",
        label: "G1. Wymień 1–3 najważniejsze umiejętności lub koncepcje, które wynosisz z warsztatów.",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "G2",
        label:
          "G2. Opisz konkretny moment / ćwiczenie / insight, który miał dla Ciebie największą wartość. Co sprawiło, że był przełomowy?",
        required: true,
        textarea: true,
        minLength: 80,
        placeholder: "Minimum 2 zdania.",
      },
      {
        kind: "text",
        id: "G3",
        label: "G3. Czy warsztaty zmieniły Twój sposób myślenia o AI? Jeśli tak – w jaki sposób?",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "G4",
        label:
          "G4. Czy po ukończeniu warsztatów podjąłeś/-ęłaś już samodzielne działanie z wykorzystaniem nabytej wiedzy? Opisz krótko.",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "G5",
        label:
          "G5. Gdybyś miał/-a zaprojektować kolejną edycję warsztatów – co byś dodał/-a, usunął/-ęła lub zmienił/-a?",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "G6",
        label:
          "G6. Czy jest jakiś temat związany z AI, którego zabrakło, a który powinien znaleźć się w programie?",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "G7",
        label:
          "G7. Jakie bariery (techniczne, poznawcze, czasowe, inne) napotkałeś/-aś podczas warsztatów lub samodzielnej pracy po zajęciach?",
        required: true,
        textarea: true,
        minLength: 20,
      },
      {
        kind: "text",
        id: "G8",
        label:
          "G8. Przestrzeń na wszystko, co chcesz nam przekazać – uwagi, refleksje, krytykę, podziękowania, pomysły:",
        required: false,
        textarea: true,
      },
    ],
  },
  {
    id: "H",
    title: "SEKCJA H – Zgoda na wykorzystanie danych ewaluacyjnych",
    questions: [
      {
        kind: "single",
        id: "H0",
        label: "H0. Zapoznałem/-am się z informacją o przetwarzaniu danych (RODO).",
        required: true,
        options: [{ value: "yes", label: "Tak" }],
      },
      {
        kind: "single",
        id: "H1",
        label:
          "H1. Wyrażam zgodę na anonimowe przetwarzanie moich odpowiedzi dla celów ewaluacji projektu AI Literacy Lab.",
        required: true,
        options: [
          { value: "yes", label: "Tak, wyrażam zgodę" },
          { value: "no", label: "Nie wyrażam zgody (ankieta zostanie pominięta w analizach zbiorczych)" },
        ],
      },
    ],
  },
];

export const SURVEY_SECTION_ORDER = SURVEY_SECTIONS.map((section) => section.id);

type LabelMapEntry = {
  label: string;
  options?: Record<string, string>;
};

export const SURVEY_LABEL_MAP: Record<string, LabelMapEntry> = (() => {
  const map: Record<string, LabelMapEntry> = {};

  SURVEY_SECTIONS.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.kind === "single" || question.kind === "multi") {
        map[question.id] = {
          label: question.label,
          options: Object.fromEntries(question.options.map((option) => [option.value, option.label])),
        };
        if (question.hasOther) {
          map[`${question.id}_other`] = { label: `${question.label} – Inne (doprecyzowanie)` };
        }
        return;
      }

      if (question.kind === "text") {
        map[question.id] = { label: question.label };
        return;
      }

      if (question.kind === "pairedLevel") {
        map[`${question.id}_before`] = {
          label: `${question.label} – ${question.beforeLabel}`,
          options: Object.fromEntries(question.options.map((option) => [option.value, option.label])),
        };
        map[`${question.id}_now`] = {
          label: `${question.label} – ${question.nowLabel}`,
          options: Object.fromEntries(question.options.map((option) => [option.value, option.label])),
        };
        return;
      }

      if (question.kind === "matrix") {
        question.rows.forEach((row) => {
          if (question.mode === "single-choice") {
            const key = `${question.id}_${row.value}`;
            map[key] = {
              label: `${question.label} / ${row.label}`,
              options: Object.fromEntries(question.columns.map((column) => [column.value, column.label])),
            };
            return;
          }

          question.columns.forEach((column) => {
            const key = `${question.id}_${row.value}_${column.value}`;
            map[key] = {
              label: `${question.label} / ${row.label} / ${column.label}`,
              options:
                question.mode === "dual-yesno"
                  ? { yes: "Tak", no: "Nie" }
                  : { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" },
            };
          });
        });
      }
    });
  });

  map.meta_submitted_at = { label: "Data przesłania" };
  map.meta_form_duration_seconds = { label: "Czas wypełniania (sekundy)" };
  map.meta_certificate_evaluation_included = {
    label: "Uwzględniona w ewaluacji certyfikatu",
  };

  return map;
})();

export function normalizeOptionLabel(key: string, value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const mapping = SURVEY_LABEL_MAP[key]?.options;
  if (!mapping) {
    return value;
  }

  return mapping[value] ?? value;
}
