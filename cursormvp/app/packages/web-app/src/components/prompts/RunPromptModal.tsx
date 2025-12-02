'use client';

/**
 * RunPromptModal Component
 *
 * A modal dialog for running prompts with variable extraction and execution.
 * Uses shadcn/ui Dialog component and Lucide icons.
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { extractVariables, fillVariables } from '@/lib/variables';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface RunPromptModalProps {
  /** The prompt to run */
  prompt: {
    id: string;
    title: string;
    content: string;
  };
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * URLs for opening prompts in AI chat platforms.
 */
const AI_PLATFORM_URLS = {
  chatgpt: 'https://chat.openai.com/',
  claude: 'https://claude.ai/new',
} as const;

export function RunPromptModal({ prompt, isOpen, onClose }: RunPromptModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Track usage mutation
  const incrementUsageMutation = trpc.distill.incrementUsage.useMutation();

  // Extract variables from prompt content
  const variables = useMemo(() => {
    return extractVariables(prompt.content);
  }, [prompt.content]);

  // Generate filled prompt
  const filledPrompt = useMemo(() => {
    return fillVariables(prompt.content, variableValues);
  }, [prompt.content, variableValues]);

  // Check if all variables are filled
  const allVariablesFilled = useMemo(() => {
    return variables.every((varName) => variableValues[varName]?.trim());
  }, [variables, variableValues]);

  // Reset state when modal opens/closes or prompt changes
  useEffect(() => {
    if (isOpen) {
      setVariableValues({});
      setCopied(false);
      // Focus first input after modal animation
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, prompt.id]);

  // Handle variable input change
  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Track usage and perform action
  const trackAndExecute = useCallback(
    async (action: () => void | Promise<void>) => {
      try {
        await incrementUsageMutation.mutateAsync({ id: prompt.id });
      } catch (error) {
        console.error('[RunPromptModal] Failed to track usage:', error);
      }
      await action();
    },
    [incrementUsageMutation, prompt.id]
  );

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const textToCopy = variables.length > 0 && allVariablesFilled ? filledPrompt : prompt.content;

    await trackAndExecute(async () => {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Prompt copied to clipboard', {
        action: {
          label: 'Open ChatGPT',
          onClick: () => window.open(AI_PLATFORM_URLS.chatgpt, '_blank', 'noopener,noreferrer'),
        },
      });
    });
  }, [filledPrompt, prompt.content, variables.length, allVariablesFilled, trackAndExecute]);

  // Handle open in AI platform
  const handleOpenInPlatform = useCallback(
    async (platform: keyof typeof AI_PLATFORM_URLS) => {
      const textToCopy = variables.length > 0 && allVariablesFilled ? filledPrompt : prompt.content;

      await trackAndExecute(async () => {
        await navigator.clipboard.writeText(textToCopy);
        window.open(AI_PLATFORM_URLS[platform], '_blank', 'noopener,noreferrer');
      });
    },
    [filledPrompt, prompt.content, variables.length, allVariablesFilled, trackAndExecute]
  );

  const isDisabled = variables.length > 0 && !allVariablesFilled;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8 truncate">Run: {prompt.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Variables Section */}
          {variables.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Fill in Variables</h3>
              {variables.map((varName, index) => (
                <div key={varName} className="space-y-2">
                  <Label htmlFor={`var-${varName}`}>
                    {varName}
                    <span className="text-destructive ml-1" aria-hidden="true">
                      *
                    </span>
                    <span className="sr-only">(required)</span>
                  </Label>
                  <Input
                    ref={index === 0 ? firstInputRef : undefined}
                    id={`var-${varName}`}
                    type="text"
                    value={variableValues[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Enter value for ${varName}`}
                    aria-required="true"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Preview Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              {variables.length > 0 ? 'Preview' : 'Prompt Content'}
            </h3>
            <div className="bg-muted border rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
                {variables.length > 0 ? filledPrompt : prompt.content}
              </pre>
            </div>
            {variables.length > 0 && !allVariablesFilled && (
              <p className="text-sm text-amber-600" role="status">
                Fill in all variables to see the complete prompt.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          {/* Copy Button */}
          <Button onClick={handleCopy} disabled={isDisabled} className="flex-1">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>

          {/* Open in ChatGPT Button */}
          <Button
            variant="outline"
            onClick={() => handleOpenInPlatform('chatgpt')}
            disabled={isDisabled}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in ChatGPT
          </Button>

          {/* Open in Claude Button */}
          <Button
            variant="outline"
            onClick={() => handleOpenInPlatform('claude')}
            disabled={isDisabled}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Claude
          </Button>
        </DialogFooter>

        {isDisabled && (
          <p className="text-center text-sm text-muted-foreground pb-2">
            Fill in all variables above to enable these actions.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
