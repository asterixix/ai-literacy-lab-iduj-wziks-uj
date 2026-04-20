import { type NextRequest, NextResponse } from "next/server";

import { requireParticipantIdFromApi } from "@/lib/live/api-auth";
import { decryptSecret } from "@/lib/live/crypto";
import { getEdenApiKey } from "@/lib/live/db/eden-keys";
import type { GenerationParams } from "@/lib/live/eden-models";

const EDEN_BASE = "https://api.edenai.run/v2/text/chat";
const MAX_TOKENS = 4000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantRequestBody {
  provider: string;
  modelId: string | null;
  systemPrompt: string;
  messages: ChatMessage[];
  mcpServerUrl?: string;
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

  let body: AssistantRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { provider, modelId, systemPrompt, messages, mcpServerUrl, params } = body;

  if (!provider || typeof provider !== "string") {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 });
  }

  if (!systemPrompt || typeof systemPrompt !== "string" || systemPrompt.trim().length === 0) {
    return NextResponse.json({ error: "System prompt cannot be empty." }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages cannot be empty." }, { status: 400 });
  }

  // Validate MCP Server URL if provided
  if (mcpServerUrl) {
    try {
      const url = new URL(mcpServerUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        return NextResponse.json(
          { error: "MCP Server URL must use HTTP or HTTPS." },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json({ error: "MCP Server URL is invalid." }, { status: 400 });
    }
  }

  // Convert messages to Eden AI format
  const previousHistory = messages.slice(0, -1).map((m) => ({
    role: m.role,
    message: m.content,
  }));

  const currentMessage = messages[messages.length - 1]?.content;
  if (!currentMessage) {
    return NextResponse.json({ error: "Last message is required." }, { status: 400 });
  }

  // Build Eden AI request
  const edenRequestBody: Record<string, unknown> = {
    providers: provider,
    text: currentMessage,
    previous_history: previousHistory,
    chatbot_global_action: systemPrompt,
    temperature: params?.temperature ?? 0.7,
    max_tokens: Math.min(params?.max_tokens ?? 1000, MAX_TOKENS),
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

  // Add model ID to settings if provided
  const settings: Record<string, unknown> = {};
  if (modelId && modelId.trim().length > 0) {
    settings[provider] = modelId.trim();
    edenRequestBody.settings = settings;
  }

  // Note: MCP Server integration would go here
  // For now, we'll log it for educational purposes
  if (mcpServerUrl) {
    console.log(`[AIAssistant] MCP Server configured: ${mcpServerUrl}`);
    // In a production system, you would:
    // 1. Connect to the MCP server at mcpServerUrl
    // 2. Load available tools from the server
    // 3. Include tools in the request to Eden AI
    // 4. Process tool calls in the response
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
    });

    const latencyMs = Date.now() - startMs;

    if (!edenRes.ok) {
      let errorMsg = `Eden AI error: ${edenRes.status}`;
      try {
        const errorData = await edenRes.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        const text = await edenRes.text();
        errorMsg = text || errorMsg;
      }
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    edenData = await edenRes.json();

    if (!edenData.success || !edenData.result) {
      const errorMsg = edenData.error || "Eden AI returned empty result";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Parse response from first provider
    const resultEntry = Object.entries(edenData.result).find(([_, value]: [string, unknown]) => {
      return value && typeof value === "object" && "generated_text" in value;
    });

    if (!resultEntry) {
      return NextResponse.json({ error: "No response from provider" }, { status: 400 });
    }

    const [_, resultValue] = resultEntry;
    const result = resultValue as Record<string, unknown>;
    const text = result.generated_text as string;

    // Extract token usage if available
    const inputTokens = (result.input_tokens as number) || Math.ceil(currentMessage.length / 3.5);
    const outputTokens = (result.output_tokens as number) || Math.ceil(text.length / 3.5);
    const cost = (result.cost as number) || null;

    return NextResponse.json({
      text,
      inputTokens,
      outputTokens,
      cost,
      latencyMs,
      provider,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[AIAssistant]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
