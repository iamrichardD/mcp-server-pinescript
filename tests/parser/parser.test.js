/**
 * Pine Script Parser Test Suite
 *
 * Demonstrates test-first approach for TypeScript migration.
 * Tests are designed to work with Vitest and will transition smoothly to TypeScript.
 *
 * Focus: Function parameter extraction and SHORT_TITLE_TOO_LONG validation
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  analyzePineScript,
  extractFunctionParameters,
  initializeParser,
  validateShortTitle,
} from "../../src/parser/index.js";

describe("Pine Script Parser", () => {
  describe("Basic Function Call Parsing", () => {
    it("should parse simple indicator() function call", () => {
      const source = `indicator("Test Indicator", shorttitle="TI")`;
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe("indicator");
      expect(result.functionCalls[0].parameters.shorttitle).toBe("TI");
    });

    it("should parse strategy() function call", () => {
      const source = `strategy("My Strategy", shorttitle="STRAT", overlay=true)`;
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe("strategy");
      expect(result.functionCalls[0].parameters.shorttitle).toBe("STRAT");
      expect(result.functionCalls[0].parameters.overlay).toBe(true);
    });

    it("should handle multi-line function calls", () => {
      const source = `
        indicator(
          "Multi-line Indicator",
          shorttitle="ML",
          overlay=false
        )
      `;
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].parameters.shorttitle).toBe("ML");
    });

    it("should parse namespaced function calls", () => {
      const source = `ta.sma(close, 20)`;
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].name).toBe("sma");
      expect(result.functionCalls[0].namespace).toBe("ta");
    });
  });

  describe("Parameter Extraction", () => {
    it("should extract string parameters correctly", () => {
      const source = `indicator("Test", shorttitle="ABCDEFGHIJK")`;
      const result = extractFunctionParameters(source);

      const func = result.functionCalls[0];
      expect(func.parameters.shorttitle).toBe("ABCDEFGHIJK");
      expect(typeof func.parameters.shorttitle).toBe("string");
    });

    it("should extract numeric parameters correctly", () => {
      const source = `strategy("Test", max_bars_back=500, precision=2)`;
      const result = extractFunctionParameters(source);

      const func = result.functionCalls[0];
      expect(func.parameters.max_bars_back).toBe(500);
      expect(func.parameters.precision).toBe(2);
    });

    it("should extract boolean parameters correctly", () => {
      const source = `indicator("Test", overlay=true, display=false)`;
      const result = extractFunctionParameters(source);

      const func = result.functionCalls[0];
      expect(func.parameters.overlay).toBe(true);
      expect(func.parameters.display).toBe(false);
    });

    it("should handle positional parameters", () => {
      const source = `ta.sma(close, 20)`;
      const result = extractFunctionParameters(source);

      const func = result.functionCalls[0];
      expect(func.parameters._0).toBe("close"); // First positional parameter
      expect(func.parameters._1).toBe(20); // Second positional parameter
    });
  });

  describe("SHORT_TITLE_TOO_LONG Validation", () => {
    it("should detect SHORT_TITLE_TOO_LONG error for indicator", () => {
      const source = `indicator("Test", shorttitle="VERYLONGTITLE")`;
      const result = validateShortTitle(source);

      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("SHORT_TITLE_TOO_LONG");
    });

    it("should detect SHORT_TITLE_TOO_LONG error for strategy", () => {
      const source = `strategy("Test", shorttitle="TOOLONGNAME")`;
      const result = validateShortTitle(source);

      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(true);
      expect(result.violations[0].metadata.actualLength).toBe(11);
      expect(result.violations[0].metadata.maxLength).toBe(10);
    });

    it("should NOT flag valid short titles", () => {
      const source = `indicator("Test", shorttitle="VALID")`;
      const result = validateShortTitle(source);

      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle exactly 10 character limit", () => {
      const source = `indicator("Test", shorttitle="EXACTLY10C")`;
      const result = validateShortTitle(source);

      expect(result.success).toBe(true);
      expect(result.hasShortTitleError).toBe(false);
    });

    it("should provide detailed error information", () => {
      const source = `indicator("Test", shorttitle="VERYLONGNAME")`;
      const result = validateShortTitle(source);

      const violation = result.violations[0];
      expect(violation.metadata.actualValue).toBe("VERYLONGNAME");
      expect(violation.metadata.actualLength).toBe(12);
      expect(violation.metadata.functionName).toBe("indicator");
      expect(violation.metadata.parameterName).toBe("shorttitle");
    });
  });

  describe("Performance Requirements", () => {
    it("should parse typical Pine Script file in <15ms", () => {
      const source = `
        //@version=6
        indicator("Performance Test", shorttitle="PERF", overlay=true)
        
        length = input.int(20, "Length")
        src = input.source(close, "Source")
        
        sma_value = ta.sma(src, length)
        ema_value = ta.ema(src, length)
        
        plot(sma_value, color=color.blue, title="SMA")
        plot(ema_value, color=color.red, title="EMA")
      `;

      const startTime = performance.now();
      const result = extractFunctionParameters(source);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(15);
      expect(result.functionCalls.length).toBeGreaterThan(0);
    });

    it("should validate parameters in <5ms", () => {
      const source = `indicator("Test", shorttitle="TOOLONG")`;

      const startTime = performance.now();
      const result = validateShortTitle(source);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5);
      expect(result.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle syntax errors gracefully", () => {
      const source = `indicator("Test" shorttitle="MISSING_COMMA")`;
      const result = extractFunctionParameters(source);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.functionCalls).toBeDefined();
    });

    it("should handle incomplete function calls", () => {
      const source = `indicator("Test"`;
      const result = extractFunctionParameters(source);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle empty input", () => {
      const source = "";
      const result = extractFunctionParameters(source);

      expect(result.functionCalls).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle malformed strings", () => {
      const source = `indicator("Unterminated string, shorttitle="TEST")`;
      const result = extractFunctionParameters(source);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Integration with MCP Server", () => {
    beforeEach(async () => {
      // Mock validation rules
      const mockRules = {
        functionValidationRules: {
          fun_indicator: {
            argumentConstraints: {
              shorttitle: {
                validation_constraints: {
                  maxLength: 10,
                  errorCode: "SHORT_TITLE_TOO_LONG",
                  errorMessage:
                    "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)",
                  severity: "error",
                  category: "parameter_validation",
                },
              },
            },
          },
        },
      };

      await initializeParser(mockRules);
    });

    it("should integrate with analyzePineScript function", async () => {
      const source = `indicator("Test", shorttitle="TOOLONGNAME")`;
      const result = await analyzePineScript(source);

      expect(result.success).toBe(true);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.functionCalls.length).toBe(1);
      expect(result.metrics.totalTimeMs).toBeDefined();
    });

    it("should provide metrics for monitoring", async () => {
      const source = `indicator("Test", shorttitle="OK")`;
      const result = await analyzePineScript(source);

      expect(result.metrics).toMatchObject({
        totalTimeMs: expect.any(Number),
        parseTimeMs: expect.any(Number),
        functionsFound: 1,
        errorsFound: 0,
      });
    });
  });

  describe("TypeScript Migration Readiness", () => {
    it("should have predictable return types", () => {
      const source = `indicator("Test", shorttitle="TEST")`;
      const result = extractFunctionParameters(source);

      // These assertions verify the structure will work with TypeScript
      expect(result).toHaveProperty("functionCalls");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("metrics");
      expect(Array.isArray(result.functionCalls)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should have consistent error structures", () => {
      const source = `indicator("Test", shorttitle="VERYLONGNAME")`;
      const result = validateShortTitle(source);

      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toHaveProperty("rule");
        expect(violation).toHaveProperty("message");
        expect(violation).toHaveProperty("line");
        expect(violation).toHaveProperty("severity");
        expect(violation).toHaveProperty("metadata");
      }
    });
  });
});
