import type { Metadata } from "next";
import Image from "next/image";
import { JetBrains_Mono, Montserrat, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

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

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${montserrat.variable} ${sourceSans3.variable} ${jetBrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="pointer-events-none absolute inset-0 z-0 overflow-x-hidden">
                <Image
                  src="/graphic1.svg"
                  alt=""
                  aria-hidden
                  width={520}
                  height={520}
                  className="absolute -top-16 -left-24 hidden opacity-30 md:block dark:opacity-20"
                />
                <Image
                  src="/graphic3.svg"
                  alt=""
                  aria-hidden
                  width={560}
                  height={560}
                  className="absolute -right-40 bottom-20 hidden opacity-25 lg:block dark:opacity-15"
                />
              </div>
              <a
                href="#main-content"
                className="sr-only z-60 rounded-sm border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
              >
                Przejdź do treści głównej
              </a>
              <div className="relative z-10 flex min-h-screen flex-col">
                <Navbar />
                <main id="main-content" className="relative z-10 flex-1 focus:outline-none">
                  {children}
                </main>
                <Footer />
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
