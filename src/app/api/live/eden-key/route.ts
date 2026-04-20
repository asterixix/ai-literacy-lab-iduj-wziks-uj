import { NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { decryptSecret, encryptSecret } from "@/lib/live/crypto";
import { deleteEdenApiKey, getEdenApiKey, upsertEdenApiKey } from "@/lib/live/db/eden-keys";

export async function GET() {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await getEdenApiKey(participantId);
  return NextResponse.json({ configured: Boolean(record) });
}

export async function POST(request: Request) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { apiKey?: string } | null;
  if (!body?.apiKey || body.apiKey.trim().length < 10) {
    return NextResponse.json({ error: "Niepoprawny klucz API." }, { status: 400 });
  }

  const encrypted = encryptSecret(body.apiKey.trim());
  await upsertEdenApiKey({
    participantId,
    encryptedKey: encrypted.encryptedKey,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  });

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE() {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteEdenApiKey(participantId);

  return NextResponse.json({ success: true });
}

export async function PATCH() {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await getEdenApiKey(participantId);
  if (!record) {
    return NextResponse.json({ keyPreview: null });
  }

  const decrypted = decryptSecret({
    encryptedKey: record.encrypted_key,
    iv: record.iv,
    authTag: record.auth_tag,
  });

  const keyPreview =
    decrypted.length >= 8 ? `${decrypted.slice(0, 4)}...${decrypted.slice(-4)}` : "***";
  return NextResponse.json({ keyPreview });
}
