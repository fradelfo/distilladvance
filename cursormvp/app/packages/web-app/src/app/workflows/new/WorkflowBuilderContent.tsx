'use client';

/**
 * WorkflowBuilderContent Component
 *
 * Main workflow builder UI for creating and editing workflows.
 * Includes drag-drop step reordering, input mapping, and prompt selection.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SortableStep } from '@/components/workflows/SortableStep';
import { trackWorkflowCreated, trackWorkflowUpdated } from '@/lib/analytics';
import { trpc } from '@/lib/trpc';
import { extractVariables } from '@/lib/variables';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertCircle, ArrowLeft, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface WorkflowStep {
  id: string;
  promptId: string;
  promptTitle: string;
  promptContent: string;
  order: number;
  inputMapping: Record<string, string>;
  variables: string[];
}

interface WorkflowBuilderContentProps {
  mode: 'create' | 'edit';
  workflowId?: string;
}

export function WorkflowBuilderContent({ mode, workflowId }: WorkflowBuilderContentProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing workflow if editing
  const { data: workflowData, isLoading: isLoadingWorkflow } = trpc.workflow.getById.useQuery(
    { id: workflowId! },
    {
      enabled: mode === 'edit' && !!workflowId,
    }
  );

  // Populate form when workflow data loads
  useEffect(() => {
    if (workflowData?.workflow) {
      setName(workflowData.workflow.name);
      setDescription(workflowData.workflow.description || '');
      setSteps(
        workflowData.workflow.steps.map((s) => ({
          id: s.id,
          promptId: s.prompt.id,
          promptTitle: s.prompt.title,
          promptContent: s.prompt.content,
          order: s.order,
          inputMapping: (s.inputMapping as Record<string, string>) || {},
          variables: extractVariables(s.prompt.content),
        }))
      );
    }
  }, [workflowData]);

  // Fetch prompts for selection
  const {
    data: promptsData,
    isLoading: isLoadingPrompts,
    error: promptsError,
  } = trpc.distill.listPrompts.useQuery({ limit: 50 }, { staleTime: 5 * 60 * 1000 });

  // Mutations
  const createWorkflow = trpc.workflow.create.useMutation();
  const updateWorkflow = trpc.workflow.update.useMutation();
  const addStep = trpc.workflow.addStep.useMutation();
  const removeStep = trpc.workflow.removeStep.useMutation();
  const reorderSteps = trpc.workflow.reorderSteps.useMutation();
  const updateStep = trpc.workflow.updateStep.useMutation();

  // For fetching full prompt details when adding a step
  const fetchPromptDetails = trpc.useUtils().distill.getPrompt;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get available prompts (exclude already added)
  const availablePrompts = useMemo(() => {
    if (!promptsData?.prompts) return [];
    const usedIds = new Set(steps.map((s) => s.promptId));
    return promptsData.prompts.filter((p: any) => !usedIds.has(p.id));
  }, [promptsData, steps]);

  // Calculate initial inputs required (variables from step 0 that aren't from other steps)
  const initialInputsRequired = useMemo(() => {
    if (steps.length === 0) return [];
    const firstStep = steps[0];
    if (!firstStep) return [];

    // Variables needed by first step that aren't mapped from previous steps
    return firstStep.variables.filter((v) => !firstStep.inputMapping[v]?.startsWith('step.'));
  }, [steps]);

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order values
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  }, []);

  // Add a new step
  const handleAddStep = useCallback(
    async (promptId: string) => {
      console.log('[Workflow] Adding step with promptId:', promptId);
      const promptMeta = promptsData?.prompts.find((p) => p.id === promptId);
      if (!promptMeta) {
        console.error('[Workflow] Prompt not found in list:', promptId);
        setError('Prompt not found');
        return;
      }

      setIsLoadingStep(true);
      setError(null);

      try {
        // Fetch full prompt details including content
        console.log('[Workflow] Fetching prompt details...');
        const fullPrompt = await fetchPromptDetails.fetch({ id: promptId });
        console.log('[Workflow] Full prompt response:', fullPrompt);

        if (!fullPrompt?.prompt) {
          console.error('[Workflow] No prompt in response');
          setError('Failed to load prompt details');
          return;
        }

        // Extract variables and auto-map them to initial inputs by default
        const variables = extractVariables(fullPrompt.prompt.content);
        const autoMapping = Object.fromEntries(
          variables.map((v) => [v, `initial.${v}`])
        );

        const newStep: WorkflowStep = {
          id: `temp-${Date.now()}`, // Temporary ID until saved
          promptId: fullPrompt.prompt.id,
          promptTitle: fullPrompt.prompt.title,
          promptContent: fullPrompt.prompt.content,
          order: steps.length,
          inputMapping: autoMapping,
          variables,
        };

        console.log('[Workflow] Adding new step:', newStep);
        setSteps([...steps, newStep]);
        setIsAddingStep(false);
      } catch (err) {
        console.error('[Workflow] Failed to fetch prompt details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prompt');
      } finally {
        setIsLoadingStep(false);
      }
    },
    [promptsData, steps, fetchPromptDetails]
  );

  // Remove a step
  const handleRemoveStep = useCallback((stepId: string) => {
    setSteps((current) => {
      const filtered = current.filter((s) => s.id !== stepId);
      return filtered.map((s, index) => ({ ...s, order: index }));
    });
  }, []);

  // Update step input mapping
  const handleUpdateMapping = useCallback(
    (stepId: string, variableName: string, source: string) => {
      setSteps((current) =>
        current.map((s) =>
          s.id === stepId
            ? { ...s, inputMapping: { ...s.inputMapping, [variableName]: source } }
            : s
        )
      );
    },
    []
  );

  // Get available sources for a variable at a given step
  const getAvailableSources = useCallback(
    (stepIndex: number) => {
      const sources: Array<{ value: string; label: string }> = [];

      // Initial inputs
      initialInputsRequired.forEach((varName) => {
        sources.push({
          value: `initial.${varName}`,
          label: `Initial: ${varName}`,
        });
      });

      // Previous step outputs
      for (let i = 0; i < stepIndex; i++) {
        sources.push({
          value: `step.${i}.output`,
          label: `Step ${i + 1} output`,
        });
      }

      return sources;
    },
    [initialInputsRequired]
  );

  // Save workflow
  const handleSave = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    if (steps.length < 2) {
      setError('Workflow must have at least 2 steps');
      return;
    }

    setIsSaving(true);

    try {
      if (mode === 'create') {
        // Create workflow
        const result = await createWorkflow.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });

        const newWorkflowId = result.workflow.id;

        // Add steps
        for (const step of steps) {
          await addStep.mutateAsync({
            workflowId: newWorkflowId,
            promptId: step.promptId,
            order: step.order,
            inputMapping: Object.keys(step.inputMapping).length > 0 ? step.inputMapping : undefined,
          });
        }

        // Track workflow creation
        trackWorkflowCreated(newWorkflowId, steps.length);

        utils.workflow.list.invalidate();
        router.push(`/workflows/${newWorkflowId}`);
      } else if (workflowId) {
        // Update workflow metadata
        await updateWorkflow.mutateAsync({
          id: workflowId,
          name: name.trim(),
          description: description.trim() || null,
        });

        // Update step mappings
        for (const step of steps) {
          if (!step.id.startsWith('temp-')) {
            await updateStep.mutateAsync({
              stepId: step.id,
              inputMapping: Object.keys(step.inputMapping).length > 0 ? step.inputMapping : null,
            });
          }
        }

        // Reorder if needed
        const stepIds = steps.filter((s) => !s.id.startsWith('temp-')).map((s) => s.id);
        if (stepIds.length > 0) {
          await reorderSteps.mutateAsync({
            workflowId,
            stepIds,
          });
        }

        // Track workflow update
        trackWorkflowUpdated(workflowId, ['name', 'description', 'steps']);

        utils.workflow.getById.invalidate({ id: workflowId });
        router.push(`/workflows/${workflowId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  }, [
    mode,
    workflowId,
    name,
    description,
    steps,
    createWorkflow,
    updateWorkflow,
    addStep,
    updateStep,
    reorderSteps,
    utils,
    router,
  ]);

  if (mode === 'edit' && isLoadingWorkflow) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workflows">
          <Button variant="ghost" size="icon" aria-label="Back to workflows">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Create Workflow' : 'Edit Workflow'}
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workflow"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              maxLength={500}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Steps</CardTitle>
          <Dialog open={isAddingStep} onOpenChange={setIsAddingStep}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Step</DialogTitle>
                <DialogDescription>
                  Select a prompt to add as a new step in your workflow.
                </DialogDescription>
              </DialogHeader>
              {isLoadingStep && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                  Loading prompt...
                </div>
              )}
              {promptsError && (
                <p className="text-sm text-destructive py-2">
                  Failed to load prompts: {promptsError.message}
                </p>
              )}
              <div
                className="space-y-2 max-h-96 overflow-y-auto"
                role="listbox"
                aria-label="Available prompts"
              >
                {isLoadingPrompts ? (
                  <Skeleton className="h-20 w-full" aria-label="Loading prompts" />
                ) : promptsError ? (
                  <p className="text-sm text-destructive py-4 text-center" role="alert">
                    Failed to load prompts. Please try again.
                  </p>
                ) : availablePrompts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No available prompts. Create some prompts first.
                  </p>
                ) : (
                  availablePrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleAddStep(prompt.id)}
                      disabled={isLoadingStep}
                      role="option"
                      aria-selected="false"
                      className="w-full p-3 text-left rounded-lg border hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium">{prompt.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Used {prompt.usageCount || 0} times
                      </div>
                      {prompt.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2" aria-label="Tags">
                          {prompt.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No steps yet. Add at least 2 steps to create a workflow.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      index={index}
                      onRemove={() => handleRemoveStep(step.id)}
                      onUpdateMapping={(varName, source) =>
                        handleUpdateMapping(step.id, varName, source)
                      }
                      availableSources={getAvailableSources(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Initial Inputs Summary */}
      {steps.length > 0 && initialInputsRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Initial Inputs Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {initialInputsRequired.map((varName) => (
                <Badge key={varName} variant="outline">
                  {varName}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              These values will need to be provided when running the workflow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Link href="/workflows">
          <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </Button>
      </div>
    </div>
  );
}
