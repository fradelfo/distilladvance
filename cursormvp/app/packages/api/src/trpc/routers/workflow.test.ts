/**
 * Tests for Workflow tRPC Router
 *
 * Tests for CRUD operations on workflows and workflow steps.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma client
const mockWorkflowFindUnique = vi.fn();
const mockWorkflowFindMany = vi.fn();
const mockWorkflowCreate = vi.fn();
const mockWorkflowUpdate = vi.fn();
const mockWorkflowDelete = vi.fn();
const mockWorkflowStepCreate = vi.fn();
const mockWorkflowStepUpdate = vi.fn();
const mockWorkflowStepUpdateMany = vi.fn();
const mockWorkflowStepDelete = vi.fn();
const mockWorkflowStepFindFirst = vi.fn();
const mockWorkflowStepFindMany = vi.fn();
const mockWorkflowStepFindUnique = vi.fn();
const mockWorkspaceMemberFindUnique = vi.fn();
const mockPromptFindUnique = vi.fn();
const mockTransaction = vi.fn();

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    workflow: {
      findUnique: (...args: any[]) => mockWorkflowFindUnique(...args),
      findMany: (...args: any[]) => mockWorkflowFindMany(...args),
      create: (...args: any[]) => mockWorkflowCreate(...args),
      update: (...args: any[]) => mockWorkflowUpdate(...args),
      delete: (...args: any[]) => mockWorkflowDelete(...args),
    },
    workflowStep: {
      create: (...args: any[]) => mockWorkflowStepCreate(...args),
      update: (...args: any[]) => mockWorkflowStepUpdate(...args),
      updateMany: (...args: any[]) => mockWorkflowStepUpdateMany(...args),
      delete: (...args: any[]) => mockWorkflowStepDelete(...args),
      findFirst: (...args: any[]) => mockWorkflowStepFindFirst(...args),
      findMany: (...args: any[]) => mockWorkflowStepFindMany(...args),
      findUnique: (...args: any[]) => mockWorkflowStepFindUnique(...args),
    },
    workspaceMember: {
      findUnique: (...args: any[]) => mockWorkspaceMemberFindUnique(...args),
    },
    prompt: {
      findUnique: (...args: any[]) => mockPromptFindUnique(...args),
    },
    $transaction: (...args: any[]) => mockTransaction(...args),
  },
}));

import { workflowRouter } from "./workflow.js";

// Helper to create a mock context with Prisma
function createMockContext(userId: string | null = "test-user-123") {
  return {
    userId,
    session: userId
      ? {
          user: {
            id: userId,
            email: "test@example.com",
          },
        }
      : null,
    prisma: {
      workflow: {
        findUnique: mockWorkflowFindUnique,
        findMany: mockWorkflowFindMany,
        create: mockWorkflowCreate,
        update: mockWorkflowUpdate,
        delete: mockWorkflowDelete,
      },
      workflowStep: {
        create: mockWorkflowStepCreate,
        update: mockWorkflowStepUpdate,
        updateMany: mockWorkflowStepUpdateMany,
        delete: mockWorkflowStepDelete,
        findFirst: mockWorkflowStepFindFirst,
        findMany: mockWorkflowStepFindMany,
        findUnique: mockWorkflowStepFindUnique,
      },
      workspaceMember: {
        findUnique: mockWorkspaceMemberFindUnique,
      },
      prompt: {
        findUnique: mockPromptFindUnique,
      },
      $transaction: mockTransaction,
    },
  };
}

describe("Workflow Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Create Workflow Tests
  // ============================================================================

  describe("create", () => {
    it("should create a workflow for authenticated user", async () => {
      const userId = "test-user-123";
      const workflowData = {
        name: "Test Workflow",
        description: "A test workflow",
        isPublic: false,
      };

      const createdWorkflow = {
        id: "wf-1",
        userId,
        ...workflowData,
        workspaceId: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockWorkflowCreate.mockResolvedValue(createdWorkflow);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.create(workflowData);

      expect(result.success).toBe(true);
      expect(result.workflow.name).toBe("Test Workflow");
      expect(result.workflow.id).toBe("wf-1");
    });

    it("should create a workflow in a workspace when user has access", async () => {
      const userId = "test-user-123";
      const workspaceId = "ws-1";
      const workflowData = {
        name: "Team Workflow",
        workspaceId,
      };

      mockWorkspaceMemberFindUnique.mockResolvedValue({
        id: "membership-1",
        role: "MEMBER",
      });

      const createdWorkflow = {
        id: "wf-2",
        userId,
        name: "Team Workflow",
        description: null,
        isPublic: false,
        workspaceId,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      mockWorkflowCreate.mockResolvedValue(createdWorkflow);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.create(workflowData);

      expect(result.success).toBe(true);
      expect(result.workflow.workspaceId).toBe(workspaceId);
      expect(mockWorkspaceMemberFindUnique).toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when user lacks workspace access", async () => {
      const userId = "test-user-123";
      const workspaceId = "ws-no-access";

      mockWorkspaceMemberFindUnique.mockResolvedValue(null);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);

      await expect(
        caller.create({
          name: "Forbidden Workflow",
          workspaceId,
        })
      ).rejects.toThrow("You don't have access to this workspace");
    });

    it("should throw UNAUTHORIZED for unauthenticated users", async () => {
      const caller = workflowRouter.createCaller(createMockContext(null) as any);

      await expect(
        caller.create({ name: "Test" })
      ).rejects.toThrow("You must be logged in to perform this action");
    });
  });

  // ============================================================================
  // Get Workflow Tests
  // ============================================================================

  describe("getById", () => {
    it("should return workflow with steps for owner", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";

      // Mock for access check
      mockWorkflowFindUnique
        .mockResolvedValueOnce({
          id: workflowId,
          userId,
          workspace: null,
          isPublic: false,
        })
        // Mock for full workflow fetch
        .mockResolvedValueOnce({
          id: workflowId,
          userId,
          name: "My Workflow",
          description: "A workflow",
          isPublic: false,
          workspaceId: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          user: { id: userId, name: "Test User", email: "test@example.com", image: null },
          workspace: null,
          steps: [
            {
              id: "step-1",
              order: 0,
              inputMapping: null,
              createdAt: new Date("2024-01-01"),
              prompt: { id: "prompt-1", title: "Extract Info", content: "Extract {{data}}", tags: [] },
            },
          ],
          _count: { executions: 5 },
        });

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.getById({ id: workflowId });

      expect(result.success).toBe(true);
      expect(result.workflow.name).toBe("My Workflow");
      expect(result.workflow.steps).toHaveLength(1);
      expect(result.workflow.isOwner).toBe(true);
      expect(result.workflow.canEdit).toBe(true);
    });

    it("should throw NOT_FOUND for non-existent workflow", async () => {
      const userId = "test-user-123";

      mockWorkflowFindUnique.mockResolvedValue(null);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);

      await expect(
        caller.getById({ id: "non-existent" })
      ).rejects.toThrow("Workflow not found");
    });

    it("should throw FORBIDDEN when user lacks access", async () => {
      const userId = "test-user-123";
      const otherUserId = "other-user-456";

      mockWorkflowFindUnique.mockResolvedValue({
        id: "wf-private",
        userId: otherUserId,
        workspace: null,
        isPublic: false,
      });

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);

      await expect(
        caller.getById({ id: "wf-private" })
      ).rejects.toThrow("You don't have access to this workflow");
    });
  });

  // ============================================================================
  // List Workflows Tests
  // ============================================================================

  describe("list", () => {
    it("should return user's workflows", async () => {
      const userId = "test-user-123";

      mockWorkflowFindMany.mockResolvedValue([
        {
          id: "wf-1",
          userId,
          name: "Workflow 1",
          description: null,
          isPublic: false,
          workspaceId: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          user: { id: userId, name: "Test User", email: "test@example.com", image: null },
          workspace: null,
          _count: { steps: 3, executions: 10 },
        },
      ]);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.list();

      expect(result.success).toBe(true);
      expect(result.workflows).toHaveLength(1);
      expect(result.workflows[0].stepCount).toBe(3);
      expect(result.workflows[0].executionCount).toBe(10);
    });

    it("should support pagination with cursor", async () => {
      const userId = "test-user-123";

      mockWorkflowFindMany.mockResolvedValue([
        {
          id: "wf-2",
          userId,
          name: "Workflow 2",
          description: null,
          isPublic: false,
          workspaceId: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          user: { id: userId, name: "Test User", email: "test@example.com", image: null },
          workspace: null,
          _count: { steps: 2, executions: 5 },
        },
      ]);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.list({ cursor: "wf-1", limit: 10 });

      expect(result.success).toBe(true);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  // ============================================================================
  // Update Workflow Tests
  // ============================================================================

  describe("update", () => {
    it("should update workflow for owner", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      const updatedWorkflow = {
        id: workflowId,
        userId,
        name: "Updated Workflow",
        description: "New description",
        isPublic: true,
        workspaceId: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      mockWorkflowUpdate.mockResolvedValue(updatedWorkflow);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.update({
        id: workflowId,
        name: "Updated Workflow",
        description: "New description",
        isPublic: true,
      });

      expect(result.success).toBe(true);
      expect(result.workflow.name).toBe("Updated Workflow");
      expect(result.workflow.isPublic).toBe(true);
    });

    it("should throw FORBIDDEN for non-owner without edit rights", async () => {
      const userId = "test-user-123";
      const otherUserId = "other-user-456";

      mockWorkflowFindUnique.mockResolvedValue({
        id: "wf-1",
        userId: otherUserId,
        workspace: {
          members: [{ role: "MEMBER" }], // Not admin/owner
        },
        isPublic: false,
      });

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);

      await expect(
        caller.update({ id: "wf-1", name: "Hacked" })
      ).rejects.toThrow("You don't have permission to update this workflow");
    });
  });

  // ============================================================================
  // Delete Workflow Tests
  // ============================================================================

  describe("delete", () => {
    it("should delete workflow for owner", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      mockWorkflowDelete.mockResolvedValue({ id: workflowId });

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.delete({ id: workflowId });

      expect(result.success).toBe(true);
      expect(mockWorkflowDelete).toHaveBeenCalledWith({ where: { id: workflowId } });
    });
  });

  // ============================================================================
  // Add Step Tests
  // ============================================================================

  describe("addStep", () => {
    it("should add a step to workflow", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";
      const promptId = "prompt-1";

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      mockPromptFindUnique.mockResolvedValue({
        id: promptId,
        userId,
        isPublic: false,
        workspaceId: null,
      });

      mockWorkflowStepFindFirst.mockResolvedValue(null); // No existing steps

      const createdStep = {
        id: "step-1",
        workflowId,
        promptId,
        order: 0,
        inputMapping: null,
        createdAt: new Date("2024-01-01"),
        prompt: { id: promptId, title: "Test Prompt", content: "Hello {{name}}", tags: [] },
      };

      mockWorkflowStepCreate.mockResolvedValue(createdStep);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.addStep({ workflowId, promptId });

      expect(result.success).toBe(true);
      expect(result.step.order).toBe(0);
      expect(result.step.prompt.title).toBe("Test Prompt");
    });

    it("should auto-increment order when adding step without specific order", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";
      const promptId = "prompt-2";

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      mockPromptFindUnique.mockResolvedValue({
        id: promptId,
        userId,
        isPublic: false,
        workspaceId: null,
      });

      // Existing step at order 0
      mockWorkflowStepFindFirst.mockResolvedValue({ order: 0 });

      const createdStep = {
        id: "step-2",
        workflowId,
        promptId,
        order: 1,
        inputMapping: null,
        createdAt: new Date("2024-01-01"),
        prompt: { id: promptId, title: "Another Prompt", content: "Test", tags: [] },
      };

      mockWorkflowStepCreate.mockResolvedValue(createdStep);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.addStep({ workflowId, promptId });

      expect(result.step.order).toBe(1);
    });

    it("should throw FORBIDDEN when user lacks prompt access", async () => {
      const userId = "test-user-123";
      const otherUserId = "other-user-456";

      mockWorkflowFindUnique.mockResolvedValue({
        id: "wf-1",
        userId,
        workspace: null,
        isPublic: false,
      });

      mockPromptFindUnique.mockResolvedValue({
        id: "prompt-private",
        userId: otherUserId,
        isPublic: false,
        workspaceId: null,
      });

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);

      await expect(
        caller.addStep({ workflowId: "wf-1", promptId: "prompt-private" })
      ).rejects.toThrow("You don't have access to this prompt");
    });
  });

  // ============================================================================
  // Remove Step Tests
  // ============================================================================

  describe("removeStep", () => {
    it("should remove a step and reorder remaining steps", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";
      const stepId = "step-1";

      mockWorkflowStepFindUnique.mockResolvedValue({
        workflowId,
        order: 0,
      });

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      mockTransaction.mockResolvedValue([{}, {}]);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.removeStep({ stepId });

      expect(result.success).toBe(true);
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Reorder Steps Tests
  // ============================================================================

  describe("reorderSteps", () => {
    it("should reorder steps in a workflow", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      mockWorkflowStepFindMany.mockResolvedValue([
        { id: "step-1" },
        { id: "step-2" },
        { id: "step-3" },
      ]);

      mockTransaction.mockResolvedValue([]);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);
      const result = await caller.reorderSteps({
        workflowId,
        stepIds: ["step-3", "step-1", "step-2"], // New order
      });

      expect(result.success).toBe(true);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST if step doesn't belong to workflow", async () => {
      const userId = "test-user-123";
      const workflowId = "wf-1";

      mockWorkflowFindUnique.mockResolvedValue({
        id: workflowId,
        userId,
        workspace: null,
        isPublic: false,
      });

      mockWorkflowStepFindMany.mockResolvedValue([
        { id: "step-1" },
        { id: "step-2" },
      ]);

      const caller = workflowRouter.createCaller(createMockContext(userId) as any);

      await expect(
        caller.reorderSteps({
          workflowId,
          stepIds: ["step-1", "step-unknown"],
        })
      ).rejects.toThrow("does not belong to this workflow");
    });
  });
});
