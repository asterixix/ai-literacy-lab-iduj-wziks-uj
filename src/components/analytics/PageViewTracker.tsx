"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

import { hasClientAnalyticsConsent } from "@/lib/cookie-consent";

type AnalyticsValue = string | number | boolean | null;

export function PageViewTracker({
  eventName,
  data,
}: {
  eventName: string;
  data?: Record<string, AnalyticsValue>;
}) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || !hasClientAnalyticsConsent()) {
      return;
    }

    hasTracked.current = true;
    track(eventName, data);
  }, [data, eventName]);

  return null;
}