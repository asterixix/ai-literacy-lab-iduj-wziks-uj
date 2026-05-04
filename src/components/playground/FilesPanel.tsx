"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Trash2, RefreshCw, File, AlertCircle, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadFile, listFiles, deleteFile, type EdenFile } from "@/lib/eden-ai";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/uploaded-files";

interface FilesPanelProps {
  apiKey: string;
}

export function FilesPanel({ apiKey }: FilesPanelProps) {
  const [files, setFiles] = useState<EdenFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFiles(apiKey);
      setFiles(res.items);
      setTotalFiles(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać plików");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = useCallback(
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
          // Local cache is best-effort; Eden upload still succeeded.
        }
        await loadFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się wgrać pliku");
      } finally {
        setUploading(false);
        // Reset input so the same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [apiKey, loadFiles],
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      try {
        await deleteFile(apiKey, fileId);
        try {
          await deleteUploadedFile(fileId);
        } catch {
          // Best-effort cleanup.
        }
        await loadFiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się usunąć pliku");
      }
    },
    [apiKey, loadFiles],
  );

  const handleCopyFileId = useCallback((fileId: string) => {
    navigator.clipboard.writeText(fileId);
    setCopiedFileId(fileId);
    setTimeout(() => setCopiedFileId(null), 2000);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">Pliki</h2>
          <p className="text-xs text-muted-foreground">Zarządzaj plikami przesłanymi do Eden AI</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-1.5">Odśwież</span>
          </Button>
          <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-3.5" />
            <span className="ml-1.5">{uploading ? "Wgrywanie…" : "Wgraj plik"}</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <Badge variant="outline" className="text-xs">
          Łącznie: {totalFiles}
        </Badge>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && files.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Ładowanie plików…
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <File className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Brak plików. Wgraj plik, aby użyć go w czacie.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Pliki wygasają po 30 dniach.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.file_id}
                className="flex items-start gap-3 rounded-sm border border-border p-3"
              >
                <File className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.file_name}</p>
                  <div className="mt-1.5 flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{formatSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{file.file_mimetype}</span>
                      <span>•</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                    {file.expires_at && (
                      <p>Wygasa: {formatDate(file.expires_at)}</p>
                    )}
                    {/* File ID for OCR usage */}
                    <div className="mt-2 flex items-center gap-2 rounded bg-muted p-2">
                      <code className="flex-1 overflow-hidden text-ellipsis text-xs font-mono">
                        {file.file_id}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        onClick={() => handleCopyFileId(file.file_id)}
                        aria-label={`Skopiuj ID pliku ${file.file_name}`}
                      >
                        {copiedFileId === file.file_id ? (
                          <Check className="size-3.5 text-green-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {file.purpose}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    onClick={() => handleDelete(file.file_id)}
                    aria-label={`Usuń ${file.file_name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
