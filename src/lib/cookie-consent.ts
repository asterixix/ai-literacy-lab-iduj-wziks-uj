export const COOKIE_CONSENT_STORAGE_KEY = "ai-literacy-lab-cookie-consent";
export const COOKIE_CONSENT_COOKIE_NAME = "ai_literacy_lab_cookie_consent";
export const COOKIE_SETTINGS_EVENT = "ai-literacy-lab-open-cookie-settings";
export const COOKIE_CONSENT_CHANGED_EVENT = "ai-literacy-lab-cookie-consent-changed";

export type CookieConsentValue = "accepted" | "rejected";

function parseConsentValue(value: string | null | undefined): CookieConsentValue | null {
  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

function getCookieValueByName(cookieSource: string, cookieName: string): string | null {
  const cookiePairs = cookieSource.split(";");

  for (const pair of cookiePairs) {
    const [name, ...valueParts] = pair.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

export function getClientCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const parsedStoredValue = parseConsentValue(storedValue);
    if (parsedStoredValue) {
      return parsedStoredValue;
    }
  } catch {
    // Ignore storage access issues and fall back to cookies.
  }

  return parseConsentValue(getCookieValueByName(document.cookie, COOKIE_CONSENT_COOKIE_NAME));
}

export function persistClientCookieConsent(consent: CookieConsentValue): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, consent);
  } catch {
    // Ignore storage access issues.
  }

  const oneYearInSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(consent)}; Max-Age=${oneYearInSeconds}; Path=/; SameSite=Lax`;

  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
}

export function hasClientAnalyticsConsent(): boolean {
  return getClientCookieConsent() === "accepted";
}

export function getRequestCookieConsent(request: Request): CookieConsentValue | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  return parseConsentValue(getCookieValueByName(cookieHeader, COOKIE_CONSENT_COOKIE_NAME));
}

export function hasRequestAnalyticsConsent(request: Request): boolean {
  return getRequestCookieConsent(request) === "accepted";
}
