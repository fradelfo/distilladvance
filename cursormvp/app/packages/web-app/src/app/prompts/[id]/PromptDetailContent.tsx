'use client';

/**
 * PromptDetailContent Component
 *
 * Client component for displaying and interacting with a single prompt.
 * Supports viewing, running (filling variables), and copying.
 */

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { TagChip } from '@/components/TagFilter';
import { CoachPanel } from '@/components/prompts/CoachPanel';

interface PromptDetailContentProps {
  promptId: string;
  initialRunMode?: boolean;
}

interface Variable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export function PromptDetailContent({
  promptId,
  initialRunMode = false,
}: PromptDetailContentProps) {
  const router = useRouter();
  const [isRunMode, setIsRunMode] = useState(initialRunMode);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch prompt data
  const {
    data: promptData,
    isLoading,
    isError,
    error,
  } = trpc.distill.getPrompt.useQuery({ id: promptId });

  // Delete mutation
  const deleteMutation = trpc.distill.deletePrompt.useMutation({
    onSuccess: () => {
      router.push('/prompts');
    },
  });

  // Track usage mutation
  const trackUsageMutation = trpc.distill.trackUsage.useMutation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prompt = promptData?.prompt as any;

  // Extract variables from metadata
  const variables: Variable[] = useMemo(() => {
    if (!prompt?.metadata) return [];
    return prompt.metadata.variables || [];
  }, [prompt]);

  // Extract description from metadata
  const description = useMemo(() => {
    if (!prompt?.metadata) return '';
    return prompt.metadata.description || '';
  }, [prompt]);

  // Generate filled template
  const filledTemplate = useMemo(() => {
    if (!prompt?.content) return '';
    let template = prompt.content;
    for (const [name, value] of Object.entries(variableValues)) {
      const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
      template = template.replace(regex, value || `{{${name}}}`);
    }
    return template;
  }, [prompt?.content, variableValues]);

  // Check if all required variables are filled
  const canRun = useMemo(() => {
    return variables
      .filter((v) => v.required)
      .every((v) => variableValues[v.name]?.trim());
  }, [variables, variableValues]);

  // Handle variable change
  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle copy
  const handleCopy = useCallback(async () => {
    const textToCopy = isRunMode ? filledTemplate : prompt?.content || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Track usage when copying filled template
    if (isRunMode && canRun) {
      trackUsageMutation.mutate({ id: promptId });
    }
  }, [isRunMode, filledTemplate, prompt?.content, canRun, promptId, trackUsageMutation]);

  // Handle delete
  const handleDelete = useCallback(() => {
    deleteMutation.mutate({ id: promptId });
  }, [deleteMutation, promptId]);

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6 h-8 bg-neutral-200 rounded w-1/3" />
        <div className="card p-6 space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-2/3" />
          <div className="h-4 bg-neutral-100 rounded w-full" />
          <div className="h-4 bg-neutral-100 rounded w-5/6" />
          <div className="h-32 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !prompt) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-medium text-neutral-900 mb-2">
          {error?.message === 'Prompt not found'
            ? 'Prompt not found'
            : 'Failed to load prompt'}
        </p>
        <p className="text-sm text-neutral-600 mb-6">
          {error?.message || 'The prompt you are looking for does not exist or you do not have access to it.'}
        </p>
        <Link href="/prompts" className="btn-primary px-6 py-2">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Library
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{prompt.title}</h1>
          {description && (
            <p className="mt-2 text-neutral-600">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/prompts/${promptId}/edit`}
            className="btn-outline px-4 py-2"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </span>
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-outline px-4 py-2 text-error-600 border-error-300 hover:bg-error-50"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </span>
          </button>
        </div>
      </div>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {prompt.tags.map((tag: string) => (
            <TagChip key={tag} tag={tag} size="md" />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-6 mb-6 text-sm text-neutral-500">
        <span className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {prompt.usageCount} uses
        </span>
        <span>Created {formatDate(prompt.createdAt)}</span>
        {prompt.updatedAt !== prompt.createdAt && (
          <span>Updated {formatDate(prompt.updatedAt)}</span>
        )}
        {prompt.isPublic && (
          <span className="inline-flex items-center gap-1 text-success-600">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Public
          </span>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setIsRunMode(false)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            !isRunMode
              ? 'bg-primary-100 text-primary-700'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          View Template
        </button>
        <button
          onClick={() => setIsRunMode(true)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isRunMode
              ? 'bg-primary-100 text-primary-700'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          Run Prompt
        </button>
      </div>

      {/* Variables Form (Run Mode) */}
      {isRunMode && variables.length > 0 && (
        <div className="card p-6 mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Fill Variables
          </h2>
          <div className="space-y-4">
            {variables.map((variable) => (
              <div key={variable.name}>
                <label
                  htmlFor={`var-${variable.name}`}
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {variable.name}
                  {variable.required && (
                    <span className="text-error-500 ml-1">*</span>
                  )}
                </label>
                {variable.description && (
                  <p className="text-xs text-neutral-500 mb-1">
                    {variable.description}
                  </p>
                )}
                <input
                  id={`var-${variable.name}`}
                  type="text"
                  value={variableValues[variable.name] || ''}
                  onChange={(e) =>
                    handleVariableChange(variable.name, e.target.value)
                  }
                  placeholder={variable.example || `Enter ${variable.name}`}
                  className="input w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variables List (View Mode) */}
      {!isRunMode && variables.length > 0 && (
        <div className="card p-6 mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Variables
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 px-3 font-medium text-neutral-700">
                    Name
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-neutral-700">
                    Description
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-neutral-700">
                    Example
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-neutral-700">
                    Required
                  </th>
                </tr>
              </thead>
              <tbody>
                {variables.map((variable) => (
                  <tr
                    key={variable.name}
                    className="border-b border-neutral-100"
                  >
                    <td className="py-2 px-3 font-mono text-primary-600">
                      {`{{${variable.name}}}`}
                    </td>
                    <td className="py-2 px-3 text-neutral-600">
                      {variable.description || '-'}
                    </td>
                    <td className="py-2 px-3 text-neutral-600">
                      {variable.example || '-'}
                    </td>
                    <td className="py-2 px-3">
                      {variable.required ? (
                        <span className="text-success-600">Yes</span>
                      ) : (
                        <span className="text-neutral-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Content */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isRunMode ? 'Generated Prompt' : 'Template'}
          </h2>
          <button
            onClick={handleCopy}
            disabled={isRunMode && !canRun}
            className={`btn-outline px-4 py-2 ${
              isRunMode && !canRun ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              {copied ? (
                <>
                  <svg
                    className="h-4 w-4 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </span>
          </button>
        </div>
        <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap text-sm font-mono text-neutral-800">
          {isRunMode ? filledTemplate : prompt.content}
        </pre>
      </div>

      {/* Coach Panel */}
      <div className="mt-6">
        <CoachPanel promptId={promptId} />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Delete Prompt?
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to delete &quot;{prompt.title}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn-primary px-4 py-2 bg-error-600 hover:bg-error-700"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
