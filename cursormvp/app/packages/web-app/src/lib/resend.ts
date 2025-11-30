/**
 * Resend Email Client
 *
 * Configured Resend client for sending transactional emails.
 */

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('[Resend] RESEND_API_KEY not set - email sending disabled');
}

// Only create client if API key exists
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Distill <noreply@distill.app>';
