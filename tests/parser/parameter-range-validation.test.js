/**
 * Comprehensive Parameter Range Validation Test Suite
 *
 * Implementation of atomic testing pattern for complete parameter range validation coverage.
 * Tests all numeric parameter constraints across precision, max_bars_back, and drawing object limits.
 *
 * Following the proven atomic methodology that achieved 100% test pass rate with 7 validation rules.
 * This is the 8th consecutive validation rule implementation using our validated success framework.
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  loadValidationRules,
  quickValidateDrawingObjectCounts,
  quickValidateMaxBarsBack,
  quickValidateMaxBoxesCount,
  quickValidateMaxLabelsCount,
  quickValidateMaxLinesCount,
  quickValidatePrecision,
  validatePineScriptParameters,
} from "../../src/parser/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const validationRules = JSON.parse(
  readFileSync(join(__dirname, "../../docs/validation-rules.json"), "utf-8")
);

describe("PARAMETER_RANGE_VALIDATION - Comprehensive Suite", () => {
  beforeAll(() => {
    loadValidationRules(validationRules);
  });

  describe("Individual Parameter Range Validations", () => {
    describe("Precision Parameter Range Validation", () => {
      it("should accept minimum valid precision value (0)", async () => {
        const source = '//@version=6\nindicator("Test", precision=0)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept maximum valid precision value (8)", async () => {
        const source = '//@version=6\nindicator("Test", precision=8)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should reject precision below minimum (negative)", async () => {
        const source = '//@version=6\nindicator("Test", precision=-1)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_PRECISION");
        expect(result.violations[0].metadata.actualValue).toBe(-1);
        expect(result.violations[0].metadata.minValue).toBe(0);
        expect(result.violations[0].metadata.maxValue).toBe(8);
      });

      it("should reject precision above maximum (9)", async () => {
        const source = '//@version=6\nindicator("Test", precision=9)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_PRECISION");
        expect(result.violations[0].metadata.actualValue).toBe(9);
        expect(result.violations[0].metadata.maxValue).toBe(8);
      });

      it("should accept valid precision for strategy function", async () => {
        const source = '//@version=6\nstrategy("Test", precision=5)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should reject invalid precision for strategy function", async () => {
        const source = '//@version=6\nstrategy("Test", precision=15)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_PRECISION");
        expect(result.violations[0].metadata.functionName).toBe("strategy");
      });

      it("should validate precision performance under 2ms", async () => {
        const source = '//@version=6\nindicator("Test", precision=5)';
        const startTime = performance.now();

        const result = await quickValidatePrecision(source);
        const endTime = performance.now();

        expect(result.success).toBe(true);
        expect(endTime - startTime).toBeLessThan(2);
      });

      it("should handle large precision values gracefully", async () => {
        const source = '//@version=6\nindicator("Test", precision=999)';
        const result = await quickValidatePrecision(source);

        expect(result.success).toBe(true);
        expect(result.hasPrecisionError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].metadata.actualValue).toBe(999);
      });
    });

    describe("Max Bars Back Parameter Range Validation", () => {
      it("should accept minimum valid max_bars_back value (1)", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=1)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept maximum valid max_bars_back value (5000)", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=5000)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should reject max_bars_back below minimum (0)", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=0)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
        expect(result.violations[0].metadata.actualValue).toBe(0);
        expect(result.violations[0].metadata.minValue).toBe(1);
        expect(result.violations[0].metadata.maxValue).toBe(5000);
      });

      it("should reject max_bars_back above maximum (5001)", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=5001)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_MAX_BARS_BACK");
        expect(result.violations[0].metadata.actualValue).toBe(5001);
        expect(result.violations[0].metadata.maxValue).toBe(5000);
      });

      it("should accept valid max_bars_back for strategy function", async () => {
        const source = '//@version=6\nstrategy("Test", max_bars_back=1000)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should reject negative max_bars_back values", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=-10)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].metadata.actualValue).toBe(-10);
      });

      it("should validate max_bars_back performance under 2ms", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=2500)';
        const startTime = performance.now();

        const result = await quickValidateMaxBarsBack(source);
        const endTime = performance.now();

        expect(result.success).toBe(true);
        expect(endTime - startTime).toBeLessThan(2);
      });

      it("should handle very large max_bars_back values", async () => {
        const source = '//@version=6\nindicator("Test", max_bars_back=99999)';
        const result = await quickValidateMaxBarsBack(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBarsBackError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].metadata.actualValue).toBe(99999);
      });
    });

    describe("Drawing Object Count Range Validation", () => {
      it("should accept minimum valid max_lines_count (1)", async () => {
        const source = '//@version=6\nindicator("Test", max_lines_count=1)';
        const result = await quickValidateMaxLinesCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxLinesCountError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept maximum valid max_lines_count (500)", async () => {
        const source = '//@version=6\nindicator("Test", max_lines_count=500)';
        const result = await quickValidateMaxLinesCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxLinesCountError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept minimum valid max_labels_count (1)", async () => {
        const source = '//@version=6\nindicator("Test", max_labels_count=1)';
        const result = await quickValidateMaxLabelsCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxLabelsCountError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept maximum valid max_labels_count (500)", async () => {
        const source = '//@version=6\nindicator("Test", max_labels_count=500)';
        const result = await quickValidateMaxLabelsCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxLabelsCountError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept minimum valid max_boxes_count (1)", async () => {
        const source = '//@version=6\nindicator("Test", max_boxes_count=1)';
        const result = await quickValidateMaxBoxesCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBoxesCountError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should accept maximum valid max_boxes_count (500)", async () => {
        const source = '//@version=6\nindicator("Test", max_boxes_count=500)';
        const result = await quickValidateMaxBoxesCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBoxesCountError).toBe(false);
        expect(result.violations).toHaveLength(0);
      });

      it("should reject zero drawing object counts", async () => {
        const source = '//@version=6\nindicator("Test", max_lines_count=0)';
        const result = await quickValidateMaxLinesCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxLinesCountError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_MAX_LINES_COUNT");
        expect(result.violations[0].metadata.actualValue).toBe(0);
      });

      it("should reject drawing object counts above maximum", async () => {
        const source = '//@version=6\nindicator("Test", max_boxes_count=501)';
        const result = await quickValidateMaxBoxesCount(source);

        expect(result.success).toBe(true);
        expect(result.hasMaxBoxesCountError).toBe(true);
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].rule).toBe("INVALID_MAX_BOXES_COUNT");
        expect(result.violations[0].metadata.actualValue).toBe(501);
      });
    });
  });

  describe("Cross-Function Parameter Validation Consistency", () => {
    it("should validate precision consistently across indicator and strategy", async () => {
      const indicatorSource = '//@version=6\nindicator("Test", precision=10)';
      const strategySource = '//@version=6\nstrategy("Test", precision=10)';

      const indicatorResult = await quickValidatePrecision(indicatorSource);
      const strategyResult = await quickValidatePrecision(strategySource);

      expect(indicatorResult.hasPrecisionError).toBe(true);
      expect(strategyResult.hasPrecisionError).toBe(true);
      expect(indicatorResult.violations[0].rule).toBe(strategyResult.violations[0].rule);
      expect(indicatorResult.violations[0].metadata.actualValue).toBe(
        strategyResult.violations[0].metadata.actualValue
      );
    });

    it("should validate max_bars_back consistently across functions", async () => {
      const indicatorSource = '//@version=6\nindicator("Test", max_bars_back=6000)';
      const strategySource = '//@version=6\nstrategy("Test", max_bars_back=6000)';

      const indicatorResult = await quickValidateMaxBarsBack(indicatorSource);
      const strategyResult = await quickValidateMaxBarsBack(strategySource);

      expect(indicatorResult.hasMaxBarsBackError).toBe(true);
      expect(strategyResult.hasMaxBarsBackError).toBe(true);
      expect(indicatorResult.violations[0].rule).toBe(strategyResult.violations[0].rule);
    });

    it("should validate drawing object counts consistently across functions", async () => {
      const indicatorSource = '//@version=6\nindicator("Test", max_lines_count=600)';
      const strategySource = '//@version=6\nstrategy("Test", max_lines_count=600)';

      const indicatorResult = await quickValidateMaxLinesCount(indicatorSource);
      const strategyResult = await quickValidateMaxLinesCount(strategySource);

      expect(indicatorResult.hasMaxLinesCountError).toBe(true);
      expect(strategyResult.hasMaxLinesCountError).toBe(true);
      expect(indicatorResult.violations[0].rule).toBe(strategyResult.violations[0].rule);
    });

    it("should provide consistent error messages across parameter types", async () => {
      const precisionSource = '//@version=6\nindicator("Test", precision=-1)';
      const maxBarsSource = '//@version=6\nindicator("Test", max_bars_back=-1)';

      const precisionResult = await quickValidatePrecision(precisionSource);
      const maxBarsResult = await quickValidateMaxBarsBack(maxBarsSource);

      expect(precisionResult.violations[0].metadata).toHaveProperty("actualValue");
      expect(precisionResult.violations[0].metadata).toHaveProperty("minValue");
      expect(precisionResult.violations[0].metadata).toHaveProperty("maxValue");
      expect(maxBarsResult.violations[0].metadata).toHaveProperty("actualValue");
      expect(maxBarsResult.violations[0].metadata).toHaveProperty("minValue");
      expect(maxBarsResult.violations[0].metadata).toHaveProperty("maxValue");
    });

    it("should validate multiple parameters in single function call", async () => {
      const source =
        '//@version=6\nindicator("Test", precision=10, max_bars_back=6000, max_lines_count=600)';

      const precisionResult = await quickValidatePrecision(source);
      const maxBarsResult = await quickValidateMaxBarsBack(source);
      const maxLinesResult = await quickValidateMaxLinesCount(source);

      expect(precisionResult.hasPrecisionError).toBe(true);
      expect(maxBarsResult.hasMaxBarsBackError).toBe(true);
      expect(maxLinesResult.hasMaxLinesCountError).toBe(true);
    });

    it("should validate parameter combinations without interference", async () => {
      const source =
        '//@version=6\nindicator("Test", precision=5, max_bars_back=2000, max_lines_count=250)';

      const precisionResult = await quickValidatePrecision(source);
      const maxBarsResult = await quickValidateMaxBarsBack(source);
      const maxLinesResult = await quickValidateMaxLinesCount(source);

      expect(precisionResult.hasPrecisionError).toBe(false);
      expect(maxBarsResult.hasMaxBarsBackError).toBe(false);
      expect(maxLinesResult.hasMaxLinesCountError).toBe(false);
    });

    it("should handle mixed valid and invalid parameters correctly", async () => {
      const source = '//@version=6\nindicator("Test", precision=5, max_bars_back=6000)';

      const precisionResult = await quickValidatePrecision(source);
      const maxBarsResult = await quickValidateMaxBarsBack(source);

      expect(precisionResult.hasPrecisionError).toBe(false);
      expect(maxBarsResult.hasMaxBarsBackError).toBe(true);
      expect(precisionResult.violations).toHaveLength(0);
      expect(maxBarsResult.violations).toHaveLength(1);
    });

    it("should maintain parameter validation independence", async () => {
      const singleParamSource = '//@version=6\nindicator("Test", precision=10)';
      const multiParamSource = '//@version=6\nindicator("Test", precision=10, max_bars_back=2000)';

      const singleResult = await quickValidatePrecision(singleParamSource);
      const multiResult = await quickValidatePrecision(multiParamSource);

      expect(singleResult.hasPrecisionError).toBe(true);
      expect(multiResult.hasPrecisionError).toBe(true);
      expect(singleResult.violations[0].rule).toBe(multiResult.violations[0].rule);
      expect(singleResult.violations[0].metadata.actualValue).toBe(
        multiResult.violations[0].metadata.actualValue
      );
    });
  });

  describe("Parameter Range Validation Performance", () => {
    it("should validate single parameter ranges under 2ms", async () => {
      const source = '//@version=6\nindicator("Test", precision=5)';
      const startTime = performance.now();

      await quickValidatePrecision(source);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2);
    });

    it("should validate multiple parameters under 10ms total", async () => {
      const source =
        '//@version=6\nindicator("Test", precision=5, max_bars_back=2000, max_lines_count=250)';
      const startTime = performance.now();

      await Promise.all([
        quickValidatePrecision(source),
        quickValidateMaxBarsBack(source),
        quickValidateMaxLinesCount(source),
      ]);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
    });

    it("should validate batch drawing object parameters under 15ms", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=250, max_labels_count=250, max_boxes_count=250)';
      const startTime = performance.now();

      await quickValidateDrawingObjectCounts(source);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(15);
    });

    it("should maintain performance with complex parameter combinations", async () => {
      const source =
        '//@version=6\nstrategy("Complex Test", precision=8, max_bars_back=5000, max_lines_count=500, max_labels_count=500, max_boxes_count=500)';
      const startTime = performance.now();

      await Promise.all([
        quickValidatePrecision(source),
        quickValidateMaxBarsBack(source),
        quickValidateDrawingObjectCounts(source),
      ]);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(20);
    });
  });

  describe("MCP Integration Parameter Range Validation", () => {
    it("should integrate parameter range validation with MCP pipeline", async () => {
      const source = '//@version=6\nindicator("Test", precision=10, max_bars_back=6000)';
      const result = await validatePineScriptParameters(source);

      expect(result).toHaveProperty("violations");
      expect(result.violations).toHaveLength(2);

      const precisionViolation = result.violations.find((v) => v.rule === "INVALID_PRECISION");
      const maxBarsViolation = result.violations.find((v) => v.rule === "INVALID_MAX_BARS_BACK");

      expect(precisionViolation).toBeDefined();
      expect(maxBarsViolation).toBeDefined();
    });

    it("should return properly formatted MCP violations for parameter ranges", async () => {
      const source = '//@version=6\nindicator("Test", precision=-1)';
      const result = await validatePineScriptParameters(source);

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toHaveProperty("rule");
      expect(result.violations[0]).toHaveProperty("message");
      expect(result.violations[0]).toHaveProperty("line");
      expect(result.violations[0]).toHaveProperty("column");
      expect(result.violations[0]).toHaveProperty("metadata");
    });

    it("should provide comprehensive parameter validation through MCP", async () => {
      const source =
        '//@version=6\nstrategy("Test", precision=15, max_bars_back=10000, max_lines_count=1000)';
      const result = await validatePineScriptParameters(source);

      expect(result.violations.length).toBeGreaterThanOrEqual(3);
      expect(result.violations.some((v) => v.rule === "INVALID_PRECISION")).toBe(true);
      expect(result.violations.some((v) => v.rule === "INVALID_MAX_BARS_BACK")).toBe(true);
      expect(result.violations.some((v) => v.rule === "INVALID_MAX_LINES_COUNT")).toBe(true);
    });

    it("should handle valid parameters through MCP without violations", async () => {
      const source =
        '//@version=6\nindicator("Test", precision=5, max_bars_back=2000, max_lines_count=250)';
      const result = await validatePineScriptParameters(source);

      const parameterViolations = result.violations.filter(
        (v) =>
          v.rule === "INVALID_PRECISION" ||
          v.rule === "INVALID_MAX_BARS_BACK" ||
          v.rule === "INVALID_MAX_LINES_COUNT"
      );

      expect(parameterViolations).toHaveLength(0);
    });
  });
});
