"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const LEARNING_PROMPT = `Pracuję z załączonym plikiem MDX.
1) Zrób krótkie streszczenie najważniejszych tez.
2) Przygotuj plan nauki na 45 minut.
3) Wygeneruj 10 pytań sprawdzających (od łatwych do trudnych).
4) Na końcu pokaż 5 najczęstszych błędów interpretacyjnych.`;

function buildToolLinks(prompt: string) {
  const q = encodeURIComponent(prompt);

  return [
    { id: "chatgpt", label: "Otwórz w ChatGPT", href: `https://chatgpt.com/?q=${q}` },
    { id: "claude", label: "Otwórz w Claude", href: `https://claude.ai/new?q=${q}` },
    { id: "gemini", label: "Otwórz w Gemini", href: `https://gemini.google.com/app?prompt=${q}` },
    { id: "perplexity", label: "Otwórz w Perplexity", href: `https://www.perplexity.ai/?q=${q}` },
  ] as const;
}

function getDownloadPath(pathname: string): string | null {
  if (/^\/materialy\/[^/]+$/.test(pathname)) {
    return `${pathname}/download`;
  }

  if (/^\/warsztaty\/[^/]+$/.test(pathname)) {
    return `${pathname}/download`;
  }

  return null;
}

export function AiToolLauncher() {
  const pathname = usePathname();
  const downloadPath = getDownloadPath(pathname);
  const links = buildToolLinks(LEARNING_PROMPT);

  return (
    <div className="mt-3 space-y-4 border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Kliknij narzędzie, aby otworzyć nowe okno z gotowym promptem do nauki. Następnie dołącz plik
        MDX i rozpocznij pracę.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((item) => (
          <Button
            key={item.id}
            nativeButton={false}
            variant="outline"
            className="w-full"
            render={
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                <span className="sr-only">{item.label}</span>
              </a>
            }
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(LEARNING_PROMPT);
          }}
        >
          Kopiuj prompt
        </Button>

        {downloadPath ? (
          <Button nativeButton={false} variant="outline" render={<Link href={downloadPath} />}>
            Pobierz ten plik MDX
          </Button>
        ) : null}
      </div>
    </div>
  );
}
