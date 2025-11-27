# Advanced Prompt Engineering Skill

## Skill Overview
Expert techniques for crafting effective prompts, optimizing AI interactions, and building sophisticated prompt engineering workflows for conversation distillation and AI-powered features.

## Core Capabilities

### Conversation Distillation Techniques

#### Multi-Stage Distillation Framework
```typescript
// prompt-engineering/distillation-engine.ts
interface ConversationAnalysis {
  messageCount: number
  conversationLength: number
  topics: string[]
  complexity: 'simple' | 'medium' | 'complex'
  patterns: {
    questionAnswer: boolean
    stepByStep: boolean
    creative: boolean
    analytical: boolean
    problemSolving: boolean
  }
  participants: {
    userStyle: 'concise' | 'detailed' | 'conversational'
    assistantStyle: 'formal' | 'casual' | 'technical'
  }
}

interface DistillationOptions {
  mode: 'comprehensive' | 'essential' | 'template' | 'pattern-focused'
  privacyLevel: 'strict' | 'moderate' | 'minimal'
  targetAudience: 'beginner' | 'intermediate' | 'expert'
  preserveStyle: boolean
  includeContext: boolean
  optimizeForReuse: boolean
}

interface DistillationResult {
  distilledPrompt: string
  metadata: {
    originalLength: number
    distilledLength: number
    compressionRatio: number
    qualityScore: number
    reusabilityScore: number
    confidenceLevel: number
  }
  suggestions: string[]
  variables: Array<{
    name: string
    description: string
    defaultValue?: string
  }>
  usageInstructions: string
}

class ConversationDistillationEngine {
  private readonly SYSTEM_PROMPT = `You are an expert prompt engineer specializing in distilling AI conversations into reusable, high-quality prompts. Your goal is to extract the essential pattern, reasoning approach, and technique from conversations while making them broadly applicable.

Key principles:
1. Preserve the core reasoning pattern and methodology
2. Remove personal information and specific details
3. Make the prompt reusable for similar tasks
4. Maintain clarity and effectiveness
5. Optimize for the target audience and use case`

  async analyzeConversation(conversation: string): Promise<ConversationAnalysis> {
    const analysis: ConversationAnalysis = {
      messageCount: this.countMessages(conversation),
      conversationLength: conversation.length,
      topics: await this.extractTopics(conversation),
      complexity: this.assessComplexity(conversation),
      patterns: this.identifyPatterns(conversation),
      participants: this.analyzeParticipantStyles(conversation)
    }

    return analysis
  }

  async distillConversation(
    conversation: string,
    options: DistillationOptions
  ): Promise<DistillationResult> {
    // Step 1: Analyze the conversation
    const analysis = await this.analyzeConversation(conversation)

    // Step 2: Apply privacy filtering
    const sanitizedConversation = await this.applySanitization(conversation, options.privacyLevel)

    // Step 3: Generate distillation prompt based on mode
    const distillationPrompt = this.buildDistillationPrompt(analysis, options)

    // Step 4: Execute distillation
    const rawResult = await this.executeDistillation(distillationPrompt, sanitizedConversation)

    // Step 5: Post-process and validate
    const result = await this.postProcessResult(rawResult, analysis, options)

    return result
  }

  private countMessages(conversation: string): number {
    const messagePatterns = [
      /^(User|Human|You):/gm,
      /^(Assistant|AI|Claude|GPT):/gm,
      /\n\n(?=\w)/g // Paragraph breaks often indicate new messages
    ]

    return messagePatterns.reduce((count, pattern) => {
      const matches = conversation.match(pattern)
      return Math.max(count, matches?.length || 0)
    }, 0)
  }

  private async extractTopics(conversation: string): Promise<string[]> {
    const topicExtractionPrompt = `Analyze this conversation and extract the main topics discussed. Return only the topics as a comma-separated list.

Conversation:
${conversation.substring(0, 2000)}...

Topics:`

    try {
      const response = await llmRouter.generateCompletion({
        messages: [{ role: 'user', content: topicExtractionPrompt }],
        maxTokens: 100
      }, {
        complexity: 'simple',
        speedPriority: 'high'
      })

      return response.content
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0)
        .slice(0, 5) // Limit to top 5 topics

    } catch (error) {
      console.error('Topic extraction failed:', error)
      return []
    }
  }

  private assessComplexity(conversation: string): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: [
        /\b(what|where|when|who)\b/gi,
        /\b(yes|no)\b/gi,
        /\b(list|show|tell)\b/gi
      ],
      medium: [
        /\b(how|why|explain|describe)\b/gi,
        /\b(compare|contrast|analyze)\b/gi,
        /\b(steps|process|method)\b/gi
      ],
      complex: [
        /\b(evaluate|critique|synthesize)\b/gi,
        /\b(implications|consequences|trade-offs)\b/gi,
        /\b(architecture|design|framework)\b/gi,
        /\b(multiple|various|several)\s+\w+\s+(approaches|methods|solutions)/gi
      ]
    }

    let scores = { simple: 0, medium: 0, complex: 0 }

    for (const [level, patterns] of Object.entries(complexityIndicators)) {
      for (const pattern of patterns) {
        const matches = conversation.match(pattern)
        scores[level] += matches ? matches.length : 0
      }
    }

    // Determine complexity based on highest score and conversation length
    if (scores.complex > 5 || conversation.length > 5000) {
      return 'complex'
    } else if (scores.medium > 3 || conversation.length > 2000) {
      return 'medium'
    } else {
      return 'simple'
    }
  }

  private identifyPatterns(conversation: string): ConversationAnalysis['patterns'] {
    return {
      questionAnswer: /\?\s*\n.*?(?=\n|$)/g.test(conversation),
      stepByStep: /\b(step|first|then|next|finally)\b/gi.test(conversation),
      creative: /\b(imagine|creative|innovative|original)\b/gi.test(conversation),
      analytical: /\b(analyze|examine|evaluate|assess)\b/gi.test(conversation),
      problemSolving: /\b(problem|solution|solve|fix|resolve)\b/gi.test(conversation)
    }
  }

  private analyzeParticipantStyles(conversation: string): ConversationAnalysis['participants'] {
    const userMessages = this.extractUserMessages(conversation)
    const assistantMessages = this.extractAssistantMessages(conversation)

    return {
      userStyle: this.classifyWritingStyle(userMessages.join('\n')),
      assistantStyle: this.classifyWritingStyle(assistantMessages.join('\n'))
    }
  }

  private extractUserMessages(conversation: string): string[] {
    const userPatterns = [
      /^User:\s*(.+)$/gm,
      /^Human:\s*(.+)$/gm,
      /^You:\s*(.+)$/gm
    ]

    const messages: string[] = []

    for (const pattern of userPatterns) {
      const matches = conversation.match(pattern)
      if (matches) {
        messages.push(...matches.map(match => match.replace(pattern, '$1')))
      }
    }

    return messages
  }

  private extractAssistantMessages(conversation: string): string[] {
    const assistantPatterns = [
      /^Assistant:\s*(.+)$/gm,
      /^AI:\s*(.+)$/gm,
      /^Claude:\s*(.+)$/gm,
      /^GPT:\s*(.+)$/gm
    ]

    const messages: string[] = []

    for (const pattern of assistantPatterns) {
      const matches = conversation.match(pattern)
      if (matches) {
        messages.push(...matches.map(match => match.replace(pattern, '$1')))
      }
    }

    return messages
  }

  private classifyWritingStyle(text: string): 'concise' | 'detailed' | 'conversational' {
    const avgSentenceLength = this.calculateAverageSentenceLength(text)
    const conversationalMarkers = /\b(well|you know|I mean|like|actually)\b/gi
    const formalMarkers = /\b(therefore|furthermore|consequently|moreover)\b/gi

    const conversationalCount = (text.match(conversationalMarkers) || []).length
    const formalCount = (text.match(formalMarkers) || []).length

    if (conversationalCount > formalCount && avgSentenceLength < 15) {
      return 'conversational'
    } else if (avgSentenceLength > 25) {
      return 'detailed'
    } else {
      return 'concise'
    }
  }

  private calculateAverageSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length === 0) return 0

    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length
    }, 0)

    return totalWords / sentences.length
  }

  private async applySanitization(conversation: string, privacyLevel: string): Promise<string> {
    const sanitizationPrompts = {
      strict: `Remove all personal information, specific names, dates, locations, company names, and identifying details from this conversation. Replace with generic placeholders like [NAME], [COMPANY], [DATE], etc.`,
      moderate: `Remove obvious personal information like names, email addresses, phone numbers, and specific company names. Keep general location references and dates if they're contextually important.`,
      minimal: `Remove only highly sensitive information like full names, contact details, and confidential business information.`
    }

    const prompt = `${sanitizationPrompts[privacyLevel]}

Original conversation:
${conversation}

Sanitized conversation:`

    try {
      const response = await llmRouter.generateCompletion({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: Math.min(conversation.length * 1.2, 4000)
      }, {
        complexity: 'medium',
        speedPriority: 'medium'
      })

      return response.content
    } catch (error) {
      console.error('Sanitization failed:', error)
      return this.basicSanitization(conversation)
    }
  }

  private basicSanitization(conversation: string): string {
    // Basic regex-based sanitization as fallback
    return conversation
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]') // Simple name pattern
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE]')
  }

  private buildDistillationPrompt(analysis: ConversationAnalysis, options: DistillationOptions): string {
    const basePrompt = this.SYSTEM_PROMPT

    const modeInstructions = {
      comprehensive: `Create a comprehensive prompt that includes:
- Full context and background information
- Step-by-step reasoning approach
- Detailed output format specifications
- All relevant constraints and considerations
- Examples of good vs poor responses`,

      essential: `Create a concise prompt focusing on:
- Core objective and main goal
- Essential context only
- Clear output format
- Key constraints
- Minimal but sufficient guidance`,

      template: `Create a reusable template prompt that:
- Uses variable placeholders (e.g., {topic}, {context})
- Maintains the reasoning pattern
- Can be adapted for similar tasks
- Includes usage instructions
- Provides customization guidance`,

      'pattern-focused': `Extract and codify the underlying pattern:
- Identify the core methodology
- Abstract the approach from specific content
- Create a pattern that can be applied broadly
- Focus on the thinking process rather than content`
    }

    const audienceAdaptations = {
      beginner: 'Use clear, simple language. Provide more context and explanation. Include examples.',
      intermediate: 'Balance clarity with efficiency. Assume basic familiarity with concepts.',
      expert: 'Use precise, technical language. Focus on nuanced details and advanced considerations.'
    }

    return `${basePrompt}

## Conversation Analysis:
- Complexity: ${analysis.complexity}
- Topics: ${analysis.topics.join(', ')}
- Patterns identified: ${Object.entries(analysis.patterns).filter(([_, present]) => present).map(([pattern]) => pattern).join(', ')}
- Message count: ${analysis.messageCount}

## Distillation Instructions:
${modeInstructions[options.mode]}

## Target Audience: ${options.targetAudience}
${audienceAdaptations[options.targetAudience]}

## Additional Requirements:
- Privacy level: ${options.privacyLevel} (personal information has been sanitized)
- Preserve style: ${options.preserveStyle ? 'Yes - maintain the original communication style' : 'No - optimize for clarity'}
- Include context: ${options.includeContext ? 'Yes - provide necessary background' : 'No - focus on core instructions only'}
- Optimize for reuse: ${options.optimizeForReuse ? 'Yes - make broadly applicable' : 'No - can be specific to this case'}

Please analyze the conversation and create the distilled prompt according to these specifications.`
  }

  private async executeDistillation(prompt: string, conversation: string): Promise<string> {
    const fullPrompt = `${prompt}

## Conversation to Distill:
${conversation}

## Your Response:
Please provide the distilled prompt following the specifications above. Structure your response as:

1. **Distilled Prompt**: The refined, reusable prompt
2. **Usage Instructions**: How to use this prompt effectively
3. **Variables**: Any customizable elements (if applicable)
4. **Quality Assessment**: Brief evaluation of the distillation

Begin your response:`

    try {
      const response = await llmRouter.generateCompletion({
        messages: [{ role: 'user', content: fullPrompt }],
        maxTokens: 2000,
        temperature: 0.3 // Lower temperature for more consistent results
      }, {
        complexity: 'complex',
        speedPriority: 'low'
      })

      return response.content
    } catch (error) {
      console.error('Distillation execution failed:', error)
      throw new Error('Failed to distill conversation')
    }
  }

  private async postProcessResult(
    rawResult: string,
    analysis: ConversationAnalysis,
    options: DistillationOptions
  ): Promise<DistillationResult> {
    // Extract components from the raw result
    const distilledPrompt = this.extractDistilledPrompt(rawResult)
    const usageInstructions = this.extractUsageInstructions(rawResult)
    const variables = this.extractVariables(rawResult)
    const suggestions = this.extractSuggestions(rawResult)

    // Calculate metrics
    const originalLength = analysis.conversationLength
    const distilledLength = distilledPrompt.length
    const compressionRatio = distilledLength / originalLength

    // Assess quality
    const qualityScore = await this.assessQuality(distilledPrompt, analysis)
    const reusabilityScore = this.assessReusability(distilledPrompt, variables)
    const confidenceLevel = this.calculateConfidenceLevel(qualityScore, reusabilityScore)

    return {
      distilledPrompt,
      metadata: {
        originalLength,
        distilledLength,
        compressionRatio,
        qualityScore,
        reusabilityScore,
        confidenceLevel
      },
      suggestions,
      variables,
      usageInstructions
    }
  }

  private extractDistilledPrompt(result: string): string {
    const match = result.match(/\*\*Distilled Prompt\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i)
    return match ? match[1].trim() : result.split('\n\n')[0]
  }

  private extractUsageInstructions(result: string): string {
    const match = result.match(/\*\*Usage Instructions\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i)
    return match ? match[1].trim() : 'Use this prompt as provided, customizing any variables as needed.'
  }

  private extractVariables(result: string): Array<{ name: string; description: string; defaultValue?: string }> {
    const variablesSection = result.match(/\*\*Variables\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i)
    if (!variablesSection) return []

    const variables: Array<{ name: string; description: string; defaultValue?: string }> = []
    const lines = variablesSection[1].split('\n')

    for (const line of lines) {
      const match = line.match(/[-*]\s*`?(\w+)`?:?\s*(.+)/i)
      if (match) {
        variables.push({
          name: match[1],
          description: match[2].trim(),
          defaultValue: undefined
        })
      }
    }

    return variables
  }

  private extractSuggestions(result: string): string[] {
    // Extract any improvement suggestions or notes
    const suggestions = []

    if (result.includes('consider') || result.includes('suggestion') || result.includes('improve')) {
      const lines = result.split('\n')
      for (const line of lines) {
        if (line.toLowerCase().includes('consider') ||
            line.toLowerCase().includes('suggestion') ||
            line.toLowerCase().includes('improve')) {
          suggestions.push(line.trim())
        }
      }
    }

    return suggestions.slice(0, 3) // Limit to top 3 suggestions
  }

  private async assessQuality(distilledPrompt: string, analysis: ConversationAnalysis): Promise<number> {
    // Quality assessment based on various factors
    let score = 50 // Base score

    // Length appropriateness (not too short, not too verbose)
    const idealLength = Math.max(200, Math.min(800, analysis.conversationLength * 0.3))
    const lengthRatio = distilledPrompt.length / idealLength
    if (lengthRatio >= 0.7 && lengthRatio <= 1.3) {
      score += 15
    }

    // Clarity indicators
    const clarityMarkers = [
      'clearly', 'specifically', 'step by step', 'format', 'structure'
    ]
    const clarityScore = clarityMarkers.filter(marker =>
      distilledPrompt.toLowerCase().includes(marker)
    ).length
    score += Math.min(clarityScore * 5, 20)

    // Completeness indicators
    if (distilledPrompt.includes('context') || distilledPrompt.includes('background')) score += 5
    if (distilledPrompt.includes('example') || distilledPrompt.includes('format')) score += 5
    if (distilledPrompt.includes('constraint') || distilledPrompt.includes('requirement')) score += 5

    return Math.min(score, 100)
  }

  private assessReusability(distilledPrompt: string, variables: any[]): number {
    let score = 50

    // Variable usage indicates good reusability
    if (variables.length > 0) score += 20
    if (variables.length > 2) score += 10

    // Generic language vs specific references
    const genericTerms = ['task', 'topic', 'content', 'information', 'data']
    const specificTerms = ['monday', 'january', 'company x', 'john', 'project alpha']

    const genericCount = genericTerms.filter(term =>
      distilledPrompt.toLowerCase().includes(term)
    ).length
    const specificCount = specificTerms.filter(term =>
      distilledPrompt.toLowerCase().includes(term)
    ).length

    score += genericCount * 3
    score -= specificCount * 5

    // Template patterns
    if (distilledPrompt.includes('{') || distilledPrompt.includes('[')) score += 15

    return Math.max(0, Math.min(score, 100))
  }

  private calculateConfidenceLevel(qualityScore: number, reusabilityScore: number): number {
    return (qualityScore * 0.6 + reusabilityScore * 0.4)
  }
}

// Export singleton instance
export const distillationEngine = new ConversationDistillationEngine()
```

### Prompt Optimization and Testing

#### A/B Testing Framework for Prompts
```typescript
// prompt-engineering/prompt-testing.ts
interface PromptVariant {
  id: string
  name: string
  prompt: string
  variables?: Record<string, any>
  metadata: {
    created: Date
    author: string
    description: string
    expectedOutcome: string
  }
}

interface TestResult {
  variantId: string
  response: string
  metrics: {
    responseTime: number
    tokenCount: number
    cost: number
    qualityScore: number
    relevanceScore: number
    coherenceScore: number
  }
  timestamp: Date
}

interface ABTestConfig {
  testId: string
  name: string
  description: string
  variants: PromptVariant[]
  testCases: Array<{
    id: string
    input: Record<string, any>
    expectedPattern?: RegExp
    evaluationCriteria: string[]
  }>
  sampleSize: number
  successMetrics: string[]
}

class PromptABTestFramework {
  private activeTests = new Map<string, ABTestConfig>()
  private testResults = new Map<string, TestResult[]>()

  async runABTest(config: ABTestConfig): Promise<Map<string, TestResult[]>> {
    console.log(`Starting A/B test: ${config.name}`)

    this.activeTests.set(config.testId, config)
    this.testResults.set(config.testId, [])

    const allResults = new Map<string, TestResult[]>()

    // Initialize results map for each variant
    for (const variant of config.variants) {
      allResults.set(variant.id, [])
    }

    // Run tests for each variant with each test case
    for (const testCase of config.testCases) {
      console.log(`Testing case: ${testCase.id}`)

      for (const variant of config.variants) {
        const results: TestResult[] = []

        // Run multiple samples for statistical significance
        for (let i = 0; i < config.sampleSize; i++) {
          try {
            const result = await this.executePromptTest(variant, testCase.input)
            results.push(result)

            // Add small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (error) {
            console.error(`Test failed for variant ${variant.id}, sample ${i + 1}:`, error)
            // Continue with other samples
          }
        }

        allResults.set(variant.id, [...(allResults.get(variant.id) || []), ...results])
      }
    }

    // Store results
    this.testResults.set(config.testId, Array.from(allResults.values()).flat())

    return allResults
  }

  private async executePromptTest(variant: PromptVariant, testInput: Record<string, any>): Promise<TestResult> {
    const startTime = Date.now()

    // Compile prompt with test input
    const compiledPrompt = this.compilePrompt(variant.prompt, testInput)

    // Execute with LLM
    const response = await llmRouter.generateCompletion({
      messages: [{ role: 'user', content: compiledPrompt }],
      maxTokens: 1000,
      temperature: 0.3
    }, {
      complexity: 'medium',
      speedPriority: 'medium'
    })

    const responseTime = Date.now() - startTime

    // Calculate quality metrics
    const metrics = await this.calculateMetrics(response, variant, testInput)

    return {
      variantId: variant.id,
      response: response.content,
      metrics: {
        responseTime,
        tokenCount: response.usage.totalTokens,
        cost: response.usage.cost,
        qualityScore: metrics.quality,
        relevanceScore: metrics.relevance,
        coherenceScore: metrics.coherence
      },
      timestamp: new Date()
    }
  }

  private compilePrompt(template: string, variables: Record<string, any>): string {
    let compiled = template

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      compiled = compiled.replace(regex, String(value))
    }

    return compiled
  }

  private async calculateMetrics(
    response: LLMResponse,
    variant: PromptVariant,
    testInput: Record<string, any>
  ): Promise<{ quality: number; relevance: number; coherence: number }> {
    // Use a simple model for metric calculation
    const evaluationPrompt = `Evaluate this AI response on three criteria (score 1-10 for each):

Response to evaluate:
"${response.content}"

Expected outcome: ${variant.metadata.expectedOutcome}

Please rate:
1. Quality (accuracy, completeness, usefulness): X/10
2. Relevance (addresses the input appropriately): X/10
3. Coherence (clear, logical, well-structured): X/10

Format: Quality: X, Relevance: X, Coherence: X`

    try {
      const evalResponse = await llmRouter.generateCompletion({
        messages: [{ role: 'user', content: evaluationPrompt }],
        maxTokens: 100
      }, {
        complexity: 'simple',
        speedPriority: 'high'
      })

      const scores = this.parseEvaluationScores(evalResponse.content)
      return scores

    } catch (error) {
      console.error('Metric calculation failed:', error)
      return { quality: 5, relevance: 5, coherence: 5 } // Default scores
    }
  }

  private parseEvaluationScores(evaluation: string): { quality: number; relevance: number; coherence: number } {
    const qualityMatch = evaluation.match(/Quality:\s*(\d+)/i)
    const relevanceMatch = evaluation.match(/Relevance:\s*(\d+)/i)
    const coherenceMatch = evaluation.match(/Coherence:\s*(\d+)/i)

    return {
      quality: qualityMatch ? parseInt(qualityMatch[1]) : 5,
      relevance: relevanceMatch ? parseInt(relevanceMatch[1]) : 5,
      coherence: coherenceMatch ? parseInt(coherenceMatch[1]) : 5
    }
  }

  async analyzeTestResults(testId: string): Promise<{
    winner: string
    results: Map<string, {
      variant: PromptVariant
      metrics: {
        avgQuality: number
        avgRelevance: number
        avgCoherence: number
        avgResponseTime: number
        avgCost: number
        successRate: number
      }
      confidence: number
    }>
    recommendations: string[]
  }> {
    const config = this.activeTests.get(testId)
    const results = this.testResults.get(testId)

    if (!config || !results) {
      throw new Error(`Test ${testId} not found`)
    }

    const analysis = new Map()
    let bestVariant = ''
    let bestScore = 0

    // Analyze each variant
    for (const variant of config.variants) {
      const variantResults = results.filter(r => r.variantId === variant.id)

      if (variantResults.length === 0) continue

      const metrics = {
        avgQuality: this.average(variantResults.map(r => r.metrics.qualityScore)),
        avgRelevance: this.average(variantResults.map(r => r.metrics.relevanceScore)),
        avgCoherence: this.average(variantResults.map(r => r.metrics.coherenceScore)),
        avgResponseTime: this.average(variantResults.map(r => r.metrics.responseTime)),
        avgCost: this.average(variantResults.map(r => r.metrics.cost)),
        successRate: variantResults.length / config.sampleSize
      }

      // Calculate overall score (weighted average)
      const overallScore = (metrics.avgQuality * 0.4) +
                          (metrics.avgRelevance * 0.3) +
                          (metrics.avgCoherence * 0.2) +
                          ((10 - Math.min(metrics.avgResponseTime / 1000, 10)) * 0.1)

      // Calculate confidence based on sample size and variance
      const qualityVariance = this.variance(variantResults.map(r => r.metrics.qualityScore))
      const confidence = Math.max(0, 100 - (qualityVariance * 10))

      if (overallScore > bestScore) {
        bestScore = overallScore
        bestVariant = variant.id
      }

      analysis.set(variant.id, {
        variant,
        metrics,
        confidence
      })
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, config)

    return {
      winner: bestVariant,
      results: analysis,
      recommendations
    }
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  private variance(numbers: number[]): number {
    const avg = this.average(numbers)
    const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2))
    return this.average(squaredDiffs)
  }

  private generateRecommendations(analysis: Map<string, any>, config: ABTestConfig): string[] {
    const recommendations: string[] = []

    // Find patterns in successful variants
    const sortedVariants = Array.from(analysis.values())
      .sort((a, b) => {
        const scoreA = (a.metrics.avgQuality + a.metrics.avgRelevance + a.metrics.avgCoherence) / 3
        const scoreB = (b.metrics.avgQuality + b.metrics.avgRelevance + b.metrics.avgCoherence) / 3
        return scoreB - scoreA
      })

    const topVariant = sortedVariants[0]
    const bottomVariant = sortedVariants[sortedVariants.length - 1]

    // Performance recommendations
    if (topVariant.metrics.avgResponseTime < bottomVariant.metrics.avgResponseTime) {
      recommendations.push('Consider optimizing prompt length for better response times')
    }

    if (topVariant.metrics.avgCost < bottomVariant.metrics.avgCost) {
      recommendations.push('Top performing variant is also more cost-effective')
    }

    // Quality recommendations
    if (topVariant.metrics.avgQuality > 8) {
      recommendations.push('Winning variant shows excellent quality scores - consider this pattern for future prompts')
    }

    if (topVariant.metrics.avgCoherence < 7) {
      recommendations.push('Consider improving prompt structure for better coherence')
    }

    // Statistical significance
    if (topVariant.confidence < 80) {
      recommendations.push('Consider running more test samples for higher statistical confidence')
    }

    return recommendations
  }

  // Utility method to create test configurations
  createPromptTest(
    testName: string,
    prompts: Array<{ name: string; prompt: string }>,
    testCases: Array<{ input: Record<string, any>; description: string }>
  ): ABTestConfig {
    const variants: PromptVariant[] = prompts.map((p, index) => ({
      id: `variant_${index + 1}`,
      name: p.name,
      prompt: p.prompt,
      metadata: {
        created: new Date(),
        author: 'system',
        description: `Variant ${index + 1}: ${p.name}`,
        expectedOutcome: 'High quality, relevant response'
      }
    }))

    const testCasesFormatted = testCases.map((tc, index) => ({
      id: `case_${index + 1}`,
      input: tc.input,
      evaluationCriteria: ['quality', 'relevance', 'coherence']
    }))

    return {
      testId: `test_${Date.now()}`,
      name: testName,
      description: `A/B test comparing ${prompts.length} prompt variants`,
      variants,
      testCases: testCasesFormatted,
      sampleSize: 3, // Start with small sample size for testing
      successMetrics: ['quality', 'relevance', 'coherence']
    }
  }
}

export const promptTester = new PromptABTestFramework()
```

This advanced prompt engineering skill provides comprehensive frameworks for conversation distillation, prompt optimization, and systematic A/B testing to ensure maximum effectiveness of AI interactions in production applications.