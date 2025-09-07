/**
 * Error Handling Patterns for Pine Script Parser
 *
 * TypeScript implementation with discriminated unions and type safety.
 * Designed for graceful error recovery and detailed error reporting.
 */

import { createSourceLocation } from './ast-types.js';
import type { SourceLocation } from './types.js';

/**
 * Result pattern for type-safe error handling
 * Discriminated union with proper type guards
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY];

/**
 * Error categories for classification
 */
export const ERROR_CATEGORIES = {
  LEXICAL: 'lexical_error',
  SYNTAX: 'syntax_error',
  SEMANTIC: 'semantic_error',
  VALIDATION: 'validation_error',
  PERFORMANCE: 'performance_error',
  INTEGRATION: 'integration_error',
} as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  // Lexical errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  UNTERMINATED_STRING: 'UNTERMINATED_STRING',
  INVALID_NUMBER: 'INVALID_NUMBER',

  // Syntax errors
  UNEXPECTED_TOKEN: 'UNEXPECTED_TOKEN',
  EXPECTED_TOKEN: 'EXPECTED_TOKEN',
  MISSING_CLOSING_PAREN: 'MISSING_CLOSING_PAREN',
  INVALID_FUNCTION_CALL: 'INVALID_FUNCTION_CALL',

  // Semantic errors
  UNDEFINED_FUNCTION: 'UNDEFINED_FUNCTION',
  INVALID_PARAMETER_COUNT: 'INVALID_PARAMETER_COUNT',
  TYPE_MISMATCH: 'TYPE_MISMATCH',

  // Validation errors
  SHORT_TITLE_TOO_LONG: 'SHORT_TITLE_TOO_LONG',
  PARAMETER_OUT_OF_RANGE: 'PARAMETER_OUT_OF_RANGE',
  REQUIRED_PARAMETER_MISSING: 'REQUIRED_PARAMETER_MISSING',

  // Performance errors
  PARSE_TIMEOUT: 'PARSE_TIMEOUT',
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',

  // Integration errors
  VALIDATION_RULES_NOT_LOADED: 'VALIDATION_RULES_NOT_LOADED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

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
export const RECOVERY_STRATEGIES = {
  SKIP_TOKEN: 'skip_token',
  SKIP_TO_SEMICOLON: 'skip_to_semicolon',
  SKIP_TO_NEWLINE: 'skip_to_newline',
  SKIP_TO_CLOSING_PAREN: 'skip_to_closing_paren',
  INSERT_MISSING_TOKEN: 'insert_missing_token',
  CONTINUE_PARSING: 'continue_parsing',
} as const;

export type RecoveryStrategy = (typeof RECOVERY_STRATEGIES)[keyof typeof RECOVERY_STRATEGIES];

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T, never> {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error result
 */
export function error<E>(error: E): Result<never, E> {
  return {
    success: false,
    error,
  };
}

/**
 * Type guard for success results
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard for error results
 */
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

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
export function createError(
  code: ErrorCode,
  message: string,
  location?: SourceLocation,
  options: CreateErrorOptions = {}
): ErrorInfo {
  const errorInfo: ErrorInfo = {
    code,
    message,
    severity: options.severity || ERROR_SEVERITY.ERROR,
    category: options.category || ERROR_CATEGORIES.SYNTAX,
  };

  if (location !== undefined) {
    errorInfo.location = location;
  }
  if (options.metadata !== undefined) {
    errorInfo.metadata = options.metadata;
  }
  if (options.suggestion !== undefined) {
    errorInfo.suggestion = options.suggestion;
  }
  if (options.documentation !== undefined) {
    errorInfo.documentation = options.documentation;
  }

  return errorInfo;
}

/**
 * Create a lexical error
 */
export function createLexicalError(
  message: string,
  location: SourceLocation,
  suggestion?: string
): ErrorInfo {
  return createError(ERROR_CODES.INVALID_TOKEN, message, location, {
    category: ERROR_CATEGORIES.LEXICAL,
    ...(suggestion !== undefined && { suggestion }),
  });
}

/**
 * Create a syntax error
 */
export function createSyntaxError(
  expected: string,
  actual: string,
  location: SourceLocation
): ErrorInfo {
  return createError(
    ERROR_CODES.EXPECTED_TOKEN,
    `Expected ${expected}, but found ${actual}`,
    location,
    {
      category: ERROR_CATEGORIES.SYNTAX,
      metadata: { expected, actual },
      suggestion: `Replace '${actual}' with '${expected}'`,
    }
  );
}

/**
 * Create a validation error
 */
export function createValidationError(
  code: ErrorCode,
  message: string,
  location: SourceLocation,
  metadata?: Record<string, unknown>
): ErrorInfo {
  return createError(code, message, location, {
    category: ERROR_CATEGORIES.VALIDATION,
    ...(metadata !== undefined && { metadata }),
  });
}

/**
 * Create SHORT_TITLE_TOO_LONG error specifically
 */
export function createShortTitleError(
  actualTitle: string,
  actualLength: number,
  maxLength: number,
  location: SourceLocation
): ErrorInfo {
  return createValidationError(
    ERROR_CODES.SHORT_TITLE_TOO_LONG,
    `The shorttitle is too long (${actualLength} characters). It should be ${maxLength} characters or less.(SHORT_TITLE_TOO_LONG)`,
    location,
    {
      actualTitle,
      actualLength,
      maxLength,
      functionType: 'indicator/strategy',
    }
  );
}

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
export class ErrorCollector {
  private errors: ErrorInfo[] = [];
  private warnings: ErrorInfo[] = [];
  private recoveryAttempts = 0;
  private readonly maxRecoveryAttempts = 10;

  /**
   * Add an error to the collection
   */
  addError(error: ErrorInfo): void {
    if (error.severity === ERROR_SEVERITY.WARNING) {
      this.warnings.push(error);
    } else {
      this.errors.push(error);
    }
  }

  /**
   * Add a recovery attempt
   */
  addRecovery(_strategy: RecoveryStrategy, location: SourceLocation): boolean {
    this.recoveryAttempts++;

    if (this.recoveryAttempts > this.maxRecoveryAttempts) {
      this.addError(
        createError(
          ERROR_CODES.PARSE_TIMEOUT,
          'Too many parse errors, stopping recovery attempts',
          location,
          {
            severity: ERROR_SEVERITY.CRITICAL,
            category: ERROR_CATEGORIES.PERFORMANCE,
            metadata: { recoveryAttempts: this.recoveryAttempts },
          }
        )
      );
      return false;
    }

    return true;
  }

  /**
   * Check if there are any critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some((error) => error.severity === ERROR_SEVERITY.CRITICAL);
  }

  /**
   * Get error summary
   */
  getSummary(): ErrorSummary {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      criticalErrors: this.errors.filter((e) => e.severity === ERROR_SEVERITY.CRITICAL).length,
      recoveryAttempts: this.recoveryAttempts,
      categories: this.getCategorySummary(),
    };
  }

  /**
   * Get error breakdown by category
   */
  private getCategorySummary(): Record<string, number> {
    const categories: Record<string, number> = {};

    for (const error of this.errors) {
      categories[error.category] = (categories[error.category] || 0) + 1;
    }

    return categories;
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
    this.recoveryAttempts = 0;
  }

  /**
   * Get all errors
   */
  getErrors(): readonly ErrorInfo[] {
    return this.errors;
  }

  /**
   * Get all warnings
   */
  getWarnings(): readonly ErrorInfo[] {
    return this.warnings;
  }
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
export function tryParse<T>(fn: () => T, context: ErrorContext = {}): Result<T, ErrorInfo> {
  try {
    const result = fn();
    return success(result);
  } catch (err) {
    const errorInfo = createError(
      ERROR_CODES.UNEXPECTED_TOKEN,
      err instanceof Error ? err.message : String(err),
      context.location || createSourceLocation(0, 0, 0, 0),
      {
        category: ERROR_CATEGORIES.SYNTAX,
        metadata: {
          originalError: err instanceof Error ? err.name : 'Unknown',
          context,
        },
      }
    );

    return error(errorInfo);
  }
}

/**
 * Async version of tryParse
 */
export async function tryParseAsync<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {}
): Promise<Result<T, ErrorInfo>> {
  try {
    const result = await fn();
    return success(result);
  } catch (err) {
    const errorInfo = createError(
      ERROR_CODES.UNEXPECTED_TOKEN,
      err instanceof Error ? err.message : String(err),
      context.location || createSourceLocation(0, 0, 0, 0),
      {
        category: ERROR_CATEGORIES.SYNTAX,
        metadata: {
          originalError: err instanceof Error ? err.name : 'Unknown',
          context,
        },
      }
    );

    return error(errorInfo);
  }
}

/**
 * Combine multiple results, collecting errors
 */
export function combineResults<T>(results: Result<T, ErrorInfo>[]): Result<T[], ErrorInfo[]> {
  const successResults: T[] = [];
  const errors: ErrorInfo[] = [];

  for (const result of results) {
    if (isSuccess(result)) {
      successResults.push(result.data);
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return error(errors);
  }

  return success(successResults);
}

// Export singleton error collector for global error tracking
export const globalErrorCollector = new ErrorCollector();
