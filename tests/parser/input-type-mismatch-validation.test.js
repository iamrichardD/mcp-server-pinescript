/**
 * Test Suite for INPUT_TYPE_MISMATCH Validation
 *
 * Implementation of atomic testing pattern for Pine Script type mismatch detection.
 * Tests parameter types against function signatures to ensure type safety.
 *
 * Following the proven atomic methodology that achieved 100% test pass rate with 5 validation rules.
 * Uses the same structure as precision-validation.test.js for consistency.
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  analyzePineScript,
  compareTypes,
  extractFunctionCalls,
  extractFunctionParameters,
  getExpectedTypes,
  inferParameterTypes,
  parseScript,
  quickValidateInputTypes,
  validateInputTypes,
} from "../../src/parser/index.js";

describe("INPUT_TYPE_MISMATCH Validation", () => {
  describe("Atomic Function Tests - Phase 1 Core Functions", () => {
    describe("extractFunctionCalls", () => {
      it("should extract simple function call", () => {
        const line = "ta.sma(close, 14)";
        const result = extractFunctionCalls(line);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("ta.sma");
        expect(result[0].parameters).toEqual(["close", "14"]);
      });

      it("should extract multiple function calls", () => {
        const line = 'plot(ta.sma(close, 20), title="SMA", color=color.blue)';
        const result = extractFunctionCalls(line);

        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some((call) => call.name === "ta.sma")).toBe(true);
        expect(result.some((call) => call.name === "plot")).toBe(true);
      });

      it("should handle nested function calls", () => {
        const line = "math.max(ta.sma(close, 10), ta.ema(close, 20))";
        const result = extractFunctionCalls(line);

        expect(result.length).toBeGreaterThanOrEqual(3);
        expect(result.some((call) => call.name === "math.max")).toBe(true);
        expect(result.some((call) => call.name === "ta.sma")).toBe(true);
        expect(result.some((call) => call.name === "ta.ema")).toBe(true);
      });
    });

    describe("inferParameterTypes", () => {
      it("should identify string literals", () => {
        expect(inferParameterTypes('"hello"')).toBe("string");
        expect(inferParameterTypes("'world'")).toBe("string");
      });

      it("should identify integer literals", () => {
        expect(inferParameterTypes("14")).toBe("int");
        expect(inferParameterTypes("-5")).toBe("int");
        expect(inferParameterTypes("0")).toBe("int");
      });

      it("should identify float literals", () => {
        expect(inferParameterTypes("14.5")).toBe("float");
        expect(inferParameterTypes("0.5")).toBe("float");
        expect(inferParameterTypes("-3.14")).toBe("float");
      });

      it("should identify boolean literals", () => {
        expect(inferParameterTypes("true")).toBe("bool");
        expect(inferParameterTypes("false")).toBe("bool");
      });

      it("should identify Pine Script series variables", () => {
        expect(inferParameterTypes("close")).toBe("series float");
        expect(inferParameterTypes("open")).toBe("series float");
        expect(inferParameterTypes("high")).toBe("series float");
        expect(inferParameterTypes("low")).toBe("series float");
        expect(inferParameterTypes("volume")).toBe("series float");
      });

      it("should identify function calls with specific return types", () => {
        expect(inferParameterTypes("ta.sma(close, 14)")).toBe("series float");
        expect(inferParameterTypes("math.max(1, 2)")).toBe("float");
        expect(inferParameterTypes("unknown.function()")).toBe("function_result");
      });
    });

    describe("getExpectedTypes", () => {
      it("should return type definitions for ta.sma", () => {
        const result = getExpectedTypes("ta.sma");

        expect(result.params).toHaveLength(2);
        expect(result.params[0].name).toBe("source");
        expect(result.params[0].type).toBe("series int/float");
        expect(result.params[1].name).toBe("length");
        expect(result.params[1].type).toBe("series int");
      });

      it("should return type definitions for str.contains", () => {
        const result = getExpectedTypes("str.contains");

        expect(result.params).toHaveLength(2);
        expect(result.params[0].name).toBe("source");
        expect(result.params[0].type).toBe("string");
        expect(result.params[1].name).toBe("substring");
        expect(result.params[1].type).toBe("string");
      });

      it("should return empty params for unknown functions", () => {
        const result = getExpectedTypes("unknown.function");

        expect(result.params).toEqual([]);
      });
    });

    describe("compareTypes", () => {
      it("should validate exact type matches", () => {
        const result = compareTypes("string", "string");

        expect(result.isValid).toBe(true);
      });

      it("should detect type mismatches", () => {
        const result = compareTypes("string", "int");

        expect(result.isValid).toBe(false);
        expect(result.reason).toBeDefined();
        expect(result.expected).toBe("string");
        expect(result.actual).toBe("int");
      });

      it("should handle series type compatibility", () => {
        const result = compareTypes("series int/float", "int");

        expect(result.isValid).toBe(true);
        expect(result.reason).toBe("series_accepts_simple");
      });

      it("should handle int/float compatibility", () => {
        const intResult = compareTypes("int/float", "int");
        const floatResult = compareTypes("int/float", "float");

        expect(intResult.isValid).toBe(true);
        expect(floatResult.isValid).toBe(true);
        expect(intResult.reason).toBe("numeric_compatible");
        expect(floatResult.reason).toBe("numeric_compatible");
      });
    });
  });

  describe("quickValidateInputTypes - Core Type Validation", () => {
    it("should detect string to numeric type mismatch in ta.sma", async () => {
      const source = 'ta.sma("invalid", 14)';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INPUT_TYPE_MISMATCH");
      expect(result.violations[0].functionName).toBe("ta.sma");
      expect(result.violations[0].expectedType).toBe("series int/float");
      expect(result.violations[0].actualType).toBe("string");
      expect(result.violations[0].severity).toBe("error");
      expect(result.violations[0].category).toBe("type_validation");
    });

    it("should detect numeric to string type mismatch in str.contains", async () => {
      const source = 'str.contains(42, "test")';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INPUT_TYPE_MISMATCH");
      expect(result.violations[0].functionName).toBe("str.contains");
      expect(result.violations[0].expectedType).toBe("string");
      expect(result.violations[0].actualType).toBe("int");
    });

    it("should detect boolean to numeric type mismatch in math.max", async () => {
      const source = "math.max(true, 5)";
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INPUT_TYPE_MISMATCH");
      expect(result.violations[0].functionName).toBe("math.max");
      expect(result.violations[0].expectedType).toBe("int/float");
      expect(result.violations[0].actualType).toBe("bool");
    });

    it("should accept valid types for ta.sma", async () => {
      const source = "ta.sma(close, 14)";
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should accept valid types for str.contains", async () => {
      const source = 'str.contains("hello", "lo")';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should accept valid types for math.max", async () => {
      const source = "math.max(10, 20.5)";
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle multiple type mismatches in one line", async () => {
      const source = 'math.max("invalid", str.contains(123, "test"))';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      expect(result.violations.every((v) => v.rule === "INPUT_TYPE_MISMATCH")).toBe(true);
    });

    it("should skip validation for unknown functions", async () => {
      const source = 'unknown.function("test", 123)';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle empty source code", async () => {
      const source = "";
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.metrics.functionsAnalyzed).toBe(0);
    });

    it("should handle complex multi-line script", async () => {
      const source = `
        //@version=6
        indicator("Type Test")
        
        // Valid calls
        sma = ta.sma(close, 20)
        contains = str.contains("hello", "ell")
        maxVal = math.max(10, 15.5)
        
        // Invalid calls
        badSma = ta.sma("invalid", 14)
        badContains = str.contains(42, "test")
        badMax = math.max(true, 5)
      `;
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations.length).toBe(3); // Three type mismatches
      expect(result.violations.every((v) => v.rule === "INPUT_TYPE_MISMATCH")).toBe(true);
      expect(result.metrics.functionsAnalyzed).toBeGreaterThan(0);
    });

    it("should maintain performance for large source files", async () => {
      const largeSource = Array(100).fill("ta.sma(close, 14)").join("\n");

      const startTime = performance.now();
      const result = await quickValidateInputTypes(largeSource);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    it("should handle malformed function calls gracefully", async () => {
      const malformedSource = "ta.sma(close, 14";
      const result = await quickValidateInputTypes(malformedSource);

      expect(result.success).toBe(true);
      // Should not crash, may or may not detect violations depending on parser robustness
    });

    it("should provide detailed metadata for type mismatches", async () => {
      const source = 'ta.sma("string", 14)';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);

      const violation = result.violations[0];
      expect(violation).toHaveProperty("functionName", "ta.sma");
      expect(violation).toHaveProperty("parameterName", "source");
      expect(violation).toHaveProperty("expectedType", "series int/float");
      expect(violation).toHaveProperty("actualType", "string");
      expect(violation).toHaveProperty("reason");
      expect(violation.message).toContain("INPUT_TYPE_MISMATCH");
    });

    it("should track metrics correctly", async () => {
      const source = "ta.sma(close, 14)\nmath.max(10, 20)";
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.functionsAnalyzed).toBe(2);
      expect(result.metrics.typeChecksPerformed).toBe(4); // 2 params per function
    });
  });

  describe("Performance Requirements", () => {
    it("should validate types in under 5ms for single line", async () => {
      const source = "ta.sma(close, 14)";

      const startTime = performance.now();
      const result = await quickValidateInputTypes(source);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5);
    });

    it("should handle stress test of 1000+ functions", async () => {
      const stressSource = Array(1000).fill("ta.sma(close, 14)").join("\n");

      const startTime = performance.now();
      const result = await quickValidateInputTypes(stressSource);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 1000 functions in <1s
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null and undefined inputs", async () => {
      const result1 = await quickValidateInputTypes(null);
      const result2 = await quickValidateInputTypes(undefined);

      // Should not crash - may return empty results or handle gracefully
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should handle unicode and special characters", async () => {
      const source = 'str.contains("unicode: 🚀 test", "🚀")';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle deeply nested function calls and detect type mismatches", async () => {
      const source = "math.max(ta.sma(ta.ema(close, 10), 20), ta.sma(open, 30))";
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      // This should detect type mismatches: math.max expects simple int/float but ta.sma returns series float
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
      expect(result.violations.every((v) => v.rule === "INPUT_TYPE_MISMATCH")).toBe(true);
      expect(result.metrics.functionsAnalyzed).toBeGreaterThan(3);
    });

    it("should handle comments and whitespace", async () => {
      const source = `
        // Comment
        ta.sma(  close  ,  14  ) // Another comment
        /* Block comment */ str.contains("test", "es")
      `;
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Integration with Existing System", () => {
    it("should work alongside other validations", async () => {
      // This tests that INPUT_TYPE_MISMATCH doesn't interfere with other validation systems
      const source =
        'indicator("Test", shorttitle="LongTitle", precision=10)\nta.sma("invalid", 14)';
      const result = await quickValidateInputTypes(source);

      expect(result.success).toBe(true);
      // Should detect the type mismatch regardless of other validation issues
      expect(result.violations.some((v) => v.rule === "INPUT_TYPE_MISMATCH")).toBe(true);
    });
  });
});
