'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, User } from 'lucide-react';
import Link from 'next/link';

type PlanType = 'FREE' | 'PRO' | 'TEAM';

interface PlanBadgeProps {
  plan: PlanType;
  /** Link to billing page on click */
  linkToBilling?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const PLAN_CONFIG: Record<
  PlanType,
  {
    label: string;
    icon: typeof User;
    variant: 'secondary' | 'default' | 'outline';
    className: string;
  }
> = {
  FREE: {
    label: 'Free',
    icon: User,
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground',
  },
  PRO: {
    label: 'Pro',
    icon: Sparkles,
    variant: 'default',
    className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0',
  },
  TEAM: {
    label: 'Team',
    icon: Crown,
    variant: 'default',
    className: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0',
  },
};

export function PlanBadge({
  plan,
  linkToBilling = true,
  showIcon = true,
  className,
}: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.variant}
      className={cn(
        'gap-1 font-medium',
        config.className,
        linkToBilling && 'cursor-pointer hover:opacity-90',
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );

  if (linkToBilling) {
    return <Link href="/billing">{badge}</Link>;
  }

  return badge;
}
