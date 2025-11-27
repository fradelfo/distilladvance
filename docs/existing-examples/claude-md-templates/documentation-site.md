# [Project Name] - Documentation Site

A comprehensive documentation website built with modern static site generators, designed for excellent developer experience, searchability, and maintainability of technical documentation.

## Project Overview

This project delivers a professional documentation site with automated content generation, interactive examples, comprehensive search, and collaborative editing workflows. Built with accessibility, performance, and content management as core principles.

**Primary Goals:**
- Provide excellent documentation experience for developers and users
- Enable collaborative content creation and maintenance
- Ensure fast, searchable, and accessible documentation
- Automate documentation generation and deployment

## Tech Stack

### Documentation Framework
- **Static Site Generator**: Next.js + Nextra / Docusaurus / GitBook / VitePress
- **Content Format**: MDX / Markdown with frontmatter
- **Styling**: Tailwind CSS / Styled Components / CSS Modules
- **Search**: Algolia DocSearch / Local search / Elasticsearch

### Content Management
- **CMS Integration**: Notion / Contentful / Strapi (optional)
- **Version Control**: Git-based workflow for content
- **Collaborative Editing**: GitHub's web editor / GitLab Web IDE
- **Content Validation**: Markdown linting and spell checking

### Development & Build
- **Build System**: Next.js / Vite / Webpack with optimizations
- **Hot Reload**: Fast development server with live editing
- **Asset Optimization**: Image optimization and compression
- **Code Highlighting**: Prism.js / Shiki for syntax highlighting

### Deployment & Hosting
- **Hosting**: Vercel / Netlify / GitHub Pages / AWS S3 + CloudFront
- **CDN**: Global content delivery for fast loading
- **Analytics**: Google Analytics / Plausible / Mixpanel
- **Monitoring**: Uptime monitoring and performance tracking

### Documentation Tools
- **API Documentation**: OpenAPI/Swagger integration
- **Code Examples**: Interactive code playgrounds
- **Diagrams**: Mermaid / PlantUML / Excalidraw integration
- **Translations**: i18n support for multiple languages

## Project Structure

```
├── content/
│   ├── docs/                # Main documentation content
│   │   ├── getting-started/ # Getting started guides
│   │   ├── api/            # API documentation
│   │   ├── tutorials/      # Step-by-step tutorials
│   │   ├── guides/         # How-to guides
│   │   └── reference/      # Reference documentation
│   ├── blog/               # Blog posts and announcements
│   └── changelog/          # Version history and changes
├── src/
│   ├── components/         # Custom React/Vue components
│   ├── pages/              # Page layouts and routing
│   ├── styles/             # Global styles and themes
│   ├── utils/              # Helper functions and utilities
│   └── hooks/              # Custom hooks (React)
├── public/
│   ├── images/             # Static images and assets
│   ├── videos/             # Video content and demos
│   └── downloads/          # Downloadable resources
├── scripts/
│   ├── generate-api-docs.js # Automated API doc generation
│   ├── validate-links.js   # Link validation script
│   └── optimize-images.js  # Image optimization pipeline
├── .github/
│   └── workflows/          # CI/CD for docs deployment
└── config/                 # Configuration files
```

## Development Guidelines

### Content Strategy
- **Information Architecture**: Logical organization with clear navigation
- **Writing Style**: Clear, concise, and user-focused content
- **Code Examples**: Working, tested code snippets with explanations
- **Visual Design**: Consistent design system and component library
- **Progressive Disclosure**: Layered information from basic to advanced

### Content Quality Standards
- **Accuracy**: All information verified and up-to-date
- **Completeness**: Comprehensive coverage of topics
- **Clarity**: Clear explanations with examples
- **Accessibility**: WCAG 2.1 AA compliance for all content
- **SEO Optimization**: Optimized for search engine discovery

### Documentation Types
- **Getting Started**: Quick start guides and installation instructions
- **Tutorials**: Step-by-step learning experiences
- **How-to Guides**: Problem-solving oriented instructions
- **Reference**: Comprehensive technical reference material
- **API Documentation**: Complete API reference with examples

### Content Maintenance
- **Version Control**: Track all content changes in Git
- **Review Process**: Peer review for all content updates
- **Link Validation**: Automated checking of internal and external links
- **Content Auditing**: Regular review and updates of existing content

## Key Commands

### Development Commands
```bash
# Start development server
npm run dev              # Next.js/Vite development server
npm run start            # Docusaurus development server
bundle exec jekyll serve # Jekyll development server

# Content validation
npm run lint:md          # Lint markdown files
npm run spell-check      # Spell check all content
npm run validate-links   # Check for broken links
npm run test:content     # Test code examples in documentation

# Build and preview
npm run build           # Build static site for production
npm run preview         # Preview production build locally
npm run analyze         # Analyze bundle size and performance
```

### Content Management
```bash
# Content generation
npm run generate:api-docs     # Generate API documentation
npm run generate:changelog    # Generate changelog from git history
npm run extract:code-examples # Extract and validate code examples
npm run optimize:images       # Optimize all images

# Content deployment
npm run deploy               # Deploy to production
npm run deploy:staging       # Deploy to staging environment
npm run sync:translations    # Sync translation files
```

### Quality Assurance
```bash
# Accessibility testing
npm run test:a11y           # Test accessibility compliance
npm run lighthouse          # Run Lighthouse performance audit
npm run test:visual         # Visual regression testing

# SEO and Performance
npm run test:seo            # SEO optimization checks
npm run test:performance    # Performance testing
npm run validate:metadata   # Validate page metadata
```

## Documentation Architecture

### Information Architecture
```typescript
// Content structure definition
interface DocumentationStructure {
  gettingStarted: {
    installation: string;
    quickStart: string;
    firstSteps: string;
  };
  guides: {
    [category: string]: {
      overview: string;
      tutorials: string[];
      howToGuides: string[];
    };
  };
  reference: {
    api: string;
    configuration: string;
    troubleshooting: string;
  };
  community: {
    contributing: string;
    changelog: string;
    support: string;
  };
}

// Navigation configuration
const navigationConfig = {
  main: [
    { title: 'Getting Started', href: '/getting-started' },
    { title: 'Guides', href: '/guides' },
    { title: 'API Reference', href: '/api' },
    { title: 'Community', href: '/community' }
  ],
  sidebar: {
    '/getting-started': [
      'installation',
      'quick-start',
      'first-steps',
      'examples'
    ],
    '/guides': [
      'tutorials',
      'how-to',
      'best-practices',
      'advanced'
    ]
  }
};
```

### Content Templates
```markdown
<!-- Template: Tutorial Page -->
---
title: "How to [Specific Task]"
description: "Learn how to [specific task] step by step"
category: "tutorials"
difficulty: "beginner" # beginner, intermediate, advanced
estimatedTime: "15 minutes"
prerequisites:
  - "Basic knowledge of X"
  - "Y installed"
tags: ["tutorial", "getting-started"]
---

# How to [Specific Task]

## Overview
Brief description of what the user will learn and accomplish.

## Prerequisites
- List of required knowledge or setup
- Links to prerequisite content

## Step 1: [First Action]
Detailed explanation with code examples:

```typescript
// Example code with comments
const example = {
  property: 'value'
};
```

## Step 2: [Next Action]
Continue with clear, actionable steps.

## Verification
How to verify the task was completed successfully.

## Next Steps
- Link to related content
- Suggested follow-up tutorials

## Troubleshooting
Common issues and solutions.
```

### Interactive Components
```tsx
// Interactive code playground component
import { CodePlayground } from '@/components/CodePlayground';

export const InteractiveExample: React.FC<{
  code: string;
  language: string;
  editable?: boolean;
}> = ({ code, language, editable = false }) => {
  return (
    <div className="my-8 border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h4 className="text-sm font-medium">Interactive Example</h4>
      </div>
      <CodePlayground
        initialCode={code}
        language={language}
        editable={editable}
        showLineNumbers={true}
        theme="github-light"
      />
    </div>
  );
};

// API endpoint documentation component
export const APIEndpoint: React.FC<{
  method: string;
  endpoint: string;
  description: string;
  parameters?: Parameter[];
  responses?: Response[];
}> = ({ method, endpoint, description, parameters, responses }) => {
  return (
    <div className="api-endpoint border rounded-lg p-6 my-6">
      <div className="flex items-center gap-4 mb-4">
        <span className={`method-badge ${method.toLowerCase()}`}>
          {method.toUpperCase()}
        </span>
        <code className="endpoint text-lg font-mono">{endpoint}</code>
      </div>
      <p className="text-gray-600 mb-6">{description}</p>

      {parameters && parameters.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Parameters</h4>
          <ParameterTable parameters={parameters} />
        </div>
      )}

      {responses && responses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Responses</h4>
          <ResponseTable responses={responses} />
        </div>
      )}

      <InteractiveExample
        code={`curl -X ${method} "${endpoint}"`}
        language="bash"
        editable={true}
      />
    </div>
  );
};
```

## Content Generation Automation

### API Documentation Generation
```javascript
// scripts/generate-api-docs.js
const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');

async function generateAPIDocumentation() {
  try {
    // Parse OpenAPI specification
    const api = await SwaggerParser.parse('./api/openapi.yml');

    // Generate markdown for each endpoint
    for (const [pathName, pathItem] of Object.entries(api.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation.operationId) {
          const markdownContent = generateEndpointMarkdown({
            path: pathName,
            method: method.toUpperCase(),
            operation
          });

          const filename = `${operation.operationId}.md`;
          const filepath = path.join('./content/api', filename);

          fs.writeFileSync(filepath, markdownContent);
          console.log(`Generated documentation for ${operation.operationId}`);
        }
      }
    }

    console.log('API documentation generation completed!');
  } catch (error) {
    console.error('Error generating API documentation:', error);
    process.exit(1);
  }
}

function generateEndpointMarkdown({ path, method, operation }) {
  const { summary, description, parameters = [], responses = {} } = operation;

  let markdown = `---
title: "${summary || operation.operationId}"
description: "${description || summary}"
method: "${method}"
endpoint: "${path}"
---

# ${summary || operation.operationId}

${description || ''}

## Endpoint
\`${method} ${path}\`

`;

  // Add parameters section
  if (parameters.length > 0) {
    markdown += `## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
`;
    parameters.forEach(param => {
      markdown += `| ${param.name} | ${param.schema?.type || param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || ''} |
`;
    });
    markdown += '\n';
  }

  // Add responses section
  if (Object.keys(responses).length > 0) {
    markdown += `## Responses

`;
    for (const [statusCode, response] of Object.entries(responses)) {
      markdown += `### ${statusCode} - ${response.description}

`;
      if (response.content?.['application/json']?.schema) {
        markdown += `\`\`\`json
${JSON.stringify(response.content['application/json'].example || {}, null, 2)}
\`\`\`

`;
      }
    }
  }

  // Add example request
  markdown += `## Example Request

\`\`\`bash
curl -X ${method} "${path}"
\`\`\`

`;

  return markdown;
}

generateAPIDocumentation();
```

### Content Validation Pipeline
```javascript
// scripts/validate-content.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const markdownlint = require('markdownlint');
const linkChecker = require('markdown-link-check');

async function validateContent() {
  const contentDir = './content';
  const errors = [];

  // Find all markdown files
  const markdownFiles = await findMarkdownFiles(contentDir);

  for (const file of markdownFiles) {
    console.log(`Validating ${file}...`);

    try {
      const content = fs.readFileSync(file, 'utf8');
      const { data: frontmatter, content: markdown } = matter(content);

      // Validate frontmatter
      await validateFrontmatter(file, frontmatter);

      // Lint markdown
      await lintMarkdown(file, content);

      // Check links
      await checkLinks(file, markdown);

      // Validate code examples
      await validateCodeExamples(file, markdown);

    } catch (error) {
      errors.push({ file, error: error.message });
    }
  }

  if (errors.length > 0) {
    console.error('Content validation failed:');
    errors.forEach(({ file, error }) => {
      console.error(`  ${file}: ${error}`);
    });
    process.exit(1);
  }

  console.log('All content validation passed!');
}

async function validateFrontmatter(file, frontmatter) {
  const required = ['title', 'description'];
  for (const field of required) {
    if (!frontmatter[field]) {
      throw new Error(`Missing required frontmatter field: ${field}`);
    }
  }

  // Validate title length
  if (frontmatter.title.length > 60) {
    throw new Error('Title too long (max 60 characters)');
  }

  // Validate description length
  if (frontmatter.description.length > 160) {
    throw new Error('Description too long (max 160 characters)');
  }
}

async function lintMarkdown(file, content) {
  const options = {
    files: [file],
    config: {
      'line-length': { line_length: 100 },
      'heading-style': { style: 'atx' },
      'no-trailing-punctuation': { punctuation: '.,;:!' }
    }
  };

  const results = markdownlint.sync(options);
  if (results[file]) {
    const issues = results[file].map(issue =>
      `Line ${issue.lineNumber}: ${issue.ruleDescription}`
    );
    throw new Error(`Markdown linting issues:\n${issues.join('\n')}`);
  }
}

async function checkLinks(file, markdown) {
  return new Promise((resolve, reject) => {
    linkChecker(markdown, (err, results) => {
      if (err) {
        reject(new Error(`Link checking failed: ${err.message}`));
        return;
      }

      const deadLinks = results.filter(result => result.status === 'dead');
      if (deadLinks.length > 0) {
        const links = deadLinks.map(link => link.link);
        reject(new Error(`Dead links found: ${links.join(', ')}`));
        return;
      }

      resolve();
    });
  });
}

validateContent().catch(console.error);
```

## Search Integration

### Algolia DocSearch Setup
```javascript
// Search configuration
const searchConfig = {
  appId: process.env.ALGOLIA_APP_ID,
  apiKey: process.env.ALGOLIA_SEARCH_KEY,
  indexName: 'documentation',
  contextualSearch: true,
  searchParameters: {
    hitsPerPage: 10,
    attributesToRetrieve: [
      'hierarchy.lvl0',
      'hierarchy.lvl1',
      'hierarchy.lvl2',
      'content',
      'type',
      'url'
    ]
  }
};

// Search component
import { DocSearch } from '@docsearch/react';

export const SearchButton: React.FC = () => {
  return (
    <DocSearch
      appId={searchConfig.appId}
      indexName={searchConfig.indexName}
      apiKey={searchConfig.apiKey}
      searchParameters={searchConfig.searchParameters}
    />
  );
};
```

### Content Indexing Pipeline
```yaml
# .github/workflows/index-content.yml
name: Index Documentation Content

on:
  push:
    branches: [main]
    paths: ['content/**']

jobs:
  index-content:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build documentation
        run: npm run build

      - name: Index content to Algolia
        env:
          ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
          ALGOLIA_ADMIN_KEY: ${{ secrets.ALGOLIA_ADMIN_KEY }}
        run: |
          npm run index:algolia
```

## Performance Optimization

### Image Optimization
```javascript
// next.config.js
const withOptimizedImages = require('next-optimized-images');

module.exports = withOptimizedImages({
  // Image optimization settings
  optimizeImages: true,
  optimizeImagesInDev: true,
  mozjpeg: {
    quality: 80,
  },
  optipng: {
    optimizationLevel: 3,
  },
  webp: {
    quality: 80,
  },

  // Next.js configuration
  experimental: {
    esmExternals: true,
  },

  async redirects() {
    return [
      {
        source: '/old-docs/:path*',
        destination: '/docs/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 's-maxage=86400' },
        ],
      },
    ];
  }
});
```

### Code Splitting and Lazy Loading
```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const CodePlayground = dynamic(() => import('./CodePlayground'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded" />,
  ssr: false
});

const DiagramViewer = dynamic(() => import('./DiagramViewer'), {
  loading: () => <div>Loading diagram...</div>,
  ssr: false
});

// Optimize bundle with code splitting
const MDXComponents = {
  pre: dynamic(() => import('./CodeBlock')),
  img: dynamic(() => import('./OptimizedImage')),
  video: dynamic(() => import('./VideoPlayer')),
  iframe: dynamic(() => import('./EmbedFrame'))
};
```

## Analytics and Monitoring

### Content Analytics
```javascript
// utils/analytics.js
import { track } from '@/lib/analytics';

export const trackDocumentationEvent = (event: string, properties?: any) => {
  track('Documentation Event', {
    event,
    ...properties,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer
  });
};

// Track reading progress
export const useReadingProgress = () => {
  useEffect(() => {
    const handleScroll = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const scrollTop = window.scrollY;
      const docHeight = article.offsetHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);

      // Track reading milestones
      const milestones = [0.25, 0.5, 0.75, 1.0];
      const currentMilestone = milestones.find(
        milestone => scrollPercent >= milestone && !trackedMilestones.has(milestone)
      );

      if (currentMilestone) {
        trackedMilestones.add(currentMilestone);
        trackDocumentationEvent('Reading Progress', {
          milestone: currentMilestone * 100,
          page: window.location.pathname
        });
      }
    };

    window.addEventListener('scroll', throttle(handleScroll, 1000));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
};
```

### Performance Monitoring
```javascript
// Performance monitoring setup
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, id }) {
  track('Web Vital', {
    metric: name,
    value: Math.round(value),
    id,
    url: window.location.href
  });
}

// Monitor Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Deployment Configuration

### Vercel Deployment
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/docs/(.*)",
      "headers": {
        "Cache-Control": "s-maxage=86400"
      }
    }
  ],
  "env": {
    "ALGOLIA_APP_ID": "@algolia-app-id",
    "ALGOLIA_SEARCH_KEY": "@algolia-search-key"
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint content
        run: npm run lint:content

      - name: Validate links
        run: npm run validate:links

      - name: Build site
        run: npm run build

      - name: Test accessibility
        run: npm run test:a11y

      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Content Strategy & Governance

### Content Review Process
```markdown
## Documentation Review Checklist

### Content Quality
- [ ] Information is accurate and up-to-date
- [ ] Writing is clear and concise
- [ ] Code examples are tested and working
- [ ] Screenshots and images are current
- [ ] Links are valid and relevant

### Structure & Organization
- [ ] Content follows established templates
- [ ] Navigation and hierarchy are logical
- [ ] Related content is properly linked
- [ ] Metadata and tags are appropriate

### Technical Requirements
- [ ] Markdown is properly formatted
- [ ] Code blocks have syntax highlighting
- [ ] SEO metadata is complete
- [ ] Accessibility requirements met

### User Experience
- [ ] Content serves user needs
- [ ] Progressive difficulty levels
- [ ] Clear calls-to-action
- [ ] Mobile-friendly formatting
```

### Content Maintenance Schedule
```javascript
// Content maintenance automation
const contentMaintenance = {
  daily: [
    'Check for broken links',
    'Validate external references',
    'Monitor search analytics'
  ],
  weekly: [
    'Review user feedback',
    'Update code examples',
    'Analyze page performance'
  ],
  monthly: [
    'Audit content accuracy',
    'Update screenshots',
    'Review and update outdated content',
    'Analyze user journeys'
  ],
  quarterly: [
    'Content strategy review',
    'Information architecture updates',
    'Major version documentation updates'
  ]
};
```

## Development Workflow

### Content Creation Process
1. **Planning**: Define content goals and target audience
2. **Research**: Gather technical information and user feedback
3. **Writing**: Create content following established templates
4. **Review**: Peer review for accuracy and clarity
5. **Testing**: Validate code examples and links
6. **Publishing**: Deploy through automated pipeline

### Editorial Guidelines
1. **Voice and Tone**: Professional but approachable
2. **Structure**: Logical flow with clear headings
3. **Examples**: Real-world, practical examples
4. **Updates**: Regular review and maintenance schedule
5. **Feedback**: Incorporate user feedback continuously

### Code Review Checklist
- [ ] Content follows style guide and templates
- [ ] All code examples are tested and working
- [ ] Links are valid and point to correct resources
- [ ] Images are optimized and have alt text
- [ ] SEO metadata is properly configured
- [ ] Mobile experience is optimized

## Claude Code Integration Notes

When working with this documentation site, focus on:
- **User-Centric Content**: Always consider the reader's perspective and needs
- **Accuracy**: Ensure all technical information is current and correct
- **Accessibility**: Maintain WCAG compliance for all content and interactions
- **Performance**: Optimize for fast loading and smooth user experience
- **Searchability**: Structure content for effective search and discovery
- **Maintenance**: Keep content fresh and up-to-date with regular reviews

For content development, prioritize clarity and usefulness over comprehensive coverage, and always validate that code examples work as documented.