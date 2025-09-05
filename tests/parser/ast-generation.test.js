/**
 * Test Suite for AST Generation Engine
 *
 * Core AST parsing tests for Pine Script syntax trees.
 * Tests the fundamental parsing capabilities and AST node creation.
 */

import { describe, expect, it } from "vitest";
import {
  AST_NODE_TYPES,
  createFunctionCallNode,
  createLexer,
  createLiteralNode,
  createParameterNode,
  createSourceLocation,
  DATA_TYPES,
  extractFunctionParameters,
  isASTNode,
  isFunctionCallNode,
  isParameterNode,
  KEYWORDS,
  parseScript,
  TOKEN_TYPES,
  tokenize,
} from "../../src/parser/index.js";

describe("AST Generation Engine", () => {
  describe("Core Parsing Functions", () => {
    describe("parseScript", () => {
      it("should parse simple indicator declaration", () => {
        const source = 'indicator("My Indicator", shorttitle="MI")';
        const result = parseScript(source);

        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("ast");
        if (result.success) {
          expect(result.ast).toHaveProperty("type");
          expect(result.ast.type).toBe("Program");
        }
      });

      it("should parse strategy declaration", () => {
        const source = 'strategy("My Strategy", "MS", overlay=true)';
        const result = parseScript(source);

        expect(result.success).toBe(true);
        expect(result.ast).toHaveProperty("body");
      });

      it("should handle multiple statements", () => {
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

    describe("extractFunctionParameters", () => {
      it("should extract parameters from indicator function", () => {
        const source = 'indicator("My Indicator", shorttitle="MI", overlay=true)';
        const result = extractFunctionParameters(source);

        expect(result.success).toBe(true);
        expect(result.functionCalls).toHaveLength(1);

        const func = result.functionCalls[0];
        expect(func.name).toBe("indicator");
        expect(func.parameters).toHaveProperty("_0", "My Indicator"); // positional parameter
        expect(func.parameters).toHaveProperty("shorttitle", "MI");
        expect(func.parameters).toHaveProperty("overlay", true);
      });

      it("should extract parameters from strategy function", () => {
        const source =
          'strategy("Test Strategy", "TS", overlay=false, default_qty_type=strategy.percent_of_equity)';
        const result = extractFunctionParameters(source);

        expect(result.success).toBe(true);
        expect(result.functionCalls).toHaveLength(1);

        const func = result.functionCalls[0];
        expect(func.name).toBe("strategy");
        expect(func.parameters._0).toBe("Test Strategy");
        expect(func.parameters._1).toBe("TS"); // second positional parameter
        expect(func.parameters.overlay).toBe(false);
      });

      it("should extract parameters successfully from nested function calls", () => {
        const source = "sma_value = ta.sma(ta.ema(close, 10), 20)";
        const result = extractFunctionParameters(source);

        expect(result.success).toBe(true);
      });

      it("should find at least 2 function calls in nested expression", () => {
        const source = "sma_value = ta.sma(ta.ema(close, 10), 20)";
        const result = extractFunctionParameters(source);

        expect(result.functionCalls.length).toBeGreaterThanOrEqual(2);
      });

      it("should find ta.sma function in nested calls", () => {
        const source = "sma_value = ta.sma(ta.ema(close, 10), 20)";
        const result = extractFunctionParameters(source);

        const smaCall = result.functionCalls.find((f) => f.name === "sma" && f.namespace === "ta");
        expect(smaCall).toBeDefined();
      });

      it("should find ta.ema function in nested calls", () => {
        const source = "sma_value = ta.sma(ta.ema(close, 10), 20)";
        const result = extractFunctionParameters(source);

        const emaCall = result.functionCalls.find((f) => f.name === "ema" && f.namespace === "ta");
        expect(emaCall).toBeDefined();
      });

      it("should handle complex parameter types", () => {
        const source = 'plot(close, color=color.blue, linewidth=2, title="Close Price")';
        const result = extractFunctionParameters(source);

        expect(result.success).toBe(true);
        const plotCall = result.functionCalls.find((f) => f.name === "plot");
        expect(plotCall).toBeDefined();
        expect(plotCall.parameters.linewidth).toBe(2);
        expect(plotCall.parameters.title).toBe("Close Price");
      });
    });
  });

  describe("Tokenization", () => {
    describe("tokenize", () => {
      it("should return an array from tokenize function", () => {
        const source = 'indicator("Test", shorttitle="T")';
        const tokens = tokenize(source);

        expect(Array.isArray(tokens)).toBe(true);
      });

      it("should produce tokens from simple indicator statement", () => {
        const source = 'indicator("Test", shorttitle="T")';
        const tokens = tokenize(source);

        expect(tokens.length).toBeGreaterThan(0);
      });

      it("should find indicator as identifier or keyword token", () => {
        const source = 'indicator("Test", shorttitle="T")';
        const tokens = tokenize(source);

        // Should find 'indicator' as either IDENTIFIER or KEYWORD
        const indicatorToken = tokens.find(
          (t) =>
            (t.type === TOKEN_TYPES.IDENTIFIER || t.type === TOKEN_TYPES.KEYWORD) &&
            t.value === "indicator"
        );
        expect(indicatorToken).toBeDefined();
      });

      it("should find at least 2 string tokens in indicator statement", () => {
        const source = 'indicator("Test", shorttitle="T")';
        const tokens = tokenize(source);

        const stringTokens = tokens.filter((t) => t.type === TOKEN_TYPES.STRING);
        expect(stringTokens.length).toBeGreaterThanOrEqual(2);
      });

      it("should find at least 2 number tokens in arithmetic expression", () => {
        const source = "value = 42 + 3.14";
        const tokens = tokenize(source);

        const numberTokens = tokens.filter((t) => t.type === TOKEN_TYPES.NUMBER);
        expect(numberTokens.length).toBeGreaterThanOrEqual(2);
      });

      it("should find arithmetic operator tokens in expression", () => {
        const source = "value = 42 + 3.14";
        const tokens = tokenize(source);

        // Check for either OPERATOR or ARITHMETIC token types
        const operatorTokens = tokens.filter(
          (t) => t.type === TOKEN_TYPES.OPERATOR || t.type === TOKEN_TYPES.ARITHMETIC
        );
        expect(operatorTokens.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe("createLexer", () => {
      it("should create a functional lexer instance", () => {
        const lexer = createLexer();
        expect(lexer).toHaveProperty("tokenize");
        expect(typeof lexer.tokenize).toBe("function");
      });
    });
  });

  describe("AST Node Creation and Validation", () => {
    describe("AST Node Type Guards", () => {
      it("should validate AST nodes correctly", () => {
        const location = createSourceLocation(1, 0, 0, 10);
        const functionNode = createFunctionCallNode("indicator", [], location);

        expect(isASTNode(functionNode)).toBe(true);
        expect(isFunctionCallNode(functionNode)).toBe(true);
        expect(isParameterNode(functionNode)).toBe(false);
      });

      it("should validate parameter node as AST node", () => {
        const location = createSourceLocation(1, 0, 0, 5);
        const paramNode = createParameterNode(createLiteralNode("TEST"), location, "shorttitle", 1);

        expect(isASTNode(paramNode)).toBe(true);
      });

      it("should validate parameter node as parameter node", () => {
        const location = createSourceLocation(1, 0, 0, 5);
        const paramNode = createParameterNode(createLiteralNode("TEST"), location, "shorttitle", 1);

        expect(isParameterNode(paramNode)).toBe(true);
      });

      it("should not validate parameter node as function call node", () => {
        const location = createSourceLocation(1, 0, 0, 5);
        const paramNode = createParameterNode(createLiteralNode("TEST"), location, "shorttitle", 1);

        expect(isFunctionCallNode(paramNode)).toBe(false);
      });
    });

    describe("AST Node Creation", () => {
      it("should create function call nodes with proper structure", () => {
        const location = createSourceLocation(1, 0, 0, 20);
        const params = [
          createParameterNode(createLiteralNode("Test"), location, "title", 0),
          createParameterNode(createLiteralNode("T"), location, "shorttitle", 1),
        ];
        const funcNode = createFunctionCallNode("indicator", params, location);

        expect(funcNode.type).toBe(AST_NODE_TYPES.FUNCTION_CALL);
        expect(funcNode.name).toBe("indicator");
        expect(funcNode.parameters).toHaveLength(2);
        expect(funcNode.location).toEqual(location);
      });

      it("should create literal nodes with correct data types", () => {
        const stringLiteral = createLiteralNode("test", DATA_TYPES.STRING);
        const numberLiteral = createLiteralNode(42, DATA_TYPES.NUMBER);
        const boolLiteral = createLiteralNode(true, DATA_TYPES.BOOLEAN);

        expect(stringLiteral.type).toBe(AST_NODE_TYPES.LITERAL);
        expect(stringLiteral.dataType).toBe(DATA_TYPES.STRING);
        expect(stringLiteral.value).toBe("test");

        expect(numberLiteral.dataType).toBe(DATA_TYPES.NUMBER);
        expect(boolLiteral.dataType).toBe(DATA_TYPES.BOOLEAN);
      });

      it("should create source locations with proper coordinates", () => {
        const location = createSourceLocation(5, 10, 100, 15);

        expect(location).toHaveProperty("line", 5);
        expect(location).toHaveProperty("column", 10);
        expect(location).toHaveProperty("offset", 100);
        expect(location).toHaveProperty("length", 15);
      });
    });
  });

  describe("Constants and Enums", () => {
    it("should expose AST_NODE_TYPES constants", () => {
      expect(AST_NODE_TYPES).toHaveProperty("PROGRAM");
      expect(AST_NODE_TYPES).toHaveProperty("FUNCTION_CALL");
      expect(AST_NODE_TYPES).toHaveProperty("PARAMETER");
      expect(AST_NODE_TYPES).toHaveProperty("LITERAL");
    });

    it("should expose DATA_TYPES constants", () => {
      expect(DATA_TYPES).toHaveProperty("STRING");
      expect(DATA_TYPES).toHaveProperty("NUMBER");
      expect(DATA_TYPES).toHaveProperty("BOOLEAN");
    });

    it("should expose TOKEN_TYPES constants", () => {
      expect(TOKEN_TYPES).toHaveProperty("IDENTIFIER");
      expect(TOKEN_TYPES).toHaveProperty("STRING");
      expect(TOKEN_TYPES).toHaveProperty("NUMBER");
      expect(TOKEN_TYPES).toHaveProperty("OPERATOR");
    });

    it("should expose KEYWORDS as a valid data structure", () => {
      // KEYWORDS could be Set or Array - both are valid
      const isValidKeywords = Array.isArray(KEYWORDS) || KEYWORDS instanceof Set;
      expect(isValidKeywords).toBe(true);
    });

    it("should include indicator in KEYWORDS", () => {
      const hasIndicator = Array.isArray(KEYWORDS)
        ? KEYWORDS.includes("indicator")
        : KEYWORDS.has("indicator");
      expect(hasIndicator).toBe(true);
    });

    it("should include strategy in KEYWORDS", () => {
      const hasStrategy = Array.isArray(KEYWORDS)
        ? KEYWORDS.includes("strategy")
        : KEYWORDS.has("strategy");
      expect(hasStrategy).toBe(true);
    });
  });

  describe("Performance and Memory", () => {
    it("should parse large scripts efficiently", () => {
      // Generate a large script with multiple function calls
      const largeSource = Array(50)
        .fill(0)
        .map((_, i) => `line${i} = ta.sma(close, ${i + 10})`)
        .join("\n");

      const startTime = performance.now();
      const result = extractFunctionParameters(largeSource);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
      expect(result.functionCalls.length).toBe(50);
    });

    it("should handle deeply nested function calls", () => {
      const deeplyNested = "ta.sma(ta.ema(ta.rma(ta.wma(close, 5), 10), 15), 20)";
      const result = extractFunctionParameters(deeplyNested);

      expect(result.success).toBe(true);
      expect(result.functionCalls.length).toBeGreaterThanOrEqual(4);
    });
  });
});
