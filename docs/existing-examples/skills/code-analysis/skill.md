# Code Analysis Skill

Advanced static code analysis and quality assessment capabilities using modern tooling and industry best practices.

## Skill Overview

This skill provides comprehensive code analysis capabilities including quality assessment, security vulnerability detection, performance bottleneck identification, and technical debt analysis across multiple programming languages and frameworks.

## Core Capabilities

### Static Code Analysis
- **Quality metrics calculation** - Cyclomatic complexity, maintainability index, code coverage
- **Code smell detection** - Long methods, large classes, duplicate code, dead code
- **Architecture analysis** - Dependency cycles, coupling metrics, cohesion analysis
- **Pattern recognition** - Anti-patterns, design patterns, architectural patterns

### Security Analysis
- **Vulnerability scanning** - OWASP Top 10, CWE database, CVE matching
- **Dependency audit** - Known vulnerabilities in third-party packages
- **Secrets detection** - API keys, passwords, tokens in source code
- **Security best practices** - Input validation, output encoding, authentication flows

### Performance Analysis
- **Bottleneck identification** - CPU-intensive operations, memory leaks, I/O blocking
- **Resource usage analysis** - Memory consumption patterns, file handle usage
- **Algorithmic complexity** - Time/space complexity analysis, optimization opportunities
- **Database query optimization** - N+1 queries, missing indexes, inefficient joins

### Technical Debt Assessment
- **Code age analysis** - Legacy code identification, outdated patterns
- **Maintenance burden** - Code that's hard to modify or extend
- **Documentation gaps** - Missing documentation, outdated comments
- **Test coverage analysis** - Untested code paths, test quality assessment

## Supported Languages & Frameworks

### Programming Languages
- **JavaScript/TypeScript** - ES6+, Node.js, Deno, Bun
- **Python** - Python 3.8+, asyncio patterns, type hints
- **Java** - Java 11+, Spring framework, microservices
- **C#** - .NET 6+, ASP.NET Core, Entity Framework
- **Go** - Go 1.18+, goroutines, channels, modules
- **Rust** - Ownership patterns, async/await, cargo ecosystem
- **PHP** - PHP 8+, Laravel, Symfony, PSR standards
- **Ruby** - Ruby 3+, Rails 7+, RSpec testing
- **C/C++** - C11/C++20, memory management, performance optimization
- **Kotlin** - Android development, server-side Kotlin
- **Swift** - iOS development, SwiftUI, async/await
- **Dart** - Flutter development, null safety

### Frameworks & Libraries
- **Frontend** - React 18+, Vue 3+, Angular 15+, Svelte 4+
- **Backend** - Express.js, FastAPI, Django, Spring Boot, ASP.NET Core
- **Mobile** - React Native, Flutter, SwiftUI, Kotlin Multiplatform
- **Database** - PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch
- **Cloud** - AWS, Azure, GCP, Kubernetes, Docker

## Analysis Tools Integration

### Modern Linting & Analysis
```bash
# JavaScript/TypeScript
- ESLint with modern rulesets (Airbnb, Standard, XO)
- Biome (all-in-one toolchain)
- TypeScript compiler strict mode
- Prettier for code formatting consistency

# Python
- Ruff (ultra-fast linter and formatter)
- mypy for static type checking
- bandit for security issues
- vulture for dead code detection
- radon for complexity metrics

# Multi-language
- SonarQube/SonarCloud for comprehensive analysis
- CodeClimate for maintainability assessment
- Snyk for dependency vulnerability scanning
- Semgrep for custom security rules
```

### Performance Profiling
```bash
# Runtime Analysis
- Chrome DevTools Performance tab
- Python cProfile and py-spy
- Java JProfiler and async-profiler
- Go pprof and trace analysis
- Rust criterion benchmarking

# Static Performance Analysis
- Bundle analyzers for frontend applications
- Database query plan analysis
- Memory allocation pattern detection
- Concurrency bottleneck identification
```

### Code Quality Metrics
```bash
# Complexity Metrics
- Cyclomatic complexity (McCabe)
- Cognitive complexity (SonarSource)
- Halstead complexity measures
- Maintainability index calculation

# Architecture Metrics
- Afferent/efferent coupling
- Instability and abstractness
- Distance from main sequence
- Component dependency analysis
```

## Analysis Workflows

### Quick Code Review
```bash
1. Run modern linters (ESLint/Biome for JS, Ruff for Python)
2. Check security vulnerabilities (Snyk, bandit)
3. Analyze test coverage and identify gaps
4. Generate complexity and maintainability reports
5. Identify immediate improvement opportunities
```

### Comprehensive Assessment
```bash
1. Deep architecture analysis with dependency mapping
2. Performance profiling and bottleneck identification
3. Security audit with threat modeling
4. Technical debt assessment with remediation roadmap
5. Code quality trends and regression analysis
```

### Legacy Code Modernization
```bash
1. Identify outdated patterns and deprecated APIs
2. Analyze migration paths to modern frameworks
3. Assess refactoring risks and benefits
4. Generate modernization strategy with phases
5. Estimate effort and resource requirements
```

## Integration Patterns

### CI/CD Pipeline Integration
```yaml
# GitHub Actions example
- name: Code Analysis
  run: |
    # Run linting with fail-fast
    npm run lint:strict || python -m ruff check --show-fixes

    # Security scanning
    npm audit --audit-level=moderate
    safety check --json

    # Quality gates
    sonarcloud-quality-gate-action

    # Performance regression detection
    npm run test:performance
```

### IDE Integration
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true,
    "source.formatDocument": true
  },
  "eslint.workingDirectories": ["packages/*"],
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "sonarlint.connectedMode.project": {
    "connectionId": "sonarcloud",
    "projectKey": "project-key"
  }
}
```

## Advanced Analysis Techniques

### Machine Learning-Enhanced Analysis
- **Anomaly detection** - Unusual code patterns that may indicate bugs
- **Bug prediction** - Statistical models for identifying bug-prone code
- **Code similarity analysis** - Duplicate or near-duplicate code detection
- **Intelligent code completion** - Context-aware suggestions for improvements

### Cross-Project Analysis
- **Pattern extraction** - Common patterns across related projects
- **Best practice identification** - High-quality code examples from similar domains
- **Anti-pattern detection** - Known problematic patterns in specific contexts
- **Team coding standards** - Consistency analysis across team repositories

### Real-time Analysis
- **Live code analysis** - Real-time feedback during development
- **Incremental analysis** - Analyze only changed code for performance
- **Collaborative analysis** - Team-wide code quality trends and insights
- **Predictive analysis** - Forecast potential issues based on current trends

## Reporting and Visualization

### Executive Dashboards
- **Code quality trends** - Quality metrics over time
- **Technical debt visualization** - Heat maps of problematic areas
- **Team productivity metrics** - Code review cycles, fix times
- **ROI analysis** - Cost of technical debt vs. remediation effort

### Developer-Focused Reports
- **Personal code quality** - Individual contributor metrics
- **Refactoring opportunities** - Specific improvement suggestions
- **Learning recommendations** - Skills to develop based on code patterns
- **Code review assistance** - Automated review comments and suggestions

## Skill Activation Triggers

This skill automatically activates when:
- Code quality assessment is requested
- Security vulnerability scanning is needed
- Performance optimization is required
- Technical debt analysis is requested
- Code review assistance is needed
- Legacy code modernization is planned

## Output Formats

### Immediate Feedback
```bash
✅ Code Quality Score: 8.7/10
⚠️  3 security issues found (2 medium, 1 low)
🔄 15 refactoring opportunities identified
📊 Test coverage: 87% (target: 90%)
⚡ 2 performance bottlenecks detected
```

### Detailed Analysis Report
```markdown
# Code Analysis Report

## Executive Summary
- Overall Quality: Good (8.7/10)
- Security Risk: Medium
- Technical Debt: 2.3 days
- Maintainability: High

## Key Findings
1. **Security**: Potential SQL injection vulnerability in user authentication
2. **Performance**: Database queries in user service causing 200ms delays
3. **Maintainability**: Large controller classes (>300 lines) need refactoring

## Recommendations
1. Implement parameterized queries for database access
2. Add database query optimization and caching layer
3. Apply single responsibility principle to controller refactoring

## Detailed Metrics
[Comprehensive metrics and visualizations]
```

This comprehensive code analysis skill provides enterprise-grade code quality assessment capabilities that integrate seamlessly with modern development workflows and toolchains.