"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, AlertCircle, Copy, Check, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { universalAI, uploadFile, type UniversalAIResponse } from "@/lib/eden-ai";
import { getUploadedFile, saveUploadedFile } from "@/lib/uploaded-files";

// ─── Feature definitions ──────────────────────────────────────────────────────

interface FeatureDef {
  id: string;
  label: string;
  description: string;
  modelFormat: string;
  inputFields: InputField[];
}

interface InputField {
  key: string;
  label: string;
  type: "text" | "textarea" | "file_id";
  placeholder: string;
  required: boolean;
}

const FEATURES: FeatureDef[] = [
  {
    id: "ai_detection",
    label: "Wykrywanie AI",
    description: "Sprawdź, czy tekst został wygenerowany przez AI",
    modelFormat: "text/ai_detection",
    inputFields: [
      {
        key: "text",
        label: "Tekst do analizy",
        type: "textarea",
        placeholder: "Wklej tekst do sprawdzenia…",
        required: true,
      },
    ],
  },
  {
    id: "moderation",
    label: "Moderacja tekstu",
    description: "Analizuj treść pod kątem nieodpowiednich materiałów",
    modelFormat: "text/moderation",
    inputFields: [
      {
        key: "text",
        label: "Tekst do moderacji",
        type: "textarea",
        placeholder: "Wklej tekst do moderacji…",
        required: true,
      },
    ],
  },
  {
    id: "sentiment_analysis",
    label: "Analiza sentymentu",
    description: "Określ wydźwięk emocjonalny tekstu",
    modelFormat: "text/sentiment_analysis",
    inputFields: [
      {
        key: "text",
        label: "Tekst do analizy",
        type: "textarea",
        placeholder: "Wklej tekst do analizy sentymentu…",
        required: true,
      },
    ],
  },
  {
    id: "summarization",
    label: "Podsumowanie",
    description: "Stwórz zwięzłe podsumowanie tekstu",
    modelFormat: "text/summarization",
    inputFields: [
      {
        key: "text",
        label: "Tekst do podsumowania",
        type: "textarea",
        placeholder: "Wklej tekst do podsumowania…",
        required: true,
      },
    ],
  },
  {
    id: "ocr",
    label: "OCR",
    description: "Rozpoznaj tekst z obrazu/dokumentu",
    modelFormat: "ocr/ocr",
    inputFields: [
      {
        key: "file",
        label: "ID pliku (z zakładki Pliki)",
        type: "file_id",
        placeholder: "np. 550e8400-e29b-41d4-a716-446655440000",
        required: true,
      },
      {
        key: "language",
        label: "Język (opcjonalnie)",
        type: "text",
        placeholder: "np. pl, en",
        required: false,
      },
    ],
  },
  {
    id: "image_generation",
    label: "Generowanie obrazów",
    description: "Wygeneruj obraz na podstawie opisu tekstowego",
    modelFormat: "image/generation",
    inputFields: [
      {
        key: "text",
        label: "Opis obrazu (prompt)",
        type: "textarea",
        placeholder: "Opisz obraz do wygenerowania…",
        required: true,
      },
      {
        key: "resolution",
        label: "Rozdzielczość",
        type: "text",
        placeholder: "np. 512x512, 1024x1024",
        required: false,
      },
    ],
  },
];

const PROVIDERS: Record<string, string[]> = {
  ai_detection: ["openai", "google", "microsoft"],
  moderation: ["openai", "google", "microsoft"],
  sentiment_analysis: ["openai", "google", "ibm"],
  summarization: ["openai", "google", "microsoft"],
  ocr: ["google", "amazon", "microsoft"],
  image_generation: ["openai", "stabilityai", "google"],
};

interface UniversalAIPanelProps {
  apiKey: string;
  ocrAttachmentFileId?: string | null;
  selectedFeatureId?: string | null;
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

export function UniversalAIPanel({ apiKey, ocrAttachmentFileId, selectedFeatureId }: UniversalAIPanelProps) {
  const [selectedFeature, setSelectedFeature] = useState<string>("ai_detection");
  const [provider, setProvider] = useState<string>("openai");
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<UniversalAIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feature = FEATURES.find((f) => f.id === selectedFeature)!;
  const providers = PROVIDERS[selectedFeature] ?? ["openai"];

  useEffect(() => {
    if (selectedFeatureId && FEATURES.some((featureDef) => featureDef.id === selectedFeatureId)) {
      setSelectedFeature(selectedFeatureId);
      setProvider(PROVIDERS[selectedFeatureId]?.[0] ?? "openai");
      setResult(null);
      setError(null);
    }
  }, [selectedFeatureId]);

  useEffect(() => {
    if (ocrAttachmentFileId && selectedFeature === "ocr") {
      setInputValues((prev) => ({ ...prev, file: ocrAttachmentFileId }));
    }
  }, [ocrAttachmentFileId, selectedFeature]);

  const handleFeatureChange = useCallback((id: string) => {
    setSelectedFeature(id);
    const provs = PROVIDERS[id] ?? ["openai"];
    setProvider(provs[0]);
    setInputValues({});
    setResult(null);
    setError(null);
  }, []);

  const handleUploadForOcr = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);
      try {
        const uploaded = await uploadFile(apiKey, file);
        try {
          await saveUploadedFile(uploaded.file_id, file);
        } catch {
          // Best-effort cache
        }
        setInputValues((prev) => ({
          ...prev,
          file: uploaded.file_id,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się wgrać pliku");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [apiKey],
  );

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const model = `${feature.modelFormat}/${provider}`;
      const input: Record<string, unknown> = {};
      for (const field of feature.inputFields) {
        const val = inputValues[field.key]?.trim();
        if (field.required && !val) {
          setError(`Pole "${field.label}" jest wymagane.`);
          setLoading(false);
          return;
        }
        if (val) input[field.key] = val;
      }

      if (selectedFeature === "ocr") {
        const fileValue = inputValues.file?.trim();
        if (!fileValue) {
          setError("Wybierz plik do OCR.");
          setLoading(false);
          return;
        }

        const localFile = await getUploadedFile(fileValue);
        if (localFile) {
          input.file = await fileToDataUrl(localFile);
        } else if (fileValue.startsWith("data:") || fileValue.startsWith("http://") || fileValue.startsWith("https://")) {
          input.file = fileValue;
        } else {
          setError("Nie mam lokalnej kopii tego pliku. Wgraj go ponownie w zakładce Pliki albo wklej URL pliku.");
          setLoading(false);
          return;
        }

        input.language = inputValues.language?.trim() || "pl";
      }

      const res = await universalAI(apiKey, { model, input });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [apiKey, feature, provider, inputValues, selectedFeature]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">Universal AI</h2>
        <p className="text-xs text-muted-foreground">
          Korzystaj z funkcji AI: wykrywanie AI, moderacja, OCR, generowanie obrazów i więcej
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Feature selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Funkcja</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFeatureChange(f.id)}
                className={`rounded-sm border p-2.5 text-left text-sm transition-colors ${
                  selectedFeature === f.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <p className="font-medium">{f.label}</p>
                <p className="mt-0.5 text-xs opacity-70">{f.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Provider selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dostawca</label>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <Button
                key={p}
                variant={provider === p ? "default" : "outline"}
                size="sm"
                onClick={() => setProvider(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Model:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {feature.modelFormat}/{provider}
            </code>
          </p>
        </div>

        {/* Input fields */}
        <div className="space-y-3">
          {feature.inputFields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {selectedFeature === "ocr" && field.key === "file" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploading}
                    className="w-full text-xs"
                  >
                    <FileUp className="mr-1.5 size-3.5" />
                    {uploading ? "Wgrywanie..." : "Wgraj plik do OCR"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleUploadForOcr}
                    disabled={uploading}
                  />
                  {inputValues[field.key] && (
                    <div className="rounded-sm border border-border bg-muted p-2 text-xs text-muted-foreground">
                      File ID: <code>{inputValues[field.key]}</code>
                    </div>
                  )}
                </>
              ) : field.type === "textarea" ? (
                <textarea
                  value={inputValues[field.key] ?? ""}
                  onChange={(e) =>
                    setInputValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                />
              ) : (
                <input
                  type="text"
                  value={inputValues[field.key] ?? ""}
                  onChange={(e) =>
                    setInputValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ml-2">Przetwarzanie…</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              <span className="ml-2">Uruchom</span>
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Wynik</h3>
              <div className="flex items-center gap-2">
                <Badge variant={result.status === "success" ? "default" : "destructive"}>
                  {result.status === "success" ? "Sukces" : "Błąd"}
                </Badge>
                {result.cost && (
                  <Badge variant="outline" className="text-xs">
                    Koszt: {result.cost}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {result.provider}
                </Badge>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={handleCopy}
                className="absolute right-2 top-2 rounded-sm border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Kopiuj wynik"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
              <pre className="max-h-96 overflow-auto rounded-sm border border-border bg-muted/50 p-3 text-xs">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
