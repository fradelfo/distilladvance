import type React from 'react';

type PrivacyMode = 'prompt-only' | 'full';

interface PrivacyModeSelectorProps {
  value: PrivacyMode;
  onChange: (value: PrivacyMode) => void;
  canOverride?: boolean;
}

export function PrivacyModeSelector({
  value,
  onChange,
  canOverride = true,
}: PrivacyModeSelectorProps): React.ReactElement {
  return (
    <div className="privacy-selector" role="radiogroup" aria-labelledby="privacy-label">
      <label id="privacy-label" className="privacy-label">
        Privacy Mode
      </label>

      <div className="privacy-options">
        <label
          className={`privacy-option ${value === 'prompt-only' ? 'selected' : ''} ${!canOverride ? 'disabled' : ''}`}
        >
          <input
            type="radio"
            name="privacy-mode"
            value="prompt-only"
            checked={value === 'prompt-only'}
            onChange={() => onChange('prompt-only')}
            disabled={!canOverride}
            aria-describedby="prompt-only-desc"
          />
          <div className="option-content">
            <div className="option-header">
              <span className="option-title">Prompt only</span>
              <span className="recommended-badge">Recommended</span>
            </div>
            <p id="prompt-only-desc" className="option-description">
              Only the distilled template is saved
            </p>
          </div>
          <span className="radio-indicator" aria-hidden="true" />
        </label>

        <label
          className={`privacy-option ${value === 'full' ? 'selected' : ''} ${!canOverride ? 'disabled' : ''}`}
        >
          <input
            type="radio"
            name="privacy-mode"
            value="full"
            checked={value === 'full'}
            onChange={() => onChange('full')}
            disabled={!canOverride}
            aria-describedby="full-desc"
          />
          <div className="option-content">
            <span className="option-title">Full conversation</span>
            <p id="full-desc" className="option-description">
              Raw chat saved for reference
            </p>
          </div>
          <span className="radio-indicator" aria-hidden="true" />
        </label>
      </div>

      <a
        href="https://distill.ai/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="privacy-link"
      >
        Learn more about privacy
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M7 17L17 7M17 7H7M17 7V17" />
        </svg>
      </a>

      <style>{`
        .privacy-selector {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .privacy-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .privacy-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .privacy-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          background: white;
          border: 2px solid var(--color-gray-200);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .privacy-option:hover:not(.disabled) {
          border-color: var(--color-gray-300);
        }

        .privacy-option.selected {
          border-color: var(--color-primary-500);
          background: rgba(99, 102, 241, 0.02);
        }

        .privacy-option.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .privacy-option input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .privacy-option input:focus-visible + .option-content + .radio-indicator {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }

        .radio-indicator {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-gray-300);
          border-radius: 50%;
          margin-top: 1px;
          transition: all 0.15s ease;
          position: relative;
        }

        .privacy-option.selected .radio-indicator {
          border-color: var(--color-primary-500);
        }

        .privacy-option.selected .radio-indicator::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: var(--color-primary-500);
          border-radius: 50%;
        }

        .option-content {
          flex: 1;
        }

        .option-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .option-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-gray-800);
        }

        .recommended-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 2px 6px;
          background: var(--color-primary-500);
          color: white;
          border-radius: 4px;
        }

        .option-description {
          font-size: 12px;
          color: var(--color-gray-500);
          margin: 0;
          line-height: 1.4;
        }

        .privacy-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-primary-600);
          text-decoration: none;
          margin-top: 4px;
        }

        .privacy-link:hover {
          text-decoration: underline;
        }

        .privacy-link:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
