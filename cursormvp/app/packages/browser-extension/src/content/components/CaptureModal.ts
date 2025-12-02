/**
 * Content Script Capture Modal
 * Floating modal overlay injected into AI chat pages for capturing conversations
 * Uses Shadow DOM for style isolation
 */

import type { CapturedConversation } from '@distill/shared-types';
import { MessageTypes } from '../../shared/messages';

type ModalState = 'preview' | 'processing' | 'success' | 'error';
type PrivacyMode = 'prompt-only' | 'full';

interface ModalConfig {
  conversation: CapturedConversation | null;
  onDistill?: (result: { title: string; privacyMode: PrivacyMode }) => void;
  onClose?: () => void;
}

export class CaptureModal {
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private state: ModalState = 'preview';
  private privacyMode: PrivacyMode = 'prompt-only';
  private config: ModalConfig;

  constructor(config: ModalConfig) {
    this.config = config;
  }

  public show(): void {
    if (this.container) {
      this.remove();
    }

    this.createModal();
  }

  public remove(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.shadow = null;
    }
  }

  public updateState(state: ModalState): void {
    this.state = state;
    this.render();
  }

  private createModal(): void {
    // Create container with shadow DOM for style isolation
    this.container = document.createElement('div');
    this.container.id = 'distill-capture-modal';
    this.shadow = this.container.attachShadow({ mode: 'closed' });

    // Render initial content
    this.render();

    // Add to page
    document.body.appendChild(this.container);

    // Focus trap
    this.setupFocusTrap();

    // Escape key handler
    this.setupEscapeHandler();
  }

  private render(): void {
    if (!this.shadow) return;

    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-container">
          ${this.renderHeader()}
          <div class="modal-content">
            ${this.renderContent()}
          </div>
          ${this.state === 'preview' ? this.renderFooter() : ''}
        </div>
      </div>
    `;

    // Add event listeners after render
    this.attachEventListeners();
  }

  private renderHeader(): string {
    const title =
      this.state === 'success'
        ? 'Prompt Created!'
        : this.state === 'error'
          ? 'Something went wrong'
          : 'Distill this conversation';

    return `
      <header class="modal-header">
        <div class="modal-title-section">
          <div class="modal-icon">D</div>
          <h2 id="modal-title" class="modal-title">${title}</h2>
        </div>
        ${
          this.state !== 'processing'
            ? `
          <button type="button" class="modal-close" data-action="close" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        `
            : ''
        }
      </header>
    `;
  }

  private renderContent(): string {
    switch (this.state) {
      case 'preview':
        return this.renderPreviewState();
      case 'processing':
        return this.renderProcessingState();
      case 'success':
        return this.renderSuccessState();
      case 'error':
        return this.renderErrorState();
      default:
        return '';
    }
  }

  private renderPreviewState(): string {
    const messages = this.config.conversation?.messages || [];
    const previewMessages = messages.slice(0, 3);
    const remainingCount = messages.length - 3;

    return `
      <div class="preview-section">
        <div class="preview-label">Preview</div>
        <div class="preview-messages">
          ${
            previewMessages.length > 0
              ? previewMessages
                  .map(
                    (msg) => `
                <div class="message-item">
                  <span class="message-role ${msg.role}">${msg.role === 'user' ? 'You' : 'AI'}</span>
                  <p class="message-content">${this.truncate(msg.content, 100)}</p>
                </div>
              `
                  )
                  .join('')
              : `
                <div class="preview-empty">
                  <span class="empty-icon">!</span>
                  <p>No messages found</p>
                </div>
              `
          }
          ${remainingCount > 0 ? `<div class="more-messages">+ ${remainingCount} more message${remainingCount !== 1 ? 's' : ''}</div>` : ''}
        </div>
      </div>

      <div class="privacy-section">
        <div class="privacy-label">Privacy Mode</div>
        <div class="privacy-options">
          <label class="privacy-option ${this.privacyMode === 'prompt-only' ? 'selected' : ''}">
            <input type="radio" name="privacy" value="prompt-only" ${this.privacyMode === 'prompt-only' ? 'checked' : ''}>
            <div class="option-content">
              <div class="option-header">
                <span class="option-title">Prompt only</span>
                <span class="recommended-badge">Recommended</span>
              </div>
              <p class="option-description">Only the distilled template is saved</p>
            </div>
            <span class="radio-indicator"></span>
          </label>
          <label class="privacy-option ${this.privacyMode === 'full' ? 'selected' : ''}">
            <input type="radio" name="privacy" value="full" ${this.privacyMode === 'full' ? 'checked' : ''}>
            <div class="option-content">
              <span class="option-title">Full conversation</span>
              <p class="option-description">Raw chat saved for reference</p>
            </div>
            <span class="radio-indicator"></span>
          </label>
        </div>
      </div>
    `;
  }

  private renderProcessingState(): string {
    return `
      <div class="processing-container">
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        <h3 class="processing-title">Distilling your conversation...</h3>
        <div class="progress-container">
          <div class="progress-track">
            <div class="progress-fill" style="width: 50%"></div>
          </div>
          <span class="progress-text">Processing...</span>
        </div>
      </div>
    `;
  }

  private renderSuccessState(): string {
    return `
      <div class="success-container">
        <div class="success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="result-card">
          <h3 class="result-title">"${this.config.conversation?.title || 'Untitled Prompt'}"</h3>
          <div class="result-meta">
            <span class="meta-item">
              <span class="meta-label">Messages:</span>
              <span class="meta-value">${this.config.conversation?.messages.length || 0}</span>
            </span>
          </div>
        </div>
        <div class="success-actions">
          <button type="button" class="btn-primary" data-action="view-edit">View & Edit</button>
          <button type="button" class="btn-secondary" data-action="close">Done</button>
        </div>
      </div>
    `;
  }

  private renderErrorState(): string {
    return `
      <div class="error-container">
        <div class="error-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-message">Couldn't distill this conversation. Please try again.</p>
        <div class="error-actions">
          <button type="button" class="btn-secondary" data-action="close">Dismiss</button>
          <button type="button" class="btn-primary" data-action="retry">Try Again</button>
        </div>
      </div>
    `;
  }

  private renderFooter(): string {
    return `
      <footer class="modal-footer">
        <button type="button" class="btn-secondary" data-action="close">Cancel</button>
        <button type="button" class="btn-primary" data-action="distill">
          Distill
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"></path>
          </svg>
        </button>
      </footer>
    `;
  }

  private attachEventListeners(): void {
    if (!this.shadow) return;

    // Close button and overlay click
    this.shadow.querySelectorAll('[data-action="close"]').forEach((el) => {
      el.addEventListener('click', () => this.handleClose());
    });

    // Overlay backdrop click
    const overlay = this.shadow.querySelector('.modal-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay && this.state !== 'processing') {
        this.handleClose();
      }
    });

    // Privacy mode selection
    this.shadow.querySelectorAll('input[name="privacy"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        this.privacyMode = (e.target as HTMLInputElement).value as PrivacyMode;
        this.render();
      });
    });

    // Distill button
    this.shadow.querySelector('[data-action="distill"]')?.addEventListener('click', () => {
      this.handleDistill();
    });

    // Retry button
    this.shadow.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      this.state = 'preview';
      this.render();
    });

    // View & Edit button
    this.shadow.querySelector('[data-action="view-edit"]')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'OPEN_DASHBOARD',
        payload: {},
      });
      this.handleClose();
    });
  }

  private setupFocusTrap(): void {
    if (!this.shadow) return;

    const modal = this.shadow.querySelector('.modal-container');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstFocusable?.focus();

    (this.shadow as unknown as HTMLElement).addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  private setupEscapeHandler(): void {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.state !== 'processing') {
        this.handleClose();
        document.removeEventListener('keydown', handler);
      }
    };
    document.addEventListener('keydown', handler);
  }

  private handleClose(): void {
    this.remove();
    this.config.onClose?.();
  }

  private handleDistill(): void {
    this.state = 'processing';
    this.render();

    // Send distill request to background
    chrome.runtime.sendMessage(
      {
        type: MessageTypes.DISTILL_REQUEST,
        payload: {
          messages: this.config.conversation?.messages || [],
          privacyMode: this.privacyMode,
        },
        source: 'content',
        timestamp: Date.now(),
      },
      (response) => {
        if (response?.success) {
          this.state = 'success';
        } else {
          this.state = 'error';
        }
        this.render();
      }
    );

    // Simulate success for now since backend isn't implemented
    setTimeout(() => {
      this.state = 'success';
      this.render();
    }, 2000);
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return this.escapeHtml(text);
    return this.escapeHtml(text.slice(0, maxLength).trim()) + '...';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: fadeIn 0.15s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal-container {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 400px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.2s ease;
        overflow: hidden;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
      }

      .modal-title-section {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .modal-icon {
        width: 32px;
        height: 32px;
        background: #6366f1;
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
      }

      .modal-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }

      .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        border-radius: 6px;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .modal-close:hover {
        background: #f3f4f6;
        color: #4b5563;
      }

      .modal-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 20px;
        border-top: 1px solid #f3f4f6;
      }

      /* Preview Section */
      .preview-section {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        overflow: hidden;
      }

      .preview-label, .privacy-label {
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preview-label {
        background: white;
        border-bottom: 1px solid #e5e7eb;
      }

      .preview-messages {
        max-height: 180px;
        overflow-y: auto;
        padding: 8px;
      }

      .message-item {
        padding: 10px 12px;
        background: white;
        border-radius: 8px;
        margin-bottom: 6px;
      }

      .message-role {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-bottom: 4px;
      }

      .message-role.user { color: #4f46e5; }
      .message-role.assistant { color: #6b7280; }

      .message-content {
        font-size: 13px;
        color: #374151;
        line-height: 1.4;
        word-break: break-word;
      }

      .more-messages {
        padding: 10px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        border-top: 1px dashed #e5e7eb;
        margin-top: 6px;
      }

      .preview-empty {
        padding: 24px;
        text-align: center;
      }

      .empty-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #f59e0b;
        color: white;
        border-radius: 50%;
        font-weight: 700;
        margin-bottom: 8px;
      }

      /* Privacy Section */
      .privacy-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .privacy-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .privacy-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 14px;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .privacy-option:hover { border-color: #d1d5db; }
      .privacy-option.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.02);
      }

      .privacy-option input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .radio-indicator {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        margin-top: 1px;
        transition: all 0.15s ease;
        position: relative;
      }

      .privacy-option.selected .radio-indicator {
        border-color: #6366f1;
      }

      .privacy-option.selected .radio-indicator::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background: #6366f1;
        border-radius: 50%;
      }

      .option-content { flex: 1; }
      .option-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }

      .option-title {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
      }

      .recommended-badge {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: 2px 6px;
        background: #6366f1;
        color: white;
        border-radius: 4px;
      }

      .option-description {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.4;
      }

      /* Buttons */
      .btn-primary, .btn-secondary {
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .btn-primary {
        background: #6366f1;
        border: none;
        color: white;
      }

      .btn-primary:hover { background: #4f46e5; }

      .btn-secondary {
        background: white;
        border: 1px solid #d1d5db;
        color: #374151;
      }

      .btn-secondary:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }

      /* Processing State */
      .processing-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 0;
        text-align: center;
      }

      .spinner-container {
        width: 56px;
        height: 56px;
        margin-bottom: 20px;
      }

      .spinner {
        width: 100%;
        height: 100%;
        border: 3px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .processing-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 16px;
      }

      .progress-container {
        width: 100%;
        max-width: 280px;
      }

      .progress-track {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 100px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #4f46e5);
        border-radius: 100px;
        transition: width 0.3s ease;
      }

      .progress-text {
        display: block;
        margin-top: 8px;
        font-size: 12px;
        color: #6b7280;
      }

      /* Success State */
      .success-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 0;
        text-align: center;
      }

      .success-icon {
        width: 64px;
        height: 64px;
        background: rgba(34, 197, 94, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #22c55e;
        margin-bottom: 20px;
      }

      .result-card {
        width: 100%;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 20px;
        text-align: left;
      }

      .result-title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 12px;
      }

      .result-meta { margin-bottom: 12px; }
      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .meta-label { color: #6b7280; }
      .meta-value { font-weight: 600; color: #374151; }

      .success-actions {
        display: flex;
        gap: 10px;
        width: 100%;
      }

      .success-actions button { flex: 1; }

      /* Error State */
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 0;
        text-align: center;
      }

      .error-icon {
        width: 56px;
        height: 56px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        margin-bottom: 16px;
      }

      .error-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }

      .error-message {
        font-size: 14px;
        color: #4b5563;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .error-actions {
        display: flex;
        gap: 10px;
        width: 100%;
      }

      .error-actions button { flex: 1; }

      @media (prefers-reduced-motion: reduce) {
        .modal-overlay, .modal-container { animation: none; }
        .spinner { animation: none; }
        .progress-fill { transition: none; }
      }
    `;
  }
}

// Factory function for easy modal creation
export function showCaptureModal(config: ModalConfig): CaptureModal {
  const modal = new CaptureModal(config);
  modal.show();
  return modal;
}
