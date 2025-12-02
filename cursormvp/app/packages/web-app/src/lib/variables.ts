/**
 * Variable Extraction and Filling Utilities
 *
 * Provides functions for extracting {{variable}} patterns from prompt templates
 * and filling them with user-provided values.
 */

/**
 * Regular expression for matching {{variable}} patterns.
 * Handles whitespace within braces and captures the variable name.
 */
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Pattern for escaped braces (\\{{ or \\}})
 */
const ESCAPED_OPEN_BRACE = /\\\{\{/g;
const ESCAPED_CLOSE_BRACE = /\\\}\}/g;

/**
 * Placeholder used during escaping to prevent double-processing.
 */
const ESCAPE_PLACEHOLDER_OPEN = '\u0000ESCAPED_OPEN\u0000';
const ESCAPE_PLACEHOLDER_CLOSE = '\u0000ESCAPED_CLOSE\u0000';

/**
 * Extracts unique variable names from a template string.
 *
 * Variables are identified by the pattern {{variable_name}} where:
 * - Variable names must start with a letter or underscore
 * - Variable names can contain letters, numbers, and underscores
 * - Whitespace within braces is ignored ({{ name }} is valid)
 * - Escaped braces (\\{{) are not treated as variables
 * - Empty variables ({{ }}) are ignored
 * - Nested braces are not supported
 *
 * @param content - The template string to extract variables from
 * @returns Array of unique variable names in order of first occurrence
 *
 * @example
 * extractVariables("Hello {{name}}, welcome to {{city}}!")
 * // Returns: ["name", "city"]
 *
 * @example
 * extractVariables("Use \\{{escaped}} but not {{real}}")
 * // Returns: ["real"]
 */
export function extractVariables(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // Replace escaped braces with placeholders to avoid matching them
  const processedContent = content
    .replace(ESCAPED_OPEN_BRACE, ESCAPE_PLACEHOLDER_OPEN)
    .replace(ESCAPED_CLOSE_BRACE, ESCAPE_PLACEHOLDER_CLOSE);

  const variables: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  // Reset regex state for fresh matching
  VARIABLE_PATTERN.lastIndex = 0;

  while ((match = VARIABLE_PATTERN.exec(processedContent)) !== null) {
    const varName = match[1].trim();

    // Skip empty variable names (shouldn't happen with current regex, but safety check)
    if (!varName) {
      continue;
    }

    // Only add unique variables, preserving order of first occurrence
    if (!seen.has(varName)) {
      seen.add(varName);
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Fills variables in a template string with provided values.
 *
 * @param content - The template string containing {{variable}} patterns
 * @param values - Object mapping variable names to their replacement values
 * @returns The filled template string with variables replaced
 *
 * @remarks
 * - Variables not present in the values object are left unchanged
 * - Escaped braces (\\{{ and \\}}) are converted to literal braces
 * - Whitespace within variable braces is normalized
 *
 * @example
 * fillVariables("Hello {{name}}!", { name: "World" })
 * // Returns: "Hello World!"
 *
 * @example
 * fillVariables("{{greeting}} {{name}}", { greeting: "Hi" })
 * // Returns: "Hi {{name}}"
 */
export function fillVariables(content: string, values: Record<string, string>): string {
  if (!content || typeof content !== 'string') {
    return content ?? '';
  }

  // Replace escaped braces with placeholders
  let result = content
    .replace(ESCAPED_OPEN_BRACE, ESCAPE_PLACEHOLDER_OPEN)
    .replace(ESCAPED_CLOSE_BRACE, ESCAPE_PLACEHOLDER_CLOSE);

  // Replace all variables with their values
  // Reset regex state for fresh matching
  VARIABLE_PATTERN.lastIndex = 0;

  result = result.replace(VARIABLE_PATTERN, (match, varName) => {
    const trimmedName = varName.trim();

    // If value exists, use it; otherwise keep the original placeholder
    if (trimmedName in values && values[trimmedName] !== undefined) {
      return values[trimmedName];
    }

    return match;
  });

  // Restore escaped braces as literal braces
  result = result
    .replace(new RegExp(ESCAPE_PLACEHOLDER_OPEN, 'g'), '{{')
    .replace(new RegExp(ESCAPE_PLACEHOLDER_CLOSE, 'g'), '}}');

  return result;
}

/**
 * Checks if a template string contains any unfilled variables.
 *
 * @param content - The template string to check
 * @returns True if there are unfilled variables, false otherwise
 *
 * @example
 * hasUnfilledVariables("Hello {{name}}!")
 * // Returns: true
 *
 * hasUnfilledVariables("Hello World!")
 * // Returns: false
 */
export function hasUnfilledVariables(content: string): boolean {
  return extractVariables(content).length > 0;
}

/**
 * Gets a list of variables that haven't been filled.
 *
 * @param content - The template string
 * @param values - Object mapping variable names to their replacement values
 * @returns Array of variable names that are not in the values object or have empty values
 *
 * @example
 * getUnfilledVariables("{{a}} {{b}} {{c}}", { a: "filled", b: "" })
 * // Returns: ["b", "c"]
 */
export function getUnfilledVariables(content: string, values: Record<string, string>): string[] {
  const variables = extractVariables(content);
  return variables.filter((varName) => !(varName in values) || !values[varName]?.trim());
}

/**
 * Highlights variables in content by wrapping them in a marker.
 * Useful for displaying templates with visual distinction for variables.
 *
 * @param content - The template string
 * @param wrapper - Function that wraps a variable name with custom markup
 * @returns The content with variables wrapped
 *
 * @example
 * highlightVariables("Hello {{name}}", (v) => `<mark>${v}</mark>`)
 * // Returns: "Hello <mark>{{name}}</mark>"
 */
export function highlightVariables(
  content: string,
  wrapper: (variable: string, fullMatch: string) => string
): string {
  if (!content || typeof content !== 'string') {
    return content ?? '';
  }

  // Replace escaped braces with placeholders
  let result = content
    .replace(ESCAPED_OPEN_BRACE, ESCAPE_PLACEHOLDER_OPEN)
    .replace(ESCAPED_CLOSE_BRACE, ESCAPE_PLACEHOLDER_CLOSE);

  // Reset regex state for fresh matching
  VARIABLE_PATTERN.lastIndex = 0;

  result = result.replace(VARIABLE_PATTERN, (match, varName) => {
    return wrapper(varName.trim(), match);
  });

  // Restore escaped braces as literal braces
  result = result
    .replace(new RegExp(ESCAPE_PLACEHOLDER_OPEN, 'g'), '{{')
    .replace(new RegExp(ESCAPE_PLACEHOLDER_CLOSE, 'g'), '}}');

  return result;
}
