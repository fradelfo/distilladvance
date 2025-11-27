---
status: accepted
date: 2025-11-27
---

# Authentication Strategy: NextAuth.js with Google OAuth

## Context and problem statement

Distill needs user authentication to:
- Associate captured conversations and prompts with users
- Enable workspace/team features with role-based access
- Secure API endpoints
- Sync auth state between web app and browser extension

We need to choose an authentication approach that balances security, developer experience, and user friction for our MVP.

## Decision drivers

- **Low signup friction** - Target users (knowledge workers) expect fast onboarding
- **Security** - Must protect user data and prompt libraries
- **Extension compatibility** - Auth must work across web app and browser extension
- **Team/workspace support** - Need to support future multi-tenant workspaces
- **Development speed** - MVP timeline requires minimal custom auth code
- **Maintenance burden** - Small team, prefer managed solutions

## Options

### Option 1: NextAuth.js with Google OAuth (primary) + Email/Password (secondary)

Use NextAuth.js v5 (Auth.js) with Google as primary OAuth provider, email/password as fallback.

**Pros:**
- Google OAuth reduces signup friction (one-click for most users)
- NextAuth.js handles OAuth complexity, session management, CSRF protection
- Built-in Prisma adapter for our existing schema
- Supports multiple providers (can add GitHub, Microsoft later)
- Well-maintained, large community
- JWT sessions work well with API and extension

**Cons:**
- Google OAuth requires Google Cloud Console setup
- Some enterprise users may not have Google accounts
- Dependency on third-party library

### Option 2: Custom JWT Implementation

Build custom authentication with bcrypt password hashing and JWT tokens.

**Pros:**
- Full control over auth flow
- No external OAuth dependencies
- Simpler initial setup (no Google Cloud Console)

**Cons:**
- More code to write and maintain
- Security risks from custom implementation
- No OAuth option increases signup friction
- Must implement session management, CSRF, etc.

### Option 3: Auth0 / Clerk / Supabase Auth

Use a managed auth service.

**Pros:**
- Zero auth code to write
- Enterprise features built-in (SSO, MFA)
- Managed security updates

**Cons:**
- Additional cost (pricing per MAU)
- Vendor lock-in
- Less control over UX
- Another service to manage

## Decision

**Chosen:** Option 1 - NextAuth.js with Google OAuth

**Because:**
- Google OAuth is the fastest path to user signup (target users have Google accounts)
- NextAuth.js is battle-tested, reduces security risks vs custom implementation
- Prisma adapter integrates with our existing schema
- JWT sessions work seamlessly with API middleware and extension auth
- Can add email/password as secondary option for users without Google
- No additional cost (vs managed auth services)
- Aligns with design spec which shows Google OAuth button prominently

### Consequences

**Good:**
- Fast signup flow (< 30 seconds with Google)
- Reduced development time (days vs weeks for custom auth)
- Security handled by well-tested library
- Easy to add more providers later (GitHub, Microsoft for enterprise)
- Session management handled automatically

**Bad:**
- Requires Google Cloud Console project setup
- Users without Google accounts need email/password flow
- Dependency on NextAuth.js library updates
- Extension auth requires token passing (slightly more complex)

### Confirmation

We'll know this decision was right if:
- Signup completion rate > 80% (low abandonment)
- No auth-related security incidents
- Auth code remains < 200 lines (vs thousands for custom)
- Extension auth works reliably across browsers

## More information

- [NextAuth.js Documentation](https://authjs.dev/)
- [NextAuth.js Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- Related: Onboarding flow design spec (`docs/design/onboarding-flow-design-spec.md`)
- Future ADR needed: SSO/SAML for enterprise (post-MVP)
