import { type NextRequest, NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { decryptSecret } from "@/lib/live/crypto";
import { getEdenApiKey } from "@/lib/live/db/eden-keys";
import type { GenerationParams } from "@/lib/live/eden-models";

const EDEN_BASE = "https://api.edenai.run/v2/text/chat";
const MAX_TOKENS = 4000;
const MAX_PROVIDERS = 4;

interface ChatRequestBody {
  providers: string[];
  settings: Record<string, string | { model: string }>;
  prompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  params?: GenerationParams;
}

export async function POST(request: NextRequest) {
  const participantId = await requireParticipantIdFromApi();
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyRecord = await getEdenApiKey(participantId);
  if (!keyRecord) {
    return NextResponse.json(
      { error: "Najpierw dodaj swój klucz Eden AI w profilu." },
      { status: 400 },
    );
  }

  const apiKey = decryptSecret({
    encryptedKey: keyRecord.encrypted_key,
    iv: keyRecord.iv,
    authTag: keyRecord.auth_tag,
  });

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { providers, settings, prompt, history, params } = body;

  if (!Array.isArray(providers) || providers.length === 0 || providers.length > MAX_PROVIDERS) {
    return NextResponse.json(
      { error: `Select between 1 and ${MAX_PROVIDERS} providers.` },
      { status: 400 },
    );
  }
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
  }

  const previousHistory = (history ?? []).map((m) => ({
    role: m.role,
    message: m.content,
  }));

  const normalizedSettings = Object.fromEntries(
    Object.entries(settings ?? {}).flatMap(([provider, value]) => {
      if (typeof value === "string" && value.trim().length > 0) {
        return [[provider, value.trim()]];
      }

      if (
        value &&
        typeof value === "object" &&
        typeof value.model === "string" &&
        value.model.trim().length > 0
      ) {
        return [[provider, value.model.trim()]];
      }

      return [];
    }),
  );

  // Build request body with optional parameters
  const edenRequestBody: Record<string, unknown> = {
    providers: providers.join(","),
    text: prompt.trim(),
    previous_history: previousHistory,
    chatbot_global_action: "You are a helpful assistant.",
    temperature: params?.temperature ?? 0.7,
    max_tokens: Math.min(params?.max_tokens ?? 2000, MAX_TOKENS),
    settings: normalizedSettings,
  };

  // Add optional parameters if provided
  if (params?.top_p !== undefined && params.top_p !== null) {
    edenRequestBody.top_p = Math.max(0, Math.min(1, params.top_p));
  }
  if (params?.top_k !== undefined && params.top_k !== null) {
    edenRequestBody.top_k = Math.max(1, params.top_k);
  }
  if (params?.frequency_penalty !== undefined && params.frequency_penalty !== null) {
    edenRequestBody.frequency_penalty = params.frequency_penalty;
  }
  if (params?.presence_penalty !== undefined && params.presence_penalty !== null) {
    edenRequestBody.presence_penalty = params.presence_penalty;
  }

  let edenData: Record<string, unknown>;
  try {
    const startMs = Date.now();
    const edenRes = await fetch(EDEN_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(edenRequestBody),
      signal: AbortSignal.timeout(60_000),
    });

    if (!edenRes.ok) {
      const errText = await edenRes.text();
      return NextResponse.json(
        { error: `Eden AI error: ${edenRes.status} — ${errText}` },
        { status: 502 },
      );
    }

    edenData = await edenRes.json();
    const latencyMs = Date.now() - startMs;

    // Normalise per-provider response
    const results: Record<
      string,
      {
        text: string | null;
        cost: number | null;
        inputTokens: number | null;
        outputTokens: number | null;
        latencyMs: number;
        error: string | null;
      }
    > = {};

    for (const provider of providers) {
      const raw = edenData[provider] as Record<string, unknown> | undefined;
      if (!raw) {
        results[provider] = {
          text: null,
          cost: null,
          inputTokens: null,
          outputTokens: null,
          latencyMs,
          error: "No response from provider.",
        };
        continue;
      }
      if ((raw.status as string) === "fail") {
        const errMsg = (raw.error as Record<string, string>)?.message ?? "Provider error.";
        results[provider] = {
          text: null,
          cost: null,
          inputTokens: null,
          outputTokens: null,
          latencyMs,
          error: errMsg,
        };
        continue;
      }
      const usage = raw.usage as Record<string, number> | undefined;
      results[provider] = {
        text: (raw.generated_text as string) ?? null,
        cost: typeof raw.cost === "number" ? raw.cost : null,
        inputTokens: usage?.prompt_tokens ?? null,
        outputTokens: usage?.completion_tokens ?? null,
        latencyMs,
        error: null,
      };
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Request failed: ${message}` }, { status: 500 });
  }
}
