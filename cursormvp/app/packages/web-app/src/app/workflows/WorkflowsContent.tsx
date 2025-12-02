'use client';

/**
 * WorkflowsContent Component
 *
 * Client component that displays the list of workflows with
 * search, filtering, and navigation to create/edit workflows.
 */

import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import { Clock, Play, Plus, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

interface WorkflowItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  stepCount: number;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

function WorkflowCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowCard({ workflow }: { workflow: WorkflowItem }) {
  return (
    <Link href={`/workflows/${workflow.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
            </div>
            {workflow.isPublic && <Badge variant="secondary">Public</Badge>}
          </div>
          {workflow.description && (
            <CardDescription className="line-clamp-2">{workflow.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              <span>{workflow.stepCount} steps</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{workflow.executionCount} runs</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Updated {new Date(workflow.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function WorkflowsContent() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.workflow.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000,
    }
  );

  const workflows = useMemo((): WorkflowItem[] => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.workflows);
  }, [data]);

  // Filter workflows by search query
  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const query = searchQuery.toLowerCase();
    return workflows.filter(
      (w) => w.name.toLowerCase().includes(query) || w.description?.toLowerCase().includes(query)
    );
  }, [workflows, searchQuery]);

  if (isError) {
    return (
      <ErrorWithRetry
        message={error?.message || 'Failed to load workflows'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Chain prompts together to automate multi-step tasks
          </p>
        </div>
        <Link href="/workflows/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Workflow Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <WorkflowCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-12 w-12" />}
          title={searchQuery ? 'No workflows found' : 'No workflows yet'}
          description={
            searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first workflow to chain prompts together'
          }
          primaryAction={
            !searchQuery
              ? {
                  label: 'Create Workflow',
                  href: '/workflows/new',
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
