import type { Metadata } from "next";
import { PlaygroundShell } from "@/components/playground/PlaygroundShell";

export const metadata: Metadata = {
  title: "Playground",
  robots: { index: false, follow: false },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <PlaygroundShell>{children}</PlaygroundShell>;
}
