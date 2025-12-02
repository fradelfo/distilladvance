/**
 * Tests for Workflow Execution Service
 *
 * Tests variable extraction, filling, and resolution logic.
 */

import { describe, expect, it } from 'vitest';
import { extractVariables, fillVariables, resolveVariables } from './workflow-execution.js';

describe('Workflow Execution Service', () => {
  // ============================================================================
  // Variable Extraction Tests
  // ============================================================================

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const content = 'Hello {{name}}, welcome to {{city}}!';
      const vars = extractVariables(content);
      expect(vars).toEqual(['name', 'city']);
    });

    it('should handle whitespace in variables', () => {
      const content = 'Hello {{ name }}, welcome to {{  city  }}!';
      const vars = extractVariables(content);
      expect(vars).toEqual(['name', 'city']);
    });

    it('should return unique variables only', () => {
      const content = '{{name}} said hello to {{name}} in {{city}}';
      const vars = extractVariables(content);
      expect(vars).toEqual(['name', 'city']);
    });

    it('should handle empty content', () => {
      expect(extractVariables('')).toEqual([]);
      expect(extractVariables(null as any)).toEqual([]);
      expect(extractVariables(undefined as any)).toEqual([]);
    });

    it('should handle content with no variables', () => {
      const content = 'Hello world, no variables here!';
      const vars = extractVariables(content);
      expect(vars).toEqual([]);
    });

    it('should handle variables with underscores and numbers', () => {
      const content = '{{user_name}} has {{item_count_2}} items';
      const vars = extractVariables(content);
      expect(vars).toEqual(['user_name', 'item_count_2']);
    });

    it('should not match invalid variable names', () => {
      const content = '{{123invalid}} {{-dash}} {{space name}}';
      const vars = extractVariables(content);
      expect(vars).toEqual([]);
    });
  });

  // ============================================================================
  // Variable Filling Tests
  // ============================================================================

  describe('fillVariables', () => {
    it('should fill simple variables', () => {
      const content = 'Hello {{name}}, welcome to {{city}}!';
      const result = fillVariables(content, { name: 'Alice', city: 'NYC' });
      expect(result).toBe('Hello Alice, welcome to NYC!');
    });

    it('should leave unfilled variables unchanged', () => {
      const content = 'Hello {{name}}, welcome to {{city}}!';
      const result = fillVariables(content, { name: 'Alice' });
      expect(result).toBe('Hello Alice, welcome to {{city}}!');
    });

    it('should handle empty values', () => {
      const content = 'Hello {{name}}!';
      const result = fillVariables(content, { name: '' });
      expect(result).toBe('Hello !');
    });

    it('should handle empty content', () => {
      expect(fillVariables('', { name: 'Alice' })).toBe('');
      expect(fillVariables(null as any, { name: 'Alice' })).toBe('');
    });

    it('should handle whitespace in variable braces', () => {
      const content = 'Hello {{ name }}, welcome to {{  city  }}!';
      const result = fillVariables(content, { name: 'Bob', city: 'LA' });
      expect(result).toBe('Hello Bob, welcome to LA!');
    });

    it('should fill the same variable multiple times', () => {
      const content = '{{greeting}} world! {{greeting}} everyone!';
      const result = fillVariables(content, { greeting: 'Hello' });
      expect(result).toBe('Hello world! Hello everyone!');
    });
  });

  // ============================================================================
  // Variable Resolution Tests
  // ============================================================================

  describe('resolveVariables', () => {
    it('should resolve initial input variables', () => {
      const inputMapping = {
        name: 'initial.userName',
        topic: 'initial.subject',
      };
      const initialInput = {
        userName: 'Alice',
        subject: 'AI',
      };
      const stepOutputs = new Map<number, string>();

      const result = resolveVariables(inputMapping, initialInput, stepOutputs);
      expect(result).toEqual({
        name: 'Alice',
        topic: 'AI',
      });
    });

    it('should resolve step output variables', () => {
      const inputMapping = {
        summary: 'step.0.output',
        analysis: 'step.1.output',
      };
      const initialInput = {};
      const stepOutputs = new Map<number, string>([
        [0, 'This is the first output'],
        [1, 'This is the analysis'],
      ]);

      const result = resolveVariables(inputMapping, initialInput, stepOutputs);
      expect(result).toEqual({
        summary: 'This is the first output',
        analysis: 'This is the analysis',
      });
    });

    it('should resolve mixed initial and step variables', () => {
      const inputMapping = {
        original: 'initial.text',
        previousResult: 'step.0.output',
      };
      const initialInput = { text: 'Original text' };
      const stepOutputs = new Map<number, string>([[0, 'Processed output']]);

      const result = resolveVariables(inputMapping, initialInput, stepOutputs);
      expect(result).toEqual({
        original: 'Original text',
        previousResult: 'Processed output',
      });
    });

    it('should skip missing initial variables', () => {
      const inputMapping = {
        name: 'initial.missingVar',
      };
      const initialInput = { otherVar: 'value' };
      const stepOutputs = new Map<number, string>();

      const result = resolveVariables(inputMapping, initialInput, stepOutputs);
      expect(result).toEqual({});
    });

    it('should skip missing step outputs', () => {
      const inputMapping = {
        data: 'step.5.output', // Step 5 doesn't exist
      };
      const initialInput = {};
      const stepOutputs = new Map<number, string>([[0, 'Only step 0 exists']]);

      const result = resolveVariables(inputMapping, initialInput, stepOutputs);
      expect(result).toEqual({});
    });

    it('should handle null input mapping', () => {
      const result = resolveVariables(null, { name: 'test' }, new Map());
      expect(result).toEqual({});
    });

    it('should convert non-string initial values to strings', () => {
      const inputMapping = {
        count: 'initial.number',
        active: 'initial.boolean',
      };
      const initialInput = {
        number: 42,
        boolean: true,
      };
      const stepOutputs = new Map<number, string>();

      const result = resolveVariables(inputMapping, initialInput, stepOutputs);
      expect(result).toEqual({
        count: '42',
        active: 'true',
      });
    });
  });
});
