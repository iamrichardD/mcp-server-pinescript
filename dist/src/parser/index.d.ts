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
import type { AnalysisResult, ValidationResult, ParserStatus, SourceLocation } from "./types.js";
export type { AnalysisResult, ValidationResult, ParserStatus } from "./types.js";
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
import { extractFunctionParameters as _extractFunctionParameters, parseScript as _parseScript } from "./parser.js";
export { _parseScript as parseScript, _extractFunctionParameters as extractFunctionParameters };
export { AST_NODE_TYPES, createFunctionCallNode, createLiteralNode, createParameterNode, createSourceLocation, DATA_TYPES, isASTNode, isFunctionCallNode, isParameterNode, } from "./ast-types.js";
export { createLexer, KEYWORDS, TOKEN_TYPES, tokenize, } from "./lexer.js";
import { compareTypes as _compareTypes, extractFunctionCalls as _extractFunctionCalls, getExpectedSignature as _getExpectedSignature, getExpectedTypes as _getExpectedTypes, inferParameterTypes as _inferParameterTypes, loadValidationRules as _loadValidationRules, quickValidateBuiltinNamespace as _quickValidateBuiltinNamespace, quickValidateDrawingObjectCounts as _quickValidateDrawingObjectCounts, quickValidateFunctionSignatures as _quickValidateFunctionSignatures, quickValidateInputTypes as _quickValidateInputTypes, quickValidateLineContinuation as _quickValidateLineContinuation, quickValidateMaxBarsBack as _quickValidateMaxBarsBack, quickValidateMaxBoxesCount as _quickValidateMaxBoxesCount, quickValidateMaxLabelsCount as _quickValidateMaxLabelsCount, quickValidateMaxLinesCount as _quickValidateMaxLinesCount, quickValidatePrecision as _quickValidatePrecision, quickValidateSeriesTypeWhereSimpleExpected as _quickValidateSeriesTypeWhereSimpleExpected, validateBuiltinNamespace as _validateBuiltinNamespace, validateDrawingObjectCounts as _validateDrawingObjectCounts, validateFunctionSignatures as _validateFunctionSignatures, validateInputTypes as _validateInputTypes, validateLineContinuation as _validateLineContinuation, validateMaxBarsBack as _validateMaxBarsBack, validateMaxBoxesCount as _validateMaxBoxesCount, validateMaxLabelsCount as _validateMaxLabelsCount, validateMaxLinesCount as _validateMaxLinesCount, validateParameterCount as _validateParameterCount, validateParameters as _validateParameters, validateParameterTypes as _validateParameterTypes, validatePineScriptParameters as _validatePineScriptParameters, validatePrecision as _validatePrecision, validateSeriesTypeWhereSimpleExpected as _validateSeriesTypeWhereSimpleExpected, validateShortTitle as _validateShortTitle } from "./validator.js";
export { _validateParameters as validateParameters, _validatePineScriptParameters as validatePineScriptParameters, _validateShortTitle as validateShortTitle, _loadValidationRules as loadValidationRules, _validatePrecision as validatePrecision, _quickValidatePrecision as quickValidatePrecision, _validateMaxBarsBack as validateMaxBarsBack, _quickValidateMaxBarsBack as quickValidateMaxBarsBack, _validateMaxLinesCount as validateMaxLinesCount, _quickValidateMaxLinesCount as quickValidateMaxLinesCount, _validateMaxLabelsCount as validateMaxLabelsCount, _quickValidateMaxLabelsCount as quickValidateMaxLabelsCount, _validateMaxBoxesCount as validateMaxBoxesCount, _quickValidateMaxBoxesCount as quickValidateMaxBoxesCount, _validateDrawingObjectCounts as validateDrawingObjectCounts, _quickValidateDrawingObjectCounts as quickValidateDrawingObjectCounts, _validateInputTypes as validateInputTypes, _quickValidateInputTypes as quickValidateInputTypes, _extractFunctionCalls as extractFunctionCalls, _inferParameterTypes as inferParameterTypes, _getExpectedTypes as getExpectedTypes, _compareTypes as compareTypes, _validateFunctionSignatures as validateFunctionSignatures, _quickValidateFunctionSignatures as quickValidateFunctionSignatures, _getExpectedSignature as getExpectedSignature, _validateParameterCount as validateParameterCount, _validateSeriesTypeWhereSimpleExpected as validateSeriesTypeWhereSimpleExpected, _quickValidateSeriesTypeWhereSimpleExpected as quickValidateSeriesTypeWhereSimpleExpected, _validateParameterTypes as validateParameterTypes, _validateBuiltinNamespace as validateBuiltinNamespace, _quickValidateBuiltinNamespace as quickValidateBuiltinNamespace, _validateLineContinuation as validateLineContinuation, _quickValidateLineContinuation as quickValidateLineContinuation, };
/**
 * High-level API for Pine Script analysis
 * Provides the main integration points for the MCP server
 */
/**
 * Analyze Pine Script code for parameter validation
 * Main integration function for index.js:577-579
 */
export declare function analyzePineScript(source: string, validationRules?: Record<string, unknown> | null): Promise<AnalysisResult>;
/**
 * Quick validation for SHORT_TITLE_TOO_LONG specifically
 * Optimized for the highest priority validation requirement
 */
export declare function quickValidateShortTitle(source: string): Promise<QuickValidationResult>;
/**
 * Initialize the parser with validation rules
 * Should be called once during MCP server startup
 */
export declare function initializeParser(validationRules: Record<string, unknown> | null): Promise<boolean>;
/**
 * Get parser capabilities and status
 * Useful for debugging and monitoring
 */
export declare function getParserStatus(): ParserStatus;
/**
 * Error handling patterns with proper TypeScript types
 */
/**
 * Parser error base class
 */
export declare class PineScriptParseError extends Error {
    readonly location: SourceLocation | undefined;
    readonly code: string;
    constructor(message: string, location?: SourceLocation, code?: string);
}
/**
 * Validation error class
 */
export declare class PineScriptValidationError extends Error {
    readonly violations: any[];
    readonly code: string;
    constructor(message: string, violations: any[], code?: string);
}
/**
 * Type guards for error handling
 */
export declare function isPineScriptParseError(error: unknown): error is PineScriptParseError;
export declare function isPineScriptValidationError(error: unknown): error is PineScriptValidationError;
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
export declare class PerformanceMonitor {
    private measurements;
    start(operation: string): void;
    end(operation: string): number;
    measure<T>(operation: string, fn: () => T): MeasurementResult<T>;
    measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<MeasurementResult<T>>;
}
export declare const performanceMonitor: PerformanceMonitor;
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
export declare function createPineScriptParser(): Promise<PineScriptParser>;
