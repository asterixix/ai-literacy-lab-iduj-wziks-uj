import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "O projekcie",
  description:
    "Informacje o projekcie AI Literacy Lab, prowadzących, ekspertach gościnnych i finansowaniu w ramach ID.UJ.",
};

export default function AboutProjectPage() {
  return (
    <div className="container-wide py-14">
      <header className="mb-10 space-y-3">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">O projekcie</h1>
        <p className="max-w-3xl text-muted-foreground">
          Projekt AI Literacy Lab rozwija kompetencje praktycznego i krytycznego wykorzystania AI przez studentów UJ,
          łącząc perspektywę edukacyjną, metodologiczną, społeczną i instytucjonalną.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="space-y-3 border border-border p-5">
          <h2 className="text-xl font-black tracking-tight">Prowadzący</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Artur Sendyka — developer i badacz z ponad 6-letnim doświadczeniem w IT, specjalizujący się w tworzeniu aplikacji webowych i wdrażaniu narzędzi AI w praktyce. projektant warsztatów i prowadzący zajęcia. Odpowiada za część merytoryczną oraz
            przygotowanie materiałów OER.
          </p>
          <Link href="https://sendyka.dev" target="_blank" rel="noreferrer" className="text-sm hover:underline">
            sendyka.dev →
          </Link>
        </article>
        <article className="space-y-3 border border-border p-5">
          <h2 className="text-xl font-black tracking-tight">Opiekun naukowy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            dr hab. Magdalena Wójcik, prof. UJ — Dyrektor Instytutu Studiów Informacyjnych UJ, nadzór naukowy, konsultacje metodologiczne i wsparcie jakości
            dydaktycznej projektu.
          </p>
        </article>
      </section>

      <section className="mt-4 border border-border p-5">
        <h2 className="text-xl font-black tracking-tight">Zapisy i organizacja warsztatów</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Warsztaty będą realizowane w dwóch grupach po 15 osób. Przewidywany start zajęć: 28.04.2026.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-border p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Grupa 1 (stacjonarnie)</p>
            <ul className="mt-2 space-y-1">
              <li>• Miejsce: WZiKS, sala 2.121, ul. Łojasiewicza 4, Kraków</li>
              <li>• Dzień: wtorek</li>
              <li>• Godziny: 18:30-20:30</li>
            </ul>
          </div>
          <div className="border border-border p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Grupa 2 (zdalnie)</p>
            <ul className="mt-2 space-y-1">
              <li>• Platforma: MS Teams UJ</li>
              <li>• Dzień: środa</li>
              <li>• Godziny: 18:00-20:00</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-4 border border-border p-5">
        <h2 className="text-xl font-black tracking-tight">Wykład gościnny — 14.05.2026 (16:00-18:00)</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Lokalizacja: budynek WZiKS, aula 0.103.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-border p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Prowadzący #1</p>
            <ul className="mt-2 space-y-1">
              <li>• inż. Maciejewski Rafał</li>
              <li>• rafal.maciejewski@kolofraktal.pl</li>
            </ul>
          </div>
          <div className="border border-border p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Prowadzący #2</p>
            <ul className="mt-2 space-y-1">
              <li>• dr inż. Robert Albert Kłopotek</li>
              <li>• r.klopotek@uksw.edu.pl</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 border border-border p-4 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Nazwa przedmiotu:</span> Artificial Intelligence +
            Cybersecurity. Nowy wymiar cyberbezpieczeństwa.
          </p>
          <p className="mt-2">
            <span className="font-semibold text-foreground">Pełny opis:</span> Omawiane są w sposób uproszczony
            podstawowe koncepcje różnych wariantów AI. W oparciu o tę wiedzę i różnorodne przykłady opisane zostaną
            rodzaje zagrożeń związanych z wykorzystaniem AI. Analiza zagrożeń będzie rozszerzona o dobre praktyki
            zabezpieczające oraz o pokazanie wykorzystania AI do działań ofensywnych jako kontrast.
          </p>
        </div>
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
            Projekt sfinansowany ze środków Wydziału Zarządzania i Komunikacji Społecznej w ramach Programu
            Strategicznego Inicjatywa Doskonałości w Uniwersytecie Jagiellońskim.
          </p>
        </div>
      </section>

      <section className="mt-4 border border-border p-5">
        <h2 className="text-xl font-black tracking-tight">Organizatorzy</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Koło Naukowe ZaintrygowanI UJ · Instytut Studiów Informacyjnych UJ
        </p>
      </section>
    </div>
  );
}
