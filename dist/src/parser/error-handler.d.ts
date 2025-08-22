/**
 * Error Handling Patterns for Pine Script Parser
 *
 * TypeScript implementation with discriminated unions and type safety.
 * Designed for graceful error recovery and detailed error reporting.
 */
import type { SourceLocation } from "./types.js";
/**
 * Result pattern for type-safe error handling
 * Discriminated union with proper type guards
 */
export type Result<T, E = Error> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
/**
 * Error severity levels
 */
export declare const ERROR_SEVERITY: {
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly ERROR: "error";
    readonly CRITICAL: "critical";
};
export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];
/**
 * Error categories for classification
 */
export declare const ERROR_CATEGORIES: {
    readonly LEXICAL: "lexical_error";
    readonly SYNTAX: "syntax_error";
    readonly SEMANTIC: "semantic_error";
    readonly VALIDATION: "validation_error";
    readonly PERFORMANCE: "performance_error";
    readonly INTEGRATION: "integration_error";
};
export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES];
/**
 * Standard error codes
 */
export declare const ERROR_CODES: {
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly UNTERMINATED_STRING: "UNTERMINATED_STRING";
    readonly INVALID_NUMBER: "INVALID_NUMBER";
    readonly UNEXPECTED_TOKEN: "UNEXPECTED_TOKEN";
    readonly EXPECTED_TOKEN: "EXPECTED_TOKEN";
    readonly MISSING_CLOSING_PAREN: "MISSING_CLOSING_PAREN";
    readonly INVALID_FUNCTION_CALL: "INVALID_FUNCTION_CALL";
    readonly UNDEFINED_FUNCTION: "UNDEFINED_FUNCTION";
    readonly INVALID_PARAMETER_COUNT: "INVALID_PARAMETER_COUNT";
    readonly TYPE_MISMATCH: "TYPE_MISMATCH";
    readonly SHORT_TITLE_TOO_LONG: "SHORT_TITLE_TOO_LONG";
    readonly PARAMETER_OUT_OF_RANGE: "PARAMETER_OUT_OF_RANGE";
    readonly REQUIRED_PARAMETER_MISSING: "REQUIRED_PARAMETER_MISSING";
    readonly PARSE_TIMEOUT: "PARSE_TIMEOUT";
    readonly MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED";
    readonly VALIDATION_RULES_NOT_LOADED: "VALIDATION_RULES_NOT_LOADED";
    readonly INVALID_CONFIGURATION: "INVALID_CONFIGURATION";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
/**
 * Structured error information
 */
export interface ErrorInfo {
    code: ErrorCode;
    message: string;
    location?: SourceLocation;
    severity: ErrorSeverity;
    category: ErrorCategory;
    metadata?: Record<string, unknown>;
    suggestion?: string;
    documentation?: string;
}
/**
 * Error recovery information
 */
export interface RecoveryInfo {
    canRecover: boolean;
    strategy?: RecoveryStrategy;
    tokensSkipped?: number;
    partialResult?: unknown;
}
/**
 * Error recovery strategies
 */
export declare const RECOVERY_STRATEGIES: {
    readonly SKIP_TOKEN: "skip_token";
    readonly SKIP_TO_SEMICOLON: "skip_to_semicolon";
    readonly SKIP_TO_NEWLINE: "skip_to_newline";
    readonly SKIP_TO_CLOSING_PAREN: "skip_to_closing_paren";
    readonly INSERT_MISSING_TOKEN: "insert_missing_token";
    readonly CONTINUE_PARSING: "continue_parsing";
};
export type RecoveryStrategy = typeof RECOVERY_STRATEGIES[keyof typeof RECOVERY_STRATEGIES];
/**
 * Create a success result
 */
export declare function success<T>(data: T): Result<T, never>;
/**
 * Create an error result
 */
export declare function error<E>(error: E): Result<never, E>;
/**
 * Type guard for success results
 */
export declare function isSuccess<T, E>(result: Result<T, E>): result is {
    success: true;
    data: T;
};
/**
 * Type guard for error results
 */
export declare function isError<T, E>(result: Result<T, E>): result is {
    success: false;
    error: E;
};
/**
 * Options for creating errors
 */
interface CreateErrorOptions {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    metadata?: Record<string, unknown>;
    suggestion?: string;
    documentation?: string;
}
/**
 * Create structured error information
 */
export declare function createError(code: ErrorCode, message: string, location?: SourceLocation, options?: CreateErrorOptions): ErrorInfo;
/**
 * Create a lexical error
 */
export declare function createLexicalError(message: string, location: SourceLocation, suggestion?: string): ErrorInfo;
/**
 * Create a syntax error
 */
export declare function createSyntaxError(expected: string, actual: string, location: SourceLocation): ErrorInfo;
/**
 * Create a validation error
 */
export declare function createValidationError(code: ErrorCode, message: string, location: SourceLocation, metadata?: Record<string, unknown>): ErrorInfo;
/**
 * Create SHORT_TITLE_TOO_LONG error specifically
 */
export declare function createShortTitleError(actualTitle: string, actualLength: number, maxLength: number, location: SourceLocation): ErrorInfo;
/**
 * Error summary interface
 */
interface ErrorSummary {
    totalErrors: number;
    totalWarnings: number;
    criticalErrors: number;
    recoveryAttempts: number;
    categories: Record<string, number>;
}
/**
 * Error collector for gathering multiple errors during parsing
 */
export declare class ErrorCollector {
    private errors;
    private warnings;
    private recoveryAttempts;
    private readonly maxRecoveryAttempts;
    /**
     * Add an error to the collection
     */
    addError(error: ErrorInfo): void;
    /**
     * Add a recovery attempt
     */
    addRecovery(_strategy: RecoveryStrategy, location: SourceLocation): boolean;
    /**
     * Check if there are any critical errors
     */
    hasCriticalErrors(): boolean;
    /**
     * Get error summary
     */
    getSummary(): ErrorSummary;
    /**
     * Get error breakdown by category
     */
    private getCategorySummary;
    /**
     * Clear all errors and warnings
     */
    clear(): void;
    /**
     * Get all errors
     */
    getErrors(): readonly ErrorInfo[];
    /**
     * Get all warnings
     */
    getWarnings(): readonly ErrorInfo[];
}
/**
 * Context for error handling
 */
interface ErrorContext {
    location?: SourceLocation;
    [key: string]: unknown;
}
/**
 * Graceful error handler for catching and wrapping exceptions
 */
export declare function tryParse<T>(fn: () => T, context?: ErrorContext): Result<T, ErrorInfo>;
/**
 * Async version of tryParse
 */
export declare function tryParseAsync<T>(fn: () => Promise<T>, context?: ErrorContext): Promise<Result<T, ErrorInfo>>;
/**
 * Combine multiple results, collecting errors
 */
export declare function combineResults<T>(results: Result<T, ErrorInfo>[]): Result<T[], ErrorInfo[]>;
export declare const globalErrorCollector: ErrorCollector;
export {};
