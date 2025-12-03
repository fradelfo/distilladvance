'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UsageItem {
  label: string;
  current: number;
  limit: number;
  /** -1 means unlimited */
}

interface UsageDisplayProps {
  /** List of usage items to display */
  usage: UsageItem[];
  /** Whether to show a compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show upgrade link when approaching limits */
  showUpgradeLink?: boolean;
}

function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  return Math.min((current / limit) * 100, 100);
}

function getUsageStatus(
  current: number,
  limit: number
): 'ok' | 'warning' | 'critical' | 'unlimited' {
  if (limit === -1) return 'unlimited';
  const percentage = (current / limit) * 100;
  if (percentage >= 100) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'ok';
}

function UsageBar({ item, compact }: { item: UsageItem; compact?: boolean }) {
  const percentage = getUsagePercentage(item.current, item.limit);
  const status = getUsageStatus(item.current, item.limit);

  const statusColors = {
    ok: 'bg-primary',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    unlimited: 'bg-green-500',
  };

  const statusIcons = {
    ok: null,
    warning: <TrendingUp className="h-3.5 w-3.5 text-amber-500" />,
    critical: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
    unlimited: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  };

  return (
    <div className={cn('space-y-1.5', compact && 'space-y-1')}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', compact && 'text-xs')}>{item.label}</span>
        <div className="flex items-center gap-1.5">
          {statusIcons[status]}
          <span className={cn('text-sm text-muted-foreground', compact && 'text-xs')}>
            {item.limit === -1 ? (
              <span className="text-green-600">{item.current} (unlimited)</span>
            ) : (
              <>
                {item.current} / {item.limit}
              </>
            )}
          </span>
        </div>
      </div>
      {item.limit !== -1 && (
        <Progress
          value={percentage}
          className={cn('h-2', compact && 'h-1.5')}
          indicatorClassName={statusColors[status]}
        />
      )}
    </div>
  );
}

export function UsageDisplay({
  usage,
  compact = false,
  className,
  showUpgradeLink = true,
}: UsageDisplayProps) {
  const hasWarning = usage.some((item) => getUsageStatus(item.current, item.limit) === 'warning');
  const hasCritical = usage.some((item) => getUsageStatus(item.current, item.limit) === 'critical');

  return (
    <div className={cn('space-y-4', compact && 'space-y-2', className)}>
      {usage.map((item) => (
        <UsageBar key={item.label} item={item} compact={compact} />
      ))}

      {showUpgradeLink && (hasWarning || hasCritical) && (
        <div
          className={cn(
            'rounded-md p-2 text-xs',
            hasCritical ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
          )}
        >
          {hasCritical ? (
            <span>
              You've reached your plan limits.{' '}
              <Link href="/billing" className="font-medium underline">
                Upgrade now
              </Link>{' '}
              to continue.
            </span>
          ) : (
            <span>
              Approaching your limits.{' '}
              <Link href="/billing" className="font-medium underline">
                Consider upgrading
              </Link>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook-friendly component for displaying usage from tRPC query
 */
interface UsageFromQueryProps {
  promptCount?: number;
  promptLimit?: number;
  workspaceCount?: number;
  workspaceLimit?: number;
  compact?: boolean;
  className?: string;
}

export function UsageSummary({
  promptCount = 0,
  promptLimit = 10,
  workspaceCount = 0,
  workspaceLimit = 1,
  compact = false,
  className,
}: UsageFromQueryProps) {
  const usage: UsageItem[] = [
    { label: 'Prompts', current: promptCount, limit: promptLimit },
    { label: 'Workspaces', current: workspaceCount, limit: workspaceLimit },
  ];

  return <UsageDisplay usage={usage} compact={compact} className={className} />;
}
