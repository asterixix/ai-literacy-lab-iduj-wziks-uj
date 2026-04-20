import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PARTICIPANT_SESSION_COOKIE } from "@/lib/live/auth";
import { getParticipantById } from "@/lib/live/db/participants";
import { createParticipantSession } from "@/lib/live/db/sessions";
import { generateSessionToken } from "@/lib/live/security";

const SESSION_MAX_AGE = 60 * 60 * 8;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    participantId?: string;
    password?: string;
  } | null;

  if (!body?.participantId || !body.password) {
    return NextResponse.json({ error: "Brak danych logowania." }, { status: 400 });
  }

  const participant = await getParticipantById(body.participantId.trim());
  if (!participant) {
    return NextResponse.json({ error: "Nie znaleziono konta." }, { status: 404 });
  }

  const ok = await bcrypt.compare(body.password, participant.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Nieprawidłowe hasło." }, { status: 401 });
  }

  const token = generateSessionToken();
  await createParticipantSession(participant.id, token);

  const cookieStore = await cookies();
  cookieStore.set(PARTICIPANT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ success: true });
}
