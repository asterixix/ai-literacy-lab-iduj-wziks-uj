"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setApiKey } from "@/lib/playground-storage";

interface ApiKeyGateProps {
  onKeySet: (key: string) => void;
}

export function ApiKeyGate({ onKeySet }: ApiKeyGateProps) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Wpisz klucz API Eden AI.");
      return;
    }
    setApiKey(trimmed);
    onKeySet(trimmed);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-sm border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <KeyRound className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-bold tracking-tight [font-family:var(--font-montserrat)]">
            Eden AI Playground
          </h1>
          <p className="text-sm text-muted-foreground">
            Podaj swój klucz API Eden AI, aby korzystać z playground. Klucz jest przechowywany{" "}
            <strong>tylko lokalnie</strong> na Twoim urządzeniu i nigdy nie jest wysyłany na
            zewnątrz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="eden-api-key" className="text-sm font-medium">
              Klucz API
            </label>
            <div className="relative">
              <input
                id="eden-api-key"
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError("");
                }}
                placeholder="Wklej klucz API Eden AI…"
                className="w-full rounded-sm border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Ukryj klucz" : "Pokaż klucz"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <Button type="submit" className="w-full">
            Zapisz i rozpocznij
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Nie masz klucza?{" "}
          <a
            href="mailto:artur.sendyka@student.uj.edu.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Zgłoś się po klucz do prowadzącego.
          </a>
        </p>
      </div>
    </div>
  );
}
