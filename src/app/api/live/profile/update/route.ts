import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { getParticipantById, updateParticipantProfile } from "@/lib/live/db/participants";
import { getUnlockedItemIds } from "@/lib/live/db/unlocked-items";

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participant = await getParticipantById(participantId);
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    nickname?: string;
    avatarSeed?: string;
    activeTheme?: string;
    activeFont?: string;
    activeTitle?: string;
    activeFrame?: string;
    activeAvatar?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Brak danych." }, { status: 400 });
  }

  const unlockedItems = new Set(await getUnlockedItemIds(participantId));

  if (body.activeTheme && !unlockedItems.has(body.activeTheme)) {
    return NextResponse.json({ error: "Motyw nieodblokowany." }, { status: 403 });
  }
  if (body.activeFont && !unlockedItems.has(body.activeFont)) {
    return NextResponse.json({ error: "Czcionka nieodblokowana." }, { status: 403 });
  }
  if (body.activeTitle && !unlockedItems.has(body.activeTitle)) {
    return NextResponse.json({ error: "Tytuł nieodblokowany." }, { status: 403 });
  }
  if (body.activeFrame && !unlockedItems.has(body.activeFrame)) {
    return NextResponse.json({ error: "Ramka nieodblokowana." }, { status: 403 });
  }
  if (body.activeAvatar && !unlockedItems.has(body.activeAvatar)) {
    return NextResponse.json({ error: "Avatar nieodblokowany." }, { status: 403 });
  }

  await updateParticipantProfile(participantId, {
    nickname: body.nickname,
    avatar_seed: body.avatarSeed,
    active_theme: body.activeTheme,
    active_font: body.activeFont,
    active_title: body.activeTitle,
    active_frame: body.activeFrame,
    active_avatar: body.activeAvatar,
  });

  return NextResponse.json({ success: true });
}
