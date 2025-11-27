/**
 * Browser extension testing setup utilities
 * Provides Chrome API mocks, content script testing helpers, and extension environment simulation
 */

import { vi, beforeEach, afterEach } from 'vitest'

// Chrome API mock implementations
const chromeApiMocks = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn().mockImplementation((message, callback) => {
      if (callback) callback({ success: true })
      return Promise.resolve({ success: true })
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    getURL: vi.fn().mockImplementation((path) => `chrome-extension://test-id/${path}`),
    getManifest: vi.fn().mockReturnValue({
      manifest_version: 3,
      name: 'Test Extension',
      version: '1.0.0',
      permissions: ['activeTab', 'storage']
    }),
    connect: vi.fn().mockReturnValue({
      postMessage: vi.fn(),
      disconnect: vi.fn(),
      onMessage: { addListener: vi.fn() },
      onDisconnect: { addListener: vi.fn() }
    }),
    lastError: null
  },

  storage: {
    local: {
      get: vi.fn().mockImplementation((keys) => {
        const mockData: Record<string, any> = {
          userPreferences: {
            theme: 'light',
            aiModel: 'gpt-4',
            privacyLevel: 'standard'
          },
          conversations: [],
          extensionSettings: {
            enabled: true,
            autoDistill: false
          }
        }

        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockData[keys] })
        }

        if (Array.isArray(keys)) {
          const result: Record<string, any> = {}
          keys.forEach(key => {
            result[key] = mockData[key]
          })
          return Promise.resolve(result)
        }

        if (keys && typeof keys === 'object') {
          const result: Record<string, any> = {}
          Object.keys(keys).forEach(key => {
            result[key] = mockData[key] ?? keys[key]
          })
          return Promise.resolve(result)
        }

        return Promise.resolve(mockData)
      }),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getBytesInUse: vi.fn().mockResolvedValue(1024)
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined)
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },

  tabs: {
    query: vi.fn().mockResolvedValue([
      {
        id: 1,
        url: 'https://chat.openai.com',
        title: 'ChatGPT',
        active: true,
        windowId: 1
      }
    ]),
    get: vi.fn().mockResolvedValue({
      id: 1,
      url: 'https://chat.openai.com',
      title: 'ChatGPT'
    }),
    create: vi.fn().mockResolvedValue({
      id: 2,
      url: 'about:blank'
    }),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
    executeScript: vi.fn().mockResolvedValue([{}]),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },

  scripting: {
    executeScript: vi.fn().mockResolvedValue([
      { result: 'script executed successfully' }
    ]),
    insertCSS: vi.fn().mockResolvedValue(undefined),
    removeCSS: vi.fn().mockResolvedValue(undefined),
    registerContentScripts: vi.fn().mockResolvedValue(undefined),
    unregisterContentScripts: vi.fn().mockResolvedValue(undefined)
  },

  action: {
    setBadgeText: vi.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
    setIcon: vi.fn().mockResolvedValue(undefined),
    setPopup: vi.fn().mockResolvedValue(undefined),
    setTitle: vi.fn().mockResolvedValue(undefined),
    getBadgeText: vi.fn().mockResolvedValue(''),
    getBadgeBackgroundColor: vi.fn().mockResolvedValue([0, 0, 0, 255]),
    getPopup: vi.fn().mockResolvedValue('popup.html'),
    getTitle: vi.fn().mockResolvedValue('Extension Title'),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },

  permissions: {
    contains: vi.fn().mockResolvedValue(true),
    request: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    getAll: vi.fn().mockResolvedValue({
      permissions: ['activeTab', 'storage'],
      origins: []
    }),
    onAdded: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },

  contextMenus: {
    create: vi.fn().mockImplementation((properties, callback) => {
      if (callback) callback()
      return 'menu-id'
    }),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    removeAll: vi.fn().mockResolvedValue(undefined),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },

  alarms: {
    create: vi.fn(),
    clear: vi.fn().mockResolvedValue(true),
    clearAll: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
}

// Global Chrome API setup
function setupChromeApis() {
  // @ts-ignore - Global chrome object for testing
  global.chrome = chromeApiMocks

  // Also setup as browser for Firefox compatibility testing
  // @ts-ignore - Global browser object for testing
  global.browser = chromeApiMocks

  // Setup window.chrome for content scripts
  Object.defineProperty(window, 'chrome', {
    value: chromeApiMocks,
    writable: true
  })
}

// Content script testing utilities
export const contentScriptUtils = {
  /**
   * Mock DOM for AI chat platforms
   */
  mockChatPlatformDOM: (platform: 'openai' | 'anthropic' | 'google') => {
    const mockSelectors = {
      openai: {
        chatInput: 'textarea[placeholder*="message"]',
        messageContainer: '[data-testid="conversation-turn"]',
        submitButton: '[data-testid="send-button"]'
      },
      anthropic: {
        chatInput: 'div[contenteditable="true"]',
        messageContainer: '.message',
        submitButton: 'button[type="submit"]'
      },
      google: {
        chatInput: 'textarea',
        messageContainer: '.conversation-container .message',
        submitButton: '.send-button'
      }
    }

    const selectors = mockSelectors[platform]

    // Create mock DOM elements
    const chatInput = document.createElement('textarea')
    chatInput.setAttribute('data-testid', 'prompt-textarea')
    chatInput.placeholder = 'Send a message'
    document.body.appendChild(chatInput)

    const messageContainer = document.createElement('div')
    messageContainer.setAttribute('data-testid', 'conversation-turn')
    messageContainer.className = 'message'
    document.body.appendChild(messageContainer)

    const submitButton = document.createElement('button')
    submitButton.setAttribute('data-testid', 'send-button')
    submitButton.type = 'submit'
    document.body.appendChild(submitButton)

    return {
      chatInput,
      messageContainer,
      submitButton,
      cleanup: () => {
        chatInput.remove()
        messageContainer.remove()
        submitButton.remove()
      }
    }
  },

  /**
   * Simulate content script injection
   */
  simulateContentScriptInjection: async (script: string) => {
    const scriptElement = document.createElement('script')
    scriptElement.textContent = script
    document.head.appendChild(scriptElement)

    // Wait for script to execute
    await new Promise(resolve => setTimeout(resolve, 10))

    return {
      cleanup: () => scriptElement.remove()
    }
  },

  /**
   * Mock message passing between content script and background
   */
  mockMessagePassing: () => {
    const messageHandlers = new Map<string, Function>()

    chromeApiMocks.runtime.sendMessage = vi.fn().mockImplementation((message) => {
      const handler = messageHandlers.get(message.type)
      if (handler) {
        return Promise.resolve(handler(message))
      }
      return Promise.resolve({ success: false, error: 'No handler' })
    })

    return {
      addHandler: (messageType: string, handler: Function) => {
        messageHandlers.set(messageType, handler)
      },
      removeHandler: (messageType: string) => {
        messageHandlers.delete(messageType)
      },
      clearHandlers: () => {
        messageHandlers.clear()
      }
    }
  }
}

// Background script testing utilities
export const backgroundScriptUtils = {
  /**
   * Mock service worker environment
   */
  mockServiceWorkerEnvironment: () => {
    // @ts-ignore - Mock service worker globals
    global.self = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      registration: {
        waiting: null,
        installing: null,
        active: {
          postMessage: vi.fn()
        }
      }
    }

    // Mock importScripts for service worker
    // @ts-ignore
    global.importScripts = vi.fn()
  },

  /**
   * Simulate extension installation/startup
   */
  simulateExtensionInstall: () => {
    const installReason = 'install'
    chromeApiMocks.runtime.onInstalled = {
      addListener: vi.fn().mockImplementation((callback) => {
        callback({ reason: installReason })
      }),
      removeListener: vi.fn()
    }

    return { installReason }
  },

  /**
   * Mock alarm functionality
   */
  mockAlarms: () => {
    const activeAlarms = new Map<string, any>()

    chromeApiMocks.alarms.create = vi.fn().mockImplementation((name, alarmInfo) => {
      activeAlarms.set(name, {
        name,
        scheduledTime: Date.now() + (alarmInfo.delayInMinutes || 0) * 60000,
        periodInMinutes: alarmInfo.periodInMinutes
      })
    })

    chromeApiMocks.alarms.get = vi.fn().mockImplementation((name) => {
      return Promise.resolve(activeAlarms.get(name) || null)
    })

    chromeApiMocks.alarms.getAll = vi.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(activeAlarms.values()))
    })

    return {
      triggerAlarm: (name: string) => {
        const alarm = activeAlarms.get(name)
        if (alarm && chromeApiMocks.alarms.onAlarm.addListener.mock.calls[0]) {
          chromeApiMocks.alarms.onAlarm.addListener.mock.calls[0][0](alarm)
        }
      }
    }
  }
}

// Popup testing utilities
export const popupUtils = {
  /**
   * Mock popup environment
   */
  mockPopupEnvironment: () => {
    // Set popup dimensions
    Object.defineProperty(window, 'innerWidth', { value: 400 })
    Object.defineProperty(window, 'innerHeight', { value: 600 })

    // Mock popup-specific APIs
    window.close = vi.fn()

    return {
      closePopup: () => window.close(),
      resizePopup: (width: number, height: number) => {
        Object.defineProperty(window, 'innerWidth', { value: width })
        Object.defineProperty(window, 'innerHeight', { value: height })
        window.dispatchEvent(new Event('resize'))
      }
    }
  },

  /**
   * Mock React popup component rendering
   */
  mockReactPopup: () => {
    // Mock React's createRoot for popup rendering
    const mockRender = vi.fn()
    vi.mock('react-dom/client', () => ({
      createRoot: vi.fn(() => ({
        render: mockRender,
        unmount: vi.fn()
      }))
    }))

    return { mockRender }
  }
}

// Extension testing lifecycle hooks
beforeEach(() => {
  setupChromeApis()

  // Reset all mocks
  Object.values(chromeApiMocks).forEach(apiSection => {
    if (typeof apiSection === 'object') {
      Object.values(apiSection).forEach(method => {
        if (typeof method === 'function' && method.mockReset) {
          method.mockReset()
        }
      })
    }
  })
})

afterEach(() => {
  // Cleanup globals
  // @ts-ignore
  delete global.chrome
  // @ts-ignore
  delete global.browser
  delete window.chrome

  vi.clearAllMocks()
})

// Export setup function for manual usage
export function setupBrowserExtensionTesting() {
  setupChromeApis()
}

// Performance testing utilities
export const performanceUtils = {
  /**
   * Measure extension script load time
   */
  measureLoadTime: async (scriptPath: string) => {
    const startTime = performance.now()

    try {
      await import(scriptPath)
      const endTime = performance.now()
      return endTime - startTime
    } catch (error) {
      throw new Error(`Failed to load script: ${error}`)
    }
  },

  /**
   * Measure memory usage
   */
  measureMemoryUsage: () => {
    // @ts-ignore - Chrome memory API
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }
}

// Security testing utilities
export const securityUtils = {
  /**
   * Test Content Security Policy compliance
   */
  testCSPCompliance: (scriptContent: string) => {
    // Check for eval usage
    const hasEval = /\beval\s*\(/.test(scriptContent)

    // Check for inline script creation
    const hasInlineScript = /new\s+Function\s*\(/.test(scriptContent)

    // Check for innerHTML usage
    const hasInnerHTML = /\.innerHTML\s*=/.test(scriptContent)

    return {
      compliant: !hasEval && !hasInlineScript && !hasInnerHTML,
      violations: {
        eval: hasEval,
        inlineScript: hasInlineScript,
        innerHTML: hasInnerHTML
      }
    }
  },

  /**
   * Test permission usage
   */
  testPermissionUsage: (manifestPermissions: string[]) => {
    const dangerousPermissions = [
      'tabs', 'history', 'bookmarks', 'browsingData',
      'cookies', 'webRequest', 'webRequestBlocking'
    ]

    const violations = manifestPermissions.filter(
      permission => dangerousPermissions.includes(permission)
    )

    return {
      safe: violations.length === 0,
      violations,
      recommendations: violations.map(
        permission => `Consider if ${permission} permission is necessary`
      )
    }
  }
}

// Export all utilities
export default {
  contentScriptUtils,
  backgroundScriptUtils,
  popupUtils,
  performanceUtils,
  securityUtils,
  setupBrowserExtensionTesting
}