/**
 * Workflow Execution Service
 *
 * Handles the execution of workflow (prompt chain) runs, including
 * sequential step execution, variable mapping, and LLM integration.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Prisma } from '@prisma/client';
import type { PrismaClient, StepExecutionStatus, WorkflowExecutionStatus } from '@prisma/client';
import { env } from '../lib/env.js';
import { estimateCost } from '../prompts/distill-system.js';

// ============================================================================
// Types
// ============================================================================

export interface ExecutionContext {
  prisma: PrismaClient;
  userId: string;
}

export interface StepExecutionResult {
  success: boolean;
  output?: string;
  tokens: number;
  cost: number;
  durationMs: number;
  error?: string;
}

export interface ExecutionStatus {
  id: string;
  status: WorkflowExecutionStatus;
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    order: number;
    status: StepExecutionStatus;
    output?: string | null;
    error?: string | null;
  }>;
  totalTokens: number;
  totalCost: number;
  errorMessage?: string | null;
}

export interface VariableMapping {
  [variableName: string]: string; // "initial.varName" or "step.N.output"
}

// ============================================================================
// Variable Utilities
// ============================================================================

/**
 * Regular expression for matching {{variable}} patterns.
 */
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Extracts unique variable names from a template string.
 */
export function extractVariables(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const variables: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  VARIABLE_PATTERN.lastIndex = 0;

  while ((match = VARIABLE_PATTERN.exec(content)) !== null) {
    const varName = match[1].trim();
    if (varName && !seen.has(varName)) {
      seen.add(varName);
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Fills variables in a template string with provided values.
 */
export function fillVariables(content: string, values: Record<string, string>): string {
  if (!content || typeof content !== 'string') {
    return content ?? '';
  }

  VARIABLE_PATTERN.lastIndex = 0;

  return content.replace(VARIABLE_PATTERN, (match, varName) => {
    const trimmedName = varName.trim();
    if (trimmedName in values && values[trimmedName] !== undefined) {
      return values[trimmedName];
    }
    return match;
  });
}

/**
 * Resolves variable mapping to actual values.
 *
 * inputMapping format:
 * - "initial.varName" -> get from initialInput
 * - "step.N.output" -> get output from step at order N
 *
 * promptVariables: Optional list of variables in the prompt template.
 * If provided, unmapped variables will be looked up directly from initialInput
 * as a fallback (for backwards compatibility with workflows created before
 * auto-mapping was implemented).
 */
export function resolveVariables(
  inputMapping: Record<string, string> | null,
  initialInput: Record<string, unknown>,
  stepOutputs: Map<number, string>,
  promptVariables?: string[]
): Record<string, string> {
  const resolved: Record<string, string> = {};

  // Process explicit mappings
  if (inputMapping) {
    for (const [varName, source] of Object.entries(inputMapping)) {
      if (source.startsWith('initial.')) {
        const initialVar = source.slice(8); // Remove "initial."
        const value = initialInput[initialVar];
        if (value !== undefined && value !== null) {
          resolved[varName] = String(value);
        }
      } else if (source.startsWith('step.')) {
        // Format: "step.N.output"
        const match = source.match(/^step\.(\d+)\.output$/);
        if (match) {
          const stepOrder = Number.parseInt(match[1], 10);
          const output = stepOutputs.get(stepOrder);
          if (output !== undefined) {
            resolved[varName] = output;
          }
        }
      }
    }
  }

  // Fallback: Check for unmapped variables that have direct matches in initialInput
  // This handles cases where workflows were created without explicit mappings
  if (promptVariables) {
    for (const varName of promptVariables) {
      if (!(varName in resolved) && varName in initialInput) {
        const value = initialInput[varName];
        if (value !== undefined && value !== null) {
          resolved[varName] = String(value);
        }
      }
    }
  }

  return resolved;
}

// ============================================================================
// Anthropic Client
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ============================================================================
// Workflow Execution Service
// ============================================================================

/**
 * Starts a new workflow execution.
 * Creates the execution record and all step execution records.
 */
export async function startExecution(
  ctx: ExecutionContext,
  workflowId: string,
  initialInput: Record<string, unknown>
): Promise<string> {
  // Get workflow with steps
  const workflow = await ctx.prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      steps: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.steps.length < 2) {
    throw new Error('Workflow must have at least 2 steps');
  }

  // Create execution with all step executions
  const execution = await ctx.prisma.workflowExecution.create({
    data: {
      workflowId,
      userId: ctx.userId,
      status: 'PENDING',
      initialInput: initialInput as any,
      steps: {
        create: workflow.steps.map((step) => ({
          stepId: step.id,
          stepOrder: step.order,
          status: 'PENDING' as StepExecutionStatus,
        })),
      },
    },
  });

  return execution.id;
}

/**
 * Executes a single step of a workflow.
 */
async function executeStep(
  ctx: ExecutionContext,
  stepExecution: {
    id: string;
    stepId: string;
    stepOrder: number;
  },
  prompt: {
    id: string;
    content: string;
    title: string;
  },
  inputMapping: Record<string, string> | null,
  initialInput: Record<string, unknown>,
  stepOutputs: Map<number, string>
): Promise<StepExecutionResult> {
  const startTime = Date.now();

  try {
    // Update step status to RUNNING
    await ctx.prisma.workflowStepExecution.update({
      where: { id: stepExecution.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Extract variables from prompt and resolve them
    const promptVariables = extractVariables(prompt.content);
    const resolvedVars = resolveVariables(inputMapping, initialInput, stepOutputs, promptVariables);

    // Fill prompt template with variables
    const filledPrompt = fillVariables(prompt.content, resolvedVars);

    // Check for unfilled variables
    const unfilledVars = extractVariables(filledPrompt);
    if (unfilledVars.length > 0) {
      throw new Error(`Unfilled variables: ${unfilledVars.join(', ')}`);
    }

    // Call Anthropic
    const client = getAnthropicClient();
    const model = env.ANTHROPIC_MODEL_DEFAULT;

    const response = await client.messages.create({
      model,
      max_tokens: env.AI_MAX_TOKENS,
      temperature: env.AI_TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
    });

    // Extract response text
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    const output = textContent.text;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const cost = estimateCost(inputTokens, outputTokens);
    const durationMs = Date.now() - startTime;

    // Update step execution with success
    await ctx.prisma.workflowStepExecution.update({
      where: { id: stepExecution.id },
      data: {
        status: 'COMPLETED',
        input: resolvedVars as any,
        output,
        tokens: totalTokens,
        cost,
        durationMs,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      output,
      tokens: totalTokens,
      cost,
      durationMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const durationMs = Date.now() - startTime;

    // Update step execution with failure
    await ctx.prisma.workflowStepExecution.update({
      where: { id: stepExecution.id },
      data: {
        status: 'FAILED',
        errorMessage,
        durationMs,
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      error: errorMessage,
      tokens: 0,
      cost: 0,
      durationMs,
    };
  }
}

/**
 * Runs the entire workflow execution.
 * Executes steps sequentially, stopping on first failure.
 */
export async function runExecution(
  ctx: ExecutionContext,
  executionId: string
): Promise<ExecutionStatus> {
  // Get execution with steps
  const execution = await ctx.prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        include: {
          steps: {
            include: {
              prompt: {
                select: { id: true, content: true, title: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  });

  if (!execution) {
    throw new Error('Execution not found');
  }

  if (execution.status !== 'PENDING') {
    throw new Error(`Execution is already ${execution.status.toLowerCase()}`);
  }

  // Update execution status to RUNNING
  await ctx.prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: 'RUNNING' },
  });

  const initialInput = execution.initialInput as Record<string, unknown>;
  const stepOutputs = new Map<number, string>();
  let totalTokens = 0;
  let totalCost = 0;
  let lastOutput: string | null = null;
  let failed = false;
  let errorMessage: string | null = null;

  // Execute steps sequentially
  for (const stepExecution of execution.steps) {
    const workflowStep = execution.workflow.steps.find((s) => s.id === stepExecution.stepId);

    if (!workflowStep) {
      failed = true;
      errorMessage = `Step ${stepExecution.stepOrder} not found in workflow`;
      break;
    }

    const result = await executeStep(
      ctx,
      stepExecution,
      workflowStep.prompt,
      workflowStep.inputMapping as Record<string, string> | null,
      initialInput,
      stepOutputs
    );

    totalTokens += result.tokens;
    totalCost += result.cost;

    if (!result.success) {
      failed = true;
      errorMessage = result.error || 'Step execution failed';
      break;
    }

    // Store output for next step
    if (result.output) {
      stepOutputs.set(stepExecution.stepOrder, result.output);
      lastOutput = result.output;
    }
  }

  // Update execution with final status
  const finalStatus: WorkflowExecutionStatus = failed ? 'FAILED' : 'COMPLETED';

  await ctx.prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: finalStatus,
      finalOutput: lastOutput ? { result: lastOutput } : Prisma.JsonNull,
      totalTokens,
      totalCost,
      errorMessage,
      completedAt: new Date(),
    },
  });

  // Log AI usage
  await ctx.prisma.aiUsageLog.create({
    data: {
      userId: ctx.userId,
      model: env.ANTHROPIC_MODEL_DEFAULT,
      provider: 'anthropic',
      promptTokens: Math.floor(totalTokens * 0.7), // Approximate split
      completionTokens: Math.floor(totalTokens * 0.3),
      totalTokens,
      cost: totalCost,
      operation: 'workflow_execution',
      metadata: {
        executionId,
        workflowId: execution.workflowId,
        stepCount: execution.steps.length,
        success: !failed,
      },
    },
  });

  return getExecutionStatus(ctx, executionId);
}

/**
 * Gets the current status of an execution.
 */
export async function getExecutionStatus(
  ctx: ExecutionContext,
  executionId: string
): Promise<ExecutionStatus> {
  const execution = await ctx.prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  });

  if (!execution) {
    throw new Error('Execution not found');
  }

  const completedSteps = execution.steps.filter((s) => s.status === 'COMPLETED').length;

  return {
    id: execution.id,
    status: execution.status,
    currentStep: completedSteps,
    totalSteps: execution.steps.length,
    steps: execution.steps.map((s) => ({
      id: s.id,
      order: s.stepOrder,
      status: s.status,
      output: s.output,
      error: s.errorMessage,
    })),
    totalTokens: execution.totalTokens,
    totalCost: execution.totalCost,
    errorMessage: execution.errorMessage,
  };
}

/**
 * Cancels a running execution.
 */
export async function cancelExecution(ctx: ExecutionContext, executionId: string): Promise<void> {
  const execution = await ctx.prisma.workflowExecution.findUnique({
    where: { id: executionId },
    select: { status: true, userId: true },
  });

  if (!execution) {
    throw new Error('Execution not found');
  }

  if (execution.userId !== ctx.userId) {
    throw new Error("You don't have permission to cancel this execution");
  }

  if (execution.status !== 'PENDING' && execution.status !== 'RUNNING') {
    throw new Error(`Cannot cancel execution with status: ${execution.status}`);
  }

  // Update execution status
  await ctx.prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });

  // Mark pending steps as skipped
  await ctx.prisma.workflowStepExecution.updateMany({
    where: {
      executionId,
      status: 'PENDING',
    },
    data: {
      status: 'SKIPPED',
    },
  });
}

/**
 * Lists executions for a workflow with pagination.
 */
export async function listExecutions(
  ctx: ExecutionContext,
  workflowId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<{
  executions: Array<{
    id: string;
    status: WorkflowExecutionStatus;
    totalTokens: number;
    totalCost: number;
    startedAt: Date;
    completedAt: Date | null;
  }>;
  nextCursor?: string;
}> {
  const limit = options.limit ?? 10;

  const whereClause: any = { workflowId };
  if (options.cursor) {
    whereClause.id = { lt: options.cursor };
  }

  const executions = await ctx.prisma.workflowExecution.findMany({
    where: whereClause,
    orderBy: { startedAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      status: true,
      totalTokens: true,
      totalCost: true,
      startedAt: true,
      completedAt: true,
    },
  });

  let nextCursor: string | undefined;
  if (executions.length > limit) {
    const lastItem = executions.pop();
    nextCursor = lastItem?.id;
  }

  return {
    executions,
    nextCursor,
  };
}
