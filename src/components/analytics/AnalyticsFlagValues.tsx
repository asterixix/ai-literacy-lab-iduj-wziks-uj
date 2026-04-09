"use client";

import { useEffect, useState } from "react";
import { FlagValues } from "flags/react";
import { useTheme } from "next-themes";

export function AnalyticsFlagValues() {
  const { resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (!mounted || !resolvedTheme) {
    return null;
  }

  return (
    <FlagValues
      values={{
        theme_mode: resolvedTheme,
        theme_is_dark: resolvedTheme === "dark",
        theme_system: systemTheme ?? null,
        prefers_reduced_motion: prefersReducedMotion,
      }}
    />
  );
}