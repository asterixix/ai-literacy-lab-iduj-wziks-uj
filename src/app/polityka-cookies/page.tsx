import type { Metadata } from "next";

import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Polityka cookies",
  description: "Informacje o wykorzystywaniu plików cookies i przetwarzaniu danych statystycznych i analitycznych.",
  alternates: {
    canonical: buildCanonicalPath("/polityka-cookies"),
  },
  openGraph: {
    url: buildCanonicalPath("/polityka-cookies"),
  },
};

export default function CookiePolicyPage() {
  return (
    <article className="container-wide max-w-4xl space-y-10 py-12">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase text-muted-foreground">Dokument informacyjny</p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">Polityka dotycząca cookies</h1>
        <p className="text-sm text-muted-foreground">Niniejsza polityka została przygotowana na wzór informacji publikowanych przez serwis gov.pl.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-black tracking-tight">Administrator danych</h2>
        <p className="text-sm text-muted-foreground">Dane są przetwarzane przez:</p>
        <address className="not-italic text-sm text-muted-foreground">
          Artur Sendyka
          <br />
          Staniątki 15, 32-005 Staniątki, Polska
          <br />
          <a className="underline-offset-4 hover:underline" href="mailto:artur@sendyka.dev">
            artur@sendyka.dev
          </a>
        </address>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black tracking-tight">W jakim celu używamy cookies</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Serwis wykorzystuje pliki cookies do celów statystycznych i analitycznych, aby lepiej rozumieć sposób
          korzystania z treści i ulepszać materiały edukacyjne.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black tracking-tight">Zarządzanie zgodą i plikami cookies</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Użytkownik może zarządzać zgodą na cookies analityczne poprzez link Ustawienia cookies dostępny w stopce.
          Zmiana ustawień działa natychmiast.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">Jeśli użytkownik nie chce korzystać z cookies, może:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>zmienić ustawienia klikając link w stopce,</li>
          <li>usunąć zapisane pliki cookies z przeglądarki,</li>
          <li>zablokować obsługę cookies w ustawieniach przeglądarki,</li>
          <li>korzystać z trybu incognito/prywatnego w przeglądarce.</li>
        </ul>
      </section>
    </article>
  );
}
