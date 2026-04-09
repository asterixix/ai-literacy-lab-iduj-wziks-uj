import type { Metadata } from "next";
import Image from "next/image";
import { JetBrains_Mono, Montserrat, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_DESCRIPTION,
  SITE_NAME,
  buildCanonicalPath,
  getSiteUrl,
} from "@/lib/seo";

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
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AI Literacy Lab",
    "warsztaty AI",
    "sztuczna inteligencja",
    "Uniwersytet Jagiellonski",
    "ID.UJ",
    "materialy OER",
  ],
  authors: [
    { name: "AI Literacy Lab" },
    { name: "Artur Sendyka", url: "https://sendyka.dev" },
  ],
  creator: "AI Literacy Lab",
  publisher: "Uniwersytet Jagiellonski",
  alternates: {
    canonical: buildCanonicalPath("/"),
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "pl_PL",
    url: buildCanonicalPath("/"),
    type: "website",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
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
