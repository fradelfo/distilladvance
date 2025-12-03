'use client';

/**
 * ExecutionDetailContent Component
 *
 * Displays full execution details including all step results,
 * inputs/outputs, timing, cost, and provides a re-run option.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { trackWorkflowExecutionStarted } from '@/lib/analytics';
import { trpc } from '@/lib/trpc';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Loader2,
  Play,
  RefreshCw,
  Timer,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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

// Helper to format date
function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface ExecutionDetailContentProps {
  workflowId: string;
  executionId: string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
          Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
          Failed
        </Badge>
      );
    case 'RUNNING':
      return (
        <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" aria-hidden="true" />
          Running
        </Badge>
      );
    case 'CANCELLED':
      return <Badge variant="secondary">Cancelled</Badge>;
    case 'PENDING':
      return <Badge variant="outline">Pending</Badge>;
    case 'SKIPPED':
      return <Badge variant="outline">Skipped</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ExecutionDetailContent({ workflowId, executionId }: ExecutionDetailContentProps) {
  const router = useRouter();
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runError, setRunError] = useState<string | null>(null);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

  // Fetch execution details
  const {
    data: executionData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.workflow.getExecution.useQuery({ executionId }, { staleTime: 10 * 1000 });

  // Fetch workflow for context
  const { data: workflowData } = trpc.workflow.getById.useQuery(
    { id: workflowId },
    { staleTime: 30 * 1000 }
  );

  // Mutation for re-running
  const executeWorkflow = trpc.workflow.execute.useMutation();

  // Initialize run inputs from execution's initial input
  useEffect(() => {
    if (executionData?.execution?.initialInput) {
      const inputs = executionData.execution.initialInput as Record<string, unknown>;
      const stringInputs: Record<string, string> = {};
      for (const [key, value] of Object.entries(inputs)) {
        stringInputs[key] = String(value ?? '');
      }
      setRunInputs(stringInputs);
    }
  }, [executionData]);

  // Handle re-run
  const handleRerun = async () => {
    setRunError(null);
    setIsRunning(true);

    try {
      const result = await executeWorkflow.mutateAsync({
        workflowId,
        initialInput: runInputs,
      });

      // Track analytics
      trackWorkflowExecutionStarted(
        workflowId,
        result.execution.id,
        workflowData?.workflow?.steps?.length || 0
      );

      // Navigate to new execution
      router.push(`/workflows/${workflowId}/executions/${result.execution.id}`);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to run workflow');
      setIsRunning(false);
    }
  };

  // Handle copy output
  const handleCopyOutput = useCallback(async (output: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(output);
      setCopiedStepId(stepId);
      setTimeout(() => setCopiedStepId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorWithRetry
        message={error?.message || 'Failed to load execution details'}
        onRetry={() => refetch()}
      />
    );
  }

  const execution = executionData?.execution;
  if (!execution) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Execution not found</p>
        <Link href={`/workflows/${workflowId}/executions`}>
          <Button variant="link">Back to Execution History</Button>
        </Link>
      </div>
    );
  }

  const duration =
    execution.completedAt && execution.startedAt
      ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
      : null;

  const inputEntries = Object.entries(execution.initialInput || {});

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <nav
        className="flex items-center gap-2 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/workflows" className="hover:text-foreground">
          Workflows
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link href={`/workflows/${workflowId}`} className="hover:text-foreground">
          {workflowData?.workflow?.name || 'Workflow'}
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link href={`/workflows/${workflowId}/executions`} className="hover:text-foreground">
          Executions
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground">Details</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={`/workflows/${workflowId}/executions`}>
            <Button variant="ghost" size="icon" aria-label="Back to execution history">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">Execution Details</h1>
              <StatusBadge status={execution.status} />
            </div>
            <p className="text-muted-foreground mt-1">{formatDate(execution.startedAt)}</p>
          </div>
        </div>

        <Button onClick={() => setIsRunDialogOpen(true)}>
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Run Again
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-lg font-medium flex items-center gap-1">
                <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {formatDuration(duration)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-lg font-medium flex items-center gap-1">
                <Coins className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {execution.totalTokens?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-lg font-medium">{formatCost(execution.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Steps</p>
              <p className="text-lg font-medium">
                {execution.steps?.filter((s: any) => s.status === 'COMPLETED').length || 0}
                {' / '}
                {execution.steps?.length || 0}
              </p>
            </div>
          </div>

          {execution.errorMessage && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <strong>Error:</strong> {execution.errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initial Inputs */}
      {inputEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Initial Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inputEntries.map(([key, value]) => (
                <div key={key}>
                  <Label className="text-sm text-muted-foreground">{key}</Label>
                  <pre className="mt-1 text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {String(value)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {execution.steps?.map((step: any, index: number) => (
              <div key={step.id} className="space-y-3">
                {index > 0 && <Separator />}

                {/* Step Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="w-6 h-6 flex items-center justify-center p-0"
                    >
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{step.promptTitle || `Step ${index + 1}`}</span>
                    <StatusBadge status={step.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {step.startedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {new Date(step.startedAt).toLocaleTimeString()}
                      </span>
                    )}
                    {step.durationMs && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" aria-hidden="true" />
                        {formatDuration(step.durationMs)}
                      </span>
                    )}
                    {step.tokens > 0 && <span>{step.tokens.toLocaleString()} tokens</span>}
                    {step.cost > 0 && <span>{formatCost(step.cost)}</span>}
                  </div>
                </div>

                {/* Step Input */}
                {step.input && Object.keys(step.input).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Input Variables
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(step.input).map(([varName, value]) => (
                        <Badge
                          key={varName}
                          variant="outline"
                          className="font-mono text-xs max-w-xs truncate"
                        >
                          {varName}: {String(value).substring(0, 50)}
                          {String(value).length > 50 && '...'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step Output */}
                {step.output && (
                  <div className="relative group">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Output</p>
                    <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {step.output}
                    </pre>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-8 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopyOutput(step.output, step.id)}
                            aria-label="Copy output"
                          >
                            {copiedStepId === step.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedStepId === step.id ? 'Copied!' : 'Copy output'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Step Error */}
                {step.errorMessage && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <strong>Error:</strong> {step.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Final Output */}
      {execution.finalOutput && (
        <Card>
          <CardHeader>
            <CardTitle>Final Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative group">
              <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {typeof execution.finalOutput === 'object'
                  ? JSON.stringify(execution.finalOutput, null, 2)
                  : String(execution.finalOutput)}
              </pre>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const output =
                          typeof execution.finalOutput === 'object'
                            ? JSON.stringify(execution.finalOutput, null, 2)
                            : String(execution.finalOutput);
                        handleCopyOutput(output, 'final');
                      }}
                      aria-label="Copy final output"
                    >
                      {copiedStepId === 'final' ? (
                        <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copiedStepId === 'final' ? 'Copied!' : 'Copy output'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Re-run Dialog */}
      <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Workflow Again</DialogTitle>
            <DialogDescription>
              Run this workflow with the same or modified inputs.
            </DialogDescription>
          </DialogHeader>

          {inputEntries.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {inputEntries.map(([inputName]) => (
                <div key={inputName} className="space-y-2">
                  <Label htmlFor={`rerun-${inputName}`}>{inputName}</Label>
                  <Textarea
                    id={`rerun-${inputName}`}
                    value={runInputs[inputName] || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setRunInputs((prev) => ({
                        ...prev,
                        [inputName]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${inputName}...`}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">This workflow has no required inputs.</p>
          )}

          {runError && <p className="text-sm text-destructive">{runError}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRunDialogOpen(false)}
              disabled={isRunning}
            >
              Cancel
            </Button>
            <Button onClick={handleRerun} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                  Run
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
