'use client';

import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type UpgradeNudgeVariant = 'inline' | 'card' | 'banner';
type RequiredPlan = 'PRO' | 'TEAM';

interface UpgradeNudgeProps {
  /** What feature triggered the nudge */
  feature: string;
  /** What plan is required */
  requiredPlan: RequiredPlan;
  /** Current user plan */
  currentPlan?: string;
  /** Display variant */
  variant?: UpgradeNudgeVariant;
  /** Additional CSS classes */
  className?: string;
  /** Custom message to display */
  message?: string;
  /** Show CTA button */
  showCTA?: boolean;
}

const PLAN_BENEFITS: Record<RequiredPlan, string[]> = {
  PRO: [
    'Semantic & hybrid search',
    'AI-powered prompt coaching',
    'Up to 100 prompts',
    '5 workspaces',
  ],
  TEAM: [
    'Everything in Pro',
    'Workflow automation',
    'Unlimited prompts',
    'Team collaboration (10 members)',
  ],
};

export function UpgradeNudge({
  feature,
  requiredPlan,
  currentPlan = 'FREE',
  variant = 'card',
  className,
  message,
  showCTA = true,
}: UpgradeNudgeProps) {
  const defaultMessage = `${feature} requires a ${requiredPlan} plan. You're currently on ${currentPlan}.`;
  const displayMessage = message || defaultMessage;
  const benefits = PLAN_BENEFITS[requiredPlan];

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-muted-foreground',
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span>{displayMessage}</span>
        {showCTA && (
          <Link href="/billing" className="text-primary hover:underline font-medium">
            Upgrade
          </Link>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-500/20 p-2">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium">{displayMessage}</p>
            <p className="text-sm text-muted-foreground">
              Unlock powerful features with {requiredPlan}
            </p>
          </div>
        </div>
        {showCTA && (
          <Button asChild variant="default" size="sm">
            <Link href="/billing">
              Upgrade to {requiredPlan}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn('border-amber-500/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-500/20 p-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Upgrade to {requiredPlan}</CardTitle>
            <CardDescription>{displayMessage}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-amber-500" />
              {benefit}
            </li>
          ))}
        </ul>
        {showCTA && (
          <Button asChild className="w-full">
            <Link href="/billing">
              Upgrade to {requiredPlan}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
