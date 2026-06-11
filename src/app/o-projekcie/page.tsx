import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buildCanonicalPath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "O projekcie",
  description:
    "Informacje o projekcie AI Literacy Lab, prowadzących, ekspertach gościnnych i finansowaniu w ramach ID.UJ.",
  alternates: {
    canonical: buildCanonicalPath("/o-projekcie"),
  },
  openGraph: {
    url: buildCanonicalPath("/o-projekcie"),
  },
};

export default function AboutProjectPage() {
  return (
    <div className="container-wide py-14">
      <header className="mb-10 space-y-3">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">O projekcie</h1>
        <p className="max-w-3xl text-muted-foreground">
          Projekt AI Literacy Lab rozwija kompetencje praktycznego i krytycznego wykorzystania AI
          przez studentów UJ, łącząc perspektywę edukacyjną, metodologiczną, społeczną i
          instytucjonalną.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="space-y-3 border border-border p-5">
          <h2 className="text-xl font-black tracking-tight">Prowadzący</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Artur Sendyka — developer i badacz z ponad 6-letnim doświadczeniem w IT, specjalizujący
            się w tworzeniu aplikacji webowych i wdrażaniu narzędzi AI w praktyce. projektant
            warsztatów i prowadzący zajęcia. Odpowiada za część merytoryczną oraz przygotowanie
            materiałów OER.
          </p>
          <Link
            href="https://sendyka.dev"
            target="_blank"
            rel="noreferrer"
            className="text-sm hover:underline"
          >
            sendyka.dev →
          </Link>
        </article>
        <article className="space-y-3 border border-border p-5">
          <h2 className="text-xl font-black tracking-tight">Opiekun naukowy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            dr hab. Magdalena Wójcik, prof. UJ — Dyrektor Instytutu Studiów Informacyjnych UJ,
            nadzór naukowy, konsultacje metodologiczne i wsparcie jakości dydaktycznej projektu.
          </p>
        </article>
      </section>

      <section className="mt-4 border border-border p-5">
        <h2 className="text-xl font-black tracking-tight">Edycja 2026 — podsumowanie</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Dziękujemy wszystkim uczestnikom edycji 2026. Na warsztaty zapisało się 33 studentów UJ,
          certyfikaty uzyskało 26 osób, a w wykładzie otwartym{" "}
          <span className="font-medium text-foreground">
            Artificial Intelligence + Cybersecurity. Nowy wymiar cyberbezpieczeństwa.
          </span>{" "}
          wzięło udział 40 osób.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Materiały z wykładu otwartego{" "}
          <span className="font-medium text-foreground">
            Artificial Intelligence + Cybersecurity. Nowy wymiar cyberbezpieczeństwa.
          </span>{" "}
          są dostępne w sekcji{" "}
          <Link href="/materialy" className="font-medium text-foreground underline-offset-4 hover:underline">
            Materiały
          </Link>
          . Pełny raport kompetencji z warsztatów jest obecnie w opracowaniu.
        </p>
      </section>

      <section className="mt-4 border border-border p-5">
        <h2 className="text-xl font-black tracking-tight">Finansowanie</h2>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <Image
              src="/iduj.svg"
              alt="ID.UJ"
              width={400}
              height={300}
              className="h-32 w-auto max-w-[min(100%,22rem)] object-contain object-left sm:h-40 md:h-44"
              priority
            />
          </div>
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
            Projekt sfinansowany ze środków Wydziału Zarządzania i Komunikacji Społecznej w ramach
            Programu Strategicznego Inicjatywa Doskonałości w Uniwersytecie Jagiellońskim.
          </p>
        </div>
      </section>

      <section className="mt-4 border border-border p-5">
        <h2 className="text-xl font-black tracking-tight">Organizatorzy</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Koło Naukowe ZaintrygowanI UJ — studencka organizacja naukowa działająca przy Instytucie
          Studiów Informacyjnych UJ, zajmująca się popularyzacją wiedzy o informatologii,
          organizacją wydarzeń edukacyjnych i realizacją projektów badawczych.
        </p>
      </section>
    </div>
  );
}
