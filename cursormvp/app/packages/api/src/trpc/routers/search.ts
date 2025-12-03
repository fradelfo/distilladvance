/**
 * Search tRPC Router
 *
 * Provides advanced search functionality including:
 * - Full-text search (PostgreSQL tsvector)
 * - Semantic search (vector embeddings)
 * - Hybrid search (combined with RRF)
 * - Saved searches
 * - Search history
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  type SearchMode,
  fulltextSearch,
  hybridSearch,
  isFullTextSearchAvailable,
  keywordSearch,
  search,
  semanticSearch,
  setupFullTextSearch,
} from '../../services/search.js';
import { authedProcedure, router } from '../index.js';

// ============================================================================
// Validation Schemas
// ============================================================================

const searchModeSchema = z.enum(['KEYWORD', 'FULLTEXT', 'SEMANTIC', 'HYBRID']);

const searchFiltersSchema = z
  .object({
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    workspaceId: z.string().optional(),
    minUsageCount: z.number().int().min(0).optional(),
    authorId: z.string().optional(),
  })
  .optional();

const searchInputSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  mode: searchModeSchema.default('FULLTEXT'),
  filters: searchFiltersSchema,
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  includePublic: z.boolean().default(true),
  logSearch: z.boolean().default(true), // Whether to log this search to history
});

const savedSearchInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  query: z.string().max(500).optional(),
  filters: z
    .object({
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      dateFrom: z.string().optional(), // ISO date string
      dateTo: z.string().optional(),
      workspaceId: z.string().optional(),
      minUsageCount: z.number().optional(),
      authorId: z.string().optional(),
    })
    .optional(),
  searchMode: searchModeSchema.default('FULLTEXT'),
  isDefault: z.boolean().default(false),
});

const updateSavedSearchSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  query: z.string().max(500).optional(),
  filters: z
    .object({
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      workspaceId: z.string().optional(),
      minUsageCount: z.number().optional(),
      authorId: z.string().optional(),
    })
    .optional(),
  searchMode: searchModeSchema.optional(),
  isDefault: z.boolean().optional(),
});

// ============================================================================
// Router Definition
// ============================================================================

export const searchRouter = router({
  /**
   * Unified search endpoint supporting multiple search modes
   */
  search: authedProcedure.input(searchInputSchema).query(async ({ ctx, input }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to search',
      });
    }

    const result = await search({
      query: input.query,
      mode: input.mode,
      filters: input.filters
        ? {
            ...input.filters,
            dateFrom: input.filters.dateFrom ? new Date(input.filters.dateFrom) : undefined,
            dateTo: input.filters.dateTo ? new Date(input.filters.dateTo) : undefined,
          }
        : undefined,
      limit: input.limit,
      offset: input.offset,
      userId,
      includePublic: input.includePublic,
    });

    // Log search to history if enabled
    if (input.logSearch && result.results.length > 0) {
      try {
        await ctx.prisma.searchHistory.create({
          data: {
            userId,
            query: input.query,
            searchMode: input.mode,
            resultCount: result.total,
            filters: input.filters ? (input.filters as object) : undefined,
          },
        });
      } catch (error) {
        console.error('[Search] Failed to log search history:', error);
      }
    }

    return {
      success: true,
      results: result.results.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content.slice(0, 300) + (r.content.length > 300 ? '...' : ''),
        tags: r.tags,
        isPublic: r.isPublic,
        usageCount: r.usageCount,
        createdAt: r.createdAt,
        author: r.author?.name ?? 'Unknown',
        authorId: r.userId,
        isOwner: r.userId === userId,
        score: Math.round(r.score * 1000) / 1000,
        scoreBreakdown: r.scoreBreakdown,
        highlight: r.highlight,
      })),
      total: result.total,
      query: result.query,
      mode: result.mode,
      durationMs: result.durationMs,
    };
  }),

  /**
   * Full-text search only
   */
  fulltext: authedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        filters: searchFiltersSchema,
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        includePublic: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to search',
        });
      }

      const result = await fulltextSearch({
        query: input.query,
        mode: 'FULLTEXT',
        filters: input.filters,
        limit: input.limit,
        offset: input.offset,
        userId,
        includePublic: input.includePublic,
      });

      return {
        success: true,
        results: result.results.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content.slice(0, 300) + (r.content.length > 300 ? '...' : ''),
          tags: r.tags,
          isPublic: r.isPublic,
          usageCount: r.usageCount,
          createdAt: r.createdAt,
          author: r.author?.name ?? 'Unknown',
          isOwner: r.userId === userId,
          score: r.score,
          highlight: r.highlight,
        })),
        total: result.total,
        durationMs: result.durationMs,
      };
    }),

  /**
   * Hybrid search (FTS + semantic)
   */
  hybrid: authedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        filters: searchFiltersSchema,
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        includePublic: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to search',
        });
      }

      const result = await hybridSearch({
        query: input.query,
        mode: 'HYBRID',
        filters: input.filters,
        limit: input.limit,
        offset: input.offset,
        userId,
        includePublic: input.includePublic,
      });

      return {
        success: true,
        results: result.results.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content.slice(0, 300) + (r.content.length > 300 ? '...' : ''),
          tags: r.tags,
          isPublic: r.isPublic,
          usageCount: r.usageCount,
          createdAt: r.createdAt,
          author: r.author?.name ?? 'Unknown',
          isOwner: r.userId === userId,
          score: r.score,
          scoreBreakdown: r.scoreBreakdown,
        })),
        total: result.total,
        durationMs: result.durationMs,
      };
    }),

  // ============================================================================
  // Saved Searches
  // ============================================================================

  /**
   * Create a saved search
   */
  createSavedSearch: authedProcedure
    .input(savedSearchInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to save searches',
        });
      }

      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.prisma.savedSearch.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const savedSearch = await ctx.prisma.savedSearch.create({
        data: {
          userId,
          name: input.name,
          query: input.query || null,
          filters: (input.filters as object) || {},
          searchMode: input.searchMode,
          isDefault: input.isDefault,
        },
      });

      return {
        success: true,
        savedSearch,
      };
    }),

  /**
   * List saved searches
   */
  listSavedSearches: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view saved searches',
      });
    }

    const savedSearches = await ctx.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    return {
      success: true,
      savedSearches,
    };
  }),

  /**
   * Update a saved search
   */
  updateSavedSearch: authedProcedure
    .input(updateSavedSearchSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update saved searches',
        });
      }

      // Verify ownership
      const existing = await ctx.prisma.savedSearch.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (existing.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this saved search',
        });
      }

      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.prisma.savedSearch.updateMany({
          where: { userId, isDefault: true, id: { not: input.id } },
          data: { isDefault: false },
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.query !== undefined) updateData.query = input.query;
      if (input.filters !== undefined) updateData.filters = input.filters;
      if (input.searchMode !== undefined) updateData.searchMode = input.searchMode;
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

      const savedSearch = await ctx.prisma.savedSearch.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        success: true,
        savedSearch,
      };
    }),

  /**
   * Delete a saved search
   */
  deleteSavedSearch: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete saved searches',
        });
      }

      // Verify ownership
      const existing = await ctx.prisma.savedSearch.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (existing.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this saved search',
        });
      }

      await ctx.prisma.savedSearch.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ============================================================================
  // Search History
  // ============================================================================

  /**
   * Get recent search history
   */
  getHistory: authedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view search history',
        });
      }

      const history = await ctx.prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        distinct: ['query'], // Only show unique queries
      });

      return {
        success: true,
        history,
      };
    }),

  /**
   * Clear search history
   */
  clearHistory: authedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to clear search history',
      });
    }

    await ctx.prisma.searchHistory.deleteMany({
      where: { userId },
    });

    return { success: true };
  }),

  // ============================================================================
  // Autocomplete
  // ============================================================================

  /**
   * Get autocomplete suggestions using trigram similarity
   */
  autocomplete: authedProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Query is required').max(100),
        limit: z.number().int().min(1).max(20).default(8),
        includeHistory: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to get autocomplete suggestions',
        });
      }

      const { query, limit, includeHistory } = input;
      const searchTerm = query.toLowerCase().trim();

      // Get suggestions from different sources
      const suggestions: Array<{
        type: 'title' | 'history' | 'tag';
        text: string;
        similarity: number;
      }> = [];

      // 1. Search recent history first (if enabled)
      if (includeHistory) {
        const historyMatches = await ctx.prisma.searchHistory.findMany({
          where: {
            userId,
            query: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          distinct: ['query'],
          select: { query: true },
        });

        for (const h of historyMatches) {
          suggestions.push({
            type: 'history',
            text: h.query,
            similarity: 1.0, // History matches are prioritized
          });
        }
      }

      // 2. Search prompt titles using trigram similarity
      try {
        const titleMatches = await ctx.prisma.$queryRaw<
          Array<{ title: string; similarity: number }>
        >`
          SELECT DISTINCT title, similarity(LOWER(title), ${searchTerm}) as similarity
          FROM prompts
          WHERE (user_id = ${userId} OR is_public = true)
            AND (
              LOWER(title) LIKE ${`%${searchTerm}%`}
              OR similarity(LOWER(title), ${searchTerm}) > 0.1
            )
          ORDER BY similarity DESC, title ASC
          LIMIT ${limit}
        `;

        for (const match of titleMatches) {
          // Avoid duplicates from history
          if (!suggestions.some((s) => s.text.toLowerCase() === match.title.toLowerCase())) {
            suggestions.push({
              type: 'title',
              text: match.title,
              similarity: match.similarity,
            });
          }
        }
      } catch (error) {
        // If trigram fails, fall back to simple LIKE
        console.warn('[Autocomplete] Trigram query failed, using fallback:', error);
        const titleMatches = await ctx.prisma.prompt.findMany({
          where: {
            OR: [{ userId }, { isPublic: true }],
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          select: { title: true },
          take: limit,
          distinct: ['title'],
        });

        for (const match of titleMatches) {
          if (!suggestions.some((s) => s.text.toLowerCase() === match.title.toLowerCase())) {
            suggestions.push({
              type: 'title',
              text: match.title,
              similarity: 0.5,
            });
          }
        }
      }

      // 3. Search popular tags
      const tagMatches = await ctx.prisma.prompt.findMany({
        where: {
          OR: [{ userId }, { isPublic: true }],
          tags: {
            hasSome: [searchTerm],
          },
        },
        select: { tags: true },
        take: 50,
      });

      // Extract and dedupe matching tags
      const tagCounts = new Map<string, number>();
      for (const prompt of tagMatches) {
        for (const tag of prompt.tags) {
          if (tag.toLowerCase().includes(searchTerm)) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        }
      }

      // Add top tags
      const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      for (const [tag] of sortedTags) {
        if (!suggestions.some((s) => s.text.toLowerCase() === tag.toLowerCase())) {
          suggestions.push({
            type: 'tag',
            text: tag,
            similarity: 0.8,
          });
        }
      }

      // Sort by similarity and limit
      const sortedSuggestions = suggestions
        .sort((a, b) => {
          // Prioritize: history > high similarity > tags
          if (a.type === 'history' && b.type !== 'history') return -1;
          if (b.type === 'history' && a.type !== 'history') return 1;
          return b.similarity - a.similarity;
        })
        .slice(0, limit);

      return {
        success: true,
        suggestions: sortedSuggestions,
      };
    }),

  // ============================================================================
  // Admin / Setup
  // ============================================================================

  /**
   * Check if full-text search is available
   */
  getStatus: authedProcedure.query(async () => {
    const ftsAvailable = await isFullTextSearchAvailable();

    return {
      success: true,
      status: {
        fulltextSearch: ftsAvailable,
        semanticSearch: true, // Always available if embeddings exist
        hybridSearch: ftsAvailable, // Requires FTS
      },
    };
  }),

  /**
   * Setup full-text search (admin only)
   */
  setupFullTextSearch: authedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    // TODO: Add admin check in production

    const result = await setupFullTextSearch();

    if (!result.success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: result.error || 'Failed to setup full-text search',
      });
    }

    return {
      success: true,
      message: 'Full-text search setup complete',
    };
  }),
});
