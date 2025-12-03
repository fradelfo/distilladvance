/**
 * Search Service
 *
 * Provides full-text search, hybrid search (FTS + semantic), and search utilities.
 * Uses PostgreSQL tsvector for full-text search and combines with vector embeddings.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generateEmbedding } from './embedding.js';

// ============================================================================
// Types
// ============================================================================

export type SearchMode = 'KEYWORD' | 'FULLTEXT' | 'SEMANTIC' | 'HYBRID';

export interface SearchFilters {
  tags?: string[];
  isPublic?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  workspaceId?: string;
  minUsageCount?: number;
  authorId?: string;
}

export interface SearchOptions {
  query: string;
  mode: SearchMode;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  userId: string;
  includePublic?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  workspaceId: string | null;
  author: { id: string; name: string | null } | null;
  score: number;
  scoreBreakdown?: {
    fulltext?: number;
    semantic?: number;
  };
  highlight?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  mode: SearchMode;
  filters: SearchFilters;
  durationMs: number;
}

// ============================================================================
// Full-Text Search
// ============================================================================

/**
 * Build the WHERE clause for search filters
 */
function buildFilterWhereClause(
  filters: SearchFilters | undefined,
  userId: string,
  includePublic: boolean
): Prisma.PromptWhereInput {
  const conditions: Prisma.PromptWhereInput[] = [];

  // Access control: user's own prompts OR public prompts
  const accessConditions: Prisma.PromptWhereInput[] = [{ userId }];
  if (includePublic) {
    accessConditions.push({ isPublic: true });
  }
  if (filters?.workspaceId) {
    accessConditions.push({ workspaceId: filters.workspaceId });
  }
  conditions.push({ OR: accessConditions });

  // Tag filtering
  if (filters?.tags && filters.tags.length > 0) {
    conditions.push({ tags: { hasSome: filters.tags } });
  }

  // Public/private filtering
  if (filters?.isPublic !== undefined) {
    conditions.push({ isPublic: filters.isPublic });
  }

  // Date range filtering
  if (filters?.dateFrom) {
    conditions.push({ createdAt: { gte: filters.dateFrom } });
  }
  if (filters?.dateTo) {
    conditions.push({ createdAt: { lte: filters.dateTo } });
  }

  // Usage count filtering
  if (filters?.minUsageCount !== undefined) {
    conditions.push({ usageCount: { gte: filters.minUsageCount } });
  }

  // Author filtering
  if (filters?.authorId) {
    conditions.push({ userId: filters.authorId });
  }

  return { AND: conditions };
}

/**
 * Perform keyword search (simple LIKE search on title)
 */
export async function keywordSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, filters, limit = 20, offset = 0, userId, includePublic = true } = options;

  const whereClause = buildFilterWhereClause(filters, userId, includePublic);

  // Add title search
  const searchWhere: Prisma.PromptWhereInput = {
    AND: [whereClause, { title: { contains: query, mode: 'insensitive' } }],
  };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where: searchWhere,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.prompt.count({ where: searchWhere }),
  ]);

  const results: SearchResult[] = prompts.map((p, index) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    tags: p.tags,
    isPublic: p.isPublic,
    usageCount: p.usageCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    userId: p.userId,
    workspaceId: p.workspaceId,
    author: p.user,
    score: 1 - index * 0.01, // Simple scoring based on order
  }));

  return {
    results,
    total,
    query,
    mode: 'KEYWORD',
    filters: filters || {},
    durationMs: Date.now() - startTime,
  };
}

/**
 * Perform full-text search using PostgreSQL tsvector
 * Falls back to LIKE search if FTS isn't available
 */
export async function fulltextSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, filters, limit = 20, offset = 0, userId, includePublic = true } = options;

  // Build the search query for PostgreSQL full-text search
  // Convert the search query to tsquery format
  const searchTerms = query
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => `${term}:*`)
    .join(' & ');

  if (!searchTerms) {
    return {
      results: [],
      total: 0,
      query,
      mode: 'FULLTEXT',
      filters: filters || {},
      durationMs: Date.now() - startTime,
    };
  }

  // Build access control conditions for raw query
  let accessSql = `("userId" = '${userId}'`;
  if (includePublic) {
    accessSql += ` OR "isPublic" = true`;
  }
  if (filters?.workspaceId) {
    accessSql += ` OR "workspaceId" = '${filters.workspaceId}'`;
  }
  accessSql += `)`;

  // Build additional filter conditions
  const filterConditions: string[] = [accessSql];

  if (filters?.tags && filters.tags.length > 0) {
    const tagList = filters.tags.map((t) => `'${t}'`).join(',');
    filterConditions.push(`tags && ARRAY[${tagList}]`);
  }
  if (filters?.isPublic !== undefined) {
    filterConditions.push(`"isPublic" = ${filters.isPublic}`);
  }
  if (filters?.dateFrom) {
    filterConditions.push(`"createdAt" >= '${filters.dateFrom.toISOString()}'`);
  }
  if (filters?.dateTo) {
    filterConditions.push(`"createdAt" <= '${filters.dateTo.toISOString()}'`);
  }
  if (filters?.minUsageCount !== undefined) {
    filterConditions.push(`"usageCount" >= ${filters.minUsageCount}`);
  }
  if (filters?.authorId) {
    filterConditions.push(`"userId" = '${filters.authorId}'`);
  }

  const whereClause = filterConditions.join(' AND ');

  try {
    // First, check if the search_vector column exists
    const columnCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompts' AND column_name = 'search_vector'
      ) as exists
    `;

    const hasSearchVector = columnCheck[0]?.exists ?? false;

    if (hasSearchVector) {
      // Use full-text search with tsvector
      const results = await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          content: string;
          tags: string[];
          isPublic: boolean;
          usageCount: number;
          createdAt: Date;
          updatedAt: Date;
          userId: string;
          workspaceId: string | null;
          rank: number;
          headline: string | null;
          author_id: string | null;
          author_name: string | null;
        }>
      >`
        SELECT
          p.id,
          p.title,
          p.content,
          p.tags,
          p."isPublic",
          p."usageCount",
          p."createdAt",
          p."updatedAt",
          p."userId",
          p."workspaceId",
          ts_rank(p.search_vector, plainto_tsquery('english', ${query})) as rank,
          ts_headline('english', p.content, plainto_tsquery('english', ${query}),
            'MaxWords=35, MinWords=15, StartSel=<mark>, StopSel=</mark>') as headline,
          u.id as author_id,
          u.name as author_name
        FROM prompts p
        LEFT JOIN users u ON p."userId" = u.id
        WHERE p.search_vector @@ plainto_tsquery('english', ${query})
          AND ${Prisma.raw(whereClause)}
        ORDER BY rank DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Get total count
      const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM prompts p
        WHERE p.search_vector @@ plainto_tsquery('english', ${query})
          AND ${Prisma.raw(whereClause)}
      `;

      const total = Number(countResult[0]?.count ?? 0);

      const searchResults: SearchResult[] = results.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        tags: r.tags,
        isPublic: r.isPublic,
        usageCount: r.usageCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userId: r.userId,
        workspaceId: r.workspaceId,
        author: r.author_id ? { id: r.author_id, name: r.author_name } : null,
        score: r.rank,
        scoreBreakdown: { fulltext: r.rank },
        highlight: r.headline || undefined,
      }));

      return {
        results: searchResults,
        total,
        query,
        mode: 'FULLTEXT',
        filters: filters || {},
        durationMs: Date.now() - startTime,
      };
    } else {
      // Fallback to LIKE search on title and content
      console.warn('[Search] search_vector column not found, falling back to LIKE search');
      return likeSearch(options);
    }
  } catch (error) {
    console.error('[Search] Full-text search failed, falling back to LIKE:', error);
    return likeSearch(options);
  }
}

/**
 * Fallback LIKE search when FTS is not available
 */
async function likeSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, filters, limit = 20, offset = 0, userId, includePublic = true } = options;

  const whereClause = buildFilterWhereClause(filters, userId, includePublic);

  // Search in both title and content
  const searchWhere: Prisma.PromptWhereInput = {
    AND: [
      whereClause,
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
    ],
  };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where: searchWhere,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.prompt.count({ where: searchWhere }),
  ]);

  const results: SearchResult[] = prompts.map((p, index) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    tags: p.tags,
    isPublic: p.isPublic,
    usageCount: p.usageCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    userId: p.userId,
    workspaceId: p.workspaceId,
    author: p.user,
    score: 1 - index * 0.01,
  }));

  return {
    results,
    total,
    query,
    mode: 'FULLTEXT',
    filters: filters || {},
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// Semantic Search
// ============================================================================

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Perform semantic search using vector embeddings
 */
export async function semanticSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, filters, limit = 20, offset = 0, userId, includePublic = true } = options;

  // Generate embedding for the search query
  const embeddingResult = await generateEmbedding(query);

  if (!embeddingResult.success || !embeddingResult.embedding) {
    console.error('[Search] Failed to generate query embedding:', embeddingResult.error);
    return {
      results: [],
      total: 0,
      query,
      mode: 'SEMANTIC',
      filters: filters || {},
      durationMs: Date.now() - startTime,
    };
  }

  const queryVector = embeddingResult.embedding;
  const whereClause = buildFilterWhereClause(filters, userId, includePublic);

  // Fetch all embeddings for accessible prompts
  const embeddings = await prisma.promptEmbedding.findMany({
    where: {
      prompt: whereClause,
    },
    include: {
      prompt: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Calculate similarity scores
  const scoredResults = embeddings
    .map((emb) => ({
      prompt: emb.prompt,
      similarity: cosineSimilarity(queryVector, emb.vector),
    }))
    .filter((r) => r.similarity >= 0.5) // Minimum threshold
    .sort((a, b) => b.similarity - a.similarity);

  const total = scoredResults.length;
  const paginatedResults = scoredResults.slice(offset, offset + limit);

  const results: SearchResult[] = paginatedResults.map((r) => ({
    id: r.prompt.id,
    title: r.prompt.title,
    content: r.prompt.content,
    tags: r.prompt.tags,
    isPublic: r.prompt.isPublic,
    usageCount: r.prompt.usageCount,
    createdAt: r.prompt.createdAt,
    updatedAt: r.prompt.updatedAt,
    userId: r.prompt.userId,
    workspaceId: r.prompt.workspaceId,
    author: r.prompt.user,
    score: r.similarity,
    scoreBreakdown: { semantic: r.similarity },
  }));

  return {
    results,
    total,
    query,
    mode: 'SEMANTIC',
    filters: filters || {},
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// Hybrid Search with RRF
// ============================================================================

/**
 * Reciprocal Rank Fusion (RRF) to combine rankings from multiple search methods
 * RRF(d) = Σ 1 / (k + rank(d))
 * where k is typically 60
 */
function reciprocalRankFusion(
  rankings: Map<string, number>[],
  k: number = 60
): Map<string, number> {
  const fusedScores = new Map<string, number>();

  for (const ranking of rankings) {
    // Convert scores to ranks (1-indexed)
    const sortedEntries = [...ranking.entries()].sort((a, b) => b[1] - a[1]);

    sortedEntries.forEach(([id], index) => {
      const rank = index + 1;
      const rrf = 1 / (k + rank);
      fusedScores.set(id, (fusedScores.get(id) || 0) + rrf);
    });
  }

  return fusedScores;
}

/**
 * Perform hybrid search combining full-text and semantic search using RRF
 */
export async function hybridSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, filters, limit = 20, offset = 0, userId, includePublic = true } = options;

  // Run both searches in parallel
  const [fulltextResults, semanticResults] = await Promise.all([
    fulltextSearch({ ...options, limit: 100, offset: 0 }), // Get more for fusion
    semanticSearch({ ...options, limit: 100, offset: 0 }),
  ]);

  // Build rankings
  const fulltextRanking = new Map<string, number>();
  fulltextResults.results.forEach((r, i) => {
    fulltextRanking.set(r.id, r.score);
  });

  const semanticRanking = new Map<string, number>();
  semanticResults.results.forEach((r, i) => {
    semanticRanking.set(r.id, r.score);
  });

  // Apply RRF fusion
  const fusedScores = reciprocalRankFusion([fulltextRanking, semanticRanking]);

  // Collect all unique prompts
  const promptMap = new Map<string, SearchResult>();
  for (const result of fulltextResults.results) {
    promptMap.set(result.id, result);
  }
  for (const result of semanticResults.results) {
    if (!promptMap.has(result.id)) {
      promptMap.set(result.id, result);
    }
  }

  // Build final results with fused scores
  const fusedResults: SearchResult[] = [...fusedScores.entries()]
    .map(([id, score]) => {
      const prompt = promptMap.get(id);
      if (!prompt) return null;

      const result: SearchResult = {
        ...prompt,
        score,
        scoreBreakdown: {
          fulltext: fulltextRanking.get(id),
          semantic: semanticRanking.get(id),
        },
      };
      return result;
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.score - a.score);

  const total = fusedResults.length;
  const paginatedResults = fusedResults.slice(offset, offset + limit);

  return {
    results: paginatedResults,
    total,
    query,
    mode: 'HYBRID',
    filters: filters || {},
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// Main Search Entry Point
// ============================================================================

/**
 * Unified search function that routes to the appropriate search method
 */
export async function search(options: SearchOptions): Promise<SearchResponse> {
  switch (options.mode) {
    case 'KEYWORD':
      return keywordSearch(options);
    case 'FULLTEXT':
      return fulltextSearch(options);
    case 'SEMANTIC':
      return semanticSearch(options);
    case 'HYBRID':
      return hybridSearch(options);
    default:
      return fulltextSearch(options);
  }
}

// ============================================================================
// Setup Functions
// ============================================================================

/**
 * Initialize full-text search by adding tsvector column, trigger, and index
 * Uses a trigger-based approach since to_tsvector is not immutable
 * This should be run once during database setup
 */
export async function setupFullTextSearch(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if search_vector column already exists
    const columnCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompts' AND column_name = 'search_vector'
      ) as exists
    `;

    if (!columnCheck[0]?.exists) {
      // Add the tsvector column
      await prisma.$executeRaw`
        ALTER TABLE prompts
        ADD COLUMN search_vector tsvector
      `;
    }

    // Create or replace the trigger function
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION prompts_search_vector_trigger()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
          setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `;

    // Create the trigger
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS prompts_search_vector_update ON prompts
    `;

    await prisma.$executeRaw`
      CREATE TRIGGER prompts_search_vector_update
      BEFORE INSERT OR UPDATE ON prompts
      FOR EACH ROW
      EXECUTE FUNCTION prompts_search_vector_trigger()
    `;

    // Create GIN index for fast full-text search
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS prompts_search_vector_idx
      ON prompts USING GIN(search_vector)
    `;

    // Update existing rows to populate search_vector
    await prisma.$executeRaw`
      UPDATE prompts SET
        search_vector = setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
                        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
      WHERE search_vector IS NULL
    `;

    console.log('[Search] Full-text search setup complete');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Search] Failed to setup full-text search:', message);
    return { success: false, error: message };
  }
}

/**
 * Check if full-text search is available
 */
export async function isFullTextSearchAvailable(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'prompts' AND column_name = 'search_vector'
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } catch {
    return false;
  }
}
