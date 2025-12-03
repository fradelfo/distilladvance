import { router } from './index.js';
import { analyticsRouter } from './routers/analytics.js';
import { authRouter } from './routers/auth.js';
import { billingRouter } from './routers/billing.js';
import { coachRouter } from './routers/coach.js';
import { collectionRouter } from './routers/collection.js';
import { conversationRouter } from './routers/conversation.js';
import { distillRouter } from './routers/distill.js';
import { embeddingRouter } from './routers/embedding.js';
import { healthRouter } from './routers/health.js';
import { searchRouter } from './routers/search.js';
import { userRouter } from './routers/user.js';
import { workflowRouter } from './routers/workflow.js';
import { workspaceRouter } from './routers/workspace.js';

/**
 * Root tRPC router combining all sub-routers.
 */
export const appRouter = router({
  analytics: analyticsRouter,
  auth: authRouter,
  billing: billingRouter,
  coach: coachRouter,
  collection: collectionRouter,
  conversation: conversationRouter,
  distill: distillRouter,
  embedding: embeddingRouter,
  health: healthRouter,
  search: searchRouter,
  user: userRouter,
  workflow: workflowRouter,
  workspace: workspaceRouter,
});

/**
 * Export type for client-side type inference.
 */
export type AppRouter = typeof appRouter;
