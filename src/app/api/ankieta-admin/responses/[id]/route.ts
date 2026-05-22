import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SURVEY_ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/ankieta/admin-auth";
import { deleteSurveyResponse } from "@/lib/ankieta/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SURVEY_ADMIN_COOKIE)?.value;

  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Brak autoryzacji." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteSurveyResponse(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Nie udało się usunąć odpowiedzi." },
      { status: 500 },
    );
  }
}
