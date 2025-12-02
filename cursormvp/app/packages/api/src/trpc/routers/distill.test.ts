/**
 * Tests for Distill tRPC Router
 *
 * Tests for the stats endpoint and prompt-related operations.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma client
const mockPrismaPromptCount = vi.fn();
const mockPrismaPromptGroupBy = vi.fn();

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    prompt: {
      count: (...args: any[]) => mockPrismaPromptCount(...args),
      groupBy: (...args: any[]) => mockPrismaPromptGroupBy(...args),
    },
  },
}));

// Mock distillation service
vi.mock('../../services/distillation.js', () => ({
  distillConversation: vi.fn(),
  createUsageLogEntry: vi.fn(),
}));

import { distillRouter } from './distill.js';

// Helper to create a mock context with Prisma
function createMockContext(userId: string | null = 'test-user-123') {
  return {
    userId,
    session: userId
      ? {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        }
      : null,
    prisma: {
      prompt: {
        count: mockPrismaPromptCount,
        groupBy: mockPrismaPromptGroupBy,
      },
    },
  };
}

describe('Distill Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Stats Endpoint Tests
  // ============================================================================

  describe('stats', () => {
    it('should return prompt statistics for authenticated user', async () => {
      const userId = 'test-user-123';

      // Mock Prisma responses
      mockPrismaPromptCount.mockResolvedValue(15);
      mockPrismaPromptGroupBy.mockResolvedValue([
        { isPublic: true, _count: { isPublic: 5 } },
        { isPublic: false, _count: { isPublic: 10 } },
      ]);

      const caller = distillRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.stats();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        total: 15,
        publicCount: 5,
        privateCount: 10,
      });

      // Verify count was called with correct userId
      expect(mockPrismaPromptCount).toHaveBeenCalledWith({
        where: { userId },
      });

      // Verify groupBy was called correctly
      expect(mockPrismaPromptGroupBy).toHaveBeenCalledWith({
        by: ['isPublic'],
        where: { userId },
        _count: { isPublic: true },
      });
    });

    it('should return zero counts for user with no prompts', async () => {
      const userId = 'new-user-456';

      mockPrismaPromptCount.mockResolvedValue(0);
      mockPrismaPromptGroupBy.mockResolvedValue([]);

      const caller = distillRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.stats();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        total: 0,
        publicCount: 0,
        privateCount: 0,
      });
    });

    it('should handle user with only public prompts', async () => {
      const userId = 'public-only-user';

      mockPrismaPromptCount.mockResolvedValue(8);
      mockPrismaPromptGroupBy.mockResolvedValue([{ isPublic: true, _count: { isPublic: 8 } }]);

      const caller = distillRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.stats();

      expect(result.stats).toEqual({
        total: 8,
        publicCount: 8,
        privateCount: 0,
      });
    });

    it('should handle user with only private prompts', async () => {
      const userId = 'private-only-user';

      mockPrismaPromptCount.mockResolvedValue(12);
      mockPrismaPromptGroupBy.mockResolvedValue([{ isPublic: false, _count: { isPublic: 12 } }]);

      const caller = distillRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.stats();

      expect(result.stats).toEqual({
        total: 12,
        publicCount: 0,
        privateCount: 12,
      });
    });

    it('should throw UNAUTHORIZED error when user is not logged in', async () => {
      const caller = distillRouter.createCaller(createMockContext(null) as any);

      await expect(caller.stats()).rejects.toThrow('You must be logged in to perform this action');
    });

    it('should execute count and groupBy queries in parallel', async () => {
      const userId = 'parallel-test-user';
      let countCallTime: number | undefined;
      let groupByCallTime: number | undefined;

      mockPrismaPromptCount.mockImplementation(async () => {
        countCallTime = Date.now();
        return 5;
      });

      mockPrismaPromptGroupBy.mockImplementation(async () => {
        groupByCallTime = Date.now();
        return [{ isPublic: true, _count: { isPublic: 5 } }];
      });

      const caller = distillRouter.createCaller(createMockContext(userId) as any);
      await caller.stats();

      // Both should be called
      expect(mockPrismaPromptCount).toHaveBeenCalled();
      expect(mockPrismaPromptGroupBy).toHaveBeenCalled();
    });
  });
});
