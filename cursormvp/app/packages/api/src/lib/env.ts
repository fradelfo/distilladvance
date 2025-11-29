import { config } from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
config();

/**
 * Environment variable schema with validation.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.coerce.number().default(3001),
  API_SECRET: z.string().optional(),

  // Auth (shared with web app)
  AUTH_SECRET: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // ChromaDB
  CHROMA_URL: z.string().url().optional(),

  // CORS
  WEB_URL: z.string().url().default("http://localhost:3000"),

  // AI Services - Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL_DEFAULT: z.string().default("claude-sonnet-4-20250514"),

  // AI Services - OpenAI (fallback)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_DEFAULT: z.string().default("gpt-4-turbo-preview"),

  // Embedding Configuration
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(1536),
  EMBEDDING_BATCH_SIZE: z.coerce.number().default(10),

  // AI Configuration
  AI_MAX_TOKENS: z.coerce.number().default(4096),
  AI_TEMPERATURE: z.coerce.number().default(0.7),

  // Rate Limiting
  RATE_LIMIT_DISTILL_PER_MINUTE: z.coerce.number().default(10),
  RATE_LIMIT_DISTILL_PER_DAY: z.coerce.number().default(100),

  // Analytics (PostHog)
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default("http://localhost:8080"),
  ANALYTICS_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
});

/**
 * Parsed and validated environment variables.
 */
function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2)
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = loadEnv();

export type Env = z.infer<typeof envSchema>;
