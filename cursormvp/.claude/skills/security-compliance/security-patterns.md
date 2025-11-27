# Security & Compliance Patterns Skill

## Skill Overview
Comprehensive security and compliance patterns for browser extensions and AI-powered web applications, covering OWASP security principles, GDPR compliance, browser extension security, and AI safety measures.

## Core Capabilities

### Browser Extension Security Framework

#### Manifest V3 Security Implementation
```typescript
// security/extension-security-manager.ts
interface SecurityPolicy {
  contentSecurityPolicy: string
  permissions: string[]
  webAccessibleResources: WebAccessibleResource[]
  hostPermissions: string[]
  optionalPermissions: string[]
}

interface SecurityValidationResult {
  isValid: boolean
  violations: SecurityViolation[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface SecurityViolation {
  type: 'permission' | 'csp' | 'origin' | 'content' | 'storage'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  fix?: string
}

class ExtensionSecurityManager {
  private securityPolicy: SecurityPolicy
  private auditLogger: SecurityAuditLogger

  constructor() {
    this.auditLogger = new SecurityAuditLogger()
    this.securityPolicy = this.generateSecurityPolicy()
  }

  private generateSecurityPolicy(): SecurityPolicy {
    return {
      contentSecurityPolicy: [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'", // For AI models if needed
        "style-src 'self' 'unsafe-inline'", // Limited inline styles
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.openai.com https://api.anthropic.com",
        "object-src 'none'",
        "frame-src 'none'",
        "worker-src 'self'",
        "child-src 'none'",
        "form-action 'none'",
        "base-uri 'self'"
      ].join('; '),

      permissions: [
        'storage',
        'activeTab',
        'scripting'
      ],

      webAccessibleResources: [
        {
          resources: ['content-scripts/*.js', 'assets/icons/*.png'],
          matches: ['<all_urls>'],
          use_dynamic_url: false
        }
      ],

      hostPermissions: [],
      optionalPermissions: ['tabs']
    }
  }

  async validateManifest(manifest: chrome.runtime.Manifest): Promise<SecurityValidationResult> {
    const violations: SecurityViolation[] = []
    let riskLevel: SecurityValidationResult['riskLevel'] = 'low'

    // Validate permissions
    const permissionViolations = this.validatePermissions(manifest.permissions || [])
    violations.push(...permissionViolations)

    // Validate host permissions
    const hostPermissionViolations = this.validateHostPermissions(manifest.host_permissions || [])
    violations.push(...hostPermissionViolations)

    // Validate Content Security Policy
    const cspViolations = await this.validateContentSecurityPolicy(manifest.content_security_policy)
    violations.push(...cspViolations)

    // Validate web accessible resources
    const resourceViolations = this.validateWebAccessibleResources(manifest.web_accessible_resources || [])
    violations.push(...resourceViolations)

    // Determine risk level
    const criticalViolations = violations.filter(v => v.severity === 'critical')
    const errorViolations = violations.filter(v => v.severity === 'error')

    if (criticalViolations.length > 0) {
      riskLevel = 'critical'
    } else if (errorViolations.length > 0) {
      riskLevel = 'high'
    } else if (violations.length > 0) {
      riskLevel = 'medium'
    }

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(violations)

    // Log audit
    await this.auditLogger.logSecurityAudit({
      type: 'manifest_validation',
      violations: violations.length,
      riskLevel,
      timestamp: new Date()
    })

    return {
      isValid: criticalViolations.length === 0 && errorViolations.length === 0,
      violations,
      recommendations,
      riskLevel
    }
  }

  private validatePermissions(permissions: string[]): SecurityViolation[] {
    const violations: SecurityViolation[] = []
    const dangerousPermissions = [
      'tabs',
      'history',
      'bookmarks',
      'browsingData',
      'downloads',
      'cookies',
      'webRequest',
      'webRequestBlocking'
    ]

    for (const permission of permissions) {
      if (dangerousPermissions.includes(permission)) {
        violations.push({
          type: 'permission',
          severity: 'warning',
          message: `Potentially dangerous permission: ${permission}`,
          fix: `Evaluate if ${permission} permission is absolutely necessary and consider using optional permissions`
        })
      }

      // Check for overly broad permissions
      if (permission === '<all_urls>') {
        violations.push({
          type: 'permission',
          severity: 'critical',
          message: 'Using <all_urls> permission is extremely dangerous',
          fix: 'Specify only the necessary host permissions for your extension'
        })
      }
    }

    return violations
  }

  private validateHostPermissions(hostPermissions: string[]): SecurityViolation[] {
    const violations: SecurityViolation[] = []

    for (const hostPermission of hostPermissions) {
      if (hostPermission === '<all_urls>') {
        violations.push({
          type: 'permission',
          severity: 'critical',
          message: 'Using <all_urls> host permission grants access to all websites',
          fix: 'Specify only the necessary domains for your extension'
        })
      }

      if (hostPermission.includes('*://*/*')) {
        violations.push({
          type: 'permission',
          severity: 'error',
          message: 'Using wildcard host permissions is dangerous',
          fix: 'Specify exact domains or use more restrictive patterns'
        })
      }

      // Check for non-HTTPS origins
      if (hostPermission.startsWith('http://') && !hostPermission.includes('localhost')) {
        violations.push({
          type: 'permission',
          severity: 'warning',
          message: `Non-HTTPS host permission: ${hostPermission}`,
          fix: 'Use HTTPS whenever possible for security'
        })
      }
    }

    return violations
  }

  private async validateContentSecurityPolicy(
    csp?: chrome.runtime.Manifest['content_security_policy']
  ): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = []

    if (!csp) {
      violations.push({
        type: 'csp',
        severity: 'error',
        message: 'No Content Security Policy defined',
        fix: 'Define a strict Content Security Policy to prevent XSS attacks'
      })
      return violations
    }

    // Validate CSP for different contexts
    if (typeof csp === 'object') {
      if (csp.extension_pages) {
        const extensionViolations = this.validateCSPDirectives(csp.extension_pages, 'extension_pages')
        violations.push(...extensionViolations)
      }

      if (csp.sandbox) {
        const sandboxViolations = this.validateCSPDirectives(csp.sandbox, 'sandbox')
        violations.push(...sandboxViolations)
      }
    } else {
      const cspViolations = this.validateCSPDirectives(csp, 'legacy')
      violations.push(...cspViolations)
    }

    return violations
  }

  private validateCSPDirectives(cspString: string, context: string): SecurityViolation[] {
    const violations: SecurityViolation[] = []
    const directives = cspString.split(';').map(d => d.trim())

    // Check for dangerous directives
    const dangerousPatterns = [
      /'unsafe-eval'/,
      /'unsafe-inline'/ && context !== 'sandbox', // Allow in sandbox context
      /data:/ && !/'self'/,
      /\*/
    ]

    for (const directive of directives) {
      for (const pattern of dangerousPatterns) {
        if (pattern instanceof RegExp && pattern.test(directive)) {
          violations.push({
            type: 'csp',
            severity: 'warning',
            message: `Potentially unsafe CSP directive in ${context}: ${directive}`,
            fix: 'Consider using more restrictive CSP directives'
          })
        }
      }
    }

    // Ensure essential directives are present
    const hasDefaultSrc = directives.some(d => d.startsWith('default-src'))
    const hasScriptSrc = directives.some(d => d.startsWith('script-src'))

    if (!hasDefaultSrc && !hasScriptSrc) {
      violations.push({
        type: 'csp',
        severity: 'error',
        message: 'Missing default-src or script-src directive in CSP',
        fix: 'Add default-src \'self\' or script-src \'self\' to prevent XSS'
      })
    }

    return violations
  }

  private validateWebAccessibleResources(resources: any[]): SecurityViolation[] {
    const violations: SecurityViolation[] = []

    for (const resource of resources) {
      if (typeof resource === 'string') {
        // Legacy format (MV2)
        violations.push({
          type: 'permission',
          severity: 'warning',
          message: 'Using legacy web_accessible_resources format',
          fix: 'Update to Manifest V3 format with explicit matches'
        })
      } else if (resource.matches?.includes('<all_urls>')) {
        violations.push({
          type: 'permission',
          severity: 'error',
          message: 'Web accessible resources available to all URLs',
          fix: 'Restrict matches to specific domains that need access'
        })
      }
    }

    return violations
  }

  private generateSecurityRecommendations(violations: SecurityViolation[]): string[] {
    const recommendations: string[] = []
    const violationTypes = new Set(violations.map(v => v.type))

    if (violationTypes.has('permission')) {
      recommendations.push('Review and minimize extension permissions')
      recommendations.push('Use optional permissions for non-essential features')
    }

    if (violationTypes.has('csp')) {
      recommendations.push('Implement strict Content Security Policy')
      recommendations.push('Avoid unsafe-eval and unsafe-inline directives')
    }

    if (violations.some(v => v.severity === 'critical')) {
      recommendations.push('Address critical security issues immediately')
    }

    recommendations.push('Regular security audits and dependency scanning')
    recommendations.push('Implement proper input validation and sanitization')

    return recommendations
  }

  // Runtime security monitoring
  async monitorRuntimeSecurity(): Promise<void> {
    // Monitor for suspicious activity
    this.setupSecurityEventListeners()

    // Periodic security checks
    setInterval(async () => {
      await this.performSecurityHealthCheck()
    }, 300000) // Every 5 minutes
  }

  private setupSecurityEventListeners(): void {
    // Monitor for suspicious content script injection
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        await this.validateTabSecurity(tabId, tab.url)
      }
    })

    // Monitor extension API usage
    if (chrome.webRequest) {
      chrome.webRequest.onBeforeRequest.addListener(
        this.validateWebRequest.bind(this),
        { urls: ['<all_urls>'] },
        ['requestBody']
      )
    }
  }

  private async validateTabSecurity(tabId: number, url: string): Promise<void> {
    try {
      // Check if URL is in allowed list
      const isAllowedOrigin = await this.validateOrigin(url)
      if (!isAllowedOrigin) {
        await this.auditLogger.logSecurityEvent({
          type: 'suspicious_origin',
          tabId,
          url,
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error('Tab security validation failed:', error)
    }
  }

  private validateWebRequest(details: chrome.webRequest.WebRequestDetails): void {
    // Monitor for potential data exfiltration
    if (details.requestBody && details.url) {
      this.analyzeRequestForSensitiveData(details)
    }
  }

  private async analyzeRequestForSensitiveData(
    details: chrome.webRequest.WebRequestDetails
  ): Promise<void> {
    const sensitivePatterns = [
      /password/i,
      /credit.?card/i,
      /ssn/i,
      /social.?security/i,
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ // Credit card pattern
    ]

    const bodyText = JSON.stringify(details.requestBody)

    for (const pattern of sensitivePatterns) {
      if (pattern.test(bodyText)) {
        await this.auditLogger.logSecurityEvent({
          type: 'sensitive_data_detected',
          url: details.url,
          timestamp: new Date(),
          severity: 'critical'
        })
        break
      }
    }
  }

  private async validateOrigin(url: string): Promise<boolean> {
    const allowedOrigins = [
      'chat.openai.com',
      'claude.ai',
      'gemini.google.com',
      'localhost'
    ]

    try {
      const origin = new URL(url).hostname
      return allowedOrigins.some(allowed =>
        origin === allowed || origin.endsWith('.' + allowed)
      )
    } catch {
      return false
    }
  }

  private async performSecurityHealthCheck(): Promise<void> {
    // Check for updated security policies
    await this.checkForSecurityUpdates()

    // Validate current permissions
    const currentPermissions = await chrome.permissions.getAll()
    const permissionValidation = this.validatePermissions(currentPermissions.permissions || [])

    if (permissionValidation.length > 0) {
      await this.auditLogger.logSecurityEvent({
        type: 'permission_violation_detected',
        violations: permissionValidation.length,
        timestamp: new Date()
      })
    }
  }

  private async checkForSecurityUpdates(): Promise<void> {
    // Implementation would check for security policy updates
    // This could integrate with a security service or configuration management
  }
}

// Security audit logger
class SecurityAuditLogger {
  private auditQueue: SecurityAuditEntry[] = []

  async logSecurityAudit(entry: SecurityAuditEntry): Promise<void> {
    const auditEntry = {
      ...entry,
      id: generateAuditId(),
      timestamp: entry.timestamp || new Date()
    }

    this.auditQueue.push(auditEntry)

    // Persist to secure storage
    await this.persistAuditLog(auditEntry)

    // Send to monitoring service if configured
    await this.sendToMonitoringService(auditEntry)
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditEntry: SecurityAuditEntry = {
      type: 'security_event',
      data: event,
      timestamp: new Date()
    }

    await this.logSecurityAudit(auditEntry)
  }

  private async persistAuditLog(entry: SecurityAuditEntry): Promise<void> {
    try {
      const existingLogs = await this.getStoredAuditLogs()
      const updatedLogs = [...existingLogs, entry].slice(-1000) // Keep last 1000 entries

      await chrome.storage.local.set({
        securityAuditLogs: JSON.stringify(updatedLogs)
      })
    } catch (error) {
      console.error('Failed to persist security audit log:', error)
    }
  }

  private async getStoredAuditLogs(): Promise<SecurityAuditEntry[]> {
    try {
      const result = await chrome.storage.local.get(['securityAuditLogs'])
      return result.securityAuditLogs ? JSON.parse(result.securityAuditLogs) : []
    } catch {
      return []
    }
  }

  private async sendToMonitoringService(entry: SecurityAuditEntry): Promise<void> {
    // Implementation would send to external monitoring service
    // Only if user has opted in to telemetry
  }
}

function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export security manager instance
export const extensionSecurityManager = new ExtensionSecurityManager()
```

### AI Safety and Privacy Framework

#### AI Content Safety Manager
```typescript
// security/ai-safety-manager.ts
interface PromptSafetyResult {
  isSafe: boolean
  confidence: number
  flags: SafetyFlag[]
  sanitizedPrompt?: string
  recommendation: 'allow' | 'sanitize' | 'block'
}

interface SafetyFlag {
  type: 'prompt_injection' | 'pii_detection' | 'harmful_content' | 'policy_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location?: { start: number; end: number }
}

interface AIResponseSafetyCheck {
  isSafe: boolean
  containsPII: boolean
  toxicityScore: number
  flags: SafetyFlag[]
  sanitizedResponse?: string
}

class AISafetyManager {
  private promptInjectionDetector: PromptInjectionDetector
  private piiDetector: PIIDetector
  private toxicityFilter: ToxicityFilter
  private auditLogger: AISafetyAuditLogger

  constructor() {
    this.promptInjectionDetector = new PromptInjectionDetector()
    this.piiDetector = new PIIDetector()
    this.toxicityFilter = new ToxicityFilter()
    this.auditLogger = new AISafetyAuditLogger()
  }

  async validatePromptSafety(userPrompt: string): Promise<PromptSafetyResult> {
    const flags: SafetyFlag[] = []
    let sanitizedPrompt = userPrompt

    // Check for prompt injection attempts
    const injectionResult = await this.promptInjectionDetector.analyze(userPrompt)
    if (!injectionResult.isSafe) {
      flags.push(...injectionResult.flags)
      if (injectionResult.sanitizedText) {
        sanitizedPrompt = injectionResult.sanitizedText
      }
    }

    // Check for PII in the prompt
    const piiResult = await this.piiDetector.analyze(userPrompt)
    if (piiResult.containsPII) {
      flags.push(...piiResult.flags)
      if (piiResult.redactedText) {
        sanitizedPrompt = piiResult.redactedText
      }
    }

    // Check for harmful content
    const toxicityResult = await this.toxicityFilter.analyze(userPrompt)
    if (toxicityResult.toxicityScore > 0.7) {
      flags.push({
        type: 'harmful_content',
        severity: toxicityResult.toxicityScore > 0.9 ? 'critical' : 'high',
        description: 'Content may violate usage policies'
      })
    }

    // Determine overall safety and recommendation
    const criticalFlags = flags.filter(f => f.severity === 'critical')
    const highFlags = flags.filter(f => f.severity === 'high')

    let recommendation: PromptSafetyResult['recommendation'] = 'allow'
    let isSafe = true

    if (criticalFlags.length > 0) {
      recommendation = 'block'
      isSafe = false
    } else if (highFlags.length > 0 || flags.length > 2) {
      recommendation = 'sanitize'
      isSafe = false
    } else if (flags.length > 0) {
      recommendation = 'sanitize'
    }

    const confidence = this.calculateConfidenceScore(flags, userPrompt)

    // Log safety check
    await this.auditLogger.logSafetyCheck({
      type: 'prompt_validation',
      input: userPrompt.substring(0, 100) + '...', // Log only first 100 chars
      result: recommendation,
      flags: flags.length,
      timestamp: new Date()
    })

    return {
      isSafe,
      confidence,
      flags,
      sanitizedPrompt: sanitizedPrompt !== userPrompt ? sanitizedPrompt : undefined,
      recommendation
    }
  }

  async validateAIResponse(response: string, context: string): Promise<AIResponseSafetyCheck> {
    const flags: SafetyFlag[] = []

    // Check for PII in response
    const piiResult = await this.piiDetector.analyze(response)

    // Check toxicity
    const toxicityResult = await this.toxicityFilter.analyze(response)

    // Check for policy violations
    const policyViolations = await this.checkPolicyViolations(response, context)

    const containsPII = piiResult.containsPII
    if (containsPII) {
      flags.push(...piiResult.flags)
    }

    if (toxicityResult.toxicityScore > 0.5) {
      flags.push({
        type: 'harmful_content',
        severity: toxicityResult.toxicityScore > 0.8 ? 'high' : 'medium',
        description: `Potential harmful content detected (score: ${toxicityResult.toxicityScore.toFixed(2)})`
      })
    }

    flags.push(...policyViolations)

    const sanitizedResponse = containsPII && piiResult.redactedText
      ? piiResult.redactedText
      : undefined

    // Log response safety check
    await this.auditLogger.logSafetyCheck({
      type: 'response_validation',
      input: response.substring(0, 100) + '...',
      result: flags.length > 0 ? 'flagged' : 'clean',
      flags: flags.length,
      timestamp: new Date()
    })

    return {
      isSafe: flags.filter(f => f.severity === 'high' || f.severity === 'critical').length === 0,
      containsPII,
      toxicityScore: toxicityResult.toxicityScore,
      flags,
      sanitizedResponse
    }
  }

  private calculateConfidenceScore(flags: SafetyFlag[], text: string): number {
    let baseConfidence = 0.9

    // Reduce confidence based on flags
    const severityWeights = { low: 0.05, medium: 0.1, high: 0.2, critical: 0.4 }

    for (const flag of flags) {
      baseConfidence -= severityWeights[flag.severity]
    }

    // Adjust based on text characteristics
    const textLength = text.length
    if (textLength < 10) {
      baseConfidence -= 0.2 // Very short text is harder to analyze
    } else if (textLength > 5000) {
      baseConfidence -= 0.1 // Very long text may have edge cases
    }

    return Math.max(0, Math.min(1, baseConfidence))
  }

  private async checkPolicyViolations(response: string, context: string): Promise<SafetyFlag[]> {
    const flags: SafetyFlag[] = []

    // Check for code generation that might be harmful
    if (this.containsPotentiallyHarmfulCode(response)) {
      flags.push({
        type: 'policy_violation',
        severity: 'medium',
        description: 'Response contains potentially harmful code patterns'
      })
    }

    // Check for instructions that might violate policies
    if (this.containsProblematicInstructions(response)) {
      flags.push({
        type: 'policy_violation',
        severity: 'high',
        description: 'Response contains instructions that may violate usage policies'
      })
    }

    return flags
  }

  private containsPotentiallyHarmfulCode(text: string): boolean {
    const harmfulPatterns = [
      /eval\s*\(/i,
      /innerHTML\s*=/i,
      /document\.write/i,
      /\.exec\(/i,
      /system\s*\(/i,
      /shell_exec/i
    ]

    return harmfulPatterns.some(pattern => pattern.test(text))
  }

  private containsProblematicInstructions(text: string): boolean {
    const problematicPatterns = [
      /how to (hack|crack|exploit)/i,
      /bypass (security|authentication)/i,
      /create (virus|malware)/i,
      /illegal (activities|substances)/i
    ]

    return problematicPatterns.some(pattern => pattern.test(text))
  }
}

// Prompt injection detection
class PromptInjectionDetector {
  private knownInjectionPatterns: RegExp[]

  constructor() {
    this.knownInjectionPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /forget\s+(everything|all)\s+(you\s+)?know/i,
      /you\s+are\s+now\s+a/i,
      /new\s+instructions?:/i,
      /system\s*:\s*ignore/i,
      /\[INST\].*?\[\/INST\]/i, // Common instruction injection format
      /###\s*new\s+role/i,
      /act\s+as\s+if\s+you\s+are/i,
      /pretend\s+(you\s+are|to\s+be)/i
    ]
  }

  async analyze(text: string): Promise<{ isSafe: boolean; flags: SafetyFlag[]; sanitizedText?: string }> {
    const flags: SafetyFlag[] = []
    let sanitizedText = text

    for (const pattern of this.knownInjectionPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        const match = matches[0]
        const index = text.indexOf(match)

        flags.push({
          type: 'prompt_injection',
          severity: 'high',
          description: `Potential prompt injection detected: "${match.substring(0, 50)}..."`,
          location: { start: index, end: index + match.length }
        })

        // Sanitize by removing the injection attempt
        sanitizedText = sanitizedText.replace(pattern, '[REMOVED: Potential injection]')
      }
    }

    // Check for other suspicious patterns
    const suspiciousPhrases = [
      'jailbreak',
      'DAN mode',
      'developer mode',
      'admin override',
      'sudo mode'
    ]

    for (const phrase of suspiciousPhrases) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        flags.push({
          type: 'prompt_injection',
          severity: 'medium',
          description: `Suspicious phrase detected: "${phrase}"`
        })
      }
    }

    return {
      isSafe: flags.filter(f => f.severity === 'high' || f.severity === 'critical').length === 0,
      flags,
      sanitizedText: sanitizedText !== text ? sanitizedText : undefined
    }
  }
}

// PII Detection
class PIIDetector {
  private piiPatterns: Array<{ pattern: RegExp; type: string; severity: SafetyFlag['severity'] }>

  constructor() {
    this.piiPatterns = [
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: 'email',
        severity: 'medium'
      },
      {
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        type: 'ssn',
        severity: 'critical'
      },
      {
        pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        type: 'credit_card',
        severity: 'critical'
      },
      {
        pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g,
        type: 'phone',
        severity: 'low'
      },
      {
        pattern: /\b\d{1,5}\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/g,
        type: 'address',
        severity: 'medium'
      }
    ]
  }

  async analyze(text: string): Promise<{
    containsPII: boolean
    flags: SafetyFlag[]
    redactedText?: string
  }> {
    const flags: SafetyFlag[] = []
    let redactedText = text

    for (const { pattern, type, severity } of this.piiPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        for (const match of matches) {
          flags.push({
            type: 'pii_detection',
            severity,
            description: `${type.toUpperCase()} detected: ${match.substring(0, 10)}...`
          })

          // Redact the PII
          redactedText = redactedText.replace(match, `[${type.toUpperCase()}_REDACTED]`)
        }
      }
    }

    return {
      containsPII: flags.length > 0,
      flags,
      redactedText: redactedText !== text ? redactedText : undefined
    }
  }
}

// Toxicity filtering
class ToxicityFilter {
  async analyze(text: string): Promise<{ toxicityScore: number }> {
    // In a real implementation, this would use a toxicity detection service
    // or local model like Perspective API

    const toxicKeywords = [
      'hate', 'violence', 'threat', 'harassment', 'abuse',
      'discrimination', 'offensive', 'harmful'
    ]

    let toxicityScore = 0
    const words = text.toLowerCase().split(/\s+/)
    const toxicCount = words.filter(word =>
      toxicKeywords.some(keyword => word.includes(keyword))
    ).length

    toxicityScore = Math.min(toxicCount / words.length * 10, 1.0)

    return { toxicityScore }
  }
}

// AI Safety audit logger
class AISafetyAuditLogger {
  async logSafetyCheck(entry: any): Promise<void> {
    try {
      const auditEntry = {
        ...entry,
        id: `safety_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: entry.timestamp || new Date()
      }

      // Store in secure storage
      const existingLogs = await this.getStoredSafetyLogs()
      const updatedLogs = [...existingLogs, auditEntry].slice(-500) // Keep last 500 entries

      await chrome.storage.local.set({
        aiSafetyLogs: JSON.stringify(updatedLogs)
      })

    } catch (error) {
      console.error('Failed to log AI safety check:', error)
    }
  }

  private async getStoredSafetyLogs(): Promise<any[]> {
    try {
      const result = await chrome.storage.local.get(['aiSafetyLogs'])
      return result.aiSafetyLogs ? JSON.parse(result.aiSafetyLogs) : []
    } catch {
      return []
    }
  }
}

// Export AI safety manager instance
export const aiSafetyManager = new AISafetyManager()
```

### GDPR Compliance Framework

#### Privacy Compliance Manager
```typescript
// compliance/privacy-compliance-manager.ts
interface ConsentRecord {
  userId: string
  consentType: 'functional' | 'analytics' | 'marketing' | 'ai_processing'
  granted: boolean
  timestamp: Date
  version: string
  ipAddress?: string
  userAgent?: string
}

interface DataProcessingRecord {
  userId: string
  dataType: 'conversation' | 'preferences' | 'analytics' | 'ai_interactions'
  operation: 'collect' | 'process' | 'store' | 'share' | 'delete'
  purpose: string
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  timestamp: Date
  retentionPeriod?: number // in days
}

interface PrivacyRights {
  access: boolean
  rectification: boolean
  erasure: boolean
  restriction: boolean
  portability: boolean
  objection: boolean
}

class PrivacyComplianceManager {
  private consentStorage: ConsentStorage
  private dataProcessor: GDPRDataProcessor
  private auditLogger: PrivacyAuditLogger

  constructor() {
    this.consentStorage = new ConsentStorage()
    this.dataProcessor = new GDPRDataProcessor()
    this.auditLogger = new PrivacyAuditLogger()
  }

  // Consent Management
  async recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const consentRecord: ConsentRecord = {
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      version: '1.0',
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent
    }

    await this.consentStorage.storeConsent(consentRecord)

    // Log for audit
    await this.auditLogger.logPrivacyEvent({
      type: 'consent_recorded',
      userId,
      details: { consentType, granted },
      timestamp: new Date()
    })

    // Update data processing permissions
    await this.updateDataProcessingPermissions(userId)
  }

  async getConsentStatus(userId: string): Promise<Map<string, boolean>> {
    const consents = await this.consentStorage.getConsents(userId)
    const consentMap = new Map<string, boolean>()

    for (const consent of consents) {
      consentMap.set(consent.consentType, consent.granted)
    }

    return consentMap
  }

  async withdrawConsent(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): Promise<void> {
    await this.recordConsent(userId, consentType, false)

    // Trigger data processing restrictions
    await this.restrictDataProcessing(userId, consentType)

    await this.auditLogger.logPrivacyEvent({
      type: 'consent_withdrawn',
      userId,
      details: { consentType },
      timestamp: new Date()
    })
  }

  // Data Subject Rights
  async handleDataAccessRequest(userId: string): Promise<PersonalDataExport> {
    const consents = await this.consentStorage.getConsents(userId)
    const processingRecords = await this.getProcessingRecords(userId)
    const personalData = await this.dataProcessor.extractPersonalData(userId)

    const exportData: PersonalDataExport = {
      userId,
      exportDate: new Date(),
      consents: consents.map(consent => ({
        type: consent.consentType,
        granted: consent.granted,
        timestamp: consent.timestamp,
        version: consent.version
      })),
      personalData: personalData,
      processingHistory: processingRecords
    }

    await this.auditLogger.logPrivacyEvent({
      type: 'data_access_request',
      userId,
      timestamp: new Date()
    })

    return exportData
  }

  async handleDataErasureRequest(userId: string): Promise<ErasureResult> {
    // Verify right to erasure applies
    const erasureValidation = await this.validateErasureRequest(userId)
    if (!erasureValidation.canErase) {
      throw new Error(`Cannot erase data: ${erasureValidation.reason}`)
    }

    // Perform data erasure
    const erasureResult = await this.dataProcessor.erasePersonalData(userId)

    // Update consent records to reflect deletion
    await this.consentStorage.markAsDeleted(userId)

    await this.auditLogger.logPrivacyEvent({
      type: 'data_erasure_completed',
      userId,
      details: erasureResult,
      timestamp: new Date()
    })

    return erasureResult
  }

  async handleDataPortabilityRequest(userId: string): Promise<PortabilityExport> {
    const portableData = await this.dataProcessor.extractPortableData(userId)

    const exportData: PortabilityExport = {
      userId,
      exportDate: new Date(),
      format: 'json',
      data: portableData
    }

    await this.auditLogger.logPrivacyEvent({
      type: 'data_portability_request',
      userId,
      timestamp: new Date()
    })

    return exportData
  }

  async handleDataRectificationRequest(
    userId: string,
    corrections: Record<string, any>
  ): Promise<void> {
    await this.dataProcessor.rectifyPersonalData(userId, corrections)

    await this.auditLogger.logPrivacyEvent({
      type: 'data_rectification',
      userId,
      details: Object.keys(corrections),
      timestamp: new Date()
    })
  }

  // Data Processing Compliance
  async recordDataProcessing(
    userId: string,
    dataType: DataProcessingRecord['dataType'],
    operation: DataProcessingRecord['operation'],
    purpose: string,
    legalBasis: DataProcessingRecord['legalBasis'],
    retentionPeriod?: number
  ): Promise<void> {
    const record: DataProcessingRecord = {
      userId,
      dataType,
      operation,
      purpose,
      legalBasis,
      timestamp: new Date(),
      retentionPeriod
    }

    await this.storeProcessingRecord(record)

    // Check if operation is permitted
    if (!(await this.isOperationPermitted(userId, dataType, operation, legalBasis))) {
      throw new Error(`Data processing operation not permitted: ${operation} on ${dataType}`)
    }
  }

  private async isOperationPermitted(
    userId: string,
    dataType: DataProcessingRecord['dataType'],
    operation: DataProcessingRecord['operation'],
    legalBasis: DataProcessingRecord['legalBasis']
  ): Promise<boolean> {
    // Check if consent is required and granted
    if (legalBasis === 'consent') {
      const consents = await this.getConsentStatus(userId)

      const requiredConsentType = this.getRequiredConsentType(dataType, operation)
      if (requiredConsentType && !consents.get(requiredConsentType)) {
        return false
      }
    }

    // Check if processing is restricted
    const restrictions = await this.getProcessingRestrictions(userId)
    if (restrictions.has(dataType) && !this.isOperationExempt(operation)) {
      return false
    }

    return true
  }

  private getRequiredConsentType(
    dataType: DataProcessingRecord['dataType'],
    operation: DataProcessingRecord['operation']
  ): ConsentRecord['consentType'] | null {
    const consentMapping = {
      conversation: 'ai_processing',
      preferences: 'functional',
      analytics: 'analytics',
      ai_interactions: 'ai_processing'
    }

    return consentMapping[dataType] || null
  }

  private isOperationExempt(operation: DataProcessingRecord['operation']): boolean {
    // Some operations are exempt from restrictions (e.g., deletion for compliance)
    return ['delete'].includes(operation)
  }

  // Data Retention Management
  async enforceDataRetention(): Promise<void> {
    const retentionPolicies = await this.getRetentionPolicies()

    for (const policy of retentionPolicies) {
      const expiredData = await this.findExpiredData(policy)

      for (const dataItem of expiredData) {
        await this.dataProcessor.deleteExpiredData(dataItem)

        await this.auditLogger.logPrivacyEvent({
          type: 'data_retention_deletion',
          userId: dataItem.userId,
          details: { dataType: dataItem.dataType, expiry: dataItem.expiry },
          timestamp: new Date()
        })
      }
    }
  }

  private async findExpiredData(policy: RetentionPolicy): Promise<ExpiredDataItem[]> {
    const cutoffDate = new Date(Date.now() - policy.retentionPeriod * 24 * 60 * 60 * 1000)
    return this.dataProcessor.findDataOlderThan(policy.dataType, cutoffDate)
  }

  // Privacy Impact Assessment
  async conductPrivacyImpactAssessment(
    processingActivity: string,
    dataTypes: string[],
    purposes: string[]
  ): Promise<PrivacyImpactAssessment> {
    const riskFactors = await this.identifyRiskFactors(dataTypes, purposes)
    const mitigationMeasures = await this.identifyMitigations(riskFactors)

    const assessment: PrivacyImpactAssessment = {
      activityName: processingActivity,
      assessmentDate: new Date(),
      dataTypes,
      purposes,
      riskFactors,
      mitigationMeasures,
      overallRiskLevel: this.calculateOverallRisk(riskFactors),
      recommendations: this.generateRecommendations(riskFactors, mitigationMeasures)
    }

    await this.auditLogger.logPrivacyEvent({
      type: 'privacy_impact_assessment',
      details: { activity: processingActivity, riskLevel: assessment.overallRiskLevel },
      timestamp: new Date()
    })

    return assessment
  }

  private async identifyRiskFactors(dataTypes: string[], purposes: string[]): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = []

    // Check for high-risk data types
    const highRiskTypes = ['conversation', 'ai_interactions', 'personal_identifiers']
    for (const dataType of dataTypes) {
      if (highRiskTypes.includes(dataType)) {
        riskFactors.push({
          type: 'data_sensitivity',
          description: `Processing of sensitive data type: ${dataType}`,
          severity: 'high'
        })
      }
    }

    // Check for automated decision making
    if (purposes.includes('automated_decision_making')) {
      riskFactors.push({
        type: 'automated_processing',
        description: 'Automated decision making based on personal data',
        severity: 'high'
      })
    }

    // Check for cross-border transfers
    if (purposes.includes('data_transfer')) {
      riskFactors.push({
        type: 'data_transfer',
        description: 'Cross-border data transfer',
        severity: 'medium'
      })
    }

    return riskFactors
  }

  private calculateOverallRisk(riskFactors: RiskFactor[]): 'low' | 'medium' | 'high' {
    const highRiskCount = riskFactors.filter(rf => rf.severity === 'high').length
    const mediumRiskCount = riskFactors.filter(rf => rf.severity === 'medium').length

    if (highRiskCount > 0) return 'high'
    if (mediumRiskCount > 1) return 'medium'
    return 'low'
  }
}

// Export privacy compliance manager
export const privacyComplianceManager = new PrivacyComplianceManager()
```

This comprehensive security and compliance patterns skill provides robust frameworks for browser extension security, AI safety measures, and GDPR compliance, ensuring applications meet enterprise-grade security and privacy requirements.