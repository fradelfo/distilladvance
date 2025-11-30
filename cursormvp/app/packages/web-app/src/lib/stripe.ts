/**
 * Stripe Client Configuration
 *
 * Server-side Stripe client for billing operations.
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is required in production');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  : null;

// Stripe price IDs from environment
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  TEAM_MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY || '',
  TEAM_YEARLY: process.env.STRIPE_PRICE_TEAM_YEARLY || '',
} as const;

// Webhook secret for verifying Stripe webhook signatures
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Plans configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    description: 'For individuals getting started',
    limits: {
      prompts: 10,
      workspaces: 1,
      members: 1,
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
  },
} as const;

export type PlanType = keyof typeof PLANS;
