'use client';

/**
 * CollectionCard Component
 *
 * Displays a collection summary in a card format with quick actions.
 * Uses shadcn/ui Card component and Lucide icons.
 */

import Link from 'next/link';
import { Folder, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeDate } from '@/lib/date';

interface CollectionCardProps {
  /** Collection ID */
  id: string;
  /** Collection name */
  name: string;
  /** Collection description (optional) */
  description?: string | null;
  /** Number of prompts in the collection */
  promptCount: number;
  /** Whether the collection is public */
  isPublic: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last updated date */
  updatedAt: Date;
  /** Whether the current user owns this collection */
  isOwner?: boolean;
  /** Callback for edit action */
  onEdit?: (id: string) => void;
  /** Callback for delete action */
  onDelete?: (id: string) => void;
}

export function CollectionCard({
  id,
  name,
  description,
  promptCount,
  isPublic,
  updatedAt,
  isOwner = true,
  onEdit,
  onDelete,
}: CollectionCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <Link href={`/collections/${id}`} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Folder icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Folder className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground line-clamp-1">
                {name}
              </h3>
            </div>
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
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Prompt count badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {promptCount} prompt{promptCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span title={`Updated ${updatedAt.toLocaleDateString()}`}>
              Updated {formatRelativeDate(updatedAt)}
            </span>
          </div>

          {/* Quick Actions (only for owners) */}
          {isOwner && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleEdit}
                title="Edit collection"
                aria-label="Edit collection"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                title="Delete collection"
                aria-label="Delete collection"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

/**
 * CollectionCardSkeleton Component
 *
 * Loading skeleton for the CollectionCard.
 */
export function CollectionCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}
