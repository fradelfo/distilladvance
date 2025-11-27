# Browser Extension Development Guide

Complete guide for developing AI-powered browser extensions using this project template, covering Manifest V3, cross-browser compatibility, security, and AI integration.

## Table of Contents
- [Extension Architecture](#extension-architecture)
- [Development Workflow](#development-workflow)
- [AI Chat Integration](#ai-chat-integration)
- [Security and Permissions](#security-and-permissions)
- [Testing Strategies](#testing-strategies)
- [Cross-Browser Compatibility](#cross-browser-compatibility)
- [Store Deployment](#store-deployment)

## Extension Architecture

### Manifest V3 Structure

The template uses Manifest V3 for modern browser extension development:

```
app/packages/browser-extension/
├── manifest.json              # Extension manifest (V3)
├── src/
│   ├── background/            # Service worker scripts
│   │   ├── service-worker.ts  # Main background script
│   │   └── message-handler.ts # Cross-script communication
│   ├── content/               # Content scripts for injection
│   │   ├── chat-sites/        # Site-specific integrations
│   │   │   ├── openai.ts      # ChatGPT integration
│   │   │   ├── claude.ts      # Claude AI integration
│   │   │   └── common.ts      # Shared functionality
│   │   └── ui-injection/      # UI component injection
│   ├── popup/                 # Extension popup interface
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom React hooks
│   │   └── index.tsx         # Popup entry point
│   ├── options/              # Options/settings page
│   │   └── index.tsx         # Options entry point
│   └── shared/               # Shared utilities and types
│       ├── types/            # TypeScript definitions
│       ├── utils/            # Helper functions
│       └── api/              # API communication
├── public/                   # Static assets
│   ├── icons/               # Extension icons
│   └── _locales/            # Internationalization
└── dist/                    # Built extension output
```

### Key Components

#### 1. Service Worker (Background Script)
**Location**: `src/background/service-worker.ts`

```typescript
// Background service worker for extension lifecycle management
import { MessageHandler } from './message-handler';
import { AIService } from '../shared/api/ai-service';

class ExtensionBackground {
  private messageHandler: MessageHandler;
  private aiService: AIService;

  constructor() {
    this.messageHandler = new MessageHandler();
    this.aiService = new AIService();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle extension installation/update
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.messageHandler.handle.bind(this.messageHandler));

    // Handle tab updates for chat site detection
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  }

  private async handleInstall(details: chrome.runtime.InstalledDetails) {
    if (details.reason === 'install') {
      // First-time installation setup
      await this.initializeExtension();
    }
  }

  private async handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
    if (changeInfo.status === 'complete') {
      // Check if tab is an AI chat site and inject content scripts
      await this.checkAndInjectScripts(tabId);
    }
  }
}

// Initialize background service
new ExtensionBackground();
```

#### 2. Content Scripts
**Location**: `src/content/chat-sites/`

Content scripts inject AI conversation distillation functionality into supported chat sites:

```typescript
// src/content/chat-sites/openai.ts
import { ChatSiteIntegration } from '../common';
import { DistillationUI } from '../ui-injection/distillation-ui';

export class OpenAIIntegration extends ChatSiteIntegration {
  constructor() {
    super('openai', 'chat.openai.com');
  }

  async initialize() {
    await super.initialize();

    // Wait for ChatGPT interface to load
    await this.waitForElement('[data-testid="conversation-turn"]');

    // Inject distillation UI
    this.injectDistillationControls();

    // Set up conversation monitoring
    this.setupConversationMonitoring();
  }

  private injectDistillationControls() {
    const conversationContainer = document.querySelector('[role="main"]');
    if (conversationContainer) {
      const distillUI = new DistillationUI(this.siteConfig);
      distillUI.inject(conversationContainer);
    }
  }

  private setupConversationMonitoring() {
    // Monitor for new messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.handleNewMessages(mutation.addedNodes);
        }
      });
    });

    const chatContainer = document.querySelector('[role="main"]');
    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    }
  }

  async extractConversation(): Promise<ConversationData> {
    // Extract conversation data specific to ChatGPT's DOM structure
    const messages = Array.from(document.querySelectorAll('[data-testid="conversation-turn"]'));

    return {
      id: this.generateConversationId(),
      timestamp: Date.now(),
      site: this.siteName,
      messages: messages.map(this.parseMessage.bind(this)),
      metadata: this.extractMetadata()
    };
  }
}
```

#### 3. Popup Interface
**Location**: `src/popup/`

React-based popup interface for quick access to extension features:

```typescript
// src/popup/components/PopupApp.tsx
import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { DistillationControls } from './DistillationControls';
import { SettingsPanel } from './SettingsPanel';
import { useExtensionData } from '../hooks/useExtensionData';

export const PopupApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'distill' | 'settings'>('conversations');
  const { conversations, currentSite, isLoading } = useExtensionData();

  return (
    <div className="popup-container w-96 h-96 p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">AI Conversation Distiller</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-3 py-1 rounded ${activeTab === 'conversations' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('distill')}
            className={`px-3 py-1 rounded ${activeTab === 'distill' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Distill
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="flex-1">
        {activeTab === 'conversations' && <ConversationList conversations={conversations} />}
        {activeTab === 'distill' && <DistillationControls currentSite={currentSite} />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
};
```

## Development Workflow

### Setting Up Extension Development

```bash
# Navigate to extension package
cd app/packages/browser-extension

# Install dependencies
bun install

# Start development with hot reload
bun run dev

# Build for production
bun run build
```

### Using Claude Code Agents

The template includes specialized agents for extension development:

#### Frontend Agent for Extension UI
```bash
# In Claude Code session:
"Use the frontend agent to create a new popup component for conversation export"

"Frontend agent: implement responsive design for the extension options page"

"Use the frontend agent to optimize the popup loading performance"
```

#### Security Agent for Extension Security
```bash
"Use the security agent to review the extension manifest permissions"

"Security agent: validate Content Security Policy for the popup"

"Use the security agent to ensure secure communication between content scripts and background"
```

### Development Commands

```bash
# Extension-specific development commands
bun run ext:dev              # Development with hot reload
bun run ext:build            # Production build
bun run ext:test             # Run extension tests
bun run ext:lint             # Lint extension code
bun run ext:validate         # Validate manifest and compliance
bun run ext:package          # Package for store submission

# Cross-browser development
bun run ext:firefox          # Firefox development
bun run ext:edge            # Edge development
bun run ext:safari          # Safari development (experimental)

# Testing across browsers
bun run ext:test:chrome      # Chrome-specific tests
bun run ext:test:firefox     # Firefox-specific tests
bun run ext:test:cross       # Cross-browser compatibility tests
```

## AI Chat Integration

### Supported Chat Sites

The template includes integrations for major AI chat platforms:

#### 1. OpenAI ChatGPT
- **URL Pattern**: `chat.openai.com`
- **Features**: Conversation extraction, prompt distillation, export
- **Special Handling**: Dynamic loading, authentication state

#### 2. Claude AI (Anthropic)
- **URL Pattern**: `claude.ai`
- **Features**: Conversation analysis, prompt optimization
- **Special Handling**: Streaming responses, conversation threading

#### 3. Google Bard
- **URL Pattern**: `bard.google.com`
- **Features**: Basic conversation capture and export
- **Special Handling**: Google account integration

#### 4. Custom Chat Sites
Add support for additional AI chat platforms:

```typescript
// src/content/chat-sites/custom-ai-site.ts
import { ChatSiteIntegration } from '../common';

export class CustomAISiteIntegration extends ChatSiteIntegration {
  constructor() {
    super('custom-ai', 'ai-site.example.com');

    this.siteConfig = {
      messageSelector: '.message-container',
      userMessageClass: '.user-message',
      aiMessageClass: '.ai-response',
      conversationContainer: '#chat-area'
    };
  }

  async initialize() {
    await super.initialize();
    // Site-specific initialization logic
  }

  async extractConversation(): Promise<ConversationData> {
    // Site-specific conversation extraction
    return {
      id: this.generateConversationId(),
      timestamp: Date.now(),
      site: this.siteName,
      messages: await this.parseMessages(),
      metadata: this.extractMetadata()
    };
  }

  private async parseMessages(): Promise<Message[]> {
    // Implement site-specific message parsing
    const messageElements = document.querySelectorAll(this.siteConfig.messageSelector);
    return Array.from(messageElements).map(this.parseMessage.bind(this));
  }
}
```

### AI Integration Features

#### 1. Conversation Distillation
Extract and summarize key information from AI conversations:

```typescript
// src/shared/ai/conversation-distiller.ts
export class ConversationDistiller {
  async distillConversation(conversation: ConversationData): Promise<DistilledConversation> {
    // Use Claude Code platform agent for AI processing
    const summary = await this.generateSummary(conversation);
    const keyPoints = await this.extractKeyPoints(conversation);
    const actionItems = await this.identifyActionItems(conversation);

    return {
      original: conversation,
      summary,
      keyPoints,
      actionItems,
      timestamp: Date.now(),
      distillationMethod: 'ai-powered'
    };
  }

  private async generateSummary(conversation: ConversationData): Promise<string> {
    // Integrate with backend AI service
    return await this.aiService.summarize({
      messages: conversation.messages,
      context: conversation.metadata,
      length: 'medium'
    });
  }
}
```

#### 2. Prompt Engineering
Help users optimize their AI prompts:

```typescript
// src/shared/ai/prompt-optimizer.ts
export class PromptOptimizer {
  async optimizePrompt(originalPrompt: string): Promise<OptimizedPrompt> {
    const analysis = await this.analyzePrompt(originalPrompt);
    const suggestions = await this.generateSuggestions(analysis);
    const optimizedVersion = await this.createOptimizedVersion(originalPrompt, suggestions);

    return {
      original: originalPrompt,
      optimized: optimizedVersion,
      improvements: suggestions,
      confidence: analysis.confidence
    };
  }
}
```

## Security and Permissions

### Manifest V3 Security

The template follows Manifest V3 security best practices:

```json
// manifest.json
{
  "manifest_version": 3,
  "permissions": [
    "activeTab",        // Access current tab only when extension is invoked
    "storage",          // Local storage for user preferences
    "scripting"         // Required for content script injection
  ],
  "optional_permissions": [
    "tabs"              // Additional tab access (user must approve)
  ],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://bard.google.com/*"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; frame-ancestors 'none';"
  }
}
```

### Security Best Practices

#### 1. Minimal Permissions
```typescript
// Only request permissions when needed
async function requestTabsPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.request({
      permissions: ['tabs']
    }, (granted) => {
      resolve(granted);
    });
  });
}
```

#### 2. Secure Communication
```typescript
// Validate messages between scripts
interface MessageValidator {
  validateMessage(message: any): boolean;
}

export class SecureMessageHandler implements MessageValidator {
  validateMessage(message: any): boolean {
    // Validate message structure and content
    if (!message.type || !message.data) return false;
    if (typeof message.type !== 'string') return false;

    // Validate against allowed message types
    const allowedTypes = ['EXTRACT_CONVERSATION', 'DISTILL_REQUEST', 'SETTINGS_UPDATE'];
    return allowedTypes.includes(message.type);
  }

  async handleMessage(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
    if (!this.validateMessage(message)) {
      throw new Error('Invalid message format');
    }

    // Additional sender validation
    if (!this.validateSender(sender)) {
      throw new Error('Unauthorized sender');
    }

    // Handle valid message
    return await this.processMessage(message);
  }
}
```

#### 3. Content Security Policy
```typescript
// Dynamic content creation with CSP compliance
export class SecureUIInjection {
  createSecureElement(tag: string, attributes: Record<string, string>): HTMLElement {
    const element = document.createElement(tag);

    // Only allow safe attributes
    const safeAttributes = ['class', 'id', 'data-*', 'aria-*'];
    Object.entries(attributes).forEach(([key, value]) => {
      if (this.isAttributeSafe(key, safeAttributes)) {
        element.setAttribute(key, this.sanitizeValue(value));
      }
    });

    return element;
  }

  private isAttributeSafe(attribute: string, allowedAttributes: string[]): boolean {
    return allowedAttributes.some(allowed => {
      if (allowed.endsWith('*')) {
        return attribute.startsWith(allowed.slice(0, -1));
      }
      return attribute === allowed;
    });
  }
}
```

## Testing Strategies

### Extension-Specific Testing

#### 1. Unit Tests for Extension Logic
```typescript
// tests/extension/content-scripts.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAIIntegration } from '../src/content/chat-sites/openai';
import { createMockDOM } from '../utils/mock-dom';

describe('OpenAI Content Script Integration', () => {
  let integration: OpenAIIntegration;

  beforeEach(() => {
    // Set up mock DOM for ChatGPT interface
    createMockDOM({
      url: 'https://chat.openai.com',
      elements: [
        { selector: '[role="main"]', html: '<div role="main"><div data-testid="conversation-turn">Test message</div></div>' }
      ]
    });

    integration = new OpenAIIntegration();
  });

  it('should detect ChatGPT interface correctly', async () => {
    await integration.initialize();
    expect(integration.isInitialized()).toBe(true);
  });

  it('should extract conversation data', async () => {
    await integration.initialize();
    const conversation = await integration.extractConversation();

    expect(conversation.site).toBe('openai');
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0].content).toBe('Test message');
  });
});
```

#### 2. End-to-End Extension Testing
```typescript
// tests/e2e/extension.spec.ts
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Browser Extension E2E Tests', () => {
  test('should load extension and inject content scripts', async () => {
    // Load extension in browser
    const pathToExtension = path.join(__dirname, '../dist/extension');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    const page = await context.newPage();

    // Navigate to ChatGPT
    await page.goto('https://chat.openai.com');

    // Check that content script injected UI elements
    const distillButton = page.locator('[data-extension="distill-button"]');
    await expect(distillButton).toBeVisible();

    // Test extension popup
    const extensionId = await page.evaluate(() => chrome.runtime.id);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(page.locator('h1')).toContainText('AI Conversation Distiller');
  });
});
```

#### 3. Cross-Browser Compatibility Tests
```typescript
// tests/cross-browser/compatibility.test.ts
import { describe, it, expect } from 'vitest';
import { BrowserDetector } from '../src/shared/utils/browser-detector';

describe('Cross-Browser Compatibility', () => {
  it('should detect Chrome correctly', () => {
    const detector = new BrowserDetector();
    // Mock Chrome user agent
    global.navigator = { userAgent: 'Chrome/91.0.4472.124' } as Navigator;
    expect(detector.getBrowser()).toBe('chrome');
  });

  it('should handle Firefox APIs', () => {
    // Mock Firefox browser API
    global.browser = {
      runtime: {
        sendMessage: vi.fn(),
        onMessage: { addListener: vi.fn() }
      }
    };

    const detector = new BrowserDetector();
    expect(detector.hasWebExtensionsAPI()).toBe(true);
  });
});
```

### Automated Testing Pipeline

```yaml
# .github/workflows/extension-tests.yml
name: Extension Testing

on: [push, pull_request]

jobs:
  extension-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, edge]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build extension
        run: bun run ext:build

      - name: Run extension tests
        run: bun run ext:test:${{ matrix.browser }}

      - name: Validate manifest
        run: bun run ext:validate:${{ matrix.browser }}
```

## Cross-Browser Compatibility

### Browser API Abstraction

Create a unified API wrapper for cross-browser compatibility:

```typescript
// src/shared/utils/browser-api.ts
type BrowserAPI = typeof chrome | typeof browser;

export class UnifiedBrowserAPI {
  private api: BrowserAPI;

  constructor() {
    // Support both Chrome and Firefox APIs
    this.api = (typeof chrome !== 'undefined' ? chrome : browser) as BrowserAPI;
  }

  // Unified runtime API
  get runtime() {
    return {
      sendMessage: (message: any) => this.promisify(this.api.runtime.sendMessage)(message),
      onMessage: this.api.runtime.onMessage,
      getURL: this.api.runtime.getURL.bind(this.api.runtime)
    };
  }

  // Unified storage API
  get storage() {
    return {
      sync: {
        get: (keys: string[]) => this.promisify(this.api.storage.sync.get)(keys),
        set: (items: Record<string, any>) => this.promisify(this.api.storage.sync.set)(items)
      }
    };
  }

  // Unified tabs API
  get tabs() {
    return {
      query: (queryInfo: chrome.tabs.QueryInfo) => this.promisify(this.api.tabs.query)(queryInfo),
      sendMessage: (tabId: number, message: any) => this.promisify(this.api.tabs.sendMessage)(tabId, message)
    };
  }

  private promisify(fn: Function) {
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (result: any) => {
          if (this.api.runtime.lastError) {
            reject(this.api.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });
    };
  }
}
```

### Browser-Specific Builds

Configure different builds for different browsers:

```typescript
// build/build-config.ts
interface BuildConfig {
  browser: 'chrome' | 'firefox' | 'edge' | 'safari';
  manifestVersion: 2 | 3;
  apiNamespace: 'chrome' | 'browser';
  outputDir: string;
}

const buildConfigs: Record<string, BuildConfig> = {
  chrome: {
    browser: 'chrome',
    manifestVersion: 3,
    apiNamespace: 'chrome',
    outputDir: 'dist/chrome'
  },
  firefox: {
    browser: 'firefox',
    manifestVersion: 2, // Firefox still uses MV2 in some cases
    apiNamespace: 'browser',
    outputDir: 'dist/firefox'
  },
  edge: {
    browser: 'edge',
    manifestVersion: 3,
    apiNamespace: 'chrome',
    outputDir: 'dist/edge'
  }
};
```

## Store Deployment

### Chrome Web Store Deployment

Automated deployment using the DevOps agent:

```bash
# In Claude Code session:
"Use the devops agent to prepare Chrome Web Store deployment"

"DevOps agent: configure automated Chrome extension deployment with CI/CD"
```

The template includes automated deployment scripts:

```typescript
// scripts/deploy-chrome.ts
import { ChromeWebstoreUpload } from 'chrome-webstore-upload';

export class ChromeStoreDeployer {
  private webstore: ChromeWebstoreUpload;

  constructor() {
    this.webstore = new ChromeWebstoreUpload({
      extensionId: process.env.CHROME_EXTENSION_ID!,
      clientId: process.env.CHROME_CLIENT_ID!,
      clientSecret: process.env.CHROME_CLIENT_SECRET!,
      refreshToken: process.env.CHROME_REFRESH_TOKEN!
    });
  }

  async deploy(zipFilePath: string): Promise<void> {
    try {
      // Upload new version
      await this.webstore.uploadExisting(fs.createReadStream(zipFilePath));

      // Publish to production
      await this.webstore.publish('default');

      console.log('✅ Chrome Web Store deployment successful');
    } catch (error) {
      console.error('❌ Chrome Web Store deployment failed:', error);
      throw error;
    }
  }
}
```

### Firefox Add-ons Deployment

```typescript
// scripts/deploy-firefox.ts
import jwt from 'jsonwebtoken';
import axios from 'axios';

export class FirefoxAMODeployer {
  async deploy(xpiFilePath: string): Promise<void> {
    const token = this.generateJWT();

    const formData = new FormData();
    formData.append('upload', fs.createReadStream(xpiFilePath));

    const response = await axios.post(
      `https://addons.mozilla.org/api/v5/addons/${process.env.FIREFOX_ADDON_ID}/versions/`,
      formData,
      {
        headers: {
          'Authorization': `JWT ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('✅ Firefox AMO deployment successful');
  }

  private generateJWT(): string {
    return jwt.sign(
      { iss: process.env.FIREFOX_JWT_ISSUER, exp: Date.now() + 60000 },
      process.env.FIREFOX_JWT_SECRET!
    );
  }
}
```

### Deployment Pipeline

```yaml
# .github/workflows/extension-deploy.yml
name: Extension Deployment

on:
  push:
    tags: [v*]

jobs:
  deploy-extension:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        store: [chrome, firefox, edge]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Build extension for ${{ matrix.store }}
        run: bun run ext:build:${{ matrix.store }}

      - name: Package extension
        run: bun run ext:package:${{ matrix.store }}

      - name: Deploy to ${{ matrix.store }} store
        run: bun run ext:deploy:${{ matrix.store }}
        env:
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          FIREFOX_ADDON_ID: ${{ secrets.FIREFOX_ADDON_ID }}
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
```

## Performance Optimization

### Extension Performance Best Practices

1. **Lazy Loading**: Only load scripts when needed
2. **Efficient DOM Manipulation**: Minimize reflows and repaints
3. **Memory Management**: Clean up event listeners and observers
4. **Background Script Optimization**: Use efficient service worker patterns

```typescript
// src/shared/performance/lazy-loader.ts
export class LazyLoader {
  private loadedModules = new Map<string, any>();

  async loadModule(moduleName: string): Promise<any> {
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    const module = await this.dynamicImport(moduleName);
    this.loadedModules.set(moduleName, module);
    return module;
  }

  private async dynamicImport(moduleName: string): Promise<any> {
    switch (moduleName) {
      case 'openai-integration':
        return await import('../content/chat-sites/openai');
      case 'claude-integration':
        return await import('../content/chat-sites/claude');
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  }
}
```

### Memory Management

```typescript
// src/shared/utils/cleanup-manager.ts
export class CleanupManager {
  private cleanupTasks: (() => void)[] = [];

  addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks.length = 0;
  }

  // Automatic cleanup on page unload
  setupAutoCleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
}
```

## Advanced Features

### AI-Powered Features

1. **Smart Conversation Detection**: Automatically detect when interesting conversations are happening
2. **Context-Aware Distillation**: Provide different summaries based on conversation context
3. **Intelligent Prompt Suggestions**: Suggest improvements to user prompts in real-time
4. **Cross-Site Conversation Linking**: Connect related conversations across different AI platforms

### Analytics and Monitoring

```typescript
// src/shared/analytics/extension-analytics.ts
export class ExtensionAnalytics {
  async trackEvent(event: string, properties: Record<string, any>): Promise<void> {
    // Privacy-compliant analytics tracking
    const anonymizedData = this.anonymizeData({
      event,
      properties,
      timestamp: Date.now(),
      version: this.getExtensionVersion()
    });

    // Send to analytics service (respecting user privacy settings)
    if (await this.hasAnalyticsConsent()) {
      await this.sendAnalytics(anonymizedData);
    }
  }

  private anonymizeData(data: any): any {
    // Remove any personally identifiable information
    return {
      ...data,
      properties: {
        ...data.properties,
        // Remove any PII fields
        userId: undefined,
        email: undefined,
        // Keep only aggregate/anonymous data
      }
    };
  }
}
```

---

This comprehensive guide covers all aspects of browser extension development with this template. The combination of modern tooling, AI integration, security best practices, and automated deployment makes it possible to build sophisticated browser extensions efficiently and safely.

**Next Steps:**
- [AI Integration Guide](../development/ai-integration.md)
- [Security Best Practices](../security/best-practices.md)
- [Testing Guide](../testing/comprehensive-testing.md)