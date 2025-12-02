/**
 * Analytics Service
 *
 * Server-side analytics tracking using PostHog.
 * Handles event capture, user identification, and metrics aggregation.
 */

import type {
  ActivationFunnelMetrics,
  AnalyticsBaseProperties,
  AnalyticsEventType,
  ChatCapturedProperties,
  CoachUsedProperties,
  DashboardMetrics,
  EngagementMetrics,
  FeatureAdoptionMetrics,
  MemberInvitedProperties,
  PromptCreatedProperties,
  PromptEditedProperties,
  PromptRunProperties,
  SearchPerformedProperties,
  TeamHealthMetrics,
  UserSignedUpProperties,
  WorkspaceCreatedProperties,
} from '@distill/shared-types';
import { PostHog } from 'posthog-node';
import { env } from '../lib/env.js';

// Re-export types for consumers of this service
export type {
  ActivationFunnelMetrics,
  EngagementMetrics,
  TeamHealthMetrics,
  FeatureAdoptionMetrics,
  DashboardMetrics,
};

// ============================================================================
// PostHog Client
// ============================================================================

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!env.ANALYTICS_ENABLED) {
    return null;
  }

  if (!posthogClient && env.POSTHOG_API_KEY) {
    posthogClient = new PostHog(env.POSTHOG_API_KEY, {
      host: env.POSTHOG_HOST,
      flushAt: 20,
      flushInterval: 10000,
    });
  }

  return posthogClient;
}

// ============================================================================
// Event Tracking
// ============================================================================

/**
 * Track an analytics event.
 */
export async function trackEvent<T extends AnalyticsBaseProperties>(
  eventName: AnalyticsEventType,
  properties: T
): Promise<void> {
  const client = getPostHogClient();

  if (!client) {
    if (env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}:`, JSON.stringify(properties, null, 2));
    }
    return;
  }

  try {
    client.capture({
      distinctId: properties.userId || 'anonymous',
      event: eventName,
      properties: {
        ...properties,
        $set: properties.userId
          ? {
              workspaceId: properties.workspaceId,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error(`[Analytics] Failed to track ${eventName}:`, error);
  }
}

/**
 * Track user signup event.
 */
export async function trackUserSignup(
  properties: Omit<UserSignedUpProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('user_signed_up', {
    ...properties,
    timestamp: new Date().toISOString(),
  });

  // Also identify the user
  const client = getPostHogClient();
  if (client && properties.userId) {
    client.identify({
      distinctId: properties.userId,
      properties: {
        signupMethod: properties.method,
        signupSource: properties.source,
      },
    });
  }
}

/**
 * Track workspace creation event.
 */
export async function trackWorkspaceCreated(
  properties: Omit<WorkspaceCreatedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('workspace_created', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track chat capture event.
 */
export async function trackChatCaptured(
  properties: Omit<ChatCapturedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('chat_captured', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track prompt creation event.
 */
export async function trackPromptCreated(
  properties: Omit<PromptCreatedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('prompt_created', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track prompt run event.
 */
export async function trackPromptRun(
  properties: Omit<PromptRunProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('prompt_run', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track prompt edit event.
 */
export async function trackPromptEdited(
  properties: Omit<PromptEditedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('prompt_edited', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track coach usage event.
 */
export async function trackCoachUsed(
  properties: Omit<CoachUsedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('coach_used', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track member invite event.
 */
export async function trackMemberInvited(
  properties: Omit<MemberInvitedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('member_invited', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track search event.
 */
export async function trackSearchPerformed(
  properties: Omit<SearchPerformedProperties, 'timestamp'>
): Promise<void> {
  await trackEvent('search_performed', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// Metrics Aggregation
// ============================================================================

import { prisma } from '../lib/prisma.js';

/**
 * Get activation funnel metrics.
 */
export async function getActivationMetrics(
  startDate: Date,
  endDate: Date
): Promise<ActivationFunnelMetrics> {
  const [
    signups,
    workspacesCreated,
    usersWithExtension,
    usersWithFirstCapture,
    usersWithThreeCaptures,
  ] = await Promise.all([
    // Total signups in period
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Workspaces created
    prisma.workspace.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Users with extension installed (approximated by having at least one conversation)
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        conversations: { some: {} },
      },
    }),
    // Users with first capture
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        prompts: { some: {} },
      },
    }),
    // Users with 3+ prompts (activated) - use raw query since Prisma doesn't support HAVING on count
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM (
        SELECT "userId"
        FROM "Prompt"
        WHERE "userId" IN (
          SELECT id FROM "User" WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        )
        GROUP BY "userId"
        HAVING COUNT(*) >= 3
      ) as activated_users
    `
      .then((result) => Number(result[0]?.count || 0))
      .catch(() => 0),
  ]);

  // Calculate conversion rates
  const signupToWorkspace = signups > 0 ? workspacesCreated / signups : 0;
  const workspaceToExtension = workspacesCreated > 0 ? usersWithExtension / workspacesCreated : 0;
  const extensionToFirstCapture =
    usersWithExtension > 0 ? usersWithFirstCapture / usersWithExtension : 0;
  const firstToThirdCapture =
    usersWithFirstCapture > 0 ? usersWithThreeCaptures / usersWithFirstCapture : 0;
  const overall = signups > 0 ? usersWithThreeCaptures / signups : 0;

  return {
    signups,
    workspacesCreated,
    extensionsInstalled: usersWithExtension,
    firstCapture: usersWithFirstCapture,
    thirdCapture: usersWithThreeCaptures,
    conversionRates: {
      signupToWorkspace: Math.round(signupToWorkspace * 100) / 100,
      workspaceToExtension: Math.round(workspaceToExtension * 100) / 100,
      extensionToFirstCapture: Math.round(extensionToFirstCapture * 100) / 100,
      firstToThirdCapture: Math.round(firstToThirdCapture * 100) / 100,
      overall: Math.round(overall * 100) / 100,
    },
  };
}

/**
 * Get engagement metrics.
 */
export async function getEngagementMetrics(
  startDate: Date,
  endDate: Date
): Promise<EngagementMetrics> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dau, wau, mau, totalPrompts, totalUsers, promptsWithRuns] = await Promise.all([
    // Daily active users (users who created/edited prompts in last 24h)
    prisma.user.count({
      where: {
        OR: [{ prompts: { some: { updatedAt: { gte: dayAgo } } } }, { updatedAt: { gte: dayAgo } }],
      },
    }),
    // Weekly active users
    prisma.user.count({
      where: {
        OR: [
          { prompts: { some: { updatedAt: { gte: weekAgo } } } },
          { updatedAt: { gte: weekAgo } },
        ],
      },
    }),
    // Monthly active users
    prisma.user.count({
      where: {
        OR: [
          { prompts: { some: { updatedAt: { gte: monthAgo } } } },
          { updatedAt: { gte: monthAgo } },
        ],
      },
    }),
    // Total prompts
    prisma.prompt.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Total users
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Average runs per prompt
    prisma.prompt.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _avg: {
        usageCount: true,
      },
    }),
  ]);

  const promptsPerUser = totalUsers > 0 ? totalPrompts / totalUsers : 0;
  const runsPerPrompt = promptsWithRuns._avg.usageCount || 0;

  return {
    dailyActiveUsers: dau,
    weeklyActiveUsers: wau,
    monthlyActiveUsers: mau,
    promptsPerUser: Math.round(promptsPerUser * 100) / 100,
    runsPerPrompt: Math.round(runsPerPrompt * 100) / 100,
    averageSessionDuration: 0, // Would need session tracking
  };
}

/**
 * Get team health metrics.
 */
export async function getTeamHealthMetrics(
  startDate: Date,
  endDate: Date
): Promise<TeamHealthMetrics> {
  const [activeWorkspaces, workspaceMembers, sharedPrompts] = await Promise.all([
    // Active workspaces (with activity in period)
    prisma.workspace.count({
      where: {
        updatedAt: { gte: startDate, lte: endDate },
      },
    }),
    // Average members per workspace
    prisma.workspaceMember.groupBy({
      by: ['workspaceId'],
      _count: true,
    }),
    // Shared prompts (public prompts with usage)
    prisma.prompt.count({
      where: {
        isPublic: true,
        usageCount: { gt: 1 },
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const totalMembers = workspaceMembers.reduce((sum, ws) => sum + ws._count, 0);
  const seatsPerWorkspace =
    workspaceMembers.length > 0 ? totalMembers / workspaceMembers.length : 0;

  const totalPublicPrompts = await prisma.prompt.count({
    where: {
      isPublic: true,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const sharedPromptsUsage = totalPublicPrompts > 0 ? sharedPrompts / totalPublicPrompts : 0;

  return {
    activeWorkspaces,
    seatsPerWorkspace: Math.round(seatsPerWorkspace * 100) / 100,
    sharedPromptsUsage: Math.round(sharedPromptsUsage * 100) / 100,
    collaborationRate: 0, // Would need more tracking
  };
}

/**
 * Get feature adoption metrics.
 */
export async function getFeatureAdoptionMetrics(
  startDate: Date,
  endDate: Date
): Promise<FeatureAdoptionMetrics> {
  const [, promptsByPrivacy, conversationsBySource] = await Promise.all([
    // Total users (kept for potential future use)
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    // Privacy mode distribution
    prisma.conversation.groupBy({
      by: ['privacyMode'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
    // Platform distribution
    prisma.conversation.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
  ]);

  // Calculate privacy distribution
  const privacyDistribution = {
    promptOnly: 0,
    fullChat: 0,
  };

  for (const item of promptsByPrivacy) {
    if (item.privacyMode === 'PROMPT_ONLY') {
      privacyDistribution.promptOnly = item._count;
    } else if (item.privacyMode === 'FULL') {
      privacyDistribution.fullChat = item._count;
    }
  }

  // Calculate platform distribution
  const platformDistribution: Record<string, number> = {
    chatgpt: 0,
    claude: 0,
    gemini: 0,
    copilot: 0,
    other: 0,
  };

  for (const item of conversationsBySource) {
    const source = item.source?.toLowerCase() || 'other';
    if (source in platformDistribution) {
      platformDistribution[source] = item._count;
    } else {
      platformDistribution.other += item._count;
    }
  }

  return {
    coachUsageRate: 0, // Would need coach tracking
    semanticSearchUsageRate: 0, // Would need search tracking
    privacyModeDistribution: privacyDistribution,
    platformDistribution: platformDistribution as Record<any, number>,
  };
}

/**
 * Get all dashboard metrics.
 */
export async function getDashboardMetrics(
  startDate: Date,
  endDate: Date
): Promise<DashboardMetrics> {
  const [activation, engagement, teamHealth, featureAdoption] = await Promise.all([
    getActivationMetrics(startDate, endDate),
    getEngagementMetrics(startDate, endDate),
    getTeamHealthMetrics(startDate, endDate),
    getFeatureAdoptionMetrics(startDate, endDate),
  ]);

  return {
    activation,
    engagement,
    teamHealth,
    featureAdoption,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Flush pending events and shutdown.
 */
export async function shutdownAnalytics(): Promise<void> {
  const client = getPostHogClient();
  if (client) {
    await client.shutdown();
    posthogClient = null;
  }
}
