'use client';

/**
 * PromptCard Component
 *
 * Displays a prompt summary in a card format with quick actions.
 * Uses shadcn/ui Card component and Lucide icons.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeDate } from '@/lib/date';
import { Copy, Pencil, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { TagChip } from './TagFilter';

interface PromptCardProps {
  /** Prompt ID */
  id: string;
  /** Prompt title */
  title: string;
  /** Prompt description (optional) */
  description?: string;
  /** Associated tags */
  tags: string[];
  /** Number of times the prompt has been used */
  usageCount: number;
  /** Whether the prompt is public */
  isPublic: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Callback for copy action */
  onCopy?: (id: string) => void;
  /** Callback for run action */
  onRun?: (id: string) => void;
  /** Callback for edit action */
  onEdit?: (id: string) => void;
}

export function PromptCard({
  id,
  title,
  description,
  tags,
  usageCount,
  isPublic,
  updatedAt,
  onCopy,
  onRun,
  onEdit,
}: PromptCardProps) {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy?.(id);
  };

  const handleRun = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRun?.(id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(id);
  };

  return (
    <Link href={`/prompts/${id}`} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-1">{title}</h3>
            {isPublic && (
              <Badge variant="success" className="flex-shrink-0">
                Public
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-3">
          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <TagChip key={tag} tag={tag} size="sm" />
              ))}
              {tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Usage count">
              <PlayCircle className="h-3.5 w-3.5" />
              {usageCount}
            </span>
            <span title={`Updated ${updatedAt.toLocaleDateString()}`}>
              {formatRelativeDate(updatedAt)}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
              title="Copy prompt"
              aria-label="Copy prompt"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-primary hover:bg-primary/10"
              onClick={handleRun}
              title="Run prompt"
              aria-label="Run prompt"
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleEdit}
              title="Edit prompt"
              aria-label="Edit prompt"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

/**
 * PromptCardSkeleton Component
 *
 * Loading skeleton for the PromptCard.
 */
export function PromptCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div className="flex gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}
