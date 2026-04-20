export interface OptOutStep {
  step: string;
  detail?: string;
}

export interface PlatformPrivacy {
  id: string;
  name: string;
  company: string;
  /** Does training on free-tier conversations? */
  trainsOnFreeData: boolean;
  /** Can user fully opt out? */
  optOutAvailable: boolean;
  /** URL to privacy/data settings */
  settingsUrl: string;
  policyUrl: string;
  dataRetention: string;
  dataCollected: string[];
  optOutSteps: OptOutStep[];
  notes: string;
}

export const PLATFORMS: PlatformPrivacy[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    company: "OpenAI",
    trainsOnFreeData: true,
    optOutAvailable: true,
    settingsUrl: "https://chat.openai.com/settings/data-controls",
    policyUrl: "https://openai.com/policies/privacy-policy",
    dataRetention: "30 dni po usunięciu konta; logi API — do 30 dni",
    dataCollected: [
      "Treść rozmów (prompty + odpowiedzi)",
      "Informacje o koncie (email, nazwa)",
      "Dane użycia i aktywności",
      "Przesłane pliki i obrazy",
      "Informacje o urządzeniu i przeglądarce",
    ],
    optOutSteps: [
      { step: "Otwórz ChatGPT i kliknij swoje imię w lewym dolnym rogu." },
      { step: "Wybierz Ustawienia (Settings)." },
      { step: "Przejdź do zakładki Kontrola danych (Data controls)." },
      {
        step: "Wyłącz przełącznik Improve the model for everyone.",
        detail:
          "Opcja ta jest dostępna tylko na kontach bez aktywnej subskrypcji Team lub Enterprise.",
      },
      { step: "Kliknij Confirm, aby zapisać zmianę." },
      { step: "Opcjonalnie: kliknij Delete all chats, aby usunąć historię rozmów." },
    ],
    notes:
      "Wyłączenie opcji trenowania nie dotyczy wstecznego, ale nowe rozmowy nie będą używane. Użytkownicy ChatGPT Team/Enterprise mają trenowanie domyślnie wyłączone.",
  },
  {
    id: "claude",
    name: "Claude",
    company: "Anthropic",
    trainsOnFreeData: true,
    optOutAvailable: true,
    settingsUrl: "https://claude.ai/settings",
    policyUrl: "https://www.anthropic.com/privacy",
    dataRetention: "Do 30 dni po usunięciu; dane treningowe — bezterminowo po anonimizacji",
    dataCollected: [
      "Treść rozmów z Claude.ai",
      "Oceny i opinie użytkowników (thumbs up/down)",
      "Metadane sesji i użycia",
      "Informacje o koncie",
    ],
    optOutSteps: [
      { step: "Zaloguj się na claude.ai i kliknij swoje inicjały w prawym górnym rogu." },
      { step: "Wybierz Ustawienia (Settings)." },
      { step: "Otwórz zakładkę Prywatność (Privacy)." },
      {
        step: "Wyłącz opcję Improve Claude for everyone.",
        detail:
          "Przełącznik widoczny tylko dla użytkowników bezpłatnych i Pro. Plany Team/Enterprise domyślnie nie trenują modeli.",
      },
      { step: "Zmiany są zapisywane automatycznie." },
    ],
    notes:
      "Dane API (klucz deweloperski) Anthropic domyślnie NIE używa do trenowania. Trenowanie dotyczy wyłącznie rozmów przez interfejs claude.ai.",
  },
  {
    id: "gemini",
    name: "Gemini",
    company: "Google",
    trainsOnFreeData: true,
    optOutAvailable: true,
    settingsUrl: "https://myactivity.google.com/product/gemini",
    policyUrl: "https://policies.google.com/privacy",
    dataRetention: "18 miesięcy domyślnie; można zmienić na 3, 18, 36 miesięcy lub auto-usuwanie",
    dataCollected: [
      "Treść rozmów z Gemini Apps (Gemini.google.com, Bard)",
      "Powiązane dane konta Google",
      "Dane aktywności z aplikacji Google (Gmail, Drive — jeśli Workspace Extensions włączone)",
      "Logi aktywności zapisane w Moim koncie Google",
    ],
    optOutSteps: [
      { step: "Przejdź na myactivity.google.com i zaloguj się na konto Google." },
      { step: "Znajdź sekcję Gemini Apps Activity lub Web & App Activity." },
      {
        step: "Kliknij Wyłącz (Turn off) i potwierdź wyłączenie aktywności Gemini.",
        detail: "Google może nadal przechowywać dane przez 72h po wyłączeniu.",
      },
      { step: "Opcjonalnie: kliknij Usuń aktywność według daty, aby usunąć historię." },
      { step: "Sprawdź też: myaccount.google.com → Dane i prywatność → Zarządzaj aktywnością." },
    ],
    notes:
      "Wyłączenie Gemini Apps Activity uniemożliwia Google używanie rozmów do trenowania produktów AI. Google Workspace Gemini (płatny) ma inną politykę — dane domyślnie nie są używane do trenowania.",
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    company: "Microsoft",
    trainsOnFreeData: false,
    optOutAvailable: true,
    settingsUrl: "https://privacy.microsoft.com/en-us/dashboard",
    policyUrl: "https://privacy.microsoft.com/en-us/privacystatement",
    dataRetention: "6 miesięcy domyślnie dla historii czatów; dane diagnostyczne — 12 miesięcy",
    dataCollected: [
      "Treść rozmów z Copilot (web, app, Edge)",
      "Historia wyszukiwania Bing powiązana z Copilot",
      "Metadane urządzenia i przeglądarki",
      "Dane aktywności Microsoft Account",
    ],
    optOutSteps: [
      { step: "Przejdź na privacy.microsoft.com/dashboard i zaloguj się na konto Microsoft." },
      { step: "Otwórz sekcję Aktywność przeglądarki i wyszukiwania." },
      { step: "Wyłącz Personalizację na podstawie aktywności wyszukiwania i przeglądania." },
      {
        step: "W sekcji Historia czatów Copilot: kliknij Wyczyść dane aktywności.",
        detail:
          "Microsoft Copilot (bezpłatny) domyślnie nie trenuje globalnych modeli na treściach użytkownika.",
      },
      {
        step: "Dla M365 Copilot (enterprise): administrator IT zarządza ustawieniami w centrum administracyjnym Microsoft 365.",
      },
    ],
    notes:
      "Microsoft twierdzi, że nie używa danych z rozmów Copilot do trenowania LLM bazowych (Azure OpenAI). Dane mogą być używane do personalizacji i poprawy usługi.",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    company: "Perplexity AI",
    trainsOnFreeData: true,
    optOutAvailable: true,
    settingsUrl: "https://www.perplexity.ai/settings/account",
    policyUrl: "https://www.perplexity.ai/privacy",
    dataRetention: "Do usunięcia konta; historia wyszukiwania — można czyścić ręcznie",
    dataCollected: [
      "Treść zapytań i odpowiedzi",
      "Historia wyszukiwania",
      "Dane konta (email)",
      "Dane urządzenia i przeglądarki",
      "Pliki przesyłane do analizy",
    ],
    optOutSteps: [
      { step: "Zaloguj się na perplexity.ai i kliknij swoje zdjęcie profilowe." },
      { step: "Otwórz Ustawienia (Settings)." },
      { step: "Przejdź do zakładki Account lub Privacy." },
      {
        step: "Znajdź opcję AI data improvements / Używanie danych do ulepszania AI i wyłącz ją.",
        detail:
          "Interfejs Perplexity zmienia się — opcja może być w różnych miejscach w zależności od wersji.",
      },
      { step: "Usuń historię wyszukiwania klikając Clear Search History." },
    ],
    notes:
      "Perplexity Pro nie trenuje modeli na danych użytkowników. Użytkownicy bezpłatni — polityka mniej korzystna.",
  },
  {
    id: "lechat",
    name: "Le Chat",
    company: "Mistral AI",
    trainsOnFreeData: true,
    optOutAvailable: true,
    settingsUrl: "https://chat.mistral.ai/",
    policyUrl: "https://mistral.ai/privacy-policy",
    dataRetention: "Do usunięcia konta; możliwe wcześniejsze usunięcie w ustawieniach",
    dataCollected: ["Treść rozmów z Le Chat", "Dane konta (email, nazwa)", "Metadane użycia"],
    optOutSteps: [
      { step: "Zaloguj się na chat.mistral.ai i otwórz menu profilu." },
      { step: "Kliknij Ustawienia (Settings) lub Profile." },
      { step: "Przejdź do sekcji Prywatność (Privacy) lub Dane (Data)." },
      {
        step: "Wyłącz opcję związaną z używaniem rozmów do ulepszania modeli.",
        detail:
          "Mistral Le Chat jest nowym produktem — interfejs ustawień prywatności może się zmienić.",
      },
      { step: "Zapisz zmiany i opcjonalnie usuń historię rozmów." },
    ],
    notes:
      "Mistral AI jest firmą europejską (Francja), co oznacza podleganie RODO. Masz prawo do wglądu, sprostowania i usunięcia danych.",
  },
];

export interface PolicyRow {
  label: string;
  key: keyof Pick<PlatformPrivacy, "trainsOnFreeData" | "optOutAvailable" | "dataRetention">;
}

export const COMPARISON_ROWS: PolicyRow[] = [
  { label: "Trenuje na darmowych rozmowach", key: "trainsOnFreeData" },
  { label: "Możliwość opt-out", key: "optOutAvailable" },
  { label: "Okres retencji danych", key: "dataRetention" },
];
