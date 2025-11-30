/**
 * EmptyState Component
 *
 * Reusable empty state display with icon, title, description, and actions.
 */

interface EmptyStateProps {
  /** Icon or emoji to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  const ActionButton = ({
    action,
    variant,
  }: {
    action: NonNullable<EmptyStateProps['primaryAction']>;
    variant: 'primary' | 'secondary';
  }) => {
    const buttonClass =
      variant === 'primary' ? 'btn-primary px-6 py-2' : 'btn-outline px-6 py-2';

    if (action.href) {
      return (
        <a
          href={action.href}
          className={buttonClass}
          target={action.href.startsWith('http') ? '_blank' : undefined}
          rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {action.label}
        </a>
      );
    }

    return (
      <button onClick={action.onClick} className={buttonClass}>
        {action.label}
      </button>
    );
  };

  return (
    <div
      className={`card flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-5xl">{icon}</div>}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {primaryAction && (
            <ActionButton action={primaryAction} variant="primary" />
          )}
          {secondaryAction && (
            <ActionButton action={secondaryAction} variant="secondary" />
          )}
        </div>
      )}
    </div>
  );
}
