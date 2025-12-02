/**
 * Tests for the AI Distillation Service
 */

import { describe, expect, it, vi } from 'vitest';
import {
  type ConversationMessage,
  type DistillationResult,
  createUsageLogEntry,
  distillConversation,
} from './distillation.js';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

// Mock environment
vi.mock('../lib/env.js', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-api-key',
    ANTHROPIC_MODEL_DEFAULT: 'claude-sonnet-4-20250514',
    AI_MAX_TOKENS: 4096,
    AI_TEMPERATURE: 0.7,
  },
}));

describe('distillConversation', () => {
  const sampleMessages: ConversationMessage[] = [
    { role: 'user', content: 'Write a Python function to sort a list' },
    {
      role: 'assistant',
      content:
        'Here is a function to sort a list:\n```python\ndef sort_list(items):\n    return sorted(items)\n```',
    },
    { role: 'user', content: 'Add type hints please' },
    {
      role: 'assistant',
      content:
        'Here it is with type hints:\n```python\ndef sort_list(items: list) -> list:\n    return sorted(items)\n```',
    },
  ];

  it('should return error for empty messages array', async () => {
    const result = await distillConversation([]);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No messages provided for distillation');
    expect(result.usage.totalTokens).toBe(0);
  });

  it('should return error for messages with only empty content', async () => {
    const result = await distillConversation([
      { role: 'user', content: '' },
      { role: 'assistant', content: '  ' },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toBe('All messages are empty');
  });

  it('should include duration in result', async () => {
    const result = await distillConversation([]);

    expect(result.durationMs).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('createUsageLogEntry', () => {
  it('should create a valid usage log entry', () => {
    const result: DistillationResult = {
      success: true,
      prompt: {
        title: 'Test Prompt',
        description: 'A test prompt',
        template: 'Do {{task}}',
        variables: [
          {
            name: 'task',
            description: 'The task to do',
            example: 'something',
            required: true,
          },
        ],
        tags: ['test'],
        category: 'other',
      },
      usage: {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        estimatedCost: 0.001,
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
      },
      durationMs: 1000,
    };

    const logEntry = createUsageLogEntry(result, 'user-123');

    expect(logEntry.userId).toBe('user-123');
    expect(logEntry.model).toBe('claude-sonnet-4-20250514');
    expect(logEntry.provider).toBe('anthropic');
    expect(logEntry.promptTokens).toBe(100);
    expect(logEntry.completionTokens).toBe(50);
    expect(logEntry.totalTokens).toBe(150);
    expect(logEntry.cost).toBe(0.001);
    expect(logEntry.operation).toBe('distill');
    expect(logEntry.metadata?.success).toBe(true);
    expect(logEntry.metadata?.durationMs).toBe(1000);
  });

  it('should handle failed distillation result', () => {
    const result: DistillationResult = {
      success: false,
      error: 'API error',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
      },
      durationMs: 500,
    };

    const logEntry = createUsageLogEntry(result);

    expect(logEntry.userId).toBeUndefined();
    expect(logEntry.metadata?.success).toBe(false);
    expect(logEntry.metadata?.error).toBe('API error');
  });
});

describe('cost estimation', () => {
  it('should estimate costs correctly', async () => {
    // Cost is calculated in the distillation service
    // Claude 3.5 Sonnet: $3/$15 per 1M tokens
    // 1000 input tokens = $0.003
    // 500 output tokens = $0.0075
    // Total = $0.0105

    const { estimateCost } = await import('../prompts/distill-system.js');
    const cost = estimateCost(1000, 500);

    expect(cost).toBeCloseTo(0.0105, 4);
  });
});
