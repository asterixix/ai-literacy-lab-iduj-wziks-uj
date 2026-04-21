"use client";

import { useEffect, useState } from "react";

import {
  COOKIE_SETTINGS_EVENT,
  type CookieConsentValue,
  getClientCookieConsent,
  persistClientCookieConsent,
} from "@/lib/cookie-consent";

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(getClientCookieConsent());
    setIsReady(true);

    const openSettings = () => {
      setIsSettingsOpen(true);
    };

    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);

    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    };
  }, []);

  const saveConsent = (nextConsent: CookieConsentValue) => {
    persistClientCookieConsent(nextConsent);
    setConsent(nextConsent);
    setIsSettingsOpen(false);
  };

  const showBanner = isReady && consent === null;

  return (
    <>
      {showBanner ? (
        <section className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 backdrop-blur">
          <div className="container-wide flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-sm text-muted-foreground">
              Używamy plików cookies do celów statystycznych i analitycznych. Możesz zaakceptować lub odrzucić
              cookies analityczne.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                onClick={() => setIsSettingsOpen(true)}
              >
                Ustawienia
              </button>
              <button
                type="button"
                className="border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                onClick={() => saveConsent("rejected")}
              >
                Odrzuć
              </button>
              <button
                type="button"
                className="bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90"
                onClick={() => saveConsent("accepted")}
              >
                Akceptuję
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isSettingsOpen ? (
        <section className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-2xl border border-border bg-background p-6 shadow-xl">
            <h2 className="text-xl font-black tracking-tight">Ustawienia cookies</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Cookies analityczne pomagają nam mierzyć korzystanie z serwisu i ulepszać treści edukacyjne.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Aktualny wybór: <span className="font-semibold text-foreground">{consent ?? "brak decyzji"}</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                onClick={() => saveConsent("rejected")}
              >
                Odrzuć cookies analityczne
              </button>
              <button
                type="button"
                className="bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90"
                onClick={() => saveConsent("accepted")}
              >
                Akceptuj cookies analityczne
              </button>
              <button
                type="button"
                className="border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                onClick={() => setIsSettingsOpen(false)}
              >
                Zamknij
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
