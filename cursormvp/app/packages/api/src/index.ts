import cors from "cors";
import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { env } from "./lib/env.js";
import { disconnectPrisma, prisma } from "./lib/prisma.js";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or extensions)
      if (!origin) return callback(null, true);

      // Allow web app origins (including fallback dev ports)
      const allowedOrigins = [
        env.WEB_URL,
        "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:3003",
      ];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Chrome extension origins
      if (origin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Health check endpoint (non-tRPC for simple monitoring)
app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
      },
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// tRPC API handler
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC] Error on ${path}:`, error);
    },
  })
);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
const server = app.listen(env.API_PORT, () => {
  console.log(`
    =====================================
    Distill API Server
    =====================================
    Environment: ${env.NODE_ENV}
    Port: ${env.API_PORT}
    Health: http://localhost:${env.API_PORT}/health
    tRPC: http://localhost:${env.API_PORT}/trpc
    =====================================
  `);
});

// Graceful shutdown
async function shutdown() {
  console.log("\nShutting down gracefully...");
  server.close(async () => {
    await disconnectPrisma();
    console.log("Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app, appRouter };
export type { AppRouter } from "./trpc/router.js";
