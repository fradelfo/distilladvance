/**
 * Billing Utilities
 *
 * Shared billing helpers for plan limit enforcement and feature gating.
 */

import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

// ============================================================================
// Plan Configuration
// ============================================================================

export const PLANS = {
  FREE: {
    name: 'Free',
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
export type Feature = keyof typeof PLANS.FREE.features;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's current plan
 */
export async function getUserPlan(prisma: PrismaClient, userId: string): Promise<PlanType> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  // If no subscription or not active, return FREE
  if (!subscription || subscription.status !== 'ACTIVE') {
    return 'FREE';
  }

  return subscription.plan as PlanType;
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  prisma: PrismaClient,
  userId: string,
  feature: Feature
): Promise<boolean> {
  const plan = await getUserPlan(prisma, userId);
  return PLANS[plan].features[feature];
}

/**
 * Enforce feature access - throws if not allowed
 */
export async function requireFeature(
  prisma: PrismaClient,
  userId: string,
  feature: Feature,
  featureName: string
): Promise<void> {
  const hasAccess = await hasFeatureAccess(prisma, userId, feature);

  if (!hasAccess) {
    const plan = await getUserPlan(prisma, userId);
    const requiredPlan = feature === 'workflows' ? 'TEAM' : 'PRO';

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${featureName} requires ${requiredPlan} plan. You are currently on the ${plan} plan.`,
      cause: {
        type: 'UPGRADE_REQUIRED',
        requiredPlan,
        currentPlan: plan,
        feature,
      },
    });
  }
}

/**
 * Check if user can create more of a resource
 */
export async function checkResourceLimit(
  prisma: PrismaClient,
  userId: string,
  resource: 'prompts' | 'workspaces',
  workspaceId?: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getUserPlan(prisma, userId);
  const limit = PLANS[plan].limits[resource];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  let current: number;

  switch (resource) {
    case 'prompts':
      current = await prisma.prompt.count({ where: { userId } });
      break;
    case 'workspaces':
      current = await prisma.workspaceMember.count({
        where: { userId, role: 'OWNER' },
      });
      break;
    default:
      current = 0;
  }

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Enforce resource limit - throws if limit exceeded
 */
export async function requireResourceLimit(
  prisma: PrismaClient,
  userId: string,
  resource: 'prompts' | 'workspaces',
  resourceName: string
): Promise<void> {
  const { allowed, current, limit } = await checkResourceLimit(prisma, userId, resource);

  if (!allowed) {
    const plan = await getUserPlan(prisma, userId);

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You've reached your limit of ${limit} ${resourceName}. Upgrade your plan to create more.`,
      cause: {
        type: 'LIMIT_EXCEEDED',
        resource,
        current,
        limit,
        currentPlan: plan,
      },
    });
  }
}

/**
 * Check workspace member limit
 */
export async function checkMemberLimit(
  prisma: PrismaClient,
  workspaceId: string,
  ownerId: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getUserPlan(prisma, ownerId);
  const limit = PLANS[plan].limits.members as number;

  // -1 means unlimited (future-proofing for enterprise plans)
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const current = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Enforce member limit - throws if limit exceeded
 */
export async function requireMemberLimit(
  prisma: PrismaClient,
  workspaceId: string,
  ownerId: string
): Promise<void> {
  const { allowed, current, limit } = await checkMemberLimit(prisma, workspaceId, ownerId);

  if (!allowed) {
    const plan = await getUserPlan(prisma, ownerId);

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `This workspace has reached its limit of ${limit} members. The workspace owner needs to upgrade their plan to invite more members.`,
      cause: {
        type: 'LIMIT_EXCEEDED',
        resource: 'members',
        current,
        limit,
        currentPlan: plan,
      },
    });
  }
}
