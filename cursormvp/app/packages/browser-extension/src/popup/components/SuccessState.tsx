import type { DistillResult } from '@distill/shared-types';
import type React from 'react';

interface SuccessStateProps {
  result: DistillResult;
  onViewEdit: () => void;
  onCaptureAnother: () => void;
}

export function SuccessState({
  result,
  onViewEdit,
  onCaptureAnother,
}: SuccessStateProps): React.ReactElement {
  return (
    <div className="success-container" role="status" aria-live="polite">
      {/* Success Icon */}
      <div className="success-icon" aria-hidden="true">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Result Card */}
      <div className="result-card">
        <h3 className="result-title">"{result.title}"</h3>

        {result.metadata?.originalLength && (
          <div className="result-meta">
            <span className="meta-item">
              <span className="meta-label">Variables detected:</span>
              <span className="meta-value">{result.metadata.distilledLength || 0}</span>
            </span>
          </div>
        )}

        {result.tags && result.tags.length > 0 && (
          <div className="result-tags">
            {result.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="success-actions">
        <button type="button" className="btn-primary" onClick={onViewEdit} autoFocus>
          View & Edit
        </button>
        <button type="button" className="btn-secondary" onClick={onCaptureAnother}>
          Capture Another
        </button>
      </div>

      <style>{`
        .success-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
          text-align: center;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-success-500);
          margin-bottom: 20px;
          animation: scaleIn 0.3s ease;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .result-card {
          width: 100%;
          background: var(--color-gray-50);
          border: 1px solid var(--color-gray-200);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
          text-align: left;
        }

        .result-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-gray-800);
          margin: 0 0 12px;
          line-height: 1.4;
        }

        .result-meta {
          margin-bottom: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .meta-label {
          color: var(--color-gray-500);
        }

        .meta-value {
          font-weight: 600;
          color: var(--color-gray-700);
        }

        .result-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          display: inline-block;
          padding: 4px 10px;
          background: white;
          border: 1px solid var(--color-gray-200);
          border-radius: 100px;
          font-size: 12px;
          color: var(--color-gray-600);
        }

        .success-actions {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: var(--color-primary-500);
          border: none;
          color: white;
        }

        .btn-primary:hover {
          background: var(--color-primary-600);
        }

        .btn-secondary {
          background: white;
          border: 1px solid var(--color-gray-300);
          color: var(--color-gray-700);
        }

        .btn-secondary:hover {
          background: var(--color-gray-50);
          border-color: var(--color-gray-400);
        }

        .btn-primary:focus-visible,
        .btn-secondary:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .success-icon {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
