'use client';

/**
 * CollectionForm Component
 *
 * Form for creating and editing collections.
 */

import { useState, useEffect } from 'react';

interface CollectionFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

interface CollectionFormProps {
  /** Initial values for editing */
  initialValues?: CollectionFormData;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Whether this is an edit form */
  isEditing?: boolean;
  /** Called when form is submitted */
  onSubmit: (data: CollectionFormData) => void;
  /** Called when form is cancelled */
  onCancel: () => void;
  /** Error message to display */
  error?: string | null;
}

const defaultValues: CollectionFormData = {
  name: '',
  description: '',
  isPublic: false,
};

export function CollectionForm({
  initialValues,
  isLoading = false,
  isEditing = false,
  onSubmit,
  onCancel,
  error,
}: CollectionFormProps) {
  const [formData, setFormData] = useState<CollectionFormData>(
    initialValues || defaultValues
  );
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  // Update form data when initialValues change
  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  const validate = (): boolean => {
    const errors: { name?: string; description?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be 100 characters or less';
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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          Name <span className="text-error-500">*</span>
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
          placeholder="My Collection"
          aria-invalid={!!validationErrors.name}
          aria-describedby={validationErrors.name ? 'name-error' : undefined}
          maxLength={100}
        />
        {validationErrors.name && (
          <p id="name-error" className="mt-1 text-sm text-error-600">
            {validationErrors.name}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formData.name.length}/100 characters
        </p>
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
          placeholder="A brief description of this collection..."
          aria-invalid={!!validationErrors.description}
          aria-describedby={
            validationErrors.description ? 'description-error' : undefined
          }
          maxLength={500}
        />
        {validationErrors.description && (
          <p id="description-error" className="mt-1 text-sm text-error-600">
            {validationErrors.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Public Toggle */}
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            disabled={isLoading}
            className="h-4 w-4 rounded border-input text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor="isPublic"
            className="text-sm font-medium text-foreground"
          >
            Make this collection public
          </label>
          <p className="text-xs text-muted-foreground">
            Public collections can be viewed by anyone with the link
          </p>
        </div>
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
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary px-4 py-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            'Create Collection'
          )}
        </button>
      </div>
    </form>
  );
}
