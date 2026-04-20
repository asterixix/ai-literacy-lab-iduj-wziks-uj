/**
 * AI Assistant Builder — System punktacji dla ćwiczenia budowania asystenta z RAG, MCP i systemem prompt
 *
 * Zasady punktacji:
 * - 2 pkt za każdy dodany element (20 znaków) — RAG, instrukcje, MCP, model
 * - 1 pkt za każde 5 input tokenów w systemie prompta
 * - 1 pkt za każde 40 output tokenów w odpowiedzi
 */

export interface AssistantElement {
  type: "rag" | "instruction" | "mcp" | "model" | "system_prompt";
  content: string;
  timestamp: number;
}

export interface AssistantBuilderMetrics {
  elementsAdded: AssistantElement[];
  totalInputTokens: number;
  totalOutputTokens: number;
  points: number;
  breakdown: {
    elementPoints: number;
    inputTokenPoints: number;
    outputTokenPoints: number;
  };
}

const ELEMENT_POINTS_PER_20_CHARS = 2;
const INPUT_TOKENS_PER_POINT = 5;
const OUTPUT_TOKENS_PER_POINT = 40;

/**
 * Szacuj tokeny na podstawie znaków (średnia dla tekstu polskiego)
 * 1 token ≈ 3.5-4 znaki dla polskiego tekstu
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.7);
}

/**
 * Oblicz punkty za element (RAG, instrukcja, MCP, model)
 * 2 pkt za każde 20 znaków
 */
export function calculateElementPoints(content: string): number {
  const cleanContent = content.trim();
  if (cleanContent.length === 0) return 0;

  // Zaokrąglenie w górę - minimum 2 pkt za element
  return Math.max(
    ELEMENT_POINTS_PER_20_CHARS,
    Math.floor((cleanContent.length / 20) * ELEMENT_POINTS_PER_20_CHARS),
  );
}

/**
 * Oblicz punkty za input tokeny (1 pkt za 5 tokenów)
 */
export function calculateInputTokenPoints(inputTokens: number): number {
  return Math.floor(inputTokens / INPUT_TOKENS_PER_POINT);
}

/**
 * Oblicz punkty za output tokeny (1 pkt za 40 tokenów)
 */
export function calculateOutputTokenPoints(outputTokens: number): number {
  return Math.floor(outputTokens / OUTPUT_TOKENS_PER_POINT);
}

/**
 * Oblicz całkowitą liczbę punktów dla asystenta
 */
export function calculateTotalAssistantPoints(metrics: {
  elements: AssistantElement[];
  inputTokens: number;
  outputTokens: number;
}): AssistantBuilderMetrics {
  const elementPoints = metrics.elements.reduce((sum, elem) => {
    return sum + calculateElementPoints(elem.content);
  }, 0);

  const inputTokenPoints = calculateInputTokenPoints(metrics.inputTokens);
  const outputTokenPoints = calculateOutputTokenPoints(metrics.outputTokens);
  const totalPoints = elementPoints + inputTokenPoints + outputTokenPoints;

  return {
    elementsAdded: metrics.elements,
    totalInputTokens: metrics.inputTokens,
    totalOutputTokens: metrics.outputTokens,
    points: totalPoints,
    breakdown: {
      elementPoints,
      inputTokenPoints,
      outputTokenPoints,
    },
  };
}

/**
 * Zwróć czytelny opis zdobywania punktów
 */
export function describePointsBreakdown(metrics: AssistantBuilderMetrics): string[] {
  const lines: string[] = [];

  if (metrics.breakdown.elementPoints > 0) {
    const elementCount = metrics.elementsAdded.length;
    const avgChars = Math.floor(
      metrics.elementsAdded.reduce((sum, e) => sum + e.content.length, 0) /
        Math.max(1, elementCount),
    );
    lines.push(
      `📦 Elementy (${elementCount}): +${metrics.breakdown.elementPoints}pkt ` +
        `[avg ${avgChars} znaków/element]`,
    );
  }

  if (metrics.breakdown.inputTokenPoints > 0) {
    lines.push(
      `⬇️ Input tokeny: +${metrics.breakdown.inputTokenPoints}pkt ` +
        `[${metrics.totalInputTokens} tokenów ÷ ${INPUT_TOKENS_PER_POINT}]`,
    );
  }

  if (metrics.breakdown.outputTokenPoints > 0) {
    lines.push(
      `⬆️ Output tokeny: +${metrics.breakdown.outputTokenPoints}pkt ` +
        `[${metrics.totalOutputTokens} tokenów ÷ ${OUTPUT_TOKENS_PER_POINT}]`,
    );
  }

  lines.push(`\n✅ RAZEM: ${metrics.points}pkt`);

  return lines;
}
