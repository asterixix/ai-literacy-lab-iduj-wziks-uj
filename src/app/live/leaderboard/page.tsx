import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaderboardView } from "@/components/live/LeaderboardView";
import { isLiveAuthenticated } from "@/lib/live/auth-server";

export const metadata: Metadata = {
  title: "Leaderboard — AI Literacy Lab",
  robots: { index: false, follow: false },
};

export default async function LeaderboardPage() {
  const authenticated = await isLiveAuthenticated();
  if (!authenticated) redirect("/live");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          AI Literacy Lab — Live
        </p>
        <h1 className="text-3xl font-black tracking-tight">Leaderboard warsztatu</h1>
      </header>

      <LeaderboardView />

      <Link
        href="/live/profil"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Wróć do profilu
      </Link>
    </div>
  );
}
