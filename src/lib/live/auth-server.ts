import { cookies } from "next/headers";
import { updateLastSeen } from "@/lib/live/db/participants";
import { getParticipantIdBySession, isAdminSessionValid } from "@/lib/live/db/sessions";
import { ADMIN_SESSION_COOKIE, PARTICIPANT_SESSION_COOKIE } from "./auth";

export async function getParticipantIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTICIPANT_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const participantId = await getParticipantIdBySession(token);
    if (!participantId) return null;

    await updateLastSeen(participantId);
    return participantId;
  } catch {
    return null;
  }
}

export async function isLiveAuthenticated(): Promise<boolean> {
  const participantId = await getParticipantIdFromSession();
  return participantId !== null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    return await isAdminSessionValid(token);
  } catch {
    return false;
  }
}
