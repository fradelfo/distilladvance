# Frontend Single Page Application

## Project Overview
Modern single-page application built with React, TypeScript, and Vite. Optimized for frontend development with comprehensive tooling and automation.

## Tech Stack
- **Framework**: React 18, TypeScript 5, Vite 5
- **Styling**: Tailwind CSS 3, PostCSS
- **State**: Zustand, React Query (TanStack Query)
- **Routing**: React Router v6
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky

## Project Structure
- `src/components/` - Reusable React components organized by feature
- `src/pages/` - Page components for different routes
- `src/hooks/` - Custom React hooks for shared logic
- `src/store/` - Zustand stores for state management
- `src/utils/` - Utility functions and helpers
- `src/types/` - TypeScript type definitions
- `tests/` - Test files mirroring source structure

## Key Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit and integration tests
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## Development Workflow
1. Create feature branch for new development
2. Develop components with TypeScript and proper typing
3. Write tests for new components and functionality
4. Ensure accessibility compliance (WCAG 2.1 AA)
5. Test responsive design across device sizes
6. Run quality checks before committing
7. Submit pull request with proper testing

## Code Style
- Use functional components with React hooks
- Implement strict TypeScript with proper interfaces
- Follow component composition patterns
- Use Tailwind utility classes for styling
- Implement proper error boundaries and loading states
- Create reusable custom hooks for shared logic

## Component Architecture
- **Pages**: Route-level components handling page layout and data fetching
- **Components**: Reusable UI components with clear interfaces
- **Hooks**: Custom hooks for business logic and state management
- **Utils**: Pure functions for data transformation and validation
- **Types**: Shared TypeScript interfaces and type definitions

## State Management Strategy
- **Zustand Stores**: Global application state and business logic
- **React Query**: Server state, caching, and data synchronization
- **Local State**: Component-level state with useState and useReducer
- **URL State**: Navigation and shareable state through React Router

## Performance Guidelines
- Implement code splitting with React.lazy for routes
- Use React.memo for expensive components that re-render frequently
- Optimize re-renders with proper dependency arrays in hooks
- Lazy load images and heavy components
- Monitor bundle size and optimize imports

## Accessibility Standards
- Use semantic HTML elements (header, nav, main, section, etc.)
- Implement proper ARIA attributes for complex interactions
- Ensure keyboard navigation works for all interactive elements
- Test with screen readers and accessibility tools
- Maintain WCAG 2.1 AA compliance for color contrast and text

## Testing Strategy
- **Unit Tests**: Test individual components and hooks in isolation
- **Integration Tests**: Test component interactions and data flow
- **E2E Tests**: Test complete user workflows across the application
- **Accessibility Tests**: Automated accessibility testing with jest-axe
- **Visual Tests**: Screenshot testing for UI consistency

## Security Considerations
- Validate all user inputs on the frontend
- Sanitize data before rendering to prevent XSS
- Use proper Content Security Policy headers
- Handle authentication tokens securely
- Implement proper error handling without exposing sensitive data

## Do Not
- Use `any` type in TypeScript - always define proper types
- Commit secrets or API keys to the repository
- Skip accessibility testing for new components
- Create overly complex component hierarchies
- Ignore TypeScript errors or warnings
- Modify production environment configuration without approval

## Import References
See @package.json for available scripts and dependencies
See @vite.config.ts for build configuration
See @tailwind.config.js for styling configuration
See @tests/ for testing examples and patterns
See @.github/workflows/ for CI/CD configuration

This SPA emphasizes modern React patterns, TypeScript safety, comprehensive testing, and accessibility compliance for professional frontend development.