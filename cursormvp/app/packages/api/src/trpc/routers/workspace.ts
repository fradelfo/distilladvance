import { randomBytes } from 'crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authedProcedure, publicProcedure, router } from '../index.js';

/**
 * Workspace router for team/workspace management.
 */
export const workspaceRouter = router({
  /**
   * Create a new workspace.
   */
  create: authedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z
          .string()
          .min(3)
          .max(50)
          .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken
      const existing = await ctx.prisma.workspace.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Workspace slug already exists',
        });
      }

      // Create workspace and add creator as owner
      const workspace = await ctx.prisma.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          members: {
            create: {
              userId: ctx.userId!,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      return workspace;
    }),

  /**
   * Get workspace by slug.
   */
  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const workspace = await ctx.prisma.workspace.findUnique({
      where: { slug: input.slug },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: {
          select: { prompts: true, collections: true },
        },
      },
    });

    if (!workspace) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      });
    }

    return workspace;
  }),

  /**
   * Get workspace by ID.
   */
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const workspace = await ctx.prisma.workspace.findUnique({
      where: { id: input.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: {
          select: { prompts: true, collections: true },
        },
      },
    });

    if (!workspace) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      });
    }

    return workspace;
  }),

  /**
   * List workspaces for the current user.
   */
  list: authedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.workspaceMember.findMany({
      where: { userId: ctx.userId! },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true, prompts: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }),

  /**
   * Update workspace details.
   */
  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner or admin
      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.id,
            userId: ctx.userId!,
          },
        },
      });

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can update workspace',
        });
      }

      const { id, ...data } = input;
      const workspace = await ctx.prisma.workspace.update({
        where: { id },
        data,
      });

      return workspace;
    }),

  /**
   * Delete workspace (owner only).
   */
  delete: authedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const membership = await ctx.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.id,
          userId: ctx.userId!,
        },
      },
    });

    if (!membership || membership.role !== 'OWNER') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only owners can delete workspace',
      });
    }

    await ctx.prisma.workspace.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  /**
   * Create invite link for workspace.
   */
  createInvite: authedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner or admin
      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.userId!,
          },
        },
      });

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can create invites',
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: input.workspaceId,
          user: { email: input.email },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already a member of this workspace',
        });
      }

      // Generate invite token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const invite = await ctx.prisma.workspaceInvite.create({
        data: {
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
        },
        include: {
          workspace: {
            select: { name: true, slug: true },
          },
        },
      });

      return invite;
    }),

  /**
   * Accept workspace invite.
   */
  acceptInvite: authedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.prisma.workspaceInvite.findUnique({
        where: { token: input.token },
        include: { workspace: true },
      });

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invite not found',
        });
      }

      if (invite.acceptedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invite has already been used',
        });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invite has expired',
        });
      }

      // Get current user's email
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
      });

      if (!user || user.email !== invite.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invite is for a different email address',
        });
      }

      // Create membership and mark invite as accepted
      await ctx.prisma.$transaction([
        ctx.prisma.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId: ctx.userId!,
            role: invite.role,
          },
        }),
        ctx.prisma.workspaceInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      return invite.workspace;
    }),

  /**
   * List pending invites for a workspace.
   */
  listInvites: authedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.userId!,
          },
        },
      });

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can view invites',
        });
      }

      const invites = await ctx.prisma.workspaceInvite.findMany({
        where: {
          workspaceId: input.workspaceId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      return invites;
    }),

  /**
   * Revoke/delete an invite.
   */
  revokeInvite: authedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.prisma.workspaceInvite.findUnique({
        where: { id: input.inviteId },
      });

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invite not found',
        });
      }

      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invite.workspaceId,
            userId: ctx.userId!,
          },
        },
      });

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners and admins can revoke invites',
        });
      }

      await ctx.prisma.workspaceInvite.delete({
        where: { id: input.inviteId },
      });

      return { success: true };
    }),

  /**
   * Remove a member from workspace.
   */
  removeMember: authedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.userId!,
          },
        },
      });

      const targetMembership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: input.userId,
          },
        },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Users can remove themselves
      const isSelf = ctx.userId === input.userId;

      // Only owners can remove admins, owners/admins can remove members
      const canRemove =
        isSelf ||
        (membership?.role === 'OWNER' && targetMembership.role !== 'OWNER') ||
        (membership?.role === 'ADMIN' && targetMembership.role === 'MEMBER');

      if (!canRemove) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "You don't have permission to remove this member",
        });
      }

      // Prevent removing the last owner
      if (targetMembership.role === 'OWNER') {
        const ownerCount = await ctx.prisma.workspaceMember.count({
          where: {
            workspaceId: input.workspaceId,
            role: 'OWNER',
          },
        });

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot remove the last owner',
          });
        }
      }

      await ctx.prisma.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Update member role.
   */
  updateMemberRole: authedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: ctx.userId!,
          },
        },
      });

      if (!membership || membership.role !== 'OWNER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only owners can change member roles',
        });
      }

      // Prevent demoting yourself if you're the only owner
      if (ctx.userId === input.userId && input.role !== 'OWNER') {
        const ownerCount = await ctx.prisma.workspaceMember.count({
          where: {
            workspaceId: input.workspaceId,
            role: 'OWNER',
          },
        });

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot demote the last owner',
          });
        }
      }

      const updated = await ctx.prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      return updated;
    }),
});
