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
        <p className="text-sm text-muted-foreground">Serwis ailabiduj.vercel.app używa plików cookies. W poniższym dokumencie informujemy o korzystaniu z plików cookies w serwisie ailabiduj.vercel.app.</p>
      </header>

    <section className="space-y-3">
        <h2 className="text-2xl font-black tracking-tight">Czym są pliki cookies?</h2>
        <p className="text-sm text-muted-foreground">Pliki cookies to małe fragmenty tekstu, kodu, które są wysyłane do przeglądarki i które przeglądarka wysyła z powrotem. Niektóre cookies są czasem zapisywane na danym urządzeniu podczas przeglądania serwisu www.gov.pl. Istnieją różne rodzaje plików cookies. Pliki cookies używane w serwisie www.gov.pl zostały podzielone na następujące kategorie: niezbędne pliki cookies, funkcjonalne, analityczne.</p>
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
