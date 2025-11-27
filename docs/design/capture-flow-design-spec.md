# Capture Flow Design Spec

**Status:** Draft
**PRD:** `docs/requirements/mvp-prd.md` (FR-EXT-01, FR-EXT-02, FR-EXT-03, FR-DIST-01, FR-DIST-02)
**Updated:** 2025-11-26
**Priority:** P0 (Critical Path)

---

## Overview

The capture flow is Distill's core differentiator—enabling users to capture AI conversations with one click and auto-distill them into reusable prompt templates. This flow spans the browser extension (content script, popup, background service worker) and backend distillation service.

### User Story

**US-01:** As a knowledge worker, I want to capture my current AI chat with one click, so that I don't lose a good prompt workflow.

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Extension icon activation | Prompt editing after capture |
| Capture modal UI | Library browsing |
| Privacy mode selection | Team sharing features |
| Conversation extraction | Coach suggestions |
| Distillation request/response | Manual prompt creation |
| Success/error states | Batch capture |

---

## User Flow

### Happy Path

```
1. User is on supported AI chat site (ChatGPT, Claude, Gemini, Copilot)
   └── Extension icon is active (coloured)

2. User clicks extension icon OR presses Ctrl/Cmd+Shift+D
   └── Capture modal opens in <1 second

3. User sees conversation preview (first 3 messages + count)
   └── Privacy mode pre-selected based on workspace default

4. User confirms privacy mode selection
   └── Toggle between "Prompt only" and "Full conversation"

5. User clicks "Distill" button
   └── Modal shows processing state with progress

6. Backend processes conversation (<10 seconds)
   └── Extracts prompt, generates title, detects variables, suggests tags

7. Success state displays
   └── Shows: title, variable count, "View & Edit" and "Capture Another" actions

8. User clicks "View & Edit"
   └── Opens web app prompt detail (new tab) OR "Capture Another" to reset modal
```

### Alternative Paths

| Scenario | Behaviour |
|----------|-----------|
| **User not logged in** | Show "Log in to capture" with login button; opens web app auth |
| **No workspace selected** | Show workspace picker if user has multiple; auto-select if single |
| **Floating button click** | Same as extension icon; injected FAB on supported sites |
| **Keyboard shortcut** | Ctrl/Cmd+Shift+D opens modal directly |
| **Context menu** | Right-click → "Distill this conversation" (future enhancement) |

### Error Paths

| Error | Trigger | Message | Action |
|-------|---------|---------|--------|
| **Unsupported site** | User on non-AI chat site | "Not a supported AI chat page" | Icon greyed, tooltip shown |
| **No conversation** | Chat page with no messages | "No conversation detected. Start chatting first." | Dismiss button |
| **Extraction failed** | DOM parsing error | "Couldn't read this conversation. Try refreshing the page." | Retry button |
| **Network error** | API unreachable | "Couldn't connect. Check your internet and try again." | Retry button |
| **Auth expired** | JWT expired | "Session expired. Please log in again." | Login button |
| **Distillation failed** | LLM error or timeout | "Couldn't distill this conversation. Try again." | Retry button |
| **Rate limited** | Too many requests | "Too many requests. Please wait [X] seconds." | Auto-countdown + retry |
| **Conversation too long** | >5000 tokens | "Conversation is very long. We'll capture the most recent messages." | Continue with truncation |

---

## Screen Inventory

| Screen | Purpose | Entry | Exit |
|--------|---------|-------|------|
| **Extension Icon** | Entry point, status indicator | Browser toolbar | Click → Modal |
| **Capture Modal** | Configure and initiate capture | Icon click, keyboard shortcut, FAB | Distill → Processing, Cancel → Close |
| **Processing State** | Show capture in progress | Distill button | Success → Success, Error → Error |
| **Success State** | Confirm capture, next actions | Processing complete | View & Edit → Web app, Capture Another → Reset |
| **Error State** | Show error, recovery options | Processing failed | Retry → Processing, Dismiss → Close |
| **Login Prompt** | Auth required state | Modal when logged out | Login → Auth flow, Cancel → Close |

---

## Components

### 1. Extension Icon

**Purpose:** Visual indicator of extension status and entry point for capture.

**States:**
| State | Visual | Tooltip |
|-------|--------|---------|
| **Active** | Full colour icon (indigo-500) | "Capture this conversation" |
| **Inactive** | Greyed/muted icon | "Not a supported AI chat page" |
| **Processing** | Animated spinner overlay | "Distilling..." |
| **Success** | Checkmark badge (2s) | "Prompt saved!" |
| **Error** | Red dot badge | "Something went wrong" |
| **Logged out** | Icon with lock badge | "Log in to Distill" |

**Technical:**
- Uses `chrome.action.setIcon()` for state changes
- Badge text via `chrome.action.setBadgeText()`
- Badge colour via `chrome.action.setBadgeBackgroundColor()`

**Accessibility:**
- Keyboard: Focusable in browser toolbar
- Screen reader: Dynamic aria-label based on state
- ARIA: `role="button"`, `aria-pressed` for toggle states

---

### 2. Capture Modal

**Purpose:** Main interface for configuring and initiating capture.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────┐  Distill this conversation              [×]       │
│  │ 🔮  │                                                    │
│  └─────┘                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Preview                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 You: Can you help me write a customer...        │   │
│  │ 🤖 AI: I'd be happy to help! Here's a...           │   │
│  │ 👤 You: Can you make it more professional?         │   │
│  │ ┄┄┄ + 8 more messages ┄┄┄                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Privacy Mode                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ Prompt only (recommended)                         │   │
│  │   Only the distilled template is saved              │   │
│  │                                                      │   │
│  │ ○ Full conversation                                  │   │
│  │   Raw chat saved for reference                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Learn more about privacy]                                 │
│                                                             │
│  Workspace: [My Team ▼]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cancel]                                    [Distill →]   │
└─────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Width: 400px (fixed)
- Max height: 600px
- Padding: 24px

**States:**

| State | Description | UI Changes |
|-------|-------------|------------|
| **Default** | Ready for capture | All controls enabled |
| **Loading preview** | Extracting conversation | Skeleton in preview area |
| **Ready** | Conversation loaded | Preview populated, controls enabled |
| **Processing** | Distillation in progress | Spinner, disabled controls, progress text |
| **Success** | Capture complete | Success message, new actions |
| **Error** | Capture failed | Error message, retry button |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Modal visibility |
| `conversation` | `CapturedConversation | null` | `null` | Extracted conversation data |
| `defaultPrivacyMode` | `'prompt-only' | 'full'` | `'prompt-only'` | Workspace default |
| `canOverridePrivacy` | `boolean` | `true` | Admin setting |
| `workspaces` | `Workspace[]` | `[]` | User's workspaces |
| `selectedWorkspace` | `string` | - | Currently selected workspace ID |
| `onDistill` | `(options: CaptureOptions) => void` | - | Callback when Distill clicked |
| `onCancel` | `() => void` | - | Callback when Cancel clicked |

**Accessibility:**
- Keyboard: Focus trap within modal, Escape to close, Tab through controls
- Screen reader: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for title
- ARIA: Live regions for state changes, `aria-describedby` for privacy explanations

---

### 3. Conversation Preview

**Purpose:** Show user what will be captured, build confidence.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 👤 You                                                       │
│ Can you help me write a customer onboarding email for a...  │
├─────────────────────────────────────────────────────────────┤
│ 🤖 Assistant                                                 │
│ I'd be happy to help! Here's a professional onboarding...   │
├─────────────────────────────────────────────────────────────┤
│ 👤 You                                                       │
│ Can you make it more professional and add a signature?      │
├─────────────────────────────────────────────────────────────┤
│           ┄┄┄┄┄ + 8 more messages ┄┄┄┄┄                     │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Show first 3 messages (alternating user/assistant)
- Truncate message content at 100 characters with ellipsis
- Show "+ N more messages" if conversation is longer
- Max height: 200px with scroll if needed

**States:**
| State | Description | Visual |
|-------|-------------|--------|
| **Loading** | Extracting from page | Skeleton pulse animation |
| **Loaded** | Conversation available | Message cards |
| **Empty** | No messages found | Empty state message |
| **Error** | Extraction failed | Error message |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `messages` | `ConversationMessage[]` | `[]` | Conversation messages |
| `isLoading` | `boolean` | `false` | Loading state |
| `error` | `string | null` | `null` | Error message |
| `maxMessages` | `number` | `3` | Messages to show before truncation |
| `maxContentLength` | `number` | `100` | Characters before truncation |

**Accessibility:**
- Screen reader: `role="list"` for messages, `role="listitem"` for each
- Announces message count: "Preview of 11 messages, showing first 3"

---

### 4. Privacy Mode Selector

**Purpose:** Let user choose data retention level.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Privacy Mode                                                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ● Prompt only (recommended)                    ✓ Default│ │
│ │   Only the distilled template is saved                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ Full conversation                                     │ │
│ │   Raw chat saved for reference                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Learn more about privacy →]                                │
└─────────────────────────────────────────────────────────────┘
```

**States:**
| State | Description | Visual |
|-------|-------------|--------|
| **Prompt only** | Selected, recommended | Radio filled, highlight border |
| **Full conversation** | Selected | Radio filled |
| **Disabled** | Admin disallows override | Greyed, tooltip explanation |
| **Locked** | Only one option available | Single option, no toggle |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `'prompt-only' | 'full'` | `'prompt-only'` | Current selection |
| `defaultValue` | `'prompt-only' | 'full'` | `'prompt-only'` | Workspace default |
| `canOverride` | `boolean` | `true` | Whether user can change |
| `onChange` | `(value) => void` | - | Selection change handler |

**Accessibility:**
- Keyboard: Arrow keys to navigate, Space/Enter to select
- Screen reader: `role="radiogroup"`, `aria-labelledby` for group label
- ARIA: `aria-describedby` linking to explanation text

---

### 5. Processing State

**Purpose:** Show capture progress, maintain user confidence.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    ┌───────────────┐                        │
│                    │   ◐ ◓ ◑ ◒    │                        │
│                    └───────────────┘                        │
│                                                              │
│                  Distilling your conversation...            │
│                                                              │
│     ┌─────────────────────────────────────────────────┐     │
│     │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     │
│     └─────────────────────────────────────────────────┘     │
│                        40% complete                          │
│                                                              │
│                  Extracting key prompts...                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Progress Steps:**
1. "Sending conversation..." (0-20%)
2. "Analyzing conversation..." (20-40%)
3. "Extracting key prompts..." (40-70%)
4. "Generating template..." (70-90%)
5. "Finalizing..." (90-100%)

**States:**
| State | Description | Visual |
|-------|-------------|--------|
| **Indeterminate** | Unknown progress | Spinner only |
| **Determinate** | Known progress | Progress bar + percentage |
| **Stalled** | No progress >5s | "Taking longer than expected..." |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number | null` | `null` | 0-100 or null for indeterminate |
| `step` | `string` | `''` | Current step description |
| `isStalled` | `boolean` | `false` | Progress stalled indicator |

**Accessibility:**
- Screen reader: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Live region: Announces step changes
- Reduced motion: Static progress bar, no spinner animation

---

### 6. Success State

**Purpose:** Confirm capture succeeded, guide to next action.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         ✓                                   │
│                   Prompt created!                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "Customer Onboarding Email Template"                │   │
│  │                                                       │   │
│  │  Variables detected: 3                               │   │
│  │  • {{customer_name}}                                 │   │
│  │  • {{product_tier}}                                  │   │
│  │  • {{onboarding_date}}                               │   │
│  │                                                       │   │
│  │  Tags: #email  #onboarding  #customer-success        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [View & Edit]                       [Capture Another]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `result` | `DistillResult` | - | Distillation result data |
| `onViewEdit` | `() => void` | - | Navigate to prompt detail |
| `onCaptureAnother` | `() => void` | - | Reset for new capture |

**Accessibility:**
- Screen reader: Success announced via live region
- Focus: Moves to "View & Edit" button
- Keyboard: Tab between action buttons

---

### 7. Error State

**Purpose:** Explain what went wrong, offer recovery.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         ⚠️                                   │
│                   Something went wrong                       │
│                                                              │
│           Couldn't connect to Distill servers.              │
│           Check your internet and try again.                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Error code: NETWORK_ERROR                          │   │
│  │  [Copy error details]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Dismiss]                                    [Try Again]   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Error Types:**
| Code | Title | Message | Recovery |
|------|-------|---------|----------|
| `NETWORK_ERROR` | Connection failed | Couldn't connect. Check your internet. | Retry |
| `AUTH_EXPIRED` | Session expired | Please log in again. | Login button |
| `EXTRACTION_FAILED` | Couldn't read chat | Try refreshing the page. | Retry |
| `DISTILL_FAILED` | Distillation failed | Our AI couldn't process this. Try again. | Retry |
| `RATE_LIMITED` | Too many requests | Wait [X] seconds. | Auto-retry countdown |
| `CONVERSATION_TOO_SHORT` | Not enough content | Add more messages first. | Dismiss |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `ApiError` | - | Error object |
| `onRetry` | `() => void` | - | Retry handler |
| `onDismiss` | `() => void` | - | Dismiss handler |
| `retryCountdown` | `number | null` | `null` | Seconds until auto-retry |

**Accessibility:**
- Screen reader: Error announced via `role="alert"`
- Focus: Moves to primary recovery action
- Keyboard: Tab between Dismiss and Try Again

---

### 8. Floating Action Button (FAB)

**Purpose:** Quick capture access without opening popup.

**Layout:**
```
         ┌──────┐
         │  🔮  │
         └──────┘
            │
            ▼
      ┌──────────┐
      │ Distill  │   (tooltip on hover)
      └──────────┘
```

**Position:** Fixed, bottom-right, 20px from edges

**States:**
| State | Visual | Behaviour |
|-------|--------|-----------|
| **Default** | Indigo circle, icon | Hover: scale 1.1, shadow |
| **Hover** | Enlarged, tooltip | Show "Distill this conversation" |
| **Clicked** | Press animation | Opens capture modal |
| **Hidden** | Not visible | Unsupported site or user preference |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | `boolean` | `true` | Show/hide FAB |
| `onClick` | `() => void` | - | Click handler |

**Technical:**
- Injected via content script
- Shadow DOM for style isolation
- z-index: 999999 to stay above page content

**Accessibility:**
- Keyboard: Focusable, Enter/Space to activate
- Screen reader: `aria-label="Distill this conversation"`
- Reduced motion: No hover animation

---

## Edge Cases

| Scenario | Behaviour | Message |
|----------|-----------|---------|
| **Very long conversation (50+ messages)** | Capture with truncation to most recent | "Capturing the most recent 50 messages" |
| **Single message** | Create minimal template | (No special message, process normally) |
| **Empty conversation** | Block capture | "No conversation detected. Start chatting first." |
| **Non-English conversation** | Best-effort distillation | (No special message, tag with detected language) |
| **Code-heavy conversation** | Preserve code blocks | (No special message, code blocks in template) |
| **Images/files in chat** | Skip, note in metadata | "Note: Images and files were not captured" |
| **Conversation mid-generation** | Wait for completion | "Wait for the AI to finish responding" |
| **Multiple conversations on page** | Capture visible/active one | (Use active conversation detection) |
| **Page DOM changed** | Re-extract on capture | (Automatic, no user message) |
| **Extension update during capture** | Complete current capture | (Queue update until idle) |

---

## Responsive Behaviour

| Breakpoint | Changes |
|------------|---------|
| **Extension popup** | Fixed 400x600 max, scrollable content |
| **Narrow popup (<360px)** | Stack buttons vertically, reduce padding to 16px |
| **High DPI (2x+)** | Use @2x icons, sharp rendering |

Note: The capture modal is displayed within the extension popup, which has fixed dimensions controlled by the browser. The modal should be responsive within those constraints.

---

## Accessibility Checklist

- [x] Contrast ≥ 4.5:1 for all text
- [x] Focus states visible on all interactive elements
- [x] Keyboard accessible (Tab, Enter, Space, Escape, Arrow keys)
- [x] Labels visible for all form controls
- [x] Descriptive error messages with recovery guidance
- [x] `prefers-reduced-motion` support (disable animations)
- [x] Touch targets ≥ 44px for mobile/touch (FAB)
- [x] Screen reader announcements for state changes
- [x] Focus management on modal open/close
- [x] ARIA roles and properties correctly applied

---

## Design Tokens

### Colors

```css
/* Primary */
--color-primary-500: #6366f1;  /* Indigo - main brand */
--color-primary-600: #4f46e5;  /* Hover state */
--color-primary-700: #4338ca;  /* Active state */

/* Semantic */
--color-success-500: #22c55e;  /* Green - success */
--color-warning-500: #f59e0b;  /* Amber - warning */
--color-error-500: #ef4444;    /* Red - error */

/* Neutral */
--color-gray-50: #f9fafb;      /* Background */
--color-gray-100: #f3f4f6;     /* Card background */
--color-gray-200: #e5e7eb;     /* Border */
--color-gray-500: #6b7280;     /* Secondary text */
--color-gray-700: #374151;     /* Primary text */
--color-gray-900: #111827;     /* Heading text */
```

### Typography

```css
/* Font family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Border Radius

```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
--radius-xl: 0.75rem;  /* 12px */
--radius-full: 9999px; /* Circle */
```

### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

---

## Technical Constraints

### Extension Limitations

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Manifest V3 service worker | Background script can be terminated | Persist state to `chrome.storage.local` |
| Popup closes on blur | State lost on popup close | Save draft state, resume on reopen |
| Content script isolation | Can't share state with popup | Message passing via `chrome.runtime` |
| Host permissions required | User must grant access | Clear permission request UX |
| No cross-origin in content script | Can't call API directly | Route through background service worker |

### DOM Extraction Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Site DOM changes | Extraction breaks | Abstracted selectors, monitoring, quick patches |
| Dynamic content loading | Incomplete capture | Wait for content, mutation observers |
| Shadow DOM in chat sites | Can't access content | Use exposed APIs where available |
| CSP restrictions | Script injection blocked | Use content script messaging |

### Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Modal load time | <1 second | Time from click to render |
| Extraction time | <500ms | Time to parse conversation |
| Distillation time | <10 seconds | Time for API response |
| Memory usage | <50MB | Extension memory footprint |

---

## Open Questions

| Question | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| Auto-detect if conversation is "worth" capturing? | A) Always capture, B) Suggest if short, C) Block if too short | B) Show warning for <3 messages | Open |
| Partial conversation capture? | A) Always full, B) Allow selection, C) Time-based | A) Always full for MVP | Decided |
| Animation style for processing? | A) Spinner, B) Progress bar, C) Steps | C) Steps with progress bar | Open |
| FAB visibility preference? | A) Always show, B) User toggle, C) Smart hide | B) User toggle in settings | Decided |
| Keyboard shortcut customization? | A) Fixed shortcut, B) Customizable | A) Fixed for MVP | Decided |

---

## Implementation Notes

### Message Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Popup     │     │ Background  │     │  Content    │     │   API       │
│   (React)   │     │ (SW)        │     │  Script     │     │   Server    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ CAPTURE_REQUEST   │                   │                   │
       │──────────────────►│                   │                   │
       │                   │ EXTRACT_CONVO     │                   │
       │                   │──────────────────►│                   │
       │                   │                   │ Parse DOM         │
       │                   │◄──────────────────│                   │
       │                   │ CONVERSATION_DATA │                   │
       │                   │                   │                   │
       │                   │ POST /distill     │                   │
       │                   │──────────────────────────────────────►│
       │                   │                   │                   │ LLM
       │                   │◄──────────────────────────────────────│
       │                   │ DistillResult     │                   │
       │ CAPTURE_SUCCESS   │                   │                   │
       │◄──────────────────│                   │                   │
       │                   │                   │                   │
```

### State Management

```typescript
interface CaptureState {
  status: 'idle' | 'extracting' | 'distilling' | 'success' | 'error';
  conversation: CapturedConversation | null;
  result: DistillResult | null;
  error: ApiError | null;
  privacyMode: 'prompt-only' | 'full';
  selectedWorkspaceId: string;
  progress: number;
  progressStep: string;
}
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/distill` | POST | Submit conversation for distillation |
| `GET /api/workspaces` | GET | Get user's workspaces |
| `GET /api/settings` | GET | Get user settings including defaults |

---

## Related Documents

- PRD: `docs/requirements/mvp-prd.md`
- User Stories: Obsidian `Projects/Distill/User Stories.md`
- ADR-002: Privacy Modes
- Tech Stack: `cursormvp/CLAUDE.md`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-26 | Initial draft |
