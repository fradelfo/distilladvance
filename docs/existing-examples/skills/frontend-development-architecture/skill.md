# Frontend Development & Architecture Skill

Advanced frontend development and architecture expertise covering modern React, Vue frameworks, state management, component design systems, and comprehensive frontend platform engineering with performance optimization and scalability patterns.

## Skill Overview

Expert frontend knowledge including component architecture, state management patterns, performance optimization, build tooling, testing strategies, and modern frontend platform engineering with React, Vue, and comprehensive development ecosystem integration.

## Core Capabilities

### Modern React Development
- **React 18+ patterns** - Concurrent features, Suspense, useTransition, useDeferredValue, startTransition
- **Component architecture** - Compound components, render props, higher-order components, custom hooks
- **State management** - useState, useReducer, Context API, Redux Toolkit, Zustand, Jotai patterns
- **Performance optimization** - React.memo, useMemo, useCallback, code splitting, lazy loading

### Vue.js Ecosystem
- **Vue 3+ Composition API** - Setup syntax, reactive primitives, lifecycle hooks, dependency injection
- **Vue ecosystem** - Pinia state management, Vue Router, VueUse composables, Nuxt.js framework
- **Template optimization** - Compiler optimizations, v-memo, teleport, fragments, scoped slots
- **TypeScript integration** - Type-safe components, defineComponent, PropType definitions

### State Management Architecture
- **Redux patterns** - Redux Toolkit, RTK Query, normalized state, entity adapters, middleware
- **Modern alternatives** - Zustand, Jotai, Recoil, SWR, React Query, Apollo Client patterns
- **State design** - Domain modeling, async state management, optimistic updates, caching strategies
- **Performance patterns** - Selector optimization, subscription patterns, state normalization

### Component Design Systems
- **Design system architecture** - Atomic design, component libraries, design tokens, theme systems
- **Styling solutions** - Styled-components, Emotion, Tailwind CSS, CSS Modules, Stitches
- **Accessibility patterns** - ARIA implementation, keyboard navigation, screen reader optimization
- **Documentation** - Storybook, Docusaurus, component playground, design guidelines

## Modern Frontend Platform Implementation

### Comprehensive Frontend Architecture Platform
```typescript
// Advanced frontend platform with React, Vue, state management, and build optimization
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useTransition
} from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast, Toaster } from 'react-hot-toast';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';

// Vue.js imports
import {
  createApp,
  defineComponent,
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  provide,
  inject,
  Teleport
} from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, defineStore } from 'pinia';

// Build and development tools
import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

// Types and interfaces
interface FrontendPlatformConfig {
  framework: 'react' | 'vue' | 'hybrid';
  stateManagement: StateManagementConfig;
  routing: RoutingConfig;
  styling: StylingConfig;
  build: BuildConfig;
  testing: TestingConfig;
  performance: PerformanceConfig;
  accessibility: AccessibilityConfig;
  monitoring: MonitoringConfig;
}

interface StateManagementConfig {
  primary: 'redux' | 'zustand' | 'context' | 'pinia' | 'vuex';
  async: 'rtk-query' | 'react-query' | 'apollo' | 'swr';
  persistence: boolean;
  devtools: boolean;
  middleware: string[];
}

interface RoutingConfig {
  type: 'client' | 'server' | 'hybrid';
  lazyLoading: boolean;
  codesplitting: boolean;
  preloading: boolean;
  guards: boolean;
}

interface StylingConfig {
  solution: 'styled-components' | 'emotion' | 'tailwind' | 'css-modules' | 'stitches';
  designSystem: boolean;
  themeProvider: boolean;
  responsiveDesign: boolean;
  darkMode: boolean;
}

interface BuildConfig {
  bundler: 'vite' | 'webpack' | 'rollup' | 'esbuild';
  optimization: OptimizationConfig;
  environment: EnvironmentConfig;
  deployment: DeploymentConfig;
}

interface OptimizationConfig {
  treeshaking: boolean;
  minification: boolean;
  compression: boolean;
  bundleSplitting: boolean;
  imageOptimization: boolean;
}

interface EnvironmentConfig {
  development: DevConfig;
  production: ProdConfig;
  testing: TestConfig;
}

interface DevConfig {
  hotReload: boolean;
  sourceMap: boolean;
  errorOverlay: boolean;
  proxy: Record<string, string>;
}

interface ProdConfig {
  optimization: boolean;
  compression: boolean;
  caching: CachingConfig;
  cdn: boolean;
}

interface CachingConfig {
  strategy: 'cache-first' | 'stale-while-revalidate' | 'network-first';
  duration: number;
  versioning: boolean;
}

interface TestConfig {
  coverage: boolean;
  sourceMap: boolean;
  mockApi: boolean;
}

interface TestingConfig {
  unit: UnitTestConfig;
  integration: IntegrationTestConfig;
  e2e: E2ETestConfig;
  visual: VisualTestConfig;
}

interface UnitTestConfig {
  framework: 'jest' | 'vitest' | 'mocha';
  library: 'testing-library' | 'enzyme';
  coverage: number;
  mocking: boolean;
}

interface IntegrationTestConfig {
  api: boolean;
  database: boolean;
  services: string[];
}

interface E2ETestConfig {
  framework: 'cypress' | 'playwright' | 'puppeteer';
  browsers: string[];
  headless: boolean;
}

interface VisualTestConfig {
  enabled: boolean;
  framework: 'chromatic' | 'percy' | 'backstop';
  breakpoints: string[];
}

interface PerformanceConfig {
  monitoring: boolean;
  budgets: BudgetConfig[];
  optimization: PerfOptimizationConfig;
  caching: boolean;
}

interface BudgetConfig {
  metric: 'bundle-size' | 'fcp' | 'lcp' | 'tti';
  limit: number;
  warning: number;
}

interface PerfOptimizationConfig {
  lazyLoading: boolean;
  prefetching: boolean;
  serviceworker: boolean;
  webWorkers: boolean;
}

interface AccessibilityConfig {
  level: 'AA' | 'AAA';
  testing: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  colorContrast: boolean;
}

interface MonitoringConfig {
  errorTracking: ErrorTrackingConfig;
  analytics: AnalyticsConfig;
  performance: PerfMonitoringConfig;
  userExperience: UXMonitoringConfig;
}

interface ErrorTrackingConfig {
  provider: 'sentry' | 'bugsnag' | 'rollbar';
  sourceMap: boolean;
  userContext: boolean;
  releases: boolean;
}

interface AnalyticsConfig {
  provider: 'ga4' | 'mixpanel' | 'amplitude';
  events: EventConfig[];
  userProperties: string[];
}

interface EventConfig {
  name: string;
  properties: string[];
  triggers: string[];
}

interface PerfMonitoringConfig {
  metrics: string[];
  sampling: number;
  alerts: AlertConfig[];
}

interface AlertConfig {
  metric: string;
  threshold: number;
  duration: string;
}

interface UXMonitoringConfig {
  heatmaps: boolean;
  sessionRecording: boolean;
  userFeedback: boolean;
  abTesting: boolean;
}

// React State Management
interface AppState {
  user: UserState;
  ui: UIState;
  data: DataState;
  preferences: PreferencesState;
}

interface UserState {
  profile: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  loading: boolean;
}

interface UIState {
  theme: 'light' | 'dark';
  sidebar: boolean;
  notifications: Notification[];
  modal: ModalState | null;
  loading: Record<string, boolean>;
}

interface DataState {
  entities: {
    users: Record<string, User>;
    posts: Record<string, Post>;
    comments: Record<string, Comment>;
  };
  lists: {
    userIds: string[];
    postIds: string[];
  };
  cache: Record<string, any>;
}

interface PreferencesState {
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  publishedAt: string;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  read: boolean;
}

interface ModalState {
  type: string;
  props: Record<string, any>;
  isOpen: boolean;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
}

// Core Frontend Platform
class FrontendPlatform {
  private config: FrontendPlatformConfig;
  private store: any;
  private queryClient: QueryClient;
  private router: any;
  private theme: any;

  constructor(config: FrontendPlatformConfig) {
    this.config = config;
    this.setupStateManagement();
    this.setupQueryClient();
    this.setupRouter();
    this.setupTheme();
  }

  private setupStateManagement(): void {
    switch (this.config.stateManagement.primary) {
      case 'redux':
        this.store = this.createReduxStore();
        break;
      case 'zustand':
        this.store = this.createZustandStore();
        break;
      case 'pinia':
        this.store = this.createPiniaStore();
        break;
      default:
        throw new Error(`Unsupported state management: ${this.config.stateManagement.primary}`);
    }
  }

  private createReduxStore() {
    // User slice
    const userSlice = createSlice({
      name: 'user',
      initialState: {
        profile: null,
        isAuthenticated: false,
        permissions: [],
        loading: false,
      } as UserState,
      reducers: {
        loginStart: (state) => {
          state.loading = true;
        },
        loginSuccess: (state, action) => {
          state.profile = action.payload.user;
          state.isAuthenticated = true;
          state.permissions = action.payload.permissions;
          state.loading = false;
        },
        loginFailure: (state) => {
          state.loading = false;
        },
        logout: (state) => {
          state.profile = null;
          state.isAuthenticated = false;
          state.permissions = [];
        },
      },
    });

    // UI slice
    const uiSlice = createSlice({
      name: 'ui',
      initialState: {
        theme: 'light',
        sidebar: true,
        notifications: [],
        modal: null,
        loading: {},
      } as UIState,
      reducers: {
        toggleTheme: (state) => {
          state.theme = state.theme === 'light' ? 'dark' : 'light';
        },
        toggleSidebar: (state) => {
          state.sidebar = !state.sidebar;
        },
        addNotification: (state, action) => {
          state.notifications.push(action.payload);
        },
        removeNotification: (state, action) => {
          state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        openModal: (state, action) => {
          state.modal = { ...action.payload, isOpen: true };
        },
        closeModal: (state) => {
          state.modal = null;
        },
        setLoading: (state, action) => {
          state.loading[action.payload.key] = action.payload.loading;
        },
      },
    });

    // Entity adapters for normalized state
    const usersAdapter = createEntityAdapter<User>();
    const postsAdapter = createEntityAdapter<Post>();
    const commentsAdapter = createEntityAdapter<Comment>();

    const usersSlice = createSlice({
      name: 'users',
      initialState: usersAdapter.getInitialState(),
      reducers: {
        addUser: usersAdapter.addOne,
        addUsers: usersAdapter.addMany,
        updateUser: usersAdapter.updateOne,
        removeUser: usersAdapter.removeOne,
      },
    });

    const postsSlice = createSlice({
      name: 'posts',
      initialState: postsAdapter.getInitialState(),
      reducers: {
        addPost: postsAdapter.addOne,
        addPosts: postsAdapter.addMany,
        updatePost: postsAdapter.updateOne,
        removePost: postsAdapter.removeOne,
      },
    });

    // Async thunks
    const fetchUserProfile = createAsyncThunk(
      'user/fetchProfile',
      async (userId: string) => {
        const response = await fetch(`/api/users/${userId}`);
        return await response.json();
      }
    );

    const fetchPosts = createAsyncThunk(
      'posts/fetchPosts',
      async (params: { page: number; limit: number }) => {
        const response = await fetch(`/api/posts?page=${params.page}&limit=${params.limit}`);
        return await response.json();
      }
    );

    return configureStore({
      reducer: {
        user: userSlice.reducer,
        ui: uiSlice.reducer,
        users: usersSlice.reducer,
        posts: postsSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['persist/PERSIST'],
          },
        }),
      devTools: this.config.stateManagement.devtools,
    });
  }

  private createZustandStore() {
    interface StoreState extends AppState {
      actions: {
        setUser: (user: User) => void;
        toggleTheme: () => void;
        addNotification: (notification: Notification) => void;
        removeNotification: (id: string) => void;
        updateUserProfile: (updates: Partial<User>) => void;
      };
    }

    return create<StoreState>()(
      devtools(
        subscribeWithSelector(
          immer((set, get) => ({
            user: {
              profile: null,
              isAuthenticated: false,
              permissions: [],
              loading: false,
            },
            ui: {
              theme: 'light',
              sidebar: true,
              notifications: [],
              modal: null,
              loading: {},
            },
            data: {
              entities: {
                users: {},
                posts: {},
                comments: {},
              },
              lists: {
                userIds: [],
                postIds: [],
              },
              cache: {},
            },
            preferences: {
              language: 'en',
              timezone: 'UTC',
              notifications: {
                email: true,
                push: true,
                inApp: true,
                frequency: 'immediate',
              },
              accessibility: {
                reduceMotion: false,
                highContrast: false,
                fontSize: 'medium',
                screenReader: false,
              },
            },
            actions: {
              setUser: (user) =>
                set((state) => {
                  state.user.profile = user;
                  state.user.isAuthenticated = true;
                }),
              toggleTheme: () =>
                set((state) => {
                  state.ui.theme = state.ui.theme === 'light' ? 'dark' : 'light';
                }),
              addNotification: (notification) =>
                set((state) => {
                  state.ui.notifications.push(notification);
                }),
              removeNotification: (id) =>
                set((state) => {
                  state.ui.notifications = state.ui.notifications.filter(n => n.id !== id);
                }),
              updateUserProfile: (updates) =>
                set((state) => {
                  if (state.user.profile) {
                    Object.assign(state.user.profile, updates);
                  }
                }),
            },
          }))
        ),
        { name: 'app-store' }
      )
    );
  }

  private createPiniaStore() {
    return createPinia();
  }

  private setupQueryClient(): void {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          cacheTime: 10 * 60 * 1000, // 10 minutes
          retry: (failureCount, error: any) => {
            if (error.status === 404) return false;
            return failureCount < 3;
          },
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }

  private setupRouter(): void {
    // React Router setup is handled in component tree
    // Vue Router would be configured here
  }

  private setupTheme(): void {
    this.theme = {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
        },
        fontSize: {
          xs: ['0.75rem', '1rem'],
          sm: ['0.875rem', '1.25rem'],
          base: ['1rem', '1.5rem'],
          lg: ['1.125rem', '1.75rem'],
          xl: ['1.25rem', '1.75rem'],
          '2xl': ['1.5rem', '2rem'],
        },
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      animation: {
        duration: {
          fast: '150ms',
          normal: '250ms',
          slow: '400ms',
        },
        easing: {
          ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        },
      },
    };
  }

  // Component factory methods
  createApp(): React.ComponentType {
    const App: React.FC = () => {
      const [isPending, startTransition] = useTransition();

      // Global error boundary
      const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
        <div role="alert" className="error-boundary">
          <h2>Something went wrong:</h2>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      );

      return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Provider store={this.store}>
            <QueryClientProvider client={this.queryClient}>
              <ThemeProvider theme={this.theme}>
                <GlobalStyles />
                <BrowserRouter>
                  <AppShell />
                </BrowserRouter>
                <Toaster position="top-right" />
              </ThemeProvider>
            </QueryClientProvider>
          </Provider>
        </ErrorBoundary>
      );
    };

    return App;
  }
}

// Global styles
const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-family: ${props => props.theme.typography.fontFamily.sans.join(', ')};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: ${props => props.theme.colors.gray[50]};
    color: ${props => props.theme.colors.gray[900]};
    line-height: 1.5;
  }

  [data-theme="dark"] {
    background-color: ${props => props.theme.colors.gray[900]};
    color: ${props => props.theme.colors.gray[50]};
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  .visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`;

// App Shell Component
const AppShell: React.FC = () => {
  const { theme, sidebar } = useSelector((state: AppState) => state.ui);
  const { isAuthenticated } = useSelector((state: AppState) => state.user);

  return (
    <AppContainer data-theme={theme}>
      {isAuthenticated && <Navigation isOpen={sidebar} />}
      <MainContent hasSidebar={isAuthenticated && sidebar}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </MainContent>
      <NotificationCenter />
    </AppContainer>
  );
};

// Styled components
const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.gray[50]};

  &[data-theme="dark"] {
    background-color: ${props => props.theme.colors.gray[900]};
  }
`;

const MainContent = styled.main<{ hasSidebar: boolean }>`
  flex: 1;
  margin-left: ${props => (props.hasSidebar ? '256px' : '0')};
  transition: margin-left ${props => props.theme.animation.duration.normal} ${props => props.theme.animation.easing.ease};
  overflow-x: hidden;
`;

// Navigation Component
const Navigation: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state: AppState) => state.user);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <NavigationContainer isOpen={isOpen}>
      <NavigationHeader>
        <UserAvatar src={profile?.avatar} alt={profile?.name} />
        <UserInfo>
          <UserName>{profile?.name}</UserName>
          <UserRole>{profile?.role}</UserRole>
        </UserInfo>
      </NavigationHeader>

      <NavigationMenu>
        {navItems.map((item) => (
          <NavigationItem key={item.path} to={item.path}>
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavigationItem>
        ))}
      </NavigationMenu>

      <NavigationFooter>
        <ThemeToggle />
        <LogoutButton onClick={() => dispatch({ type: 'user/logout' })}>
          Logout
        </LogoutButton>
      </NavigationFooter>
    </NavigationContainer>
  );
};

const NavigationContainer = styled.nav<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 256px;
  height: 100vh;
  background-color: ${props => props.theme.colors.gray[800]};
  color: ${props => props.theme.colors.gray[100]};
  transform: translateX(${props => (props.isOpen ? '0' : '-100%')});
  transition: transform ${props => props.theme.animation.duration.normal} ${props => props.theme.animation.easing.ease};
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

// Performance optimized virtual list
const VirtualizedList: React.FC<{ items: any[]; renderItem: (item: any) => React.ReactNode }> = ({
  items,
  renderItem
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '400px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index])}
          </div>
        ))}
      </div>
    </div>
  );
};

// Advanced form with validation
const FormValidationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18').max(120, 'Invalid age'),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

type FormData = z.infer<typeof FormValidationSchema>;

const AdvancedForm: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(FormValidationSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
      preferences: {
        newsletter: false,
        notifications: true,
      },
    },
  });

  const watchedValues = watch();

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  return (
    <FormContainer onSubmit={handleSubmit(onSubmit)}>
      <FormField>
        <Label htmlFor="name">Name</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="name"
              placeholder="Enter your name"
              error={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
          )}
        />
        {errors.name && (
          <ErrorMessage id="name-error" role="alert">
            {errors.name.message}
          </ErrorMessage>
        )}
      </FormField>

      <FormField>
        <Label htmlFor="email">Email</Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="email"
              type="email"
              placeholder="Enter your email"
              error={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          )}
        />
        {errors.email && (
          <ErrorMessage id="email-error" role="alert">
            {errors.email.message}
          </ErrorMessage>
        )}
      </FormField>

      <FormActions>
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Reset
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </FormActions>
    </FormContainer>
  );
};

// Animation components
const AnimatedModal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContent
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled(motion.div)`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

// Performance monitoring hook
const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = React.useState<any>({});

  React.useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        setMetrics(prev => ({
          ...prev,
          [entry.name]: entry.startTime + entry.duration,
        }));
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });

    // Measure component render time
    performance.mark('component-start');

    return () => {
      performance.mark('component-end');
      performance.measure('component-render', 'component-start', 'component-end');
      observer.disconnect();
    };
  }, []);

  return metrics;
};

// Custom hooks for common patterns
const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = React.useCallback((value: T | ((val: T) => T)) => {
    setValue(prevValue => {
      const valueToStore = value instanceof Function ? value(prevValue) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);

  return [value, setStoredValue] as const;
};

const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [ref, setRef] = React.useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isIntersecting] as const;
};

// Vue.js Components (for hybrid approach)
const VueUserProfile = defineComponent({
  name: 'UserProfile',
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const user = ref<User | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchUser = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await fetch(`/api/users/${props.userId}`);
        if (!response.ok) throw new Error('User not found');
        user.value = await response.json();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        loading.value = false;
      }
    };

    watch(() => props.userId, fetchUser, { immediate: true });

    return {
      user,
      loading,
      error,
    };
  },
  template: `
    <div class="user-profile">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="user" class="user-content">
        <img :src="user.avatar" :alt="user.name" class="avatar" />
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
        <span class="role">{{ user.role }}</span>
      </div>
    </div>
  `,
});

// Pinia store for Vue
const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const loading = ref(false);

  const fetchUsers = async () => {
    loading.value = true;
    try {
      const response = await fetch('/api/users');
      users.value = await response.json();
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      const updated = await response.json();
      const index = users.value.findIndex(u => u.id === id);
      if (index !== -1) {
        users.value[index] = updated;
      }
    }
  };

  const getUserById = computed(() => {
    return (id: string) => users.value.find(u => u.id === id);
  });

  return {
    users,
    currentUser,
    loading,
    fetchUsers,
    updateUser,
    getUserById,
  };
});

// Build configuration
const createViteConfig = (config: FrontendPlatformConfig) => {
  return defineConfig({
    plugins: [],
    optimizeDeps: {
      include: ['react', 'react-dom', 'redux', '@reduxjs/toolkit'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@headlessui/react', 'framer-motion'],
            state: ['redux', '@reduxjs/toolkit', 'zustand'],
          },
        },
      },
      minify: config.build.optimization.minification ? 'esbuild' : false,
    },
    server: {
      proxy: config.build.environment.development.proxy,
      hmr: config.build.environment.development.hotReload,
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    },
  });
};

// Testing utilities
const createTestUtils = (config: TestingConfig) => {
  const renderWithProviders = (ui: React.ReactElement, options: any = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={{}}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );

    return {
      ...render(ui, { wrapper: AllTheProviders, ...options }),
      queryClient,
    };
  };

  const createMockServer = () => {
    // Mock API server setup for testing
    return {
      use: (handlers: any[]) => {},
      resetHandlers: () => {},
    };
  };

  return {
    renderWithProviders,
    createMockServer,
  };
};

// Error boundary with reporting
const ErrorBoundaryWithReporting: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handleError = React.useCallback((error: Error, errorInfo: any) => {
    // Report to error tracking service
    console.error('Error boundary caught error:', error, errorInfo);

    // Could integrate with Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo,
      });
    }
  }, []);

  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="error-boundary-fallback">
      <h1>Something went wrong</h1>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

// Styled components library
const Button = styled.button<{ variant?: 'primary' | 'secondary'; loading?: boolean }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: ${props => props.theme.typography.fontSize.base[0]};
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.animation.duration.fast} ${props => props.theme.animation.easing.ease};

  ${props => props.variant === 'primary' && `
    background-color: ${props.theme.colors.primary[500]};
    color: white;

    &:hover:not(:disabled) {
      background-color: ${props.theme.colors.primary[600]};
    }
  `}

  ${props => props.variant === 'secondary' && `
    background-color: ${props.theme.colors.gray[200]};
    color: ${props.theme.colors.gray[700]};

    &:hover:not(:disabled) {
      background-color: ${props.theme.colors.gray[300]};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const Input = styled.input<{ error?: boolean }>`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.error ? props.theme.colors.red[500] : props.theme.colors.gray[300]};
  border-radius: 6px;
  font-family: inherit;
  font-size: ${props => props.theme.typography.fontSize.base[0]};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}20;
  }
`;

// Additional utility components would be defined here...
// LoadingSpinner, ProtectedRoute, ProfilePage, Dashboard, etc.

// Example usage
export async function createFrontendPlatformExample(): Promise<void> {
  const config: FrontendPlatformConfig = {
    framework: 'react',
    stateManagement: {
      primary: 'redux',
      async: 'rtk-query',
      persistence: true,
      devtools: true,
      middleware: ['logger', 'thunk'],
    },
    routing: {
      type: 'client',
      lazyLoading: true,
      codeSpÅlitting: true,
      preloading: true,
      guards: true,
    },
    styling: {
      solution: 'styled-components',
      designSystem: true,
      themeProvider: true,
      responsiveDesign: true,
      darkMode: true,
    },
    build: {
      bundler: 'vite',
      optimization: {
        treeshaking: true,
        minification: true,
        compression: true,
        bundleSplitting: true,
        imageOptimization: true,
      },
      environment: {
        development: {
          hotReload: true,
          sourceMap: true,
          errorOverlay: true,
          proxy: { '/api': 'http://localhost:3000' },
        },
        production: {
          optimization: true,
          compression: true,
          caching: {
            strategy: 'stale-while-revalidate',
            duration: 3600,
            versioning: true,
          },
          cdn: true,
        },
        testing: {
          coverage: true,
          sourceMap: true,
          mockApi: true,
        },
      },
      deployment: {},
    },
    testing: {
      unit: {
        framework: 'vitest',
        library: 'testing-library',
        coverage: 80,
        mocking: true,
      },
      integration: {
        api: true,
        database: true,
        services: ['auth', 'notifications'],
      },
      e2e: {
        framework: 'playwright',
        browsers: ['chromium', 'firefox', 'webkit'],
        headless: true,
      },
      visual: {
        enabled: true,
        framework: 'chromatic',
        breakpoints: ['mobile', 'tablet', 'desktop'],
      },
    },
    performance: {
      monitoring: true,
      budgets: [
        { metric: 'bundle-size', limit: 250000, warning: 200000 },
        { metric: 'fcp', limit: 1500, warning: 1000 },
      ],
      optimization: {
        lazyLoading: true,
        prefetching: true,
        serviceworker: true,
        webWorkers: false,
      },
      caching: true,
    },
    accessibility: {
      level: 'AA',
      testing: true,
      screenReader: true,
      keyboardNavigation: true,
      colorContrast: true,
    },
    monitoring: {
      errorTracking: {
        provider: 'sentry',
        sourceMap: true,
        userContext: true,
        releases: true,
      },
      analytics: {
        provider: 'ga4',
        events: [
          { name: 'page_view', properties: ['path', 'referrer'], triggers: ['route_change'] },
        ],
        userProperties: ['user_type', 'subscription'],
      },
      performance: {
        metrics: ['FCP', 'LCP', 'FID', 'CLS'],
        sampling: 0.1,
        alerts: [
          { metric: 'LCP', threshold: 2500, duration: '5m' },
        ],
      },
      userExperience: {
        heatmaps: true,
        sessionRecording: true,
        userFeedback: true,
        abTesting: false,
      },
    },
  };

  const platform = new FrontendPlatform(config);
  const App = platform.createApp();

  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);

  console.log('Frontend platform with React, state management, and optimization running');
}

export { FrontendPlatform, FrontendPlatformConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Frontend application development is needed
- React or Vue.js implementation is required
- State management architecture is requested
- Component design systems are needed
- Frontend performance optimization is required
- Modern frontend tooling and build processes are requested

This comprehensive frontend development and architecture skill provides expert-level capabilities for building modern, scalable frontend applications with advanced React/Vue patterns, state management, performance optimization, and enterprise-grade development practices.