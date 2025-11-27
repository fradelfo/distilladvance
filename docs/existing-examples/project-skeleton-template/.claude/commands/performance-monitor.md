---
name: performance-monitor
description: Comprehensive performance monitoring and optimization with real-time analytics and alerting
---

Use the devops-agent and quality-agent to coordinate comprehensive performance monitoring across browser extension, web application, and AI services:

**Performance Monitoring Strategy:**

**Phase 1: Monitoring Infrastructure Setup**
1. **Application Performance Monitoring (APM):**
   - Real-time application performance tracking
   - Distributed tracing across microservices
   - Error rate and latency monitoring
   - User experience performance metrics
   - Database query performance analysis

2. **Browser Extension Performance Monitoring:**
   - Extension load time and initialization metrics
   - Content script performance on target sites
   - Memory usage and leak detection
   - Background service worker performance
   - Cross-browser performance comparison

3. **AI Service Performance Monitoring:**
   - LLM response time and throughput metrics
   - Token usage and cost tracking
   - Model performance comparison
   - Prompt optimization effectiveness
   - Vector database query performance

**Phase 2: Real-Time Performance Dashboard**

**Application-Level Metrics:**
```typescript
// Performance monitoring service
class PerformanceMonitoringService {
  private metrics: MetricsCollector
  private alerts: AlertManager

  async trackWebVitals(): Promise<WebVitalsMetrics> {
    return {
      // Core Web Vitals
      fcp: await this.measureFirstContentfulPaint(),
      lcp: await this.measureLargestContentfulPaint(),
      fid: await this.measureFirstInputDelay(),
      cls: await this.measureCumulativeLayoutShift(),

      // Additional Performance Metrics
      ttfb: await this.measureTimeToFirstByte(),
      domContentLoaded: await this.measureDOMContentLoaded(),
      pageLoadComplete: await this.measurePageLoadComplete(),

      // Custom Metrics
      timeToInteractive: await this.measureTimeToInteractive(),
      firstMeaningfulPaint: await this.measureFirstMeaningfulPaint(),
      bundleSize: await this.getBundleSize(),

      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionType: navigator.connection?.effectiveType
    }
  }

  async trackAPIPerformance(endpoint: string, operation: () => Promise<any>) {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    try {
      const result = await operation()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()

      await this.recordMetric({
        type: 'api_performance',
        endpoint,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        success: true,
        timestamp: Date.now()
      })

      return result
    } catch (error) {
      const endTime = performance.now()

      await this.recordMetric({
        type: 'api_performance',
        endpoint,
        duration: endTime - startTime,
        success: false,
        error: error.message,
        timestamp: Date.now()
      })

      throw error
    }
  }
}
```

**Browser Extension Performance Tracking:**
```typescript
// Extension-specific performance monitoring
class ExtensionPerformanceMonitor {
  async trackExtensionLoad(): Promise<ExtensionLoadMetrics> {
    const loadStart = performance.now()

    // Track manifest loading
    const manifestLoadTime = await this.measureManifestLoad()

    // Track content script injection
    const contentScriptTimes = await this.measureContentScriptInjection()

    // Track background script initialization
    const backgroundLoadTime = await this.measureBackgroundScriptLoad()

    const totalLoadTime = performance.now() - loadStart

    return {
      totalLoadTime,
      manifestLoadTime,
      contentScriptTimes,
      backgroundLoadTime,
      memoryUsage: await this.getExtensionMemoryUsage(),
      storageUsage: await this.getExtensionStorageUsage(),
      timestamp: Date.now()
    }
  }

  async trackSiteCompatibility(site: string): Promise<SiteCompatibilityMetrics> {
    const siteStart = performance.now()

    try {
      // Test content script injection
      const injectionTime = await this.testContentScriptInjection(site)

      // Test chat detection
      const detectionTime = await this.testChatDetection(site)

      // Test data extraction
      const extractionTime = await this.testDataExtraction(site)

      const totalTime = performance.now() - siteStart

      return {
        site,
        compatible: true,
        totalTime,
        injectionTime,
        detectionTime,
        extractionTime,
        errorCount: 0,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        site,
        compatible: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  async trackCrossBrowserPerformance(): Promise<CrossBrowserMetrics[]> {
    const browsers = ['chrome', 'firefox', 'edge']
    const results = []

    for (const browser of browsers) {
      try {
        const metrics = await this.runBrowserSpecificTests(browser)
        results.push({
          browser,
          ...metrics,
          success: true
        })
      } catch (error) {
        results.push({
          browser,
          success: false,
          error: error.message
        })
      }
    }

    return results
  }
}
```

**AI Service Performance Monitoring:**
```typescript
// AI service performance tracking
class AIServicePerformanceMonitor {
  async trackLLMPerformance(provider: string, model: string): Promise<LLMMetrics> {
    const metrics = {
      provider,
      model,
      requests: [],
      summary: {
        avgResponseTime: 0,
        avgTokensPerSecond: 0,
        successRate: 0,
        costPerRequest: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      }
    }

    // Collect metrics over time window
    const testPrompts = [
      'Brief explanation request',
      'Medium complexity analysis',
      'Complex reasoning task'
    ]

    for (const prompt of testPrompts) {
      const startTime = performance.now()
      const startTokens = this.getTokenCount(prompt)

      try {
        const response = await this.callLLM(provider, model, prompt)
        const endTime = performance.now()
        const responseTokens = this.getTokenCount(response.content)

        metrics.requests.push({
          prompt: prompt.substring(0, 50),
          responseTime: endTime - startTime,
          inputTokens: startTokens,
          outputTokens: responseTokens,
          totalTokens: startTokens + responseTokens,
          tokensPerSecond: responseTokens / ((endTime - startTime) / 1000),
          cost: this.calculateCost(provider, model, startTokens, responseTokens),
          success: true,
          timestamp: Date.now()
        })
      } catch (error) {
        metrics.requests.push({
          prompt: prompt.substring(0, 50),
          responseTime: performance.now() - startTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        })
      }
    }

    // Calculate summary statistics
    const successfulRequests = metrics.requests.filter(r => r.success)
    if (successfulRequests.length > 0) {
      metrics.summary.avgResponseTime = this.calculateAverage(
        successfulRequests.map(r => r.responseTime)
      )
      metrics.summary.avgTokensPerSecond = this.calculateAverage(
        successfulRequests.map(r => r.tokensPerSecond)
      )
      metrics.summary.successRate = successfulRequests.length / metrics.requests.length
      metrics.summary.costPerRequest = this.calculateAverage(
        successfulRequests.map(r => r.cost)
      )
      metrics.summary.p95ResponseTime = this.calculatePercentile(
        successfulRequests.map(r => r.responseTime), 95
      )
    }

    return metrics
  }

  async trackVectorDBPerformance(): Promise<VectorDBMetrics> {
    const queries = [
      'quantum computing basics',
      'machine learning algorithms',
      'web development frameworks'
    ]

    const metrics = {
      indexSize: await this.getVectorDBSize(),
      queries: [],
      summary: {
        avgQueryTime: 0,
        avgSimilarityScore: 0,
        cacheHitRate: 0
      }
    }

    for (const query of queries) {
      const startTime = performance.now()

      try {
        const results = await this.queryVectorDB(query, { topK: 10 })
        const endTime = performance.now()

        metrics.queries.push({
          query: query.substring(0, 30),
          queryTime: endTime - startTime,
          resultsCount: results.length,
          avgSimilarityScore: this.calculateAverage(
            results.map(r => r.score)
          ),
          cacheHit: results.cached || false,
          success: true,
          timestamp: Date.now()
        })
      } catch (error) {
        metrics.queries.push({
          query: query.substring(0, 30),
          queryTime: performance.now() - startTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        })
      }
    }

    // Calculate summary metrics
    const successfulQueries = metrics.queries.filter(q => q.success)
    if (successfulQueries.length > 0) {
      metrics.summary.avgQueryTime = this.calculateAverage(
        successfulQueries.map(q => q.queryTime)
      )
      metrics.summary.avgSimilarityScore = this.calculateAverage(
        successfulQueries.map(q => q.avgSimilarityScore)
      )
      metrics.summary.cacheHitRate = successfulQueries.filter(q => q.cacheHit).length / successfulQueries.length
    }

    return metrics
  }
}
```

**Database Performance Monitoring:**
```typescript
// Database performance monitoring
class DatabasePerformanceMonitor {
  async trackQueryPerformance(): Promise<DatabaseMetrics> {
    const slowQueries = await this.getSlowQueries()
    const connectionMetrics = await this.getConnectionPoolMetrics()
    const indexUsage = await this.getIndexUsageStats()

    return {
      queryPerformance: {
        slowQueries: slowQueries.map(query => ({
          sql: query.sql.substring(0, 100),
          avgDuration: query.avgDuration,
          callCount: query.callCount,
          totalTime: query.totalTime
        })),
        avgQueryTime: await this.getAverageQueryTime(),
        p95QueryTime: await this.getP95QueryTime(),
        queryCount: await this.getQueryCount('1h')
      },

      connectionPool: {
        totalConnections: connectionMetrics.total,
        activeConnections: connectionMetrics.active,
        idleConnections: connectionMetrics.idle,
        waitingConnections: connectionMetrics.waiting,
        connectionUtilization: connectionMetrics.active / connectionMetrics.total
      },

      indexPerformance: indexUsage.map(index => ({
        tableName: index.tableName,
        indexName: index.indexName,
        scanCount: index.scanCount,
        seekCount: index.seekCount,
        efficiency: index.seekCount / (index.scanCount + index.seekCount)
      })),

      storageMetrics: {
        databaseSize: await this.getDatabaseSize(),
        tablesSizes: await this.getTablesSizes(),
        indexSizes: await this.getIndexSizes(),
        fragmentation: await this.getFragmentationLevel()
      }
    }
  }
}
```

**Performance Alerting System:**
```typescript
// Intelligent alerting based on performance thresholds
class PerformanceAlertManager {
  private readonly thresholds = {
    webVitals: {
      fcp: { good: 1800, needsImprovement: 3000 },
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 }
    },
    api: {
      responseTime: { good: 1000, critical: 5000 },
      errorRate: { good: 0.01, critical: 0.05 },
      throughput: { minimum: 100 } // requests per second
    },
    ai: {
      responseTime: { good: 3000, critical: 10000 },
      costPerRequest: { maximum: 0.10 },
      qualityScore: { minimum: 8.0 }
    },
    extension: {
      loadTime: { good: 500, critical: 2000 },
      memoryUsage: { maximum: 100 * 1024 * 1024 }, // 100MB
      storageUsage: { maximum: 10 * 1024 * 1024 } // 10MB
    }
  }

  async evaluatePerformance(metrics: PerformanceMetrics): Promise<AlertResult[]> {
    const alerts = []

    // Web Vitals Alerts
    if (metrics.webVitals) {
      for (const [metric, value] of Object.entries(metrics.webVitals)) {
        const threshold = this.thresholds.webVitals[metric]
        if (threshold && value > threshold.needsImprovement) {
          alerts.push({
            type: 'web_vitals',
            metric,
            value,
            threshold: threshold.needsImprovement,
            severity: value > threshold.needsImprovement * 1.5 ? 'critical' : 'warning',
            message: `${metric.toUpperCase()} is ${value}ms, exceeding threshold of ${threshold.needsImprovement}ms`
          })
        }
      }
    }

    // API Performance Alerts
    if (metrics.api) {
      if (metrics.api.avgResponseTime > this.thresholds.api.responseTime.critical) {
        alerts.push({
          type: 'api_performance',
          metric: 'response_time',
          value: metrics.api.avgResponseTime,
          severity: 'critical',
          message: `API response time ${metrics.api.avgResponseTime}ms exceeds critical threshold`
        })
      }

      if (metrics.api.errorRate > this.thresholds.api.errorRate.critical) {
        alerts.push({
          type: 'api_reliability',
          metric: 'error_rate',
          value: metrics.api.errorRate,
          severity: 'critical',
          message: `API error rate ${(metrics.api.errorRate * 100).toFixed(2)}% exceeds critical threshold`
        })
      }
    }

    // AI Service Alerts
    if (metrics.ai) {
      if (metrics.ai.avgCostPerRequest > this.thresholds.ai.costPerRequest.maximum) {
        alerts.push({
          type: 'ai_cost',
          metric: 'cost_per_request',
          value: metrics.ai.avgCostPerRequest,
          severity: 'warning',
          message: `AI cost per request $${metrics.ai.avgCostPerRequest.toFixed(4)} exceeds budget`
        })
      }

      if (metrics.ai.qualityScore < this.thresholds.ai.qualityScore.minimum) {
        alerts.push({
          type: 'ai_quality',
          metric: 'quality_score',
          value: metrics.ai.qualityScore,
          severity: 'warning',
          message: `AI quality score ${metrics.ai.qualityScore} below minimum threshold`
        })
      }
    }

    return alerts
  }

  async sendAlerts(alerts: AlertResult[]): Promise<void> {
    for (const alert of alerts) {
      // Send to appropriate channels based on severity
      if (alert.severity === 'critical') {
        await this.sendPagerDutyAlert(alert)
        await this.sendSlackAlert(alert, '#critical-alerts')
      } else if (alert.severity === 'warning') {
        await this.sendSlackAlert(alert, '#performance-alerts')
      }

      // Log alert for historical analysis
      await this.logAlert(alert)
    }
  }
}
```

**Performance Optimization Recommendations:**
```typescript
// Automated performance optimization suggestions
class PerformanceOptimizer {
  async analyzeAndRecommend(metrics: PerformanceMetrics): Promise<OptimizationRecommendations> {
    const recommendations = []

    // Web Performance Optimizations
    if (metrics.webVitals.lcp > 2500) {
      recommendations.push({
        category: 'web_performance',
        priority: 'high',
        issue: 'Large Contentful Paint (LCP) is slow',
        recommendation: 'Optimize largest page element, implement image lazy loading, use CDN',
        estimatedImpact: 'Reduce LCP by 1-2 seconds',
        implementation: [
          'Add lazy loading to hero images',
          'Implement critical CSS inlining',
          'Optimize font loading strategy',
          'Enable brotli compression'
        ]
      })
    }

    // API Performance Optimizations
    if (metrics.api.avgResponseTime > 3000) {
      recommendations.push({
        category: 'api_performance',
        priority: 'high',
        issue: 'API response times are elevated',
        recommendation: 'Implement response caching, optimize database queries, add CDN',
        estimatedImpact: 'Reduce response time by 50-70%',
        implementation: [
          'Add Redis caching layer',
          'Optimize N+1 queries',
          'Implement database query optimization',
          'Add response compression'
        ]
      })
    }

    // AI Service Optimizations
    if (metrics.ai.avgCostPerRequest > 0.05) {
      recommendations.push({
        category: 'ai_optimization',
        priority: 'medium',
        issue: 'AI service costs are high',
        recommendation: 'Implement prompt optimization, add semantic caching, optimize model selection',
        estimatedImpact: 'Reduce AI costs by 20-40%',
        implementation: [
          'Implement prompt compression techniques',
          'Add semantic similarity caching',
          'Use model routing based on complexity',
          'Optimize prompt templates'
        ]
      })
    }

    // Extension Performance Optimizations
    if (metrics.extension.loadTime > 1000) {
      recommendations.push({
        category: 'extension_performance',
        priority: 'medium',
        issue: 'Extension load time is slow',
        recommendation: 'Optimize bundle size, lazy load components, improve manifest',
        estimatedImpact: 'Reduce load time by 40-60%',
        implementation: [
          'Split content scripts by site',
          'Implement dynamic imports',
          'Optimize manifest permissions',
          'Compress extension assets'
        ]
      })
    }

    return {
      timestamp: Date.now(),
      metricsAnalyzed: Object.keys(metrics),
      recommendations,
      priorityActions: recommendations.filter(r => r.priority === 'high'),
      estimatedOverallImpact: this.calculateOverallImpact(recommendations)
    }
  }
}
```

**Performance Monitoring Dashboard:**
```typescript
// Real-time performance dashboard data
interface PerformanceDashboard {
  overview: {
    health_score: number
    alerts_count: number
    uptime: string
    last_updated: string
  }

  web_vitals: {
    fcp: { current: number, trend: 'up' | 'down' | 'stable' }
    lcp: { current: number, trend: 'up' | 'down' | 'stable' }
    fid: { current: number, trend: 'up' | 'down' | 'stable' }
    cls: { current: number, trend: 'up' | 'down' | 'stable' }
  }

  api_performance: {
    response_time: { current: number, p95: number, trend: string }
    throughput: { current: number, trend: string }
    error_rate: { current: number, trend: string }
    success_rate: { current: number, trend: string }
  }

  ai_services: {
    openai: { status: 'healthy' | 'degraded' | 'down', avg_response_time: number }
    anthropic: { status: 'healthy' | 'degraded' | 'down', avg_response_time: number }
    vector_db: { status: 'healthy' | 'degraded' | 'down', query_time: number }
    daily_cost: number
    cost_trend: string
  }

  extension_metrics: {
    active_users: number
    load_performance: { chrome: number, firefox: number, edge: number }
    compatibility: { success_rate: number, failed_sites: string[] }
    crash_rate: number
  }

  recommendations: OptimizationRecommendations[]
}
```

**Quality Gates for Performance:**
- Web Vitals must meet "Good" thresholds (75th percentile)
- API response time < 2 seconds for 95th percentile
- Extension load time < 1 second across all browsers
- AI service availability > 99.5%
- Database query performance within acceptable ranges
- Cost per request within budget thresholds

**Automated Performance Actions:**
- Auto-scaling based on performance metrics
- Intelligent caching policy adjustments
- AI model routing optimization
- Alert escalation procedures
- Performance regression prevention

Please specify the monitoring scope and performance targets for comprehensive monitoring setup and optimization recommendations.