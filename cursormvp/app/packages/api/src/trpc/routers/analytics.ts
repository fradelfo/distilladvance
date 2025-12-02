/**
 * Analytics tRPC Router
 *
 * Provides endpoints for tracking events and retrieving dashboard metrics.
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  getActivationMetrics,
  getDashboardMetrics,
  getEngagementMetrics,
  getFeatureAdoptionMetrics,
  getTeamHealthMetrics,
  trackChatCaptured,
  trackCoachUsed,
  trackMemberInvited,
  trackPromptCreated,
  trackPromptEdited,
  trackPromptRun,
  trackSearchPerformed,
} from '../../services/analytics.js';
import { authedProcedure, router } from '../index.js';

// ============================================================================
// Validation Schemas
// ============================================================================

const conversationSourceSchema = z.enum(['chatgpt', 'claude', 'gemini', 'copilot', 'other']);

const privacyModeSchema = z.enum(['prompt_only', 'full_chat']);

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const trackChatCapturedSchema = z.object({
  platform: conversationSourceSchema,
  privacyMode: privacyModeSchema,
  tokenCount: z.number().int().min(0),
  messageCount: z.number().int().min(0),
  workspaceId: z.string().optional(),
});

const trackPromptCreatedSchema = z.object({
  source: z.enum(['capture', 'manual', 'import']),
  hasVariables: z.boolean(),
  variableCount: z.number().int().min(0),
  tagCount: z.number().int().min(0),
  workspaceId: z.string().optional(),
});

const trackPromptRunSchema = z.object({
  promptId: z.string().min(1),
  platform: conversationSourceSchema.or(z.literal('clipboard')),
  variableCount: z.number().int().min(0),
  isShared: z.boolean(),
  workspaceId: z.string().optional(),
});

const trackPromptEditedSchema = z.object({
  promptId: z.string().min(1),
  editType: z.enum(['title', 'content', 'variables', 'tags', 'multiple']),
  timeSinceCreationMs: z.number().int().min(0),
  workspaceId: z.string().optional(),
});

const trackCoachUsedSchema = z.object({
  promptId: z.string().min(1),
  suggestionsShown: z.number().int().min(0),
  suggestionsApplied: z.number().int().min(0),
  focusArea: z.string().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  workspaceId: z.string().optional(),
});

const trackMemberInvitedSchema = z.object({
  count: z.number().int().min(1),
  method: z.enum(['email', 'link']),
  workspaceId: z.string().optional(),
});

const trackSearchPerformedSchema = z.object({
  queryLength: z.number().int().min(0),
  resultsCount: z.number().int().min(0),
  searchType: z.enum(['text', 'semantic']),
  hasFilters: z.boolean(),
  workspaceId: z.string().optional(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const analyticsRouter = router({
  /**
   * Track a chat capture event.
   */
  trackChatCaptured: authedProcedure
    .input(trackChatCapturedSchema)
    .mutation(async ({ ctx, input }) => {
      await trackChatCaptured({
        userId: ctx.userId,
        workspaceId: input.workspaceId,
        platform: input.platform,
        privacyMode: input.privacyMode,
        tokenCount: input.tokenCount,
        messageCount: input.messageCount,
      });

      return { success: true };
    }),

  /**
   * Track a prompt creation event.
   */
  trackPromptCreated: authedProcedure
    .input(trackPromptCreatedSchema)
    .mutation(async ({ ctx, input }) => {
      await trackPromptCreated({
        userId: ctx.userId,
        workspaceId: input.workspaceId,
        source: input.source,
        hasVariables: input.hasVariables,
        variableCount: input.variableCount,
        tagCount: input.tagCount,
      });

      return { success: true };
    }),

  /**
   * Track a prompt run event.
   */
  trackPromptRun: authedProcedure.input(trackPromptRunSchema).mutation(async ({ ctx, input }) => {
    await trackPromptRun({
      userId: ctx.userId,
      workspaceId: input.workspaceId,
      promptId: input.promptId,
      platform: input.platform,
      variableCount: input.variableCount,
      isShared: input.isShared,
    });

    return { success: true };
  }),

  /**
   * Track a prompt edit event.
   */
  trackPromptEdited: authedProcedure
    .input(trackPromptEditedSchema)
    .mutation(async ({ ctx, input }) => {
      await trackPromptEdited({
        userId: ctx.userId,
        workspaceId: input.workspaceId,
        promptId: input.promptId,
        editType: input.editType,
        timeSinceCreationMs: input.timeSinceCreationMs,
      });

      return { success: true };
    }),

  /**
   * Track a coach usage event.
   */
  trackCoachUsed: authedProcedure.input(trackCoachUsedSchema).mutation(async ({ ctx, input }) => {
    await trackCoachUsed({
      userId: ctx.userId,
      workspaceId: input.workspaceId,
      promptId: input.promptId,
      suggestionsShown: input.suggestionsShown,
      suggestionsApplied: input.suggestionsApplied,
      focusArea: input.focusArea,
      qualityScore: input.qualityScore,
    });

    return { success: true };
  }),

  /**
   * Track a member invite event.
   */
  trackMemberInvited: authedProcedure
    .input(trackMemberInvitedSchema)
    .mutation(async ({ ctx, input }) => {
      await trackMemberInvited({
        userId: ctx.userId,
        workspaceId: input.workspaceId,
        count: input.count,
        method: input.method,
      });

      return { success: true };
    }),

  /**
   * Track a search event.
   */
  trackSearchPerformed: authedProcedure
    .input(trackSearchPerformedSchema)
    .mutation(async ({ ctx, input }) => {
      await trackSearchPerformed({
        userId: ctx.userId,
        workspaceId: input.workspaceId,
        queryLength: input.queryLength,
        resultsCount: input.resultsCount,
        searchType: input.searchType,
        hasFilters: input.hasFilters,
      });

      return { success: true };
    }),

  /**
   * Get full dashboard metrics.
   * Admin only in production, but available in development.
   */
  getDashboard: authedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view analytics',
      });
    }

    // Default to last 30 days
    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const startDate = input.startDate
      ? new Date(input.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await getDashboardMetrics(startDate, endDate);

    return metrics;
  }),

  /**
   * Get activation funnel metrics only.
   */
  getActivationFunnel: authedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view analytics',
      });
    }

    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const startDate = input.startDate
      ? new Date(input.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return getActivationMetrics(startDate, endDate);
  }),

  /**
   * Get engagement metrics only.
   */
  getEngagement: authedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view analytics',
      });
    }

    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const startDate = input.startDate
      ? new Date(input.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return getEngagementMetrics(startDate, endDate);
  }),

  /**
   * Get team health metrics only.
   */
  getTeamHealth: authedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view analytics',
      });
    }

    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const startDate = input.startDate
      ? new Date(input.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return getTeamHealthMetrics(startDate, endDate);
  }),

  /**
   * Get feature adoption metrics only.
   */
  getFeatureAdoption: authedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view analytics',
      });
    }

    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const startDate = input.startDate
      ? new Date(input.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return getFeatureAdoptionMetrics(startDate, endDate);
  }),
});
