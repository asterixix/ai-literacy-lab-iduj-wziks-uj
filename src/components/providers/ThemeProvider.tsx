"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AnalyticsFlagValues } from "@/components/analytics/AnalyticsFlagValues";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
      <AnalyticsFlagValues />
    </NextThemesProvider>
  );
}
