export function WorkshopRegistrationSection() {
  return (
    <section className="border-b border-border py-14">
      <div className="container-wide space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase text-muted-foreground">Zapisy i organizacja</p>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Warsztaty w dwóch grupach</h2>
          <p className="max-w-3xl text-muted-foreground">
            Warsztaty odbędą się w dwóch grupach po 15 osób. Przewidywany start zajęć: 28.04.2026.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="border border-border p-5">
            <h3 className="text-lg font-black tracking-tight">Grupa 1 (stacjonarnie)</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>• Miejsce: budynek WZiKS w Krakowie, ul. Łojasiewicza 4</li>
              <li>• Termin: wtorki</li>
              <li>• Godziny: 18:30-20:30</li>
            </ul>
          </article>

          <article className="border border-border p-5">
            <h3 className="text-lg font-black tracking-tight">Grupa 2 (zdalnie)</h3>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>• Platforma: MS Teams UJ</li>
              <li>• Termin: środy</li>
              <li>• Godziny: 18:00-20:00</li>
            </ul>
          </article>
        </div>

        <article className="border border-border bg-muted p-5">
          <h3 className="text-lg font-black tracking-tight">Dlaczego warto wziąć udział?</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Nawet jeśli materiały szkoleniowe są już dostępne, udział w warsztatach daje dodatkowe korzyści: każdy
            uczestnik otrzymuje kredyty do 10 USD do wykorzystania w OpenRouter API oraz certyfikat potwierdzający
            udział.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Osoby, które nie będą mogły uczestniczyć w zajęciach, mają bezpłatny dostęp do materiałów edukacyjnych.
          </p>
        </article>
      </div>
    </section>
  );
}
