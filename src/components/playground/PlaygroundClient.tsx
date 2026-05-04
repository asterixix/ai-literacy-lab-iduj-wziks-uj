"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  FileUp,
  Wallet,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatPanel } from "@/components/playground/ChatPanel";
import { FilesPanel } from "@/components/playground/FilesPanel";
import { CostsPanel } from "@/components/playground/CostsPanel";
import { UniversalAIPanel } from "@/components/playground/UniversalAIPanel";
import { SettingsPanel } from "@/components/playground/SettingsPanel";
import { ApiKeyGate } from "@/components/playground/ApiKeyGate";
import {
  type Conversation,
  type PlaygroundSettings,
  DEFAULT_SETTINGS,
  getApiKey,
  getConversations,
  getSettings,
  getActiveConversationId,
  setActiveConversationId,
  createConversation,
  deleteConversation,
  updateConversation,
  saveSettings,
} from "@/lib/playground-storage";

type Tab = "chat" | "files" | "costs" | "universal" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Czat", icon: <MessageSquare className="size-4" /> },
  { id: "files", label: "Pliki", icon: <FileUp className="size-4" /> },
  { id: "costs", label: "Koszty", icon: <Wallet className="size-4" /> },
  {
    id: "universal",
    label: "Universal AI",
    icon: <Sparkles className="size-4" />,
  },
  { id: "settings", label: "Ustawienia", icon: <Settings className="size-4" /> },
];

export function PlaygroundClient() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlaygroundSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydrate from LocalStorage
  useEffect(() => {
    const key = getApiKey();
    setApiKey(key || null);
    setConversations(getConversations());
    setSettings(getSettings());
    setActiveConvId(getActiveConversationId());
    setMounted(true);
  }, []);

  // ─── API Key ──────────────────────────────────────────────────────────────

  const handleApiKeySet = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  // ─── Conversations ────────────────────────────────────────────────────────

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;

  const handleNewConversation = useCallback(() => {
    const conv = createConversation(settings.model);
    setConversations(getConversations());
    setActiveConvId(conv.id);
    setActiveConversationId(conv.id);
    setActiveTab("chat");
  }, [settings.model]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConvId(id);
    setActiveConversationId(id);
    setActiveTab("chat");
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
      const updated = getConversations();
      setConversations(updated);
      if (activeConvId === id) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActiveConvId(nextId);
        setActiveConversationId(nextId);
      }
    },
    [activeConvId],
  );

  const handleUpdateConversation = useCallback((conv: Conversation) => {
    updateConversation(conv);
    setConversations(getConversations());
  }, []);

  // ─── Settings ─────────────────────────────────────────────────────────────

  const handleSettingsChange = useCallback((s: PlaygroundSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Ładowanie playground…</div>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeyGate onKeySet={handleApiKeySet} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`flex shrink-0 flex-col border-r border-border bg-card transition-all duration-200 ${
          sidebarOpen ? "w-64" : "w-14"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {sidebarOpen && (
            <span className="truncate text-sm font-semibold tracking-tight [font-family:var(--font-montserrat)]">
              Playground
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Zwiń panel" : "Rozwiń panel"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
        </div>

        {/* Tab navigation */}
        <nav className="flex flex-col gap-0.5 p-2">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              size="sm"
              className={`justify-start gap-2 ${!sidebarOpen ? "px-2" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              {tab.icon}
              {sidebarOpen && <span className="truncate">{tab.label}</span>}
            </Button>
          ))}
        </nav>

        <Separator />

        {/* Conversations list (only in chat tab) */}
        {activeTab === "chat" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2">
              {sidebarOpen && (
                <span className="text-xs font-medium text-muted-foreground">Rozmowy</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleNewConversation}
                aria-label="Nowa rozmowa"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                    conv.id === activeConvId
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <MessageSquare className="size-3.5 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 truncate">{conv.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        aria-label="Usuń rozmowę"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {conversations.length === 0 && sidebarOpen && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Brak rozmów. Utwórz nową.
                </p>
              )}
            </div>
          </div>
        )}

        {/* API key indicator */}
        <div className="mt-auto border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-2 ${!sidebarOpen ? "px-2" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <KeyRound className="size-3.5 shrink-0 text-emerald-500" />
            {sidebarOpen && (
              <span className="truncate text-xs text-muted-foreground">
                Klucz: ••••{apiKey.slice(-4)}
              </span>
            )}
          </Button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {activeTab === "chat" && (
          <ChatPanel
            apiKey={apiKey}
            conversation={activeConversation}
            settings={settings}
            onConversationUpdate={handleUpdateConversation}
            onNewConversation={handleNewConversation}
            onOpenSettings={() => setActiveTab("settings")}
          />
        )}
        {activeTab === "files" && <FilesPanel apiKey={apiKey} />}
        {activeTab === "costs" && <CostsPanel apiKey={apiKey} />}
        {activeTab === "universal" && <UniversalAIPanel apiKey={apiKey} />}
        {activeTab === "settings" && (
          <SettingsPanel
            apiKey={apiKey}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onApiKeyChange={setApiKey}
          />
        )}
      </main>
    </div>
  );
}
