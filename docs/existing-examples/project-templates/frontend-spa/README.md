# Frontend SPA Template

A comprehensive Claude Code setup template for single-page applications using React, TypeScript, and modern frontend development practices.

## What's Included

### Project Structure
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with modern CSS features
- **State Management**: Zustand for lightweight state management
- **Routing**: React Router v6 for client-side routing
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

### Claude Code Configuration
- Frontend-optimized settings.json
- React specialist agent for component development
- UI/UX specialist agent for design implementation
- Custom commands for component generation and optimization
- Automated testing and quality assurance hooks

### Automation Features
- Component and hook generation
- Automated testing execution
- Code quality checks and formatting
- Bundle size optimization
- Accessibility compliance validation

## Tech Stack

- **Framework**: React 18+, TypeScript 5+
- **Build Tool**: Vite 5+ for fast development
- **Styling**: Tailwind CSS 3+, PostCSS
- **State Management**: Zustand, React Query (TanStack Query)
- **Routing**: React Router v6
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Quick Setup

1. **Copy Template**
   ```bash
   cp -r templates/project-templates/frontend-spa/* your-spa/
   cd your-spa
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm run dev
   # Your app will be available at http://localhost:5173
   ```

4. **Initialize Claude Code**
   ```bash
   claude
   # Claude will automatically use the included configuration
   ```

## Directory Structure

```
your-spa/
├── .claude/                    # Claude Code configuration
│   ├── settings.json          # Frontend-optimized settings
│   ├── agents/               # Specialized agents
│   │   ├── react-specialist.md
│   │   └── ui-specialist.md
│   ├── commands/             # Custom commands
│   │   ├── create-component.md
│   │   ├── create-hook.md
│   │   ├── generate-tests.md
│   │   └── optimize-bundle.md
│   └── hooks/               # Automation hooks
│       └── quality-check.sh
├── src/                      # Source code
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── store/              # State management
│   ├── utils/              # Utility functions
│   ├── styles/             # Global styles
│   └── types/              # TypeScript definitions
├── public/                  # Static assets
├── tests/                   # Test files
├── .github/workflows/       # CI/CD workflows
├── CLAUDE.md               # Project constitution
└── README.md               # Project overview
```

## Available Commands

### Component Development
- `/create-component <name>` - Generate React component with TypeScript and tests
- `/create-hook <name>` - Create custom React hook with TypeScript
- `/create-page <name>` - Generate page component with routing setup
- `/generate-tests <component>` - Create comprehensive test suite

### Code Quality
- `/format-code` - Format all code with Prettier
- `/lint-fix` - Run ESLint with auto-fix
- `/check-types` - Run TypeScript type checking
- `/audit-accessibility` - Check accessibility compliance

### Performance
- `/analyze-bundle` - Analyze bundle size and dependencies
- `/optimize-images` - Optimize image assets
- `/check-performance` - Run performance audits

## Specialized Agents

### React Specialist
- Component architecture and patterns
- React hooks and lifecycle management
- State management with Zustand
- Performance optimization
- TypeScript integration

### UI/UX Specialist
- Design system implementation
- Responsive design patterns
- Accessibility compliance
- Animation and interactions
- User experience optimization

## Features

### Modern Development Experience
- Hot module replacement with Vite
- TypeScript strict mode for type safety
- ESLint and Prettier for code quality
- Pre-commit hooks for quality gates
- Automatic dependency updates

### State Management
- Zustand for simple, powerful state management
- React Query for server state and caching
- Context API for component tree state
- Local storage persistence utilities

### Responsive Design
- Mobile-first design approach
- Tailwind CSS utility-first styling
- CSS Grid and Flexbox layouts
- Modern CSS features (CSS variables, etc.)

### Testing Strategy
- Vitest for fast unit and integration testing
- React Testing Library for component testing
- Playwright for end-to-end testing
- Accessibility testing with jest-axe
- Visual regression testing setup

### Performance Optimization
- Code splitting with React.lazy
- Bundle optimization with Vite
- Image optimization and lazy loading
- Proper memoization strategies
- Performance monitoring setup

## Customization Guide

### 1. Styling Framework
Switch from Tailwind to other solutions:
- **Styled Components**: For CSS-in-JS approach
- **Emotion**: For performant CSS-in-JS
- **Vanilla CSS**: For traditional CSS approach
- **UI Libraries**: Material-UI, Chakra UI, Ant Design

### 2. State Management
Alternative state management solutions:
- **Redux Toolkit**: For complex state requirements
- **Jotai**: For atomic state management
- **Recoil**: For experimental atomic state
- **Context + useReducer**: For simple state needs

### 3. Build Tools
Alternative build configurations:
- **Webpack**: For more control over build process
- **Parcel**: For zero-configuration builds
- **Rollup**: For library builds
- **Custom Vite config**: For specific requirements

### 4. Testing Framework
Alternative testing setups:
- **Jest**: Traditional testing framework
- **Cypress**: Alternative E2E testing
- **Testing Library variants**: For different frameworks
- **Storybook**: For component documentation and testing

## Best Practices

### Component Development
1. Use functional components with hooks
2. Implement proper TypeScript interfaces
3. Follow single responsibility principle
4. Create reusable, composable components
5. Implement proper error boundaries

### State Management
1. Keep state as close to usage as possible
2. Use Zustand stores for global state
3. Implement proper data flow patterns
4. Handle loading and error states
5. Use React Query for server state

### Performance
1. Implement code splitting for routes
2. Use React.memo for expensive components
3. Optimize re-renders with proper dependencies
4. Lazy load images and heavy components
5. Monitor bundle size and performance

### Accessibility
1. Use semantic HTML elements
2. Implement proper ARIA attributes
3. Ensure keyboard navigation works
4. Test with screen readers
5. Maintain proper color contrast

## Environment Configuration

### Development
```bash
# .env.development
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=My SPA
VITE_DEBUG_MODE=true
```

### Production
```bash
# .env.production
VITE_API_URL=https://api.myapp.com
VITE_APP_NAME=My SPA
VITE_DEBUG_MODE=false
```

## Deployment Options

### Static Hosting
- **Vercel**: Automatic deployments from Git
- **Netlify**: Static site hosting with edge functions
- **GitHub Pages**: Free hosting for open source
- **AWS S3 + CloudFront**: Scalable static hosting

### CI/CD Integration
- Automated testing on pull requests
- Automated deployments to staging/production
- Bundle size monitoring
- Performance regression detection

## Troubleshooting

### Common Issues
- **Import errors**: Check file paths and TypeScript config
- **Build errors**: Verify all dependencies are installed
- **Style conflicts**: Check Tailwind configuration
- **Type errors**: Update TypeScript and type definitions

### Performance Issues
- Check bundle analyzer for large dependencies
- Optimize images and assets
- Implement proper code splitting
- Review component re-render patterns

This template provides a modern, efficient foundation for single-page application development with comprehensive Claude Code integration for enhanced productivity.