import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParticipantDashboard } from "@/components/live/ParticipantDashboard";
import { isLiveAuthenticated } from "@/lib/live/auth-server";

export const metadata: Metadata = {
  title: "Panel uczestnika — AI Literacy Lab",
  robots: { index: false, follow: false },
};

export default async function ProfilPage() {
  const authenticated = await isLiveAuthenticated();
  if (!authenticated) redirect("/live");
  return <ParticipantDashboard />;
}
