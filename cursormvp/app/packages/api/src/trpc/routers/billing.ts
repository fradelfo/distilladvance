/**
 * Billing tRPC Router
 *
 * Provides subscription status, usage information, and plan limit checks.
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authedProcedure, router } from '../index.js';

// ============================================================================
// Plan Configuration (mirrors web-app/src/lib/stripe.ts)
// ============================================================================

export const PLANS = {
  FREE: {
    name: 'Free',
    description: 'For individuals getting started',
    limits: {
      prompts: 10,
      workspaces: 1,
      members: 1,
    },
    features: {
      semanticSearch: false,
      coach: false,
      workflows: false,
    },
  },
  PRO: {
    name: 'Pro',
    description: 'For power users',
    priceMonthly: 12,
    priceYearly: 120,
    limits: {
      prompts: 100,
      workspaces: 5,
      members: 1,
    },
    features: {
      semanticSearch: true,
      coach: true,
      workflows: false,
    },
  },
  TEAM: {
    name: 'Team',
    description: 'For teams and organizations',
    priceMonthly: 25,
    priceYearly: 250,
    limits: {
      prompts: -1, // unlimited
      workspaces: -1, // unlimited
      members: 10,
    },
    features: {
      semanticSearch: true,
      coach: true,
      workflows: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

// ============================================================================
// Router Definition
// ============================================================================

export const billingRouter = router({
  /**
   * Get user's current subscription status
   */
  getSubscription: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Return default free plan
      return {
        plan: 'FREE' as PlanType,
        status: 'ACTIVE' as const,
        limits: PLANS.FREE.limits,
        features: PLANS.FREE.features,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const plan = PLANS[subscription.plan];

    return {
      plan: subscription.plan as PlanType,
      status: subscription.status,
      limits: plan.limits,
      features: plan.features,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }),

  /**
   * Get current usage against plan limits
   */
  getUsage: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    // Get subscription
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId },
    });

    const plan = subscription?.plan || 'FREE';
    const limits = PLANS[plan as PlanType].limits;

    // Get current usage counts
    const [promptCount, workspaceCount] = await Promise.all([
      ctx.prisma.prompt.count({ where: { userId } }),
      ctx.prisma.workspaceMember.count({
        where: { userId, role: 'OWNER' },
      }),
    ]);

    return {
      plan: plan as PlanType,
      prompts: {
        used: promptCount,
        limit: limits.prompts,
        remaining: limits.prompts === -1 ? -1 : Math.max(0, limits.prompts - promptCount),
      },
      workspaces: {
        used: workspaceCount,
        limit: limits.workspaces,
        remaining:
          limits.workspaces === -1 ? -1 : Math.max(0, limits.workspaces - workspaceCount),
      },
    };
  }),

  /**
   * Check if a specific action is allowed
   */
  canPerform: authedProcedure
    .input(
      z.object({
        action: z.enum(['createPrompt', 'createWorkspace', 'inviteMember', 'useSemanticSearch', 'useCoach', 'createWorkflow']),
        workspaceId: z.string().optional(), // For member count check
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      // Get subscription
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { userId },
      });

      const plan = (subscription?.plan || 'FREE') as PlanType;
      const limits = PLANS[plan].limits;
      const features = PLANS[plan].features;

      // Feature checks (not count-based)
      if (input.action === 'useSemanticSearch') {
        return {
          allowed: features.semanticSearch,
          reason: features.semanticSearch ? null : 'Semantic search requires PRO or TEAM plan',
          requiredPlan: 'PRO' as PlanType,
        };
      }

      if (input.action === 'useCoach') {
        return {
          allowed: features.coach,
          reason: features.coach ? null : 'Coach feature requires PRO or TEAM plan',
          requiredPlan: 'PRO' as PlanType,
        };
      }

      if (input.action === 'createWorkflow') {
        return {
          allowed: features.workflows,
          reason: features.workflows ? null : 'Workflows require TEAM plan',
          requiredPlan: 'TEAM' as PlanType,
        };
      }

      // Limit checks (count-based)
      if (input.action === 'createPrompt') {
        if (limits.prompts === -1) {
          return { allowed: true, reason: null };
        }
        const count = await ctx.prisma.prompt.count({ where: { userId } });
        const allowed = count < limits.prompts;
        return {
          allowed,
          reason: allowed ? null : `You've reached your limit of ${limits.prompts} prompts`,
          current: count,
          limit: limits.prompts,
        };
      }

      if (input.action === 'createWorkspace') {
        if (limits.workspaces === -1) {
          return { allowed: true, reason: null };
        }
        const count = await ctx.prisma.workspaceMember.count({
          where: { userId, role: 'OWNER' },
        });
        const allowed = count < limits.workspaces;
        return {
          allowed,
          reason: allowed ? null : `You've reached your limit of ${limits.workspaces} workspaces`,
          current: count,
          limit: limits.workspaces,
        };
      }

      if (input.action === 'inviteMember') {
        if (!input.workspaceId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'workspaceId is required for inviteMember check',
          });
        }

        const memberLimit = limits.members as number;
        // -1 means unlimited (future-proofing for enterprise plans)
        if (memberLimit === -1) {
          return { allowed: true, reason: null };
        }

        const memberCount = await ctx.prisma.workspaceMember.count({
          where: { workspaceId: input.workspaceId },
        });
        const allowed = memberCount < memberLimit;
        return {
          allowed,
          reason: allowed ? null : `This workspace has reached its limit of ${memberLimit} members`,
          current: memberCount,
          limit: memberLimit,
        };
      }

      return { allowed: true, reason: null };
    }),

  /**
   * Get available plans for upgrade UI
   */
  getPlans: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    // Get current plan
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId },
    });

    const currentPlan = (subscription?.plan || 'FREE') as PlanType;

    return {
      currentPlan,
      plans: Object.entries(PLANS).map(([key, plan]) => ({
        id: key as PlanType,
        name: plan.name,
        description: plan.description,
        priceMonthly: 'priceMonthly' in plan ? plan.priceMonthly : 0,
        priceYearly: 'priceYearly' in plan ? plan.priceYearly : 0,
        limits: plan.limits,
        features: plan.features,
        isCurrent: key === currentPlan,
      })),
    };
  }),
});
