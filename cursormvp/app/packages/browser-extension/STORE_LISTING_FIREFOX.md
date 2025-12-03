# Mozilla Add-ons (AMO) Store Listing

## Add-on Details

**Name:** Distill - AI Chat Conversation Distillation

**Add-on ID:** `distill@distill.ai`

**Summary (250 chars max):**
Turn your best AI conversations into reusable prompt templates. Capture from ChatGPT, Claude, Gemini & Copilot with one click.

**Description:**

Transform your AI chat conversations into powerful, reusable prompt templates with Distill.

**Key Features:**

- **One-Click Capture** - Save conversations from ChatGPT, Claude, Gemini, and Microsoft Copilot with a single click or keyboard shortcut (Ctrl+Shift+D / Cmd+Shift+D)

- **Smart Distillation** - AI-powered analysis extracts the essence of your conversations, turning them into structured, reusable prompts

- **Privacy Controls** - Choose between full conversation capture or prompt-only mode to control what gets stored

- **Prompt Library** - Build your personal collection of optimized prompts, organized into collections and tagged for easy discovery

- **Team Sharing** - Create workspaces to share prompts with your team while maintaining privacy controls

- **AI Coaching** - Get suggestions to improve your prompts with our built-in prompt coach

- **Variable Templates** - Create prompts with {{variables}} that can be filled in when running

- **Semantic Search** - Find prompts by meaning, not just keywords

**Supported Platforms:**
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)

**How It Works:**
1. Install the add-on
2. Navigate to any supported AI chat platform
3. Have a productive conversation
4. Click the Distill icon or press Ctrl+Shift+D
5. Review and save your distilled prompt
6. Access your prompts anytime from the web app

**Privacy First:**
- We only capture what you choose to share
- Full or prompt-only privacy modes
- Your data stays yours

Perfect for knowledge workers, AI enthusiasts, prompt engineers, and teams looking to build and share their AI prompt expertise.

---

## Categories

**Primary:** Productivity
**Secondary:** Web Development

---

## Tags

`AI`, `productivity`, `ChatGPT`, `Claude`, `prompts`, `templates`

---

## Technical Details

**Firefox Version:** 121.0+ (Manifest V3 support)
**Manifest Version:** 3
**License:** Proprietary

---

## Icon Requirements

| Size | File | Usage |
|------|------|-------|
| 128x128 | icon-128.png | Store listing |
| 64x64 | icon-64.png | Add-on manager |
| 48x48 | icon-48.png | Toolbar |

**Note:** AMO accepts SVG icons. For best compatibility, provide both SVG and PNG.

---

## Screenshot Requirements

AMO accepts 1-10 screenshots:
- **Recommended size:** 1280x800 or 1920x1080 pixels
- **Format:** PNG or JPEG

### Recommended Screenshots

1. **Popup UI on Firefox** - Show the extension popup with capture button
2. **Capture Modal** - Display the capture modal with conversation preview
3. **Prompt Library** - Show the web app prompt library with cards
4. **Prompt Detail** - Show a single prompt with variables highlighted
5. **Privacy Mode Selection** - Show the privacy mode selector

---

## Privacy Policy URL

Required for add-ons that handle user data.

**URL:** `https://distill.app/privacy`

---

## Support Information

**Support URL:** `https://distill.app/support` or GitHub Issues
**Support Email:** support@distill.app

---

## Developer Information

**Developer Name:** [Your Name/Company]
**Email:** developer@distill.app
**Homepage:** https://distill.app

---

## Permissions Justification

AMO requires detailed justification for each permission:

| Permission | Justification |
|------------|---------------|
| `storage` | Store user preferences, authentication tokens, and cached prompt data locally |
| `activeTab` | Access the current tab to capture AI conversation content when user initiates capture |
| `contextMenus` | Provide right-click context menu option for quick conversation capture |
| `cookies` | Read authentication cookies to verify user login status with our API |
| `host_permissions` (AI sites) | Read conversation content from ChatGPT, Claude, Gemini, and Copilot to enable capture functionality |
| `host_permissions` (distill.app) | Communicate with Distill API to save and retrieve prompts |

**Note for Reviewers:**
- This add-on only activates on explicitly listed AI chat platforms
- User data is only transmitted when the user explicitly initiates a capture
- Privacy mode allows users to control what data is stored (full conversation vs prompt-only)
- No data is collected without explicit user action

---

## Source Code

If required for review, source code is available at:
- GitHub repository (if public)
- Or provide source code zip alongside the extension package

**Build Instructions:**
```bash
# Install dependencies
bun install

# Build for Firefox
bun run build:firefox

# The output is in dist/ directory
```

---

## Store URL (after publishing)

`https://addons.mozilla.org/firefox/addon/distill-ai-chat/`

---

## Submission Checklist

- [ ] Create PNG icons (128x128, 64x64, 48x48)
- [ ] Take 5 screenshots (1280x800)
- [ ] Create/verify privacy policy page
- [ ] Set up support URL/email
- [ ] Register Mozilla Add-ons developer account (free)
- [ ] Build extension: `bun run build:firefox`
- [ ] Package extension: `bun run package:firefox`
- [ ] Validate: `bun run lint:firefox` (should show 0 errors)
- [ ] Upload extension zip
- [ ] Fill in all listing fields
- [ ] Provide detailed permission justifications
- [ ] Submit for review

---

## Review Process

**Timeline:**
- Initial review: 1-2 business days (typically faster than Chrome)
- Updates: Usually reviewed within 24 hours
- Human review for new add-ons, automated for updates

**Common Review Issues:**
1. Insufficient permission justification - be detailed
2. Missing privacy policy - ensure URL is accessible
3. Obfuscated code - submit source if requested
4. Remote code loading - avoid `eval()` and remote scripts

---

## AMO vs Chrome Web Store Differences

| Aspect | Chrome | Firefox (AMO) |
|--------|--------|---------------|
| Developer fee | $5 one-time | Free |
| Review time | 1-3 days | 1-2 days |
| Manifest version | V3 required | V3 (Firefox 121+) |
| Add-on ID | Auto-generated | Must specify in manifest |
| Source code | Not required | May be requested |

---

## Post-Launch

- Monitor reviews and ratings
- Respond to user feedback
- Track download statistics
- Plan version updates
- Consider Featured Add-on application

---

## Version History

### v0.1.0 (Initial Release)
- One-click conversation capture
- Privacy mode selection
- Prompt library integration
- Support for ChatGPT, Claude, Gemini, Copilot
