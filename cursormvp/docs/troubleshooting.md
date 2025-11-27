# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues when using the Browser Extension + AI Web Application project template.

## Table of Contents
- [Setup and Installation Issues](#setup-and-installation-issues)
- [Claude Code Agent Issues](#claude-code-agent-issues)
- [Browser Extension Problems](#browser-extension-problems)
- [AI Integration Issues](#ai-integration-issues)
- [Development Environment Problems](#development-environment-problems)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Performance Problems](#performance-problems)
- [Security and Permissions](#security-and-permissions)

## Setup and Installation Issues

### Issue: `bun install` Fails

**Symptoms:**
- Package installation errors
- Dependency resolution failures
- Permission denied errors

**Solutions:**

1. **Check Bun Installation**
   ```bash
   # Verify Bun is installed correctly
   bun --version

   # If not installed or outdated, reinstall
   curl -fsSL https://bun.sh/install | bash
   source ~/.bashrc  # or restart terminal
   ```

2. **Clear Package Cache**
   ```bash
   # Clear Bun cache
   bun pm cache rm

   # Remove node_modules and lockfile
   rm -rf node_modules bun.lockb
   bun install
   ```

3. **Permission Issues**
   ```bash
   # Fix permissions on macOS/Linux
   sudo chown -R $(whoami) ~/.bun

   # Alternative: use Node.js package manager temporarily
   npm install  # fallback option
   ```

### Issue: Claude Code Not Detecting Configuration

**Symptoms:**
- Claude Code doesn't load agents
- Settings not applied
- Missing automation commands

**Solutions:**

1. **Verify Configuration Files**
   ```bash
   # Check configuration structure
   ls -la .claude/
   cat .claude/settings.json

   # Validate JSON syntax
   bun run validate:config
   ```

2. **Fix Configuration Path**
   ```bash
   # Ensure you're in the correct directory
   pwd
   # Should show: /path/to/your/project

   # Restart Claude Code session
   claude
   ```

3. **Reset Configuration**
   ```bash
   # Backup existing config
   cp -r .claude .claude.backup

   # Reset to template defaults
   cp -r templates/claude-config/* .claude/
   ```

### Issue: Environment Variables Not Loaded

**Symptoms:**
- API calls failing
- Database connection errors
- Missing configuration values

**Solutions:**

1. **Check Environment File**
   ```bash
   # Verify .env file exists
   ls -la .env*

   # Copy from example if missing
   cp .env.example .env

   # Edit with your values
   nano .env
   ```

2. **Load Environment Variables**
   ```bash
   # Source environment in current session
   source .env

   # Verify variables are loaded
   echo $OPENAI_API_KEY
   echo $DATABASE_URL
   ```

3. **Check Variable Syntax**
   ```bash
   # Ensure no spaces around = in .env
   # ✅ Correct: API_KEY=your_key_here
   # ❌ Wrong: API_KEY = your_key_here

   # Remove quotes unless necessary
   # ✅ Correct: DATABASE_URL=postgresql://...
   # ❌ Wrong: DATABASE_URL="postgresql://..."
   ```

## Claude Code Agent Issues

### Issue: Agents Not Responding

**Symptoms:**
- Agent commands don't work
- No response from specialized agents
- Generic responses instead of specialized help

**Solutions:**

1. **Check Agent Files**
   ```bash
   # Verify agent files exist
   ls -la .claude/agents/

   # Check agent file syntax
   head -20 .claude/agents/frontend/agent.md
   ```

2. **Restart Claude Code Session**
   ```bash
   # Exit and restart Claude Code
   exit
   claude

   # Verify agents are loaded
   "List all available agents and their capabilities"
   ```

3. **Test Individual Agents**
   ```bash
   # Test specific agent functionality
   "Use the frontend agent to analyze the current React components"
   "Use the security agent to review the authentication system"
   ```

### Issue: Agent Coordination Problems

**Symptoms:**
- Agents giving conflicting advice
- Poor handoffs between agents
- Missing workflow coordination

**Solutions:**

1. **Use Orchestrator Agent**
   ```bash
   # Have orchestrator manage coordination
   "Use the orchestrator to coordinate frontend and platform agents for the user profile feature"

   # Check workflow status
   "Orchestrator: show current workflow status and any conflicts"
   ```

2. **Check Agent Logs**
   ```bash
   # Review coordination logs
   ls -la logs/agent-handoffs/
   cat logs/agent-handoffs/latest.md

   # Clear stale logs if needed
   find logs/ -name "*.md" -mtime +7 -delete
   ```

3. **Reset Agent State**
   ```bash
   # Clear agent context and restart
   "Orchestrator: reset all agent contexts and start fresh"

   # Re-establish workflow
   /team-coordination "Reset and restart current feature development"
   ```

### Issue: Custom Commands Not Working

**Symptoms:**
- `/command` not recognized
- Commands return errors
- Missing command functionality

**Solutions:**

1. **Verify Command Files**
   ```bash
   # Check command files exist
   ls -la .claude/commands/

   # Validate command syntax
   head -10 .claude/commands/code-review.md
   ```

2. **Check Command Permissions**
   ```bash
   # Verify permissions in settings.json
   grep -A 10 "permissions" .claude/settings.json

   # Ensure commands are allowed
   "Check my current permissions for custom commands"
   ```

3. **Test Commands Individually**
   ```bash
   # Test each command
   /help
   /code-review
   /generate-tests

   # Check error messages for specific issues
   ```

## Browser Extension Problems

### Issue: Extension Not Loading in Browser

**Symptoms:**
- Extension doesn't appear in browser
- Build files missing
- Manifest errors

**Solutions:**

1. **Check Build Output**
   ```bash
   # Verify build completed successfully
   bun run ext:build

   # Check dist directory
   ls -la dist/extension/
   cat dist/extension/manifest.json
   ```

2. **Validate Extension Structure**
   ```bash
   # Run extension validation
   bun run ext:validate

   # Check for common issues
   bun run ext:lint
   ```

3. **Browser-Specific Loading**
   ```bash
   # Chrome: Load unpacked extension
   # 1. Go to chrome://extensions/
   # 2. Enable Developer mode
   # 3. Click "Load unpacked"
   # 4. Select dist/extension/ directory

   # Firefox: Use web-ext
   bun run ext:firefox

   # Edge: Similar to Chrome
   # Go to edge://extensions/
   ```

### Issue: Content Scripts Not Injecting

**Symptoms:**
- AI chat sites don't show extension UI
- Content scripts not running
- Console errors on target sites

**Solutions:**

1. **Check Host Permissions**
   ```json
   // manifest.json - verify host_permissions
   {
     "host_permissions": [
       "https://chat.openai.com/*",
       "https://claude.ai/*"
     ]
   }
   ```

2. **Debug Content Script Loading**
   ```bash
   # Check console for errors
   # Open browser dev tools on target site
   # Look for extension-related errors

   # Test content script manually
   # In browser console:
   console.log('Extension loaded:', !!window.DISTILL_EXTENSION_LOADED);
   ```

3. **Verify Site Detection**
   ```typescript
   // Debug site detection logic
   console.log('Current URL:', window.location.href);
   console.log('Site detected:', detectAIChatSite(window.location.href));
   ```

### Issue: Extension Popup Not Working

**Symptoms:**
- Popup doesn't open
- Blank popup window
- React components not rendering

**Solutions:**

1. **Check Popup Build**
   ```bash
   # Verify popup files built correctly
   ls -la dist/extension/popup/

   # Check for build errors
   bun run ext:build 2>&1 | grep -i error
   ```

2. **Debug React Components**
   ```html
   <!-- Add to popup.html for debugging -->
   <script>
     window.addEventListener('error', (e) => {
       console.error('Popup error:', e.error);
     });
   </script>
   ```

3. **Test Popup Independently**
   ```bash
   # Open popup in regular browser tab
   # Navigate to: chrome-extension://[extension-id]/popup.html

   # Check React dev tools
   # Verify components are mounting correctly
   ```

## AI Integration Issues

### Issue: API Keys Not Working

**Symptoms:**
- AI API calls failing
- Authentication errors
- Rate limit errors

**Solutions:**

1. **Verify API Keys**
   ```bash
   # Check API keys are set
   echo $OPENAI_API_KEY | head -c 10
   echo $ANTHROPIC_API_KEY | head -c 10

   # Test API connectivity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

2. **Check API Key Permissions**
   ```bash
   # Verify API key has required permissions
   # OpenAI: Check organization settings
   # Anthropic: Verify workspace access

   # Test with minimal API call
   "Use the platform agent to test AI service connectivity"
   ```

3. **Handle Rate Limits**
   ```typescript
   // Implement exponential backoff
   async function retryWithBackoff(fn: Function, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
           continue;
         }
         throw error;
       }
     }
   }
   ```

### Issue: AI Responses Not Processing

**Symptoms:**
- AI calls succeed but responses malformed
- Conversation extraction failing
- Prompt engineering not working

**Solutions:**

1. **Debug AI Response Processing**
   ```typescript
   // Add logging to AI service
   console.log('AI Request:', request);
   console.log('AI Response:', response);
   console.log('Processed Result:', processedResult);
   ```

2. **Validate Response Format**
   ```typescript
   // Add response validation
   function validateAIResponse(response: any): boolean {
     if (!response || typeof response !== 'object') return false;
     if (!response.choices || !Array.isArray(response.choices)) return false;
     return response.choices.length > 0;
   }
   ```

3. **Test Platform Agent**
   ```bash
   # Use platform agent for debugging
   "Platform agent: test AI integration with a simple prompt"

   "Platform agent: debug the conversation extraction process"
   ```

### Issue: Prompt Engineering Problems

**Symptoms:**
- Poor AI response quality
- Inconsistent results
- Context not preserved

**Solutions:**

1. **Improve Prompt Structure**
   ```typescript
   // Use structured prompts
   const promptTemplate = `
   Role: You are an AI conversation analyst.
   Task: Summarize the following conversation.
   Context: ${conversationContext}
   Format: Provide a JSON response with summary, key_points, and action_items.

   Conversation:
   ${conversationText}
   `;
   ```

2. **Test Prompts Iteratively**
   ```bash
   # Use platform agent for prompt testing
   "Platform agent: test and optimize this prompt: [your prompt]"

   # A/B test different prompt versions
   "Platform agent: compare these two prompt approaches for conversation summarization"
   ```

## Development Environment Problems

### Issue: Database Connection Failures

**Symptoms:**
- Database queries failing
- Connection timeouts
- Migration errors

**Solutions:**

1. **Check Database Status**
   ```bash
   # Verify database is running
   docker-compose ps
   # or
   pg_isready -h localhost -p 5432

   # Check database logs
   docker-compose logs postgres
   ```

2. **Verify Database Configuration**
   ```bash
   # Test database connection
   bun run db:test-connection

   # Check database URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:port/database
   ```

3. **Reset Database**
   ```bash
   # Stop and restart database
   docker-compose down
   docker-compose up -d postgres

   # Run migrations
   bun run db:migrate

   # Seed with test data
   bun run db:seed
   ```

### Issue: Hot Reload Not Working

**Symptoms:**
- Changes not reflected automatically
- Need to manually refresh
- Build process hanging

**Solutions:**

1. **Check Development Server**
   ```bash
   # Restart development servers
   pkill -f "bun.*dev"
   bun run dev

   # Check for port conflicts
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :3001
   ```

2. **Verify File Watching**
   ```bash
   # Check if file system events are working
   echo "test" >> src/test-file.txt
   # Should trigger rebuild

   # Increase file watch limits (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Clear Build Cache**
   ```bash
   # Clear build cache
   rm -rf .next/ dist/ node_modules/.cache/
   bun run build
   ```

### Issue: TypeScript Errors

**Symptoms:**
- Type checking failures
- Module resolution errors
- Import/export problems

**Solutions:**

1. **Check TypeScript Configuration**
   ```bash
   # Validate tsconfig.json
   bunx tsc --noEmit --project tsconfig.json

   # Check for type errors
   bun run type-check
   ```

2. **Fix Common Type Issues**
   ```typescript
   // Add proper type imports
   import type { ComponentProps } from 'react';

   // Use proper typing for Chrome APIs
   /// <reference types="chrome"/>

   // Fix module resolution
   // In tsconfig.json:
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

3. **Update Type Definitions**
   ```bash
   # Update @types packages
   bun add -D @types/chrome @types/node @types/react

   # Regenerate types if using Prisma
   bunx prisma generate
   ```

## Build and Deployment Issues

### Issue: Build Failures

**Symptoms:**
- Build process crashes
- Missing dependencies in build
- Bundle size too large

**Solutions:**

1. **Debug Build Process**
   ```bash
   # Run build with verbose logging
   bun run build --verbose

   # Check for specific build errors
   bun run build 2>&1 | tee build.log
   ```

2. **Fix Dependency Issues**
   ```bash
   # Clean and reinstall dependencies
   rm -rf node_modules bun.lockb
   bun install

   # Check for peer dependency warnings
   bun install --production=false
   ```

3. **Optimize Bundle Size**
   ```bash
   # Analyze bundle size
   bun run analyze:bundle

   # Enable tree shaking
   # Check webpack/vite configuration for proper optimization
   ```

### Issue: Deployment Pipeline Failures

**Symptoms:**
- CI/CD pipeline failures
- Store deployment errors
- Environment configuration issues

**Solutions:**

1. **Check GitHub Actions**
   ```yaml
   # Debug GitHub Actions workflow
   # Add debugging step to .github/workflows/
   - name: Debug Environment
     run: |
       echo "Node version: $(node --version)"
       echo "Bun version: $(bun --version)"
       echo "Environment: $NODE_ENV"
   ```

2. **Verify Deployment Secrets**
   ```bash
   # Check required secrets are set in GitHub
   # - CHROME_EXTENSION_ID
   # - CHROME_CLIENT_SECRET
   # - FIREBASE_TOKEN (if using Firebase)
   ```

3. **Test Deployment Locally**
   ```bash
   # Test deployment scripts locally
   bun run deploy:staging --dry-run

   # Validate build artifacts
   bun run ext:validate:stores
   ```

## Performance Problems

### Issue: Slow Extension Performance

**Symptoms:**
- Extension UI laggy
- Content scripts slow to load
- High memory usage

**Solutions:**

1. **Profile Extension Performance**
   ```bash
   # Enable performance monitoring
   chrome://extensions/ -> Developer mode -> Inspect views: background page

   # Use Chrome DevTools Performance tab
   # Profile content script execution
   ```

2. **Optimize Content Scripts**
   ```typescript
   // Use efficient DOM queries
   const elements = document.querySelectorAll('.message'); // ✅
   // Instead of: document.getElementsByClassName('message'); // ❌

   // Debounce expensive operations
   const debouncedHandler = debounce(expensiveHandler, 300);
   ```

3. **Implement Lazy Loading**
   ```typescript
   // Lazy load heavy components
   const HeavyComponent = lazy(() => import('./HeavyComponent'));

   // Use intersection observer for content loading
   const observer = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         loadContent(entry.target);
       }
     });
   });
   ```

### Issue: High CPU/Memory Usage

**Symptoms:**
- Browser becomes unresponsive
- High CPU usage from extension
- Memory leaks

**Solutions:**

1. **Identify Memory Leaks**
   ```typescript
   // Proper cleanup in content scripts
   class ContentScript {
     private observers: MutationObserver[] = [];
     private intervals: NodeJS.Timeout[] = [];

     cleanup() {
       this.observers.forEach(observer => observer.disconnect());
       this.intervals.forEach(interval => clearInterval(interval));
       this.observers = [];
       this.intervals = [];
     }
   }

   // Clean up on page unload
   window.addEventListener('beforeunload', () => {
     contentScript.cleanup();
   });
   ```

2. **Optimize Background Scripts**
   ```typescript
   // Use efficient background script patterns
   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     // Handle async responses properly
     if (message.type === 'EXPENSIVE_OPERATION') {
       handleExpensiveOperation(message.data)
         .then(sendResponse)
         .catch(error => sendResponse({ error: error.message }));
       return true; // Keep message port open
     }
   });
   ```

3. **Monitor Resource Usage**
   ```bash
   # Use quality agent to monitor performance
   "Quality agent: analyze extension performance and identify bottlenecks"

   # Set up performance budgets
   "Quality agent: configure performance monitoring and alerting"
   ```

## Security and Permissions

### Issue: Permission Denied Errors

**Symptoms:**
- Extension can't access pages
- API calls blocked
- Content script injection fails

**Solutions:**

1. **Review Extension Permissions**
   ```json
   // Check manifest.json permissions
   {
     "permissions": [
       "activeTab",    // ✅ Minimal permission
       "tabs"          // ❌ Only if necessary
     ],
     "host_permissions": [
       "https://chat.openai.com/*"  // ✅ Specific hosts only
     ]
   }
   ```

2. **Use Optional Permissions**
   ```typescript
   // Request permissions when needed
   async function requestTabsPermission(): Promise<boolean> {
     return new Promise((resolve) => {
       chrome.permissions.request({
         permissions: ['tabs']
       }, resolve);
     });
   }
   ```

3. **Test with Security Agent**
   ```bash
   # Use security agent to review permissions
   "Security agent: review extension permissions for security compliance"

   "Security agent: validate that permissions follow principle of least privilege"
   ```

### Issue: Content Security Policy Violations

**Symptoms:**
- Console errors about CSP violations
- Inline scripts blocked
- External resources blocked

**Solutions:**

1. **Fix CSP Configuration**
   ```json
   // manifest.json CSP configuration
   {
     "content_security_policy": {
       "extension_pages": "script-src 'self'; object-src 'self'; frame-ancestors 'none';"
     }
   }
   ```

2. **Avoid Inline Scripts**
   ```typescript
   // ❌ Avoid inline event handlers
   element.onclick = function() { /* ... */ };

   // ✅ Use addEventListener instead
   element.addEventListener('click', function() { /* ... */ });
   ```

3. **Use Security Agent**
   ```bash
   # Review CSP configuration
   "Security agent: review and optimize Content Security Policy configuration"
   ```

## Getting Additional Help

### Using Claude Code Agents for Troubleshooting

```bash
# Get agent-specific help
"Orchestrator: help me troubleshoot the current issue with [specific problem]"

"Security agent: analyze potential security issues causing this problem"

"Quality agent: identify testing approaches to prevent this issue"

"DevOps agent: suggest infrastructure-related solutions"
```

### Logging and Debugging

```bash
# Enable debug logging
export DEBUG=distill:*
bun run dev

# Check system logs
tail -f logs/system.log

# Use agent coordination for complex debugging
/team-coordination "Debug and resolve the current application issues"
```

### Community Resources

1. **Documentation**: Check the comprehensive docs in `/docs/`
2. **Agent Support**: Use specialized agents for domain-specific issues
3. **GitHub Issues**: Report bugs and get community support
4. **Team Coordination**: Use the multi-agent system for complex problems

### Emergency Recovery

```bash
# Nuclear option: Reset everything
git stash  # Save current work
git checkout main  # Return to stable state
rm -rf node_modules .next dist
bun install
bun run setup
```

---

This troubleshooting guide covers the most common issues you're likely to encounter. The multi-agent system is particularly powerful for debugging complex problems, as you can leverage specialized expertise for different aspects of your application.

**Remember**: When in doubt, use the agent system! The agents are designed to help with troubleshooting and can often provide more specific guidance for your particular situation.