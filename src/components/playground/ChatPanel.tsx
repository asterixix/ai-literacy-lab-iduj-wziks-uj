"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Square, Settings2, ChevronDown, Coins, Hash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listModels,
  chatCompletionStream,
  chatCompletion,
  type ChatMessage,
  type ChatMessageMeta,
  type ChatCompletionRequest,
} from "@/lib/eden-ai";
import {
  type Conversation,
  type PlaygroundSettings,
  DEFAULT_PARAMS,
} from "@/lib/playground-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  apiKey: string;
  conversation: Conversation | null;
  settings: PlaygroundSettings;
  onConversationUpdate: (conv: Conversation) => void;
  onNewConversation: () => void;
  onOpenSettings?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTokens(n: number | undefined): string {
  if (n === undefined) return "—";
  return n.toLocaleString("pl-PL");
}

function formatCost(cost: string | undefined): string {
  if (!cost) return "";
  const isEstimated = cost.trim().startsWith("~");
  const num = parseFloat(cost.replace(/^~+/, ""));
  if (isNaN(num)) return cost;
  const formatted = num < 0.01 ? `$${num.toFixed(4)}` : `$${num.toFixed(2)}`;
  return isEstimated ? `~${formatted}` : formatted;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function extractPricingRates(pricing: Record<string, unknown>): {
  inputPer1M: number | null;
  outputPer1M: number | null;
} {
  const toRate = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed < 0.01 ? parsed * 1_000_000 : parsed;
  };

  const inputCost =
    pricing.prompt ||
    pricing.input ||
    pricing.input_cost_per_token ||
    pricing.prompt_cost_per_token;

  const outputCost =
    pricing.completion ||
    pricing.output ||
    pricing.output_cost_per_token ||
    pricing.completion_cost_per_token;

  return {
    inputPer1M: toRate(inputCost),
    outputPer1M: toRate(outputCost),
  };
}

const FILE_ID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractFileId(text: string): string | undefined {
  return text.match(FILE_ID_PATTERN)?.[0];
}

function splitThinkingBlocks(content: string): Array<{ kind: "text" | "think"; text: string }> {
  const blocks: Array<{ kind: "text" | "think"; text: string }> = [];
  const thinkBlockRegex = /<think>([\s\S]*?)<\/think>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = thinkBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ kind: "text", text: content.slice(lastIndex, match.index) });
    }
    blocks.push({ kind: "think", text: match[1] ?? "" });
    lastIndex = thinkBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ kind: "text", text: content.slice(lastIndex) });
  }

  return blocks;
}

function renderAssistantContent(content: string): React.ReactNode {
  const blocks = splitThinkingBlocks(content);

  if (blocks.length === 0) {
    return <div className="whitespace-pre-wrap wrap-break-word">{content}</div>;
  }

  return blocks.map((block, index) => {
    if (block.kind === "think") {
      return (
        <details
          key={`think-${index}`}
          className="my-2 rounded-sm border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground"
        >
          <summary className="cursor-pointer select-none text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Rozumowanie
          </summary>
          <div className="mt-2 whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-muted-foreground">
            {block.text.trim() || "(puste)"}
          </div>
        </details>
      );
    }

    return (
      <span key={`text-${index}`} className="whitespace-pre-wrap wrap-break-word">
        {block.text}
      </span>
    );
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ChatPanel({
  apiKey,
  conversation,
  settings,
  onConversationUpdate,
  onNewConversation,
  onOpenSettings,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [stopFeedback, setStopFeedback] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Close context menu on outside click
  useEffect(() => {
    if (openMenuIdx === null) return;
    const handler = () => setOpenMenuIdx(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenuIdx]);

  // ─── Send message ────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversation || isStreaming) return;

    setStreamError(null);
    setStopFeedback(null);

    const fileId = extractFileId(text);

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      ...(fileId && { file_id: fileId }),
    };
    const existingMessages = conversation.messages ?? [];
    const allMessages: ChatMessage[] = [];

    if (settings.systemPrompt) {
      allMessages.push({ role: "system", content: settings.systemPrompt });
    }
    if (fileId) {
      allMessages.push({
        role: "system",
        content: `Wiadomość użytkownika zawiera załącznik o file_id ${fileId}. Użyj jego treści jako kontekstu odpowiedzi i nie odsyłaj użytkownika do ponownego przesyłania pliku, jeśli masz do niego dostęp.`,
      });
    }
    allMessages.push(...existingMessages);
    allMessages.push(userMessage);

    let pricingRates = { inputPer1M: null as number | null, outputPer1M: null as number | null };
    try {
      const models = await listModels(apiKey);
      const currentModel = models.data.find((model) => model.id === settings.model);
      pricingRates = extractPricingRates(currentModel?.pricing ?? {});
    } catch {
      pricingRates = { inputPer1M: null, outputPer1M: null };
    }

    const promptTokensEstimate = estimateTokens(allMessages.map((message) => message.content).join("\n\n"));

    const updatedConv: Conversation = {
      ...conversation,
      messages: [...existingMessages, userMessage],
      updatedAt: new Date().toISOString(),
      title:
        existingMessages.length === 0
          ? text.slice(0, 60) + (text.length > 60 ? "…" : "")
          : conversation.title,
    };
    onConversationUpdate(updatedConv);
    setInput("");

    setIsStreaming(true);

    const requestBody: ChatCompletionRequest = {
      model: settings.model,
      messages: allMessages,
      temperature: settings.params.temperature,
      max_tokens: settings.params.max_tokens,
      top_p: settings.params.top_p,
      frequency_penalty: settings.params.frequency_penalty,
      presence_penalty: settings.params.presence_penalty,
      stream: true,
      stream_options: { include_usage: true },
      fallbacks: settings.fallbacks.length > 0 ? settings.fallbacks : undefined,
      pre_hooks: settings.preHooks.length > 0 ? settings.preHooks : undefined,
      post_hooks: settings.postHooks.length > 0 ? settings.postHooks : undefined,
    };

    let accumulated = "";

    try {
      const { signal, stream: streamPromise } = chatCompletionStream(apiKey, requestBody);
      abortRef.current = signal;

      const response = await streamPromise;
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Błąd API (${response.status}): ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Brak strumienia odpowiedzi");

      const decoder = new TextDecoder();
      let usageData: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
      let costData: string | undefined;
      let modelUsed: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              const finalMessages = [
                ...updatedConv.messages,
                { role: "assistant" as const, content: accumulated },
              ];
              onConversationUpdate({
                ...updatedConv,
                messages: finalMessages,
              });
            }

            // Usage data (sent in final chunk when stream_options.include_usage=true)
            if (parsed.usage) {
              usageData = parsed.usage;
            }
            if (parsed.cost !== undefined) {
              costData = String(parsed.cost);
            }
            if (parsed.model) {
              modelUsed = parsed.model;
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      // Build metadata
      const meta: ChatMessageMeta = {};
      if (modelUsed) meta.model = modelUsed;
      if (usageData) meta.usage = usageData;
      if (costData) meta.cost = costData;

      // Final update with complete content + metadata
      if (!accumulated) {
        const fallbackRes = await chatCompletion(apiKey, {
          ...requestBody,
          stream: false,
        });
        const content = fallbackRes.choices?.[0]?.message?.content ?? "(brak odpowiedzi)";
        const fallbackMeta: ChatMessageMeta = {};
        if (fallbackRes.model) fallbackMeta.model = fallbackRes.model;
        if (fallbackRes.usage) fallbackMeta.usage = fallbackRes.usage;
        if (fallbackRes.cost) fallbackMeta.cost = fallbackRes.cost;

        onConversationUpdate({
          ...updatedConv,
          messages: [...updatedConv.messages, { role: "assistant", content, meta: fallbackMeta }],
        });
      } else {
        onConversationUpdate({
          ...updatedConv,
          messages: [...updatedConv.messages, { role: "assistant", content: accumulated, meta }],
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      if (message.includes("abort") || message.includes("cancel")) {
        const completionTokensEstimate = estimateTokens(accumulated);
        const estimatedCostValue =
          (pricingRates.inputPer1M !== null ? (promptTokensEstimate * pricingRates.inputPer1M) / 1_000_000 : 0) +
          (pricingRates.outputPer1M !== null ? (completionTokensEstimate * pricingRates.outputPer1M) / 1_000_000 : 0);

        const stopMessage =
          estimatedCostValue > 0
            ? `Zatrzymano generowanie. Szacunkowy koszt do tego momentu: ~${estimatedCostValue.toFixed(4)} USD.`
            : "Zatrzymano generowanie. Nie udało się wyliczyć kosztu, bo brak danych o cenach modelu.";

        setStopFeedback(stopMessage);

        const finalMessages = [...updatedConv.messages];
        const lastMessageIndex = finalMessages.length - 1;
        if (lastMessageIndex >= 0 && finalMessages[lastMessageIndex].role === "assistant") {
          finalMessages[lastMessageIndex] = {
            ...finalMessages[lastMessageIndex],
            meta:
              estimatedCostValue > 0
                ? {
                    ...(finalMessages[lastMessageIndex].meta ?? {}),
                    cost: `~${estimatedCostValue.toFixed(4)}`,
                  }
                : finalMessages[lastMessageIndex].meta,
          };

          onConversationUpdate({
            ...updatedConv,
            messages: finalMessages,
          });
        }
      } else {
        setStreamError(message);
        onConversationUpdate(updatedConv);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, conversation, settings, apiKey, isStreaming, onConversationUpdate]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ─── Empty state ─────────────────────────────────────────────────────────

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">
          Utwórz nową rozmowę, aby rozpocząć czat z modelami AI.
        </p>
        <Button onClick={onNewConversation}>Nowa rozmowa</Button>
      </div>
    );
  }

  const messages = conversation.messages ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <h2 className="flex-1 truncate text-sm font-medium">{conversation.title}</h2>
        <Badge variant="outline" className="shrink-0 text-xs">
          {settings.model}
        </Badge>
        {onOpenSettings && (
          <Button variant="ghost" size="icon" className="size-7" onClick={onOpenSettings} aria-label="Ustawienia modelu">
            <Settings2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">Rozpocznij rozmowę z modelem AI.</p>
              <p className="text-xs text-muted-foreground">Użyj Shift+Enter dla nowej linii.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] ${msg.role === "assistant" ? "w-full" : ""}`}>
              <div
                className={`rounded-sm px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "assistant" &&
                msg.content === "" &&
                isStreaming &&
                i === messages.length - 1 ? (
                  <span className="inline-block animate-pulse">▌</span>
                ) : (
                  msg.role === "assistant" ? (
                    renderAssistantContent(msg.content)
                  ) : (
                    <div className="whitespace-pre-wrap wrap-break-word">{msg.content}</div>
                  )
                )}
              </div>

              {msg.role === "user" && msg.file_id && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1 text-[11px] text-muted-foreground">
                  <span className="rounded-sm border border-border bg-muted px-2 py-0.5">
                    Załącznik: {msg.file_id}
                  </span>
                </div>
              )}

              {/* ── Message metadata (assistant only) ────────────────────── */}
              {msg.role === "assistant" && msg.meta && msg.content && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-muted-foreground">
                  {msg.meta.model && (
                    <span className="flex items-center gap-1">
                      <Hash className="size-3" />
                      {msg.meta.model}
                    </span>
                  )}
                  {msg.meta.usage && (
                    <span>
                      {formatTokens(msg.meta.usage.prompt_tokens)} wej. → {formatTokens(msg.meta.usage.completion_tokens)} wyj.
                    </span>
                  )}
                  {msg.meta.cost && (
                    <span className="flex items-center gap-1">
                      <Coins className="size-3" />
                      {formatCost(msg.meta.cost)}
                    </span>
                  )}
                </div>
              )}

              {/* ── Context menu toggle (user messages) ──────────────────── */}
              {msg.role === "user" && (
                <div className="mt-1 flex justify-end">
                  <button
                    className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 [&:hover]:opacity-100 focus:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIdx(openMenuIdx === i ? null : i);
                    }}
                    aria-label="Opcje wiadomości"
                  >
                    <Settings2 className="size-3" />
                    <ChevronDown className="size-2.5" />
                  </button>
                </div>
              )}

              {/* ── Context menu dropdown ──────────────────────────────────── */}
              {msg.role === "user" && openMenuIdx === i && (
                <div className="relative flex justify-end">
                  <div className="absolute right-0 top-0 z-10 min-w-50 rounded-sm border border-border bg-card p-1 shadow-md">
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                      onClick={() => {
                        onOpenSettings?.();
                        setOpenMenuIdx(null);
                      }}
                    >
                      <Settings2 className="size-3.5" />
                      Zmień model / parametry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {streamError && (
          <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {streamError}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napisz wiadomość…"
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
          />
          {isStreaming ? (
            <Button variant="outline" size="icon" onClick={handleStop} aria-label="Zatrzymaj">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} aria-label="Wyślij">
              <Send className="size-4" />
            </Button>
          )}
        </div>
        {stopFeedback && (
          <div className="mt-2 rounded-sm border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            {stopFeedback}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {settings.params.temperature !== DEFAULT_PARAMS.temperature &&
              `T=${settings.params.temperature}`}
          </span>
          <span>
            {settings.params.max_tokens !== DEFAULT_PARAMS.max_tokens &&
              `max=${settings.params.max_tokens}`}
          </span>
          {settings.systemPrompt && <span>System prompt ✓</span>}
          {settings.fallbacks.length > 0 && (
            <span>Fallbacks: {settings.fallbacks.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}
