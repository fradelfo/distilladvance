'use client';

/**
 * OnboardingContent Component
 *
 * Multi-step wizard for new user onboarding.
 * Steps: Welcome -> Create/Join Workspace -> Install Extension -> Complete
 */

import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface OnboardingContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

type OnboardingStep = 'welcome' | 'workspace' | 'extension' | 'complete';

const STEPS: OnboardingStep[] = ['welcome', 'workspace', 'extension', 'complete'];
const ONBOARDING_COMPLETED_KEY = 'distill_onboarding_completed';

export function OnboardingContent({ user }: OnboardingContentProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // tRPC mutation for creating workspace
  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: () => {
      setIsCreatingWorkspace(false);
      goToNextStep();
    },
    onError: (error) => {
      setIsCreatingWorkspace(false);
      if (error.message.includes('slug')) {
        setSlugError('This workspace URL is already taken. Please try another.');
      } else {
        setSlugError(error.message);
      }
    },
  });

  // Check if onboarding was already completed
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (completed === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  // Auto-generate slug from workspace name
  useEffect(() => {
    if (workspaceName) {
      const slug = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50);
      setWorkspaceSlug(slug);
      setSlugError(null);
    }
  }, [workspaceName]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !workspaceSlug.trim()) {
      return;
    }

    if (workspaceSlug.length < 3) {
      setSlugError('Workspace URL must be at least 3 characters');
      return;
    }

    setIsCreatingWorkspace(true);
    setSlugError(null);

    createWorkspace.mutate({
      name: workspaceName.trim(),
      slug: workspaceSlug.trim(),
    });
  };

  const handleSkipWorkspace = () => {
    goToNextStep();
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">💧</span>
            <span className="text-2xl font-semibold text-foreground">Distill</span>
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-2 rounded-full transition-colors ${
                index <= currentStepIndex ? 'bg-primary-600' : 'bg-neutral-300'
              }`}
              aria-label={`Step ${index + 1} ${index <= currentStepIndex ? 'completed' : 'pending'}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="card p-8">
          {/* Step 1: Welcome */}
          {currentStep === 'welcome' && (
            <WelcomeStep userName={user.name || 'there'} onNext={goToNextStep} />
          )}

          {/* Step 2: Workspace */}
          {currentStep === 'workspace' && (
            <WorkspaceStep
              workspaceName={workspaceName}
              workspaceSlug={workspaceSlug}
              slugError={slugError}
              isCreating={isCreatingWorkspace}
              onNameChange={setWorkspaceName}
              onSlugChange={(slug) => {
                setWorkspaceSlug(slug);
                setSlugError(null);
              }}
              onCreateWorkspace={handleCreateWorkspace}
              onSkip={handleSkipWorkspace}
              onBack={goToPreviousStep}
            />
          )}

          {/* Step 3: Extension */}
          {currentStep === 'extension' && (
            <ExtensionStep onNext={goToNextStep} onBack={goToPreviousStep} />
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <CompleteStep userName={user.name || 'there'} onComplete={handleCompleteOnboarding} />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome
interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
}

function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="mb-6 text-5xl">👋</div>
      <h1 className="text-2xl font-bold text-foreground">Welcome, {userName}!</h1>
      <p className="mt-4 text-muted-foreground">
        Distill helps you capture, organize, and share your best AI prompts.
      </p>

      <div className="mt-8 space-y-3 text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm text-primary-600">
            1
          </div>
          <p className="text-sm text-foreground">
            <span className="font-medium">Capture conversations</span> from ChatGPT, Claude, and
            other AI tools
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm text-primary-600">
            2
          </div>
          <p className="text-sm text-foreground">
            <span className="font-medium">Distill into templates</span> with reusable variables
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm text-primary-600">
            3
          </div>
          <p className="text-sm text-foreground">
            <span className="font-medium">Share with your team</span> and build a prompt library
          </p>
        </div>
      </div>

      <button onClick={onNext} className="btn-primary mt-8 w-full px-6 py-3">
        Get Started
      </button>
    </div>
  );
}

// Step 2: Workspace
interface WorkspaceStepProps {
  workspaceName: string;
  workspaceSlug: string;
  slugError: string | null;
  isCreating: boolean;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onCreateWorkspace: () => void;
  onSkip: () => void;
  onBack: () => void;
}

function WorkspaceStep({
  workspaceName,
  workspaceSlug,
  slugError,
  isCreating,
  onNameChange,
  onSlugChange,
  onCreateWorkspace,
  onSkip,
  onBack,
}: WorkspaceStepProps) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mb-4 text-4xl">🏢</div>
        <h2 className="text-xl font-bold text-foreground">Create a workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Workspaces let you organize prompts and collaborate with your team. You can skip this and
          use your personal space instead.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="workspace-name" className="label mb-1 block">
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={workspaceName}
            onChange={(e) => onNameChange(e.target.value)}
            className="input"
            placeholder="My Team"
            disabled={isCreating}
          />
        </div>

        <div>
          <label htmlFor="workspace-slug" className="label mb-1 block">
            Workspace URL
          </label>
          <div className="flex items-center">
            <span className="rounded-l-md border border-r-0 border-input bg-secondary px-3 py-2 text-sm text-muted-foreground">
              distill.app/
            </span>
            <input
              id="workspace-slug"
              type="text"
              value={workspaceSlug}
              onChange={(e) =>
                onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              className="input rounded-l-none"
              placeholder="my-team"
              disabled={isCreating}
            />
          </div>
          {slugError && <p className="mt-1 text-sm text-error-600">{slugError}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={onCreateWorkspace}
          disabled={isCreating || !workspaceName.trim()}
          className="btn-primary w-full px-6 py-3 disabled:opacity-50"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
              Creating...
            </span>
          ) : (
            'Create Workspace'
          )}
        </button>

        <button
          onClick={onSkip}
          disabled={isCreating}
          className="btn-ghost w-full px-6 py-3 text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>
    </div>
  );
}

// Step 3: Extension
interface ExtensionStepProps {
  onNext: () => void;
  onBack: () => void;
}

function ExtensionStep({ onNext, onBack }: ExtensionStepProps) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mb-4 text-4xl">🧩</div>
        <h2 className="text-xl font-bold text-foreground">Install the browser extension</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The Distill extension lets you capture conversations directly from AI chat interfaces.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-secondary p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm">
            <svg className="h-8 w-8" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Chrome Extension</h3>
            <p className="text-sm text-muted-foreground">Works with Chrome, Edge, and Brave</p>
          </div>
        </div>

        <a
          href="https://chrome.google.com/webstore"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 flex w-full items-center justify-center gap-2 px-6 py-3"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Install Extension
        </a>
      </div>

      <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <p className="text-sm text-primary-800">
          <span className="font-medium">Tip:</span> After installing, use the keyboard shortcut{' '}
          <kbd className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-mono">Ctrl+Shift+D</kbd>{' '}
          (or{' '}
          <kbd className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-mono">Cmd+Shift+D</kbd>{' '}
          on Mac) to capture a conversation.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <button onClick={onNext} className="btn-primary w-full px-6 py-3">
          Continue
        </button>

        <button
          onClick={onNext}
          className="btn-ghost w-full px-6 py-3 text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>
    </div>
  );
}

// Step 4: Complete
interface CompleteStepProps {
  userName: string;
  onComplete: () => void;
}

function CompleteStep({ userName, onComplete }: CompleteStepProps) {
  return (
    <div className="text-center">
      <div className="mb-6 text-5xl">🎉</div>
      <h2 className="text-2xl font-bold text-foreground">You're all set, {userName}!</h2>
      <p className="mt-4 text-muted-foreground">
        Your account is ready. Start capturing and distilling your best AI conversations.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-secondary p-4">
        <h3 className="font-medium text-foreground">Quick start tips</h3>
        <ul className="mt-3 space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary-600">-</span>
            Visit ChatGPT, Claude, or Gemini and have a conversation
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">-</span>
            Click the Distill extension icon or use the keyboard shortcut
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">-</span>
            Review and save your distilled prompt template
          </li>
        </ul>
      </div>

      <button onClick={onComplete} className="btn-primary mt-8 w-full px-6 py-3">
        Go to Dashboard
      </button>
    </div>
  );
}
