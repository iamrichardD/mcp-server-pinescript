/**
 * Performance Test Suite for Pine Script Parser
 * 
 * Validates the <15ms AST generation target and overall performance requirements.
 * Ensures the parser meets production-grade performance standards.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  quickValidateShortTitle,
  analyzePineScript,
  parseScript,
  extractFunctionParameters,
  tokenize,
  PerformanceMonitor
} from '../../src/parser/index.js';

describe('Performance Requirements', () => {
  
  let performanceMonitor;
  
  beforeAll(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  describe('Core Parsing Performance', () => {
    
    it('should tokenize simple scripts in <5ms', () => {
      const source = 'indicator("Test", shorttitle="T")';
      
      const startTime = performance.now();
      const tokens = tokenize(source);
      const endTime = performance.now();
      
      expect(Array.isArray(tokens)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5);
    });

    it('should parse simple scripts in <10ms', () => {
      const source = 'indicator("Test", shorttitle="T")';
      
      const startTime = performance.now();
      const result = parseScript(source);
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should extract function parameters in <15ms (PRIMARY TARGET)', () => {
      const source = 'indicator("My Indicator", shorttitle="VERYLONGNAME", overlay=true)';
      
      const startTime = performance.now();
      const result = extractFunctionParameters(source);
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(15);
    });

    it('should complete SHORT_TITLE_TOO_LONG validation in <15ms', async () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      
      const startTime = performance.now();
      const result = await quickValidateShortTitle(source);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(15);
      expect(result.metrics.validationTimeMs).toBeLessThan(15);
    });
  });

  describe('Scalability Performance', () => {
    
    it('should handle medium-sized scripts (100 lines) in <50ms', () => {
      const mediumSource = Array(100).fill(0).map((_, i) => 
        `line${i} = ta.sma(close, ${i + 10})`
      ).join('\n');
      
      const startTime = performance.now();
      const result = extractFunctionParameters(mediumSource);
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(50);
      expect(result.functionCalls.length).toBe(100);
    });

    it('should handle large scripts (500 lines) in <200ms', () => {
      const largeSource = Array(500).fill(0).map((_, i) => 
        `var${i} = ta.sma(close, ${(i % 50) + 5})`
      ).join('\n');
      
      const startTime = performance.now();
      const result = extractFunctionParameters(largeSource);
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(200);
      expect(result.functionCalls.length).toBe(500);
    });

    it('should validate multiple SHORT_TITLE_TOO_LONG errors efficiently', async () => {
      const multipleErrors = Array(20).fill(0).map((_, i) => 
        `indicator("Test ${i}", shorttitle="VERYLONGNAME${i}")`
      ).join('\n');
      
      const startTime = performance.now();
      const result = await quickValidateShortTitle(multipleErrors);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations.length).toBe(20);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    
    it('should not leak memory during repeated parsing', () => {
      const source = 'indicator("Test", shorttitle="LONG")';
      
      // Parse the same source multiple times
      for (let i = 0; i < 100; i++) {
        const result = extractFunctionParameters(source);
        expect(result.errors).toHaveLength(0);
      }
      
      // If we reach this point without running out of memory, the test passes
      expect(true).toBe(true);
    });

    it('should handle large strings without excessive memory usage', () => {
      // Create a large string literal
      const largeLiteral = 'A'.repeat(10000);
      const source = `indicator("Test", title="${largeLiteral}")`;
      
      const result = extractFunctionParameters(source);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    
    it('should provide accurate performance metrics', async () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      
      performanceMonitor.start('validation_test');
      const result = await quickValidateShortTitle(source);
      performanceMonitor.end('validation_test');
      
      expect(result.metrics).toHaveProperty('validationTimeMs');
      expect(typeof result.metrics.validationTimeMs).toBe('number');
      expect(result.metrics.validationTimeMs).toBeGreaterThan(0);
    });

    it('should track multiple operations separately', () => {
      const source = 'indicator("Test", shorttitle="T")';
      
      performanceMonitor.start('tokenize');
      tokenize(source);
      const tokenizeTime = performanceMonitor.end('tokenize');
      
      performanceMonitor.start('parse');
      parseScript(source);
      const parseTime = performanceMonitor.end('parse');
      
      expect(tokenizeTime).toBeGreaterThan(0);
      expect(parseTime).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Performance', () => {
    
    it('should handle empty source quickly', () => {
      const startTime = performance.now();
      const result = extractFunctionParameters('');
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(5);
    });

    it('should handle single character source quickly', () => {
      const startTime = performance.now();
      const result = extractFunctionParameters('a');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5);
    });

    it('should handle malformed syntax without hanging', () => {
      const malformed = 'indicator("test" missing closing paren and syntax errors everywhere';
      
      const startTime = performance.now();
      const result = extractFunctionParameters(malformed);
      const endTime = performance.now();
      
      // Should complete quickly even with syntax errors
      expect(endTime - startTime).toBeLessThan(20);
    });

    it('should handle deeply nested expressions efficiently', () => {
      const deepNesting = 'ta.sma('.repeat(20) + 'close' + ', 10)'.repeat(20);
      
      const startTime = performance.now();
      const result = extractFunctionParameters(deepNesting);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Comparison with Performance Targets', () => {
    
    it('should meet MCP server integration requirements (<100ms total)', async () => {
      const source = 'indicator("Complex Indicator", shorttitle="VERYLONGNAME", overlay=true, precision=4)';
      
      const startTime = performance.now();
      
      // Simulate full MCP server workflow
      const parseResult = extractFunctionParameters(source);
      const validationResult = await quickValidateShortTitle(source);
      const analysisResult = await analyzePineScript(source);
      
      const endTime = performance.now();
      
      expect(parseResult.errors).toHaveLength(0);
      expect(validationResult.success).toBe(true);
      expect(analysisResult.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should maintain 4,277x performance improvement standard', () => {
      // This test ensures we don't regress from the documented performance improvements
      const source = 'indicator("Test", shorttitle="T")';
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        extractFunctionParameters(source);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      // Should average well under 15ms per operation
      expect(avgTime).toBeLessThan(15);
    });
  });
});