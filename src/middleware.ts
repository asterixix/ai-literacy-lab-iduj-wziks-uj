import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PARTICIPANT_COOKIE = "live_participant_session";
const ADMIN_COOKIE = "live_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/live/quiz") ||
    pathname.startsWith("/live/profil") ||
    pathname.startsWith("/live/cwiczenia") ||
    pathname.startsWith("/live/leaderboard")
  ) {
    const auth = request.cookies.get(PARTICIPANT_COOKIE);
    if (!auth?.value) {
      return NextResponse.redirect(new URL("/live", request.url));
    }
  }

  if (pathname.startsWith("/live/admin")) {
    const auth = request.cookies.get(ADMIN_COOKIE);
    if (!auth?.value) {
      return NextResponse.redirect(new URL("/live", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/live/quiz/:path*",
    "/live/profil/:path*",
    "/live/cwiczenia/:path*",
    "/live/leaderboard",
    "/live/admin/:path*",
  ],
};
