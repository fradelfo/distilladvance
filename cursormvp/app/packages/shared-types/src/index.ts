/**
 * Shared Types for Distill
 * Central type definitions used across browser extension, web app, and API
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  source: ConversationSource;
  sourceUrl?: string;
  messages: ConversationMessage[];
  metadata?: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationMetadata {
  model?: string;
  messageCount?: number;
  tokenCount?: number;
  duration?: number;
  [key: string]: unknown;
}

export type ConversationSource = 'chatgpt' | 'claude' | 'gemini' | 'copilot' | 'other';

export interface Prompt {
  id: string;
  userId: string;
  conversationId?: string;
  title: string;
  content: string;
  distilledFrom?: string;
  model?: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  rating?: number;
  metadata?: PromptMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptMetadata {
  originalLength?: number;
  distilledLength?: number;
  compressionRatio?: number;
  qualityScore?: number;
  [key: string]: unknown;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  promptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMetadata {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// AI/LLM Types
// ============================================================================

export type AiProvider = 'openai' | 'anthropic' | 'google';

export interface AiModel {
  id: string;
  provider: AiProvider;
  name: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export interface DistillRequest {
  conversationId?: string;
  messages: ConversationMessage[];
  options?: DistillOptions;
}

export interface DistillOptions {
  model?: string;
  maxLength?: number;
  preserveContext?: boolean;
  extractTechniques?: boolean;
  generateVariations?: boolean;
}

export interface DistillResult {
  promptId: string;
  content: string;
  title: string;
  tags: string[];
  metadata: PromptMetadata;
  variations?: string[];
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

// ============================================================================
// Extension Types
// ============================================================================

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload: T;
  source: 'content' | 'popup' | 'background' | 'options';
  timestamp: number;
}

export type ExtensionMessageType =
  | 'CAPTURE_CONVERSATION'
  | 'CONVERSATION_CAPTURED'
  | 'DISTILL_REQUEST'
  | 'DISTILL_COMPLETE'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'AUTH_STATUS'
  | 'ERROR';

export interface ExtensionSettings {
  autoCapture: boolean;
  captureOnNavigate: boolean;
  showNotifications: boolean;
  defaultPrivacy: 'public' | 'private';
  syncEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface CapturedConversation {
  source: ConversationSource;
  url: string;
  title: string;
  messages: ConversationMessage[];
  capturedAt: Date;
}

// ============================================================================
// Search & Vector Types
// ============================================================================

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  pagination?: PaginationParams;
}

export interface SearchFilters {
  sources?: ConversationSource[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  isPublic?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  scores?: number[];
}

export interface SimilarPromptResult {
  prompt: Prompt;
  similarity: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & { id: string };

// ============================================================================
// Analytics Types (PRD Section 7.1)
// ============================================================================

/**
 * All trackable event types in Distill.
 * Based on PRD Section 7.1 - MVP tracking events.
 */
export type AnalyticsEventType =
  | 'user_signed_up'
  | 'workspace_created'
  | 'extension_installed'
  | 'chat_captured'
  | 'prompt_created'
  | 'prompt_run'
  | 'prompt_edited'
  | 'coach_used'
  | 'member_invited'
  | 'search_performed'
  | 'page_viewed'
  | 'feature_used';

/**
 * Base properties included with every event.
 */
export interface AnalyticsBaseProperties {
  timestamp: string;
  sessionId?: string;
  userId?: string;
  workspaceId?: string;
}

/**
 * Event-specific property types.
 */
export interface UserSignedUpProperties extends AnalyticsBaseProperties {
  source: 'organic' | 'referral' | 'invite' | 'marketing';
  referrer?: string;
  method: 'email' | 'google' | 'github';
}

export interface WorkspaceCreatedProperties extends AnalyticsBaseProperties {
  privacyDefault: 'prompt_only' | 'full_chat';
  workspaceName?: string;
}

export interface ExtensionInstalledProperties extends AnalyticsBaseProperties {
  browser: 'chrome' | 'firefox' | 'edge' | 'safari';
  version: string;
  extensionVersion: string;
}

export interface ChatCapturedProperties extends AnalyticsBaseProperties {
  platform: ConversationSource;
  privacyMode: 'prompt_only' | 'full_chat';
  tokenCount: number;
  messageCount: number;
}

export interface PromptCreatedProperties extends AnalyticsBaseProperties {
  source: 'capture' | 'manual' | 'import';
  hasVariables: boolean;
  variableCount: number;
  tagCount: number;
}

export interface PromptRunProperties extends AnalyticsBaseProperties {
  platform: ConversationSource | 'clipboard';
  variableCount: number;
  promptId: string;
  isShared: boolean;
}

export interface PromptEditedProperties extends AnalyticsBaseProperties {
  editType: 'title' | 'content' | 'variables' | 'tags' | 'multiple';
  timeSinceCreationMs: number;
  promptId: string;
}

export interface CoachUsedProperties extends AnalyticsBaseProperties {
  suggestionsShown: number;
  suggestionsApplied: number;
  focusArea?: string;
  qualityScore?: number;
  promptId: string;
}

export interface MemberInvitedProperties extends AnalyticsBaseProperties {
  count: number;
  method: 'email' | 'link';
}

export interface SearchPerformedProperties extends AnalyticsBaseProperties {
  queryLength: number;
  resultsCount: number;
  searchType: 'text' | 'semantic';
  hasFilters: boolean;
}

export interface PageViewedProperties extends AnalyticsBaseProperties {
  path: string;
  referrer?: string;
  duration?: number;
}

export interface FeatureUsedProperties extends AnalyticsBaseProperties {
  feature: string;
  action: string;
  metadata?: Record<string, unknown>;
}

/**
 * Union type for all event properties.
 */
export type AnalyticsEventProperties =
  | { event: 'user_signed_up'; properties: UserSignedUpProperties }
  | { event: 'workspace_created'; properties: WorkspaceCreatedProperties }
  | { event: 'extension_installed'; properties: ExtensionInstalledProperties }
  | { event: 'chat_captured'; properties: ChatCapturedProperties }
  | { event: 'prompt_created'; properties: PromptCreatedProperties }
  | { event: 'prompt_run'; properties: PromptRunProperties }
  | { event: 'prompt_edited'; properties: PromptEditedProperties }
  | { event: 'coach_used'; properties: CoachUsedProperties }
  | { event: 'member_invited'; properties: MemberInvitedProperties }
  | { event: 'search_performed'; properties: SearchPerformedProperties }
  | { event: 'page_viewed'; properties: PageViewedProperties }
  | { event: 'feature_used'; properties: FeatureUsedProperties };

/**
 * Analytics configuration.
 */
export interface AnalyticsConfig {
  enabled: boolean;
  provider: 'posthog' | 'custom';
  apiKey?: string;
  host?: string;
  debug?: boolean;
}

/**
 * Dashboard metrics types.
 */
export interface ActivationFunnelMetrics {
  signups: number;
  workspacesCreated: number;
  extensionsInstalled: number;
  firstCapture: number;
  thirdCapture: number;
  conversionRates: {
    signupToWorkspace: number;
    workspaceToExtension: number;
    extensionToFirstCapture: number;
    firstToThirdCapture: number;
    overall: number;
  };
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  promptsPerUser: number;
  runsPerPrompt: number;
  averageSessionDuration: number;
}

export interface TeamHealthMetrics {
  activeWorkspaces: number;
  seatsPerWorkspace: number;
  sharedPromptsUsage: number;
  collaborationRate: number;
}

export interface FeatureAdoptionMetrics {
  coachUsageRate: number;
  semanticSearchUsageRate: number;
  privacyModeDistribution: {
    promptOnly: number;
    fullChat: number;
  };
  platformDistribution: Record<ConversationSource, number>;
}

export interface DashboardMetrics {
  activation: ActivationFunnelMetrics;
  engagement: EngagementMetrics;
  teamHealth: TeamHealthMetrics;
  featureAdoption: FeatureAdoptionMetrics;
  period: {
    start: string;
    end: string;
  };
}
