/**
 * LocalStorage persistence for the Eden AI Playground.
 * All data stays on the user's device — nothing is sent to our server.
 */

import type { ChatMessage } from "./eden-ai";

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEY_API_KEY = "eden_playground_api_key";
const KEY_CONVERSATIONS = "eden_playground_conversations";
const KEY_SETTINGS = "eden_playground_settings";
const KEY_ACTIVE_CONV = "eden_playground_active_conversation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  systemPrompt?: string;
  /** Model parameters snapshot */
  params?: ChatModelParams;
}

export interface ChatModelParams {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export const DEFAULT_PARAMS: ChatModelParams = {
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export interface PlaygroundSettings {
  model: string;
  params: ChatModelParams;
  systemPrompt: string;
  preHooks: { action: string; params?: Record<string, unknown> }[];
  postHooks: { action: string; params?: Record<string, unknown> }[];
  fallbacks: string[];
}

export const DEFAULT_SETTINGS: PlaygroundSettings = {
  model: "openai/gpt-4o-mini",
  params: { ...DEFAULT_PARAMS },
  systemPrompt: "",
  preHooks: [],
  postHooks: [],
  fallbacks: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage full or unavailable — silently fail
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── API Key ──────────────────────────────────────────────────────────────────

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_API_KEY) ?? "";
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_API_KEY, key);
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_API_KEY);
}

// ─── Conversations ───────────────────────────────────────────────────────────

export function getConversations(): Conversation[] {
  return safeGet<Conversation[]>(KEY_CONVERSATIONS, []);
}

export function saveConversations(convs: Conversation[]): void {
  safeSet(KEY_CONVERSATIONS, convs);
}

export function createConversation(model?: string): Conversation {
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: uid(),
    title: "Nowa rozmowa",
    model: model ?? DEFAULT_SETTINGS.model,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const convs = getConversations();
  convs.unshift(conv);
  saveConversations(convs);
  return conv;
}

export function updateConversation(updated: Conversation): void {
  const convs = getConversations();
  const idx = convs.findIndex((c) => c.id === updated.id);
  if (idx >= 0) {
    convs[idx] = { ...updated, updatedAt: new Date().toISOString() };
  }
  saveConversations(convs);
}

export function deleteConversation(id: string): void {
  const convs = getConversations().filter((c) => c.id !== id);
  saveConversations(convs);
}

export function getActiveConversationId(): string | null {
  return safeGet<string | null>(KEY_ACTIVE_CONV, null);
}

export function setActiveConversationId(id: string | null): void {
  safeSet(KEY_ACTIVE_CONV, id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): PlaygroundSettings {
  return safeGet<PlaygroundSettings>(KEY_SETTINGS, { ...DEFAULT_SETTINGS });
}

export function saveSettings(settings: PlaygroundSettings): void {
  safeSet(KEY_SETTINGS, settings);
}
