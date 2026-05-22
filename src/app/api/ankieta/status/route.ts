import { NextResponse } from "next/server";

import { getSurveySettings } from "@/lib/ankieta/db";

export async function GET() {
  try {
    const settings = await getSurveySettings();
    return NextResponse.json({
      ok: true,
      isOpen: settings.isOpen,
      blockedReason: settings.blockedReason,
      updatedAt: settings.updatedAt,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Nie udało się pobrać statusu ankiety." },
      { status: 500 },
    );
  }
}
