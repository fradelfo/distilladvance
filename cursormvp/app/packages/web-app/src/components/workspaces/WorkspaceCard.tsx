'use client';

/**
 * WorkspaceCard Component
 *
 * Displays a workspace summary in a card format.
 * Uses shadcn/ui Card component and Lucide icons.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatShortDate } from '@/lib/date';
import { FileText, Users } from 'lucide-react';
import Link from 'next/link';

interface WorkspaceCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  memberCount: number;
  promptCount: number;
  joinedAt: Date;
}

export function WorkspaceCard({
  name,
  slug,
  description,
  image,
  role,
  memberCount,
  promptCount,
  joinedAt,
}: WorkspaceCardProps) {
  // Map roles to badge variants
  const roleVariant = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  } as const;

  return (
    <Link href={`/workspaces/${slug}`} className="block h-full">
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Workspace Icon/Image */}
            {image ? (
              <img src={image} alt={name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground line-clamp-1">{name}</h3>
              <p className="text-sm text-muted-foreground">/{slug}</p>
            </div>
            <Badge variant={roleVariant[role]} className="flex-shrink-0">
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-3">
          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t flex flex-col items-start gap-2">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>{memberCount} members</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>{promptCount} prompts</span>
            </div>
          </div>

          {/* Joined date */}
          <p className="text-xs text-muted-foreground/70">Joined {formatShortDate(joinedAt)}</p>
        </CardFooter>
      </Card>
    </Link>
  );
}

/**
 * WorkspaceCardSkeleton
 */
export function WorkspaceCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex flex-col items-start gap-2">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-28" />
      </CardFooter>
    </Card>
  );
}
