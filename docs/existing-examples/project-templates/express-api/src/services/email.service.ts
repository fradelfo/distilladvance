/**
 * Email Service
 * Handles email sending for user verification, password resets, and notifications
 */

import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    const emailConfig = config.get('email');

    if (!emailConfig.enabled) {
      logger.info('Email service is disabled');
      return;
    }

    if (!emailConfig.smtp?.host || !emailConfig.from) {
      logger.warn('Email service not configured - missing SMTP settings');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: emailConfig.smtp.auth
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;

      logger.info('Email service configured successfully', {
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure
      });
    } catch (error) {
      logger.error('Failed to configure email service', { error: error.message });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured - verification email not sent');
      return;
    }

    const verificationUrl = `${config.get('app').baseUrl}/verify-email?token=${token}`;

    const html = `
      <h2>Verify Your Email Address</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>Or copy and paste this URL in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `;

    await this.sendEmail(email, 'Verify Your Email Address', html);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured - password reset email not sent');
      return;
    }

    const resetUrl = `${config.get('app').baseUrl}/reset-password?token=${token}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy and paste this URL in your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail(email, 'Password Reset Request', html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      const result = await this.transporter.sendMail({
        from: config.get('email').from,
        to,
        subject,
        html
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message
      });
      throw error;
    }
  }
}