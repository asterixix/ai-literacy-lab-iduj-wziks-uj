"use client";

import { useEffect, useRef } from "react";

export type ThreatType = "automation" | "devtools" | "tab-switch";

export interface Threat {
  type: ThreatType;
  reason: string;
}

function detectAutomation(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.webdriver) return true;
  if ("__playwright" in window) return true;
  if ("__pw_manual" in window) return true;
  if ("callPhantom" in window || "_phantom" in window) return true;
  if ("__selenium_unwrapped" in window) return true;
  if ("__selenium_evaluate" in window) return true;
  return false;
}

function detectDevTools(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200
  );
}

interface AntiCheatProps {
  /** Called once on first detection. */
  onDetect: (threat: Threat) => void;
  /** Set to false to pause detection. */
  active: boolean;
}

export function AntiCheat({ onDetect, active }: AntiCheatProps) {
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    function trigger(threat: Threat) {
      if (detectedRef.current) return;
      detectedRef.current = true;
      onDetect(threat);
    }

    // Automation — checked once on mount
    if (detectAutomation()) {
      trigger({
        type: "automation",
        reason: "Wykryto narzędzie automatyzacji przeglądarki (Playwright / Selenium / PhantomJS).",
      });
      return;
    }

    // DevTools — polled every 1.5s for faster response
    const devToolsInterval = setInterval(() => {
      if (detectDevTools()) {
        trigger({
          type: "devtools",
          reason: "Otwarto narzędzia deweloperskie (DevTools) w trakcie testu.",
        });
      }
    }, 1500);

    // Tab switch — first hidden event triggers detection
    const handleVisibility = () => {
      if (document.hidden) {
        trigger({
          type: "tab-switch",
          reason: "Opuszczono kartę przeglądarki podczas trwania testu.",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active, onDetect]);

  return null;
}
