/**
 * Test Suite for INVALID_MAX_BARS_BACK Validation
 *
 * Implementation of atomic testing pattern for max_bars_back parameter validation.
 * Tests the constraint: 1 ≤ max_bars_back ≤ 5000 (integer) for strategy() and indicator() functions.
 *
 * Based on proven INVALID_PRECISION success pattern achieving 100% test pass rate.
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  analyzePineScript,
  extractFunctionParameters,
  parseScript,
  quickValidateMaxBarsBack,
  validateMaxBarsBack,
} from "../../src/parser/index.js";

describe("INVALID_MAX_BARS_BACK Validation", () => {
  describe("quickValidateMaxBarsBack", () => {
    it("should detect INVALID_MAX_BARS_BACK for indicator function - zero value", async () => {
      const source = 'indicator("Test", max_bars_back=0)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
      expect(result.violations[0].metadata.actualValue).toBe(0);
      expect(result.violations[0].metadata.minValue).toBe(1);
      expect(result.violations[0].metadata.maxValue).toBe(5000);
      expect(result.violations[0].metadata.functionName).toBe("indicator");
      expect(result.violations[0].metadata.parameterName).toBe("max_bars_back");
    });

    it("should detect INVALID_MAX_BARS_BACK for indicator function - negative value", async () => {
      const source = 'indicator("Test", max_bars_back=-1)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
      expect(result.violations[0].metadata.actualValue).toBe(-1);
      expect(result.violations[0].metadata.minValue).toBe(1);
      expect(result.violations[0].metadata.maxValue).toBe(5000);
    });

    it("should detect INVALID_MAX_BARS_BACK for indicator function - value too high", async () => {
      const source = 'indicator("Test", max_bars_back=5001)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
      expect(result.violations[0].metadata.actualValue).toBe(5001);
      expect(result.violations[0].metadata.maxValue).toBe(5000);
    });

    it("should detect INVALID_MAX_BARS_BACK for strategy function - negative value", async () => {
      const source = 'strategy("Test Strategy", max_bars_back=-100)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
      expect(result.violations[0].metadata.actualValue).toBe(-100);
      expect(result.violations[0].metadata.functionName).toBe("strategy");
    });

    it("should detect INVALID_MAX_BARS_BACK for strategy function - value too high", async () => {
      const source = 'strategy("Test Strategy", max_bars_back=10000)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
      expect(result.violations[0].metadata.actualValue).toBe(10000);
      expect(result.violations[0].metadata.maxValue).toBe(5000);
    });

    it("should handle boundary case - minimum value (1)", async () => {
      const source = 'indicator("Test", max_bars_back=1)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - maximum value (5000)", async () => {
      const source = 'indicator("Test", max_bars_back=5000)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should detect INVALID_MAX_BARS_BACK for non-integer values", async () => {
      const source = 'indicator("Test", max_bars_back=100.5)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
      expect(result.violations[0].metadata.actualValue).toBe(100.5);
    });

    it("should handle multiple function calls and only flag max_bars_back issues", async () => {
      const source = `
        indicator("My Indicator", max_bars_back=0)
        ta.sma(close, 20)
        strategy("Test", max_bars_back=6000)
      `;
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations.length).toBeGreaterThan(0);

      // All violations should be INVALID_MAX_BARS_BACK
      result.violations.forEach((violation) => {
        expect(violation.rule).toBe("INVALID_MAX_BARS_BACK");
      });
    });

    it("should handle source code with no max_bars_back parameters", async () => {
      const source = "ta.sma(close, 20)";
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle valid max_bars_back in both functions", async () => {
      const source = `
        indicator("Valid Indicator", max_bars_back=500)
        strategy("Valid Strategy", max_bars_back=1000)
      `;
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Performance Requirements", () => {
    it("should complete validation within 15ms target", async () => {
      const source = 'indicator("Test", max_bars_back=-1)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.metrics.validationTimeMs).toBeLessThan(15);
    });

    it("should handle larger scripts efficiently", async () => {
      const largeSource = [
        'indicator("Test 0", max_bars_back=0)',
        'indicator("Test 1", max_bars_back=6000)',
        'indicator("Test 2", max_bars_back=-50)',
        'indicator("Test 3", max_bars_back=10000)',
        'indicator("Test 4", max_bars_back=-1)',
      ].join("\n");

      const result = await quickValidateMaxBarsBack(largeSource);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(true);
      expect(result.violations.length).toBe(5); // Should detect all 5 violations
      expect(result.metrics.validationTimeMs).toBeLessThan(100); // More lenient for large scripts
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed Pine Script gracefully", async () => {
      const source = 'indicator("Test", max_bars_back=';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.violations).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it("should handle empty source code", async () => {
      const source = "";
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle commented out lines", async () => {
      const source = '// indicator("Test", max_bars_back=-1)';
      const result = await quickValidateMaxBarsBack(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBarsBackError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Detailed Error Messages", () => {
    it("should provide detailed error information for range violation", async () => {
      const source = 'indicator("Test", max_bars_back=-1)';
      const result = await quickValidateMaxBarsBack(source);

      const violation = result.violations[0];
      expect(violation.message).toContain("max_bars_back must be between 1 and 5000");
      expect(violation.message).toContain("INVALID_MAX_BARS_BACK");
      expect(violation.severity).toBe("error");
      expect(violation.category).toBe("parameter_validation");
    });

    it("should provide detailed error information for non-integer violation", async () => {
      const source = 'indicator("Test", max_bars_back=100.5)';
      const result = await quickValidateMaxBarsBack(source);

      const violation = result.violations[0];
      expect(violation.message).toContain("must be an integer");
      expect(violation.severity).toBe("error");
      expect(violation.category).toBe("parameter_validation");
    });
  });
});

describe("Integration with Main Parser Functions", () => {
  describe("extractFunctionParameters", () => {
    it("should extract parameters including max_bars_back", async () => {
      const source = 'indicator("Test", max_bars_back=500)';
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe("indicator");
      expect(result.functionCalls[0].parameters.max_bars_back).toBe(500);
      expect(result.errors).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe("analyzePineScript", () => {
    it("should provide comprehensive analysis including max_bars_back validation", async () => {
      const source = 'indicator("Test Strategy", max_bars_back=-1)';
      const result = await analyzePineScript(source);

      expect(result.success).toBe(true);
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters.max_bars_back).toBe(-1);
    });
  });
});
