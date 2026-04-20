import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModulesHub } from "@/components/live/ModulesHub";
import { isLiveAuthenticated } from "@/lib/live/auth-server";
import { EXERCISES } from "@/lib/live/exercises-registry";
import { getLiveModule, getLiveModuleSlugs } from "@/lib/live/registry";

export const metadata: Metadata = {
  title: "Moduły — AI Literacy Lab",
  robots: { index: false, follow: false },
};

export default async function CwiczeniaPage() {
  const authenticated = await isLiveAuthenticated();
  if (!authenticated) redirect("/live");

  const quizModules = getLiveModuleSlugs()
    .map((slug) => ({ slug, module: getLiveModule(slug) }))
    .filter(
      (entry): entry is { slug: string; module: NonNullable<ReturnType<typeof getLiveModule>> } =>
        entry.module !== undefined,
    );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-8">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          AI Literacy Lab — Warsztaty na żywo
        </p>
        <h1 className="text-3xl font-black tracking-tight">Moduły</h1>
        <p className="text-sm text-muted-foreground">
          Quizy, ćwiczenia, zadania i aktywności punktowane.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Quizy modułowe
        </h2>
        {quizModules.map((entry, index) => (
          <Link
            key={entry.slug}
            href={`/live/quiz/${entry.slug}`}
            className="flex items-start gap-5 border border-border p-5 transition hover:bg-muted"
          >
            <span className="font-mono text-2xl font-black text-muted-foreground shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 space-y-1">
              <p className="font-bold">Quiz: {entry.module.title}</p>
              <p className="text-sm text-muted-foreground">
                Moduł {entry.module.moduleNumber} • {entry.module.questions.length} pytań
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">45 s / pytanie</span>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Ćwiczenia praktyczne
        </h2>
        {EXERCISES.map((ex, i) => (
          <Link
            key={ex.slug}
            href={`/live/cwiczenia/${ex.slug}`}
            className="flex items-start gap-5 border border-border p-5 transition hover:bg-muted"
          >
            <span className="font-mono text-2xl font-black text-muted-foreground shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 space-y-1">
              <p className="font-bold">{ex.title}</p>
              <p className="text-sm text-muted-foreground">{ex.description}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{ex.duration}</span>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Zadania i aktywności
        </h2>
        <Link
          href="/live/leaderboard"
          className="block border border-border p-4 text-sm transition hover:bg-muted"
        >
          Ranking warsztatu (leaderboard) →
        </Link>
      </section>

      <ModulesHub />

      <Link
        href="/live/profil"
        className="block border border-border p-4 text-sm transition hover:bg-muted"
      >
        Sklep punktów i avatarów →
      </Link>

      <div className="flex gap-4 text-sm">
        <Link href="/live/profil" className="text-muted-foreground hover:text-foreground">
          ← Panel uczestnika
        </Link>
      </div>
    </div>
  );
}
