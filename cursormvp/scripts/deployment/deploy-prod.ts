#!/usr/bin/env bun
/**
 * Deploy to Production Environment
 *
 * This script deploys the application to production.
 * Recommended: Use GitHub Actions instead for production deployments.
 * Usage: bun run deploy:prod
 */

import { $ } from 'bun';

const PRODUCTION_BRANCH = 'main';

async function confirmDeployment(): Promise<boolean> {
  console.log('\n⚠️  WARNING: You are about to deploy to PRODUCTION!\n');

  // Use readline for confirmation
  const response = prompt("Type 'yes' to confirm production deployment: ");
  return response?.toLowerCase() === 'yes';
}

async function main() {
  console.log('🚀 Starting PRODUCTION deployment...\n');

  // Check current branch
  const currentBranch = await $`git branch --show-current`.text();
  if (currentBranch.trim() !== PRODUCTION_BRANCH) {
    console.error(`❌ Error: Must be on ${PRODUCTION_BRANCH} branch for production deployment.`);
    console.log(`   Current branch: ${currentBranch.trim()}`);
    console.log(`   Run: git checkout ${PRODUCTION_BRANCH}`);
    process.exit(1);
  }

  // Check for uncommitted changes
  const status = await $`git status --porcelain`.text();
  if (status.trim()) {
    console.error('❌ Error: Uncommitted changes detected. Please commit or stash first.');
    process.exit(1);
  }

  // Check if up to date with remote
  await $`git fetch origin ${PRODUCTION_BRANCH}`.quiet();
  const behind = await $`git rev-list HEAD..origin/${PRODUCTION_BRANCH} --count`.text();
  if (Number.parseInt(behind.trim()) > 0) {
    console.error('❌ Error: Local branch is behind remote. Please pull first.');
    console.log(`   Run: git pull origin ${PRODUCTION_BRANCH}`);
    process.exit(1);
  }

  // Confirm deployment
  if (!(await confirmDeployment())) {
    console.log('❌ Deployment cancelled.');
    process.exit(0);
  }

  console.log('\n📋 Running pre-deployment checks...\n');

  // Run linting
  console.log('1️⃣  Running lint...');
  await $`bun run lint`;

  // Run type checking
  console.log('2️⃣  Running type check...');
  await $`bun run type-check`;

  // Run all tests
  console.log('3️⃣  Running tests...');
  await $`bun run test:unit`;

  // Build all packages
  console.log('4️⃣  Building packages...');
  await $`bun run build`;

  console.log('\n✅ Pre-deployment checks passed!\n');

  // Deploy API to Railway
  console.log('5️⃣  Deploying API to Railway...');
  try {
    await $`railway up --service api --detach`;
    console.log('   ✅ API deployed to Railway');
  } catch (error) {
    console.error('   ❌ Railway API deployment failed. Check railway CLI config.');
    process.exit(1);
  }

  // Deploy web-app to Railway
  console.log('6️⃣  Deploying web app to Railway...');
  try {
    await $`railway up --service web-app --detach`;
    console.log('   ✅ Web app deployed to Railway');
  } catch (error) {
    console.error('   ❌ Railway web-app deployment failed. Check railway CLI config.');
    process.exit(1);
  }

  // Run database migrations
  console.log('7️⃣  Running database migrations...');
  try {
    await $`railway run --service api bunx prisma migrate deploy`;
    console.log('   ✅ Migrations applied');
  } catch (error) {
    console.log('   ⚠️  Migration warning - check Railway logs');
  }

  console.log('\n🎉 Production deployment complete!');
  console.log('\n📊 Post-deployment checklist:');
  console.log('  [ ] Verify web app at Railway production URL');
  console.log('  [ ] Verify API health endpoint (/health)');
  console.log('  [ ] Check error monitoring (Sentry)');
  console.log('  [ ] Monitor application logs in Railway');
  console.log('  [ ] Run smoke tests');
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
});
