import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PARTICIPANT_SESSION_COOKIE } from "@/lib/live/auth";
import { deleteParticipantSession } from "@/lib/live/db/sessions";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (token) {
    await deleteParticipantSession(token);
  }

  cookieStore.delete(PARTICIPANT_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
