# Frontend Frameworks Skill

Modern frontend development expertise with React 18+, Vue 3+, Angular 15+, Svelte 4+, and cutting-edge web technologies.

## Skill Overview

Comprehensive frontend framework knowledge covering modern JavaScript/TypeScript development, component architecture, state management, performance optimization, and advanced patterns using the latest 2024/2025 tools and practices.

## Core Capabilities

### React 18+ Development
- **Modern hooks** - useState, useEffect, useContext, custom hooks
- **Concurrent features** - Suspense, Transitions, Server Components
- **Performance optimization** - React.memo, useMemo, useCallback
- **State management** - Zustand, Redux Toolkit, Context patterns

### Vue 3+ Composition API
- **Reactivity system** - ref, reactive, computed, watch
- **Composition patterns** - composables, provide/inject
- **Performance** - Teleport, Fragment, Tree-shaking
- **State management** - Pinia, Vuex 4, reactive stores

### Angular 15+ Modern Features
- **Standalone components** - Simplified architecture patterns
- **Signals** - New reactivity primitives
- **Nx workspace** - Monorepo development patterns
- **RxJS patterns** - Reactive programming best practices

### Svelte 4+ & SvelteKit
- **Compiler magic** - Build-time optimizations
- **Stores** - Reactive state management
- **Actions & transitions** - UI interactions and animations
- **SvelteKit** - Full-stack application development

## Modern Development Stack

### Build Tools & Bundlers
```javascript
// Vite configuration for modern frontend
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Babel configuration for modern features
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],

  // Modern build optimizations
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@mui/material', '@emotion/react']
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  },

  // Development optimizations
  server: {
    hmr: {
      overlay: false
    },
    host: true,
    port: 3000
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  }
})
```

### Modern React Patterns
```typescript
// Advanced React component with modern patterns
import React, { Suspense, lazy, memo, useCallback, useMemo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Lazy load heavy components
const DataVisualization = lazy(() => import('./DataVisualization'))
const ExportDialog = lazy(() => import('./ExportDialog'))

// Schema validation with Zod
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be 18 or older')
})

type UserFormData = z.infer<typeof userSchema>

interface UserDashboardProps {
  userId: string
  onUserUpdate?: (user: User) => void
}

// Memoized component with proper TypeScript
export const UserDashboard = memo<UserDashboardProps>(({
  userId,
  onUserUpdate
}) => {
  const queryClient = useQueryClient()

  // React Query for server state management
  const {
    data: user,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Optimistic updates with React Query
  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onMutate: async (newUserData) => {
      await queryClient.cancelQueries({ queryKey: ['user', userId] })
      const previousUser = queryClient.getQueryData(['user', userId])

      queryClient.setQueryData(['user', userId], newUserData)

      return { previousUser }
    },
    onError: (err, newUserData, context) => {
      queryClient.setQueryData(['user', userId], context?.previousUser)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
    }
  })

  // React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: useMemo(() => ({
      name: user?.name || '',
      email: user?.email || '',
      age: user?.age || 18
    }), [user])
  })

  // Memoized callbacks to prevent unnecessary re-renders
  const handleFormSubmit = useCallback((data: UserFormData) => {
    updateUserMutation.mutate(data, {
      onSuccess: (updatedUser) => {
        onUserUpdate?.(updatedUser)
        reset(data)
      }
    })
  }, [updateUserMutation, onUserUpdate, reset])

  // Error fallback component
  const ErrorFallback = useCallback(({ error, resetErrorBoundary }: {
    error: Error
    resetErrorBoundary: () => void
  }) => (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  ), [])

  if (isLoading) {
    return <UserDashboardSkeleton />
  }

  if (error) {
    return <div>Error loading user data</div>
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="user-dashboard">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                placeholder="Name"
                className={errors.name ? 'error' : ''}
              />
            )}
          />
          {errors.name && <span>{errors.name.message}</span>}

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="email"
                placeholder="Email"
                className={errors.email ? 'error' : ''}
              />
            )}
          />
          {errors.email && <span>{errors.email.message}</span>}

          <button
            type="submit"
            disabled={!isDirty || updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
          </button>
        </form>

        <Suspense fallback={<div>Loading visualization...</div>}>
          <DataVisualization userId={userId} />
        </Suspense>

        <Suspense fallback={<div>Loading export...</div>}>
          <ExportDialog userData={user} />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
})

UserDashboard.displayName = 'UserDashboard'
```

### Vue 3 Composition API Patterns
```vue
<!-- Advanced Vue 3 component with Composition API -->
<template>
  <div class="user-dashboard">
    <Suspense>
      <template #default>
        <UserForm
          :user="user"
          :loading="isUpdating"
          @submit="handleUserUpdate"
        />
        <UserAnalytics :user-id="props.userId" />
      </template>
      <template #fallback>
        <UserDashboardSkeleton />
      </template>
    </Suspense>

    <Teleport to="#modal-container">
      <UserModal v-if="showModal" @close="showModal = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotifications } from '@/composables/useNotifications'
import type { User } from '@/types'

// Async components for code splitting
const UserAnalytics = defineAsyncComponent(() => import('./UserAnalytics.vue'))
const UserModal = defineAsyncComponent(() => import('./UserModal.vue'))

// Props with TypeScript
interface Props {
  userId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  userUpdated: [user: User]
}>()

// Composables
const router = useRouter()
const route = useRoute()
const queryClient = useQueryClient()
const userStore = useUserStore()
const { showSuccess, showError } = useNotifications()

// Reactive state
const showModal = ref(false)

// Computed properties
const isCurrentUser = computed(() =>
  props.userId === userStore.currentUser?.id
)

// Vue Query integration
const {
  data: user,
  isLoading,
  error,
  refetch
} = useQuery({
  queryKey: ['user', () => props.userId],
  queryFn: () => fetchUser(props.userId),
  staleTime: 5 * 60 * 1000,
  retry: 3
})

const { mutate: updateUser, isPending: isUpdating } = useMutation({
  mutationFn: (userData: Partial<User>) =>
    updateUserAPI(props.userId, userData),
  onSuccess: (updatedUser) => {
    queryClient.setQueryData(['user', props.userId], updatedUser)
    emit('userUpdated', updatedUser)
    showSuccess('User updated successfully')
  },
  onError: (error) => {
    showError('Failed to update user')
    console.error('Update error:', error)
  }
})

// Methods
const handleUserUpdate = (userData: Partial<User>) => {
  updateUser(userData)
}

// Watchers
watch(() => props.userId, (newId) => {
  if (newId) {
    refetch()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Track page view
  analytics.track('user_dashboard_viewed', { userId: props.userId })
})
</script>

<style scoped>
.user-dashboard {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  padding: 2rem;
}

/* Modern CSS features */
.user-form {
  container-type: inline-size;

  @container (min-width: 500px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* CSS Grid with subgrid (when supported) */
@supports (grid-template-rows: subgrid) {
  .user-analytics {
    display: grid;
    grid-template-rows: subgrid;
  }
}
</style>
```

### Angular Standalone Components
```typescript
// Modern Angular standalone component
import { Component, Input, Output, EventEmitter, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatCardModule } from '@angular/material/card'
import { Observable, map, startWith, catchError, of } from 'rxjs'

import { UserService } from '@/services/user.service'
import { NotificationService } from '@/services/notification.service'
import { User } from '@/types/user.interface'

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule
  ],
  template: `
    <mat-card class="user-profile-card">
      <mat-card-header>
        <mat-card-title>User Profile</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
            <mat-error *ngIf="userForm.get('name')?.hasError('required')">
              Name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            <mat-error *ngIf="userForm.get('email')?.hasError('email')">
              Invalid email format
            </mat-error>
          </mat-form-field>

          <div class="form-actions">
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="userForm.invalid || isLoading"
            >
              {{ isLoading ? 'Updating...' : 'Update Profile' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .user-profile-card {
      max-width: 500px;
      margin: 2rem auto;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  `]
})
export class UserProfileComponent {
  @Input() user?: User
  @Output() userUpdated = new EventEmitter<User>()

  // Modern Angular dependency injection
  private fb = inject(FormBuilder)
  private userService = inject(UserService)
  private notificationService = inject(NotificationService)

  isLoading = false

  userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    bio: [''],
    website: ['']
  })

  ngOnInit() {
    if (this.user) {
      this.userForm.patchValue(this.user)
    }
  }

  onSubmit() {
    if (this.userForm.valid && this.user) {
      this.isLoading = true
      const formValue = this.userForm.getRawValue()

      this.userService.updateUser(this.user.id, formValue)
        .pipe(
          map(updatedUser => {
            this.notificationService.showSuccess('Profile updated successfully')
            this.userUpdated.emit(updatedUser)
            return updatedUser
          }),
          catchError(error => {
            this.notificationService.showError('Failed to update profile')
            console.error('Update error:', error)
            return of(null)
          })
        )
        .subscribe({
          complete: () => {
            this.isLoading = false
          }
        })
    }
  }
}

// Modern Angular service with signals
import { Injectable, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient)

  // Angular Signals for reactive state management
  private userState = signal<User[]>([])
  private loadingState = signal(false)

  // Computed signals
  readonly users = this.userState.asReadonly()
  readonly isLoading = this.loadingState.asReadonly()
  readonly userCount = computed(() => this.userState().length)

  getUsers(): Observable<User[]> {
    this.loadingState.set(true)

    return this.http.get<User[]>('/api/users').pipe(
      tap(users => {
        this.userState.set(users)
        this.loadingState.set(false)
      })
    )
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, userData).pipe(
      tap(updatedUser => {
        const currentUsers = this.userState()
        const updatedUsers = currentUsers.map(user =>
          user.id === id ? updatedUser : user
        )
        this.userState.set(updatedUsers)
      })
    )
  }
}
```

### Svelte 4 Modern Patterns
```svelte
<!-- Advanced Svelte component with modern features -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte'
  import { writable, derived, get } from 'svelte/store'
  import { fade, slide } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  import { createQuery } from '@tanstack/svelte-query'

  import type { User } from '$lib/types'
  import { userService } from '$lib/services/userService'
  import { notifications } from '$lib/stores/notifications'

  // Props
  export let userId: string
  export let editable = false

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    userUpdated: User
  }>()

  // Reactive stores
  const formData = writable<Partial<User>>({})
  const isEditing = writable(false)
  const validationErrors = writable<Record<string, string>>({})

  // Derived store for form validation
  const isFormValid = derived(
    [formData, validationErrors],
    ([$formData, $validationErrors]) => {
      return $formData.name &&
             $formData.email &&
             Object.keys($validationErrors).length === 0
    }
  )

  // TanStack Query integration
  $: userQuery = createQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
    staleTime: 5 * 60 * 1000
  })

  // Reactive statements
  $: user = $userQuery.data
  $: loading = $userQuery.isLoading
  $: error = $userQuery.error

  // Update form when user data changes
  $: if (user) {
    formData.set({
      name: user.name,
      email: user.email,
      bio: user.bio
    })
  }

  // Validation function
  function validateForm(data: Partial<User>) {
    const errors: Record<string, string> = {}

    if (!data.name || data.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Invalid email format'
    }

    validationErrors.set(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  async function handleSubmit() {
    const data = get(formData)

    if (!validateForm(data)) {
      return
    }

    try {
      const updatedUser = await userService.updateUser(userId, data)
      dispatch('userUpdated', updatedUser)
      notifications.add({
        type: 'success',
        message: 'User updated successfully'
      })
      isEditing.set(false)
    } catch (err) {
      notifications.add({
        type: 'error',
        message: 'Failed to update user'
      })
    }
  }

  // Reactive input handler
  function handleInput(field: keyof User) {
    return (event: Event) => {
      const target = event.target as HTMLInputElement
      formData.update(data => ({
        ...data,
        [field]: target.value
      }))

      // Re-validate on input
      validateForm(get(formData))
    }
  }

  // Component actions
  function clickOutside(node: HTMLElement) {
    function handleClick(event: MouseEvent) {
      if (!node.contains(event.target as Node)) {
        isEditing.set(false)
      }
    }

    document.addEventListener('click', handleClick, true)

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true)
      }
    }
  }
</script>

{#if loading}
  <div class="loading" transition:fade>
    Loading user data...
  </div>
{:else if error}
  <div class="error" transition:fade>
    Error: {error.message}
  </div>
{:else if user}
  <div class="user-profile" use:clickOutside>
    {#if $isEditing && editable}
      <form
        on:submit|preventDefault={handleSubmit}
        transition:slide={{ duration: 300, easing: quintOut }}
      >
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            type="text"
            value={$formData.name || ''}
            on:input={handleInput('name')}
            class:error={$validationErrors.name}
          />
          {#if $validationErrors.name}
            <span class="error-text" transition:slide>
              {$validationErrors.name}
            </span>
          {/if}
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            value={$formData.email || ''}
            on:input={handleInput('email')}
            class:error={$validationErrors.email}
          />
          {#if $validationErrors.email}
            <span class="error-text" transition:slide>
              {$validationErrors.email}
            </span>
          {/if}
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea
            id="bio"
            value={$formData.bio || ''}
            on:input={handleInput('bio')}
            rows="4"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" disabled={!$isFormValid}>
            Update User
          </button>
          <button type="button" on:click={() => isEditing.set(false)}>
            Cancel
          </button>
        </div>
      </form>
    {:else}
      <div class="user-display" transition:fade>
        <h2>{user.name}</h2>
        <p class="email">{user.email}</p>
        {#if user.bio}
          <p class="bio">{user.bio}</p>
        {/if}

        {#if editable}
          <button on:click={() => isEditing.set(true)}>
            Edit Profile
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .user-profile {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e1e5e9;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #007bff;
  }

  input.error, textarea.error {
    border-color: #dc3545;
  }

  .error-text {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button[type="submit"] {
    background-color: #007bff;
    color: white;
  }

  button[type="submit"]:hover:not(:disabled) {
    background-color: #0056b3;
  }

  button[type="submit"]:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
  }

  .error {
    color: #dc3545;
  }
</style>
```

## Skill Activation Triggers

This skill automatically activates when:
- Frontend framework development (React, Vue, Angular, Svelte) is needed
- Component architecture design is requested
- State management implementation is required
- Frontend performance optimization is needed
- Modern JavaScript/TypeScript patterns are requested
- UI/UX development assistance is required

This comprehensive frontend frameworks skill provides expert-level development capabilities across all major modern frontend technologies with cutting-edge patterns and best practices.