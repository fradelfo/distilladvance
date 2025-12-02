import type React from 'react';

interface StatsPanelProps {
  promptsSaved: number;
  lastCapture: string | null;
}

export function StatsPanel({ promptsSaved, lastCapture }: StatsPanelProps): React.ReactElement {
  const formattedLastCapture = lastCapture ? formatRelativeTime(lastCapture) : 'Never';

  return (
    <section className="stats-panel" aria-label="Capture statistics">
      <div className="stat-item">
        <span className="stat-value">{promptsSaved}</span>
        <span className="stat-label">Prompts Saved</span>
      </div>
      <div className="stat-divider" aria-hidden="true" />
      <div className="stat-item">
        <span className="stat-value">{formattedLastCapture}</span>
        <span className="stat-label">Last Capture</span>
      </div>

      <style>{`
        .stats-panel {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid var(--color-gray-200);
          border-radius: 10px;
          padding: 14px;
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-gray-900);
        }

        .stat-label {
          font-size: 11px;
          color: var(--color-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: var(--color-gray-200);
        }
      `}</style>
    </section>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
