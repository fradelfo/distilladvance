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
