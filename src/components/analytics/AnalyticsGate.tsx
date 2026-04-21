"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasClientAnalyticsConsent,
} from "@/lib/cookie-consent";

export function AnalyticsGate() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const updateConsent = () => {
      setIsEnabled(hasClientAnalyticsConsent());
    };

    updateConsent();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, updateConsent);
    window.addEventListener("storage", updateConsent);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, updateConsent);
      window.removeEventListener("storage", updateConsent);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return <Analytics />;
}
