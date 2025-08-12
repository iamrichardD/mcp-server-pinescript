/**
 * Test Suite for AST Generation Engine
 * 
 * Core AST parsing tests for Pine Script syntax trees.
 * Tests the fundamental parsing capabilities and AST node creation.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  parseScript,
  extractFunctionParameters,
  tokenize,
  createLexer,
  isASTNode,
  isFunctionCallNode,
  isParameterNode,
  createFunctionCallNode,
  createParameterNode,
  createLiteralNode,
  createSourceLocation,
  AST_NODE_TYPES,
  DATA_TYPES,
  TOKEN_TYPES,
  KEYWORDS
} from '../../src/parser/index.js';

describe('AST Generation Engine', () => {
  
  describe('Core Parsing Functions', () => {
    
    describe('parseScript', () => {
      it('should parse simple indicator declaration', () => {
        const source = 'indicator("My Indicator", shorttitle="MI")';
        const result = parseScript(source);
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('ast');
        if (result.success) {
          expect(result.ast).toHaveProperty('type');
          expect(result.ast.type).toBe('Program');
        }
      });

      it('should parse strategy declaration', () => {
        const source = 'strategy("My Strategy", "MS", overlay=true)';
        const result = parseScript(source);
        
        expect(result.success).toBe(true);
        expect(result.ast).toHaveProperty('body');
      });

      it('should handle multiple statements', () => {
        const source = `
          indicator("Test", shorttitle="T")
          sma_20 = ta.sma(close, 20)
          plot(sma_20)
        `;
        const result = parseScript(source);
        
        expect(result.success).toBe(true);
        expect(result.ast.body.length).toBeGreaterThan(1);
      });
    });

    describe('extractFunctionParameters', () => {
      it('should extract parameters from indicator function', () => {
        const source = 'indicator("My Indicator", shorttitle="MI", overlay=true)';
        const result = extractFunctionParameters(source);
        
        expect(result.success).toBe(true);
        expect(result.functionCalls).toHaveLength(1);
        
        const func = result.functionCalls[0];
        expect(func.name).toBe('indicator');
        expect(func.parameters).toHaveProperty('_0', 'My Indicator'); // positional parameter
        expect(func.parameters).toHaveProperty('shorttitle', 'MI');
        expect(func.parameters).toHaveProperty('overlay', true);
      });

      it('should extract parameters from strategy function', () => {
        const source = 'strategy("Test Strategy", "TS", overlay=false, default_qty_type=strategy.percent_of_equity)';
        const result = extractFunctionParameters(source);
        
        expect(result.success).toBe(true);
        expect(result.functionCalls).toHaveLength(1);
        
        const func = result.functionCalls[0];
        expect(func.name).toBe('strategy');
        expect(func.parameters._0).toBe('Test Strategy');
        expect(func.parameters._1).toBe('TS'); // second positional parameter
        expect(func.parameters.overlay).toBe(false);
      });

      it('should handle nested function calls', () => {
        const source = 'sma_value = ta.sma(ta.ema(close, 10), 20)';
        const result = extractFunctionParameters(source);
        
        expect(result.success).toBe(true);
        expect(result.functionCalls.length).toBeGreaterThanOrEqual(2);
        
        const smaCall = result.functionCalls.find(f => f.name === 'ta.sma');
        const emaCall = result.functionCalls.find(f => f.name === 'ta.ema');
        
        expect(smaCall).toBeDefined();
        expect(emaCall).toBeDefined();
      });

      it('should handle complex parameter types', () => {
        const source = 'plot(close, color=color.blue, linewidth=2, title="Close Price")';
        const result = extractFunctionParameters(source);
        
        expect(result.success).toBe(true);
        const plotCall = result.functionCalls.find(f => f.name === 'plot');
        expect(plotCall).toBeDefined();
        expect(plotCall.parameters.linewidth).toBe(2);
        expect(plotCall.parameters.title).toBe('Close Price');
      });
    });
  });

  describe('Tokenization', () => {
    
    describe('tokenize', () => {
      it('should tokenize simple indicator statement', () => {
        const source = 'indicator("Test", shorttitle="T")';
        const tokens = tokenize(source);
        
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);
        
        // Should find identifier token for 'indicator'
        const identifierToken = tokens.find(t => t.type === TOKEN_TYPES.IDENTIFIER && t.value === 'indicator');
        expect(identifierToken).toBeDefined();
        
        // Should find string tokens
        const stringTokens = tokens.filter(t => t.type === TOKEN_TYPES.STRING);
        expect(stringTokens.length).toBeGreaterThanOrEqual(2);
      });

      it('should handle different token types', () => {
        const source = 'value = 42 + 3.14';
        const tokens = tokenize(source);
        
        const numberTokens = tokens.filter(t => t.type === TOKEN_TYPES.NUMBER);
        expect(numberTokens.length).toBeGreaterThanOrEqual(2);
        
        const operatorTokens = tokens.filter(t => t.type === TOKEN_TYPES.OPERATOR);
        expect(operatorTokens.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('createLexer', () => {
      it('should create a functional lexer instance', () => {
        const lexer = createLexer();
        expect(lexer).toHaveProperty('tokenize');
        expect(typeof lexer.tokenize).toBe('function');
      });
    });
  });

  describe('AST Node Creation and Validation', () => {
    
    describe('AST Node Type Guards', () => {
      it('should validate AST nodes correctly', () => {
        const location = createSourceLocation(1, 0, 0, 10);
        const functionNode = createFunctionCallNode('indicator', [], location);
        
        expect(isASTNode(functionNode)).toBe(true);
        expect(isFunctionCallNode(functionNode)).toBe(true);
        expect(isParameterNode(functionNode)).toBe(false);
      });

      it('should validate parameter nodes correctly', () => {
        const location = createSourceLocation(1, 0, 0, 5);
        const paramNode = createParameterNode('shorttitle', 'TEST', location);
        
        expect(isASTNode(paramNode)).toBe(true);
        expect(isParameterNode(paramNode)).toBe(true);
        expect(isFunctionCallNode(paramNode)).toBe(false);
      });
    });

    describe('AST Node Creation', () => {
      it('should create function call nodes with proper structure', () => {
        const location = createSourceLocation(1, 0, 0, 20);
        const params = [
          createParameterNode('title', 'Test', location),
          createParameterNode('shorttitle', 'T', location)
        ];
        const funcNode = createFunctionCallNode('indicator', params, location);
        
        expect(funcNode.type).toBe(AST_NODE_TYPES.FUNCTION_CALL);
        expect(funcNode.name).toBe('indicator');
        expect(funcNode.parameters).toHaveLength(2);
        expect(funcNode.location).toEqual(location);
      });

      it('should create literal nodes with correct data types', () => {
        const stringLiteral = createLiteralNode('test', DATA_TYPES.STRING);
        const numberLiteral = createLiteralNode(42, DATA_TYPES.NUMBER);
        const boolLiteral = createLiteralNode(true, DATA_TYPES.BOOLEAN);
        
        expect(stringLiteral.type).toBe(AST_NODE_TYPES.LITERAL);
        expect(stringLiteral.dataType).toBe(DATA_TYPES.STRING);
        expect(stringLiteral.value).toBe('test');
        
        expect(numberLiteral.dataType).toBe(DATA_TYPES.NUMBER);
        expect(boolLiteral.dataType).toBe(DATA_TYPES.BOOLEAN);
      });

      it('should create source locations with proper coordinates', () => {
        const location = createSourceLocation(5, 10, 100, 15);
        
        expect(location).toHaveProperty('line', 5);
        expect(location).toHaveProperty('column', 10);
        expect(location).toHaveProperty('offset', 100);
        expect(location).toHaveProperty('length', 15);
      });
    });
  });

  describe('Constants and Enums', () => {
    
    it('should expose AST_NODE_TYPES constants', () => {
      expect(AST_NODE_TYPES).toHaveProperty('PROGRAM');
      expect(AST_NODE_TYPES).toHaveProperty('FUNCTION_CALL');
      expect(AST_NODE_TYPES).toHaveProperty('PARAMETER');
      expect(AST_NODE_TYPES).toHaveProperty('LITERAL');
    });

    it('should expose DATA_TYPES constants', () => {
      expect(DATA_TYPES).toHaveProperty('STRING');
      expect(DATA_TYPES).toHaveProperty('NUMBER');
      expect(DATA_TYPES).toHaveProperty('BOOLEAN');
    });

    it('should expose TOKEN_TYPES constants', () => {
      expect(TOKEN_TYPES).toHaveProperty('IDENTIFIER');
      expect(TOKEN_TYPES).toHaveProperty('STRING');
      expect(TOKEN_TYPES).toHaveProperty('NUMBER');
      expect(TOKEN_TYPES).toHaveProperty('OPERATOR');
    });

    it('should expose KEYWORDS array', () => {
      expect(Array.isArray(KEYWORDS)).toBe(true);
      expect(KEYWORDS).toContain('indicator');
      expect(KEYWORDS).toContain('strategy');
    });
  });

  describe('Performance and Memory', () => {
    
    it('should parse large scripts efficiently', () => {
      // Generate a large script with multiple function calls
      const largeSource = Array(50).fill(0).map((_, i) => 
        `line${i} = ta.sma(close, ${i + 10})`
      ).join('\n');
      
      const startTime = performance.now();
      const result = extractFunctionParameters(largeSource);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
      expect(result.functionCalls.length).toBe(50);
    });

    it('should handle deeply nested function calls', () => {
      const deeplyNested = 'ta.sma(ta.ema(ta.rma(ta.wma(close, 5), 10), 15), 20)';
      const result = extractFunctionParameters(deeplyNested);
      
      expect(result.success).toBe(true);
      expect(result.functionCalls.length).toBeGreaterThanOrEqual(4);
    });
  });
});