import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authedProcedure, router } from "../index.js";

/**
 * Helper to check if user has access to a workflow.
 * User has access if they own the workflow OR are a member of the workspace.
 */
async function checkWorkflowAccess(
  prisma: any,
  workflowId: string,
  userId: string
): Promise<{ workflow: any; canEdit: boolean }> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!workflow) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Workflow not found",
    });
  }

  const isOwner = workflow.userId === userId;
  const workspaceMembership = workflow.workspace?.members[0];
  const isMember = !!workspaceMembership;
  const isWorkspaceAdmin =
    workspaceMembership?.role === "OWNER" || workspaceMembership?.role === "ADMIN";

  // Access: owner OR workspace member (if workflow is in workspace)
  if (!isOwner && !isMember && !workflow.isPublic) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this workflow",
    });
  }

  // Can edit: owner OR workspace admin
  const canEdit = isOwner || isWorkspaceAdmin;

  return { workflow, canEdit };
}

/**
 * Workflow router for managing prompt workflows (chains).
 */
export const workflowRouter = router({
  /**
   * Create a new workflow.
   */
  create: authedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        workspaceId: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // If workspaceId is provided, verify user has access
      if (input.workspaceId) {
        const membership = await ctx.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: input.workspaceId,
              userId,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this workspace",
          });
        }
      }

      const workflow = await ctx.prisma.workflow.create({
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          userId,
          workspaceId: input.workspaceId,
        },
      });

      return {
        success: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          isPublic: workflow.isPublic,
          workspaceId: workflow.workspaceId,
          createdAt: workflow.createdAt.toISOString(),
          updatedAt: workflow.updatedAt.toISOString(),
        },
      };
    }),

  /**
   * Update a workflow's metadata.
   */
  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { canEdit } = await checkWorkflowAccess(ctx.prisma, input.id, userId);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this workflow",
        });
      }

      const { id, ...updateData } = input;
      const workflow = await ctx.prisma.workflow.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          isPublic: workflow.isPublic,
          workspaceId: workflow.workspaceId,
          createdAt: workflow.createdAt.toISOString(),
          updatedAt: workflow.updatedAt.toISOString(),
        },
      };
    }),

  /**
   * Delete a workflow.
   */
  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { canEdit } = await checkWorkflowAccess(ctx.prisma, input.id, userId);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this workflow",
        });
      }

      await ctx.prisma.workflow.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get workflow by ID with its steps.
   */
  getById: authedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { workflow, canEdit } = await checkWorkflowAccess(
        ctx.prisma,
        input.id,
        userId
      );

      // Fetch workflow with steps and prompt details
      const fullWorkflow = await ctx.prisma.workflow.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          workspace: {
            select: { id: true, name: true, slug: true },
          },
          steps: {
            include: {
              prompt: {
                select: {
                  id: true,
                  title: true,
                  content: true,
                  tags: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
          _count: {
            select: { executions: true },
          },
        },
      });

      return {
        success: true,
        workflow: {
          id: fullWorkflow!.id,
          name: fullWorkflow!.name,
          description: fullWorkflow!.description,
          isPublic: fullWorkflow!.isPublic,
          workspaceId: fullWorkflow!.workspaceId,
          createdAt: fullWorkflow!.createdAt.toISOString(),
          updatedAt: fullWorkflow!.updatedAt.toISOString(),
          user: fullWorkflow!.user,
          workspace: fullWorkflow!.workspace,
          isOwner: fullWorkflow!.userId === userId,
          canEdit,
          executionCount: fullWorkflow!._count.executions,
          steps: fullWorkflow!.steps.map((step) => ({
            id: step.id,
            order: step.order,
            inputMapping: step.inputMapping as Record<string, string> | null,
            createdAt: step.createdAt.toISOString(),
            prompt: step.prompt,
          })),
        },
      };
    }),

  /**
   * List workflows for the current user.
   */
  list: authedProcedure
    .input(
      z
        .object({
          workspaceId: z.string().optional(),
          includePublic: z.boolean().optional().default(false),
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const limit = input?.limit ?? 20;

      // Build where clause
      type WorkflowWhere = {
        OR?: Array<{ userId?: string; isPublic?: boolean; workspaceId?: string | null }>;
        userId?: string;
        workspaceId?: string | null;
        id?: { lt: string };
      };

      const whereClause: WorkflowWhere = {};

      if (input?.includePublic) {
        whereClause.OR = [{ userId }, { isPublic: true }];
      } else {
        whereClause.userId = userId;
      }

      if (input?.workspaceId) {
        whereClause.workspaceId = input.workspaceId;
      }

      if (input?.cursor) {
        whereClause.id = { lt: input.cursor };
      }

      const workflows = await ctx.prisma.workflow.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          workspace: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { steps: true, executions: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit + 1, // Fetch one extra to determine if there are more
      });

      // Check if there are more results
      let nextCursor: string | undefined;
      if (workflows.length > limit) {
        const lastItem = workflows.pop();
        nextCursor = lastItem?.id;
      }

      return {
        success: true,
        workflows: workflows.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          isPublic: w.isPublic,
          workspaceId: w.workspaceId,
          stepCount: w._count.steps,
          executionCount: w._count.executions,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
          user: w.user,
          workspace: w.workspace,
          isOwner: w.userId === userId,
        })),
        nextCursor,
      };
    }),

  /**
   * Add a step to a workflow.
   */
  addStep: authedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        promptId: z.string(),
        order: z.number().int().min(0).optional(),
        inputMapping: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { canEdit } = await checkWorkflowAccess(ctx.prisma, input.workflowId, userId);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this workflow",
        });
      }

      // Verify prompt exists and user has access
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
        select: { id: true, userId: true, isPublic: true, workspaceId: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (!prompt.isPublic && prompt.userId !== userId) {
        // Check if prompt is in a workspace user has access to
        if (prompt.workspaceId) {
          const membership = await ctx.prisma.workspaceMember.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId: prompt.workspaceId,
                userId,
              },
            },
          });
          if (!membership) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have access to this prompt",
            });
          }
        } else {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this prompt",
          });
        }
      }

      // Get the next order value if not provided
      let order = input.order;
      if (order === undefined) {
        const lastStep = await ctx.prisma.workflowStep.findFirst({
          where: { workflowId: input.workflowId },
          orderBy: { order: "desc" },
        });
        order = lastStep ? lastStep.order + 1 : 0;
      } else {
        // Shift existing steps to make room
        await ctx.prisma.workflowStep.updateMany({
          where: {
            workflowId: input.workflowId,
            order: { gte: order },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }

      const step = await ctx.prisma.workflowStep.create({
        data: {
          workflowId: input.workflowId,
          promptId: input.promptId,
          order,
          inputMapping: input.inputMapping,
        },
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              content: true,
              tags: true,
            },
          },
        },
      });

      return {
        success: true,
        step: {
          id: step.id,
          order: step.order,
          inputMapping: step.inputMapping as Record<string, string> | null,
          createdAt: step.createdAt.toISOString(),
          prompt: step.prompt,
        },
      };
    }),

  /**
   * Update a step (order, inputMapping).
   */
  updateStep: authedProcedure
    .input(
      z.object({
        stepId: z.string(),
        inputMapping: z.record(z.string()).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Get the step to find its workflow
      const step = await ctx.prisma.workflowStep.findUnique({
        where: { id: input.stepId },
        select: { workflowId: true },
      });

      if (!step) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Step not found",
        });
      }

      const { canEdit } = await checkWorkflowAccess(ctx.prisma, step.workflowId, userId);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this workflow",
        });
      }

      // Handle nullable JSON properly for Prisma
      const updateData: Prisma.WorkflowStepUpdateInput = {};
      if (input.inputMapping !== undefined) {
        updateData.inputMapping = input.inputMapping === null
          ? Prisma.JsonNull
          : input.inputMapping;
      }

      const updatedStep = await ctx.prisma.workflowStep.update({
        where: { id: input.stepId },
        data: updateData,
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              content: true,
              tags: true,
            },
          },
        },
      });

      return {
        success: true,
        step: {
          id: updatedStep.id,
          order: updatedStep.order,
          inputMapping: updatedStep.inputMapping as Record<string, string> | null,
          createdAt: updatedStep.createdAt.toISOString(),
          prompt: updatedStep.prompt,
        },
      };
    }),

  /**
   * Remove a step from a workflow.
   */
  removeStep: authedProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Get the step to find its workflow and order
      const step = await ctx.prisma.workflowStep.findUnique({
        where: { id: input.stepId },
        select: { workflowId: true, order: true },
      });

      if (!step) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Step not found",
        });
      }

      const { canEdit } = await checkWorkflowAccess(ctx.prisma, step.workflowId, userId);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this workflow",
        });
      }

      // Delete the step and reorder remaining steps
      await ctx.prisma.$transaction([
        ctx.prisma.workflowStep.delete({
          where: { id: input.stepId },
        }),
        ctx.prisma.workflowStep.updateMany({
          where: {
            workflowId: step.workflowId,
            order: { gt: step.order },
          },
          data: {
            order: { decrement: 1 },
          },
        }),
      ]);

      return { success: true };
    }),

  /**
   * Reorder steps in a workflow.
   */
  reorderSteps: authedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        stepIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const { canEdit } = await checkWorkflowAccess(ctx.prisma, input.workflowId, userId);

      if (!canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this workflow",
        });
      }

      // Verify all steps belong to this workflow
      const existingSteps = await ctx.prisma.workflowStep.findMany({
        where: { workflowId: input.workflowId },
        select: { id: true },
      });

      const existingIds = new Set(existingSteps.map((s) => s.id));
      for (const id of input.stepIds) {
        if (!existingIds.has(id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Step ${id} does not belong to this workflow`,
          });
        }
      }

      // Use a transaction to update all orders
      // First, set all to negative to avoid unique constraint violations
      const tempUpdates = input.stepIds.map((id, index) =>
        ctx.prisma.workflowStep.update({
          where: { id },
          data: { order: -(index + 1) },
        })
      );

      // Then, set to final positive values
      const finalUpdates = input.stepIds.map((id, index) =>
        ctx.prisma.workflowStep.update({
          where: { id },
          data: { order: index },
        })
      );

      await ctx.prisma.$transaction([...tempUpdates, ...finalUpdates]);

      return { success: true };
    }),
});
