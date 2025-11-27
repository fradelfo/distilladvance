# Comprehensive Testing Strategy Skill

## Skill Overview
Expert testing strategies for browser extensions and web applications, including unit testing, integration testing, end-to-end testing, and specialized browser extension testing patterns.

## Core Capabilities

### Browser Extension Testing Framework

#### Chrome Extension Testing Setup
```typescript
// testing/extension-test-setup.ts
interface ExtensionTestConfig {
  manifestVersion: 2 | 3
  permissions: string[]
  extensionPath: string
  headless: boolean
  devtools: boolean
}

interface ExtensionTestContext {
  extensionId: string
  browser: Browser
  backgroundPage?: Page
  popup?: Page
  options?: Page
  contentScripts: Map<string, Page>
}

class ChromeExtensionTester {
  private browser: Browser
  private context: BrowserContext
  private extensionId: string

  async setup(config: ExtensionTestConfig): Promise<ExtensionTestContext> {
    // Launch browser with extension
    this.browser = await chromium.launch({
      headless: config.headless,
      args: [
        '--disable-extensions-except=' + config.extensionPath,
        '--load-extension=' + config.extensionPath,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ]
    })

    this.context = await this.browser.newContext({
      permissions: ['notifications', 'clipboard-read', 'clipboard-write']
    })

    // Get extension ID
    const backgroundPage = await this.getBackgroundPage()
    this.extensionId = await backgroundPage.evaluate(() => chrome.runtime.id)

    return {
      extensionId: this.extensionId,
      browser: this.browser,
      backgroundPage,
      contentScripts: new Map()
    }
  }

  async getBackgroundPage(): Promise<Page> {
    const targets = await this.browser.targets()
    const backgroundTarget = targets.find(target =>
      target.type() === 'background_page' &&
      target.url().includes('chrome-extension://')
    )

    if (!backgroundTarget) {
      throw new Error('Background page not found')
    }

    return await backgroundTarget.page()
  }

  async openPopup(): Promise<Page> {
    const extensionUrl = `chrome-extension://${this.extensionId}/popup.html`
    const popup = await this.context.newPage()
    await popup.goto(extensionUrl)
    await popup.waitForLoadState('domcontentloaded')
    return popup
  }

  async injectContentScript(url: string): Promise<Page> {
    const page = await this.context.newPage()
    await page.goto(url)

    // Wait for content script injection
    await page.waitForFunction(() => {
      return window.hasOwnProperty('contentScriptInjected')
    }, { timeout: 5000 })

    return page
  }

  async testChromeAPIs(): Promise<ChromeAPITestResults> {
    const backgroundPage = await this.getBackgroundPage()

    const results: ChromeAPITestResults = {
      storage: await this.testStorageAPI(backgroundPage),
      tabs: await this.testTabsAPI(backgroundPage),
      runtime: await this.testRuntimeAPI(backgroundPage),
      permissions: await this.testPermissionsAPI(backgroundPage),
      webRequest: await this.testWebRequestAPI(backgroundPage)
    }

    return results
  }

  private async testStorageAPI(page: Page): Promise<APITestResult> {
    try {
      // Test chrome.storage.local
      await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const testData = { testKey: 'testValue', timestamp: Date.now() }

          chrome.storage.local.set(testData, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
              return
            }

            chrome.storage.local.get(['testKey'], (result) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
                return
              }

              if (result.testKey === testData.testKey) {
                resolve(true)
              } else {
                reject(new Error('Storage value mismatch'))
              }
            })
          })
        })
      })

      return { api: 'storage', success: true, message: 'Storage API working correctly' }
    } catch (error) {
      return { api: 'storage', success: false, message: error.message }
    }
  }

  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
  }
}

// Test utilities
export class ExtensionTestUtils {
  static async waitForExtensionLoad(page: Page, timeout = 10000): Promise<void> {
    await page.waitForFunction(() => {
      return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    }, { timeout })
  }

  static async mockChromeAPI(page: Page, api: string, methods: Record<string, any>): Promise<void> {
    await page.addInitScript((api, methods) => {
      window.chrome = window.chrome || {}
      window.chrome[api] = methods
    }, api, methods)
  }

  static async captureConsoleLogs(page: Page): Promise<string[]> {
    const logs: string[] = []

    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
    })

    return logs
  }

  static async simulateUserGesture(page: Page, action: () => Promise<void>): Promise<void> {
    // Chrome extensions require user gestures for certain APIs
    await page.click('body') // Simulate user interaction
    await action()
  }
}
```

#### Extension E2E Test Suite
```typescript
// tests/extension/e2e/distillation-flow.test.ts
describe('AI Distillation Flow', () => {
  let extensionTester: ChromeExtensionTester
  let context: ExtensionTestContext

  beforeAll(async () => {
    extensionTester = new ChromeExtensionTester()
    context = await extensionTester.setup({
      manifestVersion: 3,
      permissions: ['activeTab', 'storage', 'scripting'],
      extensionPath: './dist/extension',
      headless: false,
      devtools: true
    })
  })

  afterAll(async () => {
    await extensionTester.cleanup()
  })

  test('should extract ChatGPT conversation and distill prompt', async () => {
    // Navigate to ChatGPT
    const page = await extensionTester.injectContentScript('https://chat.openai.com')

    // Simulate a conversation
    await page.fill('[data-testid="prompt-textarea"]', 'How do I implement a binary search algorithm?')
    await page.click('[data-testid="send-button"]')

    // Wait for response
    await page.waitForSelector('[data-message-author-role="assistant"]', { timeout: 30000 })

    // Trigger extraction
    await page.click('[data-testid="distill-trigger"]')

    // Verify extraction popup appears
    const popup = await extensionTester.openPopup()
    await expect(popup.locator('[data-testid="conversation-preview"]')).toBeVisible()

    // Configure distillation
    await popup.selectOption('[data-testid="distill-mode"]', 'comprehensive')
    await popup.fill('[data-testid="custom-instructions"]', 'Focus on code implementation patterns')

    // Start distillation
    await popup.click('[data-testid="start-distillation"]')

    // Wait for completion
    await popup.waitForSelector('[data-testid="distillation-result"]', { timeout: 60000 })

    // Verify result
    const result = await popup.textContent('[data-testid="distilled-prompt"]')
    expect(result).toContain('binary search')
    expect(result).toContain('implementation')

    // Test export functionality
    await popup.click('[data-testid="export-markdown"]')

    // Verify download
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/distilled-prompt-.*\.md/)
  })

  test('should handle multiple AI platforms', async () => {
    const platforms = [
      'https://chat.openai.com',
      'https://claude.ai',
      'https://gemini.google.com'
    ]

    for (const platform of platforms) {
      const page = await extensionTester.injectContentScript(platform)

      // Wait for platform-specific content script
      await ExtensionTestUtils.waitForExtensionLoad(page)

      // Verify extraction button appears
      await expect(page.locator('[data-testid="distill-trigger"]')).toBeVisible({ timeout: 10000 })

      // Test basic extraction capability
      await page.click('[data-testid="distill-trigger"]')
      const popup = await extensionTester.openPopup()

      await expect(popup.locator('[data-testid="platform-detected"]')).toContainText(
        platform.includes('openai') ? 'ChatGPT' :
        platform.includes('claude') ? 'Claude' : 'Gemini'
      )

      await popup.close()
    }
  })

  test('should maintain privacy and security', async () => {
    const page = await extensionTester.injectContentScript('https://chat.openai.com')

    // Test that sensitive data is not captured
    await page.fill('[data-testid="prompt-textarea"]', 'My password is secret123 and my SSN is 123-45-6789')
    await page.click('[data-testid="send-button"]')

    // Trigger extraction
    await page.click('[data-testid="distill-trigger"]')

    const popup = await extensionTester.openPopup()
    await popup.selectOption('[data-testid="privacy-mode"]', 'strict')
    await popup.click('[data-testid="start-distillation"]')

    await popup.waitForSelector('[data-testid="distillation-result"]')

    const result = await popup.textContent('[data-testid="distilled-prompt"]')

    // Verify sensitive data is redacted
    expect(result).not.toContain('secret123')
    expect(result).not.toContain('123-45-6789')
    expect(result).toContain('[REDACTED]')
  })

  test('should handle network failures gracefully', async () => {
    // Simulate offline scenario
    const page = await extensionTester.injectContentScript('https://chat.openai.com')

    // Block network requests
    await page.route('**/*', route => route.abort())

    await page.click('[data-testid="distill-trigger"]')
    const popup = await extensionTester.openPopup()

    await popup.click('[data-testid="start-distillation"]')

    // Verify error handling
    await expect(popup.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(popup.locator('[data-testid="error-message"]')).toContainText('network')

    // Verify retry functionality
    await popup.click('[data-testid="retry-button"]')
    await expect(popup.locator('[data-testid="loading-indicator"]')).toBeVisible()
  })

  test('should persist data across browser sessions', async () => {
    const page = await extensionTester.injectContentScript('https://chat.openai.com')

    // Create and save a distillation
    await page.click('[data-testid="distill-trigger"]')
    const popup = await extensionTester.openPopup()

    await popup.fill('[data-testid="prompt-title"]', 'Test Prompt Session')
    await popup.click('[data-testid="save-draft"]')

    // Verify storage
    const backgroundPage = await extensionTester.getBackgroundPage()
    const storedData = await backgroundPage.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get(['savedPrompts'], resolve)
      })
    })

    expect(storedData.savedPrompts).toBeDefined()
    expect(storedData.savedPrompts).toContainEqual(
      expect.objectContaining({ title: 'Test Prompt Session' })
    )

    // Simulate browser restart by creating new context
    await popup.close()
    await extensionTester.cleanup()

    // Reinitialize
    context = await extensionTester.setup({
      manifestVersion: 3,
      permissions: ['activeTab', 'storage', 'scripting'],
      extensionPath: './dist/extension',
      headless: false,
      devtools: true
    })

    // Verify data persistence
    const newPopup = await extensionTester.openPopup()
    await newPopup.click('[data-testid="saved-prompts-tab"]')

    await expect(newPopup.locator('[data-testid="saved-prompt-item"]')).toContainText('Test Prompt Session')
  })
})
```

### Web Application Testing Patterns

#### React Component Testing
```typescript
// tests/web/components/PromptEditor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { vi } from 'vitest'
import { PromptEditor } from '../../../src/components/PromptEditor'

describe('PromptEditor Component', () => {
  const defaultProps = {
    initialPrompt: '',
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDistill: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render prompt editor with all controls', () => {
    render(<PromptEditor {...defaultProps} />)

    expect(screen.getByRole('textbox', { name: /prompt content/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /distill/i })).toBeInTheDocument()
  })

  it('should handle user input and save functionality', async () => {
    const user = userEvent.setup()
    render(<PromptEditor {...defaultProps} />)

    const editor = screen.getByRole('textbox', { name: /prompt content/i })
    const saveButton = screen.getByRole('button', { name: /save/i })

    await user.type(editor, 'Test prompt content')
    await user.click(saveButton)

    expect(defaultProps.onSave).toHaveBeenCalledWith('Test prompt content')
  })

  it('should validate prompt content before saving', async () => {
    const user = userEvent.setup()
    render(<PromptEditor {...defaultProps} />)

    const saveButton = screen.getByRole('button', { name: /save/i })

    await user.click(saveButton)

    expect(screen.getByText(/prompt content is required/i)).toBeInTheDocument()
    expect(defaultProps.onSave).not.toHaveBeenCalled()
  })

  it('should show loading state during distillation', () => {
    render(<PromptEditor {...defaultProps} isLoading={true} />)

    expect(screen.getByRole('button', { name: /distilling/i })).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<PromptEditor {...defaultProps} />)

    const editor = screen.getByRole('textbox', { name: /prompt content/i })
    await user.type(editor, 'Test content')

    // Test Ctrl+S for save
    await user.keyboard('{Control>}s{/Control}')
    expect(defaultProps.onSave).toHaveBeenCalledWith('Test content')

    // Test Ctrl+D for distill
    await user.keyboard('{Control>}d{/Control}')
    expect(defaultProps.onDistill).toHaveBeenCalled()

    // Test Escape for cancel
    await user.keyboard('{Escape}')
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('should support markdown formatting', async () => {
    const user = userEvent.setup()
    render(<PromptEditor {...defaultProps} />)

    const editor = screen.getByRole('textbox', { name: /prompt content/i })

    await user.type(editor, '# Heading\n\n**Bold text**\n\n```javascript\nconsole.log("code")\n```')

    // Verify markdown preview renders correctly
    const previewButton = screen.getByRole('button', { name: /preview/i })
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading')
      expect(screen.getByText('Bold text')).toHaveStyle('font-weight: bold')
      expect(screen.getByText('console.log("code")')).toBeInTheDocument()
    })
  })

  it('should handle large prompt content efficiently', async () => {
    const user = userEvent.setup()
    const largeContent = 'a'.repeat(10000) // 10k characters

    render(<PromptEditor {...defaultProps} initialPrompt={largeContent} />)

    const editor = screen.getByRole('textbox', { name: /prompt content/i })

    // Verify content loads without freezing
    expect(editor).toHaveValue(largeContent)

    // Test that typing is still responsive
    await user.type(editor, ' additional text')
    expect(editor).toHaveValue(largeContent + ' additional text')

    // Verify character count is displayed
    expect(screen.getByText(/10,016 characters/i)).toBeInTheDocument()
  })

  it('should auto-save drafts periodically', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const mockAutoSave = vi.fn()
    render(<PromptEditor {...defaultProps} onAutoSave={mockAutoSave} />)

    const editor = screen.getByRole('textbox', { name: /prompt content/i })
    await user.type(editor, 'Draft content')

    // Advance timer to trigger auto-save
    vi.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(mockAutoSave).toHaveBeenCalledWith('Draft content')
    })

    vi.useRealTimers()
  })
})
```

#### API Integration Testing
```typescript
// tests/web/api/conversations.test.ts
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { conversationsApi } from '../../../src/api/conversations'

const server = setupServer(
  http.get('/api/conversations', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          title: 'Test Conversation',
          messages: [
            { role: 'user', content: 'Hello', timestamp: Date.now() },
            { role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
          ],
          platform: 'chatgpt',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    })
  }),

  http.post('/api/conversations/:id/distill', ({ request, params }) => {
    return HttpResponse.json({
      id: 'distill-1',
      conversationId: params.id,
      distilledPrompt: 'Distilled prompt content',
      qualityScore: 85,
      metadata: {
        compressionRatio: 0.3,
        processingTime: 1200,
        confidenceLevel: 92
      }
    })
  }),

  http.post('/api/conversations', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'new-conversation',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { status: 201 })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Conversations API', () => {
  it('should fetch conversations with pagination', async () => {
    const result = await conversationsApi.getConversations({
      page: 1,
      pageSize: 10,
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    })

    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      id: '1',
      title: 'Test Conversation',
      platform: 'chatgpt'
    })
    expect(result.pagination.totalItems).toBe(1)
  })

  it('should create new conversation', async () => {
    const newConversation = {
      title: 'New Test Conversation',
      messages: [
        { role: 'user', content: 'Test message', timestamp: Date.now() }
      ],
      platform: 'claude'
    }

    const result = await conversationsApi.createConversation(newConversation)

    expect(result.id).toBe('new-conversation')
    expect(result.title).toBe(newConversation.title)
    expect(result.messages).toEqual(newConversation.messages)
  })

  it('should handle distillation with options', async () => {
    const result = await conversationsApi.distillConversation('1', {
      mode: 'comprehensive',
      includeContext: true,
      customInstructions: 'Focus on technical details'
    })

    expect(result.distilledPrompt).toBe('Distilled prompt content')
    expect(result.qualityScore).toBe(85)
    expect(result.metadata.confidenceLevel).toBe(92)
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get('/api/conversations', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    await expect(conversationsApi.getConversations()).rejects.toThrow('Failed to fetch conversations')
  })

  it('should handle network timeouts', async () => {
    server.use(
      http.get('/api/conversations', async () => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 10000))
        return HttpResponse.json({ data: [] })
      })
    )

    await expect(conversationsApi.getConversations()).rejects.toThrow('timeout')
  })

  it('should retry failed requests', async () => {
    let callCount = 0
    server.use(
      http.get('/api/conversations', () => {
        callCount++
        if (callCount < 3) {
          return new HttpResponse(null, { status: 503 })
        }
        return HttpResponse.json({ data: [], pagination: {} })
      })
    )

    const result = await conversationsApi.getConversations()

    expect(callCount).toBe(3) // Should retry twice before succeeding
    expect(result.data).toEqual([])
  })
})
```

### Performance Testing Framework

#### Load Testing for AI Operations
```typescript
// tests/performance/load-testing.ts
interface LoadTestConfig {
  concurrentUsers: number
  duration: number // seconds
  rampUpTime: number // seconds
  endpoint: string
  payload?: any
}

interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errors: Array<{ error: string; count: number }>
}

class AILoadTester {
  private responseTimes: number[] = []
  private errors: Map<string, number> = new Map()
  private activeRequests: number = 0

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`Starting load test: ${config.concurrentUsers} users for ${config.duration}s`)

    const startTime = Date.now()
    const endTime = startTime + (config.duration * 1000)
    const rampUpEnd = startTime + (config.rampUpTime * 1000)

    const promises: Promise<void>[] = []

    // Ramp up users gradually
    for (let i = 0; i < config.concurrentUsers; i++) {
      const userStartDelay = (i / config.concurrentUsers) * (config.rampUpTime * 1000)
      promises.push(this.simulateUser(config, startTime + userStartDelay, endTime))
    }

    await Promise.all(promises)

    return this.calculateResults()
  }

  private async simulateUser(
    config: LoadTestConfig,
    startTime: number,
    endTime: number
  ): Promise<void> {
    // Wait until it's time for this user to start
    const delay = startTime - Date.now()
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    while (Date.now() < endTime) {
      try {
        this.activeRequests++
        const requestStart = performance.now()

        await this.makeRequest(config.endpoint, config.payload)

        const responseTime = performance.now() - requestStart
        this.responseTimes.push(responseTime)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.errors.set(errorMessage, (this.errors.get(errorMessage) || 0) + 1)
      } finally {
        this.activeRequests--
      }

      // Wait before next request (simulate user think time)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
    }
  }

  private async makeRequest(endpoint: string, payload?: any): Promise<any> {
    const response = await fetch(endpoint, {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      },
      body: payload ? JSON.stringify(payload) : undefined
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  private calculateResults(): LoadTestResult {
    const totalRequests = this.responseTimes.length + this.getTotalErrors()
    const successfulRequests = this.responseTimes.length
    const failedRequests = this.getTotalErrors()

    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b)
    const averageResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length
    const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)]

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      requestsPerSecond: Math.round(totalRequests / 60), // Assuming 60 second test
      errors: Array.from(this.errors.entries()).map(([error, count]) => ({ error, count }))
    }
  }

  private getTotalErrors(): number {
    return Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0)
  }
}

// Load test scenarios
describe('AI Service Load Testing', () => {
  let loadTester: AILoadTester

  beforeEach(() => {
    loadTester = new AILoadTester()
  })

  test('should handle normal conversation load', async () => {
    const result = await loadTester.runLoadTest({
      concurrentUsers: 10,
      duration: 60,
      rampUpTime: 10,
      endpoint: '/api/conversations',
    })

    expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.95)
    expect(result.averageResponseTime).toBeLessThan(2000)
    expect(result.p95ResponseTime).toBeLessThan(5000)
  })

  test('should handle distillation load', async () => {
    const result = await loadTester.runLoadTest({
      concurrentUsers: 5,
      duration: 120,
      rampUpTime: 20,
      endpoint: '/api/conversations/test-id/distill',
      payload: {
        mode: 'comprehensive',
        includeContext: true
      }
    })

    // Distillation is more resource-intensive, so expect longer response times
    expect(result.averageResponseTime).toBeLessThan(10000)
    expect(result.p95ResponseTime).toBeLessThan(20000)
    expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.90)
  })

  test('should handle peak traffic gracefully', async () => {
    const result = await loadTester.runLoadTest({
      concurrentUsers: 50,
      duration: 60,
      rampUpTime: 5,
      endpoint: '/api/conversations'
    })

    // Even under high load, should maintain reasonable performance
    expect(result.failedRequests).toBeLessThan(result.totalRequests * 0.10)
    expect(result.p99ResponseTime).toBeLessThan(30000)
  })
})
```

### Accessibility and User Experience Testing

#### A11y Testing Framework
```typescript
// tests/a11y/accessibility.test.ts
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'

expect.extend(toHaveNoViolations)

describe('Accessibility Testing', () => {
  test('PromptEditor should be fully accessible', async () => {
    const { container } = render(<PromptEditor />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('should support keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<PromptEditor />)

    // Test tab navigation
    await user.tab()
    expect(screen.getByRole('textbox')).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /save/i })).toHaveFocus()

    // Test ARIA labels and descriptions
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Prompt content')
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Enter your prompt content here')
  })

  test('should announce status changes to screen readers', async () => {
    const { rerender } = render(<PromptEditor isLoading={false} />)

    // Verify initial state
    expect(screen.getByRole('status')).toHaveTextContent('')

    // Update to loading state
    rerender(<PromptEditor isLoading={true} />)

    expect(screen.getByRole('status')).toHaveTextContent('Distilling prompt, please wait...')
  })
})
```

This comprehensive testing strategy skill provides robust frameworks for testing browser extensions, web applications, API integrations, performance under load, and accessibility compliance - ensuring high-quality, reliable AI-powered applications.