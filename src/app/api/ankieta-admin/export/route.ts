import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SURVEY_ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/ankieta/admin-auth";
import { buildAggregateCsv } from "@/lib/ankieta/csv";
import { getSurveyResponses, parseJsonRecord } from "@/lib/ankieta/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SURVEY_ADMIN_COOKIE)?.value;

  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Brak autoryzacji." }, { status: 401 });
  }

  try {
    const rows = await getSurveyResponses(20_000);
    const flatRows = rows.map((row) => parseJsonRecord<Record<string, string>>(row.flat_data));
    const csv = buildAggregateCsv(flatRows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"ankieta-ai-literacy-lab-zbiorcze.csv\"",
      },
    });
  } catch (error) {
    console.error("Survey export error", error);
    return NextResponse.json({ ok: false, error: "Nie udało się wygenerować CSV." }, { status: 500 });
  }
}
