/**
 * Eden AI API client — all calls go directly from the browser using the
 * user's own API key (stored in LocalStorage). No server-side proxy needed.
 */

const EDEN_BASE = "https://api.edenai.run/v3";
const EDEN_V2_BASE = "https://api.edenai.run/v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EdenModel {
  id: string;
  created: number;
  owned_by: string;
  model_name: string;
  object: string;
  context_length: number;
  description: string;
  source: string;
  capabilities: Record<string, unknown>;
  pricing: Record<string, unknown>;
  regions: { code: string; name: string }[];
}

export interface EdenModelsResponse {
  data: EdenModel[];
  object: "list";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  file_id?: string;
  /** Metadata attached after assistant response */
  meta?: ChatMessageMeta;
}

export interface ChatMessageMeta {
  /** The model that actually generated this response */
  model?: string;
  /** Token usage from the API response */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Cost in credits from the API response */
  cost?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  stream_options?: { include_usage: boolean };
  fallbacks?: string[];
  pre_hooks?: { action: string; params?: Record<string, unknown> }[];
  post_hooks?: { action: string; params?: Record<string, unknown> }[];
  n?: number;
  response_format?: { type: string };
  stop?: string[];
  seed?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Cost in credits returned by Eden AI */
  cost?: string;
}

export interface EdenFile {
  file_id: string;
  file_name: string;
  file_size: number;
  file_mimetype: string;
  purpose: string;
  created_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

export interface EdenFilesResponse {
  items: EdenFile[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface EdenCreditsResponse {
  credits: number;
  /** Internal flag: token has no permissions for the endpoint */
  _noPermissions?: boolean;
}

export interface EdenConsumptionEntry {
  total_cost: number;
  details: number;
  cost_per_provider: Record<string, number>;
}

export interface EdenConsumptionsResponse {
  response: {
    token: string;
    data: Record<string, Record<string, EdenConsumptionEntry>>;
  }[];
}

export interface UniversalAIRequest {
  model: string;
  input: Record<string, unknown>;
  fallbacks?: string[];
  provider_params?: Record<string, unknown>;
  show_original_response?: boolean;
}

export interface UniversalAIResponse {
  status: "success" | "fail";
  cost: string;
  provider: string;
  feature: string;
  subfeature: string;
  output: unknown;
  error?: { message?: string; code?: string };
  original_response?: unknown;
}

export interface EdenFeature {
  name: string;
  fullname: string;
  subfeatures: {
    name: string;
    fullname: string;
    mode: string;
    description: string;
    models: string[];
  }[];
  description: string;
}

export interface EdenFeaturesResponse {
  features: EdenFeature[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headers(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// ─── Models ───────────────────────────────────────────────────────────────────

export async function listModels(apiKey: string): Promise<EdenModelsResponse> {
  const res = await fetch(`${EDEN_BASE}/models`, {
    headers: headers(apiKey),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI listModels error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Chat Completions ─────────────────────────────────────────────────────────

/**
 * Remove client-side metadata from messages before sending to API.
 * The `meta` field is local-only; it's not part of the API request.
 */
function sanitizeMessagesForAPI(messages: ChatMessage[]): Array<Omit<ChatMessage, "meta">> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    ...(msg.file_id && { file_id: msg.file_id }),
  }));
}

export async function chatCompletion(
  apiKey: string,
  body: ChatCompletionRequest,
): Promise<ChatCompletionResponse> {
  const sanitized = { ...body, messages: sanitizeMessagesForAPI(body.messages) };
  const res = await fetch(`${EDEN_BASE}/chat/completions`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(sanitized),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI chat error ${res.status}: ${err}`);
  }
  return res.json();
}

/**
 * Stream chat completions. Returns a ReadableStream of SSE events.
 * Each chunk is a JSON object matching the OpenAI streaming format.
 */
export function chatCompletionStream(
  apiKey: string,
  body: ChatCompletionRequest,
): { signal: AbortController; stream: Promise<Response> } {
  const controller = new AbortController();
  const sanitized = { ...body, messages: sanitizeMessagesForAPI(body.messages) };
  return {
    signal: controller,
    stream: fetch(`${EDEN_BASE}/chat/completions`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ ...sanitized, stream: true }),
      signal: controller.signal,
    }),
  };
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function uploadFile(
  apiKey: string,
  file: File,
  purpose = "general",
  expiresInDays = 30,
): Promise<EdenFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);
  formData.append("expires_in_days", String(expiresInDays));

  const res = await fetch(`${EDEN_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI upload error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function listFiles(apiKey: string, page = 1, limit = 100): Promise<EdenFilesResponse> {
  const res = await fetch(`${EDEN_BASE}/upload?page=${page}&limit=${limit}`, {
    headers: headers(apiKey),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI listFiles error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function deleteFile(apiKey: string, fileId: string): Promise<void> {
  const res = await fetch(`${EDEN_BASE}/upload/${fileId}`, {
    method: "DELETE",
    headers: headers(apiKey),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI deleteFile error ${res.status}: ${err}`);
  }
}

// ─── Cost Monitoring ──────────────────────────────────────────────────────────

export interface TokenInfo {
  name: string;
  token: string | null;
  token_type: "sandbox_api_token" | "api_token";
  balance: number;
  active_balance: boolean;
  expire_time: string | null;
}

/**
 * Get credits. Falls back to token balance if the account-level endpoint
 * returns 403 (which happens with API tokens that lack admin permissions).
 * If all methods fail with 403, returns a special marker object.
 */
export async function getCredits(apiKey: string): Promise<EdenCreditsResponse> {
  // Try account-level credits first
  const res = await fetch(`${EDEN_V2_BASE}/cost_management/credits/`, {
    headers: headers(apiKey),
  });
  if (res.ok) {
    return res.json();
  }

  // If 403, fall back to token balance
  if (res.status === 403) {
    try {
      const tokenInfo = await listTokens(apiKey);
      // Find the current token's balance or sum all token balances
      const totalBalance = tokenInfo.reduce((sum, t) => sum + (t.balance ?? 0), 0);
      return { credits: totalBalance };
    } catch (fallbackErr) {
      // Both endpoints failed with 403 - token has no permissions
      // Return a marker that CostsPanel can detect
      if (
        fallbackErr instanceof Error &&
        (fallbackErr.message.includes("403") || fallbackErr.message.includes("listTokens error"))
      ) {
        return { credits: 0, _noPermissions: true };
      }
      throw fallbackErr;
    }
  }

  const err = await res.text();
  throw new Error(`Eden AI getCredits error ${res.status}: ${err}`);
}

/**
 * List API tokens — works with API keys and returns balance info.
 * Throws error if token has no permissions (403).
 */
export async function listTokens(apiKey: string): Promise<TokenInfo[]> {
  const res = await fetch(`${EDEN_V2_BASE}/user/custom_token/`, {
    headers: headers(apiKey),
  });
  if (res.ok) {
    return res.json();
  }

  // Throw error for 403 so caller can detect no permissions
  const err = await res.text();
  throw new Error(`Eden AI listTokens error ${res.status}: ${err}`);
}

export async function getConsumptions(
  apiKey: string,
  params: {
    begin: string;
    end: string;
    step?: number;
  },
): Promise<EdenConsumptionsResponse> {
  const qs = new URLSearchParams({
    begin: params.begin,
    end: params.end,
    step: String(params.step ?? 4),
  });
  const res = await fetch(`${EDEN_V2_BASE}/cost_management/?${qs}`, {
    headers: headers(apiKey),
  });
  if (res.ok) {
    return res.json();
  }

  const err = await res.text();
  throw new Error(`Eden AI getConsumptions error ${res.status}: ${err}`);
}

// ─── Universal AI ─────────────────────────────────────────────────────────────

export async function universalAI(
  apiKey: string,
  body: UniversalAIRequest,
): Promise<UniversalAIResponse> {
  const res = await fetch(`${EDEN_BASE}/universal-ai`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI universalAI error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Features (for Universal AI discovery) ────────────────────────────────────

export async function listFeatures(apiKey: string): Promise<EdenFeaturesResponse> {
  const res = await fetch(`${EDEN_BASE}/info`, {
    headers: headers(apiKey),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Eden AI listFeatures error ${res.status}: ${err}`);
  }
  return res.json();
}
