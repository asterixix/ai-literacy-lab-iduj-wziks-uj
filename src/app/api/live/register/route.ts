import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PARTICIPANT_SESSION_COOKIE } from "@/lib/live/auth";
import { ensureLiveSchema } from "@/lib/live/db/bootstrap";
import { createParticipant } from "@/lib/live/db/participants";
import { createParticipantSession } from "@/lib/live/db/sessions";
import { ensureWorkshopExists } from "@/lib/live/db/workshops";
import { ensureDefaultUnlocks } from "@/lib/live/rewards";
import {
  buildDiceBearAvatarUrl,
  generateAvatarSeed,
  generateFavoriteAnimal,
  generateNickname,
  generateParticipantId,
  generateReadablePassword,
  generateSessionToken,
} from "@/lib/live/security";

const SESSION_MAX_AGE = 60 * 60 * 8;

export async function POST(request: Request) {
  try {
    const livePassword = process.env.LIVE_PASSWORD;
    if (!livePassword) {
      return NextResponse.json({ error: "LIVE_PASSWORD is not configured." }, { status: 500 });
    }

    const body = (await request.json().catch(() => null)) as { workshopPassword?: string } | null;
    if (!body?.workshopPassword || body.workshopPassword !== livePassword) {
      return NextResponse.json({ error: "Nieprawidłowe hasło warsztatu." }, { status: 401 });
    }

    await ensureLiveSchema();
    const workshop = await ensureWorkshopExists();
    const participantId = generateParticipantId();
    const generatedPassword = generateReadablePassword();
    const passwordHash = await bcrypt.hash(generatedPassword, 10);
    const avatarSeed = generateAvatarSeed();

    await createParticipant({
      id: participantId,
      workshop_id: workshop.id,
      nickname: generateNickname(),
      avatar_seed: avatarSeed,
      favorite_animal: generateFavoriteAnimal(),
      password_hash: passwordHash,
    });
    await ensureDefaultUnlocks(participantId);

    const sessionToken = generateSessionToken();
    await createParticipantSession(participantId, sessionToken);

    const cookieStore = await cookies();
    cookieStore.set(PARTICIPANT_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({
      participantId,
      generatedPassword,
      avatarUrl: buildDiceBearAvatarUrl(avatarSeed, "avatar-default"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Register failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
