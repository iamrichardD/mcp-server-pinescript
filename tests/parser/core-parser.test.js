/**
 * Core Parser Test Suite
 * 
 * Focused tests for the essential parsing functionality needed for 
 * SHORT_TITLE_TOO_LONG validation and MCP server integration.
 */

import { describe, it, expect } from 'vitest';
import {
  parseScript,
  extractFunctionParameters,
  tokenize,
  quickValidateShortTitle,
  analyzePineScript,
  AST_NODE_TYPES,
  DATA_TYPES,
  TOKEN_TYPES,
  KEYWORDS
} from '../../src/parser/index.js';

describe('Core Parser Functionality', () => {
  
  describe('parseScript - AST Generation', () => {
    it('should parse indicator function and return valid AST', () => {
      const source = 'indicator("My Indicator", shorttitle="MI")';
      const result = parseScript(source);
      
      expect(result).toHaveProperty('ast');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('metrics');
      expect(result.errors).toHaveLength(0);
      expect(result.ast.type).toBe('Program');
      expect(result.ast.statements).toHaveLength(1);
      expect(result.ast.statements[0].type).toBe('FunctionCall');
      expect(result.ast.statements[0].name).toBe('indicator');
    });

    it('should parse strategy function correctly', () => {
      const source = 'strategy("My Strategy", "MS")';
      const result = parseScript(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.ast.statements[0].name).toBe('strategy');
      expect(result.ast.statements[0].parameters).toHaveLength(2);
    });

    it('should handle multiple function calls', () => {
      const source = 'indicator("Test", shorttitle="T")\nplot(close)';
      const result = parseScript(source);
      
      expect(result.errors).toHaveLength(0);
      expect(result.ast.statements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('extractFunctionParameters - Parameter Extraction', () => {
    it('should extract indicator parameters correctly', () => {
      const source = 'indicator("My Indicator", shorttitle="MI", overlay=true)';
      const result = extractFunctionParameters(source);
      
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe('indicator');
      expect(result.functionCalls[0].parameters._0).toBe('My Indicator');
      expect(result.functionCalls[0].parameters.shorttitle).toBe('MI');
      expect(result.functionCalls[0].parameters.overlay).toBe(true);
    });

    it('should extract strategy positional parameters', () => {
      const source = 'strategy("Test Strategy", "TS", overlay=false)';
      const result = extractFunctionParameters(source);
      
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe('strategy');
      expect(result.functionCalls[0].parameters._0).toBe('Test Strategy');
      expect(result.functionCalls[0].parameters._1).toBe('TS'); // shorttitle as positional
      expect(result.functionCalls[0].parameters.overlay).toBe(false);
    });

    it('should handle simple function calls', () => {
      const source = 'sma_20 = sma(close, 20)';
      const result = extractFunctionParameters(source);
      
      expect(result.functionCalls.length).toBeGreaterThanOrEqual(1);
      const smaCall = result.functionCalls.find(f => f.name === 'sma');
      expect(smaCall).toBeDefined();
      expect(smaCall.parameters._0).toBe('close');
      expect(smaCall.parameters._1).toBe(20);
    });

    it('should extract basic parameter types', () => {
      const source = 'plot(close, linewidth=2, title="Price")';
      const result = extractFunctionParameters(source);
      
      const plotCall = result.functionCalls.find(f => f.name === 'plot');
      expect(plotCall).toBeDefined();
      expect(plotCall.parameters.linewidth).toBe(2);
      expect(plotCall.parameters.title).toBe('Price');
    });
  });

  describe('tokenize - Lexical Analysis', () => {
    it('should tokenize indicator statement correctly', () => {
      const source = 'indicator("Test", shorttitle="T")';
      const tokens = tokenize(source);
      
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      
      // Check for specific token types
      const identifierToken = tokens.find(t => t.type === 'KEYWORD' && t.value === 'indicator');
      expect(identifierToken).toBeDefined();
      
      const stringTokens = tokens.filter(t => t.type === 'STRING');
      expect(stringTokens.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle different token types', () => {
      const source = 'value = 42 + 3.14';
      const tokens = tokenize(source);
      
      const numberTokens = tokens.filter(t => t.type === 'NUMBER');
      expect(numberTokens.length).toBeGreaterThanOrEqual(2);
      
      const arithmeticTokens = tokens.filter(t => t.type === 'ARITHMETIC');
      expect(arithmeticTokens.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Constants and Type Definitions', () => {
    it('should expose correct AST_NODE_TYPES', () => {
      expect(AST_NODE_TYPES).toHaveProperty('PROGRAM');
      expect(AST_NODE_TYPES).toHaveProperty('FUNCTION_CALL');
      expect(AST_NODE_TYPES).toHaveProperty('PARAMETER');
      expect(AST_NODE_TYPES).toHaveProperty('LITERAL');
    });

    it('should expose correct DATA_TYPES', () => {
      expect(DATA_TYPES).toHaveProperty('STRING');
      expect(DATA_TYPES).toHaveProperty('NUMBER');
      expect(DATA_TYPES).toHaveProperty('BOOLEAN');
    });

    it('should expose correct TOKEN_TYPES', () => {
      expect(TOKEN_TYPES).toHaveProperty('IDENTIFIER');
      expect(TOKEN_TYPES).toHaveProperty('STRING');
      expect(TOKEN_TYPES).toHaveProperty('NUMBER');
      expect(TOKEN_TYPES).toHaveProperty('ARITHMETIC'); // Not 'OPERATOR'
      expect(TOKEN_TYPES).toHaveProperty('COMPARISON');
      expect(TOKEN_TYPES).toHaveProperty('LOGICAL');
    });

    it('should expose KEYWORDS as a Set containing Pine Script keywords', () => {
      expect(KEYWORDS).toBeInstanceOf(Set);
      expect(KEYWORDS.has('indicator')).toBe(true);
      expect(KEYWORDS.has('strategy')).toBe(true);
      expect(KEYWORDS.has('var')).toBe(true);
      expect(KEYWORDS.has('if')).toBe(true);
    });
  });

  describe('Integration with Validation System', () => {
    it('should integrate parseScript with validation for SHORT_TITLE_TOO_LONG', async () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      
      // Parse the source
      const parseResult = parseScript(source);
      expect(parseResult.errors).toHaveLength(0);
      
      // Extract parameters
      const extractResult = extractFunctionParameters(source);
      expect(extractResult.functionCalls[0].parameters.shorttitle).toBe('VERYLONGNAME');
      
      // Validate for SHORT_TITLE_TOO_LONG
      const validationResult = await quickValidateShortTitle(source);
      expect(validationResult.hasShortTitleError).toBe(true);
      expect(validationResult.violations[0].rule).toBe('SHORT_TITLE_TOO_LONG');
    });

    it('should work with analyzePineScript for comprehensive analysis', async () => {
      const source = 'strategy("Test Strategy", "TOOLONG", overlay=false)';
      
      const result = await analyzePineScript(source);
      expect(result.success).toBe(true);
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters._1).toBe('TOOLONG');
    });
  });

  describe('Performance Requirements', () => {
    it('should parse within performance targets', () => {
      const source = 'indicator("Test", shorttitle="T")';
      
      const startTime = performance.now();
      const result = parseScript(source);
      const endTime = performance.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(15); // <15ms target
    });

    it('should extract parameters within performance targets', () => {
      const source = 'indicator("Test", shorttitle="VERYLONGNAME")';
      
      const startTime = performance.now();
      const result = extractFunctionParameters(source);
      const endTime = performance.now();
      
      expect(result.functionCalls).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(15); // <15ms target
    });

    it('should handle medium-sized scripts efficiently', () => {
      const mediumSource = Array(50).fill(0).map((_, i) => 
        `line${i} = ta.sma(close, ${i + 10})`
      ).join('\n');
      
      const startTime = performance.now();
      const result = extractFunctionParameters(mediumSource);
      const endTime = performance.now();
      
      expect(result.functionCalls.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed syntax gracefully', () => {
      const malformed = 'indicator("test" missing paren';
      
      const parseResult = parseScript(malformed);
      // Should not throw, but may have errors
      expect(parseResult).toHaveProperty('errors');
      expect(parseResult).toHaveProperty('ast');
      
      const extractResult = extractFunctionParameters(malformed);
      expect(extractResult).toHaveProperty('functionCalls');
      expect(extractResult).toHaveProperty('errors');
    });

    it('should handle empty source', () => {
      const result = extractFunctionParameters('');
      expect(result.functionCalls).toHaveLength(0);
      expect(result.errors).toBeDefined();
    });
  });
});