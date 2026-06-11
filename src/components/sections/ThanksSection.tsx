import Link from "next/link";

export function ThanksSection() {
  return (
    <section className="border-b border-border py-14">
      <div className="container-wide space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-xs uppercase text-muted-foreground">Edycja 2026</p>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Dziękujemy za udział
          </h2>
          <p className="max-w-3xl text-muted-foreground">
            Edycja 2026 AI Literacy Lab dobiegła końca. Dziękujemy wszystkim studentom UJ, którzy
            wzięli udział w warsztatach, osobom, które uzyskały certyfikaty, oraz uczestnikom
            wykładu otwartego prowadzonego przez ekspertów gościnnych.
          </p>
        </header>

        <article className="border border-border bg-muted p-5">
          <h3 className="text-lg font-black tracking-tight">Materiały z wykładu</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Slajdy, podręcznik i demo z wykładu otwartego{" "}
            <span className="font-medium text-foreground">
              Artificial Intelligence + Cybersecurity. Nowy wymiar cyberbezpieczeństwa.
            </span>{" "}
            są dostępne w sekcji{" "}
            <Link href="/materialy" className="font-medium text-foreground underline-offset-4 hover:underline">
              Materiały
            </Link>
            . Pełny raport ewaluacyjny z warsztatów jest dostępny w sekcji{" "}
            <Link href="/raporty/edycja-2026" className="font-medium text-foreground underline-offset-4 hover:underline">
              Raporty
            </Link>
            .
          </p>
        </article>
      </div>
    </section>
  );
}
