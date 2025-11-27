# Advanced State Management Patterns Skill

## Skill Overview
Expert patterns for managing complex state across browser extensions and web applications, including cross-context communication, persistent storage, and reactive state management for AI-powered applications.

## Core Capabilities

### Browser Extension State Architecture

#### Cross-Context State Management
```typescript
// state/extension-state-manager.ts
interface ExtensionState {
  conversations: Map<string, ConversationData>
  userPreferences: UserPreferences
  aiSettings: AISettings
  uiState: UIState
  background: BackgroundState
}

interface StateMessage<T = any> {
  type: 'STATE_UPDATE' | 'STATE_QUERY' | 'STATE_SYNC'
  context: 'content' | 'popup' | 'background' | 'options'
  payload: T
  timestamp: number
  requestId?: string
}

class ExtensionStateManager {
  private state: ExtensionState
  private listeners = new Set<StateListener>()
  private storageAdapter: StorageAdapter
  private syncAdapter: CrossContextSyncAdapter

  constructor() {
    this.storageAdapter = new ChromeStorageAdapter()
    this.syncAdapter = new MessageBasedSyncAdapter()
    this.setupMessageHandlers()
  }

  async initialize(): Promise<void> {
    // Load persisted state
    const persistedState = await this.storageAdapter.loadState()
    this.state = this.mergeWithDefaults(persistedState)

    // Setup cross-context synchronization
    await this.syncAdapter.initialize()

    // Setup auto-persistence
    this.setupAutoPersistence()

    // Notify initialization complete
    this.notifyStateChange('INITIALIZED', this.state)
  }

  // State getters with type safety
  getConversations(): ReadonlyMap<string, ConversationData> {
    return new Map(this.state.conversations)
  }

  getUserPreferences(): Readonly<UserPreferences> {
    return { ...this.state.userPreferences }
  }

  getAISettings(): Readonly<AISettings> {
    return { ...this.state.aiSettings }
  }

  // State mutations with validation
  async updateConversation(
    conversationId: string,
    updates: Partial<ConversationData>
  ): Promise<void> {
    const current = this.state.conversations.get(conversationId)
    if (!current) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    const updated = { ...current, ...updates, updatedAt: new Date() }

    // Validate update
    const validation = await this.validateConversationData(updated)
    if (!validation.isValid) {
      throw new Error(`Invalid conversation data: ${validation.errors.join(', ')}`)
    }

    // Apply update
    this.state.conversations.set(conversationId, updated)

    // Persist and sync
    await this.persistState()
    await this.syncState('conversations', { [conversationId]: updated })

    // Notify listeners
    this.notifyStateChange('CONVERSATION_UPDATED', { conversationId, data: updated })
  }

  async createConversation(conversationData: CreateConversationData): Promise<string> {
    const conversationId = generateConversationId()
    const conversation: ConversationData = {
      id: conversationId,
      ...conversationData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    }

    // Validate
    const validation = await this.validateConversationData(conversation)
    if (!validation.isValid) {
      throw new Error(`Invalid conversation data: ${validation.errors.join(', ')}`)
    }

    // Store
    this.state.conversations.set(conversationId, conversation)

    // Persist and sync
    await this.persistState()
    await this.syncState('conversations', { [conversationId]: conversation })

    // Notify
    this.notifyStateChange('CONVERSATION_CREATED', { conversationId, data: conversation })

    return conversationId
  }

  async updateUserPreferences(updates: Partial<UserPreferences>): Promise<void> {
    // Validate preferences
    const validation = await this.validateUserPreferences({ ...this.state.userPreferences, ...updates })
    if (!validation.isValid) {
      throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`)
    }

    this.state.userPreferences = { ...this.state.userPreferences, ...updates }

    await this.persistState()
    await this.syncState('userPreferences', this.state.userPreferences)

    this.notifyStateChange('PREFERENCES_UPDATED', this.state.userPreferences)
  }

  async updateAISettings(updates: Partial<AISettings>): Promise<void> {
    const validation = await this.validateAISettings({ ...this.state.aiSettings, ...updates })
    if (!validation.isValid) {
      throw new Error(`Invalid AI settings: ${validation.errors.join(', ')}`)
    }

    this.state.aiSettings = { ...this.state.aiSettings, ...updates }

    await this.persistState()
    await this.syncState('aiSettings', this.state.aiSettings)

    this.notifyStateChange('AI_SETTINGS_UPDATED', this.state.aiSettings)
  }

  // Event subscription
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Cross-context communication
  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message: StateMessage, sender, sendResponse) => {
      this.handleStateMessage(message, sender)
        .then(response => sendResponse({ success: true, data: response }))
        .catch(error => sendResponse({ success: false, error: error.message }))

      return true // Enable async response
    })
  }

  private async handleStateMessage(
    message: StateMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<any> {
    switch (message.type) {
      case 'STATE_QUERY':
        return this.handleStateQuery(message.payload)

      case 'STATE_UPDATE':
        return this.handleStateUpdate(message.payload, sender)

      case 'STATE_SYNC':
        return this.handleStateSync(message.payload)

      default:
        throw new Error(`Unknown state message type: ${message.type}`)
    }
  }

  private async handleStateQuery(query: StateQuery): Promise<any> {
    switch (query.type) {
      case 'GET_CONVERSATIONS':
        return Array.from(this.state.conversations.values())

      case 'GET_CONVERSATION':
        return this.state.conversations.get(query.conversationId)

      case 'GET_PREFERENCES':
        return this.state.userPreferences

      case 'GET_AI_SETTINGS':
        return this.state.aiSettings

      case 'GET_UI_STATE':
        return this.state.uiState

      default:
        throw new Error(`Unknown query type: ${query.type}`)
    }
  }

  // Persistence layer
  private async persistState(): Promise<void> {
    try {
      await this.storageAdapter.saveState(this.state)
    } catch (error) {
      console.error('Failed to persist state:', error)
      this.notifyStateChange('PERSISTENCE_ERROR', error)
    }
  }

  private setupAutoPersistence(): void {
    // Auto-save every 30 seconds
    setInterval(() => {
      this.persistState()
    }, 30000)

    // Save on beforeunload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistState()
      })
    }
  }

  // Cross-context synchronization
  private async syncState(section: keyof ExtensionState, data: any): Promise<void> {
    const message: StateMessage = {
      type: 'STATE_SYNC',
      context: 'background', // This runs in background context
      payload: { section, data },
      timestamp: Date.now()
    }

    // Broadcast to all contexts
    await this.syncAdapter.broadcastStateChange(message)
  }

  private notifyStateChange(event: string, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener({ event, data, timestamp: Date.now() })
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  // Validation methods
  private async validateConversationData(data: ConversationData): Promise<ValidationResult> {
    const errors: string[] = []

    if (!data.id) errors.push('Conversation ID is required')
    if (!data.title || data.title.trim().length === 0) errors.push('Conversation title is required')
    if (!data.platform) errors.push('Platform is required')
    if (!Array.isArray(data.messages)) errors.push('Messages must be an array')

    // Validate messages
    data.messages.forEach((message, index) => {
      if (!message.role || !['user', 'assistant'].includes(message.role)) {
        errors.push(`Invalid role for message ${index}`)
      }
      if (!message.content || message.content.trim().length === 0) {
        errors.push(`Empty content for message ${index}`)
      }
    })

    // Validate metadata
    if (data.metadata) {
      const metadataValidation = await this.validateMetadata(data.metadata)
      errors.push(...metadataValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async validateUserPreferences(preferences: UserPreferences): Promise<ValidationResult> {
    const errors: string[] = []

    // Validate privacy level
    if (!['strict', 'moderate', 'minimal'].includes(preferences.privacyLevel)) {
      errors.push('Invalid privacy level')
    }

    // Validate distillation settings
    if (preferences.defaultDistillationMode &&
        !['comprehensive', 'essential', 'template'].includes(preferences.defaultDistillationMode)) {
      errors.push('Invalid default distillation mode')
    }

    // Validate UI preferences
    if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
      errors.push('Invalid theme')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async validateAISettings(settings: AISettings): Promise<ValidationResult> {
    const errors: string[] = []

    // Validate model preferences
    if (settings.preferredModels) {
      const validModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet', 'claude-3-haiku']
      const invalidModels = settings.preferredModels.filter(model => !validModels.includes(model))
      if (invalidModels.length > 0) {
        errors.push(`Invalid models: ${invalidModels.join(', ')}`)
      }
    }

    // Validate cost settings
    if (settings.costLimits) {
      if (settings.costLimits.daily < 0 || settings.costLimits.monthly < 0) {
        errors.push('Cost limits must be non-negative')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.persistState()
    await this.syncAdapter.destroy()
    this.listeners.clear()
  }
}

// Storage adapters
class ChromeStorageAdapter implements StorageAdapter {
  async loadState(): Promise<Partial<ExtensionState>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['extensionState'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }

        try {
          const state = result.extensionState ? JSON.parse(result.extensionState) : {}
          // Convert serialized Maps back to Map objects
          if (state.conversations && Array.isArray(state.conversations)) {
            state.conversations = new Map(state.conversations)
          }
          resolve(state)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  async saveState(state: ExtensionState): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Convert Maps to arrays for serialization
        const serializable = {
          ...state,
          conversations: Array.from(state.conversations.entries())
        }

        chrome.storage.local.set({
          extensionState: JSON.stringify(serializable),
          lastSaved: Date.now()
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

// Cross-context sync adapter
class MessageBasedSyncAdapter implements CrossContextSyncAdapter {
  private isInitialized = false

  async initialize(): Promise<void> {
    // Setup message listeners for state synchronization
    chrome.runtime.onMessage.addListener(this.handleSyncMessage.bind(this))
    this.isInitialized = true
  }

  async broadcastStateChange(message: StateMessage): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Sync adapter not initialized')
    }

    // Send to all tabs (content scripts)
    const tabs = await chrome.tabs.query({})
    const promises = tabs.map(tab => {
      if (tab.id) {
        return chrome.tabs.sendMessage(tab.id, message).catch(error => {
          // Tab might be closed or not have content script, ignore
          console.debug(`Failed to send state sync to tab ${tab.id}:`, error)
        })
      }
    })

    await Promise.allSettled(promises)
  }

  private handleSyncMessage(
    message: StateMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean {
    if (message.type === 'STATE_SYNC') {
      // Broadcast to other contexts
      this.broadcastStateChange(message)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))

      return true
    }

    return false
  }

  async destroy(): Promise<void> {
    this.isInitialized = false
  }
}

// Utility functions
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export singleton instance
export const extensionStateManager = new ExtensionStateManager()
```

#### React-style Hooks for Extension State
```typescript
// hooks/useExtensionState.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { extensionStateManager } from '../state/extension-state-manager'

// Main state hook
export function useExtensionState() {
  const [state, setState] = useState<ExtensionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        await extensionStateManager.initialize()

        if (mounted) {
          const currentState = {
            conversations: extensionStateManager.getConversations(),
            userPreferences: extensionStateManager.getUserPreferences(),
            aiSettings: extensionStateManager.getAISettings()
          }
          setState(currentState)
          setLoading(false)
        }
      } catch (error) {
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize state')
          setLoading(false)
        }
      }
    }

    initialize()

    const unsubscribe = extensionStateManager.subscribe(({ event, data }) => {
      if (!mounted) return

      switch (event) {
        case 'CONVERSATION_CREATED':
        case 'CONVERSATION_UPDATED':
          setState(prev => prev ? {
            ...prev,
            conversations: extensionStateManager.getConversations()
          } : null)
          break

        case 'PREFERENCES_UPDATED':
          setState(prev => prev ? {
            ...prev,
            userPreferences: data
          } : null)
          break

        case 'AI_SETTINGS_UPDATED':
          setState(prev => prev ? {
            ...prev,
            aiSettings: data
          } : null)
          break
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  return { state, loading, error }
}

// Conversations hook
export function useConversations() {
  const [conversations, setConversations] = useState<Map<string, ConversationData>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs = extensionStateManager.getConversations()
        setConversations(convs)
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()

    return extensionStateManager.subscribe(({ event, data }) => {
      if (event === 'CONVERSATION_CREATED' || event === 'CONVERSATION_UPDATED') {
        setConversations(extensionStateManager.getConversations())
      }
    })
  }, [])

  const createConversation = useCallback(async (data: CreateConversationData): Promise<string> => {
    return extensionStateManager.createConversation(data)
  }, [])

  const updateConversation = useCallback(async (
    id: string,
    updates: Partial<ConversationData>
  ): Promise<void> => {
    return extensionStateManager.updateConversation(id, updates)
  }, [])

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    // Implementation would call extensionStateManager.deleteConversation
    // Not implemented in the manager above but would follow similar pattern
  }, [])

  return {
    conversations: Array.from(conversations.values()),
    loading,
    createConversation,
    updateConversation,
    deleteConversation
  }
}

// User preferences hook
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = extensionStateManager.getUserPreferences()
        setPreferences(prefs)
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }

    loadPreferences()

    return extensionStateManager.subscribe(({ event, data }) => {
      if (event === 'PREFERENCES_UPDATED') {
        setPreferences(data)
        setUpdating(false)
      }
    })
  }, [])

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setUpdating(true)
    try {
      await extensionStateManager.updateUserPreferences(updates)
    } catch (error) {
      setUpdating(false)
      throw error
    }
  }, [])

  return {
    preferences,
    updating,
    updatePreferences
  }
}

// AI settings hook
export function useAISettings() {
  const [settings, setSettings] = useState<AISettings | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const aiSettings = extensionStateManager.getAISettings()
        setSettings(aiSettings)
      } catch (error) {
        console.error('Failed to load AI settings:', error)
      }
    }

    loadSettings()

    return extensionStateManager.subscribe(({ event, data }) => {
      if (event === 'AI_SETTINGS_UPDATED') {
        setSettings(data)
        setUpdating(false)
      }
    })
  }, [])

  const updateSettings = useCallback(async (updates: Partial<AISettings>) => {
    setUpdating(true)
    try {
      await extensionStateManager.updateAISettings(updates)
    } catch (error) {
      setUpdating(false)
      throw error
    }
  }, [])

  return {
    settings,
    updating,
    updateSettings
  }
}

// Optimistic updates hook
export function useOptimisticConversationUpdates() {
  const optimisticUpdates = useRef(new Map<string, Partial<ConversationData>>())
  const [isUpdating, setIsUpdating] = useState(false)

  const updateWithOptimism = useCallback(async (
    conversationId: string,
    updates: Partial<ConversationData>
  ) => {
    // Apply optimistic update
    optimisticUpdates.current.set(conversationId, updates)
    setIsUpdating(true)

    try {
      // Perform actual update
      await extensionStateManager.updateConversation(conversationId, updates)

      // Clear optimistic update on success
      optimisticUpdates.current.delete(conversationId)
    } catch (error) {
      // Revert optimistic update on failure
      optimisticUpdates.current.delete(conversationId)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const getOptimisticConversation = useCallback((
    conversation: ConversationData
  ): ConversationData => {
    const optimisticUpdate = optimisticUpdates.current.get(conversation.id)
    return optimisticUpdate ? { ...conversation, ...optimisticUpdate } : conversation
  }, [])

  return {
    updateWithOptimism,
    getOptimisticConversation,
    isUpdating
  }
}
```

### Web Application State Architecture

#### Advanced Zustand Store with Persistence
```typescript
// store/app-store.ts
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // User and authentication
  user: User | null
  isAuthenticated: boolean
  authLoading: boolean

  // Conversations
  conversations: ConversationData[]
  selectedConversationId: string | null
  conversationLoading: boolean

  // AI state
  distillationInProgress: boolean
  distillationQueue: DistillationJob[]
  aiSettings: AISettings

  // UI state
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'auto'
  notifications: Notification[]

  // Cache
  promptTemplates: PromptTemplate[]
  recentDistillations: DistillationResult[]
}

interface AppActions {
  // Authentication actions
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void
  logout: () => Promise<void>

  // Conversation actions
  setConversations: (conversations: ConversationData[]) => void
  addConversation: (conversation: ConversationData) => void
  updateConversation: (id: string, updates: Partial<ConversationData>) => void
  selectConversation: (id: string | null) => void
  setConversationLoading: (loading: boolean) => void

  // AI actions
  startDistillation: (job: DistillationJob) => void
  completeDistillation: (jobId: string, result: DistillationResult) => void
  updateAISettings: (updates: Partial<AISettings>) => void

  // UI actions
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void

  // Cache actions
  setPromptTemplates: (templates: PromptTemplate[]) => void
  addRecentDistillation: (result: DistillationResult) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Initial state
          user: null,
          isAuthenticated: false,
          authLoading: false,
          conversations: [],
          selectedConversationId: null,
          conversationLoading: false,
          distillationInProgress: false,
          distillationQueue: [],
          aiSettings: {
            preferredModels: ['gpt-4', 'claude-3-sonnet'],
            costLimits: { daily: 10, monthly: 100 },
            qualityThreshold: 0.8
          },
          sidebarCollapsed: false,
          theme: 'auto',
          notifications: [],
          promptTemplates: [],
          recentDistillations: [],

          // Actions
          setUser: (user) => set((state) => {
            state.user = user
            state.isAuthenticated = user !== null
          }),

          setAuthLoading: (loading) => set((state) => {
            state.authLoading = loading
          }),

          logout: async () => {
            set((state) => {
              state.user = null
              state.isAuthenticated = false
              state.conversations = []
              state.selectedConversationId = null
            })

            // Clear sensitive data from localStorage
            localStorage.removeItem('auth_token')
            localStorage.removeItem('refresh_token')
          },

          setConversations: (conversations) => set((state) => {
            state.conversations = conversations
          }),

          addConversation: (conversation) => set((state) => {
            state.conversations.unshift(conversation)
          }),

          updateConversation: (id, updates) => set((state) => {
            const index = state.conversations.findIndex(c => c.id === id)
            if (index !== -1) {
              state.conversations[index] = { ...state.conversations[index], ...updates }
            }
          }),

          selectConversation: (id) => set((state) => {
            state.selectedConversationId = id
          }),

          setConversationLoading: (loading) => set((state) => {
            state.conversationLoading = loading
          }),

          startDistillation: (job) => set((state) => {
            state.distillationQueue.push(job)
            if (!state.distillationInProgress) {
              state.distillationInProgress = true
            }
          }),

          completeDistillation: (jobId, result) => set((state) => {
            state.distillationQueue = state.distillationQueue.filter(job => job.id !== jobId)
            state.distillationInProgress = state.distillationQueue.length > 0
            state.recentDistillations.unshift(result)

            // Keep only last 50 results
            if (state.recentDistillations.length > 50) {
              state.recentDistillations = state.recentDistillations.slice(0, 50)
            }
          }),

          updateAISettings: (updates) => set((state) => {
            state.aiSettings = { ...state.aiSettings, ...updates }
          }),

          toggleSidebar: () => set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed
          }),

          setTheme: (theme) => set((state) => {
            state.theme = theme
          }),

          addNotification: (notification) => set((state) => {
            state.notifications.push(notification)
          }),

          removeNotification: (id) => set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== id)
          }),

          setPromptTemplates: (templates) => set((state) => {
            state.promptTemplates = templates
          }),

          addRecentDistillation: (result) => set((state) => {
            state.recentDistillations.unshift(result)

            if (state.recentDistillations.length > 50) {
              state.recentDistillations = state.recentDistillations.slice(0, 50)
            }
          })
        })),
        {
          name: 'distill-app-storage',
          partialize: (state) => ({
            // Persist only non-sensitive state
            aiSettings: state.aiSettings,
            sidebarCollapsed: state.sidebarCollapsed,
            theme: state.theme,
            promptTemplates: state.promptTemplates,
            recentDistillations: state.recentDistillations
          })
        }
      ),
      {
        name: 'app-store'
      }
    )
  )
)

// Selectors for performance optimization
export const selectConversations = (state: AppStore) => state.conversations
export const selectSelectedConversation = (state: AppStore) =>
  state.conversations.find(c => c.id === state.selectedConversationId)
export const selectIsAuthenticated = (state: AppStore) => state.isAuthenticated
export const selectDistillationProgress = (state: AppStore) => ({
  inProgress: state.distillationInProgress,
  queueLength: state.distillationQueue.length
})
export const selectNotifications = (state: AppStore) => state.notifications
export const selectTheme = (state: AppStore) => state.theme

// Hook for subscribing to specific slices
export function useAppStoreSlice<T>(selector: (state: AppStore) => T): T {
  return useAppStore(selector)
}

// Hook for authenticated user data
export function useAuthenticatedUser() {
  const user = useAppStore(selectIsAuthenticated)
  const isAuthenticated = useAppStore(selectIsAuthenticated)

  if (!isAuthenticated || !user) {
    throw new Error('User must be authenticated to access this data')
  }

  return user
}
```

#### Real-time State Synchronization
```typescript
// store/realtime-sync.ts
interface RealtimeConfig {
  websocketUrl: string
  reconnectDelay: number
  maxReconnectAttempts: number
}

interface RealtimeEvent {
  type: string
  data: any
  timestamp: number
  userId?: string
}

class RealtimeStateSynchronizer {
  private ws: WebSocket | null = null
  private config: RealtimeConfig
  private reconnectAttempts = 0
  private isConnected = false
  private eventHandlers = new Map<string, Set<(data: any) => void>>()
  private heartbeatInterval: number | null = null

  constructor(config: RealtimeConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(this.config.websocketUrl)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        this.ws!.addEventListener('open', () => {
          clearTimeout(timeout)
          resolve()
        }, { once: true })

        this.ws!.addEventListener('error', (error) => {
          clearTimeout(timeout)
          reject(error)
        }, { once: true })
      })
    } catch (error) {
      console.error('Failed to connect to realtime service:', error)
      throw error
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
  }

  subscribe(eventType: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }

    this.eventHandlers.get(eventType)!.add(handler)

    return () => {
      const handlers = this.eventHandlers.get(eventType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType)
        }
      }
    }
  }

  emit(eventType: string, data: any): void {
    if (!this.isConnected || !this.ws) {
      console.warn('Cannot emit event: WebSocket not connected')
      return
    }

    const event: RealtimeEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(event))
  }

  private handleOpen(): void {
    console.log('WebSocket connected')
    this.isConnected = true
    this.reconnectAttempts = 0

    // Start heartbeat
    this.heartbeatInterval = window.setInterval(() => {
      this.emit('heartbeat', { timestamp: Date.now() })
    }, 30000)

    // Sync current state
    this.syncCurrentState()
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason)
    this.isConnected = false

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Attempt reconnection
    this.attemptReconnect()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
      this.processEvent(realtimeEvent)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error)
  }

  private processEvent(event: RealtimeEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event.data)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
        }
      })
    }
  }

  private syncCurrentState(): void {
    const currentState = useAppStore.getState()

    this.emit('state_sync', {
      conversations: currentState.conversations,
      user: currentState.user,
      timestamp: Date.now()
    })
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`)

    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
        this.attemptReconnect()
      }
    }, delay)
  }
}

// Integration with Zustand store
export function setupRealtimeSync() {
  const synchronizer = new RealtimeStateSynchronizer({
    websocketUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    reconnectDelay: 1000,
    maxReconnectAttempts: 5
  })

  // Subscribe to relevant events
  synchronizer.subscribe('conversation_updated', (data) => {
    useAppStore.getState().updateConversation(data.id, data.updates)
  })

  synchronizer.subscribe('conversation_created', (data) => {
    useAppStore.getState().addConversation(data.conversation)
  })

  synchronizer.subscribe('distillation_complete', (data) => {
    useAppStore.getState().completeDistillation(data.jobId, data.result)
  })

  // Subscribe to store changes to emit events
  useAppStore.subscribe(
    (state) => state.conversations,
    (conversations, previousConversations) => {
      // Detect new conversations and emit
      const newConversations = conversations.filter(conv =>
        !previousConversations.find(prev => prev.id === conv.id)
      )

      newConversations.forEach(conv => {
        synchronizer.emit('conversation_created', { conversation: conv })
      })
    }
  )

  return synchronizer
}
```

This advanced state management patterns skill provides comprehensive solutions for managing complex state across browser extensions and web applications, including cross-context communication, persistent storage, real-time synchronization, and type-safe state management with React hooks integration.