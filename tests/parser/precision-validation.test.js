/**
 * Test Suite for INVALID_PRECISION Validation
 *
 * Implementation of atomic testing pattern for precision parameter validation.
 * Tests the constraint: 0 ≤ precision ≤ 8 (integer) for strategy() and indicator() functions.
 *
 * Based on proven SHORT_TITLE_TOO_LONG success pattern achieving 100% test pass rate.
 */

import { describe, expect, it } from "vitest";
import {
  analyzePineScript,
  extractFunctionParameters,
  quickValidatePrecision,
} from "../../src/parser/index.js";

describe("INVALID_PRECISION Validation", () => {
  describe("quickValidatePrecision", () => {
    it("should detect INVALID_PRECISION for indicator function - negative value", async () => {
      const source = 'indicator("Test", precision=-1)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_PRECISION");
      expect(result.violations[0].metadata.actualValue).toBe(-1);
      expect(result.violations[0].metadata.minValue).toBe(0);
      expect(result.violations[0].metadata.maxValue).toBe(8);
      expect(result.violations[0].metadata.functionName).toBe("indicator");
      expect(result.violations[0].metadata.parameterName).toBe("precision");
    });

    it("should detect INVALID_PRECISION for indicator function - value too high", async () => {
      const source = 'indicator("Test", precision=9)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_PRECISION");
      expect(result.violations[0].metadata.actualValue).toBe(9);
      expect(result.violations[0].metadata.maxValue).toBe(8);
    });

    it("should detect INVALID_PRECISION for strategy function - negative value", async () => {
      const source = 'strategy("Test Strategy", precision=-2)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_PRECISION");
      expect(result.violations[0].metadata.functionName).toBe("strategy");
    });

    it("should detect INVALID_PRECISION for strategy function - value too high", async () => {
      const source = 'strategy("Test Strategy", precision=10)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_PRECISION");
      expect(result.violations[0].metadata.actualValue).toBe(10);
    });

    it("should pass validation for precision within valid range", async () => {
      const source = 'indicator("Test", precision=4)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - minimum value (0)", async () => {
      const source = 'indicator("Test", precision=0)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - maximum value (8)", async () => {
      const source = 'indicator("Test", precision=8)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should detect INVALID_PRECISION for non-integer values", async () => {
      const source = 'indicator("Test", precision=4.5)';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_PRECISION");
      expect(result.violations[0].metadata.actualValue).toBe(4.5);
    });

    it("should handle multiple function calls and only flag precision issues", async () => {
      const source = `
        indicator("My Indicator", precision=-1)
        ta.sma(close, 20)
        strategy("Test", precision=10)
      `;
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations.length).toBeGreaterThan(0);

      // All violations should be INVALID_PRECISION
      result.violations.forEach((violation) => {
        expect(violation.rule).toBe("INVALID_PRECISION");
      });
    });

    it("should handle source code with no precision parameters", async () => {
      const source = "ta.sma(close, 20)";
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Performance Requirements", () => {
    it("should complete validation within 15ms target", async () => {
      const source = 'indicator("Test", precision=-1)';
      const result = await quickValidatePrecision(source);

      expect(result.metrics.validationTimeMs).toBeLessThan(15);
    });

    it("should handle larger scripts efficiently", async () => {
      const largeSource = [
        'indicator("Test 0", precision=-1)',
        'indicator("Test 1", precision=10)',
        'indicator("Test 2", precision=-1)',
        'indicator("Test 3", precision=10)',
        'indicator("Test 4", precision=-1)',
      ].join("\n");

      const result = await quickValidatePrecision(largeSource);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations.length).toBe(5); // Should detect all 5 violations
      expect(result.metrics.validationTimeMs).toBeLessThan(100); // More lenient for large scripts
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed Pine Script gracefully", async () => {
      const malformedSource = 'indicator("Test", precision=-1 invalid syntax here';
      const result = await quickValidatePrecision(malformedSource);

      // Should still attempt validation even with syntax errors
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("metrics");
    });

    it("should handle empty source code", async () => {
      const result = await quickValidatePrecision("");

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle non-numeric precision values", async () => {
      const source = 'indicator("Test", precision="invalid")';
      const result = await quickValidatePrecision(source);

      expect(result.success).toBe(true);
      expect(result.hasPrecisionError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_PRECISION");
    });
  });

  describe("Detailed Error Messages", () => {
    it("should provide detailed error information for range violation", async () => {
      const source = 'indicator("Test", precision=-1)';
      const result = await quickValidatePrecision(source);

      const violation = result.violations[0];
      expect(violation.message).toContain("precision must be between 0 and 8");
      expect(violation.message).toContain("INVALID_PRECISION");
      expect(violation.severity).toBe("error");
      expect(violation.category).toBe("parameter_validation");
    });

    it("should provide detailed error information for non-integer violation", async () => {
      const source = 'indicator("Test", precision=4.5)';
      const result = await quickValidatePrecision(source);

      const violation = result.violations[0];
      expect(violation.message).toContain("must be an integer");
      expect(violation.severity).toBe("error");
      expect(violation.category).toBe("parameter_validation");
    });
  });
});

describe("Integration with Main Parser Functions", () => {
  describe("extractFunctionParameters", () => {
    it("should extract parameters including precision", async () => {
      const source = 'indicator("Test", precision=4)';
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe("indicator");
      expect(result.functionCalls[0].parameters.precision).toBe(4);
      expect(result.errors).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe("analyzePineScript", () => {
    it("should provide comprehensive analysis including precision validation", async () => {
      const source = 'indicator("Test Strategy", precision=-1)';
      const result = await analyzePineScript(source);

      expect(result.success).toBe(true);
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters.precision).toBe(-1);
    });
  });
});
