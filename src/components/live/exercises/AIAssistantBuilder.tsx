"use client";

import { useCallback, useRef, useState } from "react";
import { estimateTokens as estimateAssistantTokens } from "@/lib/live/ai-assistant-points";
import {
  EDEN_MODELS,
  type EdenModel,
  formatCost,
  type GenerationParams,
  groupByProvider,
  TIER_LABELS,
} from "@/lib/live/eden-models";
import {
  buildRAGContext,
  getRAGStats,
  loadTextFile,
  type RAGDocument,
  validateFile,
} from "@/lib/live/rag-manager";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantResult {
  text: string | null;
  cost: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  error: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: EdenModel["tier"] }) {
  const colors: Record<EdenModel["tier"], string> = {
    free: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    cheap: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    mid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    premium: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-1.5 py-0.5 font-mono text-[10px] uppercase ${colors[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

function RAGUploadSection({
  documents,
  onDocumentsChange,
  onElementAdded,
}: {
  documents: RAGDocument[];
  onDocumentsChange: (docs: RAGDocument[]) => void;
  onElementAdded: (payload: { type: "rag"; charCount: number; label: string }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const stats = getRAGStats(documents);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        const validation = validateFile(file, stats.totalSize, stats.documentCount);
        if (!validation.valid) {
          setUploadError(validation.error ?? "Nieznany błąd");
          continue;
        }

        const doc = await loadTextFile(file);
        onDocumentsChange([...documents, doc]);
        onElementAdded({
          type: "rag",
          charCount: doc.content.length,
          label: doc.filename,
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">📄 RAG — Wgraj dokumenty TXT</h3>
        <span className="font-mono text-xs text-muted-foreground">
          {stats.documentCount} pliki • {stats.totalChunks} chunks
        </span>
      </div>

      {uploadError && <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={uploading}
        className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:border file:border-border file:rounded file:text-xs file:font-medium hover:file:bg-muted disabled:opacity-50"
      />

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.filename}
              className="flex items-center justify-between text-xs bg-muted p-2 rounded"
            >
              <div>
                <p className="font-medium">{doc.filename}</p>
                <p className="text-muted-foreground">
                  {doc.size} znaków • {doc.chunks.length} chunks
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onDocumentsChange(documents.filter((d) => d.filename !== doc.filename))
                }
                className="px-2 py-1 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded text-xs font-medium"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemPromptSection({
  systemPrompt,
  onPromptChange,
  onElementAdded,
}: {
  systemPrompt: string;
  onPromptChange: (prompt: string) => void;
  onElementAdded: (payload: { type: "system_prompt"; charCount: number; label: string }) => void;
}) {
  const [draft, setDraft] = useState(systemPrompt);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">📝 System Prompt — Instrukcje asystenta</h3>
        <span className="font-mono text-xs text-muted-foreground">{draft.length} znaków</span>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="# ROLA&#10;Jesteś asystentem badawczym...&#10;&#10;# KONTEKST&#10;Pomagasz studentom UJ...&#10;&#10;# ZASADY&#10;- Zadawaj pytania&#10;- Nie piszesz za studenta&#10;&#10;# FORMAT&#10;Odpowiedzi w Polsce, akapity"
        className="w-full min-h-32 p-3 border border-border rounded text-xs font-mono bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />

      <button
        type="button"
        onClick={() => {
          onPromptChange(draft);
          onElementAdded({
            type: "system_prompt",
            charCount: draft.trim().length,
            label: "System prompt",
          });
        }}
        className="w-full px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-xs font-medium transition-colors"
      >
        ✅ Zapisz system prompt
      </button>
    </div>
  );
}

function MCPServerSection({
  mcpServerUrl,
  onServerUrlChange,
  onElementAdded,
}: {
  mcpServerUrl: string;
  onServerUrlChange: (url: string) => void;
  onElementAdded: (payload: { type: "mcp"; charCount: number; label: string }) => void;
}) {
  const [draft, setDraft] = useState(mcpServerUrl);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">🔌 MCP Server (bez OAuth)</h3>
        <span className="font-mono text-xs text-muted-foreground">{draft.length} znaków</span>
      </div>

      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="http://localhost:3001/mcp (zdalny server bez OAuth)"
        className="w-full px-3 py-2 border border-border rounded text-xs font-mono bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        type="button"
        onClick={() => {
          onServerUrlChange(draft);
          onElementAdded({
            type: "mcp",
            charCount: draft.trim().length,
            label: draft.trim() || "MCP Server",
          });
        }}
        className="w-full px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-xs font-medium transition-colors"
      >
        ✅ Podpięć MCP Server
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIAssistantBuilder() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [mcpServerUrl, setMcpServerUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState<EdenModel | null>(null);

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistantResult, setAssistantResult] = useState<AssistantResult | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [selectorOpen, setSelectorOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const grouped = groupByProvider(EDEN_MODELS);
  const estimatedTokens = estimateTokens(userInput);
  const canSend =
    selectedModel &&
    systemPrompt.length > 0 &&
    userInput.trim().length > 0 &&
    !loading &&
    estimatedTokens <= 1000;

  const ragContext = buildRAGContext(userInput, documents);

  const trackElementAdded = useCallback(
    (payload: {
      type: "rag" | "system_prompt" | "mcp" | "model";
      charCount: number;
      label: string;
    }) => {
      const safeCharCount = Math.max(0, Math.floor(payload.charCount));
      if (safeCharCount <= 0) return;

      void fetch("/api/live/exercises/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: "asystent-badawczy",
          eventType: "assistant_element_added",
          elementType: payload.type,
          elementCharCount: safeCharCount,
          metadata: {
            elementType: payload.type,
            label: payload.label,
            charCount: safeCharCount,
          },
          dedupeKey: `${Date.now()}-${payload.type}-${Math.random().toString(36).slice(2, 8)}`,
          noDedup: true,
        }),
      });
    },
    [],
  );

  const sendMessage = useCallback(async () => {
    if (!canSend) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setLoading(true);
    setGlobalError(null);
    setAssistantResult(null);

    const newMessages: AssistantMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    if (!selectedModel) {
      setGlobalError("Wybierz model");
      setLoading(false);
      return;
    }

    try {
      // Build system prompt with RAG context
      let enhancedSystemPrompt = systemPrompt;
      if (ragContext.context) {
        enhancedSystemPrompt = `${systemPrompt}\n\n---\n\n${ragContext.context}`;
      }

      const inputTokensForThisMessage = estimateAssistantTokens(enhancedSystemPrompt + userMessage);

      const res = await fetch("/api/live/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedModel.provider,
          modelId: selectedModel.modelId,
          systemPrompt: enhancedSystemPrompt,
          messages: newMessages,
          mcpServerUrl: mcpServerUrl || undefined,
          params: {
            temperature: 0.7,
            top_p: 1.0,
            max_tokens: 1000,
          } as GenerationParams,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setGlobalError(data.error ?? `HTTP ${res.status}`);
        setMessages(newMessages.slice(0, -1));
        return;
      }

      const assistantMessage = data.text;
      const outputTokens = data.outputTokens ?? estimateTokens(assistantMessage);

      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);

      setAssistantResult({
        text: assistantMessage,
        cost: data.cost ?? null,
        inputTokens: data.inputTokens ?? inputTokensForThisMessage,
        outputTokens,
        latencyMs: data.latencyMs ?? 0,
        error: null,
      });

      // Log activity and silently award points like AI Playground
      void fetch("/api/live/exercises/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: "asystent-badawczy",
          eventType: "prompt_sent",
          inputTokensPerModel: [data.inputTokens ?? inputTokensForThisMessage],
          outputTokensPerModel: [outputTokens],
          customParamCount: 0,
          metadata: {
            model: selectedModel.displayName,
            ragDocuments: documents.length,
            systemPromptLength: systemPrompt.length,
            inputTokens: data.inputTokens ?? inputTokensForThisMessage,
            outputTokens,
          },
          dedupeKey: `${Date.now()}-assistant-${Math.random().toString(36).slice(2, 8)}`,
          noDedup: true,
        }),
      });

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setGlobalError(msg);
      setMessages(newMessages.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [
    canSend,
    userInput,
    selectedModel,
    systemPrompt,
    messages,
    documents,
    ragContext,
    mcpServerUrl,
  ]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel — Configuration */}
      <div className="lg:col-span-1 space-y-4">
        <RAGUploadSection
          documents={documents}
          onDocumentsChange={setDocuments}
          onElementAdded={trackElementAdded}
        />

        <SystemPromptSection
          systemPrompt={systemPrompt}
          onPromptChange={setSystemPrompt}
          onElementAdded={trackElementAdded}
        />

        <MCPServerSection
          mcpServerUrl={mcpServerUrl}
          onServerUrlChange={setMcpServerUrl}
          onElementAdded={trackElementAdded}
        />

        {/* Model selector */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">🤖 Model Eden AI</h3>
          <button
            type="button"
            onClick={() => setSelectorOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted rounded text-xs font-medium text-left transition-colors"
          >
            <span className="truncate">
              {selectedModel
                ? `${selectedModel.providerLabel} — ${selectedModel.displayName}`
                : "Wybierz model..."}
            </span>
            <span>{selectorOpen ? "▲" : "▼"}</span>
          </button>

          {selectorOpen && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(grouped).map(([provider, models]) => (
                <div key={provider}>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground px-2 py-1">
                    {provider}
                  </p>
                  {models.map((m) => (
                    <button
                      key={`${m.provider}-${m.modelId}`}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m);
                        setSelectorOpen(false);
                        trackElementAdded({
                          type: "model",
                          charCount: m.displayName.length,
                          label: m.displayName,
                        });
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                        selectedModel?.provider === m.provider &&
                        selectedModel?.modelId === m.modelId
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{m.displayName}</span>
                        <TierBadge tier={m.tier} />
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — Chat */}
      <div className="lg:col-span-2 flex flex-col gap-4 min-h-150">
        {/* Messages */}
        <div className="flex-1 border border-border rounded-lg p-4 space-y-3 overflow-y-auto bg-muted/30">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Nic tutaj nie ma. Wgraj dokumenty, napisz system prompt, wybierz model i zacznij
              rozmowę.
            </p>
          ) : (
            messages.map((msg) => {
              const msgId = `${msg.role}-${msg.content.substring(0, 50).replace(/\s+/g, "-")}`;
              return (
                <div
                  key={msgId}
                  className={`flex gap-3 text-xs ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-xs lg:max-w-md whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs animate-pulse">
                Asystent pisze...
              </div>
            </div>
          )}

          {globalError && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              ⚠️ {globalError}
            </p>
          )}

          {assistantResult && (
            <div className="text-xs bg-muted/50 border border-border rounded-lg p-3 space-y-2 mt-2">
              <div className="flex justify-between text-muted-foreground font-mono">
                <span>⏱️ {assistantResult.latencyMs}ms</span>
                {assistantResult.inputTokens && <span>⬇️ In: {assistantResult.inputTokens}t</span>}
                {assistantResult.outputTokens && (
                  <span>⬆️ Out: {assistantResult.outputTokens}t</span>
                )}
                {assistantResult.cost && (
                  <span className="text-primary">{formatCost(assistantResult.cost)}</span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="space-y-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Wpisz wiadomość dla asystenta (Ctrl+Enter)"
            disabled={!canSend || loading}
            className="w-full h-20 p-3 border border-border rounded text-xs font-mono bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!canSend || loading}
            className={`w-full px-4 py-2 rounded text-xs font-medium transition-colors ${
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {loading ? "Wysyłam..." : `Wyślij (${estimatedTokens}t)`}
          </button>
        </div>
      </div>
    </div>
  );
}
