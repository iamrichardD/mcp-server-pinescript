import { describe, it, expect } from 'vitest';
import {
  validateSyntaxCompatibility,
  quickValidateSyntaxCompatibility,
  extractDeprecatedFunctionCalls,
  analyzeVersionDirective,
  validateNamespaceRequirements
} from '../../src/parser/validator.js';

describe('SYNTAX_COMPATIBILITY_VALIDATION', () => {
  
  describe('Atomic Function Tests - Phase 1 Core Functions', () => {
    
    describe('extractDeprecatedFunctionCalls', () => {
      it('should detect deprecated security() function', () => {
        const source = 'security(syminfo.tickerid, "1D", close)';
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          name: 'security',
          line: 1,
          column: 1,
          modernEquivalent: 'request.security'
        });
      });
      
      it('should detect deprecated rsi() function', () => {
        const source = 'rsi(close, 14)';
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          name: 'rsi',
          line: 1,
          column: 1,
          modernEquivalent: 'ta.rsi'
        });
      });
      
      it('should detect deprecated sma() function', () => {
        const source = 'sma(close, 20)';
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          name: 'sma',
          line: 1,
          column: 1,
          modernEquivalent: 'ta.sma'
        });
      });
      
      it('should detect deprecated ema() function', () => {
        const source = 'ema(close, 12)';
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          name: 'ema',
          line: 1,
          column: 1,
          modernEquivalent: 'ta.ema'
        });
      });
      
      it('should detect multiple deprecated functions', () => {
        const source = `
        rsi(close, 14)
        sma(close, 20)
        security(syminfo.tickerid, "1D", close)
        `;
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(3);
        expect(result.map(r => r.name)).toEqual(['rsi', 'sma', 'security']);
      });
      
      it('should ignore functions in comments', () => {
        const source = '// This uses sma(close, 20)';
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(0);
      });
      
      it('should ignore functions in strings', () => {
        const source = 'plot(close, title="sma(close, 20)")';
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(0);
      });
      
      it('should detect crossover and crossunder functions', () => {
        const source = `
        crossover(close, ma)
        crossunder(close, ma)
        `;
        const result = extractDeprecatedFunctionCalls(source);
        
        expect(result).toHaveLength(2);
        expect(result.map(r => r.name)).toEqual(['crossover', 'crossunder']);
      });
    });
    
    describe('analyzeVersionDirective', () => {
      it('should detect version 6 directive', () => {
        const source = '//@version=6\nindicator("Test")';
        const result = analyzeVersionDirective(source);
        
        expect(result).toEqual({
          version: 6,
          line: 1,
          isV6Compatible: true,
          hasVersionDirective: true
        });
      });
      
      it('should detect version 5 directive', () => {
        const source = '//@version=5\nindicator("Test")';
        const result = analyzeVersionDirective(source);
        
        expect(result).toEqual({
          version: 5,
          line: 1,
          isV6Compatible: false,
          hasVersionDirective: true
        });
      });
      
      it('should handle missing version directive', () => {
        const source = 'indicator("Test")';
        const result = analyzeVersionDirective(source);
        
        expect(result).toEqual({
          version: null,
          line: -1,
          isV6Compatible: true, // null assumes latest
          hasVersionDirective: false
        });
      });
      
      it('should detect version directive with spaces', () => {
        const source = '// @version = 6\nindicator("Test")';
        const result = analyzeVersionDirective(source);
        
        expect(result).toEqual({
          version: 6,
          line: 1,
          isV6Compatible: true,
          hasVersionDirective: true
        });
      });
    });
    
    describe('validateNamespaceRequirements', () => {
      it('should not detect sma as namespace requirement (handled as deprecated)', () => {
        const source = 'sma(close, 20)';
        const result = validateNamespaceRequirements(source);
        
        expect(result).toHaveLength(0); // sma is handled as deprecated function
      });
      
      it('should not flag correctly namespaced functions', () => {
        const source = 'ta.sma(close, 20)';
        const result = validateNamespaceRequirements(source);
        
        expect(result).toHaveLength(0);
      });
      
      it('should not detect security as namespace requirement (handled as deprecated)', () => {
        const source = 'security(syminfo.tickerid, "1D", close)';
        const result = validateNamespaceRequirements(source);
        
        expect(result).toHaveLength(0); // security is handled as deprecated function
      });
      
      it('should not detect tostring as namespace requirement (handled as deprecated)', () => {
        const source = 'tostring(value)';
        const result = validateNamespaceRequirements(source);
        
        expect(result).toHaveLength(0); // tostring is handled as deprecated function
      });
      
      it('should detect missing math namespace for abs', () => {
        const source = 'abs(value)';
        const result = validateNamespaceRequirements(source);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          functionName: 'abs',
          requiredNamespace: 'math',
          line: 1,
          column: 1,
          modernForm: 'math.abs'
        });
      });
    });
  });
  
  describe('Core Syntax Compatibility Validation', () => {
    
    it('should detect deprecated function violations', async () => {
      const source = 'sma(close, 20)';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(true);
      expect(result.violations).toHaveLength(1); // deprecated only (namespace handled by deprecated)
      
      const deprecatedViolation = result.violations.find(v => v.metadata?.deprecatedFunction);
      expect(deprecatedViolation).toBeDefined();
      expect(deprecatedViolation.rule).toBe('SYNTAX_COMPATIBILITY_VALIDATION');
      expect(deprecatedViolation.severity).toBe('error');
      expect(deprecatedViolation.message).toContain('sma()');
      expect(deprecatedViolation.message).toContain('ta.sma()');
    });
    
    it('should detect version compatibility issues', async () => {
      const source = '//@version=4\nindicator("Test")';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('warning');
      expect(result.violations[0].message).toContain('v4 is outdated');
      expect(result.violations[0].message).toContain('v6');
    });
    
    it('should detect namespace requirement violations', async () => {
      const source = 'ta.rsi(close, 14) + abs(value)'; // abs needs math namespace
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(true);
      expect(result.violations).toHaveLength(1);
      
      const namespaceViolation = result.violations[0];
      expect(namespaceViolation.rule).toBe('SYNTAX_COMPATIBILITY_VALIDATION');
      expect(namespaceViolation.severity).toBe('error');
      expect(namespaceViolation.message).toContain('abs()');
      expect(namespaceViolation.message).toContain('math');
    });
    
    it('should pass clean v6 code', async () => {
      const source = '//@version=6\nindicator("Test")\nta.sma(close, 20)';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
    
    it('should provide comprehensive metrics', async () => {
      const source = `
      //@version=5
      sma(close, 20)
      rsi(close, 14)
      abs(value)
      `;
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThan(0);
      expect(result.metrics.deprecatedFunctionsFound).toBe(2); // sma + rsi (deprecated)
      expect(result.metrics.namespaceViolationsFound).toBe(1); // abs (namespace requirement)
      expect(result.metrics.versionCompatible).toBe(false);
      expect(result.metrics.totalViolations).toBeGreaterThan(0);
    });
    
    it('should provide detailed analysis', async () => {
      const source = '//@version=5\nsma(close, 20)';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.details).toBeDefined();
      expect(result.details.versionAnalysis).toBeDefined();
      expect(result.details.deprecatedCalls).toBeDefined();
      expect(result.details.namespaceViolations).toBeDefined();
    });
  });
  
  describe('quickValidateSyntaxCompatibility - Integration Testing', () => {
    
    it('should match validateSyntaxCompatibility results', async () => {
      const source = 'sma(close, 20)';
      const fullResult = await validateSyntaxCompatibility(source);
      const quickResult = await quickValidateSyntaxCompatibility(source);
      
      // Compare all properties except execution time which can vary
      expect(quickResult.success).toEqual(fullResult.success);
      expect(quickResult.hasSyntaxCompatibilityError).toEqual(fullResult.hasSyntaxCompatibilityError);
      expect(quickResult.violations).toEqual(fullResult.violations);
      expect(quickResult.details).toEqual(fullResult.details);
      
      // Check metrics structure but allow execution time variance
      expect(quickResult.metrics.deprecatedFunctionsFound).toEqual(fullResult.metrics.deprecatedFunctionsFound);
      expect(quickResult.metrics.namespaceViolationsFound).toEqual(fullResult.metrics.namespaceViolationsFound);
      expect(quickResult.metrics.versionCompatible).toEqual(fullResult.metrics.versionCompatible);
      expect(quickResult.metrics.totalViolations).toEqual(fullResult.metrics.totalViolations);
    });
    
    it('should handle complex deprecated function scenarios', async () => {
      const source = `
      //@version=5
      security(syminfo.tickerid, "1D", close)
      rsi(close, 14)
      ema(close, 12)
      crossover(close, sma(close, 20))
      `;
      const result = await quickValidateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(true);
      expect(result.violations.length).toBeGreaterThan(5); // Multiple deprecated + namespace violations
    });
    
    it('should detect comprehensive migration requirements', async () => {
      const source = `
      //@version=4
      security(syminfo.tickerid, "1D", close)
      highest(high, 20)
      lowest(low, 20)
      tostring(value)
      abs(value)
      `;
      const result = await quickValidateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(true);
      
      // Should detect version warning + multiple deprecated functions + namespace violations
      const versionViolations = result.violations.filter(v => v.metadata?.upgradeRecommended);
      const deprecatedViolations = result.violations.filter(v => v.metadata?.migrationRequired);
      const namespaceViolations = result.violations.filter(v => v.metadata?.namespaceRequired);
      
      expect(versionViolations.length).toBe(1);
      expect(deprecatedViolations.length).toBeGreaterThan(0);
      expect(namespaceViolations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Requirements', () => {
    
    it('should execute within 5ms for small scripts', async () => {
      const source = 'sma(close, 20)';
      const startTime = performance.now();
      await validateSyntaxCompatibility(source);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5);
    });
    
    it('should execute within 10ms for medium scripts', async () => {
      const source = Array(20).fill('sma(close, 20)').join('\n');
      const startTime = performance.now();
      await validateSyntaxCompatibility(source);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(10);
    });
    
    it('should execute within 20ms for large scripts', async () => {
      const source = Array(100).fill('sma(close, 20)').join('\n');
      const startTime = performance.now();
      await validateSyntaxCompatibility(source);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(20);
    });
    
    it('should maintain sub-5ms for quickValidate', async () => {
      const source = 'rsi(close, 14)';
      const startTime = performance.now();
      await quickValidateSyntaxCompatibility(source);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5);
    });
  });
  
  describe('MCP Integration Requirements', () => {
    
    it('should return proper violation structure for MCP server', async () => {
      const source = 'sma(close, 20)';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.violations).toBeInstanceOf(Array);
      
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toHaveProperty('line');
        expect(violation).toHaveProperty('column');
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('message');
        expect(violation).toHaveProperty('rule');
        expect(violation).toHaveProperty('category');
        expect(violation.rule).toBe('SYNTAX_COMPATIBILITY_VALIDATION');
      }
    });
    
    it('should provide metrics for MCP performance monitoring', async () => {
      const source = 'sma(close, 20)';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.metrics).toBeDefined();
      expect(typeof result.metrics.executionTime).toBe('number');
      expect(typeof result.metrics.deprecatedFunctionsFound).toBe('number');
      expect(typeof result.metrics.namespaceViolationsFound).toBe('number');
      expect(typeof result.metrics.versionCompatible).toBe('boolean');
      expect(typeof result.metrics.totalViolations).toBe('number');
    });
    
    it('should handle empty source gracefully', async () => {
      const source = '';
      const result = await validateSyntaxCompatibility(source);
      
      expect(result.success).toBe(true);
      expect(result.hasSyntaxCompatibilityError).toBe(false);
      expect(result.violations).toHaveLength(0);
      expect(result.metrics.executionTime).toBeGreaterThan(0);
    });
  });
});