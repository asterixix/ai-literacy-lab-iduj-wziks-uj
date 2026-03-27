export function GuestLectureSection() {
  return (
    <section className="border-b border-border py-14">
      <div className="container-wide space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase text-muted-foreground">Wydarzenie specjalne</p>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Wykład gościnny — 14.05.2026</h2>
          <p className="max-w-3xl text-muted-foreground">
            Wykład odbędzie się w budynku WZiKS (sala do ustalenia), w godzinach 16:00-18:00.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="space-y-3 border border-border p-5">
            <h3 className="text-lg font-black tracking-tight">Prowadzący #1</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Imię i nazwisko: inż. Maciejewski Rafał</li>
              <li>• E-mail: rafal.maciejewski@kolofraktal.pl</li>
              <li>• Telefon: +48 887 668 868</li>
            </ul>
          </article>

          <article className="space-y-3 border border-border p-5">
            <h3 className="text-lg font-black tracking-tight">Prowadzący #2</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Imię i nazwisko: dr inż. Robert Albert Kłopotek</li>
              <li>• E-mail: r.klopotek@uksw.edu.pl</li>
              <li>• Telefon: Brak danych</li>
            </ul>
          </article>
        </div>

        <article className="border border-border p-5">
          <h3 className="text-lg font-black tracking-tight">
            Artificial Intelligence + Cybersecurity. Nowy wymiar cyberbezpieczeństwa.
          </h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Jednostka: Koło Naukowe „Fraktal” UKSW – WMP. SNŚ</li>
              <li>• Grupy: Brak danych</li>
              <li>• Punkty ECTS i inne: Nie dotyczy</li>
              <li>• Język prowadzenia: polski</li>
              <li>• Dyscyplina: Informatyka techniczna i telekomunikacja</li>
              <li>• Poziom: początkujący</li>
              <li>• Symbole kierunkowe efektów uczenia się: Nie dotyczy</li>
            </ul>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Wymagania wstępne:</span> Brak.
              </p>
              <p>
                <span className="font-semibold text-foreground">Pełny opis:</span> Omawiane są w sposób uproszczony
                podstawowe koncepcje różnych wariantów AI. W oparciu o tę wiedzę oraz przykłady przedstawione zostaną
                różne rodzaje zagrożeń związanych z wykorzystaniem AI. Analiza zagrożeń będzie rozszerzona o dobre
                praktyki zabezpieczające przed prezentowanymi ryzykami oraz o przykłady użycia AI do działań
                ofensywnych jako kontrast.
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">Efekty kształcenia</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Student rozróżnia podstawowe warianty AI.</li>
              <li>• Student zna różne zagrożenia związane z wykorzystywaniem AI.</li>
              <li>• Student zna dobre praktyki związane z bezpiecznym używaniem AI.</li>
              <li>• Student zna sposoby wykorzystania AI do ochrony przed zagrożeniami.</li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
