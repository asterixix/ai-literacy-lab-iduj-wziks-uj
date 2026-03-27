import type { Metadata } from "next";
import Image from "next/image";
import { JetBrains_Mono, Montserrat } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Literacy Lab",
    template: "%s | AI Literacy Lab",
  },
  description:
    "Platforma szkoleniowa projektu AI Literacy Lab – program warsztatów, harmonogram i materiały OER.",
  openGraph: {
    title: "AI Literacy Lab",
    description:
      "Warsztaty kompetencyjne ze sztucznej inteligencji dla studentów UJ realizowane w ramach ID.UJ.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning className={`${montserrat.variable} ${jetBrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
              <Image
                src="/graphic1.svg"
                alt=""
                aria-hidden
                width={520}
                height={520}
                className="pointer-events-none absolute -top-16 -left-24 z-0 hidden opacity-30 md:block dark:opacity-20"
              />
              <Image
                src="/graphic3.svg"
                alt=""
                aria-hidden
                width={560}
                height={560}
                className="pointer-events-none absolute right-[-160px] bottom-20 z-0 hidden opacity-25 lg:block dark:opacity-15"
              />
              <Navbar />
              <main className="relative z-10 flex-1">{children}</main>
              <Footer />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
