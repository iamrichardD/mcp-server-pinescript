/**
 * Test Suite for INVALID_DRAWING_OBJECT_COUNTS Validation Batch
 *
 * Implementation of atomic testing pattern for drawing object count parameter validation.
 * Tests max_lines_count, max_labels_count, and max_boxes_count parameters.
 * Follows proven pattern achieving 100% test pass rate with precision/max_bars_back validations.
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  quickValidateDrawingObjectCounts,
  quickValidateMaxBoxesCount,
  quickValidateMaxLabelsCount,
  quickValidateMaxLinesCount,
} from "../../src/parser/index.js";

describe("INVALID_DRAWING_OBJECT_COUNTS Validation Batch", () => {
  describe("quickValidateMaxLinesCount", () => {
    it("should detect INVALID_MAX_LINES_COUNT for indicator function - negative value", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=-1)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LINES_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(-1);
      expect(result.violations[0].metadata.minValue).toBe(1);
      expect(result.violations[0].metadata.maxValue).toBe(500);
      expect(result.violations[0].metadata.functionName).toBe("indicator");
      expect(result.violations[0].metadata.parameterName).toBe("max_lines_count");
    });

    it("should detect INVALID_MAX_LINES_COUNT for indicator function - value too high", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=501)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LINES_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(501);
      expect(result.violations[0].metadata.maxValue).toBe(500);
    });

    it("should detect INVALID_MAX_LINES_COUNT for strategy function - negative value", async () => {
      const source = '//@version=6\nstrategy("Test", max_lines_count=-5)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LINES_COUNT");
      expect(result.violations[0].metadata.functionName).toBe("strategy");
    });

    it("should detect INVALID_MAX_LINES_COUNT for strategy function - value too high", async () => {
      const source = '//@version=6\nstrategy("Test", max_lines_count=1000)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LINES_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(1000);
    });

    it("should pass validation for max_lines_count within valid range", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=250)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - minimum value (1)", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=1)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - maximum value (500)", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=500)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle zero value as invalid", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=0)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].metadata.actualValue).toBe(0);
    });
  });

  describe("quickValidateMaxLabelsCount", () => {
    it("should detect INVALID_MAX_LABELS_COUNT for indicator function - negative value", async () => {
      const source = '//@version=6\nindicator("Test", max_labels_count=-10)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LABELS_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(-10);
      expect(result.violations[0].metadata.minValue).toBe(1);
      expect(result.violations[0].metadata.maxValue).toBe(500);
      expect(result.violations[0].metadata.functionName).toBe("indicator");
      expect(result.violations[0].metadata.parameterName).toBe("max_labels_count");
    });

    it("should detect INVALID_MAX_LABELS_COUNT for indicator function - value too high", async () => {
      const source = '//@version=6\nindicator("Test", max_labels_count=600)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LABELS_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(600);
      expect(result.violations[0].metadata.maxValue).toBe(500);
    });

    it("should detect INVALID_MAX_LABELS_COUNT for strategy function - negative value", async () => {
      const source = '//@version=6\nstrategy("Test", max_labels_count=-1)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LABELS_COUNT");
      expect(result.violations[0].metadata.functionName).toBe("strategy");
    });

    it("should detect INVALID_MAX_LABELS_COUNT for strategy function - value too high", async () => {
      const source = '//@version=6\nstrategy("Test", max_labels_count=750)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LABELS_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(750);
    });

    it("should pass validation for max_labels_count within valid range", async () => {
      const source = '//@version=6\nindicator("Test", max_labels_count=100)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - minimum value (1)", async () => {
      const source = '//@version=6\nindicator("Test", max_labels_count=1)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - maximum value (500)", async () => {
      const source = '//@version=6\nindicator("Test", max_labels_count=500)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle zero value as invalid", async () => {
      const source = '//@version=6\nindicator("Test", max_labels_count=0)';
      const result = await quickValidateMaxLabelsCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].metadata.actualValue).toBe(0);
    });
  });

  describe("quickValidateMaxBoxesCount", () => {
    it("should detect INVALID_MAX_BOXES_COUNT for indicator function - negative value", async () => {
      const source = '//@version=6\nindicator("Test", max_boxes_count=-3)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BOXES_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(-3);
      expect(result.violations[0].metadata.minValue).toBe(1);
      expect(result.violations[0].metadata.maxValue).toBe(500);
      expect(result.violations[0].metadata.functionName).toBe("indicator");
      expect(result.violations[0].metadata.parameterName).toBe("max_boxes_count");
    });

    it("should detect INVALID_MAX_BOXES_COUNT for indicator function - value too high", async () => {
      const source = '//@version=6\nindicator("Test", max_boxes_count=999)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BOXES_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(999);
      expect(result.violations[0].metadata.maxValue).toBe(500);
    });

    it("should detect INVALID_MAX_BOXES_COUNT for strategy function - negative value", async () => {
      const source = '//@version=6\nstrategy("Test", max_boxes_count=-2)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BOXES_COUNT");
      expect(result.violations[0].metadata.functionName).toBe("strategy");
    });

    it("should detect INVALID_MAX_BOXES_COUNT for strategy function - value too high", async () => {
      const source = '//@version=6\nstrategy("Test", max_boxes_count=800)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_BOXES_COUNT");
      expect(result.violations[0].metadata.actualValue).toBe(800);
    });

    it("should pass validation for max_boxes_count within valid range", async () => {
      const source = '//@version=6\nindicator("Test", max_boxes_count=200)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - minimum value (1)", async () => {
      const source = '//@version=6\nindicator("Test", max_boxes_count=1)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle boundary case - maximum value (500)", async () => {
      const source = '//@version=6\nindicator("Test", max_boxes_count=500)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle zero value as invalid", async () => {
      const source = '//@version=6\nindicator("Test", max_boxes_count=0)';
      const result = await quickValidateMaxBoxesCount(source);

      expect(result.success).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].metadata.actualValue).toBe(0);
    });
  });

  describe("quickValidateDrawingObjectCounts - Batch Validation", () => {
    it("should detect multiple drawing object count errors simultaneously", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=-1, max_labels_count=600, max_boxes_count=0)';
      const result = await quickValidateDrawingObjectCounts(source);

      expect(result.success).toBe(true);
      expect(result.hasDrawingObjectCountError).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(3);

      // Verify each specific error
      const lineError = result.violations.find((v) => v.rule === "INVALID_MAX_LINES_COUNT");
      const labelError = result.violations.find((v) => v.rule === "INVALID_MAX_LABELS_COUNT");
      const boxError = result.violations.find((v) => v.rule === "INVALID_MAX_BOXES_COUNT");

      expect(lineError).toBeDefined();
      expect(lineError.metadata.actualValue).toBe(-1);
      expect(labelError).toBeDefined();
      expect(labelError.metadata.actualValue).toBe(600);
      expect(boxError).toBeDefined();
      expect(boxError.metadata.actualValue).toBe(0);
    });

    it("should detect single drawing object count error with others valid", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=100, max_labels_count=600, max_boxes_count=250)';
      const result = await quickValidateDrawingObjectCounts(source);

      expect(result.success).toBe(true);
      expect(result.hasDrawingObjectCountError).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(false);
      expect(result.hasMaxLabelsCountError).toBe(true);
      expect(result.hasMaxBoxesCountError).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule).toBe("INVALID_MAX_LABELS_COUNT");
    });

    it("should pass validation when all drawing object counts are valid", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=100, max_labels_count=200, max_boxes_count=300)';
      const result = await quickValidateDrawingObjectCounts(source);

      expect(result.success).toBe(true);
      expect(result.hasDrawingObjectCountError).toBe(false);
      expect(result.hasMaxLinesCountError).toBe(false);
      expect(result.hasMaxLabelsCountError).toBe(false);
      expect(result.hasMaxBoxesCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should handle strategy function with drawing object count errors", async () => {
      const source =
        '//@version=6\nstrategy("Test", max_lines_count=501, max_labels_count=50, max_boxes_count=-10)';
      const result = await quickValidateDrawingObjectCounts(source);

      expect(result.success).toBe(true);
      expect(result.hasDrawingObjectCountError).toBe(true);
      expect(result.hasMaxLinesCountError).toBe(true);
      expect(result.hasMaxLabelsCountError).toBe(false);
      expect(result.hasMaxBoxesCountError).toBe(true);
      expect(result.violations).toHaveLength(2);

      // Verify function names are correct
      result.violations.forEach((violation) => {
        expect(violation.metadata.functionName).toBe("strategy");
      });
    });

    it("should handle boundary cases for all parameters simultaneously", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=1, max_labels_count=500, max_boxes_count=1)';
      const result = await quickValidateDrawingObjectCounts(source);

      expect(result.success).toBe(true);
      expect(result.hasDrawingObjectCountError).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it("should efficiently process batch validation in under 5ms", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=100, max_labels_count=200, max_boxes_count=300)';
      const startTime = performance.now();

      const result = await quickValidateDrawingObjectCounts(source);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5); // Performance requirement
    });

    it("should maintain performance with error detection", async () => {
      const source =
        '//@version=6\nindicator("Test", max_lines_count=-1, max_labels_count=600, max_boxes_count=0)';
      const startTime = performance.now();

      const result = await quickValidateDrawingObjectCounts(source);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(3);
      expect(duration).toBeLessThan(5); // Performance requirement even with errors
    });
  });

  describe("Performance and Integration Tests", () => {
    it("should complete individual validations within performance targets", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=250)';

      // Test max_lines_count performance
      const start1 = performance.now();
      const result1 = await quickValidateMaxLinesCount(source);
      const duration1 = performance.now() - start1;

      expect(result1.success).toBe(true);
      expect(duration1).toBeLessThan(2); // Individual validation target

      // Test max_labels_count performance
      const source2 = '//@version=6\nindicator("Test", max_labels_count=250)';
      const start2 = performance.now();
      const result2 = await quickValidateMaxLabelsCount(source2);
      const duration2 = performance.now() - start2;

      expect(result2.success).toBe(true);
      expect(duration2).toBeLessThan(2);

      // Test max_boxes_count performance
      const source3 = '//@version=6\nindicator("Test", max_boxes_count=250)';
      const start3 = performance.now();
      const result3 = await quickValidateMaxBoxesCount(source3);
      const duration3 = performance.now() - start3;

      expect(result3.success).toBe(true);
      expect(duration3).toBeLessThan(2);
    });

    it("should provide rich error metadata for debugging", async () => {
      const source = '//@version=6\nindicator("Test", max_lines_count=750)';
      const result = await quickValidateMaxLinesCount(source);

      expect(result.violations[0].metadata).toMatchObject({
        actualValue: 750,
        minValue: 1,
        maxValue: 500,
        functionName: "indicator",
        parameterName: "max_lines_count",
      });

      expect(result.violations[0].message).toContain("750");
      expect(result.violations[0].message).toContain("INVALID_MAX_LINES_COUNT");
    });

    it("should maintain consistent behavior across indicator and strategy functions", async () => {
      const indicatorSource = '//@version=6\nindicator("Test", max_lines_count=600)';
      const strategySource = '//@version=6\nstrategy("Test", max_lines_count=600)';

      const indicatorResult = await quickValidateMaxLinesCount(indicatorSource);
      const strategyResult = await quickValidateMaxLinesCount(strategySource);

      expect(indicatorResult.hasMaxLinesCountError).toBe(true);
      expect(strategyResult.hasMaxLinesCountError).toBe(true);
      expect(indicatorResult.violations[0].rule).toBe(strategyResult.violations[0].rule);
      expect(indicatorResult.violations[0].metadata.actualValue).toBe(
        strategyResult.violations[0].metadata.actualValue
      );
    });
  });
});
