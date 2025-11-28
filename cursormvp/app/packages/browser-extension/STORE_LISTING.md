# Chrome Web Store Listing

## Extension Details

**Name:** Distill - AI Chat Conversation Distillation

**Short Description (132 chars max):**
Turn your best AI conversations into reusable prompt templates. Capture from ChatGPT, Claude, Gemini & Copilot.

**Detailed Description:**

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
1. Install the extension
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

## Category

**Primary:** Productivity
**Secondary:** Developer Tools

---

## Language

English

---

## Version

0.1.0

---

## Icon Requirements

| Size | File | Usage |
|------|------|-------|
| 128x128 | icon-128.png | Store listing, extension management |
| 48x48 | icon-48.png | Extension management |
| 16x16 | icon-16.png | Favicon, toolbar |

**Note:** Current icons are SVG format. For Chrome Web Store submission, convert to PNG:
```bash
# Using ImageMagick or similar tool
convert icons/icon-128.svg -resize 128x128 icons/icon-128.png
convert icons/icon-48.svg -resize 48x48 icons/icon-48.png
convert icons/icon-16.svg -resize 16x16 icons/icon-16.png
```

---

## Screenshot Requirements

Chrome Web Store requires 1-5 screenshots:
- **Size:** 1280x800 or 640x400 pixels
- **Format:** PNG or JPEG

### Recommended Screenshots

1. **Popup UI** - Show the extension popup on ChatGPT with capture button
2. **Capture Modal** - Display the capture modal with conversation preview
3. **Prompt Library** - Show the web app prompt library with cards
4. **Prompt Detail** - Show a single prompt with variables highlighted
5. **Coach Feature** - Display the AI coaching panel with suggestions

---

## Promotional Images (Optional)

| Size | Purpose |
|------|---------|
| 440x280 | Small promotional tile |
| 920x680 | Large promotional tile |
| 1400x560 | Marquee promotional tile |

---

## Privacy Policy URL

Required for extensions that handle user data.

**URL:** `https://distill.app/privacy` (to be created)

---

## Support URL

**URL:** `https://distill.app/support` or GitHub Issues

---

## Developer Information

**Developer Name:** [Your Name/Company]
**Email:** [developer@distill.app]
**Website:** https://distill.app

---

## Permissions Justification

When submitting, you'll need to justify each permission:

| Permission | Justification |
|------------|---------------|
| `storage` | Store user preferences and cached data locally |
| `activeTab` | Access the current tab to capture conversation content |
| `contextMenus` | Provide right-click menu option for capturing |
| `host_permissions` (AI sites) | Read conversation content from supported AI chat platforms |

---

## Store URL (after publishing)

`https://chrome.google.com/webstore/detail/distill-ai-chat-conversat/[EXTENSION_ID]`

---

## Submission Checklist

- [ ] Create PNG icons (128x128, 48x48, 16x16)
- [ ] Take 5 screenshots (1280x800)
- [ ] Create privacy policy page
- [ ] Set up support URL/email
- [ ] Register Chrome Web Store developer account ($5 one-time fee)
- [ ] Upload extension zip
- [ ] Fill in all listing fields
- [ ] Submit for review

---

## Review Timeline

- Initial review: 1-3 business days
- Updates: Usually faster
- Complex permissions: May take longer

---

## Post-Launch

- Monitor reviews and ratings
- Respond to user feedback
- Track install/uninstall metrics
- Plan version updates
