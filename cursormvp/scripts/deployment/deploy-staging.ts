#!/usr/bin/env bun
/**
 * Deploy to Staging Environment
 *
 * This script deploys the application to staging for testing.
 * Usage: bun run deploy:staging
 */

import { $ } from "bun";

const STAGING_BRANCH = "develop";

async function main() {
  console.log("🚀 Starting staging deployment...\n");

  // Check current branch
  const currentBranch = await $`git branch --show-current`.text();
  if (currentBranch.trim() !== STAGING_BRANCH) {
    console.log(`⚠️  Warning: Not on ${STAGING_BRANCH} branch (currently on ${currentBranch.trim()})`);
  }

  // Check for uncommitted changes
  const status = await $`git status --porcelain`.text();
  if (status.trim()) {
    console.error("❌ Error: Uncommitted changes detected. Please commit or stash first.");
    process.exit(1);
  }

  console.log("📋 Running pre-deployment checks...\n");

  // Run linting
  console.log("1️⃣  Running lint...");
  await $`bun run lint`;

  // Run type checking
  console.log("2️⃣  Running type check...");
  await $`bun run type-check`;

  // Run tests
  console.log("3️⃣  Running tests...");
  await $`bun run test:unit`;

  // Build all packages
  console.log("4️⃣  Building packages...");
  await $`bun run build`;

  console.log("\n✅ Pre-deployment checks passed!\n");

  // Deploy to Vercel (staging/preview)
  console.log("5️⃣  Deploying web app to Vercel (preview)...");
  try {
    await $`cd app/packages/web-app && vercel --yes`;
    console.log("   Web app deployed to preview URL");
  } catch (error) {
    console.log("   ⚠️  Vercel CLI not configured. Run: vercel link");
  }

  // Deploy to Railway (staging)
  console.log("6️⃣  Deploying API to Railway...");
  try {
    await $`railway up --detach`;
    console.log("   API deployed to Railway");
  } catch (error) {
    console.log("   ⚠️  Railway CLI not configured. Run: railway login && railway link");
  }

  console.log("\n🎉 Staging deployment complete!");
  console.log("\nNext steps:");
  console.log("  - Check Vercel preview URL for web app");
  console.log("  - Check Railway dashboard for API status");
  console.log("  - Run smoke tests against staging environment");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
});
