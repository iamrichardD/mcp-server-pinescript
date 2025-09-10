/**
 * Pine Script Parameter Naming Convention Validation System
 *
 * FORWARD-COMPATIBLE ARCHITECTURE (v4.0)
 * Uses documentation-based parameter detection for zero-maintenance validation.
 *
 * This module provides comprehensive validation for parameter naming conventions
 * across ALL Pine Script functions by dynamically loading function definitions
 * from processed TradingView documentation.
 *
 * Core Functionality:
 * - Detects function calls with named parameters using `paramName = value` pattern
 * - Validates parameter naming conventions against Pine Script standards
 * - Uses documentation-based registry for built-in function parameter detection
 * - Supports both deprecated parameter detection and general naming convention enforcement
 * - Works with any built-in function call, automatically supporting new TradingView functions
 *
 * Architecture Benefits:
 * 1. ZERO MAINTENANCE: New functions automatically supported when docs update
 * 2. ALWAYS ACCURATE: Uses official TradingView documentation as source of truth
 * 3. FALSE POSITIVE ELIMINATION: Built-in parameters never flagged as violations
 * 4. FORWARD COMPATIBLE: Supports future PineScript API changes without code updates
 *
 * Performance Target: <2ms validation time for 100+ function calls
 */
export interface ValidationViolation {
    errorCode: string;
    severity: 'error' | 'warning' | 'suggestion';
    category: string;
    message: string;
    suggestedFix: string;
    line: number;
    column: number;
    functionName?: string;
    parameterName?: string;
    correctParameterName?: string;
    suggestedParameterName?: string;
    namingConvention?: {
        detected: string;
        expected: string;
    };
}
export interface ValidationResult {
    isValid: boolean;
    violations: ValidationViolation[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        violationsFound: number;
    };
}
export interface FunctionCall {
    fullName: string;
    namespace: string | null;
    functionName: string;
    parameters: NamedParameter[];
    fullMatch: string;
    line: number;
    column: number;
}
export interface NamedParameter {
    name: string;
    value: string;
    originalMatch: string;
}
interface NamingIssue {
    detected: string;
    expected: string;
    suggestion: string;
}
export declare class ParameterNamingValidator {
    private parameterPatterns;
    private deprecatedMigrations;
    constructor();
    /**
     * Main validation entry point
     * @param source - Pine Script source code
     * @returns Validation result with violations and performance metrics
     */
    validateParameterNaming(source: string): Promise<ValidationResult>;
    /**
     * Extract all function calls with named parameters from source code
     * @param source - Pine Script source code
     * @returns Array of function call objects
     */
    extractFunctionCalls(source: string): FunctionCall[];
    /**
     * Optimized in-place parameter extraction to avoid substring operations
     * @param source - The full source string
     * @param startIndex - Start index of parameters
     * @param endIndex - End index of parameters
     * @returns Array of named parameter objects
     */
    extractNamedParametersInPlace(source: string, startIndex: number, endIndex: number): NamedParameter[];
    /**
     * Validate a single function call for parameter naming violations
     * @param functionCall - Function call object
     * @returns Array of violation objects
     */
    validateFunctionCall(functionCall: FunctionCall): ValidationViolation[];
    /**
     * Check if parameter is deprecated and needs migration
     * @param functionName - Full function name
     * @param paramName - Parameter name
     * @param line - Line number
     * @param column - Column number
     * @returns Violation object or null
     */
    checkDeprecatedParameter(functionName: string, paramName: string, line: number, column: number): ValidationViolation | null;
    /**
     * Check parameter naming convention against Pine Script standards
     * @param functionName - Full function name
     * @param paramName - Parameter name
     * @param line - Line number
     * @param column - Column number
     * @returns Violation object or null
     */
    checkParameterNamingConvention(functionName: string, paramName: string, line: number, column: number): ValidationViolation | null;
    /**
     * Check if parameter name is in the known valid parameters list
     * @param paramName - Parameter name to check
     * @returns True if parameter is known to be valid
     */
    isKnownValidParameter(paramName: string): boolean;
    /**
     * Context-aware check: Determine if parameter belongs to a built-in function
     *
     * PERFORMANCE-OPTIMIZED IMPLEMENTATION (v4.0):
     * Uses pre-loaded documentation registry for ultra-fast synchronous lookups.
     * Documentation must be initialized at service startup via initializeDocumentationLoader().
     *
     * @param functionName - Full function name (e.g., "table.cell", "strategy.entry")
     * @param paramName - Parameter name to check
     * @returns True if this is a built-in function parameter that should skip validation
     */
    isBuiltInFunctionParameter(functionName: string, paramName: string): boolean;
    /**
     * Legacy hardcoded parameter detection (FALLBACK ONLY)
     * Used only when documentation loading fails
     */
    private isBuiltInFunctionParameterLegacy;
    /**
     * Detect naming convention violations
     * @param paramName - Parameter name to analyze
     * @returns Naming issue details or null
     */
    detectNamingConventionViolation(paramName: string): NamingIssue | null;
    /**
     * Check if string follows camelCase pattern
     * @param str - String to check
     * @returns True if camelCase
     */
    isCamelCase(str: string): boolean;
    /**
     * Check if string follows PascalCase pattern
     * @param str - String to check
     * @returns True if PascalCase
     */
    isPascalCase(str: string): boolean;
    /**
     * Check if string is ALL_CAPS
     * @param str - String to check
     * @returns True if ALL_CAPS
     */
    isAllCaps(str: string): boolean;
    /**
     * Convert camelCase to snake_case
     * @param str - camelCase string
     * @returns snake_case string
     */
    convertCamelToSnake(str: string): string;
    /**
     * Convert PascalCase to snake_case
     * @param str - PascalCase string
     * @returns snake_case string
     */
    convertPascalToSnake(str: string): string;
    /**
     * Convert ALL_CAPS to snake_case
     * @param str - ALL_CAPS string
     * @returns snake_case string
     */
    convertAllCapsToSnake(str: string): string;
}
export declare function quickValidateParameterNaming(source: string): Promise<ValidationResult>;
/**
 * Enhanced validation for specific error codes (legacy compatibility)
 * @param source - Pine Script source code
 * @param errorCode - Specific error code to check
 * @returns Validation result
 */
export declare function validateSpecificParameterError(source: string, errorCode: string): Promise<ValidationResult>;
export declare function validatePineScriptParameters(source: string): Promise<ValidationResult>;
export {};
