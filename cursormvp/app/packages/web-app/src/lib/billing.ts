/**
 * Billing Service
 *
 * Handles Stripe checkout, customer portal, and subscription management.
 */

import { prisma } from '@/lib/prisma';
import { PLANS, type PlanType, stripe } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string | null> {
  if (!stripe) {
    console.warn('[Billing] Stripe not configured');
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Return existing customer ID
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id,
    },
  });

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  plan: PlanType
): Promise<string | null> {
  if (!stripe) {
    console.warn('[Billing] Stripe not configured');
    return null;
  }

  const customerId = await getOrCreateStripeCustomer(userId);
  if (!customerId) {
    throw new Error('Failed to create Stripe customer');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/billing?success=true`,
    cancel_url: `${APP_URL}/billing?canceled=true`,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
  });

  return session.url;
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(userId: string): Promise<string | null> {
  if (!stripe) {
    console.warn('[Billing] Stripe not configured');
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found for user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${APP_URL}/billing`,
  });

  return session.url;
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Return default free plan
    return {
      plan: 'FREE' as const,
      status: 'ACTIVE' as const,
      limits: PLANS.FREE.limits,
    };
  }

  return {
    ...subscription,
    limits: PLANS[subscription.plan].limits,
  };
}

/**
 * Update subscription from Stripe webhook
 */
export async function updateSubscriptionFromStripe(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  canceledAt: Date | null
) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.warn('[Billing] Subscription not found:', stripeSubscriptionId);
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<
    string,
    'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' | 'INCOMPLETE'
  > = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    trialing: 'TRIALING',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE',
  };

  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      status: statusMap[status] || 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
    },
  });
}

/**
 * Create subscription record when checkout completes
 */
export async function createSubscriptionFromCheckout(
  userId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  plan: PlanType,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
) {
  // Upsert subscription (update if exists, create if not)
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId,
      stripePriceId,
      plan,
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
    },
    update: {
      stripeSubscriptionId,
      stripePriceId,
      plan,
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });
}

/**
 * Handle subscription deleted
 */
export async function handleSubscriptionDeleted(stripeSubscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    return;
  }

  // Downgrade to free plan
  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      plan: 'FREE',
      status: 'CANCELED',
      stripeSubscriptionId: null,
      stripePriceId: null,
      canceledAt: new Date(),
    },
  });
}

/**
 * Check if user has access to a feature based on their plan
 */
export async function checkPlanLimits(
  userId: string,
  resource: 'prompts' | 'workspaces' | 'members'
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const subscription = await getUserSubscription(userId);
  const limit = subscription.limits[resource];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, current: 0 };
  }

  let current = 0;

  switch (resource) {
    case 'prompts':
      current = await prisma.prompt.count({ where: { userId } });
      break;
    case 'workspaces':
      current = await prisma.workspaceMember.count({
        where: { userId, role: 'OWNER' },
      });
      break;
    case 'members':
      // This would need workspace context
      current = 0;
      break;
  }

  return {
    allowed: current < limit,
    limit,
    current,
  };
}
