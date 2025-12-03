#!/usr/bin/env bun
/**
 * Setup GitHub Secrets for CI/CD
 *
 * Interactive script to configure GitHub secrets for deployment.
 * Requires GitHub CLI (gh) to be installed and authenticated.
 *
 * Usage: bun scripts/deployment/setup-secrets.ts
 */

import { $ } from 'bun';

interface Secret {
  name: string;
  description: string;
  required: boolean;
  howToGet: string;
}

const SECRETS: Secret[] = [
  {
    name: 'VERCEL_TOKEN',
    description: 'Vercel API token for deployments',
    required: true,
    howToGet: 'https://vercel.com/account/tokens → Create Token',
  },
  {
    name: 'VERCEL_ORG_ID',
    description: 'Vercel organization/user ID',
    required: true,
    howToGet: 'Run: cd app/packages/web-app && vercel link, then cat .vercel/project.json',
  },
  {
    name: 'VERCEL_PROJECT_ID',
    description: 'Vercel project ID',
    required: true,
    howToGet: 'Run: cd app/packages/web-app && vercel link, then cat .vercel/project.json',
  },
  {
    name: 'RAILWAY_TOKEN',
    description: 'Railway API token',
    required: true,
    howToGet: 'https://railway.app/account/tokens',
  },
  {
    name: 'API_URL',
    description: 'Production API URL (for health checks)',
    required: true,
    howToGet: 'Your Railway deployment URL, e.g., https://api.yourdomain.com',
  },
  {
    name: 'WEB_URL',
    description: 'Production Web URL (for health checks)',
    required: true,
    howToGet: 'Your Vercel deployment URL, e.g., https://app.yourdomain.com',
  },
];

async function checkGitHubCLI(): Promise<boolean> {
  try {
    await $`gh --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function checkGitHubAuth(): Promise<boolean> {
  try {
    await $`gh auth status`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function getExistingSecrets(): Promise<string[]> {
  try {
    const result = await $`gh secret list --json name`.json();
    return (result as Array<{ name: string }>).map((s) => s.name);
  } catch {
    return [];
  }
}

async function setSecret(name: string, value: string): Promise<boolean> {
  try {
    await $`gh secret set ${name} --body ${value}`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔐 GitHub Secrets Setup for CI/CD\n');
  console.log('━'.repeat(50));

  // Check GitHub CLI
  if (!(await checkGitHubCLI())) {
    console.error('❌ GitHub CLI (gh) not found.');
    console.log('   Install: https://cli.github.com/');
    process.exit(1);
  }

  // Check GitHub authentication
  if (!(await checkGitHubAuth())) {
    console.error('❌ Not authenticated with GitHub CLI.');
    console.log('   Run: gh auth login');
    process.exit(1);
  }

  console.log('✅ GitHub CLI authenticated\n');

  // Get existing secrets
  const existingSecrets = await getExistingSecrets();
  console.log(`📋 Found ${existingSecrets.length} existing secret(s)\n`);

  // Process each secret
  for (const secret of SECRETS) {
    const exists = existingSecrets.includes(secret.name);
    const status = exists ? '✅' : '❌';

    console.log(`${status} ${secret.name}`);
    console.log(`   ${secret.description}`);

    if (!exists) {
      console.log(`   📖 How to get: ${secret.howToGet}`);

      const value = prompt(`   Enter value (or press Enter to skip): `);
      if (value?.trim()) {
        const success = await setSecret(secret.name, value.trim());
        if (success) {
          console.log(`   ✅ Secret set successfully`);
        } else {
          console.log(`   ❌ Failed to set secret`);
        }
      } else {
        console.log(`   ⏭️  Skipped`);
      }
    }
    console.log('');
  }

  console.log('━'.repeat(50));
  console.log('\n📊 Summary:\n');

  // Final status check
  const finalSecrets = await getExistingSecrets();
  const missing = SECRETS.filter((s) => s.required && !finalSecrets.includes(s.name));

  if (missing.length === 0) {
    console.log('✅ All required secrets are configured!\n');
    console.log('You can now run deployments:');
    console.log('  - Push to main branch for automatic deployment');
    console.log('  - Run: gh workflow run deploy-production.yml');
  } else {
    console.log('⚠️  Missing required secrets:\n');
    for (const secret of missing) {
      console.log(`   - ${secret.name}`);
    }
    console.log('\nRun this script again to configure missing secrets.');
  }
}

main().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
