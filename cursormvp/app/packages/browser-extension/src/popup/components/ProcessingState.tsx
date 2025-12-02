import type React from 'react';

interface ProcessingStateProps {
  progress: number | null;
  step: string;
  isStalled?: boolean;
}

export function ProcessingState({
  progress,
  step,
  isStalled = false,
}: ProcessingStateProps): React.ReactElement {
  const isDeterminate = progress !== null;

  return (
    <div className="processing-container" role="status" aria-live="polite">
      {/* Spinner */}
      <div className="spinner-container" aria-hidden="true">
        <div className="spinner" />
      </div>

      {/* Title */}
      <h3 className="processing-title">Distilling your conversation...</h3>

      {/* Progress Bar */}
      {isDeterminate && (
        <div
          className="progress-container"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% complete`}
        >
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}% complete</span>
        </div>
      )}

      {/* Step Description */}
      <p className="step-description">{isStalled ? 'Taking longer than expected...' : step}</p>

      <style>{`
        .processing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 0;
          text-align: center;
        }

        .spinner-container {
          width: 56px;
          height: 56px;
          margin-bottom: 20px;
        }

        .spinner {
          width: 100%;
          height: 100%;
          border: 3px solid var(--color-gray-200);
          border-top-color: var(--color-primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .processing-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-gray-800);
          margin: 0 0 16px;
        }

        .progress-container {
          width: 100%;
          max-width: 280px;
          margin-bottom: 12px;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background: var(--color-gray-200);
          border-radius: 100px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
          border-radius: 100px;
          transition: width 0.3s ease;
        }

        .progress-text {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-gray-500);
        }

        .step-description {
          font-size: 13px;
          color: var(--color-gray-500);
          margin: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner {
            animation: none;
            border-top-color: var(--color-primary-600);
            opacity: 0.6;
          }

          .progress-fill {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
