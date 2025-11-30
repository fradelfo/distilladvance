'use client';

/**
 * CoachPanel Component
 *
 * Displays AI-powered prompt improvement suggestions.
 * Can be used in both the prompt detail view and edit pages.
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

// ============================================================================
// Types
// ============================================================================

type FocusArea =
  | 'clarity'
  | 'structure'
  | 'variables'
  | 'specificity'
  | 'output_format'
  | 'comprehensive';

interface CoachingSuggestion {
  id: string;
  area: Exclude<FocusArea, 'comprehensive'>;
  title: string;
  issue: string;
  current: string;
  suggested: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
}

interface CoachingAnalysis {
  overallScore: number;
  summary: string;
  strengths: string[];
  suggestions: CoachingSuggestion[];
  quickWins: string[];
}

interface CoachPanelProps {
  /** The prompt ID to analyze */
  promptId: string;
  /** Optional callback when a suggestion is applied */
  onApplySuggestion?: (suggestion: CoachingSuggestion) => void;
  /** Whether to show in compact mode */
  compact?: boolean;
}

// ============================================================================
// Focus Area Configuration
// ============================================================================

const FOCUS_AREAS: Array<{
  id: FocusArea;
  name: string;
  description: string;
}> = [
  {
    id: 'comprehensive',
    name: 'Full Review',
    description: 'Analyze all aspects',
  },
  { id: 'clarity', name: 'Clarity', description: 'Clear and unambiguous?' },
  { id: 'structure', name: 'Structure', description: 'Well-organized?' },
  { id: 'variables', name: 'Variables', description: 'Placeholders defined?' },
  {
    id: 'specificity',
    name: 'Specificity',
    description: 'Enough context?',
  },
  {
    id: 'output_format',
    name: 'Output Format',
    description: 'Expected output specified?',
  },
];

const IMPACT_COLORS = {
  high: 'bg-error-100 text-error-700 border-error-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-secondary text-foreground border-border',
};

const AREA_ICONS: Record<Exclude<FocusArea, 'comprehensive'>, string> = {
  clarity: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  structure:
    'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  variables:
    'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  specificity:
    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  output_format:
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

// ============================================================================
// Score Display Component
// ============================================================================

function ScoreDisplay({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getScoreColor = () => {
    if (score >= 0.85) return 'text-success-600';
    if (score >= 0.7) return 'text-primary-600';
    if (score >= 0.5) return 'text-amber-600';
    return 'text-error-600';
  };

  const getScoreLabel = () => {
    if (score >= 0.85) return 'Excellent';
    if (score >= 0.7) return 'Strong';
    if (score >= 0.5) return 'Good';
    if (score >= 0.3) return 'Needs Work';
    return 'Major Issues';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-neutral-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={getScoreColor()}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor()}`}
        >
          {percentage}
        </span>
      </div>
      <div>
        <p className={`font-semibold ${getScoreColor()}`}>{getScoreLabel()}</p>
        <p className="text-sm text-muted-foreground">Quality Score</p>
      </div>
    </div>
  );
}

// ============================================================================
// Suggestion Card Component
// ============================================================================

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: CoachingSuggestion;
  onApply?: (suggestion: CoachingSuggestion) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-secondary transition-colors"
      >
        {/* Area Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={AREA_ICONS[suggestion.area]}
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">
              {suggestion.title}
            </h4>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${IMPACT_COLORS[suggestion.impact]}`}
            >
              {suggestion.impact}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {suggestion.issue}
          </p>
        </div>

        {/* Expand Icon */}
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 bg-secondary">
          {/* Current vs Suggested */}
          {suggestion.current && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Current:
              </p>
              <pre className="text-sm bg-error-50 text-error-800 p-2 rounded border border-error-200 whitespace-pre-wrap font-mono">
                {suggestion.current}
              </pre>
            </div>
          )}

          {suggestion.suggested && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Suggested:
              </p>
              <pre className="text-sm bg-success-50 text-success-800 p-2 rounded border border-success-200 whitespace-pre-wrap font-mono">
                {suggestion.suggested}
              </pre>
            </div>
          )}

          {/* Reasoning */}
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Why this helps:
            </p>
            <p className="text-sm text-foreground">{suggestion.reasoning}</p>
          </div>

          {/* Apply Button */}
          {onApply && suggestion.suggested && (
            <button
              onClick={() => onApply(suggestion)}
              className="btn-primary text-sm px-3 py-1.5"
            >
              Apply Suggestion
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CoachPanel({
  promptId,
  onApplySuggestion,
  compact = false,
}: CoachPanelProps) {
  const [selectedArea, setSelectedArea] = useState<FocusArea>('comprehensive');
  const [analysis, setAnalysis] = useState<CoachingAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Coaching mutation
  const coachMutation = trpc.coach.generateSuggestions.useMutation({
    onSuccess: (data) => {
      if (data.analysis) {
        setAnalysis(data.analysis);
        setShowResults(true);
      }
    },
  });

  const handleGenerateSuggestions = useCallback(() => {
    coachMutation.mutate({
      promptId,
      focusArea: selectedArea,
    });
  }, [coachMutation, promptId, selectedArea]);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setShowResults(false);
  }, []);

  // Loading state
  if (coachMutation.isPending) {
    return (
      <div className="border border-border rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4" />
          <p className="text-muted-foreground font-medium">
            Analyzing your prompt...
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            This may take a few seconds
          </p>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults && analysis) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header with Score */}
        <div className="p-4 bg-secondary border-b border-border flex items-center justify-between">
          <ScoreDisplay score={analysis.overallScore} />
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Analyze Again
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 border-b border-border">
          <p className="text-foreground">{analysis.summary}</p>
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Strengths
            </h3>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <svg
                    className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Improvement Suggestions ({analysis.suggestions.length})
            </h3>
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={onApplySuggestion}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {analysis.quickWins.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Quick Wins
            </h3>
            <ul className="space-y-1">
              {analysis.quickWins.map((win, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <svg
                    className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  {win}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage Stats */}
        {coachMutation.data && (
          <div className="px-4 py-2 bg-secondary border-t border-border text-xs text-muted-foreground">
            Analysis completed in {coachMutation.data.usage.durationMs}ms |{' '}
            {coachMutation.data.usage.tokens} tokens | $
            {coachMutation.data.usage.cost.toFixed(4)}
          </div>
        )}
      </div>
    );
  }

  // Initial state - request analysis
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-primary-50 rounded-lg">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-foreground">Prompt Coach</h3>
          <p className="text-sm text-muted-foreground">
            Get AI-powered suggestions to improve your prompt
          </p>
        </div>
      </div>

      {/* Focus Area Selection */}
      {!compact && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Focus Area
          </label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedArea === area.id
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-background border-border text-muted-foreground hover:border-input'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {FOCUS_AREAS.find((a) => a.id === selectedArea)?.description}
          </p>
        </div>
      )}

      {/* Error Display */}
      {coachMutation.isError && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-sm text-error-700">
            {coachMutation.error?.message || 'Failed to analyze prompt'}
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerateSuggestions}
        disabled={coachMutation.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Get Coaching Suggestions
      </button>
    </div>
  );
}
