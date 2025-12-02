'use client';

/**
 * WorkflowDetailContent Component
 *
 * Displays workflow details, allows running the workflow,
 * and shows execution history.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Edit,
  Trash2,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorWithRetry } from '@/components/ui/error-with-retry';
import { trpc } from '@/lib/trpc';
import { extractVariables } from '@/lib/variables';

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
      return (
        <Badge variant="secondary">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
}

export function WorkflowDetailContent({ workflowId }: WorkflowDetailContentProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runError, setRunError] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<any>(null);

  // Fetch workflow
  const {
    data: workflowData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.workflow.getById.useQuery(
    { id: workflowId },
    { staleTime: 30 * 1000 }
  );

  // Fetch execution history
  const {
    data: executionsData,
    isLoading: isLoadingExecutions,
  } = trpc.workflow.listExecutions.useQuery(
    { workflowId, limit: 10 },
    { staleTime: 30 * 1000 }
  );

  // Mutations
  const executeWorkflow = trpc.workflow.execute.useMutation();
  const deleteWorkflow = trpc.workflow.delete.useMutation();

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

      setLastExecution(result.execution);
      setIsRunDialogOpen(false);
      utils.workflow.listExecutions.invalidate({ workflowId });
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkflow.mutateAsync({ id: workflowId });
      utils.workflow.list.invalidate();
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

              {runError && (
                <p className="text-sm text-destructive">{runError}</p>
              )}

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

      {/* Last Execution Result */}
      {lastExecution && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Latest Execution</CardTitle>
              <StatusBadge status={lastExecution.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastExecution.steps?.map((step: any, index: number) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="font-medium">Step {index + 1}</span>
                    <StatusBadge status={step.status} />
                  </div>
                  {step.output && (
                    <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {step.output}
                    </pre>
                  )}
                  {step.error && (
                    <p className="text-sm text-destructive">{step.error}</p>
                  )}
                </div>
              ))}

              <Separator />

              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>{lastExecution.totalTokens} tokens</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>${lastExecution.totalCost?.toFixed(4)}</span>
                </div>
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
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Input Mapping:
                    </p>
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
              <p>No execution history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executionsData?.executions?.map((exec: any) => (
                <Card key={exec.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={exec.status} />
                        <span className="text-sm text-muted-foreground">
                          {new Date(exec.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{exec.totalTokens} tokens</span>
                        <span>${exec.totalCost?.toFixed(4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
