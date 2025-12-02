'use client';

/**
 * NewPromptContent Component
 *
 * Form for creating a new prompt template manually.
 */

import { trpc } from '@/lib/trpc';
import { extractVariables, highlightVariables } from '@/lib/variables';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Variable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

type EditorMode = 'edit' | 'preview';

export function NewPromptContent() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // UI state
  const [mode, setMode] = useState<EditorMode>('edit');
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showVariablePanel, setShowVariablePanel] = useState(true);

  // Save mutation
  const saveMutation = trpc.distill.savePrompt.useMutation();

  // Extract variables from content
  const extractedVarNames = useMemo(() => {
    return extractVariables(content);
  }, [content]);

  // Sync variables with content
  useEffect(() => {
    if (extractedVarNames.length === 0) return;

    setVariables((prevVars) => {
      const existingMap = new Map(prevVars.map((v) => [v.name, v]));
      return extractedVarNames.map((name) => {
        const existing = existingMap.get(name);
        return (
          existing || {
            name,
            description: '',
            example: '',
            required: true,
          }
        );
      });
    });
  }, [extractedVarNames]);

  // Check if form is valid
  const isValid = title.trim().length > 0 && content.trim().length > 0;

  // Generate preview content with highlighted variables
  const previewContent = useMemo(() => {
    if (mode === 'preview') {
      let result = content;
      for (const [name, value] of Object.entries(previewValues)) {
        if (value) {
          const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
          result = result.replace(regex, value);
        }
      }
      return result;
    }
    return content;
  }, [content, mode, previewValues]);

  // Render content with highlighted variables
  const highlightedContent = useMemo(() => {
    return highlightVariables(content, (varName) => {
      return `<span class="bg-primary-100 text-primary-700 px-1 rounded font-semibold">{{${varName}}}</span>`;
    });
  }, [content]);

  // Insert variable at cursor position
  const insertVariable = useCallback((varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = `{{${varName}}}`;

    setContent((prev) => prev.slice(0, start) + text + prev.slice(end));

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  }, []);

  // Handle tag input
  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = tagInput.trim().toLowerCase();
        if (newTag && !tags.includes(newTag) && tags.length < 10) {
          setTags([...tags, newTag]);
          setTagInput('');
        }
      } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        setTags(tags.slice(0, -1));
      }
    },
    [tagInput, tags]
  );

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  // Update variable metadata
  const updateVariable = useCallback(
    (index: number, field: keyof Variable, value: string | boolean) => {
      setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
    },
    []
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      const result = await saveMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        template: content,
        variables,
        tags,
        isPublic,
      });

      if (result.success && result.prompt) {
        toast.success('Prompt created successfully');
        router.push(`/prompts/${result.prompt.id}`);
      }
    } catch (err) {
      console.error('[NewPromptContent] Save failed:', err);
      toast.error('Failed to create prompt');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, content, variables, tags, isPublic, isValid, saveMutation, router]);

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/prompts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Library
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Create New Prompt</h1>
        <div className="flex items-center gap-2">
          <Link href="/prompts" className="btn-outline px-4 py-2">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !isValid}
            className={`btn-primary px-4 py-2 ${
              isSaving || !isValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Creating...' : 'Create Prompt'}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="card p-6 mb-4">
        <label htmlFor="prompt-title" className="block text-sm font-medium text-foreground mb-2">
          Title <span className="text-error-500">*</span>
        </label>
        <input
          id="prompt-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter prompt title"
          className="input w-full text-lg"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div className="card p-6 mb-4">
        <label
          htmlFor="prompt-description"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Description
        </label>
        <input
          id="prompt-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this prompt does"
          className="input w-full"
          maxLength={500}
        />
      </div>

      {/* Mode Toggle + Variable Insert */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'edit'
                ? 'bg-primary-100 text-primary-700'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'preview'
                ? 'bg-primary-100 text-primary-700'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Variable Insert Dropdown */}
        {mode === 'edit' && (
          <div className="relative group">
            <button className="btn-outline px-3 py-2 text-sm flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Insert Variable
            </button>
            <div className="absolute right-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Click to insert or type {'{{variable_name}}'}
                </p>
                <div className="border-t border-neutral-100 my-1" />
                {variables.length > 0 ? (
                  variables.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => insertVariable(v.name)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary font-mono text-primary-600"
                    >
                      {`{{${v.name}}}`}
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No variables yet. Type {'{{name}}'} in content.
                  </p>
                )}
                <div className="border-t border-neutral-100 my-1" />
                <button
                  onClick={() => {
                    const name = window.prompt('Enter variable name:');
                    if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                      insertVariable(name);
                    } else if (name) {
                      alert('Invalid variable name. Use letters, numbers, and underscores only.');
                    }
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary text-primary-600"
                >
                  + Create new variable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Editor / Preview */}
      <div className="card p-6 mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Template Content <span className="text-error-500">*</span>
        </label>

        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your prompt template. Use {{variable_name}} for dynamic values."
            className="input w-full h-64 font-mono text-sm resize-y"
            spellCheck={false}
          />
        ) : (
          <div className="bg-secondary border border-border rounded-lg p-4 min-h-[16rem] overflow-auto">
            {extractedVarNames.length > 0 && (
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Preview Values
                </p>
                <div className="flex flex-wrap gap-2">
                  {extractedVarNames.map((varName) => (
                    <input
                      key={varName}
                      type="text"
                      value={previewValues[varName] || ''}
                      onChange={(e) =>
                        setPreviewValues((prev) => ({
                          ...prev,
                          [varName]: e.target.value,
                        }))
                      }
                      placeholder={varName}
                      className="input px-2 py-1 text-xs w-32"
                    />
                  ))}
                </div>
              </div>
            )}
            <pre
              className="whitespace-pre-wrap text-sm text-foreground"
              dangerouslySetInnerHTML={{
                __html:
                  mode === 'preview' && Object.keys(previewValues).length > 0
                    ? previewContent
                    : highlightedContent,
              }}
            />
          </div>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          {extractedVarNames.length > 0
            ? `${extractedVarNames.length} variable${extractedVarNames.length > 1 ? 's' : ''} detected: ${extractedVarNames.map((v) => `{{${v}}}`).join(', ')}`
            : 'No variables detected. Use {{variable_name}} syntax to add dynamic values.'}
        </p>
      </div>

      {/* Variable Metadata Editor */}
      {extractedVarNames.length > 0 && (
        <div className="card p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Variable Settings</h2>
            <button
              onClick={() => setShowVariablePanel(!showVariablePanel)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showVariablePanel ? 'Hide' : 'Show'}
            </button>
          </div>

          {showVariablePanel && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-foreground w-28">
                      Variable
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-foreground">Description</th>
                    <th className="text-left py-2 px-2 font-medium text-foreground w-36">
                      Example
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-foreground w-20">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((variable, index) => (
                    <tr key={variable.name} className="border-b border-neutral-100">
                      <td className="py-2 px-2">
                        <code className="text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs">
                          {`{{${variable.name}}}`}
                        </code>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={variable.description}
                          onChange={(e) => updateVariable(index, 'description', e.target.value)}
                          placeholder="What this variable represents"
                          className="input w-full text-xs py-1"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={variable.example}
                          onChange={(e) => updateVariable(index, 'example', e.target.value)}
                          placeholder="Example value"
                          className="input w-full text-xs py-1"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={variable.required}
                          onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                          className="h-4 w-4 rounded border-input text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="card p-6 mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-background min-h-[42px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-foreground rounded-md text-sm"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-error-500">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length < 10 ? 'Add tag...' : ''}
            disabled={tags.length >= 10}
            className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Press Enter or comma to add. {10 - tags.length} tags remaining.
        </p>
      </div>

      {/* Public Toggle */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Public Prompt</h3>
            <p className="text-xs text-muted-foreground">
              Make this prompt discoverable by others in your workspace
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPublic ? 'bg-primary-600' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Bar (sticky on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 sm:hidden">
        <button
          onClick={handleSave}
          disabled={isSaving || !isValid}
          className="btn-primary w-full py-3"
        >
          {isSaving ? 'Creating...' : 'Create Prompt'}
        </button>
      </div>
    </div>
  );
}
