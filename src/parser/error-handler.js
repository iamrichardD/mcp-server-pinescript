/**
 * Error Handling Patterns for Pine Script Parser
 *
 * TypeScript-ready error handling with result patterns and type safety.
 * Designed for graceful error recovery and detailed error reporting.
 *
 * These patterns will transition smoothly to TypeScript with proper
 * discriminated unions and type guards.
 */

import { createSourceLocation } from "./ast-types.js";

/**
 * Result pattern for type-safe error handling
 * This will become a proper TypeScript discriminated union
 *
 * @template T, E
 * @typedef {Object} Result
 * @property {boolean} success - Whether operation succeeded
 * @property {T} [data] - Success data (when success is true)
 * @property {E} [error] - Error data (when success is false)
 */

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

/**
 * Error categories for classification
 */
export const ERROR_CATEGORIES = {
  LEXICAL: "lexical_error",
  SYNTAX: "syntax_error",
  SEMANTIC: "semantic_error",
  VALIDATION: "validation_error",
  PERFORMANCE: "performance_error",
  INTEGRATION: "integration_error",
};

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  // Lexical errors
  INVALID_TOKEN: "INVALID_TOKEN",
  UNTERMINATED_STRING: "UNTERMINATED_STRING",
  INVALID_NUMBER: "INVALID_NUMBER",

  // Syntax errors
  UNEXPECTED_TOKEN: "UNEXPECTED_TOKEN",
  EXPECTED_TOKEN: "EXPECTED_TOKEN",
  MISSING_CLOSING_PAREN: "MISSING_CLOSING_PAREN",
  INVALID_FUNCTION_CALL: "INVALID_FUNCTION_CALL",

  // Semantic errors
  UNDEFINED_FUNCTION: "UNDEFINED_FUNCTION",
  INVALID_PARAMETER_COUNT: "INVALID_PARAMETER_COUNT",
  TYPE_MISMATCH: "TYPE_MISMATCH",

  // Validation errors
  SHORT_TITLE_TOO_LONG: "SHORT_TITLE_TOO_LONG",
  PARAMETER_OUT_OF_RANGE: "PARAMETER_OUT_OF_RANGE",
  REQUIRED_PARAMETER_MISSING: "REQUIRED_PARAMETER_MISSING",

  // Performance errors
  PARSE_TIMEOUT: "PARSE_TIMEOUT",
  MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED",

  // Integration errors
  VALIDATION_RULES_NOT_LOADED: "VALIDATION_RULES_NOT_LOADED",
  INVALID_CONFIGURATION: "INVALID_CONFIGURATION",
};

/**
 * Structured error information
 * @typedef {Object} ErrorInfo
 * @property {string} code - Error code from ERROR_CODES
 * @property {string} message - Human-readable error message
 * @property {import('./ast-types.js').SourceLocation} [location] - Source location where error occurred
 * @property {string} severity - Error severity from ERROR_SEVERITY
 * @property {string} category - Error category from ERROR_CATEGORIES
 * @property {Object} [metadata] - Additional error context
 * @property {string} [suggestion] - Suggested fix for the error
 * @property {string} [documentation] - Link to relevant documentation
 */

/**
 * Error recovery information
 * @typedef {Object} RecoveryInfo
 * @property {boolean} canRecover - Whether error recovery is possible
 * @property {string} [strategy] - Recovery strategy used
 * @property {number} [tokensSkipped] - Number of tokens skipped for recovery
 * @property {Object} [partialResult] - Partial parsing result if available
 */

/**
 * Create a success result
 * @template T
 * @param {T} data - Success data
 * @returns {Result<T, never>} - Success result
 */
export function success(data) {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error result
 * @template E
 * @param {E} error - Error data
 * @returns {Result<never, E>} - Error result
 */
export function error(error) {
  return {
    success: false,
    error,
  };
}

/**
 * Type guard for success results
 * @template T, E
 * @param {Result<T, E>} result - Result to check
 * @returns {result is {success: true, data: T}} - Type predicate
 */
export function isSuccess(result) {
  return Boolean(result && result.success === true);
}

/**
 * Type guard for error results
 * @template T, E
 * @param {Result<T, E>} result - Result to check
 * @returns {result is {success: false, error: E}} - Type predicate
 */
export function isError(result) {
  return Boolean(result && result.success === false);
}

/**
 * Create structured error information
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {import('./ast-types.js').SourceLocation} [location] - Source location
 * @param {Object} [options] - Additional options
 * @param {string} [options.severity] - Error severity
 * @param {string} [options.category] - Error category
 * @param {Object} [options.metadata] - Additional metadata
 * @param {string} [options.suggestion] - Suggested fix
 * @returns {ErrorInfo} - Structured error information
 */
export function createError(code, message, location, options = {}) {
  // Determine default category based on error code if not provided
  let defaultCategory = ERROR_CATEGORIES.SYNTAX;
  
  if (options.category) {
    defaultCategory = options.category;
  } else {
    // Map error codes to appropriate categories
    switch (code) {
      // Lexical errors
      case ERROR_CODES.INVALID_TOKEN:
      case ERROR_CODES.UNTERMINATED_STRING:
      case ERROR_CODES.INVALID_NUMBER:
        defaultCategory = ERROR_CATEGORIES.LEXICAL;
        break;
        
      // Semantic errors
      case ERROR_CODES.UNDEFINED_FUNCTION:
      case ERROR_CODES.INVALID_PARAMETER_COUNT:
      case ERROR_CODES.TYPE_MISMATCH:
        defaultCategory = ERROR_CATEGORIES.SEMANTIC;
        break;
        
      // Validation errors
      case ERROR_CODES.SHORT_TITLE_TOO_LONG:
      case ERROR_CODES.PARAMETER_OUT_OF_RANGE:
      case ERROR_CODES.REQUIRED_PARAMETER_MISSING:
        defaultCategory = ERROR_CATEGORIES.VALIDATION;
        break;
        
      // Performance errors
      case ERROR_CODES.PARSE_TIMEOUT:
      case ERROR_CODES.MEMORY_LIMIT_EXCEEDED:
        defaultCategory = ERROR_CATEGORIES.PERFORMANCE;
        break;
        
      // Integration errors
      case ERROR_CODES.VALIDATION_RULES_NOT_LOADED:
      case ERROR_CODES.INVALID_CONFIGURATION:
        defaultCategory = ERROR_CATEGORIES.INTEGRATION;
        break;
        
      // Default to syntax for unknown codes
      default:
        defaultCategory = ERROR_CATEGORIES.SYNTAX;
        break;
    }
  }

  return {
    code,
    message,
    location,
    severity: options.severity || ERROR_SEVERITY.ERROR,
    category: defaultCategory,
    metadata: options.metadata,
    suggestion: options.suggestion,
    documentation: options.documentation,
  };
}

/**
 * Create a lexical error
 * @param {string} message - Error message
 * @param {import('./ast-types.js').SourceLocation} location - Source location
 * @param {string} [suggestion] - Suggested fix
 * @returns {ErrorInfo} - Lexical error
 */
export function createLexicalError(message, location, suggestion) {
  return createError(ERROR_CODES.INVALID_TOKEN, message, location, {
    category: ERROR_CATEGORIES.LEXICAL,
    suggestion,
  });
}

/**
 * Create a syntax error
 * @param {string} expected - What was expected
 * @param {string} actual - What was actually found
 * @param {import('./ast-types.js').SourceLocation} location - Source location
 * @returns {ErrorInfo} - Syntax error
 */
export function createSyntaxError(expected, actual, location) {
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
 * @param {string} code - Validation error code
 * @param {string} message - Error message
 * @param {import('./ast-types.js').SourceLocation} location - Source location
 * @param {Object} [metadata] - Additional validation context
 * @returns {ErrorInfo} - Validation error
 */
export function createValidationError(code, message, location, metadata) {
  return createError(code, message, location, {
    category: ERROR_CATEGORIES.VALIDATION,
    metadata,
  });
}

/**
 * Create SHORT_TITLE_TOO_LONG error specifically
 * @param {string} actualTitle - The actual title that's too long
 * @param {number} actualLength - Actual title length
 * @param {number} maxLength - Maximum allowed length
 * @param {import('./ast-types.js').SourceLocation} location - Source location
 * @returns {ErrorInfo} - Short title error
 */
export function createShortTitleError(actualTitle, actualLength, maxLength, location) {
  return createValidationError(
    ERROR_CODES.SHORT_TITLE_TOO_LONG,
    `The shorttitle is too long (${actualLength} characters). It should be ${maxLength} characters or less.(SHORT_TITLE_TOO_LONG)`,
    location,
    {
      actualTitle,
      actualLength,
      maxLength,
      functionType: "indicator/strategy",
    }
  );
}

/**
 * Error recovery strategies
 */
export const RECOVERY_STRATEGIES = {
  SKIP_TOKEN: "skip_token",
  SKIP_TO_SEMICOLON: "skip_to_semicolon",
  SKIP_TO_NEWLINE: "skip_to_newline",
  SKIP_TO_CLOSING_PAREN: "skip_to_closing_paren",
  INSERT_MISSING_TOKEN: "insert_missing_token",
  CONTINUE_PARSING: "continue_parsing",
};

/**
 * Error collector for gathering multiple errors during parsing
 */
export class ErrorCollector {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 10;
  }

  /**
   * Add an error to the collection
   * @param {ErrorInfo} error - Error to add
   */
  addError(error) {
    if (error.severity === ERROR_SEVERITY.WARNING) {
      this.warnings.push(error);
    } else {
      this.errors.push(error);
    }
  }

  /**
   * Add a recovery attempt
   * @param {string} strategy - Recovery strategy used
   * @param {import('./ast-types.js').SourceLocation} location - Location of recovery
   */
  addRecovery(strategy, location) {
    this.recoveryAttempts++;

    if (this.recoveryAttempts > this.maxRecoveryAttempts) {
      this.addError(
        createError(
          ERROR_CODES.PARSE_TIMEOUT,
          "Too many parse errors, stopping recovery attempts",
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
   * @returns {boolean} - Whether there are critical errors
   */
  hasCriticalErrors() {
    return this.errors.some((error) => error.severity === ERROR_SEVERITY.CRITICAL);
  }

  /**
   * Get error summary
   * @returns {Object} - Error summary
   */
  getSummary() {
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
   * @returns {Object} - Category summary
   */
  getCategorySummary() {
    const categories = {};

    for (const error of this.errors) {
      categories[error.category] = (categories[error.category] || 0) + 1;
    }

    return categories;
  }

  /**
   * Get all errors
   * @returns {ErrorInfo[]} - Array of errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get all warnings
   * @returns {ErrorInfo[]} - Array of warnings
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Clear all errors and warnings
   */
  clear() {
    this.errors = [];
    this.warnings = [];
    this.recoveryAttempts = 0;
  }
}

/**
 * Graceful error handler for catching and wrapping exceptions
 * @param {Function} fn - Function to execute
 * @param {Object} [context] - Error context
 * @returns {Result} - Result with caught errors
 */
export function tryParse(fn, context = {}) {
  try {
    const result = fn();
    return success(result);
  } catch (err) {
    // Handle different types of thrown values
    let message, originalError;
    if (typeof err === 'string') {
      message = err;
      originalError = 'String';
    } else if (err instanceof Error) {
      message = err.message;
      originalError = err.name;
    } else {
      message = String(err);
      originalError = typeof err;
    }

    const errorInfo = createError(
      ERROR_CODES.UNEXPECTED_TOKEN,
      message,
      context.location || createSourceLocation(0, 0, 0, 0),
      {
        category: ERROR_CATEGORIES.SYNTAX,
        metadata: { originalError, context },
      }
    );

    return error(errorInfo);
  }
}

/**
 * Async version of tryParse
 * @param {Function} fn - Async function to execute
 * @param {Object} [context] - Error context
 * @returns {Promise<Result>} - Result with caught errors
 */
export async function tryParseAsync(fn, context = {}) {
  try {
    const result = await fn();
    return success(result);
  } catch (err) {
    // Handle different types of thrown values
    let message, originalError;
    if (typeof err === 'string') {
      message = err;
      originalError = 'String';
    } else if (err instanceof Error) {
      message = err.message;
      originalError = err.name;
    } else {
      message = String(err);
      originalError = typeof err;
    }

    const errorInfo = createError(
      ERROR_CODES.UNEXPECTED_TOKEN,
      message,
      context.location || createSourceLocation(0, 0, 0, 0),
      {
        category: ERROR_CATEGORIES.SYNTAX,
        metadata: { originalError, context },
      }
    );

    return error(errorInfo);
  }
}

/**
 * Combine multiple results, collecting errors
 * @template T
 * @param {Result<T, ErrorInfo>[]} results - Array of results
 * @returns {Result<T[], ErrorInfo[]>} - Combined result
 */
export function combineResults(results) {
  const successResults = [];
  const errors = [];

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
