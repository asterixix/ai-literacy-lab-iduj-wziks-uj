"use client";

import { useEffect } from "react";

/**
 * Adds `data-playground` attribute to <html> on mount and removes on unmount.
 * CSS rules hide Navbar & Footer when this attribute is present.
 */
export function PlaygroundShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-playground", "");
    return () => {
      html.removeAttribute("data-playground");
    };
  }, []);

  return <>{children}</>;
}