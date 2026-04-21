import { track } from "@vercel/analytics/server";
import { reportValue } from "flags";

import { hasRequestAnalyticsConsent } from "@/lib/cookie-consent";

type DownloadKind = "material" | "module";
type DownloadAvailability = "available" | "scheduled" | "unknown";
type DownloadEntry = "internal" | "external" | "direct";

interface TrackDownloadParams {
  request: Request;
  slug: string;
  fileName: string;
  kind: DownloadKind;
  category: string;
  availability: DownloadAvailability;
  moduleNumber?: number;
}

function getEntryFromRequest(request: Request): { entry: DownloadEntry; referrerPath: string | null } {
  const referer = request.headers.get("referer");
  if (!referer) {
    return { entry: "direct", referrerPath: null };
  }

  try {
    const refererUrl = new URL(referer);
    const host = request.headers.get("host");
    const isInternal = Boolean(host && refererUrl.host === host);

    return {
      entry: isInternal ? "internal" : "external",
      referrerPath: refererUrl.pathname,
    };
  } catch {
    return { entry: "external", referrerPath: null };
  }
}

export function trackDownload({
  request,
  slug,
  fileName,
  kind,
  category,
  availability,
  moduleNumber,
}: TrackDownloadParams): void {
  if (!hasRequestAnalyticsConsent(request)) {
    return;
  }

  try {
    const requestUrl = new URL(request.url);
    const utmSource = requestUrl.searchParams.get("utm_source");
    const utmMedium = requestUrl.searchParams.get("utm_medium");
    const utmCampaign = requestUrl.searchParams.get("utm_campaign");
    const { entry, referrerPath } = getEntryFromRequest(request);

    const reportedFlags: Array<[key: string, value: unknown]> = [
      ["oer-download", true],
      ["oer-download-kind", kind],
      ["oer-download-category", category],
      ["oer-download-availability", availability],
      ["oer-download-entry", entry],
      ["oer-download-format", "mdx"],
      ["oer-download-has-utm", Boolean(utmSource || utmMedium || utmCampaign)],
    ];

    for (const [key, value] of reportedFlags) {
      reportValue(key, value);
    }

    track(
      "oer_download",
      {
        slug,
        fileName,
        kind,
        category,
        availability,
        moduleNumber,
        entry,
        referrerPath,
        utmSource,
        utmMedium,
        utmCampaign,
      },
      {
        flags: reportedFlags.map(([key]) => key),
      },
    );
  } catch {
    // Never block file downloads due to telemetry issues.
  }
}
