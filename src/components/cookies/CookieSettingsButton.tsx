"use client";

import { COOKIE_SETTINGS_EVENT } from "@/lib/cookie-consent";

type CookieSettingsButtonProps = {
  className?: string;
};

export function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
      }}
    >
      Ustawienia cookies
    </button>
  );
}
