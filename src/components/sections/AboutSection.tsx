import Link from "next/link";

export function AboutSection() {
  return (
    <section className="border-t border-border py-16">
      <div className="container-wide grid gap-10 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">O projekcie</h2>
          <p className="max-w-2xl text-muted-foreground">
            AI Literacy Lab to cykl warsztatów budujących kompetencje praktycznego i odpowiedzialnego
            wykorzystania AI w środowisku akademickim. Platforma porządkuje plan warsztatów i
            zasoby OER dla uczestników oraz szerszej społeczności UJ.
          </p>
          <Link href="/o-projekcie" className="text-sm font-medium underline-offset-4 hover:underline">
            Przejdź do strony projektu →
          </Link>
        </div>
        <aside className="space-y-3 border border-border p-4 text-sm">
          <p>
            <span className="font-mono uppercase text-muted-foreground">Prowadzący</span>
            <br />
            Artur Sendyka
          </p>
          <p>
            <span className="font-mono uppercase text-muted-foreground">Opiekun naukowy</span>
            <br />
            dr hab. Magdalena Wójcik, prof. UJ
          </p>
        </aside>
      </div>
    </section>
  );
}
