/**
 * Pine Script Parser Module
 *
 * Main entry point for the AST generation engine.
 * TypeScript implementation with full type safety for Pine Script parsing,
 * AST generation, and parameter validation.
 *
 * Integrates with the existing MCP server while maintaining high performance
 * and clean architecture with <15ms parsing targets.
 */

import type { AnalysisResult, ParserStatus, SourceLocation, ValidationResult } from './types.js';

// Export types for external use
export type { AnalysisResult, ParserStatus, ValidationResult } from './types.js';

/**
 * Quick validation result interface
 */
export interface QuickValidationResult {
  success: boolean;
  hasShortTitleError: boolean;
  violations: any[];
  error?: string;
  metrics: {
    validationTimeMs: number;
  };
}

// Core parsing functionality

import {
  extractFunctionParameters as _extractFunctionParameters,
  parseScript as _parseScript,
} from './parser.js';

export { _parseScript as parseScript, _extractFunctionParameters as extractFunctionParameters };

// AST type definitions and utilities

export {
  AST_NODE_TYPES,
  createFunctionCallNode,
  createLiteralNode,
  createParameterNode,
  createSourceLocation,
  DATA_TYPES,
  isASTNode,
  isFunctionCallNode,
  isParameterNode,
} from './ast-types.js';

// Lexical analysis

export {
  createLexer,
  KEYWORDS,
  TOKEN_TYPES,
  tokenize,
} from './lexer.js';

// Parameter validation

import {
  compareTypes as _compareTypes,
  extractFunctionCalls as _extractFunctionCalls,
  getExpectedSignature as _getExpectedSignature,
  getExpectedTypes as _getExpectedTypes,
  inferParameterTypes as _inferParameterTypes,
  loadValidationRules as _loadValidationRules,
  quickValidateBuiltinNamespace as _quickValidateBuiltinNamespace,
  quickValidateDrawingObjectCounts as _quickValidateDrawingObjectCounts,
  quickValidateFunctionSignatures as _quickValidateFunctionSignatures,
  quickValidateInputTypes as _quickValidateInputTypes,
  quickValidateLineContinuation as _quickValidateLineContinuation,
  quickValidateMaxBarsBack as _quickValidateMaxBarsBack,
  quickValidateMaxBoxesCount as _quickValidateMaxBoxesCount,
  quickValidateMaxLabelsCount as _quickValidateMaxLabelsCount,
  quickValidateMaxLinesCount as _quickValidateMaxLinesCount,
  quickValidatePrecision as _quickValidatePrecision,
  quickValidateSeriesTypeWhereSimpleExpected as _quickValidateSeriesTypeWhereSimpleExpected,
  validateBuiltinNamespace as _validateBuiltinNamespace,
  validateDrawingObjectCounts as _validateDrawingObjectCounts,
  validateFunctionSignatures as _validateFunctionSignatures,
  validateInputTypes as _validateInputTypes,
  validateLineContinuation as _validateLineContinuation,
  validateMaxBarsBack as _validateMaxBarsBack,
  validateMaxBoxesCount as _validateMaxBoxesCount,
  validateMaxLabelsCount as _validateMaxLabelsCount,
  validateMaxLinesCount as _validateMaxLinesCount,
  validateParameterCount as _validateParameterCount,
  validateParameters as _validateParameters,
  validateParameterTypes as _validateParameterTypes,
  validatePineScriptParameters as _validatePineScriptParameters,
  validatePrecision as _validatePrecision,
  validateSeriesTypeWhereSimpleExpected as _validateSeriesTypeWhereSimpleExpected,
  validateShortTitle as _validateShortTitle,
} from './validator.js';

export {
  _validateParameters as validateParameters,
  _validatePineScriptParameters as validatePineScriptParameters,
  _validateShortTitle as validateShortTitle,
  _loadValidationRules as loadValidationRules,
  _validatePrecision as validatePrecision,
  _quickValidatePrecision as quickValidatePrecision,
  _validateMaxBarsBack as validateMaxBarsBack,
  _quickValidateMaxBarsBack as quickValidateMaxBarsBack,
  _validateMaxLinesCount as validateMaxLinesCount,
  _quickValidateMaxLinesCount as quickValidateMaxLinesCount,
  _validateMaxLabelsCount as validateMaxLabelsCount,
  _quickValidateMaxLabelsCount as quickValidateMaxLabelsCount,
  _validateMaxBoxesCount as validateMaxBoxesCount,
  _quickValidateMaxBoxesCount as quickValidateMaxBoxesCount,
  _validateDrawingObjectCounts as validateDrawingObjectCounts,
  _quickValidateDrawingObjectCounts as quickValidateDrawingObjectCounts,
  _validateInputTypes as validateInputTypes,
  _quickValidateInputTypes as quickValidateInputTypes,
  _extractFunctionCalls as extractFunctionCalls,
  _inferParameterTypes as inferParameterTypes,
  _getExpectedTypes as getExpectedTypes,
  _compareTypes as compareTypes,
  _validateFunctionSignatures as validateFunctionSignatures,
  _quickValidateFunctionSignatures as quickValidateFunctionSignatures,
  _getExpectedSignature as getExpectedSignature,
  _validateParameterCount as validateParameterCount,
  _validateSeriesTypeWhereSimpleExpected as validateSeriesTypeWhereSimpleExpected,
  _quickValidateSeriesTypeWhereSimpleExpected as quickValidateSeriesTypeWhereSimpleExpected,
  _validateParameterTypes as validateParameterTypes,
  _validateBuiltinNamespace as validateBuiltinNamespace,
  _quickValidateBuiltinNamespace as quickValidateBuiltinNamespace,
  _validateLineContinuation as validateLineContinuation,
  _quickValidateLineContinuation as quickValidateLineContinuation,
};

/**
 * High-level API for Pine Script analysis
 * Provides the main integration points for the MCP server
 */

/**
 * Analyze Pine Script code for parameter validation
 * Main integration function for index.js:577-579
 */
export async function analyzePineScript(
  source: string,
  validationRules: Record<string, unknown> | null = null
): Promise<AnalysisResult> {
  const startTime = performance.now();

  try {
    // Parse the script to extract function calls and parameters
    const parseResult = _extractFunctionParameters(source);

    // If validation rules are provided, validate parameters
    // If no rules provided, default to SHORT_TITLE_TOO_LONG validation
    let violations: any[] = [];
    if (validationRules) {
      const validationResult = await _validatePineScriptParameters(source, validationRules);
      violations = validationResult.violations;
    } else {
      // Default to short title validation
      const shortTitleResult = _validateShortTitle(source);
      violations = shortTitleResult.violations;
    }

    const endTime = performance.now();

    return {
      success: true,
      violations,
      functionCalls: parseResult.functionCalls,
      metrics: {
        totalTimeMs: endTime - startTime,
        parseTimeMs: parseResult.metrics.parseTimeMs,
        functionsFound: parseResult.functionCalls.length,
        errorsFound: violations.length,
      },
      errors: parseResult.errors,
    };
  } catch (error) {
    const endTime = performance.now();

    return {
      success: false,
      violations: [],
      functionCalls: [],
      metrics: {
        totalTimeMs: endTime - startTime,
        parseTimeMs: 0,
        functionsFound: 0,
        errorsFound: 1,
      },
      errors: [
        {
          code: 'UNHANDLED_EXCEPTION',
          message: error instanceof Error ? error.message : String(error),
          location: { line: 1, column: 1, offset: 0, length: 0 },
          severity: 'error',
        },
      ],
    };
  }
}

/**
 * Quick validation for SHORT_TITLE_TOO_LONG specifically
 * Optimized for the highest priority validation requirement
 */
export async function quickValidateShortTitle(source: string): Promise<QuickValidationResult> {
  const startTime = performance.now();

  try {
    const result = _validateShortTitle(source);
    const endTime = performance.now();

    return {
      success: true,
      hasShortTitleError: result.violations.some((v: any) => v.rule === 'SHORT_TITLE_TOO_LONG'),
      violations: result.violations.filter((v: any) => v.rule === 'SHORT_TITLE_TOO_LONG'),
      metrics: {
        validationTimeMs: endTime - startTime,
      },
    };
  } catch (error) {
    const endTime = performance.now();

    return {
      success: false,
      hasShortTitleError: false,
      violations: [],
      error: error instanceof Error ? error.message : String(error),
      metrics: {
        validationTimeMs: endTime - startTime,
      },
    };
  }
}

/**
 * Initialize the parser with validation rules
 * Should be called once during MCP server startup
 */
export async function initializeParser(
  validationRules: Record<string, unknown> | null
): Promise<boolean> {
  try {
    // Quick validation to avoid expensive operations on invalid input
    if (!validationRules || typeof validationRules !== 'object') {
      // Return false gracefully for invalid rules instead of throwing
      return false;
    }

    _loadValidationRules(validationRules);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get parser capabilities and status
 * Useful for debugging and monitoring
 */
export function getParserStatus(): ParserStatus {
  return {
    version: '1.0.0',
    capabilities: [
      'pine_script_parsing',
      'ast_generation',
      'parameter_extraction',
      'function_call_analysis',
      'shorttitle_validation',
      'parameter_constraint_validation',
    ],
    performance: {
      targetParseTime: '<15ms',
      targetValidationTime: '<5ms',
      memoryEfficient: true,
      streamingSupport: false, // Could be added in future
    },
    integration: {
      mcpServerCompatible: true,
      typescriptReady: true,
      testFramework: 'vitest',
    },
  };
}

/**
 * Error handling patterns with proper TypeScript types
 */

/**
 * Parser error base class
 */
export class PineScriptParseError extends Error {
  public readonly location: SourceLocation | undefined;
  public readonly code: string;

  constructor(message: string, location?: SourceLocation, code = 'PARSE_ERROR') {
    super(message);
    this.name = 'PineScriptParseError';
    this.location = location;
    this.code = code;
  }
}

/**
 * Validation error class
 */
export class PineScriptValidationError extends Error {
  public readonly violations: any[];
  public readonly code: string;

  constructor(message: string, violations: any[], code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'PineScriptValidationError';
    this.violations = violations;
    this.code = code;
  }
}

/**
 * Type guards for error handling
 */

export function isPineScriptParseError(error: unknown): error is PineScriptParseError {
  return error instanceof PineScriptParseError;
}

export function isPineScriptValidationError(error: unknown): error is PineScriptValidationError {
  return error instanceof PineScriptValidationError;
}

/**
 * Performance monitoring utilities
 * These help maintain the <15ms target performance
 */

/**
 * Measurement result interface
 */
interface MeasurementResult<T> {
  result: T;
  duration: number;
}

/**
 * Performance monitor for parsing operations
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number>();

  start(operation: string): void {
    this.measurements.set(operation, performance.now());
  }

  end(operation: string): number {
    const startTime = this.measurements.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.measurements.delete(operation);
      return duration;
    }
    return 0;
  }

  measure<T>(operation: string, fn: () => T): MeasurementResult<T> {
    this.start(operation);
    const result = fn();
    const duration = this.end(operation);

    return {
      result,
      duration,
    };
  }

  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<MeasurementResult<T>> {
    this.start(operation);
    const result = await fn();
    const duration = this.end(operation);

    return {
      result,
      duration,
    };
  }
}

// Export singleton performance monitor
export const performanceMonitor = new PerformanceMonitor();

/**
 * Pine Script parser instance interface
 */
interface PineScriptParser {
  validateCode(source: string): Promise<ValidationResult>;
}

/**
 * Create a Pine Script parser instance for testing
 * Provides a unified API for validation testing
 */
export async function createPineScriptParser(): Promise<PineScriptParser> {
  return {
    async validateCode(source: string): Promise<ValidationResult> {
      const violations: any[] = [];

      // Run all validation functions
      try {
        // Line continuation validation
        const lineContinuationResult = _quickValidateLineContinuation(source);
        if (lineContinuationResult.violations) {
          violations.push(...lineContinuationResult.violations);
        }

        // Series type validation
        const seriesTypeResult = _quickValidateSeriesTypeWhereSimpleExpected(source);
        if (seriesTypeResult.violations) {
          violations.push(...seriesTypeResult.violations);
        }

        // Builtin namespace validation
        const namespaceResult = _quickValidateBuiltinNamespace(source);
        if (namespaceResult.violations) {
          violations.push(...namespaceResult.violations);
        }

        // Short title validation
        const shortTitleResult = _validateShortTitle(source);
        if (shortTitleResult.violations) {
          violations.push(...shortTitleResult.violations);
        }

        return {
          violations,
          warnings: [],
          metrics: {
            validationTimeMs: 0,
            functionsAnalyzed: violations.length,
          },
        };
      } catch (error) {
        return {
          violations: [],
          warnings: [error instanceof Error ? error.message : String(error)],
          metrics: {
            validationTimeMs: 0,
            functionsAnalyzed: 0,
          },
        };
      }
    },
  };
}
