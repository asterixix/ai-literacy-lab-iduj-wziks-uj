import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/live/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/live/auth-server";

export const metadata: Metadata = {
  title: "Admin Live — AI Literacy Lab",
  robots: { index: false, follow: false },
};

export default async function LiveAdminPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/live");
  }

  return <AdminDashboard />;
}
