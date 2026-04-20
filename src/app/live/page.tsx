import { redirect } from "next/navigation";
import { PasswordGate } from "@/components/live/PasswordGate";
import { isLiveAuthenticated } from "@/lib/live/auth-server";

export default async function LivePage() {
  const authenticated = await isLiveAuthenticated();
  if (authenticated) {
    redirect("/live/profil");
  }
  return <PasswordGate />;
}
