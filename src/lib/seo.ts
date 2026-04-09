const DEFAULT_LOCAL_URL = "http://localhost:3000";

export const SITE_NAME = "AI Literacy Lab";
export const SITE_DESCRIPTION =
  "Platforma szkoleniowa projektu AI Literacy Lab - program warsztatow, harmonogram i materialy OER.";
export const OG_IMAGE_PATH = "/ailabiduj-og.png";
export const OG_IMAGE_ALT = "AI Literacy Lab - darmowe warsztaty hybrydowo";
export const OG_IMAGE_WIDTH = 940;
export const OG_IMAGE_HEIGHT = 788;

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

export function getSiteUrl(): URL {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL;

  if (envUrl) {
    try {
      return new URL(normalizeUrl(envUrl));
    } catch {
      return new URL(DEFAULT_LOCAL_URL);
    }
  }

  return new URL(DEFAULT_LOCAL_URL);
}

export function buildCanonicalPath(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}