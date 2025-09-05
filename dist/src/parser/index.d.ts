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
import { extractFunctionParameters as _extractFunctionParameters, parseScript as _parseScript } from './parser.js';
export { _parseScript as parseScript, _extractFunctionParameters as extractFunctionParameters };
export { AST_NODE_TYPES, createFunctionCallNode, createLiteralNode, createParameterNode, createSourceLocation, DATA_TYPES, isASTNode, isFunctionCallNode, isParameterNode, } from './ast-types.js';
export { createLexer, KEYWORDS, TOKEN_TYPES, tokenize, } from './lexer.js';
import { compareTypes as _compareTypes, extractFunctionCalls as _extractFunctionCalls, getExpectedTypes as _getExpectedTypes, inferParameterTypes as _inferParameterTypes, quickValidateDrawingObjectCounts as _quickValidateDrawingObjectCounts, quickValidateFunctionSignatures as _quickValidateFunctionSignatures, quickValidateInputTypes as _quickValidateInputTypes, quickValidateLineContinuation as _quickValidateLineContinuation, quickValidateMaxBarsBack as _quickValidateMaxBarsBack, quickValidatePrecision as _quickValidatePrecision, validateParameters as _validateParameters, validateSeriesTypeWhereSimpleExpected as _validateSeriesTypeWhereSimpleExpected, validateShortTitle as _validateShortTitle } from './validator.js';
export { _validateParameters as validateParameters, _validateShortTitle as validateShortTitle, _quickValidatePrecision as quickValidatePrecision, _quickValidateMaxBarsBack as quickValidateMaxBarsBack, _quickValidateDrawingObjectCounts as quickValidateDrawingObjectCounts, _quickValidateInputTypes as quickValidateInputTypes, _extractFunctionCalls as extractFunctionCalls, _inferParameterTypes as inferParameterTypes, _getExpectedTypes as getExpectedTypes, _compareTypes as compareTypes, _quickValidateFunctionSignatures as quickValidateFunctionSignatures, _validateSeriesTypeWhereSimpleExpected as validateSeriesTypeWhereSimpleExpected, _quickValidateLineContinuation as quickValidateLineContinuation, };
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
