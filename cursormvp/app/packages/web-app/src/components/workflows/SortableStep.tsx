'use client';

/**
 * SortableStep Component
 *
 * A draggable workflow step card with input mapping configuration.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface WorkflowStep {
  id: string;
  promptId: string;
  promptTitle: string;
  promptContent: string;
  order: number;
  inputMapping: Record<string, string>;
  variables: string[];
}

interface SortableStepProps {
  step: WorkflowStep;
  index: number;
  onRemove: () => void;
  onUpdateMapping: (variableName: string, source: string) => void;
  availableSources: Array<{ value: string; label: string }>;
}

export function SortableStep({
  step,
  index,
  onRemove,
  onUpdateMapping,
  availableSources,
}: SortableStepProps) {
  const [isExpanded, setIsExpanded] = useState(step.variables.length > 0);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg bg-card">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-2 p-3">
          {/* Drag Handle */}
          <button
            className="cursor-grab touch-none p-1 hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Drag to reorder step ${index + 1}: ${step.promptTitle}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>

          {/* Step Number */}
          <Badge variant="secondary" className="shrink-0">
            {index + 1}
          </Badge>

          {/* Step Title */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{step.promptTitle}</div>
            {step.variables.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {step.variables.length} variable{step.variables.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Expand/Collapse */}
          {step.variables.length > 0 && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={isExpanded ? 'Collapse variable mapping' : 'Expand variable mapping'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}: ${step.promptTitle}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Variable Mapping */}
        {step.variables.length > 0 && (
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-0 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2 mt-3">
                Input Mapping
              </div>
              <div className="space-y-3">
                {step.variables.map((varName) => (
                  <div key={varName} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0 font-mono text-xs">
                        {`{{${varName}}}`}
                      </Badge>
                      <span className="text-muted-foreground hidden sm:inline" aria-hidden="true">
                        &larr;
                      </span>
                    </div>
                    <Select
                      value={step.inputMapping[varName] || ''}
                      onValueChange={(value) => onUpdateMapping(varName, value)}
                    >
                      <SelectTrigger className="w-full sm:flex-1">
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                        {/* Also allow mapping to initial input with same name */}
                        {!availableSources.some((s) => s.value === `initial.${varName}`) && (
                          <SelectItem value={`initial.${varName}`}>Initial: {varName}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}
