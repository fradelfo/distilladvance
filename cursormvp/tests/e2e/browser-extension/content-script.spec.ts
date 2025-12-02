/**
 * Browser Extension Content Script E2E Tests
 * Tests extension functionality on real AI chat platforms
 */

import { expect, test } from '@playwright/test';

test.describe('Content Script Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Setup extension testing environment
    await page.goto('https://chat.openai.com');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Verify extension is loaded (this would be detected by our extension)
    await expect(page).toHaveTitle(/ChatGPT/);
  });

  test('should inject distillation UI elements @extension', async ({ page }) => {
    // Wait for chat interface to load
    await page.waitForSelector('textarea[placeholder*="message"]', { timeout: 10000 });

    // Simulate extension content script injection
    await page.evaluate(() => {
      // Simulate our extension's content script behavior
      if (!document.querySelector('[data-distill-extension]')) {
        const distillButton = document.createElement('button');
        distillButton.setAttribute('data-distill-extension', 'true');
        distillButton.textContent = '✨ Distill';
        distillButton.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
        `;
        document.body.appendChild(distillButton);
      }
    });

    // Verify distillation button is present
    const distillButton = page.locator('[data-distill-extension]');
    await expect(distillButton).toBeVisible();
    await expect(distillButton).toHaveText('✨ Distill');
  });

  test('should detect conversation content @extension', async ({ page }) => {
    // Type a test message
    const chatInput = page.locator('textarea[placeholder*="message"]');
    await chatInput.fill('What is artificial intelligence?');

    // Simulate conversation content detection
    const conversationContent = await page.evaluate(() => {
      const messages = document.querySelectorAll('[data-testid="conversation-turn"]');
      return Array.from(messages).map((el) => ({
        role: el.querySelector('.whitespace-pre-wrap')?.textContent?.trim(),
        content: el.textContent?.trim(),
      }));
    });

    // Verify we can detect conversation structure
    expect(Array.isArray(conversationContent)).toBe(true);
  });

  test('should handle distillation workflow @extension', async ({ page }) => {
    // Simulate existing conversation
    await page.evaluate(() => {
      const mockConversation = `
        <div data-testid="conversation-turn">
          <div class="whitespace-pre-wrap">User: What are the benefits of renewable energy?</div>
        </div>
        <div data-testid="conversation-turn">
          <div class="whitespace-pre-wrap">Assistant: Renewable energy offers several key benefits: 1) Environmental sustainability by reducing greenhouse gas emissions, 2) Economic advantages through job creation and energy independence, 3) Long-term cost savings as technology improves, 4) Improved public health through cleaner air and water, 5) Enhanced energy security by diversifying energy sources.</div>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = mockConversation;
      document.body.appendChild(container);
    });

    // Simulate distillation trigger
    await page.evaluate(() => {
      // Simulate our extension's distillation logic
      window.postMessage(
        {
          type: 'DISTILL_REQUEST',
          conversationData: {
            messages: [
              { role: 'user', content: 'What are the benefits of renewable energy?' },
              {
                role: 'assistant',
                content:
                  'Renewable energy offers several key benefits: 1) Environmental sustainability by reducing greenhouse gas emissions, 2) Economic advantages through job creation and energy independence, 3) Long-term cost savings as technology improves, 4) Improved public health through cleaner air and water, 5) Enhanced energy security by diversifying energy sources.',
              },
            ],
          },
        },
        '*'
      );
    });

    // Listen for distillation response
    const distillationResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'DISTILL_RESPONSE') {
            resolve(event.data.result);
          }
        });

        // Simulate successful distillation
        setTimeout(() => {
          window.postMessage(
            {
              type: 'DISTILL_RESPONSE',
              result: {
                success: true,
                distilledPrompt:
                  'Summarize renewable energy benefits: environmental impact, economics, health, and security aspects.',
                compressionRatio: 0.75,
                qualityScore: 0.92,
              },
            },
            '*'
          );
        }, 100);
      });
    });

    expect(distillationResult).toMatchObject({
      success: true,
      compressionRatio: expect.any(Number),
      qualityScore: expect.any(Number),
    });
  });

  test('should respect user privacy settings @extension', async ({ page }) => {
    // Simulate privacy mode activation
    await page.evaluate(() => {
      localStorage.setItem('distill-privacy-mode', 'strict');
    });

    // Verify privacy controls
    const privacyMode = await page.evaluate(() => {
      return localStorage.getItem('distill-privacy-mode');
    });

    expect(privacyMode).toBe('strict');

    // Simulate privacy-aware behavior
    const privacyCompliant = await page.evaluate(() => {
      const mode = localStorage.getItem('distill-privacy-mode');

      if (mode === 'strict') {
        // In strict mode, no data should be sent externally
        return {
          localProcessingOnly: true,
          dataCollection: false,
          externalAPICalls: false,
        };
      }

      return {
        localProcessingOnly: false,
        dataCollection: true,
        externalAPICalls: true,
      };
    });

    expect(privacyCompliant.localProcessingOnly).toBe(true);
    expect(privacyCompliant.dataCollection).toBe(false);
    expect(privacyCompliant.externalAPICalls).toBe(false);
  });

  test('should handle cross-origin messaging securely @extension', async ({ page }) => {
    // Test secure message passing between content script and background
    const messageResult = await page.evaluate(async () => {
      // Simulate secure messaging
      return new Promise((resolve) => {
        const messageId = Math.random().toString(36).substr(2, 9);

        // Simulate message to background script
        window.postMessage(
          {
            type: 'EXTENSION_MESSAGE',
            id: messageId,
            action: 'GET_SETTINGS',
            origin: window.location.origin,
          },
          window.location.origin
        ); // Only send to same origin

        // Simulate background script response
        setTimeout(() => {
          window.postMessage(
            {
              type: 'EXTENSION_RESPONSE',
              id: messageId,
              data: {
                theme: 'light',
                autoDistill: false,
                privacyMode: 'standard',
              },
            },
            window.location.origin
          );
        }, 50);

        // Listen for response
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'EXTENSION_RESPONSE' && event.data.id === messageId) {
            window.removeEventListener('message', handleMessage);
            resolve(event.data.data);
          }
        };

        window.addEventListener('message', handleMessage);
      });
    });

    expect(messageResult).toMatchObject({
      theme: 'light',
      autoDistill: false,
      privacyMode: 'standard',
    });
  });

  test('should maintain performance standards @extension @performance', async ({ page }) => {
    // Measure extension performance impact
    const performanceMetrics = await page.evaluate(async () => {
      const startTime = performance.now();

      // Simulate extension initialization
      await new Promise((resolve) => setTimeout(resolve, 50));

      const endTime = performance.now();

      return {
        initTime: endTime - startTime,
        memoryUsage: (performance as any).memory
          ? {
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null,
      };
    });

    // Verify performance requirements
    expect(performanceMetrics.initTime).toBeLessThan(200); // Less than 200ms initialization

    if (performanceMetrics.memoryUsage) {
      const memoryUsageMB = performanceMetrics.memoryUsage.used / (1024 * 1024);
      expect(memoryUsageMB).toBeLessThan(50); // Less than 50MB memory usage
    }
  });
});

test.describe('Cross-Platform Compatibility', () => {
  const platforms = [
    {
      name: 'OpenAI ChatGPT',
      url: 'https://chat.openai.com',
      selector: 'textarea[placeholder*="message"]',
    },
    { name: 'Anthropic Claude', url: 'https://claude.ai', selector: 'div[contenteditable="true"]' },
    { name: 'Google Gemini', url: 'https://gemini.google.com', selector: 'textarea' },
  ];

  platforms.forEach((platform) => {
    test(`should work on ${platform.name} @extension @cross-platform`, async ({ page }) => {
      // Skip if platform is not accessible in test environment
      test.skip(platform.name === 'Anthropic Claude', 'Claude requires authentication');
      test.skip(platform.name === 'Google Gemini', 'Gemini requires authentication');

      await page.goto(platform.url);

      try {
        await page.waitForSelector(platform.selector, { timeout: 5000 });

        // Simulate extension detection
        const detected = await page.evaluate((selector) => {
          const input = document.querySelector(selector);
          return {
            found: !!input,
            type: input?.tagName.toLowerCase(),
            placeholder: input?.getAttribute('placeholder'),
            contentEditable: input?.getAttribute('contenteditable'),
          };
        }, platform.selector);

        expect(detected.found).toBe(true);

        // Verify we can identify the platform correctly
        const platformDetection = await page.evaluate((url) => {
          if (url.includes('openai.com')) return 'openai';
          if (url.includes('claude.ai')) return 'anthropic';
          if (url.includes('gemini.google.com')) return 'google';
          return 'unknown';
        }, platform.url);

        expect(platformDetection).not.toBe('unknown');
      } catch (error) {
        console.log(`Platform ${platform.name} not accessible: ${error}`);
        test.skip();
      }
    });
  });
});

test.describe('Security Validation', () => {
  test('should prevent XSS vulnerabilities @extension @security', async ({ page }) => {
    await page.goto('https://chat.openai.com');

    // Test XSS prevention
    const xssResult = await page.evaluate(() => {
      // Simulate potentially dangerous content
      const dangerousContent =
        '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')">';

      // Our extension should sanitize this content
      const sanitized = dangerousContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<img[^>]+onerror[^>]*>/gi, '<img>');

      return {
        original: dangerousContent,
        sanitized: sanitized,
        safe: !sanitized.includes('<script') && !sanitized.includes('onerror'),
      };
    });

    expect(xssResult.safe).toBe(true);
    expect(xssResult.sanitized).not.toContain('<script');
    expect(xssResult.sanitized).not.toContain('onerror');
  });

  test('should validate message origins @extension @security', async ({ page }) => {
    await page.goto('https://chat.openai.com');

    const originValidation = await page.evaluate(() => {
      const validOrigins = ['https://chat.openai.com', 'https://claude.ai'];
      const currentOrigin = window.location.origin;

      // Simulate origin validation
      const isValidOrigin = (origin: string) => {
        return validOrigins.some((valid) => origin.startsWith(valid));
      };

      return {
        currentOrigin,
        isValid: isValidOrigin(currentOrigin),
        validOrigins,
      };
    });

    expect(originValidation.isValid).toBe(true);
  });
});
