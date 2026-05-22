import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SURVEY_ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/ankieta/admin-auth";
import { getSurveySettings, updateSurveySettings } from "@/lib/ankieta/db";

type UpdateBody = {
  isOpen?: boolean;
  blockedReason?: string;
};

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SURVEY_ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ ok: false, error: "Brak autoryzacji." }, { status: 401 });
  }

  try {
    const settings = await getSurveySettings();
    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: false, error: "Nie udało się pobrać ustawień." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ ok: false, error: "Brak autoryzacji." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateBody;
    const isOpen = Boolean(body.isOpen);
    const blockedReason = body.blockedReason?.trim() ? body.blockedReason.trim() : null;

    await updateSurveySettings({ isOpen, blockedReason });
    const settings = await getSurveySettings();
    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: false, error: "Nie udało się zapisać ustawień." }, { status: 500 });
  }
}
