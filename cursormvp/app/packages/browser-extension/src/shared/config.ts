/**
 * Extension Configuration
 *
 * Centralized config for URLs and settings.
 * Uses import.meta.env for build-time configuration.
 */

// Default to localhost for development, production URL for builds
// MODE is 'development' when built with --mode development
const isDev = import.meta.env.MODE === 'development';

export const config = {
  // Web app URL (for login, dashboard, etc.)
  webUrl: isDev ? 'http://localhost:3002' : 'https://app.distill.ai',

  // API server URL
  apiUrl: isDev ? 'http://localhost:3001' : 'https://api.distill.ai',

  // Help docs URL
  helpUrl: 'https://distill.ai/help',
} as const;

// Convenience URLs
export const urls = {
  login: `${config.webUrl}/login`,
  dashboard: `${config.webUrl}/dashboard`,
  prompts: (id: string) => `${config.webUrl}/prompts/${id}`,
} as const;
