# Browser Extension Manifest Optimization Skill

## Skill Overview
Expert knowledge in optimizing browser extension manifests (V3) for performance, security, store approval, and cross-browser compatibility with focus on AI-powered applications.

## Core Capabilities

### Manifest V3 Structure Optimization

#### Production-Ready Manifest Template
```json
{
  "manifest_version": 3,
  "name": "AI Chat Distiller",
  "version": "1.2.0",
  "description": "Transform AI conversations into reusable prompt templates with privacy-first design and cross-platform support.",
  "author": "Your Team Name",
  "homepage_url": "https://your-website.com",

  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },

  "action": {
    "default_popup": "popup/index.html",
    "default_title": "AI Chat Distiller",
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },

  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": [
        "https://chat.openai.com/*",
        "https://claude.ai/*"
      ],
      "js": [
        "content-scripts/chat-detector.js",
        "content-scripts/conversation-extractor.js"
      ],
      "css": [
        "content-scripts/injection-styles.css"
      ],
      "run_at": "document_idle",
      "all_frames": false,
      "world": "ISOLATED"
    },
    {
      "matches": [
        "https://gemini.google.com/*",
        "https://perplexity.ai/*"
      ],
      "js": [
        "content-scripts/generic-extractor.js"
      ],
      "run_at": "document_end",
      "all_frames": false
    }
  ],

  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "scripting"
  ],

  "optional_permissions": [
    "tabs",
    "bookmarks",
    "history"
  ],

  "optional_host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://your-api-server.com/*"
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://*.googleapis.com;"
  },

  "web_accessible_resources": [
    {
      "resources": [
        "assets/fonts/*",
        "assets/images/*",
        "injection/ui-components.js"
      ],
      "matches": [
        "https://chat.openai.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://perplexity.ai/*"
      ]
    }
  ],

  "externally_connectable": {
    "matches": [
      "https://your-webapp.com/*",
      "https://*.your-webapp.com/*"
    ]
  },

  "options_ui": {
    "page": "options/index.html",
    "open_in_tab": true
  },

  "commands": {
    "extract-conversation": {
      "suggested_key": {
        "default": "Ctrl+Shift+E",
        "mac": "Command+Shift+E"
      },
      "description": "Extract current AI conversation"
    },
    "toggle-auto-distill": {
      "suggested_key": {
        "default": "Ctrl+Shift+D",
        "mac": "Command+Shift+D"
      },
      "description": "Toggle automatic distillation mode"
    }
  },

  "minimum_chrome_version": "88",
  "minimum_edge_version": "88"
}
```

### Permission Optimization Strategies

#### Minimal Permission Pattern
```typescript
// permission-manager.ts - Smart permission management
interface PermissionRequest {
  permission: string
  justification: string
  required: boolean
  alternatives?: string[]
}

class ExtensionPermissionManager {
  private requestedPermissions = new Set<string>()
  private grantedPermissions = new Set<string>()

  async requestMinimalPermissions(): Promise<void> {
    // Start with absolutely minimal permissions
    const corePermissions = [
      'activeTab',  // Only current tab access
      'storage'     // Local data storage
    ]

    // Check which permissions are already granted
    await this.auditCurrentPermissions()

    // Request additional permissions only when needed
    await this.requestPermissionOnDemand()
  }

  async requestPermissionOnDemand(feature: string): Promise<boolean> {
    const permissionMap: Record<string, PermissionRequest> = {
      'extract-all-tabs': {
        permission: 'tabs',
        justification: 'Access all open tabs to extract conversations from multiple AI chat sessions',
        required: false,
        alternatives: ['activeTab with manual tab switching']
      },
      'bookmark-prompts': {
        permission: 'bookmarks',
        justification: 'Save distilled prompts as bookmarks for easy access',
        required: false,
        alternatives: ['Local storage only']
      },
      'conversation-history': {
        permission: 'history',
        justification: 'Analyze conversation patterns across browsing history',
        required: false,
        alternatives: ['Current session only']
      },
      'api-integration': {
        permission: 'https://api.openai.com/*',
        justification: 'Direct API access for enhanced distillation features',
        required: false,
        alternatives: ['Extension backend proxy']
      }
    }

    const request = permissionMap[feature]
    if (!request) {
      throw new Error(`Unknown feature: ${feature}`)
    }

    // Show user-friendly permission request dialog
    const userConsent = await this.showPermissionDialog(request)
    if (!userConsent) {
      return false
    }

    try {
      const granted = await chrome.permissions.request({
        permissions: [request.permission]
      })

      if (granted) {
        this.grantedPermissions.add(request.permission)
        await this.savePermissionState()
      }

      return granted
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  private async showPermissionDialog(request: PermissionRequest): Promise<boolean> {
    return new Promise((resolve) => {
      // Create permission dialog UI
      const dialog = this.createPermissionDialog({
        title: 'Additional Permission Required',
        description: request.justification,
        permission: request.permission,
        required: request.required,
        alternatives: request.alternatives,
        onApprove: () => resolve(true),
        onDecline: () => resolve(false)
      })

      document.body.appendChild(dialog)
    })
  }

  async removeUnusedPermissions(): Promise<void> {
    const allPermissions = await chrome.permissions.getAll()
    const usageStats = await this.getPermissionUsageStats()

    for (const permission of allPermissions.permissions || []) {
      const usage = usageStats[permission]

      // Remove permissions not used in last 30 days
      if (!usage || usage.lastUsed < Date.now() - 30 * 24 * 60 * 60 * 1000) {
        const removed = await chrome.permissions.remove({
          permissions: [permission]
        })

        if (removed) {
          console.log(`Removed unused permission: ${permission}`)
        }
      }
    }
  }
}
```

### Content Script Optimization

#### Conditional Loading Pattern
```typescript
// content-script-loader.ts - Smart content script loading
interface ContentScriptConfig {
  sites: SiteConfig[]
  loadingStrategy: 'eager' | 'lazy' | 'on-demand'
  features: string[]
}

class ContentScriptOptimizer {
  private loadedScripts = new Set<string>()
  private siteConfigs: Map<string, SiteConfig> = new Map()

  constructor() {
    this.initializeSiteConfigs()
  }

  private initializeSiteConfigs(): void {
    // Optimized configurations per site
    this.siteConfigs.set('chat.openai.com', {
      priority: 'high',
      features: ['conversation-extraction', 'auto-distillation', 'ui-injection'],
      loadingStrategy: 'eager',
      selectors: {
        chatContainer: 'main[class*="chat"]',
        messageElements: '[data-message-author-role]',
        inputField: 'textarea[placeholder*="message"]'
      },
      apiEndpoint: 'https://chat.openai.com/api',
      rateLimit: {
        requests: 60,
        window: 60000 // 1 minute
      }
    })

    this.siteConfigs.set('claude.ai', {
      priority: 'high',
      features: ['conversation-extraction', 'claude-specific-parsing'],
      loadingStrategy: 'eager',
      selectors: {
        chatContainer: '[data-testid="chat-interface"]',
        messageElements: '[data-testid*="message"]',
        inputField: 'div[contenteditable="true"]'
      }
    })

    this.siteConfigs.set('gemini.google.com', {
      priority: 'medium',
      features: ['conversation-extraction'],
      loadingStrategy: 'lazy',
      selectors: {
        chatContainer: 'chat-container',
        messageElements: '.message-content'
      }
    })

    // Generic configuration for unknown sites
    this.siteConfigs.set('*', {
      priority: 'low',
      features: ['generic-extraction'],
      loadingStrategy: 'on-demand',
      selectors: {
        chatContainer: '[class*="chat"], [class*="conversation"]',
        messageElements: '[class*="message"]'
      }
    })
  }

  async optimizeForCurrentSite(): Promise<void> {
    const hostname = window.location.hostname
    const config = this.siteConfigs.get(hostname) || this.siteConfigs.get('*')!

    // Check if site actually contains AI chat interface
    const hasAIChat = await this.detectAIChatInterface(config.selectors)
    if (!hasAIChat) {
      console.log('No AI chat interface detected, skipping initialization')
      return
    }

    // Load scripts based on strategy
    switch (config.loadingStrategy) {
      case 'eager':
        await this.loadAllFeatures(config.features)
        break
      case 'lazy':
        await this.loadCoreFeatures()
        this.setupLazyLoading(config.features)
        break
      case 'on-demand':
        this.setupOnDemandLoading(config.features)
        break
    }
  }

  private async detectAIChatInterface(selectors: any): Promise<boolean> {
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check for chat interface indicators
    const chatContainer = document.querySelector(selectors.chatContainer)
    if (!chatContainer) return false

    // Verify it contains conversation-like content
    const text = chatContainer.textContent?.toLowerCase() || ''
    const aiIndicators = [
      'assistant', 'ai', 'gpt', 'claude', 'gemini', 'bot',
      'conversation', 'chat', 'message', 'response'
    ]

    return aiIndicators.some(indicator => text.includes(indicator))
  }

  private async loadCoreFeatures(): Promise<void> {
    const coreFeatures = ['conversation-extraction', 'ui-injection']

    for (const feature of coreFeatures) {
      if (!this.loadedScripts.has(feature)) {
        await this.loadFeatureModule(feature)
        this.loadedScripts.add(feature)
      }
    }
  }

  private async loadFeatureModule(feature: string): Promise<void> {
    try {
      // Dynamic import for code splitting
      const module = await import(`./features/${feature}.js`)

      if (module.initialize) {
        await module.initialize()
      }

      console.log(`Feature loaded: ${feature}`)
    } catch (error) {
      console.error(`Failed to load feature ${feature}:`, error)
    }
  }

  private setupLazyLoading(features: string[]): void {
    // Intersection observer for lazy loading
    const observer = new IntersectionObserver(async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const feature = entry.target.getAttribute('data-feature')
          if (feature && !this.loadedScripts.has(feature)) {
            await this.loadFeatureModule(feature)
            this.loadedScripts.add(feature)
            observer.unobserve(entry.target)
          }
        }
      }
    }, { threshold: 0.1 })

    // Mark elements that trigger feature loading
    features.forEach(feature => {
      const triggers = document.querySelectorAll(`[data-feature="${feature}"]`)
      triggers.forEach(trigger => observer.observe(trigger))
    })
  }
}
```

### Performance Optimization Patterns

#### Bundle Size Optimization
```typescript
// build-optimization.ts - Extension build optimization
interface BuildConfig {
  target: 'chrome' | 'firefox' | 'edge'
  environment: 'development' | 'production'
  features: string[]
}

class ExtensionBuildOptimizer {
  async optimizeManifest(config: BuildConfig): Promise<any> {
    const baseManifest = await this.loadBaseManifest()
    const optimizedManifest = { ...baseManifest }

    // Browser-specific optimizations
    switch (config.target) {
      case 'chrome':
        optimizedManifest.minimum_chrome_version = "88"
        // Chrome-specific features
        if (config.features.includes('offscreen-api')) {
          optimizedManifest.permissions.push('offscreen')
        }
        break

      case 'firefox':
        // Firefox-specific manifest adjustments
        optimizedManifest.browser_specific_settings = {
          gecko: {
            id: "ai-distiller@yourcompany.com",
            strict_min_version: "91.0"
          }
        }
        // Remove Chrome-specific features
        delete optimizedManifest.minimum_chrome_version
        break

      case 'edge':
        optimizedManifest.minimum_edge_version = "88"
        break
    }

    // Environment-specific optimizations
    if (config.environment === 'production') {
      // Remove development tools
      delete optimizedManifest.content_security_policy.extension_pages
      optimizedManifest.content_security_policy = {
        extension_pages: "script-src 'self'; object-src 'self';"
      }

      // Optimize file references
      await this.optimizeFileReferences(optimizedManifest)
    }

    return optimizedManifest
  }

  private async optimizeFileReferences(manifest: any): Promise<void> {
    // Combine multiple content scripts into single files
    for (const contentScript of manifest.content_scripts) {
      if (contentScript.js.length > 1) {
        const combinedFile = await this.combineJSFiles(contentScript.js)
        contentScript.js = [combinedFile]
      }
    }

    // Optimize CSS files
    for (const contentScript of manifest.content_scripts) {
      if (contentScript.css) {
        const optimizedCSS = await this.optimizeCSSFiles(contentScript.css)
        contentScript.css = optimizedCSS
      }
    }
  }

  async generateOptimizedIcons(): Promise<IconSet> {
    const sourceIcon = 'assets/icon-source.svg'
    const sizes = [16, 32, 48, 128, 512]
    const icons: IconSet = {}

    for (const size of sizes) {
      const optimizedIcon = await this.generateIcon(sourceIcon, size, {
        format: 'png',
        quality: 90,
        compression: 'pngcrush'
      })

      icons[`${size}`] = `assets/icons/icon-${size}.png`
      await this.saveIcon(optimizedIcon, icons[`${size}`])
    }

    return icons
  }
}
```

### Store Submission Optimization

#### Chrome Web Store Optimization
```typescript
// store-optimization.ts - Store submission optimization
interface StoreSubmissionConfig {
  target: 'chrome' | 'firefox' | 'edge'
  category: string
  keywords: string[]
  screenshots: string[]
  promotional: {
    tile: string
    marquee: string
  }
}

class StoreSubmissionOptimizer {
  async prepareForSubmission(config: StoreSubmissionConfig): Promise<SubmissionPackage> {
    const package = {
      manifest: await this.optimizeManifestForStore(config),
      assets: await this.prepareStoreAssets(config),
      metadata: await this.generateStoreMetadata(config),
      documentation: await this.generateDocumentation(config)
    }

    // Validate submission requirements
    await this.validateSubmission(package, config.target)

    return package
  }

  private async optimizeManifestForStore(config: StoreSubmissionConfig): Promise<any> {
    const manifest = await this.loadOptimizedManifest()

    // Store-specific optimizations
    switch (config.target) {
      case 'chrome':
        return this.optimizeForChromeWebStore(manifest)
      case 'firefox':
        return this.optimizeForMozillaAddons(manifest)
      case 'edge':
        return this.optimizeForEdgeAddons(manifest)
    }
  }

  private optimizeForChromeWebStore(manifest: any): any {
    // Chrome Web Store specific requirements
    const optimized = { ...manifest }

    // Ensure proper permission justifications
    if (optimized.permissions.includes('tabs')) {
      if (!optimized.permissions_justification) {
        optimized.permissions_justification = {
          tabs: "Required to extract conversations from multiple AI chat tabs efficiently and provide seamless cross-tab synchronization."
        }
      }
    }

    // Optimize for store policies
    this.ensurePrivacyCompliance(optimized)
    this.optimizeContentSecurityPolicy(optimized)
    this.validateStoreAssets(optimized)

    return optimized
  }

  private ensurePrivacyCompliance(manifest: any): void {
    // Add privacy-focused descriptions
    manifest.description = this.enhanceDescriptionWithPrivacy(manifest.description)

    // Ensure minimal data collection
    if (!manifest.privacy_practices) {
      manifest.privacy_practices = {
        data_usage: "minimal",
        user_data: "stored_locally",
        third_party_sharing: "none",
        encryption: "in_transit_and_at_rest"
      }
    }

    // Add privacy policy reference
    if (manifest.homepage_url) {
      manifest.privacy_policy = `${manifest.homepage_url}/privacy`
    }
  }

  private async generateStoreAssets(config: StoreSubmissionConfig): Promise<StoreAssets> {
    return {
      screenshots: await this.generateOptimizedScreenshots(config.screenshots),
      promotional_tiles: await this.generatePromotionalAssets(config.promotional),
      store_icon: await this.generateStoreIcon(),
      feature_graphics: await this.generateFeatureGraphics()
    }
  }

  private async generateOptimizedScreenshots(screenshots: string[]): Promise<ProcessedScreenshot[]> {
    const processed = []

    for (const screenshot of screenshots) {
      const optimized = await this.processScreenshot(screenshot, {
        width: 1280,
        height: 800,
        quality: 95,
        format: 'jpg',
        annotations: true,
        callouts: true
      })

      processed.push({
        file: optimized,
        caption: await this.generateScreenshotCaption(screenshot),
        order: processed.length + 1
      })
    }

    return processed
  }

  async validateSubmission(package: SubmissionPackage, target: string): Promise<ValidationResult> {
    const validators = {
      chrome: this.validateChromeSubmission.bind(this),
      firefox: this.validateFirefoxSubmission.bind(this),
      edge: this.validateEdgeSubmission.bind(this)
    }

    const validator = validators[target]
    if (!validator) {
      throw new Error(`No validator for target: ${target}`)
    }

    const result = await validator(package)

    if (!result.valid) {
      console.error('Submission validation failed:', result.errors)
      throw new Error(`Validation failed: ${result.errors.join(', ')}`)
    }

    return result
  }

  private async validateChromeSubmission(package: SubmissionPackage): Promise<ValidationResult> {
    const errors = []
    const warnings = []

    // Validate manifest
    if (!package.manifest.name || package.manifest.name.length > 75) {
      errors.push('Extension name must be 75 characters or less')
    }

    if (!package.manifest.description || package.manifest.description.length > 132) {
      errors.push('Extension description must be 132 characters or less')
    }

    // Validate permissions
    const sensitivePermissions = ['tabs', 'history', 'bookmarks', '<all_urls>']
    const usedSensitivePerms = package.manifest.permissions?.filter(p =>
      sensitivePermissions.includes(p)
    )

    if (usedSensitivePerms?.length > 0 && !package.manifest.permissions_justification) {
      errors.push('Sensitive permissions require justification')
    }

    // Validate assets
    if (!package.assets.screenshots || package.assets.screenshots.length === 0) {
      errors.push('At least one screenshot is required')
    }

    if (package.assets.screenshots?.length > 5) {
      warnings.push('Maximum 5 screenshots recommended')
    }

    // Validate icon sizes
    const requiredSizes = [16, 48, 128]
    const iconSizes = Object.keys(package.manifest.icons || {}).map(Number)
    const missingSizes = requiredSizes.filter(size => !iconSizes.includes(size))

    if (missingSizes.length > 0) {
      errors.push(`Missing required icon sizes: ${missingSizes.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}
```

### Security and Compliance Patterns

#### CSP Optimization
```typescript
// security-optimization.ts - Content Security Policy optimization
class CSPOptimizer {
  generateOptimalCSP(features: string[]): string {
    const policies = {
      'script-src': ['\'self\''],
      'object-src': ['\'self\''],
      'img-src': ['\'self\'', 'data:', 'https:'],
      'style-src': ['\'self\'', '\'unsafe-inline\''], // For React styling
      'connect-src': ['\'self\'']
    }

    // Add feature-specific policies
    if (features.includes('ai-integration')) {
      policies['connect-src'].push(
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://*.googleapis.com'
      )
    }

    if (features.includes('web-app-sync')) {
      policies['connect-src'].push('https://*.your-domain.com')
    }

    if (features.includes('analytics')) {
      policies['connect-src'].push('https://analytics.google.com')
      policies['img-src'].push('https://*.google-analytics.com')
    }

    // Convert to CSP string
    return Object.entries(policies)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ')
  }

  validateCSP(csp: string): ValidationResult {
    const errors = []
    const warnings = []

    // Check for unsafe practices
    if (csp.includes('\'unsafe-eval\'')) {
      errors.push('unsafe-eval is not allowed in extension CSP')
    }

    if (csp.includes('*') && !csp.includes('data:')) {
      warnings.push('Wildcard in CSP may be too permissive')
    }

    // Ensure required directives
    const requiredDirectives = ['script-src', 'object-src']
    for (const directive of requiredDirectives) {
      if (!csp.includes(directive)) {
        errors.push(`Missing required directive: ${directive}`)
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }
}
```

## Implementation Patterns

### Development Workflow
1. **Manifest Validation**: Continuous validation during development
2. **Permission Auditing**: Regular permission usage analysis
3. **Performance Monitoring**: Bundle size and runtime performance tracking
4. **Store Compliance**: Automated compliance checking
5. **Cross-Browser Testing**: Automated testing across browser targets

### Best Practices
- Use minimal permissions with optional permissions for enhanced features
- Implement conditional content script loading based on site detection
- Optimize bundle sizes with code splitting and lazy loading
- Maintain separate manifests for different browser targets
- Regular security audits and CSP optimization
- Store submission automation with validation checks

This manifest optimization skill ensures your browser extension is performant, secure, store-compliant, and optimized for the best user experience across all supported browsers.