/**
 * Coach tRPC Router
 *
 * Provides prompt improvement suggestions using AI analysis.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authedProcedure, router } from "../index.js";
import {
  generateCoachingSuggestions,
  createCoachingUsageLogEntry,
  type CoachingArea,
  type PromptForCoaching,
} from "../../services/coaching.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const coachingAreaSchema = z.enum([
  "clarity",
  "structure",
  "variables",
  "specificity",
  "output_format",
  "comprehensive",
]);

const generateSuggestionsInputSchema = z.object({
  promptId: z.string().min(1, "Prompt ID is required"),
  focusArea: coachingAreaSchema.default("comprehensive"),
});

const coachPromptDirectInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  template: z.string().min(1, "Template content is required"),
  variables: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        example: z.string().optional(),
        required: z.boolean().optional(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  focusArea: coachingAreaSchema.default("comprehensive"),
});

// ============================================================================
// Router Definition
// ============================================================================

export const coachRouter = router({
  /**
   * Generate coaching suggestions for an existing prompt.
   *
   * Fetches the prompt from the database and analyzes it
   * for improvement opportunities.
   */
  generateSuggestions: authedProcedure
    .input(generateSuggestionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to use coaching",
        });
      }

      // Fetch the prompt
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // Check access: user owns it or it's public
      if (prompt.userId !== userId && !prompt.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to coach this prompt",
        });
      }

      // Extract variables from metadata
      const metadata = prompt.metadata as {
        variables?: Array<{
          name: string;
          description?: string;
          example?: string;
          required?: boolean;
        }>;
        description?: string;
      } | null;

      // Prepare prompt for coaching
      const promptForCoaching: PromptForCoaching = {
        title: prompt.title,
        description: metadata?.description || undefined,
        template: prompt.content,
        variables: metadata?.variables,
        tags: prompt.tags,
      };

      // Generate suggestions
      const result = await generateCoachingSuggestions(promptForCoaching, {
        focusArea: input.focusArea as CoachingArea,
      });

      // Log usage to database
      const usageLog = createCoachingUsageLogEntry(
        result,
        input.promptId,
        input.focusArea as CoachingArea,
        userId
      );

      await ctx.prisma.aiUsageLog.create({
        data: {
          userId: usageLog.userId,
          model: usageLog.model,
          provider: usageLog.provider,
          promptTokens: usageLog.promptTokens,
          completionTokens: usageLog.completionTokens,
          totalTokens: usageLog.totalTokens,
          cost: usageLog.cost,
          operation: usageLog.operation,
          metadata: usageLog.metadata as object,
        },
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to generate coaching suggestions",
        });
      }

      return {
        promptId: input.promptId,
        focusArea: input.focusArea,
        analysis: result.analysis,
        usage: {
          tokens: result.usage.totalTokens,
          cost: result.usage.estimatedCost,
          durationMs: result.durationMs,
        },
      };
    }),

  /**
   * Generate coaching suggestions for a prompt draft.
   *
   * Analyzes prompt content directly without saving to database.
   * Useful for getting feedback before saving a prompt.
   */
  coachDraft: authedProcedure
    .input(coachPromptDirectInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to use coaching",
        });
      }

      // Prepare prompt for coaching
      const promptForCoaching: PromptForCoaching = {
        title: input.title,
        description: input.description,
        template: input.template,
        variables: input.variables,
        tags: input.tags,
      };

      // Generate suggestions
      const result = await generateCoachingSuggestions(promptForCoaching, {
        focusArea: input.focusArea as CoachingArea,
      });

      // Log usage to database (without promptId since it's a draft)
      const usageLog = createCoachingUsageLogEntry(
        result,
        "draft",
        input.focusArea as CoachingArea,
        userId
      );

      await ctx.prisma.aiUsageLog.create({
        data: {
          userId: usageLog.userId,
          model: usageLog.model,
          provider: usageLog.provider,
          promptTokens: usageLog.promptTokens,
          completionTokens: usageLog.completionTokens,
          totalTokens: usageLog.totalTokens,
          cost: usageLog.cost,
          operation: usageLog.operation,
          metadata: usageLog.metadata as object,
        },
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to generate coaching suggestions",
        });
      }

      return {
        focusArea: input.focusArea,
        analysis: result.analysis,
        usage: {
          tokens: result.usage.totalTokens,
          cost: result.usage.estimatedCost,
          durationMs: result.durationMs,
        },
      };
    }),

  /**
   * Get available coaching focus areas with descriptions.
   */
  getFocusAreas: authedProcedure.query(() => {
    return [
      {
        id: "comprehensive",
        name: "Comprehensive Review",
        description: "Full analysis across all dimensions",
        icon: "sparkles",
      },
      {
        id: "clarity",
        name: "Clarity",
        description: "Is the prompt clear and unambiguous?",
        icon: "eye",
      },
      {
        id: "structure",
        name: "Structure",
        description: "Is the prompt well-organized?",
        icon: "layout",
      },
      {
        id: "variables",
        name: "Variables",
        description: "Are placeholders well-defined?",
        icon: "brackets",
      },
      {
        id: "specificity",
        name: "Specificity",
        description: "Is there enough context and constraints?",
        icon: "target",
      },
      {
        id: "output_format",
        name: "Output Format",
        description: "Is the expected output specified?",
        icon: "file-text",
      },
    ];
  }),
});
