# CI/CD Pipeline Setup Guide

This guide covers setting up the complete CI/CD pipeline for Distill using GitHub Actions, Vercel, and Railway.

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  GitHub Push    │──────│  GitHub Actions  │──────│   Deployment    │
│  (main branch)  │      │  CI Pipeline     │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │                         │
                                ▼                         ▼
                    ┌───────────────────────────────────────────────┐
                    │              Parallel Deployment              │
                    ├───────────────────┬───────────────────────────┤
                    │   Vercel (Web)    │     Railway (API)         │
                    │   - Next.js App   │     - tRPC Server         │
                    │   - Static + SSR  │     - Prisma + PostgreSQL │
                    └───────────────────┴───────────────────────────┘
```

## Required GitHub Secrets

Configure these in: **Settings → Secrets and variables → Actions**

### 1. Vercel Secrets (Web App Deployment)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | API token for deployments | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel organization/user ID | See instructions below |
| `VERCEL_PROJECT_ID` | Project ID for distill-web | See instructions below |

**Getting Vercel IDs:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
cd app/packages/web-app
vercel link

# This creates .vercel/project.json with orgId and projectId
cat .vercel/project.json
```

### 2. Railway Secrets (API Deployment)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `RAILWAY_TOKEN` | API token for Railway CLI | [Railway Dashboard](https://railway.app/account/tokens) |

**Setting up Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project (or link existing)
railway init

# Deploy (creates service)
railway up
```

### 3. Production URLs (for health checks)

| Secret | Description | Example |
|--------|-------------|---------|
| `API_URL` | Production API URL | `https://api.yourdomain.com` |
| `WEB_URL` | Production Web URL | `https://app.yourdomain.com` |

### 4. Environment Variables (for builds)

These should be set in Vercel/Railway, not as GitHub secrets:

**Vercel Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_URL=https://app.yourdomain.com
NEXTAUTH_SECRET=<generated-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

**Railway Environment Variables:**
```
DATABASE_URL=<railway-postgres-connection-string>
REDIS_URL=<railway-redis-connection-string>
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>
API_SECRET=<generated-secret>
NEXTAUTH_SECRET=<same-as-vercel>
```

---

## Step-by-Step Setup

### Step 1: Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `app/packages/web-app`
   - **Build Command**: `bun run build`
   - **Install Command**: `bun install`
4. Add environment variables (see list above)
5. Deploy (initial deployment)

### Step 2: Create Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Configure:
   - **Root Directory**: `app/packages/api`
   - **Start Command**: `bun run start`
5. Add PostgreSQL database:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-creates `DATABASE_URL`
6. Add Redis (optional):
   - Click "New" → "Database" → "Redis"
7. Add environment variables

### Step 3: Configure GitHub Secrets

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Add each secret:

```bash
# Use GitHub CLI (recommended)
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
gh secret set RAILWAY_TOKEN --body "your-railway-token"
gh secret set API_URL --body "https://api.yourdomain.com"
gh secret set WEB_URL --body "https://app.yourdomain.com"
```

### Step 4: Set Up Production Environment

1. Go to repo → **Settings** → **Environments**
2. Create "production" environment
3. Add protection rules (optional):
   - Required reviewers
   - Wait timer
   - Restrict to main branch

---

## Workflow Files

### Main CI Workflow (`.github/workflows/ci.yml`)
- Runs on: push to main/develop, PRs
- Jobs: quality, test, build, security

### Deploy Production (`.github/workflows/deploy-production.yml`)
- Runs on: push to main, manual trigger
- Jobs: ci → deploy-api + deploy-web → verify

---

## Testing the Pipeline

### 1. Manual Trigger
```bash
# Trigger deployment workflow manually
gh workflow run deploy-production.yml
```

### 2. Monitor Runs
```bash
# List recent workflow runs
gh run list

# Watch a specific run
gh run watch <run-id>
```

### 3. Check Deployment Status
```bash
# Check Vercel deployments
vercel ls

# Check Railway status
railway status
```

---

## Troubleshooting

### Common Issues

**1. "Vercel token is invalid"**
- Regenerate token at vercel.com/account/tokens
- Update GitHub secret

**2. "Railway deployment failed"**
- Check `railway logs` for errors
- Ensure DATABASE_URL is set
- Run migrations: `railway run bunx prisma migrate deploy`

**3. "Build failed - module not found"**
- Check `bun.lockb` is committed
- Ensure workspace dependencies are correct

**4. "Health check failed"**
- Verify API has `/health` endpoint
- Check API_URL secret is correct
- Allow time for services to start (increase sleep time)

### Debug Commands

```bash
# Check API health locally
curl http://localhost:3001/health

# Check Vercel build logs
vercel logs <deployment-url>

# Check Railway logs
railway logs

# Run migration manually on Railway
railway run bunx prisma migrate deploy
```

---

## Security Recommendations

1. **Rotate secrets regularly** - Set calendar reminders
2. **Use environment protection** - Require approval for production
3. **Limit token scopes** - Only grant necessary permissions
4. **Monitor deployments** - Set up Slack/Discord notifications
5. **Enable branch protection** - Require PR reviews for main

---

## Quick Reference

### Commands
```bash
# Deploy manually
bun run deploy:prod

# Check CI status
gh pr checks

# View workflow runs
gh run list --workflow=deploy-production.yml
```

### URLs
- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- GitHub Actions: https://github.com/<org>/<repo>/actions
