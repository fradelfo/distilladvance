# API Integration Patterns Skill

## Skill Overview
Comprehensive patterns for building robust, type-safe API integrations with error handling, caching, real-time updates, and optimistic UI patterns for AI-powered web applications.

## Core Capabilities

### Type-Safe API Client Architecture

#### Advanced API Client with Interceptors
```typescript
// api/client.ts
interface ApiConfig {
  baseURL: string
  timeout: number
  retries: number
  retryDelay: number
  headers?: Record<string, string>
}

interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  skipAuth?: boolean
  skipErrorHandling?: boolean
  cacheKey?: string
  cacheTTL?: number
}

interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
  meta?: {
    requestId: string
    timestamp: Date
    cached?: boolean
  }
}

interface ApiError {
  message: string
  status: number
  code?: string
  details?: any
  requestId?: string
  timestamp: Date
}

class ApiClient {
  private config: ApiConfig
  private cache = new Map<string, { data: any; expiry: number }>()
  private interceptors = {
    request: [] as Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>,
    response: [] as Array<(response: ApiResponse) => ApiResponse | Promise<ApiResponse>>,
    error: [] as Array<(error: ApiError) => ApiError | Promise<ApiError>>
  }

  constructor(config: ApiConfig) {
    this.config = config
    this.setupDefaultInterceptors()
  }

  private setupDefaultInterceptors(): void {
    // Auth interceptor
    this.interceptors.request.push(async (config) => {
      if (!config.skipAuth) {
        const token = await this.getAuthToken()
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
          }
        }
      }
      return config
    })

    // Request ID interceptor
    this.interceptors.request.push((config) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      config.headers = {
        ...config.headers,
        'X-Request-ID': requestId
      }
      return config
    })

    // Response meta interceptor
    this.interceptors.response.push((response) => {
      response.meta = {
        requestId: response.headers.get('X-Request-ID') || 'unknown',
        timestamp: new Date(),
        cached: false
      }
      return response
    })

    // Error transformation interceptor
    this.interceptors.error.push((error) => {
      // Transform common error responses
      if (error.status === 401) {
        this.handleUnauthorized()
      }
      return error
    })
  }

  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  ): void {
    this.interceptors.request.push(interceptor)
  }

  addResponseInterceptor(
    interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
  ): void {
    this.interceptors.response.push(interceptor)
  }

  addErrorInterceptor(
    interceptor: (error: ApiError) => ApiError | Promise<ApiError>
  ): void {
    this.interceptors.error.push(interceptor)
  }

  private async getAuthToken(): Promise<string | null> {
    // Get token from storage, refresh if needed
    const token = localStorage.getItem('auth_token')
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const isExpired = payload.exp * 1000 < Date.now()

      if (isExpired) {
        return await this.refreshToken()
      }

      return token
    } catch {
      return null
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const response = await fetch(`${this.config.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) throw new Error('Token refresh failed')

      const { accessToken, refreshToken: newRefreshToken } = await response.json()

      localStorage.setItem('auth_token', accessToken)
      localStorage.setItem('refresh_token', newRefreshToken)

      return accessToken
    } catch {
      this.handleUnauthorized()
      return null
    }
  }

  private handleUnauthorized(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    const requestConfig: RequestConfig = {
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...config.headers
      }
    }

    // Check cache first
    if (config.cacheKey) {
      const cached = this.getFromCache(config.cacheKey)
      if (cached) {
        return {
          data: cached,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          meta: {
            requestId: 'cached',
            timestamp: new Date(),
            cached: true
          }
        }
      }
    }

    // Apply request interceptors
    let finalConfig = requestConfig
    for (const interceptor of this.interceptors.request) {
      finalConfig = await interceptor(finalConfig)
    }

    try {
      const response = await this.executeRequest<T>(url, finalConfig)

      // Apply response interceptors
      let finalResponse = response
      for (const interceptor of this.interceptors.response) {
        finalResponse = await interceptor(finalResponse)
      }

      // Cache successful responses
      if (config.cacheKey && config.cacheTTL && response.status >= 200 && response.status < 300) {
        this.setCache(config.cacheKey, response.data, config.cacheTTL)
      }

      return finalResponse

    } catch (error) {
      let apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        timestamp: new Date()
      }

      if (error instanceof Response) {
        apiError.status = error.status
        try {
          const errorData = await error.json()
          apiError.message = errorData.message || error.statusText
          apiError.code = errorData.code
          apiError.details = errorData.details
        } catch {
          apiError.message = error.statusText
        }
      }

      // Apply error interceptors
      for (const interceptor of this.interceptors.error) {
        apiError = await interceptor(apiError)
      }

      throw apiError
    }
  }

  private async executeRequest<T>(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = config.timeout
      ? setTimeout(() => controller.abort(), config.timeout)
      : null

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      if (timeoutId) clearTimeout(timeoutId)

      if (!response.ok) {
        throw response
      }

      const data = await response.json()

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)

      // Retry logic
      const shouldRetry =
        attempt < (config.retries || this.config.retries) &&
        (error.name === 'AbortError' ||
         (error instanceof Response && error.status >= 500))

      if (shouldRetry) {
        const delay = (config.retryDelay || this.config.retryDelay) * attempt
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.executeRequest<T>(url, config, attempt + 1)
      }

      throw error
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
})
```

### Type-Safe API Service Layer

#### Conversations API Service
```typescript
// api/services/conversations.ts
interface CreateConversationRequest {
  title: string
  platform: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  metadata?: Record<string, any>
}

interface UpdateConversationRequest {
  title?: string
  messages?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  metadata?: Record<string, any>
}

interface GetConversationsRequest {
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortDirection?: 'asc' | 'desc'
  search?: string
  platform?: string
  dateFrom?: Date
  dateTo?: Date
}

class ConversationsService {
  private readonly baseEndpoint = '/conversations'

  async getConversations(
    params: GetConversationsRequest = {}
  ): Promise<App.PaginatedResponse<App.Conversation[]>> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.set('page', params.page.toString())
    if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString())
    if (params.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params.sortDirection) queryParams.set('sortDirection', params.sortDirection)
    if (params.search) queryParams.set('search', params.search)
    if (params.platform) queryParams.set('platform', params.platform)
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom.toISOString())
    if (params.dateTo) queryParams.set('dateTo', params.dateTo.toISOString())

    const endpoint = `${this.baseEndpoint}?${queryParams.toString()}`
    const cacheKey = `conversations-${queryParams.toString()}`

    const response = await apiClient.get<App.PaginatedResponse<App.Conversation[]>>(endpoint, {
      cacheKey,
      cacheTTL: 2 * 60 * 1000 // 2 minutes
    })

    return response.data
  }

  async getConversation(
    id: string,
    includeMessages: boolean = true
  ): Promise<App.Conversation> {
    const queryParams = new URLSearchParams()
    if (includeMessages) queryParams.set('includeMessages', 'true')

    const endpoint = `${this.baseEndpoint}/${id}?${queryParams.toString()}`
    const cacheKey = `conversation-${id}-${includeMessages}`

    const response = await apiClient.get<App.Conversation>(endpoint, {
      cacheKey,
      cacheTTL: 5 * 60 * 1000 // 5 minutes
    })

    return response.data
  }

  async createConversation(
    data: CreateConversationRequest
  ): Promise<App.Conversation> {
    const response = await apiClient.post<App.Conversation>(this.baseEndpoint, data)

    // Invalidate conversations list cache
    this.invalidateConversationsCache()

    return response.data
  }

  async updateConversation(
    id: string,
    data: UpdateConversationRequest
  ): Promise<App.Conversation> {
    const response = await apiClient.patch<App.Conversation>(
      `${this.baseEndpoint}/${id}`,
      data
    )

    // Invalidate relevant caches
    this.invalidateConversationCache(id)
    this.invalidateConversationsCache()

    return response.data
  }

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`${this.baseEndpoint}/${id}`)

    // Invalidate relevant caches
    this.invalidateConversationCache(id)
    this.invalidateConversationsCache()
  }

  async distillConversation(
    id: string,
    options: {
      mode: 'comprehensive' | 'essential' | 'template'
      includeContext?: boolean
      customInstructions?: string
    }
  ): Promise<App.DistilledPrompt> {
    const response = await apiClient.post<App.DistilledPrompt>(
      `${this.baseEndpoint}/${id}/distill`,
      options
    )

    return response.data
  }

  async exportConversation(
    id: string,
    format: 'json' | 'markdown' | 'txt'
  ): Promise<Blob> {
    const response = await apiClient.get(
      `${this.baseEndpoint}/${id}/export?format=${format}`,
      {
        skipErrorHandling: true
      }
    )

    // Handle blob response
    const blob = await fetch(`${apiClient.config.baseURL}${this.baseEndpoint}/${id}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`
      }
    }).then(res => res.blob())

    return blob
  }

  private async getAuthToken(): Promise<string> {
    return localStorage.getItem('auth_token') || ''
  }

  private invalidateConversationCache(id: string): void {
    // Implementation would clear specific conversation caches
    console.log(`Invalidating cache for conversation ${id}`)
  }

  private invalidateConversationsCache(): void {
    // Implementation would clear conversations list caches
    console.log('Invalidating conversations list cache')
  }
}

export const conversationsService = new ConversationsService()
```

### Real-Time API Integration

#### WebSocket Manager with Reconnection
```typescript
// api/websocket.ts
interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: number
  id?: string
}

interface WebSocketConfig {
  url: string
  protocols?: string[]
  reconnectDelay: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  auth?: () => Promise<string>
}

type MessageHandler<T = any> = (message: WebSocketMessage<T>) => void
type ConnectionHandler = () => void
type ErrorHandler = (error: Event) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private messageHandlers = new Map<string, Set<MessageHandler>>()
  private connectionHandlers = new Set<ConnectionHandler>()
  private errorHandlers = new Set<ErrorHandler>()
  private disconnectionHandlers = new Set<ConnectionHandler>()

  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isIntentionalDisconnect = false

  constructor(config: WebSocketConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        return
      }

      this.isIntentionalDisconnect = false

      // Get auth token if auth function provided
      let url = this.config.url
      if (this.config.auth) {
        const token = await this.config.auth()
        const separator = url.includes('?') ? '&' : '?'
        url = `${url}${separator}token=${encodeURIComponent(token)}`
      }

      this.ws = new WebSocket(url, this.config.protocols)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      return new Promise<void>((resolve, reject) => {
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
      console.error('WebSocket connection failed:', error)
      throw error
    }
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send<T = any>(message: WebSocketMessage<T>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const messageWithId = {
      ...message,
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(messageWithId))
  }

  subscribe<T = any>(messageType: string, handler: MessageHandler<T>): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set())
    }

    this.messageHandlers.get(messageType)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType)
        }
      }
    }
  }

  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  onDisconnection(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler)
    return () => this.disconnectionHandlers.delete(handler)
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private handleOpen(): void {
    console.log('WebSocket connected')
    this.reconnectAttempts = 0

    // Start heartbeat
    this.startHeartbeat()

    // Notify connection handlers
    this.connectionHandlers.forEach(handler => handler())
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      // Handle heartbeat response
      if (message.type === 'heartbeat') {
        return
      }

      // Dispatch to appropriate handlers
      const handlers = this.messageHandlers.get(message.type)
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message)
          } catch (error) {
            console.error(`Error in message handler for ${message.type}:`, error)
          }
        })
      } else {
        console.warn(`No handlers registered for message type: ${message.type}`)
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason)

    this.ws = null

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Notify disconnection handlers
    this.disconnectionHandlers.forEach(handler => handler())

    // Attempt reconnection if not intentional
    if (!this.isIntentionalDisconnect) {
      this.attemptReconnect()
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event)
    this.errorHandlers.forEach(handler => handler(event))
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`)

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
        this.attemptReconnect()
      }
    }, delay)
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'heartbeat', data: null, timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }
}

// Create WebSocket manager instance
export const wsManager = new WebSocketManager({
  url: process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws',
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  auth: async () => {
    return localStorage.getItem('auth_token') || ''
  }
})

// Real-time conversation updates
export class RealTimeConversationsService {
  private subscriptions = new Set<() => void>()

  async initialize(): Promise<void> {
    await wsManager.connect()
    this.setupSubscriptions()
  }

  destroy(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions.clear()
  }

  private setupSubscriptions(): void {
    // Subscribe to conversation updates
    const unsubscribeConversationUpdate = wsManager.subscribe(
      'conversation:updated',
      this.handleConversationUpdate.bind(this)
    )

    const unsubscribeConversationDeleted = wsManager.subscribe(
      'conversation:deleted',
      this.handleConversationDeleted.bind(this)
    )

    const unsubscribeDistillationComplete = wsManager.subscribe(
      'distillation:complete',
      this.handleDistillationComplete.bind(this)
    )

    this.subscriptions.add(unsubscribeConversationUpdate)
    this.subscriptions.add(unsubscribeConversationDeleted)
    this.subscriptions.add(unsubscribeDistillationComplete)
  }

  private handleConversationUpdate(message: WebSocketMessage<App.Conversation>): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('conversation:updated', {
      detail: message.data
    }))
  }

  private handleConversationDeleted(message: WebSocketMessage<{ id: string }>): void {
    window.dispatchEvent(new CustomEvent('conversation:deleted', {
      detail: message.data
    }))
  }

  private handleDistillationComplete(message: WebSocketMessage<App.DistilledPrompt>): void {
    window.dispatchEvent(new CustomEvent('distillation:complete', {
      detail: message.data
    }))
  }

  subscribeToConversation(conversationId: string): void {
    wsManager.send({
      type: 'conversation:subscribe',
      data: { conversationId },
      timestamp: Date.now()
    })
  }

  unsubscribeFromConversation(conversationId: string): void {
    wsManager.send({
      type: 'conversation:unsubscribe',
      data: { conversationId },
      timestamp: Date.now()
    })
  }
}

export const realTimeService = new RealTimeConversationsService()
```

### Optimistic UI Patterns

#### Optimistic Updates Hook
```typescript
// hooks/useOptimisticUpdates.ts
interface OptimisticUpdate<T> {
  id: string
  type: 'create' | 'update' | 'delete'
  data: T
  originalData?: T
  timestamp: number
  promise: Promise<any>
}

function useOptimisticUpdates<T extends { id: string }>() {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map())

  const addOptimisticUpdate = useCallback(<TResult = any>(
    id: string,
    type: OptimisticUpdate<T>['type'],
    data: T,
    promise: Promise<TResult>,
    originalData?: T
  ) => {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      data,
      originalData,
      timestamp: Date.now(),
      promise
    }

    setPendingUpdates(prev => new Map(prev.set(id, update)))

    // Handle promise resolution/rejection
    promise
      .then(() => {
        // Remove successful update
        setPendingUpdates(prev => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      })
      .catch((error) => {
        console.error('Optimistic update failed:', error)

        // Remove failed update and potentially revert
        setPendingUpdates(prev => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })

        // Dispatch revert event for components to handle
        window.dispatchEvent(new CustomEvent('optimistic:revert', {
          detail: { id, type, originalData, error }
        }))
      })

    return update
  }, [])

  const isUpdatePending = useCallback((id: string): boolean => {
    return pendingUpdates.has(id)
  }, [pendingUpdates])

  const getPendingUpdate = useCallback((id: string): OptimisticUpdate<T> | null => {
    return pendingUpdates.get(id) || null
  }, [pendingUpdates])

  const getAllPendingUpdates = useCallback((): OptimisticUpdate<T>[] => {
    return Array.from(pendingUpdates.values())
  }, [pendingUpdates])

  return {
    addOptimisticUpdate,
    isUpdatePending,
    getPendingUpdate,
    getAllPendingUpdates,
    pendingCount: pendingUpdates.size
  }
}

// Usage example with conversations
export function useConversationsWithOptimisticUpdates() {
  const [conversations, setConversations] = useState<App.Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { addOptimisticUpdate, isUpdatePending } = useOptimisticUpdates<App.Conversation>()

  const createConversation = useCallback(async (data: CreateConversationRequest) => {
    // Create optimistic conversation
    const optimisticConversation: App.Conversation = {
      id: `temp-${Date.now()}`,
      userId: 'current-user',
      title: data.title,
      messages: data.messages,
      platform: data.platform as any,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add optimistically to UI
    setConversations(prev => [optimisticConversation, ...prev])

    // Make API request
    const promise = conversationsService.createConversation(data)
      .then((realConversation) => {
        // Replace optimistic with real data
        setConversations(prev =>
          prev.map(conv =>
            conv.id === optimisticConversation.id
              ? realConversation
              : conv
          )
        )
        return realConversation
      })

    addOptimisticUpdate(
      optimisticConversation.id,
      'create',
      optimisticConversation,
      promise
    )

    return promise
  }, [addOptimisticUpdate])

  const updateConversation = useCallback(async (
    id: string,
    updates: UpdateConversationRequest
  ) => {
    const originalConversation = conversations.find(c => c.id === id)
    if (!originalConversation) throw new Error('Conversation not found')

    // Apply optimistic update
    const optimisticConversation = {
      ...originalConversation,
      ...updates,
      updatedAt: new Date()
    }

    setConversations(prev =>
      prev.map(conv => conv.id === id ? optimisticConversation : conv)
    )

    // Make API request
    const promise = conversationsService.updateConversation(id, updates)
      .then((realConversation) => {
        setConversations(prev =>
          prev.map(conv => conv.id === id ? realConversation : conv)
        )
        return realConversation
      })

    addOptimisticUpdate(
      id,
      'update',
      optimisticConversation,
      promise,
      originalConversation
    )

    return promise
  }, [conversations, addOptimisticUpdate])

  const deleteConversation = useCallback(async (id: string) => {
    const originalConversation = conversations.find(c => c.id === id)
    if (!originalConversation) throw new Error('Conversation not found')

    // Remove optimistically
    setConversations(prev => prev.filter(conv => conv.id !== id))

    // Make API request
    const promise = conversationsService.deleteConversation(id)
      .catch((error) => {
        // Restore on failure
        setConversations(prev => [originalConversation, ...prev])
        throw error
      })

    addOptimisticUpdate(
      id,
      'delete',
      originalConversation,
      promise,
      originalConversation
    )

    return promise
  }, [conversations, addOptimisticUpdate])

  // Handle optimistic update reverts
  useEffect(() => {
    const handleRevert = (event: CustomEvent) => {
      const { id, type, originalData, error } = event.detail

      if (type === 'create') {
        // Remove failed creation
        setConversations(prev => prev.filter(conv => conv.id !== id))
      } else if (type === 'update' && originalData) {
        // Restore original data
        setConversations(prev =>
          prev.map(conv => conv.id === id ? originalData : conv)
        )
      } else if (type === 'delete' && originalData) {
        // Restore deleted item
        setConversations(prev => [originalData, ...prev])
      }

      // Show error to user
      console.error('Operation failed:', error)
    }

    window.addEventListener('optimistic:revert', handleRevert as EventListener)
    return () => window.removeEventListener('optimistic:revert', handleRevert as EventListener)
  }, [])

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    isUpdatePending
  }
}
```

This API integration patterns skill provides comprehensive solutions for building robust, type-safe API integrations with advanced features like caching, retry logic, real-time updates, and optimistic UI patterns essential for modern AI-powered web applications.