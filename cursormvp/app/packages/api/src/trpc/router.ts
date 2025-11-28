import { router } from "./index.js";
import { authRouter } from "./routers/auth.js";
import { coachRouter } from "./routers/coach.js";
import { collectionRouter } from "./routers/collection.js";
import { conversationRouter } from "./routers/conversation.js";
import { distillRouter } from "./routers/distill.js";
import { embeddingRouter } from "./routers/embedding.js";
import { healthRouter } from "./routers/health.js";
import { userRouter } from "./routers/user.js";
import { workspaceRouter } from "./routers/workspace.js";

/**
 * Root tRPC router combining all sub-routers.
 */
export const appRouter = router({
  auth: authRouter,
  coach: coachRouter,
  collection: collectionRouter,
  conversation: conversationRouter,
  distill: distillRouter,
  embedding: embeddingRouter,
  health: healthRouter,
  user: userRouter,
  workspace: workspaceRouter,
});

/**
 * Export type for client-side type inference.
 */
export type AppRouter = typeof appRouter;
