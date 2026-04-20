export const QUIZ_BASE_POINTS = 100;
export const QUIZ_CORRECT_POINTS = 10;
export const PROMPT_SEND_POINTS = 5;
export const TOKENS_PER_POINT = 10;
export const PRIVACY_CHECKBOX_POINTS = 2;
export const PRIVACY_COMPARISON_POINTS = 5;
export const LM_STUDIO_STEP_POINTS = 25;
export const LM_STUDIO_DONE_POINTS = 5;
export const SCREENSHOT_PENDING_REWARD = 50;
export const SCREENSHOT_PROTOTYPE_REWARD = 250;

export const PROTOTYPE_EXERCISE_SLUG = "ai-prototyp-strony";

export function getScreenshotPendingReward(exerciseSlug: string): number {
  return exerciseSlug === PROTOTYPE_EXERCISE_SLUG
    ? SCREENSHOT_PROTOTYPE_REWARD
    : SCREENSHOT_PENDING_REWARD;
}

// Playground token points
export const INPUT_TOKENS_PER_POINT = 5;
export const OUTPUT_TOKENS_PER_POINT = 40;
export const CUSTOM_PARAM_POINT = 1;

export function calculateQuizPoints(correctCount: number): number {
  return QUIZ_BASE_POINTS + correctCount * QUIZ_CORRECT_POINTS;
}

export function calculatePromptTokenPoints(tokens: number): number {
  if (!Number.isFinite(tokens) || tokens <= 0) return 0;
  return Math.floor(tokens / TOKENS_PER_POINT);
}

export function calculatePlaygroundPoints(payload: {
  inputTokensPerModel?: number[];
  outputTokensPerModel?: number[];
  customParamCount?: number;
}): number {
  let points = 0;

  // Points for input tokens (1 pt per 5 tokens per model)
  if (Array.isArray(payload.inputTokensPerModel)) {
    for (const tokens of payload.inputTokensPerModel) {
      if (Number.isFinite(tokens) && tokens > 0) {
        points += Math.floor(tokens / INPUT_TOKENS_PER_POINT);
      }
    }
  }

  // Points for output tokens (1 pt per 40 tokens per model)
  if (Array.isArray(payload.outputTokensPerModel)) {
    for (const tokens of payload.outputTokensPerModel) {
      if (Number.isFinite(tokens) && tokens > 0) {
        points += Math.floor(tokens / OUTPUT_TOKENS_PER_POINT);
      }
    }
  }

  // Points for custom parameters (1 pt per set parameter)
  if (
    payload.customParamCount !== undefined &&
    Number.isFinite(payload.customParamCount) &&
    payload.customParamCount > 0
  ) {
    points += payload.customParamCount;
  }

  return points;
}

export function sanitizePoints(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(value);
}
