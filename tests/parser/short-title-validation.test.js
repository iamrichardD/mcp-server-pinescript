/**
 * Test Suite for SHORT_TITLE_TOO_LONG Validation
 * 
 * Primary validation goal for the AST generation engine.
 * Tests the core parsing and validation functionality for shorttitle parameter.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  quickValidateShortTitle,
  validateShortTitle,
  analyzePineScript,
  parseScript,
  extractFunctionParameters
} from '../../src/parser/index.js';

describe('SHORT_TITLE_TOO_LONG Validation', () => {
  
  describe('quickValidateShortTitle', () => {
    it('should detect SHORT_TITLE_TOO_LONG for indicator function', async () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe('SHORT_TITLE_TOO_LONG');
      expect(result.violations[0].metadata.actualLength).toBe(12);
      expect(result.violations[0].metadata.maxLength).toBe(10);
      expect(result.violations[0].metadata.actualValue).toBe('VERYLONGNAME');
      expect(result.violations[0].metadata.functionName).toBe('indicator');
      expect(result.violations[0].metadata.parameterName).toBe('shorttitle');
    });

    it('should detect SHORT_TITLE_TOO_LONG for strategy function', async () => {
      const source = 'strategy("Test Strategy", "TOOLONGNAME")';
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe('SHORT_TITLE_TOO_LONG');
    });

    it('should pass validation for short titles within limit', async () => {
      const source = 'indicator("Test", shorttitle="SHORT")';
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle boundary case - exactly 10 characters', async () => {
      const source = 'indicator("Test", shorttitle="EXACTLY10C")';
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle boundary case - 11 characters (over limit)', async () => {
      const source = 'indicator("Test", shorttitle="EXACTLY11CH")';
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);  
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].metadata.actualLength).toBe(11);
    });

    it('should handle multiple function calls and only flag shorttitle issues', async () => {
      const source = `
        indicator("My Indicator", shorttitle="VERYLONGNAME")
        ta.sma(close, 20)
        strategy("Test", "TOOLONG")
      `;
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations.length).toBeGreaterThan(0);
      
      // All violations should be SHORT_TITLE_TOO_LONG
      result.violations.forEach(violation => {
        expect(violation.rule).toBe('SHORT_TITLE_TOO_LONG');
      });
    });

    it('should handle source code with no shorttitle parameters', async () => {
      const source = 'ta.sma(close, 20)';
      const result = await quickValidateShortTitle(source);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete validation within 15ms target', async () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      const result = await quickValidateShortTitle(source);
      
      expect(result.metrics.validationTimeMs).toBeLessThan(15);
    });

    it('should handle larger scripts efficiently', async () => {
      const largeSource = Array(100).fill(0).map((_, i) => 
        `indicator("Test ${i}", shorttitle="VERYLONGNAME${i.toString().padStart(2, '0')}")`
      ).join('\n');
      
      const result = await quickValidateShortTitle(largeSource);
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations.length).toBe(100); // Should detect all 100 violations
      expect(result.metrics.validationTimeMs).toBeLessThan(100); // More lenient for large scripts
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed Pine Script gracefully', async () => {
      const malformedSource = 'indicator("Test", shorttitle="LONG" invalid syntax here';
      const result = await quickValidateShortTitle(malformedSource);
      
      // Should still attempt validation even with syntax errors
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('metrics');
    });

    it('should handle empty source code', async () => {
      const result = await quickValidateShortTitle('');
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Detailed Error Messages', () => {
    it('should provide detailed error information', async () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      const result = await quickValidateShortTitle(source);
      
      const violation = result.violations[0];
      expect(violation.message).toContain('too long');
      expect(violation.message).toContain('12 characters');
      expect(violation.message).toContain('10 characters or less');
      expect(violation.message).toContain('SHORT_TITLE_TOO_LONG');
      expect(violation.severity).toBe('error');
      expect(violation.category).toBe('parameter_validation');
    });
  });
});

describe('Integration with Main Parser Functions', () => {
  describe('extractFunctionParameters', () => {
    it('should extract parameters including shorttitle', async () => {
      const source = 'indicator("Test", shorttitle="LONG")';
      const result = extractFunctionParameters(source);
      
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe('indicator');
      expect(result.functionCalls[0].parameters.shorttitle).toBe('LONG');
      expect(result.errors).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('analyzePineScript', () => {
    it('should provide comprehensive analysis including function extraction', async () => {
      const source = 'indicator("Test Strategy", shorttitle="TOOLONG", overlay=false)';
      const result = await analyzePineScript(source);
      
      expect(result.success).toBe(true);
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters.shorttitle).toBe('TOOLONG');
    });
  });
});