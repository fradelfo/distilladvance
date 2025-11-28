/**
 * AI Prompt Coaching Service
 *
 * Analyzes prompt templates and provides improvement suggestions
 * using Claude API with exponential backoff retry logic.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../lib/env.js";
import {
  COACH_SYSTEM_PROMPT,
  COACH_FOCUSED_PROMPTS,
  estimateCoachCost,
} from "../prompts/coach-system.js";

// ============================================================================
// Types
// ============================================================================

export type CoachingArea =
  | "clarity"
  | "structure"
  | "variables"
  | "specificity"
  | "output_format"
  | "comprehensive";

export interface CoachingSuggestion {
  id: string;
  area: Exclude<CoachingArea, "comprehensive">;
  title: string;
  issue: string;
  current: string;
  suggested: string;
  reasoning: string;
  impact: "high" | "medium" | "low";
}

export interface CoachingAnalysis {
  overallScore: number;
  summary: string;
  strengths: string[];
  suggestions: CoachingSuggestion[];
  quickWins: string[];
}

export interface CoachingResult {
  success: boolean;
  analysis?: CoachingAnalysis;
  error?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    model: string;
    provider: "anthropic";
  };
  durationMs: number;
}

export interface CoachingOptions {
  focusArea?: CoachingArea;
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface PromptForCoaching {
  title: string;
  description?: string;
  template: string;
  variables?: Array<{
    name: string;
    description?: string;
    example?: string;
    required?: boolean;
  }>;
  tags?: string[];
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
  }
): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.initialDelayMs;

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt === options.maxRetries) {
        throw lastError;
      }

      const jitter = Math.random() * 0.1 * delay;
      const actualDelay = Math.min(delay + jitter, options.maxDelayMs);

      options.onRetry?.(attempt, lastError, actualDelay);

      await sleep(actualDelay);
      delay = Math.min(delay * 2, options.maxDelayMs);
    }
  }

  throw lastError ?? new Error("Unknown error in retry loop");
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  if (message.includes("rate_limit") || message.includes("429")) return true;
  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504")
  )
    return true;
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnreset")
  )
    return true;
  if (message.includes("overloaded")) return true;

  return false;
}

// ============================================================================
// Anthropic Client
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ============================================================================
// Prompt Formatting
// ============================================================================

function formatPromptForCoaching(prompt: PromptForCoaching): string {
  let formatted = `# Prompt Template

**Title:** ${prompt.title}
`;

  if (prompt.description) {
    formatted += `**Description:** ${prompt.description}\n`;
  }

  if (prompt.tags && prompt.tags.length > 0) {
    formatted += `**Tags:** ${prompt.tags.join(", ")}\n`;
  }

  formatted += `
## Template Content

\`\`\`
${prompt.template}
\`\`\`
`;

  if (prompt.variables && prompt.variables.length > 0) {
    formatted += `
## Variables

| Name | Description | Example | Required |
|------|-------------|---------|----------|
`;
    for (const v of prompt.variables) {
      formatted += `| {{${v.name}}} | ${v.description || "-"} | ${v.example || "-"} | ${v.required ? "Yes" : "No"} |\n`;
    }
  }

  return formatted;
}

// ============================================================================
// Response Parsing
// ============================================================================

function parseCoachingResponse(response: string): CoachingAnalysis {
  let jsonStr = response.trim();

  // Handle markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof parsed.overallScore !== "number") {
      throw new Error("Invalid or missing 'overallScore' field");
    }
    if (!parsed.summary || typeof parsed.summary !== "string") {
      throw new Error("Invalid or missing 'summary' field");
    }
    if (!Array.isArray(parsed.strengths)) {
      throw new Error("Invalid or missing 'strengths' field");
    }
    if (!Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid or missing 'suggestions' field");
    }
    if (!Array.isArray(parsed.quickWins)) {
      throw new Error("Invalid or missing 'quickWins' field");
    }

    // Validate and normalize suggestions
    const suggestions: CoachingSuggestion[] = parsed.suggestions.map(
      (s: Record<string, unknown>, index: number) => ({
        id: String(s.id || `suggestion-${index}`),
        area: validateArea(String(s.area || "clarity")),
        title: String(s.title || ""),
        issue: String(s.issue || ""),
        current: String(s.current || ""),
        suggested: String(s.suggested || ""),
        reasoning: String(s.reasoning || ""),
        impact: validateImpact(String(s.impact || "medium")),
      })
    );

    return {
      overallScore: Math.max(0, Math.min(1, parsed.overallScore)),
      summary: parsed.summary.substring(0, 500),
      strengths: parsed.strengths.map(String).slice(0, 10),
      suggestions: suggestions.slice(0, 10),
      quickWins: parsed.quickWins.map(String).slice(0, 5),
    };
  } catch (parseError) {
    throw new Error(
      `Failed to parse coaching response: ${
        parseError instanceof Error ? parseError.message : "Invalid JSON"
      }`
    );
  }
}

function validateArea(
  area: string
): Exclude<CoachingArea, "comprehensive"> {
  const validAreas = [
    "clarity",
    "structure",
    "variables",
    "specificity",
    "output_format",
  ];
  return validAreas.includes(area)
    ? (area as Exclude<CoachingArea, "comprehensive">)
    : "clarity";
}

function validateImpact(impact: string): "high" | "medium" | "low" {
  const validImpacts = ["high", "medium", "low"];
  return validImpacts.includes(impact)
    ? (impact as "high" | "medium" | "low")
    : "medium";
}

// ============================================================================
// Main Coaching Function
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<CoachingOptions, "focusArea">> & {
  focusArea?: CoachingArea;
} = {
  focusArea: "comprehensive",
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  temperature: 0.3, // Lower temperature for more consistent analysis
  maxTokens: 2000,
};

export async function generateCoachingSuggestions(
  prompt: PromptForCoaching,
  options: CoachingOptions = {}
): Promise<CoachingResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate input
  if (!prompt.template || prompt.template.trim().length === 0) {
    return {
      success: false,
      error: "No template content provided for coaching",
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        model: "",
        provider: "anthropic",
      },
      durationMs: Date.now() - startTime,
    };
  }

  const formattedPrompt = formatPromptForCoaching(prompt);
  const model = env.ANTHROPIC_MODEL_DEFAULT;

  // Build system prompt with optional focus area
  let systemPrompt = COACH_SYSTEM_PROMPT;
  if (opts.focusArea && opts.focusArea !== "comprehensive") {
    const focusInstructions = COACH_FOCUSED_PROMPTS[opts.focusArea];
    if (focusInstructions) {
      systemPrompt += `\n\n## Focus Area\n\n${focusInstructions}`;
    }
  }

  try {
    const client = getAnthropicClient();

    const response = await withRetry(
      async () => {
        return client.messages.create({
          model,
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Analyze this prompt template and provide improvement suggestions:\n\n${formattedPrompt}`,
            },
          ],
        });
      },
      {
        maxRetries: opts.maxRetries,
        initialDelayMs: opts.initialDelayMs,
        maxDelayMs: opts.maxDelayMs,
        onRetry: (attempt, error, delayMs) => {
          console.warn(
            `[Coaching] Retry ${attempt}/${opts.maxRetries} after ${delayMs}ms: ${error.message}`
          );
        },
      }
    );

    // Extract response text
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response");
    }

    const responseText = textContent.text;

    // Parse the response
    const analysis = parseCoachingResponse(responseText);

    // Calculate usage
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const cost = estimateCoachCost(inputTokens, outputTokens);

    console.log(
      `[Coaching] Success - Score: ${analysis.overallScore.toFixed(2)}, Suggestions: ${analysis.suggestions.length}, Tokens: ${totalTokens}, Cost: $${cost.toFixed(4)}`
    );

    return {
      success: true,
      analysis,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: cost,
        model,
        provider: "anthropic",
      },
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(`[Coaching] Failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        model,
        provider: "anthropic",
      },
      durationMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Usage Logging (for database persistence)
// ============================================================================

export interface CoachingUsageLogEntry {
  userId?: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  operation: string;
  metadata?: Record<string, unknown>;
}

export function createCoachingUsageLogEntry(
  result: CoachingResult,
  promptId: string,
  focusArea: CoachingArea,
  userId?: string
): CoachingUsageLogEntry {
  return {
    userId,
    model: result.usage.model,
    provider: result.usage.provider,
    promptTokens: result.usage.inputTokens,
    completionTokens: result.usage.outputTokens,
    totalTokens: result.usage.totalTokens,
    cost: result.usage.estimatedCost,
    operation: focusArea === "comprehensive" ? "coach_full" : "coach_focused",
    metadata: {
      success: result.success,
      durationMs: result.durationMs,
      promptId,
      focusArea,
      overallScore: result.analysis?.overallScore,
      suggestionCount: result.analysis?.suggestions.length || 0,
      error: result.error,
    },
  };
}
