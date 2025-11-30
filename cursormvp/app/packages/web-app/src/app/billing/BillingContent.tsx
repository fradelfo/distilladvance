'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Loader2, CreditCard, Settings } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    key: 'FREE' as const,
    priceMonthly: 0,
    priceYearly: 0,
    description: 'For individuals getting started',
    features: [
      'Up to 10 prompts',
      '1 workspace',
      'Basic prompt editor',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    key: 'PRO' as const,
    priceMonthly: 12,
    priceYearly: 120,
    description: 'For power users',
    features: [
      'Up to 100 prompts',
      '5 workspaces',
      'Advanced prompt editor',
      'AI-powered coach',
      'Semantic search',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Team',
    key: 'TEAM' as const,
    priceMonthly: 25,
    priceYearly: 250,
    description: 'For teams and organizations',
    features: [
      'Unlimited prompts',
      'Unlimited workspaces',
      'Up to 10 team members',
      'All Pro features',
      'Team analytics',
      'Admin controls',
      'SSO (coming soon)',
    ],
  },
];

type PlanKey = 'FREE' | 'PRO' | 'TEAM';
type BillingInterval = 'monthly' | 'yearly';

export function BillingContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [currentPlan, setCurrentPlan] = useState<PlanKey>('FREE');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState<PlanKey | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Thank you for upgrading.');
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled. No changes were made.');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect from page.tsx
  }

  const user = {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image || null,
  };

  const handleUpgrade = async (plan: PlanKey) => {
    if (plan === 'FREE') return;

    setIsLoading(plan);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval: billingInterval }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to start checkout');
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to open billing portal');
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  return (
    <AppLayout user={user} currentPage="billing">
      <div className="max-w-5xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Choose your plan
          </h1>
          <p className="mt-2 text-muted-foreground">
            Start free, upgrade when you need more
          </p>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                billingInterval === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                billingInterval === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600 font-semibold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const isCurrentPlan = currentPlan === plan.key;
            const isUpgrade = plan.key !== 'FREE' && !isCurrentPlan;

            return (
              <div
                key={plan.key}
                className={cn(
                  'relative rounded-lg border bg-background p-6 shadow-sm',
                  plan.popular && 'border-primary ring-1 ring-primary'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>

                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      ${price}
                    </span>
                    {plan.key !== 'FREE' && (
                      <span className="text-muted-foreground">
                        /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : plan.key === 'FREE' ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={isLoading !== null}
                    >
                      {isLoading === plan.key ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isUpgrade ? 'Upgrade' : 'Get Started'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Manage Subscription */}
        {currentPlan !== 'FREE' && (
          <div className="text-center pt-8 border-t">
            <p className="text-muted-foreground mb-4">
              Manage your subscription, update payment method, or cancel anytime
            </p>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
            >
              {isLoadingPortal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </Button>
          </div>
        )}

        {/* FAQ */}
        <div className="pt-8 border-t">
          <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-foreground">
                Can I change plans later?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Yes! You can upgrade or downgrade at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                What happens when I reach my limits?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;ll be notified before reaching limits and can upgrade to continue creating.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Is there a free trial?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                The Free plan is free forever. No credit card required to get started.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                How do I cancel?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click &quot;Manage Subscription&quot; above to cancel anytime. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
