import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_MAX_AGE,
  SURVEY_ADMIN_COOKIE,
  createAdminSessionToken,
  isValidAdminPassword,
} from "@/lib/ankieta/admin-auth";

type LoginBody = {
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const password = body.password ?? "";

    if (!isValidAdminPassword(password)) {
      return NextResponse.json({ ok: false, error: "Nieprawidłowe hasło." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SURVEY_ADMIN_COOKIE,
      value: createAdminSessionToken(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Nie udało się zalogować." }, { status: 500 });
  }
}
