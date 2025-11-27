# Onboarding Flow Design Spec

**Status:** Draft
**PRD:** `docs/requirements/mvp-prd.md` (FR-WEB-01, FR-WEB-02, Flow 1, Section 5.2)
**Updated:** 2025-11-26

---

## Overview

The Onboarding Flow guides first-time users from signup to their first captured prompt. This is the critical path to activation (3+ prompts in 7 days) and must be optimized for speed and clarity.

**Key User Stories:**
- **US-01:** As a knowledge worker, I want to capture my current AI chat with one click
- **US-03:** As an AI champion, I want to invite my team to the workspace

**Activation Target:** 40% of users reach 3+ prompts within 7 days (beta goal)

---

## Critical Path & Time Targets

| Step | Target Time | Success Criteria |
|------|-------------|------------------|
| Sign up | <2 min | Account created, email verified |
| Create workspace | <1 min | Workspace exists with name + privacy default |
| Install extension | <2 min | Extension installed and active |
| First capture | <1 min | First prompt saved to library |
| **Total to first value** | **<6 min** | User has captured their first prompt |

---

## User Flow

### Happy Path: AI Champion (Primary Persona)

1. **Landing Page**
   - User clicks "Get Started" or "Start Free"

2. **Sign Up Form**
   - User enters email + password
   - Clicks "Create Account"

3. **Email Verification**
   - User receives verification email (<30 seconds)
   - Clicks link to verify

4. **Welcome & Workspace Creation**
   - "Welcome to Distill!"
   - User enters workspace name
   - User selects default privacy mode
   - Clicks "Create Workspace"

5. **Extension Installation**
   - "Install the Distill extension"
   - User clicks "Add to Chrome"
   - Redirected to Chrome Web Store
   - User installs extension
   - Returns to app (auto-detected or manual confirm)

6. **First Capture Guide**
   - "Capture your first prompt"
   - Interactive guide or video showing how
   - "Open ChatGPT/Claude" CTA

7. **Success & Library**
   - After first capture: celebration moment
   - Redirected to Library with new prompt highlighted
   - Prompt to invite team (optional, non-blocking)

### Alternative Paths

**Sign Up with Google OAuth:**
1. User clicks "Continue with Google"
2. Google OAuth flow
3. Account created + verified in one step
4. Skip to Workspace Creation

**Team Member Joining (Invited):**
1. User clicks invite link in email
2. Sign up form (email pre-filled)
3. Creates account
4. Automatically joins workspace
5. Sees team's existing prompts
6. Skip workspace creation step

**Returning User (Extension Not Installed):**
1. User logs in
2. System detects no extension activity
3. Shows extension install prompt
4. Continues to Library after install

**Mobile User:**
1. User signs up on mobile
2. Workspace creation works normally
3. Extension step shows "Continue on desktop"
4. Email sent with desktop link

### Error Paths

**Invalid Email:**
- Inline validation: "Please enter a valid email address"
- Form doesn't submit

**Email Already Exists:**
- "An account with this email already exists"
- Link to login page

**Weak Password:**
- "Password must be at least 8 characters"
- Show password strength indicator

**Verification Email Not Received:**
- "Didn't receive it?" link
- Resend verification (max 3 times)
- Check spam folder hint

**Extension Installation Failed:**
- "Having trouble? Try these steps:"
- Manual installation instructions
- "Skip for now" option (can install later)

**Network Error During Signup:**
- "Connection error. Please try again."
- Retry button
- Preserve form data

---

## Screen Inventory

| Screen | Purpose | Entry | Exit |
|--------|---------|-------|------|
| Landing Page | Marketing, CTAs | Direct URL, referral | Sign Up |
| Sign Up | Account creation | Landing CTA | Email Verification |
| Email Verification | Confirm email | Email link | Workspace Setup |
| Workspace Setup | Create workspace | Verification | Extension Install |
| Extension Install | Guide installation | Workspace Setup | First Capture |
| First Capture Guide | Teach capture flow | Extension Install | Library (success) |
| Invite Team | Optional team invite | Library or guide | Library |

---

## Components

### 1. Sign Up Form

**Purpose:** Create new user account

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         🔮 Distill                             │
│                                                                │
│              Turn AI chats into team playbooks                 │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Continue with Google                                [G] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│                        ─── or ───                              │
│                                                                │
│  Email                                                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ jane@company.com                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Password                                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••                                     [👁]    │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ░░░░░░░░░░ Strong                                            │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Create Account                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Already have an account? Log in                               │
│                                                                │
│  By signing up, you agree to our Terms and Privacy Policy      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Empty form
- Validating: Field-level validation on blur
- Submitting: Button shows spinner
- Error: Field errors shown inline
- Success: Redirect to verification

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSubmit | function | - | Form submission handler |
| onGoogleAuth | function | - | Google OAuth handler |
| inviteCode | string \| null | null | Pre-filled from invite |
| inviteEmail | string \| null | null | Pre-filled email |

**Validation Rules:**
- Email: Valid format, not already registered
- Password: Min 8 chars, strength indicator

**Accessibility:**
- Keyboard: Tab through fields, Enter to submit
- Screen reader: "Sign up form, 2 fields required"
- ARIA: `aria-invalid` on error, `aria-describedby` for hints

---

### 2. Email Verification Screen

**Purpose:** Confirm user owns email address

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         ✉️                                     │
│                                                                │
│                   Check your email                             │
│                                                                │
│     We sent a verification link to                             │
│     jane@company.com                                           │
│                                                                │
│     Click the link in your email to continue.                  │
│                                                                │
│     ┌────────────────────────────────────────────┐            │
│     │        Open Gmail  →                        │            │
│     └────────────────────────────────────────────┘            │
│                                                                │
│     Didn't receive it? Resend email                            │
│                                                                │
│     Check your spam folder if you don't see it.                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Waiting for verification
- Resending: "Sending..." text
- Resent: "Email sent!" confirmation
- Rate limited: "Try again in X seconds"
- Verified: Auto-redirect to workspace setup

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| email | string | required | User's email address |
| onResend | function | - | Resend email handler |
| resendCooldown | number | 60 | Seconds between resends |
| emailProvider | string \| null | null | Detected provider for quick link |

**Accessibility:**
- Keyboard: Tab to resend link
- Screen reader: "Verification email sent to [email]"
- ARIA: `aria-live="polite"` for status updates

---

### 3. Workspace Setup

**Purpose:** Create user's first workspace

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Step 1 of 3                    ━━━━━━━━━━░░░░░░░░░░░░░░░░░░   │
│                                                                │
│                   Set up your workspace                        │
│                                                                │
│  Your workspace is where your team's prompts live.             │
│                                                                │
│  Workspace Name *                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Acme Marketing Team                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│  This is usually your team or company name                     │
│                                                                │
│  Default Privacy Mode *                                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ○ Prompt-only (recommended)                             │ │
│  │    Only the distilled template is stored.                │ │
│  │    Raw conversations are deleted after processing.       │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ○ Full conversation                                     │ │
│  │    Raw chat is saved alongside the prompt.               │ │
│  │    Useful for reference and context.                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Learn more about privacy modes]                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Create Workspace  →                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Form ready
- Validating: Name required check
- Submitting: Button loading
- Error: Inline error messages
- Success: Proceed to extension install

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSubmit | function | - | Create workspace handler |
| suggestedName | string \| null | null | From email domain |
| defaultPrivacyMode | 'prompt-only' \| 'full' | 'prompt-only' | Default selection |

**Accessibility:**
- Keyboard: Tab through options, Space to select radio
- Screen reader: "Workspace setup, step 1 of 3"
- ARIA: `role="radiogroup"` for privacy options

---

### 4. Extension Install Guide

**Purpose:** Guide user to install browser extension

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Step 2 of 3                    ━━━━━━━━━━━━━━━━━━░░░░░░░░░░   │
│                                                                │
│                   Install the extension                        │
│                                                                │
│  The Distill extension captures conversations from             │
│  ChatGPT, Claude, Gemini, and Copilot.                        │
│                                                                │
│                    ┌─────────────────────┐                     │
│                    │                     │                     │
│                    │   [Extension Icon]  │                     │
│                    │                     │                     │
│                    │   Distill           │                     │
│                    │   ★★★★★ (4.8)       │                     │
│                    │                     │                     │
│                    └─────────────────────┘                     │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          Add to Chrome  →                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  After installing, click "I've installed it"                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          I've installed it                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Skip for now (you can install later)                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Waiting for install
- Checking: Verifying extension is installed
- Detected: "Extension detected!" + auto-proceed
- Manual confirm: User clicks "I've installed it"
- Skipped: Proceeds without extension

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| chromeStoreUrl | string | required | Extension store URL |
| onInstallClick | function | - | Opens Chrome Web Store |
| onConfirm | function | - | Manual confirmation |
| onSkip | function | - | Skip installation |
| isExtensionDetected | boolean | false | Auto-detection result |

**Browser Detection:**
- Chrome: Show Chrome Web Store link
- Firefox: Show Firefox Add-ons link (post-MVP)
- Other: Show "Use Chrome for best experience"

**Accessibility:**
- Keyboard: Tab to buttons, Enter to activate
- Screen reader: "Extension installation, step 2 of 3"
- ARIA: Links open in new tab with `aria-label`

---

### 5. First Capture Guide

**Purpose:** Teach user how to capture their first prompt

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Step 3 of 3                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│                 Capture your first prompt                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │                                                    │ │ │
│  │  │        [Animated Demo / Video]                     │ │ │
│  │  │                                                    │ │ │
│  │  │   1. Go to ChatGPT or Claude                       │ │ │
│  │  │   2. Have a conversation                           │ │ │
│  │  │   3. Click the Distill icon                        │ │ │
│  │  │   4. Save your prompt!                             │ │ │
│  │  │                                                    │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Try it now:                                                   │
│                                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  ChatGPT    │ │  Claude     │ │  Gemini     │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                │
│  Or skip for now and explore the library →                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Guide visible
- Video playing: Video expanded
- Waiting: User opened AI chat
- First capture detected: Celebration!
- Skipped: Goes to library

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| demoVideoUrl | string | - | Demo video source |
| onPlatformClick | function | - | Opens AI chat |
| onSkip | function | - | Skip to library |
| hasFirstCapture | boolean | false | First prompt detected |

**Accessibility:**
- Keyboard: Tab through platform buttons
- Screen reader: "Getting started guide, step 3 of 3"
- ARIA: Video has captions/transcript

---

### 6. Success Celebration

**Purpose:** Celebrate first capture, guide to next steps

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                         🎉                                     │
│                                                                │
│              Your first prompt is saved!                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  "Customer Onboarding Email"                             │ │
│  │  3 variables detected                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           View in Library  →                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  What's next?                                                  │
│                                                                │
│  ○ Capture more prompts to build your library                  │
│  ○ Invite your team to share prompts                          │
│  ○ Edit and refine your prompt                                │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │        Invite Team Members                             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Celebration animation
- Transitioning: Fade to library

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| promptTitle | string | required | Created prompt title |
| variableCount | number | 0 | Variables detected |
| onViewLibrary | function | - | Go to library |
| onInviteTeam | function | - | Open invite flow |

**Accessibility:**
- Screen reader: "Congratulations! Your first prompt [title] is saved."
- Animation: Respects reduced motion preference

---

### 7. Invite Team Modal

**Purpose:** Invite colleagues to workspace

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│                      Invite your team                     [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Workspace: Acme Marketing Team                                │
│                                                                │
│  Enter email addresses (one per line):                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ sarah@acme.com                                           │ │
│  │ mike@acme.com                                            │ │
│  │ lisa@acme.com                                            │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Up to 10 invites at a time                                    │
│                                                                │
│  Or share invite link:                                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ https://distill.app/join/abc123...            [Copy]     │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Link expires in 7 days                                        │
│                                                                │
│  [Cancel]                                [Send Invites →]      │
└────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Empty form
- Validating: Email format check
- Sending: Button loading
- Success: "Invites sent!" + close
- Error: Invalid emails highlighted

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| workspaceName | string | required | Current workspace |
| inviteLink | string | required | Shareable link |
| onSend | function | - | Send invites handler |
| onClose | function | - | Close modal |
| maxInvites | number | 10 | Max emails per batch |

**Accessibility:**
- Keyboard: Tab through fields, Escape to close
- Screen reader: "Invite team dialog"
- ARIA: `role="dialog"`, focus trap

---

### 8. Progress Indicator

**Purpose:** Show onboarding progress

**Layout:**
```
Step 1 of 3    ━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░
               Create workspace   Install extension   First capture
```

**States:**
- Current step highlighted
- Completed steps show checkmark
- Future steps dimmed

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentStep | number | 1 | Active step (1-3) |
| steps | Step[] | required | Step definitions |
| onStepClick | function \| null | null | Navigate to step (if allowed) |

**Accessibility:**
- Screen reader: "Step [n] of [total]: [step name]"
- ARIA: `aria-current="step"` on active

---

## Edge Cases

| Scenario | Behaviour | Message |
|----------|-----------|---------|
| User closes before verification | Email saved, can resume | "Verify email to continue" on return |
| Verification link expired | Resend option | "Link expired. Request a new one." |
| User already in a workspace (invited) | Skip workspace creation | Goes to extension install |
| Extension already installed | Detect and skip | "Extension detected!" |
| User on mobile | Limit onboarding | "Continue on desktop to install extension" |
| User on Firefox/Edge | Different store link | Platform-specific CTA |
| Workspace name taken | Add suffix | "Acme Marketing Team 2" suggested |
| User refreshes mid-onboarding | Resume from last step | State persisted |
| Network error during workspace creation | Retry with preserved input | "Couldn't create workspace. Try again." |
| Invite to non-existent workspace | Error on link click | "This invite is no longer valid" |

---

## Responsive Behaviour

| Breakpoint | Changes |
|------------|---------|
| Mobile (<640px) | Single column, stacked forms, full-width buttons, video placeholder on first capture |
| Tablet (640-1024px) | Centered card layout, comfortable spacing |
| Desktop (>1024px) | Split layout option (form + illustration), max-width container |

### Mobile Specifics
- Extension step shows "Continue on desktop" with email link
- Forms stack vertically
- Progress bar simplified to dots

### Desktop Specifics
- Can show split layout with illustration
- Progress bar with step labels
- Keyboard shortcuts visible

---

## Accessibility Checklist

- [x] Contrast >= 4.5:1 for all text
- [x] Focus states visible on all interactive elements
- [x] Full keyboard navigation
- [x] Form labels associated with inputs
- [x] Error messages linked to fields with `aria-describedby`
- [x] `prefers-reduced-motion` respected (celebration animation)
- [x] Touch targets >= 44px on mobile
- [x] Progress communicated to screen readers
- [x] External links indicate they open in new tab
- [x] Video has captions
- [x] Password visibility toggle accessible

---

## Design Tokens

(Shared with Web App Library - see that spec for full token list)

### Onboarding-Specific

```css
/* Progress indicator */
--progress-bg: var(--color-neutral-200);
--progress-fill: var(--color-primary-500);
--progress-height: 4px;

/* Step indicators */
--step-complete: var(--color-success-500);
--step-current: var(--color-primary-500);
--step-upcoming: var(--color-neutral-300);

/* Card (centered forms) */
--card-max-width: 480px;
--card-padding: var(--space-8);
--card-shadow: var(--shadow-lg);

/* Celebration */
--celebration-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## Analytics Events

| Event | Properties | Purpose |
|-------|------------|---------|
| `onboarding_started` | source, referrer | Funnel entry |
| `signup_method` | method (email/google) | Auth preference |
| `email_verified` | time_to_verify | Verification friction |
| `workspace_created` | privacy_mode, name_length | Setup choices |
| `extension_install_clicked` | - | Funnel progress |
| `extension_detected` | auto/manual | Detection method |
| `extension_skipped` | - | Drop-off point |
| `first_capture_guide_viewed` | - | Engagement |
| `first_capture_completed` | time_from_start, platform | Activation |
| `onboarding_completed` | total_time, steps_completed | Full funnel |
| `invite_sent` | count | Team growth |

---

## Technical Constraints

### Session Management
- Onboarding state persisted in localStorage + server
- Can resume from any step
- State cleared after completion

### Email Verification
- JWT token in verification link
- 24-hour expiry
- Rate limit: 3 resends per hour

### Extension Detection
- Content script pings extension
- Fallback: manual confirmation button
- Polling interval: 2 seconds

### Performance
- Each step loads in <1s
- Minimal JavaScript for initial paint
- Optimistic UI where possible

---

## Open Questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Google OAuth in MVP? | A) Email only, B) Add Google | B) Add Google - reduces friction |
| 2 | Skip extension install? | A) Required, B) Allow skip | B) Allow skip - can prompt later |
| 3 | Video vs animation for guide? | A) Video, B) Animated demo, C) Static images | B) Animated demo - lighter |
| 4 | Invite prompt timing? | A) After first capture, B) After 3rd, C) Both | A) After first - strike while hot |
| 5 | Mobile experience? | A) Block, B) Limited (no extension), C) Full with desktop prompt | C) Full with desktop prompt |

---

## Related Documents

- [Capture Flow Design Spec](./capture-flow-design-spec.md)
- [Web App Library Design Spec](./web-app-library-design-spec.md)
- [PRD v0.2](../requirements/mvp-prd.md)
