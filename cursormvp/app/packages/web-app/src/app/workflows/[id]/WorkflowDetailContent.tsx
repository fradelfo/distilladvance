'use client';

/**
 * WorkflowDetailContent Component
 *
 * Displays workflow details, allows running the workflow,
 * and shows execution history.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  trackWorkflowDeleted,
  trackWorkflowExecutionCancelled,
  trackWorkflowExecutionCompleted,
  trackWorkflowExecutionFailed,
  trackWorkflowExecutionStarted,
} from '@/lib/analytics';
import { trpc } from '@/lib/trpc';
import { extractVariables } from '@/lib/variables';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Edit,
  History,
  Loader2,
  Play,
  RefreshCw,
  Square,
  Timer,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

interface WorkflowDetailContentProps {
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
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function WorkflowDetailContent({ workflowId }: WorkflowDetailContentProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runError, setRunError] = useState<string | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(null);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

  // Fetch workflow
  const {
    data: workflowData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.workflow.getById.useQuery({ id: workflowId }, { staleTime: 30 * 1000 });

  // Fetch execution history
  const {
    data: executionsData,
    isLoading: isLoadingExecutions,
    refetch: refetchExecutions,
  } = trpc.workflow.listExecutions.useQuery({ workflowId, limit: 10 }, { staleTime: 10 * 1000 });

  // Fetch active execution status (polling when running)
  const { data: activeExecutionData, refetch: refetchActiveExecution } =
    trpc.workflow.getExecution.useQuery(
      { executionId: activeExecutionId! },
      {
        enabled: !!activeExecutionId,
        refetchInterval: isRunning ? 1000 : false, // Poll every second while running
        staleTime: 0,
      }
    );

  // Mutations
  const executeWorkflow = trpc.workflow.execute.useMutation();
  const cancelExecution = trpc.workflow.cancelExecution.useMutation();
  const deleteWorkflow = trpc.workflow.delete.useMutation();

  // Update running state based on execution status
  useEffect(() => {
    if (activeExecutionData?.execution && activeExecutionId) {
      const exec = activeExecutionData.execution;
      const status = exec.status;

      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        setIsRunning(false);
        setIsCancelling(false);
        // Refresh executions list
        refetchExecutions();

        // Track analytics for completion/failure
        if (status === 'COMPLETED') {
          const durationMs =
            exec.completedAt && exec.startedAt
              ? new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()
              : 0;
          trackWorkflowExecutionCompleted(
            activeExecutionId,
            exec.steps?.length || 0,
            exec.totalTokens || 0,
            exec.totalCost || 0,
            durationMs
          );
        } else if (status === 'FAILED') {
          const failedStep = exec.steps?.findIndex((s: any) => s.status === 'FAILED') || 0;
          const errorStep = exec.steps?.find((s: any) => s.status === 'FAILED');
          trackWorkflowExecutionFailed(
            activeExecutionId,
            failedStep,
            errorStep?.errorMessage || 'Unknown error'
          );
        }
      }
    }
  }, [activeExecutionData, activeExecutionId, refetchExecutions]);

  // Calculate required initial inputs
  const requiredInputs = useMemo(() => {
    if (!workflowData?.workflow?.steps) return [];
    const inputs = new Set<string>();

    workflowData.workflow.steps.forEach((step: any) => {
      const variables = extractVariables(step.prompt.content);
      variables.forEach((varName) => {
        const mapping = step.inputMapping?.[varName];
        if (!mapping || mapping.startsWith('initial.')) {
          // Either unmapped or explicitly mapped to initial
          const inputName = mapping ? mapping.replace('initial.', '') : varName;
          inputs.add(inputName);
        }
      });
    });

    return Array.from(inputs);
  }, [workflowData]);

  // Handle run workflow
  const handleRun = async () => {
    setRunError(null);
    setIsRunning(true);

    try {
      const result = await executeWorkflow.mutateAsync({
        workflowId,
        initialInput: runInputs,
      });

      setActiveExecutionId(result.execution.id);
      setIsRunDialogOpen(false);

      // Track analytics
      trackWorkflowExecutionStarted(
        workflowId,
        result.execution.id,
        workflowData?.workflow?.steps?.length || 0
      );
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to run workflow');
      setIsRunning(false);
    }
  };

  // Handle cancel execution
  const handleCancel = async () => {
    if (!activeExecutionId) return;
    setIsCancelling(true);

    try {
      await cancelExecution.mutateAsync({ executionId: activeExecutionId });

      // Track analytics
      const completedSteps =
        activeExecutionData?.execution?.steps?.filter((s: any) => s.status === 'COMPLETED')
          .length || 0;
      trackWorkflowExecutionCancelled(activeExecutionId, completedSteps);
    } catch (err) {
      console.error('Failed to cancel execution:', err);
      setIsCancelling(false);
    }
  };

  // Handle re-run with same inputs
  const handleRerun = useCallback((execution: any) => {
    if (execution.initialInput) {
      setRunInputs(execution.initialInput as Record<string, string>);
    }
    setIsRunDialogOpen(true);
  }, []);

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

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkflow.mutateAsync({ id: workflowId });
      utils.workflow.list.invalidate();

      // Track analytics
      trackWorkflowDeleted(workflowId);

      router.push('/workflows');
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorWithRetry
        message={error?.message || 'Failed to load workflow'}
        onRetry={() => refetch()}
      />
    );
  }

  const workflow = workflowData?.workflow;
  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Workflow not found</p>
        <Link href="/workflows">
          <Button variant="link">Back to Workflows</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/workflows">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-muted-foreground">{workflow.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workflow.canEdit && (
            <>
              <Link href={`/workflows/${workflowId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this workflow? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Run Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Workflow</DialogTitle>
                <DialogDescription>
                  Provide the initial inputs to run this workflow.
                </DialogDescription>
              </DialogHeader>

              {requiredInputs.length > 0 ? (
                <div className="space-y-4">
                  {requiredInputs.map((inputName) => (
                    <div key={inputName} className="space-y-2">
                      <Label htmlFor={inputName}>{inputName}</Label>
                      <Textarea
                        id={inputName}
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
                <p className="text-sm text-muted-foreground">
                  This workflow has no required inputs.
                </p>
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
                <Button onClick={handleRun} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Execution Progress */}
      {activeExecutionId && activeExecutionData?.execution && (
        <Card
          className={
            isRunning
              ? 'border-blue-500'
              : activeExecutionData.execution.status === 'COMPLETED'
                ? 'border-green-500'
                : activeExecutionData.execution.status === 'FAILED'
                  ? 'border-destructive'
                  : 'border-muted'
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">
                  {isRunning ? 'Running Workflow' : 'Execution Result'}
                </CardTitle>
                <StatusBadge status={activeExecutionData.execution.status} />
              </div>
              {isRunning && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-destructive"
                >
                  {isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Square className="h-3 w-3 mr-2 fill-current" />
                      Cancel
                    </>
                  )}
                </Button>
              )}
            </div>
            {/* Progress bar */}
            {activeExecutionData.execution.steps && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>
                    Step{' '}
                    {
                      activeExecutionData.execution.steps.filter(
                        (s: any) => s.status === 'COMPLETED'
                      ).length
                    }{' '}
                    of {activeExecutionData.execution.steps.length}
                  </span>
                  <span>
                    {Math.round(
                      (activeExecutionData.execution.steps.filter(
                        (s: any) => s.status === 'COMPLETED'
                      ).length /
                        activeExecutionData.execution.steps.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (activeExecutionData.execution.steps.filter(
                      (s: any) => s.status === 'COMPLETED'
                    ).length /
                      activeExecutionData.execution.steps.length) *
                    100
                  }
                  className="h-2"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeExecutionData.execution.steps?.map((step: any, index: number) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="w-6 h-6 flex items-center justify-center p-0"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">
                        {step.step?.prompt?.title || `Step ${index + 1}`}
                      </span>
                      <StatusBadge status={step.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {step.durationMs && (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(step.durationMs)}
                        </span>
                      )}
                      {step.tokens > 0 && <span>{step.tokens.toLocaleString()} tokens</span>}
                      {step.cost > 0 && <span>{formatCost(step.cost)}</span>}
                    </div>
                  </div>
                  {step.output && (
                    <div className="relative group">
                      <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {step.output}
                      </pre>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleCopyOutput(step.output, step.id)}
                            >
                              {copiedStepId === step.id ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
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
                  {step.errorMessage && (
                    <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {step.errorMessage}
                    </p>
                  )}
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    <span>
                      {activeExecutionData.execution.totalTokens?.toLocaleString() || 0} tokens
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{formatCost(activeExecutionData.execution.totalCost)}</span>
                  </div>
                </div>
                {!isRunning && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRerun(activeExecutionData.execution)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Steps ({workflow.steps?.length || 0})</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          {workflow.steps?.map((step: any, index: number) => (
            <Card key={step.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <CardTitle className="text-lg">{step.prompt.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {step.prompt.content}
                </pre>
                {step.inputMapping && Object.keys(step.inputMapping).length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Input Mapping:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(step.inputMapping).map(([varName, source]) => (
                        <Badge key={varName} variant="outline" className="font-mono text-xs">
                          {`{{${varName}}}`} &larr; {source as string}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history">
          {isLoadingExecutions ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : executionsData?.executions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No execution history yet.</p>
              <p className="text-sm mt-1">Run your workflow to see executions here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executionsData?.executions?.map((exec: any) => (
                <Collapsible
                  key={exec.id}
                  open={expandedExecutionId === exec.id}
                  onOpenChange={(open) => setExpandedExecutionId(open ? exec.id : null)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardContent className="py-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <StatusBadge status={exec.status} />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                              <span className="text-sm text-muted-foreground">
                                {new Date(exec.startedAt).toLocaleString()}
                              </span>
                              {exec.completedAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {formatDuration(
                                    new Date(exec.completedAt).getTime() -
                                      new Date(exec.startedAt).getTime()
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{exec.totalTokens?.toLocaleString() || 0} tokens</span>
                              <span>{formatCost(exec.totalCost)}</span>
                            </div>
                            {expandedExecutionId === exec.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t">
                        <div className="space-y-4 pt-4">
                          {/* Step outputs */}
                          {exec.steps?.map((step: any, index: number) => (
                            <div key={step.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="w-6 h-6 flex items-center justify-center p-0"
                                  >
                                    {index + 1}
                                  </Badge>
                                  <span className="font-medium text-sm">
                                    {step.step?.prompt?.title || `Step ${index + 1}`}
                                  </span>
                                  <StatusBadge status={step.status} />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {step.durationMs && (
                                    <span>{formatDuration(step.durationMs)}</span>
                                  )}
                                  {step.tokens > 0 && (
                                    <span>{step.tokens.toLocaleString()} tok</span>
                                  )}
                                </div>
                              </div>
                              {step.output && (
                                <div className="relative group">
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {step.output}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyOutput(step.output, step.id);
                                    }}
                                  >
                                    {copiedStepId === step.id ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )}
                              {step.errorMessage && (
                                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                  {step.errorMessage}
                                </p>
                              )}
                            </div>
                          ))}

                          {/* Summary and actions */}
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-4 text-xs text-muted-foreground sm:hidden">
                              <span>{exec.totalTokens?.toLocaleString() || 0} tokens</span>
                              <span>{formatCost(exec.totalCost)}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveExecutionId(exec.id);
                                  setExpandedExecutionId(null);
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRerun(exec);
                                }}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Re-run
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
