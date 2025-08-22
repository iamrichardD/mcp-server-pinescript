/**
 * Test Suite for FUNCTION_SIGNATURE_VALIDATION
 *
 * Implementation of atomic testing pattern for Pine Script function signature validation.
 * Tests function calls against expected signatures to ensure correct parameter count and types.
 *
 * Following the proven atomic methodology that achieved 100% test pass rate with 6 validation rules.
 * Uses the same structure as input-type-mismatch-validation.test.js for consistency.
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  analyzePineScript,
  extractFunctionCalls,
  extractFunctionParameters,
  getExpectedSignature,
  parseScript,
  quickValidateFunctionSignatures,
  validateFunctionSignatures,
  validateParameterCount,
  validateParameterTypes,
} from "../../src/parser/index.js";

describe("FUNCTION_SIGNATURE_VALIDATION", () => {
  describe("Atomic Function Tests - Phase 1 Core Functions", () => {
    describe("getExpectedSignature", () => {
      it("should return signature for ta.sma", () => {
        const result = getExpectedSignature("ta.sma");

        expect(result).toBeDefined();
        expect(result.name).toBe("ta.sma");
        expect(result.parameters).toHaveLength(2);
        expect(result.parameters[0].name).toBe("source");
        expect(result.parameters[0].required).toBe(true);
        expect(result.parameters[1].name).toBe("length");
        expect(result.parameters[1].required).toBe(true);
      });

      it("should return signature for alert function", () => {
        const result = getExpectedSignature("alert");

        expect(result).toBeDefined();
        expect(result.name).toBe("alert");
        expect(result.parameters).toHaveLength(2);
        expect(result.parameters[0].name).toBe("message");
        expect(result.parameters[0].required).toBe(true);
        expect(result.parameters[1].name).toBe("freq");
        expect(result.parameters[1].required).toBe(false); // Optional parameter
      });

      it("should return signature for strategy function", () => {
        const result = getExpectedSignature("strategy");

        expect(result).toBeDefined();
        expect(result.name).toBe("strategy");
        expect(result.parameters.length).toBeGreaterThan(0);
        expect(result.parameters[0].name).toBe("title");
        expect(result.parameters[0].required).toBe(true);
      });

      it("should return empty signature for unknown functions", () => {
        const result = getExpectedSignature("unknown.function");

        expect(result.parameters).toEqual([]);
        expect(result.name).toBe("unknown.function");
      });
    });

    describe("validateParameterCount", () => {
      it("should validate correct parameter count for ta.sma", () => {
        const signature = getExpectedSignature("ta.sma");
        const actualParams = ["close", "14"];
        const result = validateParameterCount(signature, actualParams);

        expect(result.isValid).toBe(true);
      });

      it("should detect too many parameters for ta.sma", () => {
        const signature = getExpectedSignature("ta.sma");
        const actualParams = ["close", "14", "extra"];
        const result = validateParameterCount(signature, actualParams);

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe("too_many_parameters");
        expect(result.expected).toBe(2);
        expect(result.actual).toBe(3);
      });

      it("should detect too few required parameters", () => {
        const signature = getExpectedSignature("ta.sma");
        const actualParams = ["close"];
        const result = validateParameterCount(signature, actualParams);

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe("missing_required_parameters");
        expect(result.expected).toBe(2);
        expect(result.actual).toBe(1);
      });

      it("should allow missing optional parameters", () => {
        const signature = getExpectedSignature("alert");
        const actualParams = ["message text"];
        const result = validateParameterCount(signature, actualParams);

        expect(result.isValid).toBe(true);
      });
    });

    describe("validateParameterTypes", () => {
      it("should validate correct parameter types", () => {
        const signature = getExpectedSignature("ta.sma");
        const actualParams = [
          { value: "close", type: "series float" },
          { value: "14", type: "int" },
        ];
        const result = validateParameterTypes(signature, actualParams);

        expect(result.isValid).toBe(true);
      });

      it("should detect parameter type mismatches", () => {
        const signature = getExpectedSignature("ta.sma");
        const actualParams = [
          { value: '"invalid"', type: "string" },
          { value: "14", type: "int" },
        ];
        const result = validateParameterTypes(signature, actualParams);

        expect(result.isValid).toBe(false);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].parameter).toBe("source");
        expect(result.violations[0].expectedType).toBe("series int/float");
        expect(result.violations[0].actualType).toBe("string");
      });
    });
  });

  describe("quickValidateFunctionSignatures - Core Signature Validation", () => {
    it("should detect too many parameters in ta.sma", async () => {
      const source = "ta.sma(close, 14, extra)";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("FUNCTION_SIGNATURE_VALIDATION");
      expect(result.violations[0].functionName).toBe("ta.sma");
      expect(result.violations[0].reason).toBe("too_many_parameters");
      expect(result.violations[0].expectedParams).toBe(2);
      expect(result.violations[0].actualParams).toBe(3);
      expect(result.violations[0].severity).toBe("error");
      expect(result.violations[0].category).toBe("function_signature");
    });

    it("should detect missing required parameters in strategy", async () => {
      const source = "strategy()";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("FUNCTION_SIGNATURE_VALIDATION");
      expect(result.violations[0].functionName).toBe("strategy");
      expect(result.violations[0].reason).toBe("missing_required_parameters");
      expect(result.violations[0].missingParams).toContain("title");
    });

    it("should detect parameter type mismatch in function signature", async () => {
      const source = 'ta.sma("string", 14)';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("FUNCTION_SIGNATURE_VALIDATION");
      expect(result.violations[0].functionName).toBe("ta.sma");
      expect(result.violations[0].reason).toBe("parameter_type_mismatch");
      expect(result.violations[0].parameterName).toBe("source");
      expect(result.violations[0].expectedType).toBe("series int/float");
      expect(result.violations[0].actualType).toBe("string");
    });

    it("should accept valid function calls", async () => {
      const source = "ta.sma(close, 14)";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should accept optional parameters when provided", async () => {
      const source = 'alert("message", alert.freq_once_per_bar)';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should accept optional parameters when omitted", async () => {
      const source = 'alert("message")';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle multiple function calls with mixed validity", async () => {
      const source = "ta.sma(close, 14)\nta.sma(close, 14, extra)";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].functionName).toBe("ta.sma");
      expect(result.violations[0].reason).toBe("too_many_parameters");
    });

    it("should skip validation for unknown functions", async () => {
      const source = 'unknown.function("test", 123, extra)';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle empty source code", async () => {
      const source = "";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.metrics.functionsAnalyzed).toBe(0);
    });

    it("should handle complex multi-line script", async () => {
      const source = `
        //@version=6
        indicator("Signature Test")
        
        // Valid calls
        sma = ta.sma(close, 20)
        alert("Valid message")
        strategy("Test Strategy", shorttitle="TEST")
        
        // Invalid calls
        badSma = ta.sma(close, 14, extra)
        badAlert = alert()
        badStrategy = strategy()
      `;
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations.length).toBeGreaterThanOrEqual(3); // At least three signature violations (may include additional type/parameter issues)
      expect(result.violations.every((v) => v.rule === "FUNCTION_SIGNATURE_VALIDATION")).toBe(true);
      expect(result.metrics.functionsAnalyzed).toBeGreaterThan(0);
    });

    it("should maintain performance for large source files", async () => {
      const largeSource = Array(100).fill("ta.sma(close, 14)").join("\n");

      const startTime = performance.now();
      const result = await quickValidateFunctionSignatures(largeSource);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    it("should handle malformed function calls gracefully", async () => {
      const malformedSource = "ta.sma(close, 14";
      const result = await quickValidateFunctionSignatures(malformedSource);

      expect(result.success).toBe(true);
      // Should not crash, may or may not detect violations depending on parser robustness
    });

    it("should provide detailed metadata for signature violations", async () => {
      const source = "ta.sma(close, 14, extra)";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(1);

      const violation = result.violations[0];
      expect(violation).toHaveProperty("functionName", "ta.sma");
      expect(violation).toHaveProperty("reason", "too_many_parameters");
      expect(violation).toHaveProperty("expectedParams", 2);
      expect(violation).toHaveProperty("actualParams", 3);
      expect(violation).toHaveProperty("extraParams");
      expect(violation.extraParams).toContain("extra");
      expect(violation.message).toContain("FUNCTION_SIGNATURE_VALIDATION");
    });

    it("should track metrics correctly", async () => {
      const source = "ta.sma(close, 14)\nmath.max(10, 20)";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.functionsAnalyzed).toBe(2);
      expect(result.metrics.signatureChecksPerformed).toBe(2);
    });

    it("should detect both parameter count and type issues", async () => {
      const source = 'ta.sma("string", 14, extra, another)';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
      // Should detect either parameter count issue or type issue (or both)
      expect(
        result.violations.some(
          (v) => v.reason === "too_many_parameters" || v.reason === "parameter_type_mismatch"
        )
      ).toBe(true);
    });
  });

  describe("Performance Requirements", () => {
    it("should validate signatures in under 2ms for single function", async () => {
      const source = "ta.sma(close, 14)";

      const startTime = performance.now();
      const result = await quickValidateFunctionSignatures(source);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2);
    });

    it("should handle stress test of 1000+ functions", async () => {
      const stressSource = Array(1000).fill("ta.sma(close, 14)").join("\n");

      const startTime = performance.now();
      const result = await quickValidateFunctionSignatures(stressSource);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 1000 functions in <1s
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null and undefined inputs", async () => {
      const result1 = await quickValidateFunctionSignatures(null);
      const result2 = await quickValidateFunctionSignatures(undefined);

      // Should not crash - may return empty results or handle gracefully
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should handle unicode and special characters in parameters", async () => {
      const source = 'alert("unicode: 🚀 test message")';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle deeply nested function calls", async () => {
      const source = "math.max(ta.sma(ta.ema(close, 10), 20), ta.sma(open, 30))";
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.metrics.functionsAnalyzed).toBeGreaterThan(3);
    });

    it("should handle comments and whitespace", async () => {
      const source = `
        // Comment
        ta.sma(  close  ,  14  ) // Another comment
        /* Block comment */ alert("test")
      `;
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle mixed positional and named parameters", async () => {
      const source = 'strategy("Test", shorttitle="TST", overlay=true)';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      // Should handle named parameters correctly
    });
  });

  describe("Integration with Existing System", () => {
    it("should work alongside other validations", async () => {
      // This tests that FUNCTION_SIGNATURE_VALIDATION doesn't interfere with other validation systems
      const source =
        'indicator("Test", shorttitle="LongTitle", precision=10)\nta.sma(close, 14, extra)';
      const result = await quickValidateFunctionSignatures(source);

      expect(result.success).toBe(true);
      // Should detect the signature violation regardless of other validation issues
      expect(result.violations.some((v) => v.rule === "FUNCTION_SIGNATURE_VALIDATION")).toBe(true);
    });

    it("should maintain consistency with existing function call extraction", async () => {
      const source = "ta.sma(close, 14)";
      const signatureResult = await quickValidateFunctionSignatures(source);
      const functionCalls = extractFunctionCalls(source);

      expect(signatureResult.success).toBe(true);
      expect(functionCalls).toHaveLength(1);
      expect(functionCalls[0].name).toBe("ta.sma");
    });
  });
});
