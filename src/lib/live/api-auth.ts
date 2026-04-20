import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, PARTICIPANT_SESSION_COOKIE } from "@/lib/live/auth";
import { getParticipantIdBySession, isAdminSessionValid } from "@/lib/live/db/sessions";

export async function requireParticipantIdFromApi(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return getParticipantIdBySession(token);
}

export async function requireAdminFromApi(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  return isAdminSessionValid(token);
}
