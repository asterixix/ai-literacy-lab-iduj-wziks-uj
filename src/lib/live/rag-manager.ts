/**
 * RAG Manager — Obsługa wgrywania i przeszukiwania plików TXT
 *
 * Funkcjonalność:
 * - Wgrywanie wielu plików TXT
 * - Segmentacja na chunks
 * - Przeszukiwanie semantyczne (proste słowa kluczowe)
 * - Dodawanie kontekstu z dokumentów do promptu
 */

export interface DocumentChunk {
  id: string;
  filename: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  size: number;
}

export interface RAGDocument {
  filename: string;
  content: string;
  chunks: DocumentChunk[];
  uploadedAt: number;
  size: number;
}

export interface RAGContext {
  documents: RAGDocument[];
  totalSize: number;
  totalChunks: number;
  relevantChunks: DocumentChunk[];
}

const MAX_CHUNK_SIZE = 1000; // znaki
const MAX_TOTAL_SIZE = 100_000; // znaki
const MAX_FILES = 10;

/**
 * Podziel dokument na chunks dla efektywnego przeszukiwania
 */
function chunkDocument(
  filename: string,
  content: string,
  chunkSize: number = MAX_CHUNK_SIZE,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const lines = content.split("\n");

  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + line).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${filename}-chunk-${chunks.length}`,
        filename,
        content: currentChunk.trim(),
        chunkIndex: chunks.length,
        totalChunks: 0, // zostanie ustawione poniżej
        size: currentChunk.length,
      });
      currentChunk = "";
    }
    currentChunk += (currentChunk ? "\n" : "") + line;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      id: `${filename}-chunk-${chunks.length}`,
      filename,
      content: currentChunk.trim(),
      chunkIndex: chunks.length,
      totalChunks: 0,
      size: currentChunk.length,
    });
  }

  // Ustaw totalChunks dla każdego chunk-a
  const totalChunks = chunks.length;
  chunks.forEach((chunk) => {
    chunk.totalChunks = totalChunks;
  });

  return chunks;
}

/**
 * Waliduj plik TXT przed wgraniem
 */
export function validateFile(
  file: File,
  currentSize: number,
  currentFileCount: number,
): { valid: boolean; error?: string } {
  if (!file.name.endsWith(".txt")) {
    return { valid: false, error: "Tylko pliki .txt są obsługiwane" };
  }

  if (file.size === 0) {
    return { valid: false, error: "Plik jest pusty" };
  }

  if (currentFileCount >= MAX_FILES) {
    return { valid: false, error: `Maksimum ${MAX_FILES} plików` };
  }

  // Przybliżenie: 1 bajt ≈ 1 znak
  if (currentSize + file.size > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Całkowita wielkość przekracza ${MAX_TOTAL_SIZE} znaków`,
    };
  }

  return { valid: true };
}

/**
 * Wczytaj plik TXT i utwórz RAGDocument
 */
export async function loadTextFile(file: File): Promise<RAGDocument> {
  const text = await file.text();
  const chunks = chunkDocument(file.name, text);

  return {
    filename: file.name,
    content: text,
    chunks,
    uploadedAt: Date.now(),
    size: text.length,
  };
}

/**
 * Proste wyszukiwanie chunk-ów na podstawie słów kluczowych
 * (w produkcji byłoby to embedding + similarity search)
 */
export function searchChunks(
  query: string,
  documents: RAGDocument[],
  topK: number = 3,
): DocumentChunk[] {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 2);

  if (keywords.length === 0) {
    return [];
  }

  const scored = documents
    .flatMap((doc) => doc.chunks)
    .map((chunk) => {
      const score = keywords.reduce((sum, kw) => {
        const matches = (chunk.content.toLowerCase().match(new RegExp(kw, "g")) || []).length;
        return sum + matches;
      }, 0);
      return { chunk, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ chunk }) => chunk);
}

/**
 * Utwórz kontekst RAG do dodania do promptu
 */
export function buildRAGContext(
  query: string,
  documents: RAGDocument[],
): { context: string; relevantChunks: DocumentChunk[] } {
  if (documents.length === 0) {
    return { context: "", relevantChunks: [] };
  }

  const relevantChunks = searchChunks(query, documents);

  if (relevantChunks.length === 0) {
    return { context: "", relevantChunks: [] };
  }

  const contextParts = relevantChunks.map((chunk) => {
    return `[${chunk.filename} - część ${chunk.chunkIndex + 1}/${chunk.totalChunks}]\n${chunk.content}`;
  });

  const context = `Dostępne dokumenty:\n\n${contextParts.join("\n\n---\n\n")}`;

  return { context, relevantChunks };
}

/**
 * Statystyki RAG-u
 */
export function getRAGStats(documents: RAGDocument[]): {
  documentCount: number;
  totalSize: number;
  totalChunks: number;
  avgChunkSize: number;
} {
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);

  return {
    documentCount: documents.length,
    totalSize,
    totalChunks,
    avgChunkSize: totalChunks > 0 ? Math.floor(totalSize / totalChunks) : 0,
  };
}
