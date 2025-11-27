# [Project Name] - Frontend Single Page Application

A modern, responsive single-page application built with cutting-edge frontend technologies, designed for excellent user experience and developer productivity.

## Project Overview

This project delivers a high-performance, interactive web application with modern UI/UX patterns, comprehensive state management, and seamless API integration. Built with accessibility, performance, and maintainability as core principles.

**Primary Goals:**
- Deliver exceptional user experience across all devices
- Maintain fast loading times and smooth interactions
- Ensure accessibility compliance (WCAG 2.1 AA)
- Provide robust error handling and user feedback

## Tech Stack

### Frontend Framework
- **Framework**: React 18+ / Vue 3+ / Angular 16+
- **Language**: TypeScript with strict mode
- **Build Tool**: Vite / Webpack 5 / Parcel
- **Package Manager**: npm / yarn / pnpm

### State Management
- **State**: Redux Toolkit / Vuex / NgRx
- **Async State**: React Query / SWR / Apollo Client
- **Local State**: React Hooks / Vue Composition API
- **Form State**: React Hook Form / VeeValidate / Angular Forms

### Styling & UI
- **CSS Framework**: Tailwind CSS / Styled Components / SCSS
- **Component Library**: Material-UI / Ant Design / Chakra UI
- **Icons**: React Icons / Heroicons / Font Awesome
- **Theme System**: CSS Custom Properties / Styled System

### Development & Build
- **Hot Reload**: Vite HMR / Webpack Dev Server
- **Code Quality**: ESLint + Prettier + Husky
- **Testing**: Vitest / Jest + React Testing Library
- **E2E Testing**: Playwright / Cypress

### Deployment & Performance
- **Hosting**: Vercel / Netlify / AWS CloudFront + S3
- **Bundling**: Code splitting and lazy loading
- **Monitoring**: Sentry + Web Vitals tracking
- **Analytics**: Google Analytics 4 / Mixpanel

## Project Structure

```
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components (Button, Input, etc.)
│   │   ├── forms/       # Form-specific components
│   │   └── layout/      # Layout components (Header, Footer, etc.)
│   ├── pages/           # Page-level components and routing
│   ├── hooks/           # Custom React hooks / Vue composables
│   ├── store/           # State management (Redux/Vuex/NgRx)
│   ├── services/        # API calls and external integrations
│   ├── utils/           # Helper functions and utilities
│   ├── types/           # TypeScript type definitions
│   ├── assets/          # Static assets (images, fonts, etc.)
│   └── styles/          # Global styles and theme configuration
├── public/              # Public assets and index.html
├── tests/
│   ├── unit/           # Unit tests for components and utilities
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── docs/               # Component documentation and style guides
└── config/             # Build and environment configuration
```

## Development Guidelines

### Component Design Principles
- **Atomic Design**: Organize components using atomic design methodology
- **Single Responsibility**: Each component has a clear, single purpose
- **Composition**: Prefer composition over inheritance
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: Optimize re-renders and bundle size

### Code Quality Standards
- **TypeScript**: Strict type checking with comprehensive type coverage
- **Testing**: Component testing with user behavior focus
- **Performance**: Core Web Vitals optimization
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO**: Meta tags, structured data, and social sharing optimization

### State Management Patterns
- **Normalized State**: Keep state flat and normalized
- **Immutability**: Use immutable update patterns
- **Error Boundaries**: Graceful error handling and recovery
- **Loading States**: Comprehensive loading and error state management
- **Optimistic Updates**: Enhance perceived performance

### API Integration
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Caching**: Intelligent data caching and invalidation strategies
- **Offline Support**: Progressive enhancement for offline functionality
- **Real-time**: WebSocket integration for live data updates

## Key Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run end-to-end tests

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

### Deployment
- `npm run build:staging` - Build for staging environment
- `npm run build:prod` - Build for production
- `npm run analyze` - Analyze bundle size
- `npm run deploy` - Deploy to hosting platform

## User Interface Structure

### Core Pages
- **Landing Page** (`/`) - Hero section, features, call-to-action
- **Dashboard** (`/dashboard`) - User dashboard with key metrics
- **Profile** (`/profile`) - User profile management
- **Settings** (`/settings`) - Application configuration
- **Authentication** (`/login`, `/register`) - User authentication flows

### Component Architecture
```typescript
// Example component structure
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

// Component with proper TypeScript and accessibility
const Button: React.FC<ComponentProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  ...props
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

### State Management Structure
```typescript
// Redux Toolkit slice example
interface UserState {
  profile: User | null;
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
    }
  }
});
```

## Performance Optimization

### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Remove unused code from production bundles
- **Dynamic Imports**: Lazy load non-critical components
- **Asset Optimization**: Image optimization and format selection

### Runtime Performance
- **Memoization**: React.memo, useMemo, useCallback optimization
- **Virtual Scrolling**: Handle large lists efficiently
- **Image Loading**: Lazy loading with intersection observer
- **Service Workers**: Caching strategies for offline support

### Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds

## Accessibility Guidelines

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and descriptions
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Logical focus order and visible indicators
- **Alternative Text**: Descriptive alt text for images

### Testing Strategy
- **Automated Testing**: axe-core integration in tests
- **Manual Testing**: Regular accessibility audits
- **Screen Reader Testing**: NVDA, JAWS, VoiceOver validation
- **Keyboard Testing**: Navigation without mouse

## SEO & Meta Information

### Essential Meta Tags
```html
<!-- Primary Meta Tags -->
<meta name="title" content="Your App Title">
<meta name="description" content="App description for search engines">
<meta name="keywords" content="relevant, keywords, for, search">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://yourapp.com/">
<meta property="og:title" content="Your App Title">
<meta property="og:description" content="App description for social sharing">
<meta property="og:image" content="https://yourapp.com/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="Your App Title">
<meta property="twitter:description" content="App description for Twitter">
<meta property="twitter:image" content="https://yourapp.com/twitter-image.jpg">
```

### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Your App Name",
  "description": "Your app description",
  "url": "https://yourapp.com",
  "applicationCategory": "BusinessApplication"
}
```

## Environment Configuration

### Environment Variables
```bash
# Development
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=YourApp
VITE_APP_VERSION=1.0.0

# Authentication
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id

# Analytics
VITE_GA_TRACKING_ID=GA_TRACKING_ID
VITE_SENTRY_DSN=your-sentry-dsn

# Feature Flags
VITE_FEATURE_NEW_UI=true
VITE_FEATURE_BETA_ACCESS=false

# External Services
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_MAPBOX_TOKEN=pk.ey...
```

## Testing Strategy

### Component Testing
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });
});
```

### E2E Testing
```typescript
// Example E2E test with Playwright
import { test, expect } from '@playwright/test';

test('user can complete authentication flow', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

## Deployment & CI/CD

### Build Process
1. **Type Checking**: Verify TypeScript types
2. **Linting**: Code quality and style checks
3. **Testing**: Run unit and integration tests
4. **Building**: Create optimized production bundle
5. **Asset Optimization**: Compress images and assets

### Deployment Targets
- **Development**: Auto-deploy on feature branch push
- **Staging**: Deploy on merge to develop branch
- **Production**: Manual deployment from main branch
- **Preview**: Deploy on pull request for review

## Security Considerations

### Client-Side Security
- **XSS Prevention**: Sanitize user inputs and use CSP headers
- **Content Security Policy**: Strict CSP to prevent injection attacks
- **Secure Storage**: Use httpOnly cookies for sensitive data
- **Environment Variables**: Never expose secrets in client code

### Authentication Security
- **Token Storage**: Secure token storage (httpOnly cookies preferred)
- **Session Management**: Proper session timeout and renewal
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Secure Communication**: HTTPS for all API communication

## Development Workflow

### Feature Development
1. Create feature branch from main
2. Implement component with comprehensive tests
3. Update Storybook documentation if needed
4. Submit pull request with screenshots/demos
5. Code review focusing on accessibility and performance
6. Automated testing and visual regression checks

### Code Review Checklist
- [ ] Component follows design system patterns
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Performance considerations addressed
- [ ] Comprehensive test coverage
- [ ] TypeScript types are accurate and helpful
- [ ] Error handling implemented appropriately

## Claude Code Integration Notes

When working with this frontend application, focus on:
- **User Experience**: Always consider the end-user experience in suggestions
- **Accessibility**: Ensure all interactive elements are keyboard accessible
- **Performance**: Consider the impact on bundle size and runtime performance
- **Type Safety**: Maintain strict TypeScript coverage for reliability
- **Visual Consistency**: Follow established design patterns and components

For component development, prioritize composition and reusability while maintaining clear separation between presentation and business logic.