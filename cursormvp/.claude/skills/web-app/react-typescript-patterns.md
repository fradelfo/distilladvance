# React TypeScript Development Patterns Skill

## Skill Overview
Expert patterns for building modern React applications with TypeScript, focusing on type safety, performance optimization, and scalable architecture for AI-powered web applications.

## Core Capabilities

### Advanced TypeScript Patterns

#### Strict Type Configuration
```typescript
// types/global.d.ts - Global type definitions
declare global {
  namespace App {
    interface User {
      id: string
      email: string
      displayName: string
      subscription: SubscriptionTier
      preferences: UserPreferences
      createdAt: Date
      updatedAt: Date
    }

    interface Conversation {
      id: string
      userId: string
      title: string
      messages: ConversationMessage[]
      platform: AIChatPlatform
      metadata: ConversationMetadata
      createdAt: Date
      updatedAt: Date
    }

    interface ConversationMessage {
      id: string
      conversationId: string
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
      metadata?: MessageMetadata
    }

    interface DistilledPrompt {
      id: string
      conversationId: string
      userId: string
      originalConversation: string
      distilledPrompt: string
      distillationMode: DistillationMode
      qualityScore: number
      metadata: DistillationMetadata
      createdAt: Date
    }

    // Utility types for API responses
    type ApiResponse<T> = {
      data: T
      meta: {
        timestamp: Date
        requestId: string
        version: string
      }
    }

    type PaginatedResponse<T> = ApiResponse<{
      items: T[]
      pagination: {
        page: number
        pageSize: number
        totalItems: number
        totalPages: number
        hasNextPage: boolean
        hasPreviousPage: boolean
      }
    }>

    // Form types
    type FormFieldState<T> = {
      value: T
      error?: string
      touched: boolean
      dirty: boolean
    }

    type FormState<T extends Record<string, any>> = {
      [K in keyof T]: FormFieldState<T[K]>
    } & {
      isValid: boolean
      isSubmitting: boolean
      submitError?: string
    }
  }
}

// Branded types for type safety
export type UserId = string & { readonly brand: unique symbol }
export type ConversationId = string & { readonly brand: unique symbol }
export type DistillationId = string & { readonly brand: unique symbol }

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type NonNullable<T> = T extends null | undefined ? never : T
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
}

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

export {}
```

#### Advanced Component Patterns

##### Generic Component Pattern
```typescript
// components/generic/DataTable.tsx
interface DataTableColumn<TData> {
  id: string
  header: string
  accessor: keyof TData | ((item: TData) => React.ReactNode)
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<TData extends Record<string, any>> {
  data: TData[]
  columns: DataTableColumn<TData>[]
  loading?: boolean
  error?: string
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    key: keyof TData
    direction: 'asc' | 'desc'
    onSort: (key: keyof TData, direction: 'asc' | 'desc') => void
  }
  filtering?: {
    value: string
    onChange: (value: string) => void
  }
  selection?: {
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
    getItemId: (item: TData) => string
  }
  actions?: {
    label: string
    icon?: React.ReactNode
    onClick: (item: TData) => void
    disabled?: (item: TData) => boolean
  }[]
  emptyState?: React.ReactNode
  className?: string
}

function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  pagination,
  sorting,
  filtering,
  selection,
  actions,
  emptyState,
  className
}: DataTableProps<TData>): React.ReactElement {
  const [localFiltering, setLocalFiltering] = useState('')

  const filteredData = useMemo(() => {
    const filterValue = filtering?.value ?? localFiltering
    if (!filterValue) return data

    return data.filter(item =>
      columns.some(column => {
        const value = typeof column.accessor === 'function'
          ? column.accessor(item)
          : item[column.accessor]

        return String(value)
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      })
    )
  }, [data, columns, filtering?.value, localFiltering])

  const sortedData = useMemo(() => {
    if (!sorting) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sorting.key]
      const bValue = b[sorting.key]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sorting.direction === 'desc' ? -comparison : comparison
    })
  }, [filteredData, sorting])

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (pagination.page - 1) * pagination.pageSize
    return sortedData.slice(startIndex, startIndex + pagination.pageSize)
  }, [sortedData, pagination])

  const handleSort = useCallback((column: DataTableColumn<TData>) => {
    if (!sorting || !column.sortable) return

    const newDirection = sorting.key === column.id && sorting.direction === 'asc' ? 'desc' : 'asc'
    sorting.onSort(column.id as keyof TData, newDirection)
  }, [sorting])

  const handleSelectionChange = useCallback((itemId: string, selected: boolean) => {
    if (!selection) return

    const newSelection = selected
      ? [...selection.selectedIds, itemId]
      : selection.selectedIds.filter(id => id !== itemId)

    selection.onSelectionChange(newSelection)
  }, [selection])

  if (error) {
    return (
      <div className="data-table-error">
        <p>Error loading data: {error}</p>
      </div>
    )
  }

  return (
    <div className={`data-table ${className || ''}`}>
      {filtering && (
        <div className="data-table-filters">
          <input
            type="text"
            placeholder="Filter data..."
            value={filtering.value}
            onChange={(e) => filtering.onChange(e.target.value)}
            className="data-table-filter-input"
          />
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table-table">
          <thead>
            <tr>
              {selection && (
                <th className="data-table-selection-header">
                  <input
                    type="checkbox"
                    checked={selection.selectedIds.length === data.length}
                    onChange={(e) => {
                      const allIds = data.map(selection.getItemId)
                      selection.onSelectionChange(e.target.checked ? allIds : [])
                    }}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`data-table-header ${column.sortable ? 'sortable' : ''}`}
                  style={{ width: column.width, textAlign: column.align }}
                  onClick={() => handleSort(column)}
                >
                  {column.header}
                  {sorting?.key === column.id && (
                    <span className="sort-indicator">
                      {sorting.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
              {actions && <th className="data-table-actions-header">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="data-table-loading">Loading...</div>
                </td>
              </tr>
            )}
            {!loading && paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}>
                  {emptyState || <div className="data-table-empty">No data available</div>}
                </td>
              </tr>
            )}
            {!loading && paginatedData.map((item, index) => {
              const itemId = selection?.getItemId(item) || String(index)
              const isSelected = selection?.selectedIds.includes(itemId) || false

              return (
                <tr key={itemId} className={isSelected ? 'selected' : ''}>
                  {selection && (
                    <td className="data-table-selection-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectionChange(itemId, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const cellValue = typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : item[column.accessor]

                    return (
                      <td
                        key={column.id}
                        className="data-table-cell"
                        style={{ textAlign: column.align }}
                      >
                        {cellValue}
                      </td>
                    )
                  })}
                  {actions && (
                    <td className="data-table-actions-cell">
                      <div className="data-table-actions">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(item)}
                            disabled={action.disabled?.(item)}
                            className="data-table-action-button"
                            title={action.label}
                          >
                            {action.icon}
                            <span className="sr-only">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="data-table-pagination">
          <button
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// Usage example with type safety
const ConversationsTable: React.FC = () => {
  const [conversations, setConversations] = useState<App.Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const columns: DataTableColumn<App.Conversation>[] = [
    {
      id: 'title',
      header: 'Title',
      accessor: 'title',
      sortable: true,
      width: '300px'
    },
    {
      id: 'platform',
      header: 'Platform',
      accessor: 'platform',
      sortable: true,
      width: '120px'
    },
    {
      id: 'messageCount',
      header: 'Messages',
      accessor: (conversation) => conversation.messages.length,
      sortable: true,
      width: '100px',
      align: 'center'
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessor: (conversation) => new Date(conversation.createdAt).toLocaleDateString(),
      sortable: true,
      width: '120px'
    }
  ]

  return (
    <DataTable
      data={conversations}
      columns={columns}
      loading={loading}
      actions={[
        {
          label: 'View',
          icon: <ViewIcon />,
          onClick: (conversation) => {/* navigate to view */}
        },
        {
          label: 'Distill',
          icon: <DistillIcon />,
          onClick: (conversation) => {/* start distillation */}
        }
      ]}
      selection={{
        selectedIds: [],
        onSelectionChange: (ids) => {/* handle selection */},
        getItemId: (conversation) => conversation.id
      }}
    />
  )
}
```

### Custom Hooks Patterns

#### Advanced State Management Hook
```typescript
// hooks/useAsyncState.ts
type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

type AsyncStateActions<T> = {
  setData: (data: T | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  refresh: () => Promise<void>
}

type AsyncStateConfig<T> = {
  initialData?: T | null
  fetchFn?: () => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
  cacheKey?: string
  cacheTtl?: number
}

function useAsyncState<T>(
  config: AsyncStateConfig<T> = {}
): [AsyncState<T>, AsyncStateActions<T>] {
  const {
    initialData = null,
    fetchFn,
    onSuccess,
    onError,
    retryCount = 3,
    retryDelay = 1000,
    cacheKey,
    cacheTtl = 5 * 60 * 1000 // 5 minutes
  } = config

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null
  })

  const retryCountRef = useRef(0)

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      lastUpdated: new Date()
    }))

    if (data && onSuccess) {
      onSuccess(data)
    }

    // Cache data if cache key provided
    if (cacheKey && data) {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(`async-state-${cacheKey}`, JSON.stringify(cacheData))
    }
  }, [onSuccess, cacheKey])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false
    }))

    if (error && onError) {
      onError(new Error(error))
    }
  }, [onError])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      lastUpdated: null
    })
    retryCountRef.current = 0

    // Clear cache
    if (cacheKey) {
      localStorage.removeItem(`async-state-${cacheKey}`)
    }
  }, [initialData, cacheKey])

  const loadFromCache = useCallback((): T | null => {
    if (!cacheKey) return null

    try {
      const cached = localStorage.getItem(`async-state-${cacheKey}`)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const isExpired = Date.now() - timestamp > cacheTtl

      if (isExpired) {
        localStorage.removeItem(`async-state-${cacheKey}`)
        return null
      }

      return data
    } catch {
      return null
    }
  }, [cacheKey, cacheTtl])

  const executeAsyncOperation = useCallback(async (): Promise<void> => {
    if (!fetchFn) return

    try {
      setLoading(true)
      setError(null)

      const result = await fetchFn()
      setData(result)
      retryCountRef.current = 0

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        console.warn(`Retry ${retryCountRef.current}/${retryCount} after ${retryDelay}ms`)

        setTimeout(() => {
          executeAsyncOperation()
        }, retryDelay * retryCountRef.current) // Exponential backoff

      } else {
        setError(errorMessage)
        retryCountRef.current = 0
      }
    }
  }, [fetchFn, retryCount, retryDelay, setData, setError, setLoading])

  const refresh = useCallback(async () => {
    retryCountRef.current = 0
    await executeAsyncOperation()
  }, [executeAsyncOperation])

  // Load from cache on mount
  useEffect(() => {
    const cachedData = loadFromCache()
    if (cachedData) {
      setData(cachedData)
    } else if (fetchFn) {
      executeAsyncOperation()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const actions: AsyncStateActions<T> = {
    setData,
    setLoading,
    setError,
    reset,
    refresh
  }

  return [state, actions]
}

// Usage example
const useConversations = () => {
  return useAsyncState<App.Conversation[]>({
    fetchFn: async () => {
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      return response.json()
    },
    onSuccess: (conversations) => {
      console.log(`Loaded ${conversations.length} conversations`)
    },
    onError: (error) => {
      console.error('Failed to load conversations:', error)
    },
    cacheKey: 'conversations',
    cacheTtl: 2 * 60 * 1000, // 2 minutes
    retryCount: 3,
    retryDelay: 1000
  })
}
```

#### Form Management Hook
```typescript
// hooks/useForm.ts
type ValidationRule<T> = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
  asyncValidator?: (value: T) => Promise<string | null>
}

type FieldConfig<T> = {
  initialValue: T
  validation?: ValidationRule<T>
  transform?: (value: any) => T
}

type FormConfig<TSchema extends Record<string, any>> = {
  [K in keyof TSchema]: FieldConfig<TSchema[K]>
}

function useForm<TSchema extends Record<string, any>>(
  config: FormConfig<TSchema>
) {
  const [formState, setFormState] = useState<App.FormState<TSchema>>(() => {
    const initialState = {} as App.FormState<TSchema>

    for (const [key, fieldConfig] of Object.entries(config)) {
      initialState[key as keyof TSchema] = {
        value: fieldConfig.initialValue,
        error: undefined,
        touched: false,
        dirty: false
      }
    }

    return {
      ...initialState,
      isValid: true,
      isSubmitting: false,
      submitError: undefined
    }
  })

  const validateField = useCallback(async <K extends keyof TSchema>(
    fieldName: K,
    value: TSchema[K]
  ): Promise<string | null> => {
    const fieldConfig = config[fieldName]
    const validation = fieldConfig.validation

    if (!validation) return null

    // Required validation
    if (validation.required) {
      if (value === null || value === undefined || value === '') {
        return 'This field is required'
      }
    }

    // String-specific validations
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        return `Minimum length is ${validation.minLength} characters`
      }

      if (validation.maxLength && value.length > validation.maxLength) {
        return `Maximum length is ${validation.maxLength} characters`
      }

      if (validation.pattern && !validation.pattern.test(value)) {
        return 'Invalid format'
      }
    }

    // Custom validation
    if (validation.custom) {
      const customError = validation.custom(value)
      if (customError) return customError
    }

    // Async validation
    if (validation.asyncValidator) {
      try {
        const asyncError = await validation.asyncValidator(value)
        if (asyncError) return asyncError
      } catch (error) {
        return 'Validation error'
      }
    }

    return null
  }, [config])

  const setFieldValue = useCallback(async <K extends keyof TSchema>(
    fieldName: K,
    value: TSchema[K],
    shouldValidate: boolean = true
  ) => {
    const fieldConfig = config[fieldName]
    const transformedValue = fieldConfig.transform ? fieldConfig.transform(value) : value

    let error: string | undefined

    if (shouldValidate) {
      const validationError = await validateField(fieldName, transformedValue)
      error = validationError || undefined
    }

    setFormState(prev => {
      const newFormState = {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value: transformedValue,
          error,
          dirty: true,
          touched: true
        }
      }

      // Recalculate form validity
      const hasErrors = Object.values(newFormState).some(
        field => typeof field === 'object' && field.error
      )
      newFormState.isValid = !hasErrors

      return newFormState
    })
  }, [config, validateField])

  const setFieldTouched = useCallback(<K extends keyof TSchema>(
    fieldName: K,
    touched: boolean = true
  ) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched
      }
    }))
  }, [])

  const validateForm = useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.keys(config).map(async (fieldName) => {
      const field = formState[fieldName as keyof TSchema]
      if (typeof field === 'object' && 'value' in field) {
        return validateField(fieldName as keyof TSchema, field.value)
      }
      return null
    })

    const validationResults = await Promise.all(validationPromises)
    const hasErrors = validationResults.some(error => error !== null)

    if (hasErrors) {
      // Update form state with validation errors
      setFormState(prev => {
        const newState = { ...prev }

        Object.keys(config).forEach((fieldName, index) => {
          const error = validationResults[index]
          if (typeof newState[fieldName as keyof TSchema] === 'object') {
            newState[fieldName as keyof TSchema] = {
              ...newState[fieldName as keyof TSchema],
              error: error || undefined,
              touched: true
            } as any
          }
        })

        return {
          ...newState,
          isValid: false
        }
      })
    }

    return !hasErrors
  }, [config, formState, validateField])

  const handleSubmit = useCallback(async (
    onSubmit: (values: TSchema) => Promise<void> | void
  ) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      submitError: undefined
    }))

    try {
      const isValid = await validateForm()
      if (!isValid) {
        throw new Error('Please fix validation errors')
      }

      // Extract values from form state
      const values = {} as TSchema
      Object.keys(config).forEach(fieldName => {
        const field = formState[fieldName as keyof TSchema]
        if (typeof field === 'object' && 'value' in field) {
          values[fieldName as keyof TSchema] = field.value
        }
      })

      await onSubmit(values)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed'
      setFormState(prev => ({
        ...prev,
        submitError: errorMessage
      }))
    } finally {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }))
    }
  }, [config, formState, validateForm])

  const reset = useCallback(() => {
    setFormState(() => {
      const resetState = {} as App.FormState<TSchema>

      for (const [key, fieldConfig] of Object.entries(config)) {
        resetState[key as keyof TSchema] = {
          value: fieldConfig.initialValue,
          error: undefined,
          touched: false,
          dirty: false
        }
      }

      return {
        ...resetState,
        isValid: true,
        isSubmitting: false,
        submitError: undefined
      }
    })
  }, [config])

  const getFieldProps = useCallback(<K extends keyof TSchema>(fieldName: K) => {
    const field = formState[fieldName]
    if (typeof field !== 'object' || !('value' in field)) {
      throw new Error(`Invalid field: ${String(fieldName)}`)
    }

    return {
      value: field.value,
      onChange: (value: TSchema[K]) => setFieldValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName, true),
      error: field.error,
      touched: field.touched,
      dirty: field.dirty
    }
  }, [formState, setFieldValue, setFieldTouched])

  return {
    formState,
    setFieldValue,
    setFieldTouched,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps
  }
}

// Usage example
interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const LoginForm: React.FC = () => {
  const form = useForm<LoginFormData>({
    email: {
      initialValue: '',
      validation: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value) => {
          if (value.includes('+')) {
            return 'Plus signs are not allowed in email addresses'
          }
          return null
        }
      }
    },
    password: {
      initialValue: '',
      validation: {
        required: true,
        minLength: 8,
        custom: (value) => {
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
          }
          return null
        }
      }
    },
    rememberMe: {
      initialValue: false
    }
  })

  const emailProps = form.getFieldProps('email')
  const passwordProps = form.getFieldProps('password')
  const rememberMeProps = form.getFieldProps('rememberMe')

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      form.handleSubmit(async (values) => {
        console.log('Login data:', values)
        // Handle login
      })
    }}>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={emailProps.value}
          onChange={(e) => emailProps.onChange(e.target.value)}
          onBlur={emailProps.onBlur}
          className={emailProps.error ? 'error' : ''}
        />
        {emailProps.error && emailProps.touched && (
          <span className="error-message">{emailProps.error}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={passwordProps.value}
          onChange={(e) => passwordProps.onChange(e.target.value)}
          onBlur={passwordProps.onBlur}
          className={passwordProps.error ? 'error' : ''}
        />
        {passwordProps.error && passwordProps.touched && (
          <span className="error-message">{passwordProps.error}</span>
        )}
      </div>

      <div className="form-field">
        <label>
          <input
            type="checkbox"
            checked={rememberMeProps.value}
            onChange={(e) => rememberMeProps.onChange(e.target.checked)}
          />
          Remember me
        </label>
      </div>

      {form.formState.submitError && (
        <div className="submit-error">{form.formState.submitError}</div>
      )}

      <button
        type="submit"
        disabled={!form.formState.isValid || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Performance Optimization Patterns

#### Memoization and Optimization
```typescript
// components/optimized/ConversationList.tsx
interface ConversationListProps {
  conversations: App.Conversation[]
  onSelectConversation: (conversation: App.Conversation) => void
  onDistillConversation: (conversation: App.Conversation) => void
  selectedConversationId?: string
  searchQuery: string
  sortBy: 'createdAt' | 'updatedAt' | 'title'
  sortDirection: 'asc' | 'desc'
}

const ConversationList = React.memo<ConversationListProps>(({
  conversations,
  onSelectConversation,
  onDistillConversation,
  selectedConversationId,
  searchQuery,
  sortBy,
  sortDirection
}) => {
  // Memoize expensive filtering and sorting operations
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = conversations.filter(conversation =>
        conversation.title.toLowerCase().includes(query) ||
        conversation.messages.some(message =>
          message.content.toLowerCase().includes(query)
        )
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        default:
          return 0
      }

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [conversations, searchQuery, sortBy, sortDirection])

  // Memoize callback functions to prevent unnecessary re-renders
  const handleSelectConversation = useCallback((conversation: App.Conversation) => {
    onSelectConversation(conversation)
  }, [onSelectConversation])

  const handleDistillConversation = useCallback((conversation: App.Conversation) => {
    onDistillConversation(conversation)
  }, [onDistillConversation])

  // Virtualization for large lists
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = throttle(() => {
      const { scrollTop, clientHeight } = container
      const itemHeight = 80 // Approximate height of each item
      const start = Math.floor(scrollTop / itemHeight)
      const end = Math.min(start + Math.ceil(clientHeight / itemHeight) + 5, filteredAndSortedConversations.length)

      setVisibleRange({ start, end })
    }, 100)

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [filteredAndSortedConversations.length])

  const visibleConversations = filteredAndSortedConversations.slice(
    visibleRange.start,
    visibleRange.end
  )

  return (
    <div ref={containerRef} className="conversation-list">
      <div
        className="conversation-list-spacer"
        style={{ height: visibleRange.start * 80 }}
      />

      {visibleConversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedConversationId}
          onSelect={handleSelectConversation}
          onDistill={handleDistillConversation}
        />
      ))}

      <div
        className="conversation-list-spacer"
        style={{
          height: (filteredAndSortedConversations.length - visibleRange.end) * 80
        }}
      />
    </div>
  )
})

// Optimized list item component
interface ConversationListItemProps {
  conversation: App.Conversation
  isSelected: boolean
  onSelect: (conversation: App.Conversation) => void
  onDistill: (conversation: App.Conversation) => void
}

const ConversationListItem = React.memo<ConversationListItemProps>(({
  conversation,
  isSelected,
  onSelect,
  onDistill
}) => {
  const handleSelect = useCallback(() => {
    onSelect(conversation)
  }, [conversation, onSelect])

  const handleDistill = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDistill(conversation)
  }, [conversation, onDistill])

  // Memoize expensive calculations
  const messagePreview = useMemo(() => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    return lastMessage ? lastMessage.content.slice(0, 100) + '...' : ''
  }, [conversation.messages])

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })
  }, [conversation.updatedAt])

  return (
    <div
      className={`conversation-item ${isSelected ? 'selected' : ''}`}
      onClick={handleSelect}
    >
      <div className="conversation-header">
        <h3 className="conversation-title">{conversation.title}</h3>
        <span className="conversation-platform">{conversation.platform}</span>
      </div>

      <p className="conversation-preview">{messagePreview}</p>

      <div className="conversation-footer">
        <span className="conversation-time">{timeAgo}</span>
        <span className="conversation-message-count">
          {conversation.messages.length} messages
        </span>
        <button
          className="distill-button"
          onClick={handleDistill}
          title="Distill this conversation"
        >
          🪄 Distill
        </button>
      </div>
    </div>
  )
})

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return (...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}
```

### Error Boundary and Suspense Patterns

#### Production-Ready Error Boundary
```typescript
// components/ErrorBoundary.tsx
interface ErrorInfo {
  componentStack: string
  errorBoundary: string
  errorInfo: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      errorInfo: JSON.stringify(errorInfo, null, 2)
    }

    // Log to monitoring service (e.g., Sentry)
    const eventId = this.logError(error, enhancedErrorInfo)

    this.setState({
      errorInfo: enhancedErrorInfo,
      eventId
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, enhancedErrorInfo)
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo): string {
    // In a real app, this would send to your error monitoring service
    console.group('🚨 Error Boundary Caught Error')
    console.error('Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error Info:', errorInfo)
    console.groupEnd()

    // Return a mock event ID
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚨 Something went wrong</h2>
            <p>An unexpected error occurred. Our team has been notified.</p>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="error-component-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="error-actions">
              <button
                onClick={this.handleReset}
                className="error-retry-button"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="error-reload-button"
              >
                Reload Page
              </button>
            </div>

            {this.state.eventId && (
              <p className="error-id">
                Error ID: <code>{this.state.eventId}</code>
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional error boundary using react-error-boundary library
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="error-fallback">
      <h2>🚨 Oops! Something went wrong</h2>
      <pre className="error-message">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

// Usage with Suspense for data fetching
const App: React.FC = () => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo)
        // Log to error monitoring service
      }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/conversations" element={<ConversationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Router>
      </Suspense>
    </ReactErrorBoundary>
  )
}

export default App
```

This React TypeScript patterns skill provides comprehensive patterns for building type-safe, performant, and maintainable React applications with advanced state management, form handling, error boundaries, and performance optimizations.