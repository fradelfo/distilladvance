/**
 * AI Distillation Service
 *
 * Converts raw AI conversations into reusable prompt templates
 * using Claude API with exponential backoff retry logic.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../lib/env.js";
import {
  DISTILL_SYSTEM_PROMPT,
  estimateCost,
} from "../prompts/distill-system.js";

// ============================================================================
// Types
// ============================================================================

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface DistilledPromptVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface DistilledPrompt {
  title: string;
  description: string;
  template: string;
  variables: DistilledPromptVariable[];
  tags: string[];
  category: string;
}

export interface DistillationResult {
  success: boolean;
  prompt?: DistilledPrompt;
  error?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    model: string;
    provider: "anthropic" | "openai";
  };
  durationMs: number;
}

export interface DistillationOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  temperature?: number;
  maxTokens?: number;
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

      // Check if this is a retryable error
      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt === options.maxRetries) {
        throw lastError;
      }

      // Calculate delay with jitter
      const jitter = Math.random() * 0.1 * delay;
      const actualDelay = Math.min(delay + jitter, options.maxDelayMs);

      options.onRetry?.(attempt, lastError, actualDelay);

      await sleep(actualDelay);

      // Exponential backoff
      delay = Math.min(delay * 2, options.maxDelayMs);
    }
  }

  throw lastError ?? new Error("Unknown error in retry loop");
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Rate limit errors
  if (message.includes("rate_limit") || message.includes("429")) {
    return true;
  }

  // Temporary server errors
  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504")
  ) {
    return true;
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnreset")
  ) {
    return true;
  }

  // Overloaded
  if (message.includes("overloaded")) {
    return true;
  }

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
// Conversation Formatting
// ============================================================================

function formatConversation(messages: ConversationMessage[]): string {
  return messages
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      return `${role}: ${msg.content}`;
    })
    .join("\n\n");
}

// ============================================================================
// Response Parsing
// ============================================================================

function parseDistilledPrompt(response: string): DistilledPrompt {
  // Try to extract JSON from the response
  let jsonStr = response.trim();

  // Handle markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.title || typeof parsed.title !== "string") {
      throw new Error("Invalid or missing 'title' field");
    }
    if (!parsed.description || typeof parsed.description !== "string") {
      throw new Error("Invalid or missing 'description' field");
    }
    if (!parsed.template || typeof parsed.template !== "string") {
      throw new Error("Invalid or missing 'template' field");
    }
    if (!Array.isArray(parsed.variables)) {
      throw new Error("Invalid or missing 'variables' field");
    }
    if (!Array.isArray(parsed.tags)) {
      throw new Error("Invalid or missing 'tags' field");
    }
    if (!parsed.category || typeof parsed.category !== "string") {
      throw new Error("Invalid or missing 'category' field");
    }

    // Validate and normalize variables
    const variables: DistilledPromptVariable[] = parsed.variables.map(
      (v: Record<string, unknown>) => ({
        name: String(v.name || ""),
        description: String(v.description || ""),
        example: String(v.example || ""),
        required: Boolean(v.required ?? true),
      })
    );

    return {
      title: parsed.title.substring(0, 100), // Enforce max length
      description: parsed.description.substring(0, 500),
      template: parsed.template,
      variables,
      tags: parsed.tags.map(String).slice(0, 10), // Max 10 tags
      category: parsed.category,
    };
  } catch (parseError) {
    throw new Error(
      `Failed to parse distillation response: ${
        parseError instanceof Error ? parseError.message : "Invalid JSON"
      }`
    );
  }
}

// ============================================================================
// Main Distillation Function
// ============================================================================

const DEFAULT_OPTIONS: Required<DistillationOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  temperature: env.AI_TEMPERATURE,
  maxTokens: env.AI_MAX_TOKENS,
};

export async function distillConversation(
  messages: ConversationMessage[],
  options: DistillationOptions = {}
): Promise<DistillationResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate input
  if (!messages || messages.length === 0) {
    return {
      success: false,
      error: "No messages provided for distillation",
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

  // Filter out empty messages
  const validMessages = messages.filter(
    (m) => m.content && m.content.trim().length > 0
  );

  if (validMessages.length === 0) {
    return {
      success: false,
      error: "All messages are empty",
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

  const formattedConversation = formatConversation(validMessages);
  const model = env.ANTHROPIC_MODEL_DEFAULT;

  try {
    const client = getAnthropicClient();

    const response = await withRetry(
      async () => {
        return client.messages.create({
          model,
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
          system: DISTILL_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Analyze this conversation and extract a reusable prompt template:\n\n${formattedConversation}`,
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
            `[Distillation] Retry ${attempt}/${opts.maxRetries} after ${delayMs}ms: ${error.message}`
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
    const distilledPrompt = parseDistilledPrompt(responseText);

    // Calculate usage
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const cost = estimateCost(inputTokens, outputTokens);

    // Log usage for monitoring
    console.log(
      `[Distillation] Success - Model: ${model}, Tokens: ${totalTokens} (in: ${inputTokens}, out: ${outputTokens}), Cost: $${cost.toFixed(4)}`
    );

    return {
      success: true,
      prompt: distilledPrompt,
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

    console.error(`[Distillation] Failed: ${errorMessage}`);

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

export interface UsageLogEntry {
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

export function createUsageLogEntry(
  result: DistillationResult,
  userId?: string
): UsageLogEntry {
  return {
    userId,
    model: result.usage.model,
    provider: result.usage.provider,
    promptTokens: result.usage.inputTokens,
    completionTokens: result.usage.outputTokens,
    totalTokens: result.usage.totalTokens,
    cost: result.usage.estimatedCost,
    operation: "distill",
    metadata: {
      success: result.success,
      durationMs: result.durationMs,
      error: result.error,
    },
  };
}
