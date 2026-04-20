import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIAssistantBuilder } from "@/components/live/exercises/AIAssistantBuilder";
import { AIPlayground } from "@/components/live/exercises/AIPlayground";
import { LMStudioWizard } from "@/components/live/exercises/LMStudioWizard";
import { PrivacyTest } from "@/components/live/exercises/PrivacyTest";
import { getExercise } from "@/lib/live/exercises-registry";

interface Props {
  params: Promise<{ exercise: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exercise } = await params;
  const ex = getExercise(exercise);
  return {
    title: ex ? `${ex.title} — AI Literacy Lab` : "Ćwiczenie",
    robots: { index: false, follow: false },
  };
}

const COMPONENTS: Record<string, React.FC> = {
  porownanie: AIPlayground,
  prywatnosc: PrivacyTest,
  "lm-studio": LMStudioWizard,
  "asystent-badawczy": AIAssistantBuilder,
};

export default async function ExercisePage({ params }: Props) {
  const { exercise } = await params;
  const ex = getExercise(exercise);
  if (!ex) notFound();

  const ExerciseComponent = COMPONENTS[exercise];
  if (!ExerciseComponent) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <Link
            href="/live/cwiczenia"
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ← Ćwiczenia
          </Link>
          <span className="font-mono text-xs text-muted-foreground">·</span>
          <span className="font-mono text-xs text-muted-foreground">{ex.duration}</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">{ex.title}</h1>
        <p className="text-sm text-muted-foreground">{ex.description}</p>
      </header>

      <ExerciseComponent />
    </div>
  );
}
