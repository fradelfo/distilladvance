# Claude Code Quick Reference Guide

A concise reference for day-to-day Claude Code usage. Keep this handy for quick lookups during development work.

## 🚀 Getting Started

### Essential Commands
```bash
# Start Claude Code session
claude

# Get help
claude help
claude --help

# Check authentication status
claude auth status

# Login/logout
claude auth login
claude auth logout

# Check configuration
claude config list
claude config set model sonnet
claude config set editor vim

# Check version
claude --version
```

### Basic Session Commands
```bash
# In Claude Code session:
/help          # Show available commands
/clear         # Clear conversation history
/exit          # Exit session
/model         # Check current model
/switch        # Switch models
/permissions   # Check current permissions
/cost          # Check usage and cost
```

## 💡 Effective Prompting

### Prompt Structure Template
```
I'm working on [CONTEXT: project type, language, framework].

I need to [SPECIFIC TASK: what you want to accomplish].

Requirements:
- [REQUIREMENT 1]
- [REQUIREMENT 2]
- [REQUIREMENT 3]

Additional context: [RELEVANT DETAILS]

Please [SPECIFIC REQUEST: generate, explain, review, optimize].
```

### Prompt Examples

#### ✅ Good Prompts
```
❇️ Code Generation:
"Create a Python function that validates email addresses using regex. The function should:
- Accept a string email parameter
- Return True for valid emails, False for invalid
- Handle edge cases like None and empty strings
- Include comprehensive docstring with examples"

❇️ Bug Fixing:
"I'm getting a TypeError in this JavaScript function. Here's the code:
[PASTE CODE]
The error occurs when I call it with these parameters: [PARAMETERS]
Expected behavior: [DESCRIPTION]
Actual behavior: [DESCRIPTION]
Please help identify and fix the issue."

❇️ Code Review:
"Please review this React component for:
- Performance optimizations
- Accessibility improvements
- Security considerations
- Best practices adherence
[PASTE CODE]"
```

#### ❌ Avoid These Prompts
```
❌ Too vague: "Write some code"
❌ No context: "Fix this" [code dump]
❌ Too complex: "Build a complete e-commerce system"
❌ Unclear requirements: "Make this better"
```

## 🔒 Safety Checklist

### Before Sharing Code/Data
- [ ] Remove API keys, passwords, tokens
- [ ] Replace sensitive URLs with placeholders
- [ ] Anonymize personal/customer data
- [ ] Use fake/sample data for examples
- [ ] Check for proprietary business logic

### Before Using Generated Code
- [ ] Read and understand the code
- [ ] Check for security vulnerabilities
- [ ] Test with various inputs
- [ ] Verify error handling
- [ ] Run existing test suites
- [ ] Get peer review for complex code

### Red Flags - Stop and Review
🚩 Code that accesses external services
🚩 Database operations without validation
🚩 File system operations
🚩 Network requests
🚩 Cryptographic operations
🚩 Authentication/authorization logic

## 🛠️ Common Development Tasks

### Code Generation
```
# Function creation
"Create a [LANGUAGE] function that [SPECIFIC PURPOSE]"

# Class/component creation
"Create a [REACT/CLASS] that [SPECIFIC FUNCTIONALITY]"

# API endpoint
"Create a [REST/GraphQL] endpoint for [SPECIFIC RESOURCE]"

# Database query
"Write a SQL query to [SPECIFIC OPERATION] with [CONSTRAINTS]"
```

### Code Review & Optimization
```
# Performance review
"Review this code for performance issues: [CODE]"

# Security review
"Analyze this code for security vulnerabilities: [CODE]"

# Best practices review
"Check this code against [LANGUAGE/FRAMEWORK] best practices: [CODE]"

# Refactoring suggestions
"How can I improve this code's readability and maintainability: [CODE]"
```

### Debugging & Troubleshooting
```
# Error analysis
"I'm getting this error: [ERROR MESSAGE]. Here's my code: [CODE]. What's causing this?"

# Unexpected behavior
"This function should [EXPECTED] but it's [ACTUAL]. Can you help debug: [CODE]"

# Performance issues
"This code is slow with large datasets. How can I optimize it: [CODE]"
```

### Testing & Documentation
```
# Test generation
"Generate unit tests for this function using [TEST FRAMEWORK]: [CODE]"

# Documentation
"Add comprehensive documentation to this code: [CODE]"

# API documentation
"Generate API documentation for these endpoints: [ENDPOINTS]"
```

## 🧰 IDE Integration

### VS Code
```
# Extension installation
ext install claude-code

# Keyboard shortcuts
Ctrl+Shift+P > Claude Code: Start Session
Ctrl+Alt+C > Generate code suggestion
Ctrl+Alt+E > Explain code
Ctrl+Alt+R > Review code
```

### Terminal Workflow
```bash
# Start session in project directory
cd /path/to/project
claude

# Share current file content
"Review this file: $(cat filename.py)"

# Generate and save to file
"Generate a utility function for [PURPOSE]" > utils.py
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Authentication Problems
```bash
# Problem: "Authentication failed"
# Solution:
claude auth logout
claude auth login
# Follow browser authentication flow
```

#### Permission Errors
```bash
# Problem: "Permission denied" for file access
# Solution:
# Check file/directory permissions
ls -la filename
chmod 644 filename  # For files
chmod 755 dirname   # For directories
```

#### Model/Response Issues
```
# Problem: Unexpected or poor quality responses
# Solutions:
- Be more specific in prompts
- Add more context about your project
- Try different model: /switch model
- Break complex tasks into smaller steps
```

#### Session Management
```bash
# Problem: Session freezes or becomes unresponsive
# Solutions:
/clear          # Clear conversation history
/exit           # Exit and restart session
Ctrl+C          # Force exit if needed
```

### Getting Help
```
🆘 Internal Support:
- Slack: #claude-code-help
- Email: claude-support@company.com
- Office Hours: Tue/Thu 2-3pm

🆘 Technical Issues:
- Check system status: status.claude.com
- Review logs: ~/.claude/logs/
- Report bugs: Internal bug tracker

🆘 Learning Resources:
- Documentation: docs.claude.com
- Training materials: Internal learning portal
- Peer support: #claude-code-users
```

## 📊 Usage Monitoring

### Checking Your Usage
```bash
# In Claude session
/cost           # Current session cost
/usage          # Monthly usage statistics
/limits         # Current rate limits

# CLI commands
claude usage    # Detailed usage report
claude limits   # Current quotas and limits
```

### Best Practices for Usage
- Use appropriate model for task complexity:
  - Haiku: Simple tasks, quick responses
  - Sonnet: Balanced performance and capability
  - Opus: Complex reasoning, detailed analysis
- Monitor your monthly usage and costs
- Use caching for repeated similar requests
- Batch related questions in single session

## 🎯 Productivity Tips

### Efficient Workflows
```
🔄 Code Generation Workflow:
1. Write clear, specific prompt
2. Review generated code thoroughly
3. Test with sample data
4. Refactor if needed
5. Add to version control

🔄 Debugging Workflow:
1. Gather error info and context
2. Share minimal reproducible example
3. Ask for explanation of root cause
4. Implement suggested fix
5. Test fix thoroughly

🔄 Learning Workflow:
1. Ask for explanation of concepts
2. Request examples and best practices
3. Generate practice exercises
4. Review and improve solutions
5. Share knowledge with team
```

### Time-Saving Shortcuts
```
⚡ Quick Code Generation:
"Generate boilerplate for [COMPONENT TYPE]"
"Create starter template for [PROJECT TYPE]"
"Write utility functions for [COMMON TASKS]"

⚡ Rapid Prototyping:
"Create mockup data for [DATA TYPE]"
"Generate placeholder functions for [API]"
"Create basic UI components for [FEATURE]"

⚡ Code Maintenance:
"Add error handling to [FUNCTION]"
"Generate tests for [COMPONENT]"
"Document this API endpoint [CODE]"
```

## 🏆 Best Practices Checklist

### Daily Usage
- [ ] Start each session with clear objectives
- [ ] Use specific, contextual prompts
- [ ] Review all generated code before use
- [ ] Test generated code thoroughly
- [ ] Document AI-assisted changes in commits
- [ ] Share useful prompts with team
- [ ] Monitor usage and costs

### Team Collaboration
- [ ] Establish team coding standards for AI-generated code
- [ ] Share effective prompts and techniques
- [ ] Include AI assistance in code review process
- [ ] Mentor team members on Claude Code usage
- [ ] Contribute to team knowledge base

### Security & Compliance
- [ ] Never share sensitive data in prompts
- [ ] Review generated code for security issues
- [ ] Follow company data handling policies
- [ ] Report security concerns immediately
- [ ] Keep training up to date on best practices

## 🔗 Quick Links

### Essential Resources
- **Documentation**: [Internal Claude Code Docs](docs.company.com/claude)
- **Training Portal**: [Learning Management System](learn.company.com)
- **Status Page**: [Claude Code Status](status.claude.com)
- **Community**: [Slack #claude-code-users](slack://channel?team=company&id=claude)

### Templates & Examples
- **Project Templates**: `/templates/projects/`
- **Agent Templates**: `/templates/agents/`
- **Prompt Library**: `/templates/prompts/`
- **Best Practices**: `/docs/best-practices/`

### Support Channels
- **General Help**: `#claude-code-help`
- **Technical Issues**: `support@company.com`
- **Security Questions**: `security@company.com`
- **Training Requests**: `training@company.com`

---

## 📱 Mobile Quick Reference

### Most Common Commands (Mobile-Friendly)
```bash
claude                    # Start session
/help                     # Get help
/clear                    # Clear history
/exit                     # Exit
/cost                     # Check usage
claude auth status        # Check auth
```

### Emergency Contacts
- **Urgent Issues**: Call IT Help Desk
- **Security Incidents**: Call Security Team
- **Account Problems**: Email support@company.com

---

*Keep this guide bookmarked for quick reference during development work. For comprehensive training and advanced topics, refer to the full training materials.*