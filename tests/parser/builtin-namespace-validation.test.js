/**
 * Test Suite for INVALID_OBJECT_NAME_BUILTIN Validation
 * 
 * Tests regex-based namespace conflict detection for Phase 1 implementation.
 * Follows atomic testing methodology proven across 323 existing tests.
 */

import { describe, it, expect } from 'vitest';
import {
  quickValidateBuiltinNamespace,
  validateBuiltinNamespace
} from '../../src/parser/index.js';

describe('INVALID_OBJECT_NAME_BUILTIN Validation', () => {
  
  describe('quickValidateBuiltinNamespace', () => {
    it('should detect position namespace conflict', async () => {
      const source = 'position = strategy.position_size';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe('INVALID_OBJECT_NAME_BUILTIN');
      expect(result.violations[0].metadata.conflictingNamespace).toBe('position');
    });

    it('should detect strategy namespace conflict', async () => {
      const source = 'strategy = "My Strategy"';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('strategy');
    });

    it('should detect ta namespace conflict', async () => {
      const source = 'ta = 50';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('ta');
    });

    it('should detect math namespace conflict', async () => {
      const source = 'math = 100';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('math');
    });

    it('should detect array namespace conflict', async () => {
      const source = 'array = []';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('array');
    });

    it('should detect color namespace conflict', async () => {
      const source = 'color = "red"';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('color');
    });

    it('should pass validation for non-conflicting variable names', async () => {
      const source = 'myPosition = strategy.position_size';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle var declarations with type', async () => {
      const source = 'var float position = 0.0';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('position');
    });

    it('should provide location information', async () => {
      const source = '    strategy = "test"';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.violations[0].location.line).toBe(1);
      expect(result.violations[0].location.column).toBeGreaterThan(0);
      expect(result.violations[0].location.source).toBe('strategy = "test"');
    });

    it('should detect multiple namespace conflicts in one line', async () => {
      const source = 'position = 1; strategy = 2';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('position');
      expect(result.violations[1].metadata.conflictingNamespace).toBe('strategy');
    });

    it('should detect conflicts in multiline code', async () => {
      const source = `line1 = "normal"
position = strategy.position_size
ta = ta.sma(close, 20)`;
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0].location.line).toBe(2);
      expect(result.violations[1].location.line).toBe(3);
    });

    it('should handle whitespace variations', async () => {
      const source = '   position   =   value';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.success).toBe(true);
      expect(result.hasNamespaceError).toBe(true);
      expect(result.violations[0].metadata.conflictingNamespace).toBe('position');
    });

    it('should validate performance metrics', async () => {
      const source = 'position = 1\nstrategy = 2\nta = 3';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.metrics.validationTimeMs).toBeDefined();
      expect(result.metrics.validationTimeMs).toBeLessThan(5);
    });

    it('should include suggested fixes in metadata', async () => {
      const source = 'position = 1';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.violations[0].metadata.suggestedFix).toContain('positionState');
      expect(result.violations[0].metadata.suggestedFix).toContain('myPosition');
    });

    it('should detect all 25+ core namespaces', async () => {
      const coreNamespaces = [
        'position', 'strategy', 'ta', 'math', 'array', 'matrix', 'color',
        'alert', 'time', 'str', 'table', 'label', 'line', 'box', 'polyline',
        'plot', 'hline', 'input', 'barstate', 'session', 'syminfo',
        'location', 'shape', 'size', 'scale', 'extend'
      ];
      
      for (const namespace of coreNamespaces) {
        const source = `${namespace} = 1`;
        const result = await quickValidateBuiltinNamespace(source);
        
        expect(result.hasNamespaceError).toBe(true);
        expect(result.violations[0].metadata.conflictingNamespace).toBe(namespace);
      }
    });
  });

  describe('validateBuiltinNamespace', () => {
    it('should return same results as quick validation', async () => {
      const source = 'position = strategy.position_size';
      const quickResult = await quickValidateBuiltinNamespace(source);
      const standardResult = validateBuiltinNamespace(source);
      
      expect(quickResult.violations).toEqual(standardResult.violations);
      expect(quickResult.hasNamespaceError).toBe(standardResult.violations.length > 0);
    });

    it('should include performance metrics', () => {
      const source = 'position = 1';
      const result = validateBuiltinNamespace(source);
      
      expect(result.metrics.validationTimeMs).toBeDefined();
      expect(result.metrics.linesAnalyzed).toBe(1);
    });
  });

  describe('Error Message Formatting', () => {
    it('should format error messages correctly', async () => {
      const source = 'position = 1';
      const result = await quickValidateBuiltinNamespace(source);
      
      expect(result.violations[0].message).toBe('Invalid object name: position. Namespaces of built-ins cannot be used.');
      expect(result.violations[0].severity).toBe('error');
      expect(result.violations[0].category).toBe('naming_validation');
      expect(result.violations[0].code).toBe('INVALID_OBJECT_NAME_BUILTIN');
    });
  });
});