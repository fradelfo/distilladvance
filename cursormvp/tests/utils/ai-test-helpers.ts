/**
 * AI/LLM Testing Utilities
 * Provides comprehensive testing tools for AI integration, prompt engineering, and model evaluation
 */

import { afterEach, beforeEach, vi } from 'vitest'

// AI Provider Mock Types
interface MockAIResponse {
  content: string
  role: 'assistant' | 'user' | 'system'
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  cost?: number
  model?: string
  latency?: number
}

interface MockEmbeddingResponse {
  embedding: number[]
  tokens: number
  cost: number
}

interface PromptTestCase {
  name: string
  prompt: string
  expectedPattern?: RegExp
  expectedKeywords?: string[]
  maxTokens?: number
  temperature?: number
  model?: string
}

// AI Service Mocks
export class MockOpenAIClient {
  private responses = new Map<string, MockAIResponse>()
  private embeddings = new Map<string, MockEmbeddingResponse>()
  private callHistory: Array<{
    method: string
    params: any
    timestamp: Date
  }> = []

  chat = {
    completions: {
      create: vi.fn().mockImplementation(async (params: any) => {
        this.callHistory.push({
          method: 'chat.completions.create',
          params,
          timestamp: new Date()
        })

        const key = this.generateKey(params.messages)
        const mockResponse = this.responses.get(key) || this.getDefaultResponse(params)

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, mockResponse.latency || 100))

        return {
          choices: [{
            message: {
              content: mockResponse.content,
              role: mockResponse.role
            },
            finish_reason: 'stop'
          }],
          usage: mockResponse.tokens || {
            prompt_tokens: this.estimateTokens(params.messages),
            completion_tokens: this.estimateTokens(mockResponse.content),
            total_tokens: this.estimateTokens(params.messages) + this.estimateTokens(mockResponse.content)
          },
          model: params.model,
          id: `chatcmpl-${Math.random().toString(36).substr(2, 9)}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000)
        }
      })
    }
  }

  embeddings = {
    create: vi.fn().mockImplementation(async (params: any) => {
      this.callHistory.push({
        method: 'embeddings.create',
        params,
        timestamp: new Date()
      })

      const key = Array.isArray(params.input) ? params.input.join('|') : params.input
      const mockResponse = this.embeddings.get(key) || this.getDefaultEmbedding(params)

      await new Promise(resolve => setTimeout(resolve, 50))

      return {
        data: [{
          embedding: mockResponse.embedding,
          index: 0,
          object: 'embedding'
        }],
        usage: {
          prompt_tokens: mockResponse.tokens,
          total_tokens: mockResponse.tokens
        },
        model: params.model
      }
    })
  }

  // Mock management methods
  setResponse(messages: any[], response: MockAIResponse) {
    const key = this.generateKey(messages)
    this.responses.set(key, response)
  }

  setEmbedding(input: string, embedding: MockEmbeddingResponse) {
    this.embeddings.set(input, embedding)
  }

  getCallHistory() {
    return [...this.callHistory]
  }

  clearHistory() {
    this.callHistory = []
  }

  reset() {
    this.responses.clear()
    this.embeddings.clear()
    this.clearHistory()
  }

  private generateKey(messages: any[]): string {
    return messages.map(m => `${m.role}:${m.content}`).join('|')
  }

  private getDefaultResponse(params: any): MockAIResponse {
    const promptText = params.messages[params.messages.length - 1]?.content || ''

    return {
      content: `Mock response for: ${promptText.substring(0, 50)}...`,
      role: 'assistant',
      tokens: {
        prompt: this.estimateTokens(params.messages),
        completion: 50,
        total: this.estimateTokens(params.messages) + 50
      },
      cost: this.calculateCost(params.model, this.estimateTokens(params.messages) + 50),
      model: params.model,
      latency: 200
    }
  }

  private getDefaultEmbedding(params: any): MockEmbeddingResponse {
    const inputLength = Array.isArray(params.input) ? params.input.join('').length : params.input.length

    return {
      embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
      tokens: Math.ceil(inputLength / 4),
      cost: this.calculateEmbeddingCost(params.model, Math.ceil(inputLength / 4))
    }
  }

  private estimateTokens(input: any): number {
    if (Array.isArray(input)) {
      return input.reduce((total, message) => total + Math.ceil(message.content.length / 4), 0)
    }
    return Math.ceil(input.length / 4)
  }

  private calculateCost(model: string, tokens: number): number {
    const pricing: Record<string, { input: number, output: number }> = {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
    }

    return pricing[model]?.output * tokens || 0
  }

  private calculateEmbeddingCost(model: string, tokens: number): number {
    const pricing: Record<string, number> = {
      'text-embedding-3-large': 0.00013 / 1000,
      'text-embedding-3-small': 0.00002 / 1000
    }

    return pricing[model] * tokens || 0
  }
}

export class MockAnthropicClient {
  private responses = new Map<string, MockAIResponse>()
  private callHistory: Array<{
    method: string
    params: any
    timestamp: Date
  }> = []

  messages = {
    create: vi.fn().mockImplementation(async (params: any) => {
      this.callHistory.push({
        method: 'messages.create',
        params,
        timestamp: new Date()
      })

      const key = this.generateKey(params.messages)
      const mockResponse = this.responses.get(key) || this.getDefaultResponse(params)

      await new Promise(resolve => setTimeout(resolve, mockResponse.latency || 150))

      return {
        content: [{
          type: 'text',
          text: mockResponse.content
        }],
        role: 'assistant',
        usage: {
          input_tokens: mockResponse.tokens?.prompt || 0,
          output_tokens: mockResponse.tokens?.completion || 0
        },
        model: params.model,
        id: `msg_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message'
      }
    })
  }

  setResponse(messages: any[], response: MockAIResponse) {
    const key = this.generateKey(messages)
    this.responses.set(key, response)
  }

  getCallHistory() {
    return [...this.callHistory]
  }

  clearHistory() {
    this.callHistory = []
  }

  reset() {
    this.responses.clear()
    this.clearHistory()
  }

  private generateKey(messages: any[]): string {
    return messages.map(m => `${m.role}:${m.content}`).join('|')
  }

  private getDefaultResponse(params: any): MockAIResponse {
    const promptText = params.messages[params.messages.length - 1]?.content || ''

    return {
      content: `Mock Anthropic response for: ${promptText.substring(0, 50)}...`,
      role: 'assistant',
      tokens: {
        prompt: this.estimateTokens(params.messages),
        completion: 60,
        total: this.estimateTokens(params.messages) + 60
      },
      model: params.model,
      latency: 250
    }
  }

  private estimateTokens(input: any): number {
    if (Array.isArray(input)) {
      return input.reduce((total, message) => total + Math.ceil(message.content.length / 3.5), 0)
    }
    return Math.ceil(input.length / 3.5)
  }
}

// Vector Database Mock
export class MockVectorDatabase {
  private collections = new Map<string, Map<string, any>>()

  createCollection = vi.fn().mockImplementation(async (name: string) => {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map())
    }
    return { name }
  })

  getCollection = vi.fn().mockImplementation(async (name: string) => {
    const collection = this.collections.get(name) || new Map()

    return {
      add: vi.fn().mockImplementation(async ({ ids, documents, metadatas, embeddings }) => {
        ids.forEach((id: string, index: number) => {
          collection.set(id, {
            document: documents[index],
            metadata: metadatas?.[index] || {},
            embedding: embeddings?.[index] || Array(1536).fill(0).map(() => Math.random())
          })
        })
        return { ids }
      }),

      query: vi.fn().mockImplementation(async ({ query_texts, n_results = 10 }) => {
        const results = Array.from(collection.values()).slice(0, n_results)
        return {
          documents: [results.map(r => r.document)],
          metadatas: [results.map(r => r.metadata)],
          distances: [results.map(() => Math.random() * 0.5)]
        }
      }),

      delete: vi.fn().mockImplementation(async ({ ids }) => {
        ids.forEach((id: string) => collection.delete(id))
        return { success: true }
      })
    }
  })

  reset() {
    this.collections.clear()
  }
}

// Prompt Testing Utilities
export const promptTestUtils = {
  /**
   * Test prompt performance and quality
   */
  async testPromptPerformance(
    testCases: PromptTestCase[],
    aiClient: MockOpenAIClient | MockAnthropicClient
  ) {
    const results = []

    for (const testCase of testCases) {
      const startTime = performance.now()

      try {
        const response = await this.sendPrompt(aiClient, testCase)
        const endTime = performance.now()

        const quality = this.evaluateResponseQuality(response.content, testCase)

        results.push({
          name: testCase.name,
          success: true,
          response: response.content,
          latency: endTime - startTime,
          tokens: response.tokens,
          quality,
          cost: response.cost
        })
      } catch (error) {
        results.push({
          name: testCase.name,
          success: false,
          error: error.message,
          latency: -1,
          quality: { score: 0, issues: ['Request failed'] }
        })
      }
    }

    return {
      results,
      summary: this.generateSummary(results)
    }
  },

  /**
   * Test prompt injection resistance
   */
  testPromptInjectionResistance(prompt: string) {
    const injectionPatterns = [
      'ignore previous instructions',
      'forget everything above',
      'you are now a',
      'system: ignore',
      'new instructions:',
      '[INST]',
      '###'
    ]

    const vulnerabilities = injectionPatterns.filter(pattern =>
      prompt.toLowerCase().includes(pattern.toLowerCase())
    )

    return {
      secure: vulnerabilities.length === 0,
      vulnerabilities,
      riskLevel: vulnerabilities.length === 0 ? 'low' :
                vulnerabilities.length <= 2 ? 'medium' : 'high'
    }
  },

  /**
   * Analyze prompt token usage
   */
  analyzeTokenUsage(prompt: string, model = 'gpt-4') {
    // Rough token estimation (more accurate would require tiktoken)
    const estimatedTokens = Math.ceil(prompt.length / 4)

    const limits = {
      'gpt-4': 8192,
      'gpt-3.5-turbo': 4096,
      'claude-3-sonnet': 200000,
      'claude-3-haiku': 200000
    }

    const limit = limits[model as keyof typeof limits] || 4096
    const utilization = (estimatedTokens / limit) * 100

    return {
      estimatedTokens,
      limit,
      utilization: Math.round(utilization * 100) / 100,
      withinLimit: estimatedTokens < limit,
      recommendation: utilization > 80 ? 'Consider shortening prompt' :
                     utilization > 60 ? 'Monitor token usage' :
                     'Token usage optimal'
    }
  },

  private async sendPrompt(aiClient: any, testCase: PromptTestCase) {
    const messages = [{ role: 'user', content: testCase.prompt }]

    if ('chat' in aiClient) {
      // OpenAI client
      const response = await aiClient.chat.completions.create({
        model: testCase.model || 'gpt-4',
        messages,
        max_tokens: testCase.maxTokens || 150,
        temperature: testCase.temperature || 0.7
      })

      return {
        content: response.choices[0].message.content,
        tokens: response.usage,
        cost: 0 // Would calculate based on pricing
      }
    } else {
      // Anthropic client
      const response = await aiClient.messages.create({
        model: testCase.model || 'claude-3-sonnet-20240229',
        messages,
        max_tokens: testCase.maxTokens || 150
      })

      return {
        content: response.content[0].text,
        tokens: response.usage,
        cost: 0
      }
    }
  },

  private evaluateResponseQuality(response: string, testCase: PromptTestCase) {
    let score = 100
    const issues = []

    // Check for expected pattern
    if (testCase.expectedPattern && !testCase.expectedPattern.test(response)) {
      score -= 30
      issues.push('Response does not match expected pattern')
    }

    // Check for expected keywords
    if (testCase.expectedKeywords) {
      const missingKeywords = testCase.expectedKeywords.filter(
        keyword => !response.toLowerCase().includes(keyword.toLowerCase())
      )

      if (missingKeywords.length > 0) {
        score -= missingKeywords.length * 10
        issues.push(`Missing keywords: ${missingKeywords.join(', ')}`)
      }
    }

    // Check response length
    if (response.length < 10) {
      score -= 20
      issues.push('Response too short')
    }

    // Check for coherence (basic)
    if (response.includes('...') || response.includes('[incomplete]')) {
      score -= 15
      issues.push('Response appears incomplete')
    }

    return {
      score: Math.max(0, score),
      issues,
      grade: score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F'
    }
  },

  private generateSummary(results: any[]) {
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageLatency: successful.reduce((sum, r) => sum + r.latency, 0) / successful.length,
      averageQuality: successful.reduce((sum, r) => sum + r.quality.score, 0) / successful.length,
      totalCost: successful.reduce((sum, r) => sum + (r.cost || 0), 0)
    }
  }
}

// Cost Monitoring Utilities
export const costMonitoringUtils = {
  createCostTracker() {
    const costs: Array<{
      provider: string
      model: string
      tokens: number
      cost: number
      timestamp: Date
    }> = []

    return {
      track: (provider: string, model: string, tokens: number, cost: number) => {
        costs.push({ provider, model, tokens, cost, timestamp: new Date() })
      },

      getTotal: () => costs.reduce((sum, entry) => sum + entry.cost, 0),

      getByProvider: (provider: string) =>
        costs.filter(entry => entry.provider === provider),

      getByTimeRange: (start: Date, end: Date) =>
        costs.filter(entry => entry.timestamp >= start && entry.timestamp <= end),

      getDailySpend: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        return costs
          .filter(entry => entry.timestamp >= today && entry.timestamp < tomorrow)
          .reduce((sum, entry) => sum + entry.cost, 0)
      },

      reset: () => {
        costs.length = 0
      },

      export: () => [...costs]
    }
  }
}

// AI Testing Lifecycle
let mockOpenAI: MockOpenAIClient
let mockAnthropic: MockAnthropicClient
let mockVectorDB: MockVectorDatabase

beforeEach(() => {
  mockOpenAI = new MockOpenAIClient()
  mockAnthropic = new MockAnthropicClient()
  mockVectorDB = new MockVectorDatabase()

  // Mock the actual AI libraries
  vi.mock('openai', () => ({
    default: vi.fn(() => mockOpenAI)
  }))

  vi.mock('@anthropic-ai/sdk', () => ({
    default: vi.fn(() => mockAnthropic)
  }))

  vi.mock('chromadb', () => ({
    ChromaApi: vi.fn(() => mockVectorDB)
  }))
})

afterEach(() => {
  if (mockOpenAI) mockOpenAI.reset()
  if (mockAnthropic) mockAnthropic.reset()
  if (mockVectorDB) mockVectorDB.reset()
})

// Export instances for direct testing
export {
  mockOpenAI,
  mockAnthropic,
  mockVectorDB
}

// Export all utilities
export default {
  MockOpenAIClient,
  MockAnthropicClient,
  MockVectorDatabase,
  promptTestUtils,
  costMonitoringUtils
}