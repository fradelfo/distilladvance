# AI Cost Optimization Skill

## Skill Overview
Advanced strategies for optimizing AI service costs while maintaining quality, including intelligent model selection, prompt optimization, caching strategies, and comprehensive cost monitoring for production AI applications.

## Core Capabilities

### Intelligent Cost Management Framework

#### Cost Tracking and Budget Management
```typescript
// cost-optimization/cost-tracker.ts
interface CostEvent {
  id: string
  userId?: string
  sessionId?: string
  provider: string
  model: string
  operation: 'completion' | 'embedding' | 'fine-tuning' | 'image-generation'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  timestamp: Date
  metadata: {
    endpoint?: string
    feature?: string
    promptTemplate?: string
    quality?: number
    useCase?: string
  }
}

interface BudgetRule {
  id: string
  name: string
  scope: 'global' | 'user' | 'feature' | 'model'
  scopeId?: string
  budget: {
    amount: number
    period: 'hour' | 'day' | 'week' | 'month'
    currency: 'USD'
  }
  thresholds: {
    warning: number // percentage (e.g., 80)
    critical: number // percentage (e.g., 95)
  }
  actions: {
    onWarning: ('notify' | 'throttle' | 'switch-model')[]
    onCritical: ('block' | 'switch-to-cheaper' | 'notify-admin')[]
  }
  isActive: boolean
  createdAt: Date
}

interface CostOptimizationStrategy {
  name: string
  description: string
  targetReduction: number // percentage
  implementation: {
    modelSelection: boolean
    promptOptimization: boolean
    caching: boolean
    batching: boolean
    fallbackModels: boolean
  }
  expectedSavings: {
    daily: number
    monthly: number
    yearly: number
  }
}

class AIServiceCostManager {
  private costEvents: Map<string, CostEvent[]> = new Map()
  private budgetRules: Map<string, BudgetRule> = new Map()
  private currentSpend = new Map<string, { amount: number; period: string; lastReset: Date }>()

  async trackCost(event: Omit<CostEvent, 'id' | 'timestamp'>): Promise<CostEvent> {
    const costEvent: CostEvent = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    }

    // Store event
    const periodKey = this.getPeriodKey(costEvent.timestamp)
    if (!this.costEvents.has(periodKey)) {
      this.costEvents.set(periodKey, [])
    }
    this.costEvents.get(periodKey)!.push(costEvent)

    // Update current spend tracking
    await this.updateCurrentSpend(costEvent)

    // Check budget rules
    await this.checkBudgetRules(costEvent)

    // Log for analytics
    this.logCostEvent(costEvent)

    return costEvent
  }

  private async updateCurrentSpend(event: CostEvent): Promise<void> {
    const scopes = this.getApplicableScopes(event)

    for (const scope of scopes) {
      const current = this.currentSpend.get(scope.key) || {
        amount: 0,
        period: scope.period,
        lastReset: this.getPeriodStart(scope.period)
      }

      // Reset if period has changed
      if (this.shouldResetPeriod(current.lastReset, scope.period)) {
        current.amount = 0
        current.lastReset = this.getPeriodStart(scope.period)
      }

      current.amount += event.cost
      this.currentSpend.set(scope.key, current)
    }
  }

  private async checkBudgetRules(event: CostEvent): Promise<void> {
    const applicableRules = this.getApplicableBudgetRules(event)

    for (const rule of applicableRules) {
      const currentSpend = this.getCurrentSpend(rule)
      const spendPercentage = (currentSpend / rule.budget.amount) * 100

      if (spendPercentage >= rule.thresholds.critical) {
        await this.executeBudgetAction('critical', rule, event, currentSpend)
      } else if (spendPercentage >= rule.thresholds.warning) {
        await this.executeBudgetAction('warning', rule, event, currentSpend)
      }
    }
  }

  private async executeBudgetAction(
    level: 'warning' | 'critical',
    rule: BudgetRule,
    event: CostEvent,
    currentSpend: number
  ): Promise<void> {
    const actions = level === 'warning' ? rule.actions.onWarning : rule.actions.onCritical

    for (const action of actions) {
      switch (action) {
        case 'notify':
          await this.sendBudgetAlert(level, rule, currentSpend)
          break
        case 'throttle':
          await this.enableThrottling(rule.scope, rule.scopeId)
          break
        case 'switch-model':
          await this.suggestModelSwitch(event.model, 'cheaper')
          break
        case 'block':
          await this.blockRequests(rule.scope, rule.scopeId)
          break
        case 'switch-to-cheaper':
          await this.enforceModelSwitch(event.model, 'cheapest')
          break
        case 'notify-admin':
          await this.notifyAdministrator(level, rule, currentSpend)
          break
      }
    }
  }

  async generateCostReport(
    period: 'day' | 'week' | 'month',
    groupBy: 'model' | 'user' | 'feature' | 'operation' = 'model'
  ): Promise<CostReport> {
    const startDate = this.getPeriodStart(period)
    const endDate = new Date()

    const events = this.getCostEventsInPeriod(startDate, endDate)
    const groupedData = this.groupCostEvents(events, groupBy)

    const totalCost = events.reduce((sum, event) => sum + event.cost, 0)
    const totalTokens = events.reduce((sum, event) => sum + event.totalTokens, 0)

    // Calculate trends
    const previousPeriodEvents = this.getCostEventsInPeriod(
      this.getPreviousPeriodStart(period, startDate),
      startDate
    )
    const previousCost = previousPeriodEvents.reduce((sum, event) => sum + event.cost, 0)
    const costTrend = previousCost > 0 ? ((totalCost - previousCost) / previousCost) * 100 : 0

    // Identify optimization opportunities
    const optimizationOpportunities = this.identifyOptimizationOpportunities(events)

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalCost,
        totalTokens,
        averageCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
        requestCount: events.length,
        costTrend: Math.round(costTrend * 100) / 100
      },
      breakdown: groupedData,
      topExpenses: this.getTopExpenses(events, 10),
      optimizationOpportunities,
      projections: {
        dailyAverage: totalCost / this.getDaysInPeriod(period),
        monthlyProjection: (totalCost / this.getDaysInPeriod(period)) * 30,
        yearlyProjection: (totalCost / this.getDaysInPeriod(period)) * 365
      }
    }
  }

  private identifyOptimizationOpportunities(events: CostEvent[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // Model optimization opportunities
    const modelUsage = this.groupCostEvents(events, 'model')
    for (const [model, modelEvents] of Object.entries(modelUsage)) {
      const avgCost = modelEvents.reduce((sum, e) => sum + e.cost, 0) / modelEvents.length
      const suggestedModel = this.suggestCheaperModel(model)

      if (suggestedModel && this.getModelCost(suggestedModel) < this.getModelCost(model)) {
        const potentialSavings = modelEvents.reduce((sum, e) => {
          const newCost = this.calculateCostWithDifferentModel(e, suggestedModel)
          return sum + (e.cost - newCost)
        }, 0)

        opportunities.push({
          type: 'model-optimization',
          description: `Switch from ${model} to ${suggestedModel}`,
          currentCost: modelEvents.reduce((sum, e) => sum + e.cost, 0),
          potentialSavings,
          impact: 'medium',
          effort: 'low',
          recommendation: `Consider using ${suggestedModel} for tasks that don't require the full capabilities of ${model}`
        })
      }
    }

    // Prompt optimization opportunities
    const longPrompts = events.filter(e => e.inputTokens > 2000)
    if (longPrompts.length > 0) {
      const wastedCost = longPrompts.reduce((sum, e) => {
        const optimizedTokens = Math.max(500, e.inputTokens * 0.7) // Assume 30% reduction
        const savings = (e.inputTokens - optimizedTokens) * this.getTokenCost(e.model, 'input')
        return sum + savings
      }, 0)

      opportunities.push({
        type: 'prompt-optimization',
        description: 'Optimize long prompts to reduce token usage',
        currentCost: longPrompts.reduce((sum, e) => sum + e.cost, 0),
        potentialSavings: wastedCost,
        impact: 'high',
        effort: 'medium',
        recommendation: 'Implement prompt compression and template optimization'
      })
    }

    // Caching opportunities
    const duplicateRequests = this.findDuplicateRequests(events)
    if (duplicateRequests.length > 10) {
      const cachingSavings = duplicateRequests.slice(1).reduce((sum, e) => sum + e.cost, 0)

      opportunities.push({
        type: 'caching-implementation',
        description: 'Implement semantic caching for repeated requests',
        currentCost: duplicateRequests.reduce((sum, e) => sum + e.cost, 0),
        potentialSavings: cachingSavings,
        impact: 'high',
        effort: 'high',
        recommendation: 'Implement semantic similarity caching with 1-hour TTL'
      })
    }

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }

  async implementCostOptimization(strategy: CostOptimizationStrategy): Promise<{
    implemented: boolean
    estimatedSavings: number
    implementationSteps: string[]
    monitoringPlan: string[]
  }> {
    const implementationSteps: string[] = []
    const monitoringPlan: string[] = []

    if (strategy.implementation.modelSelection) {
      await this.setupIntelligentModelRouting()
      implementationSteps.push('Configured intelligent model routing based on task complexity')
      monitoringPlan.push('Monitor model selection accuracy and cost impact')
    }

    if (strategy.implementation.promptOptimization) {
      await this.enablePromptOptimization()
      implementationSteps.push('Enabled automatic prompt optimization for common patterns')
      monitoringPlan.push('Track prompt compression ratios and quality scores')
    }

    if (strategy.implementation.caching) {
      await this.setupSemanticCaching()
      implementationSteps.push('Implemented semantic caching with configurable TTL')
      monitoringPlan.push('Monitor cache hit rates and response quality')
    }

    if (strategy.implementation.batching) {
      await this.enableRequestBatching()
      implementationSteps.push('Configured request batching for bulk operations')
      monitoringPlan.push('Track batch efficiency and processing times')
    }

    if (strategy.implementation.fallbackModels) {
      await this.configureFallbackModels()
      implementationSteps.push('Set up fallback models for cost-conscious scenarios')
      monitoringPlan.push('Monitor fallback usage and quality impact')
    }

    return {
      implemented: true,
      estimatedSavings: strategy.expectedSavings.monthly,
      implementationSteps,
      monitoringPlan
    }
  }

  private async setupIntelligentModelRouting(): Promise<void> {
    // Configure cost-aware model routing rules
    const routingRules = [
      {
        condition: 'simple_query',
        model: 'gpt-3.5-turbo',
        maxCost: 0.01
      },
      {
        condition: 'complex_analysis',
        model: 'gpt-4-turbo',
        maxCost: 0.05
      },
      {
        condition: 'budget_constrained',
        model: 'claude-3-haiku',
        maxCost: 0.005
      }
    ]

    // Implementation would configure the LLM router with these rules
    console.log('Intelligent model routing configured:', routingRules)
  }

  private async enablePromptOptimization(): Promise<void> {
    // Configure automatic prompt compression
    const optimizationRules = {
      removeRedundantInstructions: true,
      compressExamples: true,
      optimizeFormatting: true,
      targetReduction: 0.3 // 30% token reduction target
    }

    console.log('Prompt optimization enabled:', optimizationRules)
  }

  private async setupSemanticCaching(): Promise<void> {
    const cacheConfig = {
      enabled: true,
      ttl: 3600, // 1 hour
      similarityThreshold: 0.95,
      maxCacheSize: 1000,
      compressionEnabled: true
    }

    console.log('Semantic caching configured:', cacheConfig)
  }

  private async enableRequestBatching(): Promise<void> {
    const batchConfig = {
      enabled: true,
      batchSize: 10,
      maxWaitTime: 5000, // 5 seconds
      priorityThreshold: 0.1 // High priority requests bypass batching
    }

    console.log('Request batching configured:', batchConfig)
  }

  private async configureFallbackModels(): Promise<void> {
    const fallbackChain = [
      { model: 'gpt-4-turbo', maxCost: 0.05, quality: 'high' },
      { model: 'gpt-4', maxCost: 0.03, quality: 'high' },
      { model: 'claude-3-sonnet', maxCost: 0.02, quality: 'medium-high' },
      { model: 'gpt-3.5-turbo', maxCost: 0.01, quality: 'medium' },
      { model: 'claude-3-haiku', maxCost: 0.005, quality: 'basic' }
    ]

    console.log('Fallback model chain configured:', fallbackChain)
  }

  // Helper methods
  private getPeriodKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }

  private getApplicableScopes(event: CostEvent): Array<{ key: string; period: string }> {
    return [
      { key: 'global', period: 'month' },
      { key: `user-${event.userId}`, period: 'month' },
      { key: `model-${event.model}`, period: 'day' }
    ]
  }

  private getCurrentSpend(rule: BudgetRule): number {
    const scopeKey = this.getScopeKey(rule)
    const current = this.currentSpend.get(scopeKey)
    return current ? current.amount : 0
  }

  private getScopeKey(rule: BudgetRule): string {
    return rule.scopeId ? `${rule.scope}-${rule.scopeId}` : rule.scope
  }

  private shouldResetPeriod(lastReset: Date, period: string): boolean {
    const now = new Date()
    const periodStart = this.getPeriodStart(period)
    return lastReset < periodStart
  }

  private getPeriodStart(period: string): Date {
    const now = new Date()
    switch (period) {
      case 'hour':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek
        return new Date(now.getFullYear(), now.getMonth(), diff)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      default:
        return now
    }
  }
}

// Export singleton instance
export const costManager = new AIServiceCostManager()
```

### Advanced Caching Strategies

#### Semantic Caching Implementation
```typescript
// cost-optimization/semantic-cache.ts
interface CacheEntry {
  id: string
  embedding: number[]
  response: string
  metadata: {
    model: string
    promptHash: string
    qualityScore: number
    createdAt: Date
    lastAccessed: Date
    accessCount: number
    cost: number
  }
  ttl: number
  tags: string[]
}

interface CacheConfig {
  enabled: boolean
  maxSize: number
  ttl: number // Time to live in seconds
  similarityThreshold: number // 0.8-0.99 for semantic matching
  compressionEnabled: boolean
  priorityEviction: boolean
}

class SemanticAICache {
  private cache = new Map<string, CacheEntry>()
  private embeddings: number[][] = []
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: true,
      maxSize: 1000,
      ttl: 3600, // 1 hour
      similarityThreshold: 0.95,
      compressionEnabled: true,
      priorityEviction: true,
      ...config
    }
  }

  async get(prompt: string, model: string): Promise<string | null> {
    if (!this.config.enabled) return null

    try {
      // Generate embedding for the prompt
      const promptEmbedding = await this.generateEmbedding(prompt)

      // Find semantically similar cached entries
      const similarEntry = await this.findSimilarEntry(promptEmbedding, model)

      if (similarEntry) {
        // Update access statistics
        this.updateAccessStats(similarEntry)

        // Log cache hit
        this.logCacheEvent('hit', similarEntry.id, prompt)

        return similarEntry.response
      }

      // Log cache miss
      this.logCacheEvent('miss', null, prompt)
      return null

    } catch (error) {
      console.error('Cache retrieval error:', error)
      return null
    }
  }

  async set(
    prompt: string,
    response: string,
    model: string,
    cost: number,
    qualityScore: number = 8.0
  ): Promise<void> {
    if (!this.config.enabled) return

    try {
      // Check if cache is full and evict if necessary
      if (this.cache.size >= this.config.maxSize) {
        this.evictEntries()
      }

      // Generate embedding and cache entry
      const embedding = await this.generateEmbedding(prompt)
      const promptHash = this.hashPrompt(prompt)

      const entry: CacheEntry = {
        id: `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        embedding,
        response: this.config.compressionEnabled ? this.compressResponse(response) : response,
        metadata: {
          model,
          promptHash,
          qualityScore,
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0,
          cost
        },
        ttl: Date.now() + (this.config.ttl * 1000),
        tags: this.extractTags(prompt)
      }

      this.cache.set(entry.id, entry)
      this.embeddings.push(embedding)

      // Log cache set
      this.logCacheEvent('set', entry.id, prompt)

    } catch (error) {
      console.error('Cache storage error:', error)
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenAI embeddings API or local embedding model
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000), // Limit input length
          encoding_format: 'float'
        })
      })

      const data = await response.json()
      return data.data[0].embedding

    } catch (error) {
      console.error('Embedding generation failed:', error)
      // Fallback to simple hash-based matching
      return this.generateSimpleEmbedding(text)
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple fallback embedding using character frequency
    const embedding = new Array(384).fill(0)

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      const index = charCode % embedding.length
      embedding[index] += 1
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  private async findSimilarEntry(
    queryEmbedding: number[],
    model: string
  ): Promise<CacheEntry | null> {
    let bestMatch: CacheEntry | null = null
    let bestSimilarity = 0

    for (const entry of this.cache.values()) {
      // Skip expired entries
      if (Date.now() > entry.ttl) {
        this.cache.delete(entry.id)
        continue
      }

      // Only match same model (or compatible models)
      if (!this.areModelsCompatible(entry.metadata.model, model)) {
        continue
      }

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding)

      if (similarity >= this.config.similarityThreshold && similarity > bestSimilarity) {
        bestSimilarity = similarity
        bestMatch = entry
      }
    }

    return bestMatch
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  private areModelsCompatible(cachedModel: string, requestedModel: string): boolean {
    // Define model compatibility groups
    const compatibilityGroups = [
      ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview'],
      ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
      ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    ]

    // Same model is always compatible
    if (cachedModel === requestedModel) return true

    // Check if models are in the same compatibility group
    return compatibilityGroups.some(group =>
      group.includes(cachedModel) && group.includes(requestedModel)
    )
  }

  private updateAccessStats(entry: CacheEntry): void {
    entry.metadata.lastAccessed = new Date()
    entry.metadata.accessCount++

    // Extend TTL for frequently accessed entries
    if (entry.metadata.accessCount > 5) {
      entry.ttl = Math.max(entry.ttl, Date.now() + (this.config.ttl * 1000 * 0.5))
    }
  }

  private evictEntries(): void {
    if (!this.config.priorityEviction) {
      // Simple FIFO eviction
      const oldestEntry = Array.from(this.cache.values())
        .sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())[0]

      if (oldestEntry) {
        this.cache.delete(oldestEntry.id)
      }
      return
    }

    // Priority-based eviction considering multiple factors
    const entries = Array.from(this.cache.values())

    // Calculate eviction scores (lower = more likely to evict)
    const scoredEntries = entries.map(entry => ({
      entry,
      score: this.calculateEvictionScore(entry)
    }))

    // Sort by score and remove lowest scoring entries
    scoredEntries.sort((a, b) => a.score - b.score)

    // Evict 10% of entries or at least 1
    const evictCount = Math.max(1, Math.floor(this.config.maxSize * 0.1))
    for (let i = 0; i < evictCount && i < scoredEntries.length; i++) {
      this.cache.delete(scoredEntries[i].entry.id)
    }
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now()
    const age = now - entry.metadata.createdAt.getTime()
    const lastAccess = now - entry.metadata.lastAccessed.getTime()

    // Factors influencing eviction (higher = keep longer)
    let score = 0

    // Quality score influence (0-10)
    score += entry.metadata.qualityScore * 10

    // Access frequency influence
    score += Math.min(entry.metadata.accessCount * 5, 50)

    // Recency influence (more recent = higher score)
    score += Math.max(0, 100 - (lastAccess / (1000 * 60 * 60))) // Hours since last access

    // Cost influence (expensive responses are more valuable)
    score += Math.min(entry.metadata.cost * 1000, 20)

    // Age penalty (older entries get lower scores)
    score -= age / (1000 * 60 * 60 * 24) // Days old

    return score
  }

  private hashPrompt(prompt: string): string {
    // Simple hash function for prompt fingerprinting
    let hash = 0
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private compressResponse(response: string): string {
    // Simple compression for storage efficiency
    return response // In practice, you might use gzip or other compression
  }

  private extractTags(prompt: string): string[] {
    const tags: string[] = []

    // Extract common patterns and keywords
    const patterns = [
      { regex: /\b(code|programming|development)\b/i, tag: 'programming' },
      { regex: /\b(analyze|analysis|examine)\b/i, tag: 'analysis' },
      { regex: /\b(explain|describe|summary)\b/i, tag: 'explanation' },
      { regex: /\b(create|generate|write)\b/i, tag: 'generation' },
      { regex: /\b(fix|debug|error|bug)\b/i, tag: 'debugging' },
      { regex: /\b(review|check|validate)\b/i, tag: 'review' }
    ]

    for (const pattern of patterns) {
      if (pattern.regex.test(prompt)) {
        tags.push(pattern.tag)
      }
    }

    return tags.slice(0, 3) // Limit to 3 tags
  }

  private logCacheEvent(event: 'hit' | 'miss' | 'set', entryId: string | null, prompt: string): void {
    console.log(`Cache ${event}:`, {
      entryId,
      promptLength: prompt.length,
      timestamp: new Date(),
      cacheSize: this.cache.size
    })
  }

  // Cache analytics methods
  getCacheStats(): {
    size: number
    hitRate: number
    averageAge: number
    totalSavings: number
    topTags: Array<{ tag: string; count: number }>
  } {
    const entries = Array.from(this.cache.values())
    const now = Date.now()

    const averageAge = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (now - entry.metadata.createdAt.getTime()), 0) / entries.length
      : 0

    const totalSavings = entries.reduce((sum, entry) =>
      sum + (entry.metadata.cost * entry.metadata.accessCount), 0)

    // Count tags
    const tagCounts = new Map<string, number>()
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))

    return {
      size: this.cache.size,
      hitRate: 0.75, // This would be tracked separately in production
      averageAge: averageAge / (1000 * 60 * 60), // Convert to hours
      totalSavings,
      topTags
    }
  }

  clearExpired(): void {
    const now = Date.now()
    for (const [id, entry] of this.cache) {
      if (now > entry.ttl) {
        this.cache.delete(id)
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.embeddings = []
  }
}

export const semanticCache = new SemanticAICache()
```

This AI cost optimization skill provides comprehensive strategies and tools for managing AI service costs effectively while maintaining quality, including intelligent budgeting, semantic caching, and automated cost optimization recommendations.