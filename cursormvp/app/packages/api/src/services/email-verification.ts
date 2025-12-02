/**
 * Email Verification Service
 *
 * Handles email verification token generation, sending, and validation.
 */

import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { EMAIL_FROM, resend } from '../lib/resend.js';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const WEB_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a verification token for a user
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = generateVerificationToken();
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${WEB_APP_URL}/verify-email?token=${token}`;

  if (!resend) {
    console.warn('[EmailVerification] Resend client not configured - email not sent');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify your email address - Distill',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 40px;">💧</span>
              <h1 style="margin: 10px 0; color: #0ea5e9;">Distill</h1>
            </div>

            <h2 style="color: #1f2937;">Verify your email address</h2>

            <p>Thanks for signing up for Distill! Please verify your email address by clicking the button below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #0ea5e9; word-break: break-all;">${verificationUrl}</a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in ${VERIFICATION_TOKEN_EXPIRY_HOURS} hours.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              If you didn't create an account with Distill, you can safely ignore this email.
            </p>
          </body>
        </html>
      `,
      text: `
Verify your email address

Thanks for signing up for Distill! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in ${VERIFICATION_TOKEN_EXPIRY_HOURS} hours.

If you didn't create an account with Distill, you can safely ignore this email.
      `.trim(),
    });

    if (error) {
      console.error('[EmailVerification] Failed to send email:', error);
      return false;
    }

    console.log('[EmailVerification] Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('[EmailVerification] Error sending email:', error);
    return false;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    // Find the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Check if expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { success: false, error: 'Verification token has expired' };
    }

    const email = verificationToken.identifier;

    // Update user's emailVerified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    console.log('[EmailVerification] Email verified for:', email);
    return { success: true, email };
  } catch (error) {
    console.error('[EmailVerification] Error verifying token:', error);
    return { success: false, error: 'Failed to verify email' };
  }
}

/**
 * Resend verification email for a user
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists and is not already verified
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    // Create new token and send email
    const token = await createVerificationToken(email);
    const sent = await sendVerificationEmail(email, token);

    if (!sent) {
      return { success: false, error: 'Failed to send verification email' };
    }

    return { success: true };
  } catch (error) {
    console.error('[EmailVerification] Error resending verification:', error);
    return { success: false, error: 'Failed to resend verification email' };
  }
}
