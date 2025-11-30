'use client';

/**
 * WorkspaceForm Component
 *
 * Form for creating and editing workspaces.
 */

import { useState, useEffect } from 'react';

interface WorkspaceFormData {
  name: string;
  slug: string;
  description: string;
}

interface WorkspaceFormProps {
  initialValues?: WorkspaceFormData;
  isLoading?: boolean;
  isEditing?: boolean;
  onSubmit: (data: WorkspaceFormData) => void;
  onCancel: () => void;
  error?: string | null;
}

const defaultValues: WorkspaceFormData = {
  name: '',
  slug: '',
  description: '',
};

export function WorkspaceForm({
  initialValues,
  isLoading = false,
  isEditing = false,
  onSubmit,
  onCancel,
  error,
}: WorkspaceFormProps) {
  const [formData, setFormData] = useState<WorkspaceFormData>(
    initialValues || defaultValues
  );
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    slug?: string;
    description?: string;
  }>({});
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && !isEditing) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, autoSlug, isEditing]);

  const validate = (): boolean => {
    const errors: { name?: string; slug?: string; description?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (formData.slug.length < 3) {
      errors.slug = 'Slug must be at least 3 characters';
    } else if (formData.slug.length > 50) {
      errors.slug = 'Slug must be 50 characters or less';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug must be lowercase letters, numbers, and hyphens only';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Stop auto-slug when user manually edits slug
    if (name === 'slug') {
      setAutoSlug(false);
    }

    // Clear validation error
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div
          className="rounded-md bg-error-50 p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-error-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-error-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          Workspace Name <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm ${
            validationErrors.name
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
              : 'border-input focus:border-primary-500'
          }`}
          placeholder="My Team"
          maxLength={100}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-error-600">{validationErrors.name}</p>
        )}
      </div>

      {/* Slug Field */}
      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-foreground"
        >
          URL Slug <span className="text-error-500">*</span>
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            /workspaces/
          </span>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            disabled={isLoading || isEditing}
            className={`block w-full rounded-r-md border px-3 py-2 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm ${
              validationErrors.slug
                ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
                : 'border-input focus:border-primary-500'
            } ${isEditing ? 'bg-muted cursor-not-allowed' : ''}`}
            placeholder="my-team"
            maxLength={50}
          />
        </div>
        {validationErrors.slug && (
          <p className="mt-1 text-sm text-error-600">{validationErrors.slug}</p>
        )}
        {!isEditing && (
          <p className="mt-1 text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only. Cannot be changed
            later.
          </p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          rows={3}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm ${
            validationErrors.description
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
              : 'border-input focus:border-primary-500'
          }`}
          placeholder="What does this workspace focus on?"
          maxLength={500}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-error-600">
            {validationErrors.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn-outline px-4 py-2"
        >
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary px-4 py-2">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isEditing ? 'Saving...' : 'Creating...'}
            </span>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Create Workspace'
          )}
        </button>
      </div>
    </form>
  );
}
