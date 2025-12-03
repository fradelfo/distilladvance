'use client';

/**
 * ExecutionHistoryContent Component
 *
 * Displays a paginated list of workflow executions with filtering and navigation.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Coins,
  History,
  Loader2,
  Timer,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

// Helper to format duration
function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

// Helper to format cost
function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

interface ExecutionHistoryContentProps {
  workflowId: string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'RUNNING':
      return (
        <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case 'CANCELLED':
      return <Badge variant="secondary">Cancelled</Badge>;
    case 'PENDING':
      return <Badge variant="outline">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ExecutionHistoryContent({ workflowId }: ExecutionHistoryContentProps) {
  // Fetch workflow for name
  const { data: workflowData, isLoading: isLoadingWorkflow } = trpc.workflow.getById.useQuery(
    { id: workflowId },
    { staleTime: 30 * 1000 }
  );

  // Fetch executions with pagination
  const {
    data: executionsData,
    isLoading: isLoadingExecutions,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.workflow.listExecutions.useInfiniteQuery(
    { workflowId, limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 10 * 1000,
    }
  );

  const allExecutions = executionsData?.pages.flatMap((page) => page.executions) ?? [];

  if (isLoadingWorkflow || isLoadingExecutions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorWithRetry
        message={error?.message || 'Failed to load execution history'}
        onRetry={() => refetch()}
      />
    );
  }

  const workflow = workflowData?.workflow;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/workflows/${workflowId}`}>
          <Button variant="ghost" size="icon" aria-label="Back to workflow">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Execution History</h1>
          {workflow && <p className="text-muted-foreground">{workflow.name}</p>}
        </div>
      </div>

      {/* Executions List */}
      {allExecutions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
              <p className="text-lg font-medium">No executions yet</p>
              <p className="text-sm mt-1">Run your workflow to see executions here.</p>
              <Link href={`/workflows/${workflowId}`}>
                <Button className="mt-4">Go to Workflow</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3" role="list" aria-label="Execution history">
            {allExecutions.map((execution) => {
              const duration = execution.completedAt
                ? new Date(execution.completedAt).getTime() -
                  new Date(execution.startedAt).getTime()
                : null;

              return (
                <Link
                  key={execution.id}
                  href={`/workflows/${workflowId}/executions/${execution.id}`}
                  className="block"
                  role="listitem"
                >
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <StatusBadge status={execution.status} />

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {new Date(execution.startedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              {new Date(execution.startedAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>

                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {duration !== null && (
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" aria-hidden="true" />
                                  <span>{formatDuration(duration)}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Coins className="h-3 w-3" aria-hidden="true" />
                                <span>{execution.totalTokens?.toLocaleString() || 0} tokens</span>
                              </span>
                              <span>{formatCost(execution.totalCost)}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight
                          className="h-5 w-5 text-muted-foreground flex-shrink-0"
                          aria-hidden="true"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
