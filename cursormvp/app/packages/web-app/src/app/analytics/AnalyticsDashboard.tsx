'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';

type DateRange = '7d' | '30d' | '90d';

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch dashboard metrics
  const dashboardQuery = trpc.analytics.getDashboard.useQuery({
    startDate,
    endDate,
  });

  const { data: metrics, isLoading, error } = dashboardQuery;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600">Failed to load analytics: {error.message}</p>
        <button onClick={() => dashboardQuery.refetch()} className="mt-4 btn-primary px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary text-foreground hover:bg-neutral-200'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Engagement Metrics */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Engagement</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Daily Active Users"
            value={metrics?.engagement.dailyActiveUsers || 0}
            icon="👤"
          />
          <MetricCard
            title="Weekly Active Users"
            value={metrics?.engagement.weeklyActiveUsers || 0}
            icon="👥"
          />
          <MetricCard
            title="Prompts per User"
            value={(metrics?.engagement.promptsPerUser || 0).toFixed(1)}
            icon="📝"
          />
          <MetricCard
            title="Runs per Prompt"
            value={(metrics?.engagement.runsPerPrompt || 0).toFixed(1)}
            icon="▶️"
          />
        </div>
      </section>

      {/* Activation Funnel */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Activation Funnel</h2>
        <div className="card p-6">
          <ActivationFunnel
            signups={metrics?.activation.signups || 0}
            workspaces={metrics?.activation.workspacesCreated || 0}
            extensions={metrics?.activation.extensionsInstalled || 0}
            firstCapture={metrics?.activation.firstCapture || 0}
            thirdCapture={metrics?.activation.thirdCapture || 0}
            conversionRates={metrics?.activation.conversionRates}
          />
        </div>
      </section>

      {/* Team Health */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Team Health</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Active Workspaces"
            value={metrics?.teamHealth.activeWorkspaces || 0}
            icon="🏢"
          />
          <MetricCard
            title="Avg Seats/Workspace"
            value={(metrics?.teamHealth.seatsPerWorkspace || 0).toFixed(1)}
            icon="💺"
          />
          <MetricCard
            title="Shared Prompt Usage"
            value={`${((metrics?.teamHealth.sharedPromptsUsage || 0) * 100).toFixed(0)}%`}
            icon="🔗"
          />
        </div>
      </section>

      {/* Feature Adoption */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Feature Adoption</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Privacy Mode Distribution
            </h3>
            <PrivacyModeChart
              promptOnly={metrics?.featureAdoption.privacyModeDistribution.promptOnly || 0}
              fullChat={metrics?.featureAdoption.privacyModeDistribution.fullChat || 0}
            />
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Platform Distribution
            </h3>
            <PlatformChart distribution={metrics?.featureAdoption.platformDistribution || {}} />
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function ActivationFunnel({
  signups,
  workspaces,
  extensions,
  firstCapture,
  thirdCapture,
  conversionRates,
}: {
  signups: number;
  workspaces: number;
  extensions: number;
  firstCapture: number;
  thirdCapture: number;
  conversionRates?: {
    signupToWorkspace: number;
    workspaceToExtension: number;
    extensionToFirstCapture: number;
    firstToThirdCapture: number;
    overall: number;
  };
}) {
  const steps = [
    { label: 'Signups', value: signups, conversion: null },
    {
      label: 'Workspace Created',
      value: workspaces,
      conversion: conversionRates?.signupToWorkspace,
    },
    {
      label: 'Extension Installed',
      value: extensions,
      conversion: conversionRates?.workspaceToExtension,
    },
    {
      label: 'First Capture',
      value: firstCapture,
      conversion: conversionRates?.extensionToFirstCapture,
    },
    {
      label: 'Activated (3+ prompts)',
      value: thirdCapture,
      conversion: conversionRates?.firstToThirdCapture,
    },
  ];

  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-4">
          <div className="w-32 text-sm text-muted-foreground">{step.label}</div>
          <div className="flex-1">
            <div className="h-8 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${(step.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-16 text-right text-sm font-medium text-foreground">{step.value}</div>
          {step.conversion != null && (
            <div className="w-16 text-right text-xs text-muted-foreground">
              {((step.conversion ?? 0) * 100).toFixed(0)}%
            </div>
          )}
        </div>
      ))}
      <div className="pt-4 border-t border-border flex justify-between">
        <span className="text-sm text-muted-foreground">Overall Conversion</span>
        <span className="text-sm font-semibold text-primary-600">
          {((conversionRates?.overall || 0) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function PrivacyModeChart({ promptOnly, fullChat }: { promptOnly: number; fullChat: number }) {
  const total = promptOnly + fullChat;
  const promptOnlyPercent = total > 0 ? (promptOnly / total) * 100 : 50;

  return (
    <div className="space-y-4">
      <div className="flex h-8 rounded-full overflow-hidden">
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${promptOnlyPercent}%` }}
        />
        <div
          className="bg-purple-500 transition-all duration-500"
          style={{ width: `${100 - promptOnlyPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Prompt Only</span>
          <span className="font-medium">
            {promptOnly} ({promptOnlyPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">Full Chat</span>
          <span className="font-medium">
            {fullChat} ({(100 - promptOnlyPercent).toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

function PlatformChart({ distribution }: { distribution: Record<string, number> }) {
  const platforms = [
    { key: 'chatgpt', label: 'ChatGPT', color: 'bg-green-500' },
    { key: 'claude', label: 'Claude', color: 'bg-orange-500' },
    { key: 'gemini', label: 'Gemini', color: 'bg-blue-500' },
    { key: 'copilot', label: 'Copilot', color: 'bg-purple-500' },
    { key: 'other', label: 'Other', color: 'bg-neutral-400' },
  ];

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0) || 1;

  return (
    <div className="space-y-3">
      {platforms.map((platform) => {
        const value = distribution[platform.key] || 0;
        const percent = (value / total) * 100;

        return (
          <div key={platform.key} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${platform.color}`} />
            <div className="w-20 text-sm text-muted-foreground">{platform.label}</div>
            <div className="flex-1">
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${platform.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <div className="w-12 text-right text-sm font-medium">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-neutral-200 rounded w-64" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
            <div className="h-8 bg-neutral-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="h-4 bg-neutral-200 rounded w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 bg-neutral-200 rounded w-24" />
              <div className="flex-1 h-8 bg-neutral-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
