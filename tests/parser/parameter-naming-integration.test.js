/**
 * Parameter Naming Validation Integration Test Suite
 *
 * Tests integration of parameter naming validation with the main validation pipeline.
 * Verifies that parameter naming violations are properly detected and reported
 * alongside other validation rules.
 *
 * Integration Points:
 * - Main validatePineScriptParameters function
 * - Error reporting and formatting
 * - Performance with other validators
 * - Rule loading and configuration
 * - MCP server integration points
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ParameterNamingValidator,
  quickValidateParameterNaming,
  validateSpecificParameterError,
} from "../../src/parser/parameter-naming-validator.js";
import {
  getCurrentValidationRules,
  loadValidationRules,
  validatePineScriptParameters,
} from "../../src/parser/validator.js";
import { initializeDocumentationLoader } from "../../src/parser/documentation-loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const validationRules = JSON.parse(
  readFileSync(join(__dirname, "../../docs/validation-rules.json"), "utf-8")
);

const expectedResults = JSON.parse(
  readFileSync(join(__dirname, "../fixtures/parameter-naming-expected-results.json"), "utf-8")
);

describe("Parameter Naming Validation - Integration Suite", () => {
  beforeAll(async () => {
    await initializeDocumentationLoader();
    loadValidationRules(validationRules);
  });

  describe("Main Validation Pipeline Integration", () => {
    it("should detect parameter naming violations in main validation pipeline", async () => {
      const source = `//@version=6
indicator("Integration Test")
plot(close, lineWidth = 2, trackPrice = true)
table.cell(t, 0, 0, "Test", textColor = color.white)`;

      const result = await validatePineScriptParameters(source);

      expect(result.success).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);

      // Filter parameter naming violations
      const parameterNamingViolations = result.violations.filter(
        (v) =>
          v.errorCode === "INVALID_PARAMETER_NAMING_CONVENTION" ||
          v.errorCode === "DEPRECATED_PARAMETER_NAME"
      );

      expect(parameterNamingViolations.length).toBeGreaterThan(0);
      expect(parameterNamingViolations.length).toBe(3); // lineWidth, trackPrice, textColor

      // Verify violation structure matches expected format
      parameterNamingViolations.forEach((violation) => {
        expect(violation).toHaveProperty("errorCode");
        expect(violation).toHaveProperty("severity");
        expect(violation).toHaveProperty("category");
        expect(violation).toHaveProperty("message");
        expect(violation).toHaveProperty("line");
        expect(violation).toHaveProperty("column");
        expect(violation).toHaveProperty("functionName");
        expect(violation).toHaveProperty("parameterName");
      });
    });

    it("should maintain validation performance in integrated pipeline", async () => {
      const source = `//@version=6
indicator("Performance Integration Test")
${Array(50)
  .fill()
  .map((_, i) => `plot(close[${i}], lineWidth = ${i + 1})`)
  .join("\n")}`;

      const startTime = performance.now();
      const result = await validatePineScriptParameters(source);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(20); // Allow more time for full pipeline

      // Should still detect parameter naming violations efficiently
      const parameterNamingViolations = result.violations.filter(
        (v) => v.errorCode === "INVALID_PARAMETER_NAMING_CONVENTION"
      );

      expect(parameterNamingViolations.length).toBe(50); // Each plot has lineWidth violation
    });

    it("should work alongside other validation rules", async () => {
      const source = `//@version=6
indicator("Multi-Validation Test")
// This should trigger multiple validation rules
plot(close, lineWidth = 2)  // parameter naming violation
// Add other violations if rules exist for them
table.cell(t, 0, 0, "Test", textColor = color.white)  // deprecated parameter`;

      const result = await validatePineScriptParameters(source);

      expect(result.violations.length).toBeGreaterThan(0);

      // Should have parameter naming violations
      const parameterNamingViolations = result.violations.filter(
        (v) =>
          v.errorCode === "INVALID_PARAMETER_NAMING_CONVENTION" ||
          v.errorCode === "DEPRECATED_PARAMETER_NAME"
      );

      expect(parameterNamingViolations.length).toBeGreaterThan(0);
    });
  });

  describe("Validation Rules Integration", () => {
    it("should respect loaded validation rules", () => {
      const currentRules = getCurrentValidationRules();
      expect(currentRules).toBeDefined();
      expect(currentRules).toBe(validationRules);
    });

    it("should detect INVALID_PARAMETER_NAMING_CONVENTION rule configuration", async () => {
      // Verify the rule is properly configured in the system
      const source = '//@version=6\nindicator("Test")\nplot(close, lineWidth = 2)';

      const result = await validatePineScriptParameters(source);
      const parameterViolations = result.violations.filter(
        (v) => v.errorCode === "INVALID_PARAMETER_NAMING_CONVENTION"
      );

      expect(parameterViolations.length).toBeGreaterThan(0);
      expect(parameterViolations[0]).toMatchObject({
        errorCode: "INVALID_PARAMETER_NAMING_CONVENTION",
        severity: "error",
        category: "parameter_validation",
      });
    });

    it("should handle rule loading errors gracefully", async () => {
      // Test with invalid rules (temporarily)
      const originalRules = getCurrentValidationRules();

      try {
        // This should still work even with missing rules
        const source = '//@version=6\nindicator("Test")\nplot(close, lineWidth = 2)';
        const result = await quickValidateParameterNaming(source);

        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe("boolean");
      } finally {
        // Restore original rules
        loadValidationRules(originalRules);
      }
    });
  });

  describe("Expected Results Validation", () => {
    Object.entries(expectedResults.testCases).forEach(([testName, testCase]) => {
      it(`should match expected results for ${testName}`, async () => {
        const result = await quickValidateParameterNaming(testCase.code);

        expect(result.violations).toHaveLength(testCase.expectedViolations);

        if (testCase.expectedErrorCodes.length > 0) {
          const actualErrorCodes = result.violations.map((v) => v.errorCode);
          testCase.expectedErrorCodes.forEach((expectedCode) => {
            expect(actualErrorCodes).toContain(expectedCode);
          });
        }

        if (testCase.expectedParameterNames) {
          const actualParameterNames = result.violations.map((v) => v.parameterName);
          testCase.expectedParameterNames.forEach((expectedName) => {
            expect(actualParameterNames).toContain(expectedName);
          });
        }

        if (testCase.expectedSuggestions) {
          const actualSuggestions = result.violations.map(
            (v) => v.suggestedParameterName || v.correctParameterName
          );
          testCase.expectedSuggestions.forEach((expectedSuggestion) => {
            expect(actualSuggestions).toContain(expectedSuggestion);
          });
        }
      });
    });
  });

  describe("Error Message Format Validation", () => {
    it("should format deprecated parameter error messages correctly", async () => {
      const source =
        '//@version=6\nindicator("Test")\ntable.cell(t, 0, 0, "Test", textColor = color.white)';
      const result = await quickValidateParameterNaming(source);

      expect(result.violations).toHaveLength(1);
      const violation = result.violations[0];

      expect(violation.errorCode).toBe("DEPRECATED_PARAMETER_NAME");

      // Verify message format matches requirements
      const requirements = expectedResults.errorMessageRequirements.deprecatedParameterMessage;
      requirements.mustContain.forEach((term) => {
        expect(violation.message.toLowerCase()).toContain(term.toLowerCase());
      });

      expect(violation.suggestedFix).toContain('Replace "textColor" with "text_color"');
    });

    it("should format naming convention error messages correctly", async () => {
      const source = '//@version=6\nindicator("Test")\nplot(close, lineWidth = 2)';
      const result = await quickValidateParameterNaming(source);

      expect(result.violations).toHaveLength(1);
      const violation = result.violations[0];

      expect(violation.errorCode).toBe("INVALID_PARAMETER_NAMING_CONVENTION");

      // Verify message format
      const requirements = expectedResults.errorMessageRequirements.namingConventionMessage;
      requirements.mustContain.forEach((term) => {
        expect(violation.message.toLowerCase()).toContain(term.toLowerCase());
      });

      expect(violation.suggestedFix).toContain(
        'Consider using "line_width" instead of "lineWidth"'
      );
    });

    it("should include all required violation fields", async () => {
      const source = '//@version=6\nindicator("Test")\nplot(close, lineWidth = 2)';
      const result = await quickValidateParameterNaming(source);

      expect(result.violations).toHaveLength(1);
      const violation = result.violations[0];

      const requiredFields = expectedResults.validationRuleCompliance.requiredFields;
      requiredFields.forEach((field) => {
        expect(violation).toHaveProperty(field);
        expect(violation[field]).toBeDefined();
      });
    });
  });

  describe("Function Coverage Validation", () => {
    it("should test all required function types", async () => {
      const requiredFunctions = expectedResults.functionCoverageRequirements.mustTestFunctions;

      // Create test code with all required functions
      const testCode = `//@version=6
indicator("Function Coverage Test")
table.cell(t, 0, 0, "Test", textColor = color.white)
plot(close, lineWidth = 2)
strategy.entry("Long", strategy.long, qtyPercent = 50)
strategy.exit("Exit", qtyPercent = 100)
length = input.int(20, minVal = 1)
multiplier = input.float(2.0, minVal = 0.1)
useMA = input.bool(true, groupName = "Settings")
src = input.source(close, inLine = true)
box.new(bar_index, high, bar_index+1, low, BorderColor = color.blue)
label.new(bar_index, high, "Test", textSize = size.normal)
line.new(bar_index, high, bar_index+1, low, lineWidth = 2)
polyline.new(lineWidth = 3)`;

      const result = await quickValidateParameterNaming(testCode);

      expect(result.violations.length).toBeGreaterThan(10);

      // Verify violations are found for different function types
      const functionNames = new Set(result.violations.map((v) => v.functionName));
      const coveredFunctions = requiredFunctions.filter((func) =>
        [...functionNames].some((fn) => fn.includes(func))
      );

      expect(coveredFunctions.length).toBeGreaterThan(8); // Should cover most required functions
    });

    it("should detect all deprecated parameter migrations", async () => {
      const migrations = expectedResults.functionCoverageRequirements.deprecatedParameterMigrations;

      for (const [functionName, deprecatedParams] of Object.entries(migrations)) {
        for (const deprecatedParam of deprecatedParams) {
          const source = `//@version=6
indicator("Deprecated Test")
${functionName}(arg1, arg2, arg3, ${deprecatedParam} = color.white)`;

          const result = await quickValidateParameterNaming(source);

          const deprecatedViolations = result.violations.filter(
            (v) =>
              v.errorCode === "DEPRECATED_PARAMETER_NAME" && v.parameterName === deprecatedParam
          );

          expect(deprecatedViolations.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Specific Error Code Filtering", () => {
    it("should filter deprecated parameter violations correctly", async () => {
      const source = `//@version=6
indicator("Filter Test")
table.cell(t, 0, 0, "Test", textColor = color.white)
plot(close, lineWidth = 2)`;

      const result = await validateSpecificParameterError(source, "DEPRECATED_PARAMETER_NAME");

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].errorCode).toBe("DEPRECATED_PARAMETER_NAME");
      expect(result.violations[0].parameterName).toBe("textColor");
    });

    it("should filter naming convention violations correctly", async () => {
      const source = `//@version=6
indicator("Filter Test")
table.cell(t, 0, 0, "Test", textColor = color.white)
plot(close, lineWidth = 2)`;

      const result = await validateSpecificParameterError(
        source,
        "INVALID_PARAMETER_NAMING_CONVENTION"
      );

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].errorCode).toBe("INVALID_PARAMETER_NAMING_CONVENTION");
      expect(result.violations[0].parameterName).toBe("lineWidth");
    });

    it("should return valid result when no specific violations found", async () => {
      const source =
        '//@version=6\nindicator("Test")\nplot(close, linewidth = 2, color = color.blue)';

      const result = await validateSpecificParameterError(source, "DEPRECATED_PARAMETER_NAME");

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe("Test Fixture Integration", () => {
    it("should validate comprehensive test cases file", async () => {
      const testCasesSource = readFileSync(
        join(__dirname, "../fixtures/parameter-naming-test-cases.pine"),
        "utf-8"
      );

      const result = await quickValidateParameterNaming(testCasesSource);

      expect(result.metrics.functionsAnalyzed).toBeGreaterThan(50);
      expect(result.violations.length).toBeGreaterThanOrEqual(70); // Realistic expectation based on test fixture

      // Verify different types of violations are detected
      const violationTypes = new Set(result.violations.map((v) => v.errorCode));
      expect(violationTypes.has("DEPRECATED_PARAMETER_NAME")).toBe(true);
      expect(violationTypes.has("INVALID_PARAMETER_NAMING_CONVENTION")).toBe(true);

      // Verify different naming convention types are detected
      const namingConventions = new Set(
        result.violations.filter((v) => v.namingConvention).map((v) => v.namingConvention.detected)
      );

      expect(namingConventions.has("camelCase")).toBe(true);
      expect(namingConventions.has("PascalCase")).toBe(true);
      expect(namingConventions.has("ALL_CAPS")).toBe(true);
    });

    it("should meet performance requirements with test fixtures", async () => {
      const performanceTestSource = readFileSync(
        join(__dirname, "../fixtures/parameter-naming-performance-test.pine"),
        "utf-8"
      );

      const startTime = performance.now();
      const result = await quickValidateParameterNaming(performanceTestSource);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      const performanceExpectations = expectedResults.performanceExpectations;

      expect(result.metrics.functionsAnalyzed).toBeGreaterThan(
        performanceExpectations.targetFunctionsCount
      );
      expect(executionTime).toBeLessThan(performanceExpectations.maxValidationTimeMs * 2); // Allow some overhead
      expect(result.violations.length).toBeGreaterThan(200);
    });
  });

  describe("Cross-Validation Consistency", () => {
    it("should produce consistent results across different validation methods", async () => {
      const source =
        '//@version=6\nindicator("Consistency Test")\nplot(close, lineWidth = 2)\ntable.cell(t, 0, 0, "Test", textColor = color.white)';

      // Test with different validation methods
      const quickResult = await quickValidateParameterNaming(source);
      const directValidator = new ParameterNamingValidator();
      const directResult = await directValidator.validateParameterNaming(source);
      const integratedResult = await validatePineScriptParameters(source);

      // Extract parameter naming violations from integrated result
      const integratedParameterViolations = integratedResult.violations.filter(
        (v) =>
          v.errorCode === "INVALID_PARAMETER_NAMING_CONVENTION" ||
          v.errorCode === "DEPRECATED_PARAMETER_NAME"
      );

      // All methods should detect the same violations
      expect(quickResult.violations).toHaveLength(2);
      expect(directResult.violations).toHaveLength(2);
      expect(integratedParameterViolations).toHaveLength(2);

      // Violation details should match
      const quickCodes = quickResult.violations.map((v) => v.errorCode).sort();
      const directCodes = directResult.violations.map((v) => v.errorCode).sort();
      const integratedCodes = integratedParameterViolations.map((v) => v.errorCode).sort();

      expect(directCodes).toEqual(quickCodes);
      expect(integratedCodes).toEqual(quickCodes);
    });

    it("should maintain validation state consistency", async () => {
      const validator = new ParameterNamingValidator();

      // Multiple validations should not affect each other
      const sources = [
        '//@version=6\nindicator("Test1")\nplot(close, lineWidth = 1)',
        '//@version=6\nindicator("Test2")\ntable.cell(t, 0, 0, "Test", textColor = color.white)',
        '//@version=6\nindicator("Test3")\nstrategy.entry("Long", strategy.long, qtyPercent = 50)',
      ];

      const results = [];
      for (const source of sources) {
        const result = await validator.validateParameterNaming(source);
        results.push(result);
      }

      // Each result should be independent and correct
      expect(results[0].violations).toHaveLength(1); // lineWidth
      expect(results[1].violations).toHaveLength(1); // textColor
      expect(results[2].violations).toHaveLength(1); // qtyPercent

      // Violation types should be correct
      expect(results[0].violations[0].errorCode).toBe("INVALID_PARAMETER_NAMING_CONVENTION");
      expect(results[1].violations[0].errorCode).toBe("DEPRECATED_PARAMETER_NAME");
      expect(results[2].violations[0].errorCode).toBe("INVALID_PARAMETER_NAMING_CONVENTION");
    });
  });
});
