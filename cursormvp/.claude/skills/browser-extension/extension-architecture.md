# Browser Extension Architecture Skill

## Skill Overview
Comprehensive expertise in modern browser extension architecture using Manifest V3, with focus on security, performance, and cross-browser compatibility for AI-powered applications.

## Core Capabilities

### Manifest V3 Architecture Design
- **Service Workers**: Modern background script architecture replacing persistent background pages
- **Content Scripts**: Secure DOM interaction with shadow DOM isolation
- **Popup/Options Pages**: React-based UI components with TypeScript
- **Host Permissions**: Minimal permission strategies with optional permissions
- **Extension APIs**: Modern Chrome APIs, Firefox WebExtensions, and Edge compatibility

### Extension Component Architecture

#### Service Worker (Background Script)
```typescript
// service-worker.ts - Modern service worker pattern
interface ExtensionState {
  activeTabId: number | null
  userSettings: UserSettings
  aiProcessingQueue: AITask[]
}

class ExtensionServiceWorker {
  private state: ExtensionState = {
    activeTabId: null,
    userSettings: {},
    aiProcessingQueue: []
  }

  constructor() {
    this.setupEventListeners()
    this.initializeExtension()
  }

  private setupEventListeners(): void {
    // Tab management
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this))
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this))

    // Message passing from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this))

    // Context menu interactions
    chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this))

    // Browser action clicks
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this))

    // External message handling (for web app integration)
    chrome.runtime.onMessageExternal.addListener(this.handleExternalMessage.bind(this))

    // Installation and update handling
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this))
  }

  private async initializeExtension(): Promise<void> {
    try {
      // Load user settings from chrome.storage
      this.state.userSettings = await this.loadUserSettings()

      // Setup context menus
      await this.setupContextMenus()

      // Initialize AI processing queue
      this.initializeAIQueue()

      // Setup periodic tasks
      this.setupPeriodicTasks()

      console.log('Extension service worker initialized successfully')
    } catch (error) {
      console.error('Failed to initialize extension:', error)
      this.handleInitializationError(error)
    }
  }

  private async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
    this.state.activeTabId = activeInfo.tabId

    try {
      const tab = await chrome.tabs.get(activeInfo.tabId)
      const isSupportedSite = this.isSupportedAISite(tab.url)

      if (isSupportedSite) {
        // Enable extension features for AI chat sites
        await this.enableAIFeatures(tab)
      }

      // Update badge and context
      await this.updateExtensionBadge(tab)
    } catch (error) {
      console.error('Error handling tab activation:', error)
    }
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'EXTRACT_CONVERSATION':
          const result = await this.processConversationExtraction(message.data, sender.tab)
          sendResponse({ success: true, data: result })
          break

        case 'DISTILL_PROMPT':
          await this.queueAITask({
            type: 'distillation',
            conversation: message.data.conversation,
            settings: message.data.settings,
            tabId: sender.tab?.id
          })
          sendResponse({ success: true, message: 'Distillation queued' })
          break

        case 'GET_USER_SETTINGS':
          sendResponse({ success: true, data: this.state.userSettings })
          break

        case 'UPDATE_SETTINGS':
          await this.updateUserSettings(message.data)
          sendResponse({ success: true })
          break

        default:
          console.warn('Unknown message type:', message.type)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  private isSupportedAISite(url: string | undefined): boolean {
    if (!url) return false

    const supportedSites = [
      'chat.openai.com',
      'claude.ai',
      'gemini.google.com',
      'perplexity.ai',
      'character.ai',
      'poe.com'
    ]

    return supportedSites.some(site => url.includes(site))
  }

  private async queueAITask(task: AITask): Promise<void> {
    this.state.aiProcessingQueue.push({
      ...task,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'queued'
    })

    // Process queue if not already processing
    if (this.state.aiProcessingQueue.filter(t => t.status === 'processing').length === 0) {
      this.processAIQueue()
    }
  }

  private async processAIQueue(): Promise<void> {
    const nextTask = this.state.aiProcessingQueue.find(task => task.status === 'queued')
    if (!nextTask) return

    nextTask.status = 'processing'

    try {
      const result = await this.processAITask(nextTask)
      nextTask.status = 'completed'
      nextTask.result = result

      // Notify content script of completion
      if (nextTask.tabId) {
        await chrome.tabs.sendMessage(nextTask.tabId, {
          type: 'AI_TASK_COMPLETED',
          taskId: nextTask.id,
          result
        })
      }

      // Send to web application if configured
      await this.syncWithWebApp(nextTask, result)

    } catch (error) {
      nextTask.status = 'failed'
      nextTask.error = error.message
      console.error('AI task processing failed:', error)
    }

    // Clean up completed tasks (keep last 10)
    this.state.aiProcessingQueue = this.state.aiProcessingQueue
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    // Continue processing queue
    setTimeout(() => this.processAIQueue(), 1000)
  }
}

// Initialize service worker
const serviceWorker = new ExtensionServiceWorker()
```

#### Content Script Architecture
```typescript
// content-script.ts - Secure content script with shadow DOM
class AIContentScriptManager {
  private shadowRoot: ShadowRoot | null = null
  private conversationObserver: MutationObserver | null = null
  private extractionUI: HTMLElement | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Wait for page to be ready
      await this.waitForPageReady()

      // Create isolated shadow DOM for UI
      this.createShadowDOM()

      // Detect AI chat interface
      const chatInterface = this.detectChatInterface()
      if (!chatInterface) {
        console.log('AI chat interface not detected')
        return
      }

      // Setup conversation monitoring
      this.setupConversationMonitoring()

      // Setup extraction UI
      this.setupExtractionUI()

      // Initialize message passing
      this.setupMessagePassing()

      this.isInitialized = true
      console.log('AI content script initialized successfully')

    } catch (error) {
      console.error('Failed to initialize content script:', error)
    }
  }

  private createShadowDOM(): void {
    // Create container element
    const container = document.createElement('div')
    container.id = 'ai-distill-extension-container'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483647;
      pointer-events: none;
    `

    // Create shadow root for style isolation
    this.shadowRoot = container.attachShadow({ mode: 'closed' })

    // Add CSS reset and styles
    this.shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .distill-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
        }

        .distill-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          pointer-events: all;
        }

        .distill-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .distill-popup {
          position: fixed;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border: 1px solid #e1e5e9;
          padding: 20px;
          min-width: 300px;
          max-width: 400px;
          z-index: 10000;
          pointer-events: all;
        }

        .distill-popup h3 {
          margin-bottom: 12px;
          color: #2d3748;
          font-size: 16px;
          font-weight: 600;
        }

        .distill-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .distill-option {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .distill-option input[type="radio"] {
          margin: 0;
        }

        .distill-actions {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .distill-progress {
          display: none;
          text-align: center;
          padding: 20px;
        }

        .distill-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e1e5e9;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `

    // Append to document
    document.documentElement.appendChild(container)
  }

  private detectChatInterface(): HTMLElement | null {
    // Site-specific chat interface detection
    const selectors = {
      'chat.openai.com': 'main[class*="chat"]',
      'claude.ai': '[data-testid="chat-interface"]',
      'gemini.google.com': 'chat-container',
      'perplexity.ai': '.chat-container'
    }

    const hostname = window.location.hostname
    const selector = selectors[hostname]

    if (selector) {
      return document.querySelector(selector)
    }

    // Generic detection fallback
    const genericSelectors = [
      '[class*="chat"]',
      '[class*="conversation"]',
      '[class*="messages"]',
      '[id*="chat"]'
    ]

    for (const selector of genericSelectors) {
      const element = document.querySelector(selector)
      if (element && this.validateChatInterface(element)) {
        return element as HTMLElement
      }
    }

    return null
  }

  private validateChatInterface(element: Element): boolean {
    // Check if element contains chat-like content
    const text = element.textContent?.toLowerCase() || ''
    const chatIndicators = ['message', 'chat', 'conversation', 'response']

    return chatIndicators.some(indicator => text.includes(indicator)) &&
           element.children.length > 0
  }

  private setupConversationMonitoring(): void {
    const chatContainer = this.detectChatInterface()
    if (!chatContainer) return

    // Observe chat container for new messages
    this.conversationObserver = new MutationObserver((mutations) => {
      let hasNewContent = false

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if added nodes contain message-like content
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (this.isMessageElement(element)) {
                hasNewContent = true
              }
            }
          })
        }
      })

      if (hasNewContent) {
        // Debounce conversation updates
        clearTimeout(this.conversationUpdateTimeout)
        this.conversationUpdateTimeout = setTimeout(() => {
          this.onConversationUpdate()
        }, 1000)
      }
    })

    this.conversationObserver.observe(chatContainer, {
      childList: true,
      subtree: true
    })
  }

  private isMessageElement(element: Element): boolean {
    const classList = Array.from(element.classList).join(' ').toLowerCase()
    const messageIndicators = ['message', 'chat', 'response', 'assistant', 'user']

    return messageIndicators.some(indicator =>
      classList.includes(indicator) ||
      element.querySelector(`[class*="${indicator}"]`)
    )
  }

  private onConversationUpdate(): void {
    // Extract current conversation
    const conversation = this.extractConversation()

    if (conversation.messages.length > 0) {
      // Update extraction UI position and visibility
      this.updateExtractionUI(conversation)

      // Optionally auto-suggest distillation for long conversations
      if (conversation.messages.length >= 10) {
        this.showDistillationSuggestion()
      }
    }
  }

  private extractConversation(): ConversationData {
    const chatInterface = this.detectChatInterface()
    if (!chatInterface) {
      return { messages: [], metadata: {} }
    }

    const messages: ConversationMessage[] = []
    const hostname = window.location.hostname

    // Site-specific extraction logic
    switch (hostname) {
      case 'chat.openai.com':
        return this.extractOpenAIConversation(chatInterface)
      case 'claude.ai':
        return this.extractClaudeConversation(chatInterface)
      case 'gemini.google.com':
        return this.extractGeminiConversation(chatInterface)
      default:
        return this.extractGenericConversation(chatInterface)
    }
  }

  private extractOpenAIConversation(container: HTMLElement): ConversationData {
    const messages: ConversationMessage[] = []

    // ChatGPT message selectors
    const messageElements = container.querySelectorAll('[data-message-author-role]')

    messageElements.forEach((element) => {
      const role = element.getAttribute('data-message-author-role')
      const contentElement = element.querySelector('[class*="markdown"]') ||
                           element.querySelector('[class*="message-content"]')

      if (contentElement && role) {
        messages.push({
          role: role === 'assistant' ? 'assistant' : 'user',
          content: this.cleanTextContent(contentElement.textContent || ''),
          timestamp: this.extractTimestamp(element)
        })
      }
    })

    return {
      messages,
      metadata: {
        site: 'chat.openai.com',
        title: this.extractConversationTitle(),
        extractedAt: Date.now()
      }
    }
  }

  private setupExtractionUI(): void {
    if (!this.shadowRoot) return

    const uiContainer = document.createElement('div')
    uiContainer.className = 'distill-ui'
    uiContainer.innerHTML = `
      <div class="distill-trigger" style="position: fixed; top: 20px; right: 20px; z-index: 10000;">
        <button class="distill-button" id="distill-trigger-btn">
          🪄 Distill Conversation
        </button>
      </div>
    `

    this.shadowRoot.appendChild(uiContainer)

    // Setup event listeners
    const triggerBtn = uiContainer.querySelector('#distill-trigger-btn')
    triggerBtn?.addEventListener('click', () => this.showDistillationPopup())
  }

  private showDistillationPopup(): void {
    if (!this.shadowRoot) return

    const conversation = this.extractConversation()
    if (conversation.messages.length === 0) {
      this.showError('No conversation found to distill')
      return
    }

    const popup = document.createElement('div')
    popup.className = 'distill-popup'
    popup.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
    `

    popup.innerHTML = `
      <div class="distill-content">
        <h3>Distill Conversation</h3>
        <p style="margin-bottom: 16px; color: #666; font-size: 13px;">
          Convert this conversation into a reusable prompt template.
        </p>

        <div class="distill-options">
          <div class="distill-option">
            <input type="radio" name="distill-mode" value="comprehensive" id="mode-comprehensive" checked>
            <label for="mode-comprehensive">Comprehensive - Include full context</label>
          </div>
          <div class="distill-option">
            <input type="radio" name="distill-mode" value="essential" id="mode-essential">
            <label for="mode-essential">Essential - Key points only</label>
          </div>
          <div class="distill-option">
            <input type="radio" name="distill-mode" value="template" id="mode-template">
            <label for="mode-template">Template - Reusable pattern</label>
          </div>
        </div>

        <div class="distill-actions">
          <button class="distill-button" id="cancel-btn" style="background: #e2e8f0; color: #4a5568;">
            Cancel
          </button>
          <button class="distill-button" id="distill-btn">
            Distill (${conversation.messages.length} messages)
          </button>
        </div>
      </div>

      <div class="distill-progress" id="distill-progress">
        <div class="distill-spinner"></div>
        <p>Distilling conversation...</p>
      </div>
    `

    this.shadowRoot.appendChild(popup)

    // Setup event listeners
    popup.querySelector('#cancel-btn')?.addEventListener('click', () => {
      popup.remove()
    })

    popup.querySelector('#distill-btn')?.addEventListener('click', async () => {
      const mode = popup.querySelector('input[name="distill-mode"]:checked')?.value || 'comprehensive'
      await this.performDistillation(conversation, mode, popup)
    })

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!popup.contains(e.target as Node)) {
          popup.remove()
        }
      }, { once: true })
    }, 100)
  }

  private async performDistillation(conversation: ConversationData, mode: string, popup: HTMLElement): Promise<void> {
    try {
      // Show progress
      popup.querySelector('.distill-content')!.style.display = 'none'
      popup.querySelector('#distill-progress')!.style.display = 'block'

      // Send to service worker for processing
      const response = await chrome.runtime.sendMessage({
        type: 'DISTILL_PROMPT',
        data: {
          conversation,
          settings: {
            mode,
            privacyLevel: 'prompt-only',
            includeContext: mode === 'comprehensive'
          }
        }
      })

      if (response.success) {
        this.showSuccess('Conversation distilled successfully!')
        popup.remove()
      } else {
        throw new Error(response.error || 'Distillation failed')
      }

    } catch (error) {
      console.error('Distillation error:', error)
      this.showError('Failed to distill conversation: ' + error.message)
      popup.remove()
    }
  }

  private showSuccess(message: string): void {
    this.showNotification(message, 'success')
  }

  private showError(message: string): void {
    this.showNotification(message, 'error')
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    if (!this.shadowRoot) return

    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#48bb78' : '#f56565'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: all;
    `
    notification.textContent = message

    this.shadowRoot.appendChild(notification)

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIContentScriptManager()
  })
} else {
  new AIContentScriptManager()
}
```

### Cross-Browser Compatibility Patterns

#### Universal API Abstraction
```typescript
// browser-api.ts - Cross-browser compatibility layer
interface UniversalBrowserAPI {
  tabs: UniversalTabsAPI
  storage: UniversalStorageAPI
  runtime: UniversalRuntimeAPI
  notifications: UniversalNotificationsAPI
}

class BrowserAPIAdapter implements UniversalBrowserAPI {
  private browser: any

  constructor() {
    // Detect browser environment
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      this.browser = chrome
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      this.browser = browser
    } else {
      throw new Error('Browser extension API not available')
    }
  }

  get tabs(): UniversalTabsAPI {
    return new TabsAPIAdapter(this.browser.tabs)
  }

  get storage(): UniversalStorageAPI {
    return new StorageAPIAdapter(this.browser.storage)
  }

  get runtime(): UniversalRuntimeAPI {
    return new RuntimeAPIAdapter(this.browser.runtime)
  }

  get notifications(): UniversalNotificationsAPI {
    return new NotificationsAPIAdapter(this.browser.notifications)
  }
}

class StorageAPIAdapter implements UniversalStorageAPI {
  constructor(private storageAPI: any) {}

  async get(keys?: string | string[] | object): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storageAPI.sync.get(keys, (result: any) => {
        if (this.getLastError()) {
          reject(this.getLastError())
        } else {
          resolve(result)
        }
      })
    })
  }

  async set(items: object): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storageAPI.sync.set(items, () => {
        if (this.getLastError()) {
          reject(this.getLastError())
        } else {
          resolve()
        }
      })
    })
  }

  private getLastError(): Error | null {
    if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
      return new Error(chrome.runtime.lastError.message)
    }
    if (typeof browser !== 'undefined' && browser.runtime?.lastError) {
      return new Error(browser.runtime.lastError.message)
    }
    return null
  }
}
```

### Security and Performance Patterns

#### Content Security Policy Configuration
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://*.google.com;"
  },
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus"
  ],
  "optional_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ],
  "host_permissions": [],
  "web_accessible_resources": [
    {
      "resources": ["assets/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

#### Performance Optimization
```typescript
// performance.ts - Extension performance patterns
class ExtensionPerformanceManager {
  private performanceMetrics: Map<string, PerformanceMetric> = new Map()
  private memoryMonitor: MemoryMonitor

  constructor() {
    this.memoryMonitor = new MemoryMonitor()
    this.setupPerformanceMonitoring()
  }

  // Lazy loading for heavy operations
  async loadHeavyFeature(featureName: string): Promise<any> {
    const start = performance.now()

    try {
      // Dynamic import for code splitting
      const module = await import(`./features/${featureName}`)

      this.recordMetric('feature_load', {
        name: featureName,
        duration: performance.now() - start,
        success: true
      })

      return module.default
    } catch (error) {
      this.recordMetric('feature_load', {
        name: featureName,
        duration: performance.now() - start,
        success: false,
        error: error.message
      })
      throw error
    }
  }

  // Memory-efficient conversation processing
  async processLargeConversation(conversation: ConversationData): Promise<ProcessedConversation> {
    const memoryBefore = await this.memoryMonitor.getCurrentUsage()

    // Process in chunks to avoid memory spikes
    const chunkSize = 50
    const chunks = this.chunkArray(conversation.messages, chunkSize)
    const processed: ProcessedMessage[] = []

    for (const chunk of chunks) {
      const processedChunk = await this.processMessageChunk(chunk)
      processed.push(...processedChunk)

      // Allow garbage collection between chunks
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    const memoryAfter = await this.memoryMonitor.getCurrentUsage()

    this.recordMetric('conversation_processing', {
      messageCount: conversation.messages.length,
      memoryDelta: memoryAfter - memoryBefore,
      duration: performance.now()
    })

    return { messages: processed, metadata: conversation.metadata }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor extension lifecycle events
    if (typeof chrome !== 'undefined') {
      chrome.runtime.onStartup?.addListener(() => {
        this.recordMetric('extension_startup', { timestamp: Date.now() })
      })

      chrome.runtime.onSuspend?.addListener(() => {
        this.recordMetric('extension_suspend', { timestamp: Date.now() })
      })
    }

    // Monitor memory usage periodically
    setInterval(() => {
      this.memoryMonitor.recordUsage()
    }, 60000) // Every minute
  }
}

class MemoryMonitor {
  private usageHistory: MemoryUsage[] = []

  async getCurrentUsage(): Promise<number> {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  async recordUsage(): Promise<void> {
    const usage = await this.getCurrentUsage()
    const timestamp = Date.now()

    this.usageHistory.push({ usage, timestamp })

    // Keep only last 24 hours of data
    const oneDayAgo = timestamp - 24 * 60 * 60 * 1000
    this.usageHistory = this.usageHistory.filter(entry => entry.timestamp > oneDayAgo)

    // Check for memory leaks
    if (this.detectMemoryLeak()) {
      console.warn('Potential memory leak detected')
      this.alertMemoryIssue()
    }
  }

  private detectMemoryLeak(): boolean {
    if (this.usageHistory.length < 10) return false

    const recent = this.usageHistory.slice(-10)
    const trend = this.calculateTrend(recent.map(entry => entry.usage))

    // Significant upward trend in memory usage
    return trend > 1.1 // 10% increase trend
  }
}
```

## Best Practices

### Security
- Use minimal permissions with optional permissions for user consent
- Implement shadow DOM isolation for content script UI
- Sanitize all user input and external data
- Use Content Security Policy to prevent XSS
- Regular security audits of dependencies

### Performance
- Implement lazy loading for heavy features
- Use code splitting and dynamic imports
- Monitor memory usage and prevent leaks
- Optimize content script injection timing
- Cache frequently accessed data appropriately

### User Experience
- Provide clear visual feedback for all operations
- Implement graceful error handling and recovery
- Support keyboard navigation and accessibility
- Minimize user interruptions and notifications
- Maintain consistent UI patterns across sites

### Cross-Browser Compatibility
- Use universal API abstraction layers
- Test on all target browsers regularly
- Handle API differences gracefully
- Use progressive enhancement patterns
- Maintain separate browser-specific builds if needed

## Integration Patterns

### Web Application Sync
```typescript
// web-app-integration.ts
class WebAppIntegration {
  private apiBase: string
  private authToken: string | null = null

  async syncConversationData(conversation: ConversationData): Promise<void> {
    try {
      const response = await fetch(`${this.apiBase}/api/conversations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'X-Extension-Version': chrome.runtime.getManifest().version
        },
        body: JSON.stringify({
          conversation,
          source: 'extension',
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Conversation synced successfully:', result.id)
    } catch (error) {
      console.error('Failed to sync conversation:', error)
      // Queue for retry
      await this.queueForRetry(conversation)
    }
  }
}
```

This comprehensive browser extension architecture skill provides the foundation for building modern, secure, and performant browser extensions that integrate seamlessly with AI services and web applications.