# Content Script Development Patterns Skill

## Skill Overview
Expert patterns for developing robust, secure, and performant content scripts that interact with AI chat sites, extract conversations, and inject UI components with minimal page impact.

## Core Capabilities

### Site-Specific Extraction Patterns

#### OpenAI ChatGPT Extraction
```typescript
// extractors/openai-chatgpt.ts
class ChatGPTExtractor implements ConversationExtractor {
  private readonly selectors = {
    chatContainer: 'main[class*="chat"]',
    messageGroups: '[data-testid^="conversation-turn"]',
    userMessages: '[data-message-author-role="user"]',
    assistantMessages: '[data-message-author-role="assistant"]',
    messageContent: '[class*="markdown"], .prose',
    messageTimestamp: 'time, [title*="AM"], [title*="PM"]',
    conversationTitle: 'title, h1, [class*="conversation-title"]',
    inputArea: 'form[class*="stretch"] textarea',
    regenerateButton: '[data-testid="send-button"]',
    copyButton: '[class*="copy"]'
  }

  async extractConversation(): Promise<ExtractedConversation> {
    const startTime = performance.now()

    try {
      // Wait for conversation to be fully loaded
      await this.waitForConversationLoad()

      const conversation = await this.parseConversationStructure()
      const metadata = await this.extractMetadata()

      const result: ExtractedConversation = {
        messages: conversation,
        metadata: {
          ...metadata,
          extractionTime: performance.now() - startTime,
          extractor: 'openai-chatgpt',
          site: 'chat.openai.com'
        }
      }

      console.log(`ChatGPT extraction completed: ${result.messages.length} messages in ${result.metadata.extractionTime.toFixed(2)}ms`)
      return result

    } catch (error) {
      console.error('ChatGPT extraction failed:', error)
      throw new ExtractionError('Failed to extract ChatGPT conversation', error)
    }
  }

  private async waitForConversationLoad(): Promise<void> {
    // Wait for the main chat container
    await this.waitForElement(this.selectors.chatContainer)

    // Wait for conversation to stabilize (no new messages for 1 second)
    await this.waitForConversationStability()

    // Wait for any loading indicators to disappear
    await this.waitForLoadingComplete()
  }

  private async waitForConversationStability(): Promise<void> {
    let lastMessageCount = 0
    let stableCount = 0

    while (stableCount < 3) { // 3 consecutive stable checks
      await new Promise(resolve => setTimeout(resolve, 500))

      const currentMessageCount = document.querySelectorAll(
        `${this.selectors.userMessages}, ${this.selectors.assistantMessages}`
      ).length

      if (currentMessageCount === lastMessageCount) {
        stableCount++
      } else {
        stableCount = 0
        lastMessageCount = currentMessageCount
      }
    }
  }

  private async parseConversationStructure(): Promise<ConversationMessage[]> {
    const messages: ConversationMessage[] = []

    // Get all message elements in chronological order
    const messageElements = this.getOrderedMessageElements()

    for (const [index, element] of messageElements.entries()) {
      try {
        const message = await this.parseMessageElement(element, index)
        if (message) {
          messages.push(message)
        }
      } catch (error) {
        console.warn(`Failed to parse message at index ${index}:`, error)
        // Continue with other messages
      }
    }

    return messages
  }

  private getOrderedMessageElements(): Element[] {
    // ChatGPT groups messages in conversation turns
    const messageGroups = Array.from(document.querySelectorAll(this.selectors.messageGroups))
    const allMessages: Element[] = []

    for (const group of messageGroups) {
      // Each group contains user message followed by assistant message(s)
      const userMessage = group.querySelector(this.selectors.userMessages)
      const assistantMessages = Array.from(group.querySelectorAll(this.selectors.assistantMessages))

      if (userMessage) {
        allMessages.push(userMessage)
      }

      allMessages.push(...assistantMessages)
    }

    return allMessages
  }

  private async parseMessageElement(element: Element, index: number): Promise<ConversationMessage | null> {
    const role = this.determineMessageRole(element)
    if (!role) return null

    const content = await this.extractMessageContent(element)
    if (!content.trim()) return null

    const timestamp = this.extractTimestamp(element)
    const metadata = this.extractMessageMetadata(element)

    return {
      id: `chatgpt-${index}-${Date.now()}`,
      role,
      content: this.cleanContent(content),
      timestamp,
      metadata: {
        ...metadata,
        elementXPath: this.getElementXPath(element),
        extractedAt: Date.now()
      }
    }
  }

  private determineMessageRole(element: Element): 'user' | 'assistant' | null {
    const roleAttr = element.getAttribute('data-message-author-role')
    if (roleAttr === 'user') return 'user'
    if (roleAttr === 'assistant') return 'assistant'

    // Fallback detection based on element structure
    const isUserMessage = element.closest('[data-message-author-role="user"]') ||
                         element.querySelector('.user-message') ||
                         this.hasUserMessageIndicators(element)

    if (isUserMessage) return 'user'

    const isAssistantMessage = element.closest('[data-message-author-role="assistant"]') ||
                              element.querySelector('.assistant-message') ||
                              this.hasAssistantMessageIndicators(element)

    return isAssistantMessage ? 'assistant' : null
  }

  private async extractMessageContent(element: Element): Promise<string> {
    // Try markdown content first
    const markdownElement = element.querySelector(this.selectors.messageContent)
    if (markdownElement) {
      return this.extractMarkdownContent(markdownElement)
    }

    // Fallback to text content
    const textContent = this.extractTextContent(element)
    return textContent
  }

  private extractMarkdownContent(element: Element): string {
    // Preserve code blocks and formatting
    const codeBlocks = Array.from(element.querySelectorAll('pre, code'))
    const codeBlockMap = new Map()

    // Replace code blocks with placeholders
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`
      codeBlockMap.set(placeholder, block.textContent || '')
      block.replaceWith(document.createTextNode(placeholder))
    })

    // Get text content
    let content = element.textContent || ''

    // Restore code blocks
    codeBlockMap.forEach((code, placeholder) => {
      content = content.replace(placeholder, `\`\`\`\n${code}\n\`\`\``)
    })

    return content
  }

  private extractMessageMetadata(element: Element): MessageMetadata {
    return {
      hasCodeBlocks: element.querySelectorAll('pre, code').length > 0,
      hasImages: element.querySelectorAll('img').length > 0,
      hasLinks: element.querySelectorAll('a').length > 0,
      wordCount: this.countWords(element.textContent || ''),
      characterCount: (element.textContent || '').length,
      containsTables: element.querySelectorAll('table').length > 0,
      containsLists: element.querySelectorAll('ul, ol').length > 0
    }
  }
}
```

#### Claude.ai Extraction
```typescript
// extractors/claude-ai.ts
class ClaudeAIExtractor implements ConversationExtractor {
  private readonly selectors = {
    chatContainer: '[data-testid="chat-interface"]',
    messageContainer: '[data-testid="message-container"]',
    userMessage: '[data-testid="user-message"]',
    assistantMessage: '[data-testid="assistant-message"]',
    messageContent: '[data-testid="message-content"]',
    messageText: '.message-text, .prose',
    inputArea: '[data-testid="message-input"]',
    conversationHeader: '[data-testid="conversation-header"]'
  }

  async extractConversation(): Promise<ExtractedConversation> {
    const startTime = performance.now()

    try {
      await this.waitForInterfaceLoad()

      const messages = await this.extractMessages()
      const metadata = await this.extractConversationMetadata()

      return {
        messages,
        metadata: {
          ...metadata,
          extractionTime: performance.now() - startTime,
          extractor: 'claude-ai',
          site: 'claude.ai'
        }
      }

    } catch (error) {
      console.error('Claude.ai extraction failed:', error)
      throw new ExtractionError('Failed to extract Claude conversation', error)
    }
  }

  private async waitForInterfaceLoad(): Promise<void> {
    // Wait for main chat interface
    await this.waitForElement(this.selectors.chatContainer, 10000)

    // Wait for at least one message to be present
    await this.waitForElement(`${this.selectors.userMessage}, ${this.selectors.assistantMessage}`, 5000)

    // Claude.ai uses streaming, so wait for completion
    await this.waitForStreamingComplete()
  }

  private async waitForStreamingComplete(): Promise<void> {
    let stableChecks = 0
    let lastContentHash = ''

    while (stableChecks < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const currentContent = this.getContentHash()
      if (currentContent === lastContentHash) {
        stableChecks++
      } else {
        stableChecks = 0
        lastContentHash = currentContent
      }

      // Check for typing indicators
      const isTyping = document.querySelector('[data-testid="typing-indicator"]') ||
                      document.querySelector('.animate-pulse') ||
                      document.querySelector('[class*="typing"]')

      if (isTyping) {
        stableChecks = 0
      }
    }
  }

  private async extractMessages(): Promise<ConversationMessage[]> {
    const messages: ConversationMessage[] = []

    // Claude.ai has alternating user/assistant messages
    const allMessageElements = Array.from(document.querySelectorAll(
      `${this.selectors.userMessage}, ${this.selectors.assistantMessage}`
    ))

    for (const [index, element] of allMessageElements.entries()) {
      const message = await this.parseClaudeMessage(element, index)
      if (message) {
        messages.push(message)
      }
    }

    return messages
  }

  private async parseClaudeMessage(element: Element, index: number): Promise<ConversationMessage | null> {
    const isUserMessage = element.matches(this.selectors.userMessage) ||
                         element.closest(this.selectors.userMessage)

    const role: 'user' | 'assistant' = isUserMessage ? 'user' : 'assistant'

    const contentElement = element.querySelector(this.selectors.messageContent) ||
                          element.querySelector(this.selectors.messageText) ||
                          element

    const content = this.extractClaudeContent(contentElement)
    if (!content.trim()) return null

    return {
      id: `claude-${index}-${Date.now()}`,
      role,
      content: this.cleanContent(content),
      timestamp: this.extractClaudeTimestamp(element),
      metadata: {
        hasCodeBlocks: element.querySelectorAll('pre, code').length > 0,
        hasArtifacts: element.querySelectorAll('[data-testid="artifact"]').length > 0,
        hasImages: element.querySelectorAll('img').length > 0,
        wordCount: this.countWords(content),
        extractedAt: Date.now()
      }
    }
  }

  private extractClaudeContent(element: Element): string {
    // Handle Claude's artifact system
    const artifacts = Array.from(element.querySelectorAll('[data-testid="artifact"]'))
    const artifactContents = artifacts.map(artifact => {
      const title = artifact.querySelector('[data-testid="artifact-title"]')?.textContent || 'Artifact'
      const content = artifact.querySelector('pre, code')?.textContent || artifact.textContent || ''
      return `\n[${title}]\n${content}\n`
    })

    // Get main message content (excluding artifacts)
    const mainContent = this.getTextWithoutArtifacts(element)

    return [mainContent, ...artifactContents].join('\n').trim()
  }

  private getTextWithoutArtifacts(element: Element): string {
    const clone = element.cloneNode(true) as Element

    // Remove artifact elements from clone
    const artifactElements = clone.querySelectorAll('[data-testid="artifact"]')
    artifactElements.forEach(artifact => artifact.remove())

    return clone.textContent || ''
  }
}
```

### Generic Extraction Framework

#### Universal Extractor
```typescript
// extractors/universal-extractor.ts
class UniversalConversationExtractor {
  private extractors = new Map<string, ConversationExtractor>()
  private fallbackExtractor: GenericExtractor

  constructor() {
    this.registerExtractors()
    this.fallbackExtractor = new GenericExtractor()
  }

  private registerExtractors(): void {
    this.extractors.set('chat.openai.com', new ChatGPTExtractor())
    this.extractors.set('claude.ai', new ClaudeAIExtractor())
    this.extractors.set('gemini.google.com', new GeminiExtractor())
    this.extractors.set('perplexity.ai', new PerplexityExtractor())
    this.extractors.set('character.ai', new CharacterAIExtractor())
    this.extractors.set('poe.com', new PoeExtractor())
  }

  async extractConversation(site?: string): Promise<ExtractedConversation> {
    const currentSite = site || window.location.hostname

    // Try site-specific extractor first
    const extractor = this.extractors.get(currentSite)
    if (extractor) {
      try {
        const result = await extractor.extractConversation()
        return this.enhanceExtraction(result)
      } catch (error) {
        console.warn(`Site-specific extraction failed for ${currentSite}, falling back to generic:`, error)
      }
    }

    // Fallback to generic extraction
    console.log(`Using generic extractor for ${currentSite}`)
    const result = await this.fallbackExtractor.extractConversation()
    return this.enhanceExtraction(result)
  }

  private enhanceExtraction(extraction: ExtractedConversation): ExtractedConversation {
    return {
      ...extraction,
      metadata: {
        ...extraction.metadata,
        enhancedAt: Date.now(),
        messageCount: extraction.messages.length,
        totalCharacters: extraction.messages.reduce((sum, msg) => sum + msg.content.length, 0),
        totalWords: extraction.messages.reduce((sum, msg) => sum + this.countWords(msg.content), 0),
        conversationDuration: this.calculateConversationDuration(extraction.messages),
        qualityScore: this.assessExtractionQuality(extraction)
      }
    }
  }

  private calculateConversationDuration(messages: ConversationMessage[]): number {
    if (messages.length < 2) return 0

    const timestamps = messages
      .map(msg => msg.timestamp)
      .filter(ts => ts && typeof ts === 'number')
      .sort((a, b) => a - b)

    if (timestamps.length < 2) return 0

    return timestamps[timestamps.length - 1] - timestamps[0]
  }

  private assessExtractionQuality(extraction: ExtractedConversation): number {
    let score = 0

    // Base score for successful extraction
    score += 30

    // Points for message count
    score += Math.min(extraction.messages.length * 2, 20)

    // Points for content richness
    const hasCodeBlocks = extraction.messages.some(msg => msg.metadata?.hasCodeBlocks)
    const hasImages = extraction.messages.some(msg => msg.metadata?.hasImages)
    const hasLinks = extraction.messages.some(msg => msg.metadata?.hasLinks)

    if (hasCodeBlocks) score += 15
    if (hasImages) score += 10
    if (hasLinks) score += 5

    // Points for metadata completeness
    const hasTimestamps = extraction.messages.every(msg => msg.timestamp)
    const hasRoles = extraction.messages.every(msg => msg.role)

    if (hasTimestamps) score += 10
    if (hasRoles) score += 10

    return Math.min(score, 100)
  }
}

// Generic fallback extractor
class GenericExtractor implements ConversationExtractor {
  async extractConversation(): Promise<ExtractedConversation> {
    const messages = await this.findConversationElements()
    const metadata = this.extractBasicMetadata()

    return {
      messages,
      metadata: {
        ...metadata,
        extractor: 'generic',
        site: window.location.hostname,
        extractedAt: Date.now()
      }
    }
  }

  private async findConversationElements(): Promise<ConversationMessage[]> {
    // Look for common conversation patterns
    const conversationPatterns = [
      // Modern chat applications
      '[role="log"] [role="article"]',
      '[class*="message"], [class*="chat"]',
      '[data-testid*="message"]',

      // Traditional forums and comments
      '.comment, .post, .reply',
      '[class*="conversation"] > div',

      // AI chat interfaces
      '.user-message, .ai-message, .assistant-message',
      '[data-role="user"], [data-role="assistant"]',

      // Generic content containers
      'article, .content, .text-content'
    ]

    const messages: ConversationMessage[] = []

    for (const pattern of conversationPatterns) {
      const elements = document.querySelectorAll(pattern)
      if (elements.length > 1) { // Need multiple elements for conversation
        const extracted = await this.parseGenericElements(Array.from(elements))
        if (extracted.length > 0) {
          return extracted // Return first successful extraction
        }
      }
    }

    return messages
  }

  private async parseGenericElements(elements: Element[]): Promise<ConversationMessage[]> {
    const messages: ConversationMessage[] = []

    for (const [index, element] of elements.entries()) {
      const content = this.extractTextContent(element)
      if (!content.trim() || content.length < 10) continue

      const role = this.guessMessageRole(element, index)
      const timestamp = this.extractGenericTimestamp(element)

      messages.push({
        id: `generic-${index}-${Date.now()}`,
        role,
        content: this.cleanContent(content),
        timestamp,
        metadata: {
          confidence: this.calculateConfidence(element, content),
          extractedAt: Date.now(),
          elementTag: element.tagName.toLowerCase(),
          elementClasses: Array.from(element.classList)
        }
      })
    }

    return messages
  }

  private guessMessageRole(element: Element, index: number): 'user' | 'assistant' {
    // Look for role indicators in classes, attributes, or content
    const indicators = {
      user: ['user', 'human', 'me', 'question', 'input', 'query'],
      assistant: ['assistant', 'ai', 'bot', 'response', 'answer', 'reply', 'gpt', 'claude', 'gemini']
    }

    const elementText = element.className.toLowerCase() + ' ' +
                       (element.getAttribute('data-role') || '') + ' ' +
                       (element.textContent?.toLowerCase().substring(0, 100) || '')

    // Check for explicit indicators
    for (const [role, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword => elementText.includes(keyword))) {
        return role as 'user' | 'assistant'
      }
    }

    // Fallback: alternate roles based on position
    return index % 2 === 0 ? 'user' : 'assistant'
  }

  private calculateConfidence(element: Element, content: string): number {
    let confidence = 50 // Base confidence

    // Increase confidence for clear conversation indicators
    const conversationIndicators = [
      'message', 'chat', 'conversation', 'dialogue',
      'user', 'assistant', 'ai', 'bot', 'response'
    ]

    const elementContext = element.className + ' ' + (element.getAttribute('role') || '')
    const hasIndicators = conversationIndicators.some(indicator =>
      elementContext.toLowerCase().includes(indicator)
    )

    if (hasIndicators) confidence += 30

    // Adjust based on content quality
    if (content.length > 50) confidence += 10
    if (content.length > 200) confidence += 10

    // Check for question/answer patterns
    if (content.includes('?')) confidence += 5
    if (content.match(/\b(how|what|why|when|where|who)\b/i)) confidence += 10

    return Math.min(confidence, 95) // Never 100% confident with generic extraction
  }
}
```

### UI Injection Patterns

#### Secure Shadow DOM UI
```typescript
// ui/shadow-dom-injector.ts
class SecureShadowDOMInjector {
  private shadowRoot: ShadowRoot | null = null
  private uiContainer: HTMLElement | null = null
  private injectedComponents = new Map<string, ShadowUIComponent>()

  async createSecureUIContainer(): Promise<ShadowRoot> {
    if (this.shadowRoot) {
      return this.shadowRoot
    }

    // Create isolated container
    const container = document.createElement('div')
    container.id = 'ai-distiller-secure-ui'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483647;
      pointer-events: none;
    `

    // Create closed shadow DOM for maximum isolation
    this.shadowRoot = container.attachShadow({
      mode: 'closed',
      delegatesFocus: false
    })

    // Inject base styles that won't affect host page
    this.injectBaseStyles()

    // Append to document
    document.documentElement.appendChild(container)

    // Setup event isolation
    this.setupEventIsolation()

    return this.shadowRoot
  }

  private injectBaseStyles(): void {
    if (!this.shadowRoot) return

    const styleSheet = new CSSStyleSheet()
    styleSheet.replaceSync(`
      /* Reset styles to prevent host page interference */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Component styles */
      .ai-distiller-component {
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        border: 1px solid #e1e5e9;
        font-size: 14px;
        line-height: 1.4;
        color: #2d3748;
        pointer-events: all;
        z-index: 10000;
      }

      /* Animation classes */
      .fade-in {
        animation: fadeIn 0.2s ease-out;
      }

      .fade-out {
        animation: fadeOut 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }

      /* Button styles */
      .btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn:active {
        transform: translateY(0);
      }

      .btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
      }

      .btn-secondary:hover {
        background: #cbd5e0;
        box-shadow: 0 2px 8px rgba(74, 85, 104, 0.2);
      }

      /* Input styles */
      .input {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      /* Utility classes */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `)

    this.shadowRoot.adoptedStyleSheets = [styleSheet]
  }

  async injectExtractionTrigger(options: UIInjectionOptions): Promise<ShadowUIComponent> {
    if (!this.shadowRoot) {
      throw new Error('Shadow DOM container not created')
    }

    const triggerComponent = document.createElement('div')
    triggerComponent.className = 'ai-distiller-component fade-in'
    triggerComponent.style.cssText = `
      top: ${options.position?.top || '20px'};
      right: ${options.position?.right || '20px'};
      padding: 12px;
      min-width: 200px;
    `

    triggerComponent.innerHTML = `
      <div class="extraction-trigger">
        <div class="trigger-header">
          <h3 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
            🪄 AI Conversation Distiller
          </h3>
          <p style="margin-bottom: 12px; font-size: 12px; color: #718096;">
            Transform this conversation into a reusable prompt
          </p>
        </div>

        <div class="trigger-actions" style="display: flex; gap: 8px;">
          <button class="btn" id="extract-btn">
            Extract Conversation
          </button>
          <button class="btn btn-secondary" id="close-btn">
            ×
          </button>
        </div>
      </div>
    `

    // Setup event handlers
    const extractBtn = triggerComponent.querySelector('#extract-btn') as HTMLButtonElement
    const closeBtn = triggerComponent.querySelector('#close-btn') as HTMLButtonElement

    extractBtn.addEventListener('click', async () => {
      await this.handleExtractionTrigger(options.onExtract)
    })

    closeBtn.addEventListener('click', () => {
      this.removeComponent('extraction-trigger')
    })

    this.shadowRoot.appendChild(triggerComponent)

    const component: ShadowUIComponent = {
      id: 'extraction-trigger',
      element: triggerComponent,
      remove: () => this.removeComponent('extraction-trigger'),
      update: (newOptions: Partial<UIInjectionOptions>) => this.updateComponent('extraction-trigger', newOptions)
    }

    this.injectedComponents.set('extraction-trigger', component)
    return component
  }

  async injectProgressIndicator(message: string): Promise<ShadowUIComponent> {
    if (!this.shadowRoot) {
      throw new Error('Shadow DOM container not created')
    }

    const progressComponent = document.createElement('div')
    progressComponent.className = 'ai-distiller-component fade-in'
    progressComponent.style.cssText = `
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 24px;
      text-align: center;
      min-width: 250px;
    `

    progressComponent.innerHTML = `
      <div class="progress-indicator">
        <div class="spinner" style="
          width: 32px;
          height: 32px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <p style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">
          ${message}
        </p>
        <p style="font-size: 12px; color: #718096;">
          This may take a few moments...
        </p>
      </div>

      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `

    this.shadowRoot.appendChild(progressComponent)

    const component: ShadowUIComponent = {
      id: 'progress-indicator',
      element: progressComponent,
      remove: () => this.removeComponent('progress-indicator'),
      update: (newMessage: string) => {
        const messageElement = progressComponent.querySelector('p')
        if (messageElement) {
          messageElement.textContent = newMessage
        }
      }
    }

    this.injectedComponents.set('progress-indicator', component)
    return component
  }

  async injectNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): Promise<ShadowUIComponent> {
    if (!this.shadowRoot) {
      throw new Error('Shadow DOM container not created')
    }

    const colors = {
      success: { bg: '#48bb78', border: '#38a169' },
      error: { bg: '#f56565', border: '#e53e3e' },
      info: { bg: '#4299e1', border: '#3182ce' }
    }

    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    }

    const notificationComponent = document.createElement('div')
    notificationComponent.className = 'ai-distiller-component fade-in'
    notificationComponent.style.cssText = `
      top: 20px;
      right: 20px;
      padding: 16px;
      background: ${colors[type].bg};
      border: 1px solid ${colors[type].border};
      color: white;
      min-width: 250px;
      max-width: 400px;
    `

    notificationComponent.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 16px;">${icons[type]}</span>
        <div style="flex: 1;">
          <p style="font-size: 14px; font-weight: 500; line-height: 1.4;">
            ${message}
          </p>
        </div>
        <button class="close-notification" style="
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        ">×</button>
      </div>
    `

    // Setup close handler
    const closeBtn = notificationComponent.querySelector('.close-notification') as HTMLButtonElement
    closeBtn.addEventListener('click', () => {
      this.removeComponent('notification')
    })

    this.shadowRoot.appendChild(notificationComponent)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeComponent('notification')
    }, 5000)

    const component: ShadowUIComponent = {
      id: 'notification',
      element: notificationComponent,
      remove: () => this.removeComponent('notification'),
      update: () => {} // Notifications are not updatable
    }

    this.injectedComponents.set('notification', component)
    return component
  }

  private setupEventIsolation(): void {
    if (!this.shadowRoot) return

    // Prevent event bubbling to host page
    this.shadowRoot.addEventListener('click', (event) => {
      event.stopPropagation()
    }, true)

    this.shadowRoot.addEventListener('keydown', (event) => {
      // Allow ESC to close components
      if (event.key === 'Escape') {
        this.removeAllComponents()
      }
      event.stopPropagation()
    }, true)
  }

  private async handleExtractionTrigger(onExtract?: () => Promise<void>): Promise<void> {
    try {
      // Show progress
      await this.injectProgressIndicator('Extracting conversation...')

      // Remove trigger
      this.removeComponent('extraction-trigger')

      // Call extraction handler
      if (onExtract) {
        await onExtract()
      }

      // Remove progress
      this.removeComponent('progress-indicator')

      // Show success
      await this.injectNotification('Conversation extracted successfully!', 'success')

    } catch (error) {
      console.error('Extraction failed:', error)

      // Remove progress
      this.removeComponent('progress-indicator')

      // Show error
      await this.injectNotification(
        `Extraction failed: ${error.message}`,
        'error'
      )
    }
  }

  removeComponent(id: string): void {
    const component = this.injectedComponents.get(id)
    if (component) {
      component.element.classList.add('fade-out')
      setTimeout(() => {
        component.element.remove()
        this.injectedComponents.delete(id)
      }, 200)
    }
  }

  removeAllComponents(): void {
    for (const [id] of this.injectedComponents) {
      this.removeComponent(id)
    }
  }

  updateComponent(id: string, options: any): void {
    const component = this.injectedComponents.get(id)
    if (component && component.update) {
      component.update(options)
    }
  }
}
```

### Performance and Error Handling

#### Robust Content Script Framework
```typescript
// framework/content-script-framework.ts
class RobustContentScriptFramework {
  private extractor: UniversalConversationExtractor
  private uiInjector: SecureShadowDOMInjector
  private errorHandler: ContentScriptErrorHandler
  private performanceMonitor: PerformanceMonitor

  constructor() {
    this.extractor = new UniversalConversationExtractor()
    this.uiInjector = new SecureShadowDOMInjector()
    this.errorHandler = new ContentScriptErrorHandler()
    this.performanceMonitor = new PerformanceMonitor()
  }

  async initialize(): Promise<void> {
    try {
      // Setup error handling
      this.errorHandler.setupGlobalHandlers()

      // Initialize performance monitoring
      await this.performanceMonitor.start()

      // Wait for page readiness
      await this.waitForPageReady()

      // Check if this is an AI chat site
      const isAIChat = await this.detectAIChatSite()
      if (!isAIChat) {
        console.log('Not an AI chat site, skipping initialization')
        return
      }

      // Setup UI and extraction
      await this.setupAIFeatures()

      console.log('Content script initialized successfully')

    } catch (error) {
      this.errorHandler.handleError(error, 'initialization')
    }
  }

  private async setupAIFeatures(): Promise<void> {
    // Create secure UI container
    await this.uiInjector.createSecureUIContainer()

    // Setup conversation monitoring
    this.setupConversationMonitoring()

    // Inject extraction UI
    await this.injectExtractionUI()

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts()

    // Setup automatic extraction triggers
    this.setupAutoExtraction()
  }

  private async injectExtractionUI(): Promise<void> {
    await this.uiInjector.injectExtractionTrigger({
      position: { top: '20px', right: '20px' },
      onExtract: async () => {
        await this.performExtraction()
      }
    })
  }

  private async performExtraction(): Promise<void> {
    const startTime = performance.now()

    try {
      // Extract conversation
      const conversation = await this.extractor.extractConversation()

      // Send to background script
      const response = await chrome.runtime.sendMessage({
        type: 'CONVERSATION_EXTRACTED',
        data: {
          conversation,
          site: window.location.hostname,
          timestamp: Date.now()
        }
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to process extraction')
      }

      // Record performance
      this.performanceMonitor.recordMetric('extraction_time', performance.now() - startTime)

      console.log('Extraction completed successfully')

    } catch (error) {
      this.errorHandler.handleError(error, 'extraction')
      throw error
    }
  }

  private setupConversationMonitoring(): void {
    let lastConversationHash = ''
    let checkInterval: number

    const checkForUpdates = async () => {
      try {
        const currentHash = await this.getConversationHash()

        if (currentHash !== lastConversationHash) {
          lastConversationHash = currentHash
          this.onConversationUpdate()
        }
      } catch (error) {
        // Silently handle monitoring errors
        console.debug('Conversation monitoring error:', error)
      }
    }

    // Start monitoring
    checkInterval = window.setInterval(checkForUpdates, 2000)

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(checkInterval)
    })
  }

  private async getConversationHash(): Promise<string> {
    // Simple hash of conversation content for change detection
    const conversations = document.querySelectorAll('[class*="message"], [class*="chat"]')
    const content = Array.from(conversations)
      .map(el => el.textContent?.trim() || '')
      .join('|')

    // Simple hash function
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return hash.toString()
  }

  private onConversationUpdate(): void {
    // Notify background script of conversation changes
    chrome.runtime.sendMessage({
      type: 'CONVERSATION_UPDATED',
      data: {
        site: window.location.hostname,
        timestamp: Date.now()
      }
    }).catch(error => {
      console.debug('Failed to notify background of conversation update:', error)
    })
  }
}

// Initialize framework when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new RobustContentScriptFramework().initialize()
  })
} else {
  new RobustContentScriptFramework().initialize()
}
```

This comprehensive content script patterns skill provides robust, secure, and performant patterns for extracting conversations from AI chat sites while maintaining excellent user experience and minimal page interference.