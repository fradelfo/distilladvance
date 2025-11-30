'use client';

/**
 * InviteForm Component
 *
 * Form for inviting members to a workspace with email and role selection.
 */

import { useState } from 'react';

type WorkspaceRole = 'ADMIN' | 'MEMBER';

interface InviteFormData {
  email: string;
  role: WorkspaceRole;
}

interface InviteFormProps {
  onSubmit: (data: InviteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const defaultValues: InviteFormData = {
  email: '',
  role: 'MEMBER',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteForm({
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: InviteFormProps) {
  const [formData, setFormData] = useState<InviteFormData>(defaultValues);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    role?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { email?: string; role?: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email Address <span className="text-error-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm ${
            validationErrors.email
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
              : 'border-input focus:border-primary-500'
          }`}
          placeholder="colleague@example.com"
          aria-describedby={validationErrors.email ? 'email-error' : undefined}
          aria-invalid={validationErrors.email ? 'true' : 'false'}
        />
        {validationErrors.email && (
          <p id="email-error" className="mt-1 text-sm text-error-600">
            {validationErrors.email}
          </p>
        )}
      </div>

      {/* Role Field */}
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-foreground"
        >
          Role <span className="text-error-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm ${
            validationErrors.role
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
              : 'border-input focus:border-primary-500'
          }`}
          aria-describedby="role-description"
          aria-invalid={validationErrors.role ? 'true' : 'false'}
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <p id="role-description" className="mt-1 text-xs text-muted-foreground">
          Admins can manage workspace settings and invite others. Members can
          view and use shared prompts.
        </p>
        {validationErrors.role && (
          <p className="mt-1 text-sm text-error-600">{validationErrors.role}</p>
        )}
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
              Sending...
            </span>
          ) : (
            'Send Invite'
          )}
        </button>
      </div>
    </form>
  );
}
