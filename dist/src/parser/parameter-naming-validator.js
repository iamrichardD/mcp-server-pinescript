/**
 * Pine Script Parameter Naming Convention Validation System
 *
 * This module provides comprehensive validation for parameter naming conventions
 * across ALL Pine Script functions, replacing the limited table.cell textColor
 * validation with a robust, extensible system.
 *
 * Core Functionality:
 * - Detects function calls with named parameters using `paramName = value` pattern
 * - Validates parameter naming conventions against Pine Script standards
 * - Supports both deprecated parameter detection and general naming convention enforcement
 * - Works with any built-in function call, not just specific cases
 *
 * Naming Convention Rules:
 * 1. Pine Script built-ins use mixed conventions:
 *    - Single words: linewidth, defval, bgcolor
 *    - Snake_case: text_color, text_size, border_width, oca_name
 *    - Hidden params: minval, maxval, step (not in formal signatures)
 *
 * 2. User variables follow camelCase (per style guide)
 * 3. Function parameters should match the built-in function's expected naming
 *
 * Performance Target: <2ms validation time for 100+ function calls
 */

import { createValidationError, ERROR_CATEGORIES, ERROR_CODES } from './error-handler.js';

/**
 * Core class for parameter naming convention validation
 */
// Pre-compiled regex patterns for optimal performance
const COMPILED_PATTERNS = {
  FUNCTION_NAME: /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s*\(/g,
  PARAMETER_NAME: /[a-zA-Z0-9_]/,
  WHITESPACE: /[\s,]/,
  QUOTE_CHARS: /['"]/,
};

export class ParameterNamingValidator {
  constructor() {
    // Known Pine Script parameter naming patterns
    this.parameterPatterns = {
      // Common single-word parameters (correct)
      singleWord: new Set([
        'defval',
        'title',
        'tooltip',
        'inline',
        'group',
        'confirm',
        'display',
        'active',
        'series',
        'color',
        'style',
        'offset',
        'precision',
        'format',
        'join',
        'linewidth',
        'trackprice',
        'histbase',
        'editable',
        'overlay',
        'bgcolor',
        'width',
        'height',
        'source',
        'length',
        'when',
        'comment',
        'id',
        'direction',
        'qty',
        'limit',
        'stop',
        'xloc',
        'yloc',
        'size',
        'columns',
        'rows',
        'position',
      ]),

      // Common snake_case parameters (correct)
      snakeCase: new Set([
        'text_color',
        'text_size',
        'text_halign',
        'text_valign',
        'text_wrap',
        'text_font_family',
        'text_formatting',
        'table_id',
        'column',
        'row',
        'border_color',
        'border_width',
        'border_style',
        'oca_name',
        'alert_message',
        'show_last',
        'force_overlay',
        'max_bars_back',
        'max_lines_count',
        'max_labels_count',
        'max_boxes_count',
      ]),

      // Hidden/optional parameters (not in formal signatures but valid)
      hiddenParams: new Set(['minval', 'maxval', 'step', 'options']),
    };

    // Known deprecated parameter migrations (v5 -> v6)
    this.deprecatedMigrations = {
      'table.cell': {
        textColor: 'text_color',
        textSize: 'text_size',
        textHalign: 'text_halign',
        textValign: 'text_valign',
      },
      'box.new': {
        textColor: 'text_color',
        textSize: 'text_size',
        textHalign: 'text_halign',
        textValign: 'text_valign',
      },
      'label.new': {
        textColor: 'text_color',
        textSize: 'text_size',
      },
    };
  }

  /**
   * Main validation entry point
   * @param {string} source - Pine Script source code
   * @returns {Object} Validation result with violations and performance metrics
   */
  async validateParameterNaming(source) {
    const startTime = performance.now();
    const violations = [];

    try {
      // Extract all function calls with named parameters
      const functionCalls = this.extractFunctionCalls(source);

      // Validate each function call
      for (const call of functionCalls) {
        const callViolations = this.validateFunctionCall(call);
        violations.push(...callViolations);
      }

      return {
        isValid: violations.length === 0,
        violations,
        metrics: {
          validationTimeMs: performance.now() - startTime,
          functionsAnalyzed: functionCalls.length,
          violationsFound: violations.length,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        violations: [
          {
            severity: 'error',
            message: `Parameter naming validation failed: ${error.message}`,
            category: 'validation_error',
            line: 1,
            column: 1,
          },
        ],
        metrics: {
          validationTimeMs: performance.now() - startTime,
          functionsAnalyzed: 0,
          violationsFound: 1,
        },
      };
    }
  }

  /**
   * Extract all function calls with named parameters from source code
   * @param {string} source - Pine Script source code
   * @returns {Array} Array of function call objects
   */
  extractFunctionCalls(source) {
    const functionCalls = [];

    // Use pre-compiled regex pattern for maximum performance
    const functionNameRegex = COMPILED_PATTERNS.FUNCTION_NAME;

    let match;
    while ((match = functionNameRegex.exec(source)) !== null) {
      const fullFunctionName = match[1];
      const parenStart = match.index + match[0].length - 1; // Position of opening (

      // Find the matching closing parenthesis
      let parenCount = 1;
      let i = parenStart + 1;
      let inString = false;
      let stringChar = null;

      while (i < source.length && parenCount > 0) {
        const char = source[i];

        if (!inString) {
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
          } else if (char === '(') {
            parenCount++;
          } else if (char === ')') {
            parenCount--;
          }
        } else {
          if (char === stringChar && source[i - 1] !== '\\') {
            inString = false;
            stringChar = null;
          }
        }

        i++;
      }

      if (parenCount === 0) {
        // Optimized parameter extraction with minimal string operations
        const namedParameters = this.extractNamedParametersInPlace(source, parenStart + 1, i - 1);

        if (namedParameters.length > 0) {
          // Calculate line and column for error reporting
          const beforeMatch = source.substring(0, match.index);
          const line = beforeMatch.split('\n').length;
          const lastNewline = beforeMatch.lastIndexOf('\n');
          const column = match.index - lastNewline;

          // Extract namespace and function name
          const parts = fullFunctionName.split('.');
          const namespace = parts.length > 1 ? parts[0] + '.' : null;
          const functionName = parts.length > 1 ? parts[1] : parts[0];

          functionCalls.push({
            fullName: fullFunctionName,
            namespace,
            functionName,
            parameters: namedParameters,
            fullMatch: source.slice(match.index, i), // slice is faster than substring
            line,
            column: Math.max(1, column),
          });
        }
      }
    }

    return functionCalls;
  }

  /**
   * Extract named parameters from parameter string
   * @param {string} paramString - The parameter string from function call
   * @returns {Array} Array of named parameter objects
   */
  extractNamedParameters(paramString) {
    const namedParameters = [];

    // Improved regex to handle nested function calls and complex values
    // This approach manually parses to handle parentheses nesting properly
    let i = 0;
    while (i < paramString.length) {
      // Skip whitespace and commas
      while (i < paramString.length && /[\s,]/.test(paramString[i])) {
        i++;
      }

      if (i >= paramString.length) break;

      // Look for parameter name followed by =
      const paramStart = i;
      while (i < paramString.length && /[a-zA-Z0-9_]/.test(paramString[i])) {
        i++;
      }

      if (i >= paramString.length) break;

      // Skip whitespace
      while (i < paramString.length && /\s/.test(paramString[i])) {
        i++;
      }

      // Check if we have an = sign (named parameter)
      if (i < paramString.length && paramString[i] === '=') {
        const paramName = paramString
          .substring(paramStart, i - (paramString[i - 1] === ' ' ? 1 : 0))
          .trim();
        i++; // skip =

        // Skip whitespace after =
        while (i < paramString.length && /\s/.test(paramString[i])) {
          i++;
        }

        // Extract parameter value, handling nested parentheses
        const valueStart = i;
        let parenCount = 0;
        let inString = false;
        let stringChar = null;

        while (i < paramString.length) {
          const char = paramString[i];

          if (!inString) {
            if (COMPILED_PATTERNS.QUOTE_CHARS.test(char)) {
              inString = true;
              stringChar = char;
            } else if (char === '(') {
              parenCount++;
            } else if (char === ')') {
              parenCount--;
            } else if (char === ',' && parenCount === 0) {
              break; // End of this parameter
            }
          } else {
            if (char === stringChar && paramString[i - 1] !== '\\') {
              inString = false;
              stringChar = null;
            }
          }

          i++;
        }

        const paramValue = paramString.substring(valueStart, i).trim();

        namedParameters.push({
          name: paramName,
          value: paramValue,
          originalMatch: `${paramName} = ${paramValue}`,
        });
      } else {
        // Skip this positional parameter
        let parenCount = 0;
        let inString = false;
        let stringChar = null;

        while (i < paramString.length) {
          const char = paramString[i];

          if (!inString) {
            if (COMPILED_PATTERNS.QUOTE_CHARS.test(char)) {
              inString = true;
              stringChar = char;
            } else if (char === '(') {
              parenCount++;
            } else if (char === ')') {
              parenCount--;
            } else if (char === ',' && parenCount === 0) {
              i++; // skip comma
              break; // End of this parameter
            }
          } else {
            if (char === stringChar && paramString[i - 1] !== '\\') {
              inString = false;
              stringChar = null;
            }
          }

          i++;
        }
      }
    }

    return namedParameters;
  }

  /**
   * Optimized in-place parameter extraction to avoid substring operations
   * @param {string} source - The full source string
   * @param {number} startIndex - Start index of parameters
   * @param {number} endIndex - End index of parameters
   * @returns {Array} Array of named parameter objects
   */
  extractNamedParametersInPlace(source, startIndex, endIndex) {
    const namedParameters = [];

    let i = startIndex;
    while (i < endIndex) {
      // Skip whitespace and commas using pre-compiled pattern
      while (i < endIndex && COMPILED_PATTERNS.WHITESPACE.test(source[i])) {
        i++;
      }

      if (i >= endIndex) break;

      // Look for parameter name followed by = using pre-compiled pattern
      const paramStart = i;
      while (i < endIndex && COMPILED_PATTERNS.PARAMETER_NAME.test(source[i])) {
        i++;
      }

      if (i >= endIndex) break;

      // Skip whitespace after parameter name
      while (i < endIndex && /\s/.test(source[i])) {
        i++;
      }

      if (i < endIndex && source[i] === '=') {
        // Named parameter found
        const paramName = source.slice(paramStart, i).trim();
        i++; // skip =

        // Skip whitespace after =
        while (i < endIndex && /\s/.test(source[i])) {
          i++;
        }

        const valueStart = i;
        let parenCount = 0;
        let inString = false;
        let stringChar = null;

        // Find end of parameter value
        while (i < endIndex) {
          const char = source[i];

          if (!inString) {
            if (COMPILED_PATTERNS.QUOTE_CHARS.test(char)) {
              inString = true;
              stringChar = char;
            } else if (char === '(') {
              parenCount++;
            } else if (char === ')') {
              parenCount--;
            } else if (char === ',' && parenCount === 0) {
              break; // End of this parameter
            }
          } else {
            if (char === stringChar && (i === 0 || source[i - 1] !== '\\')) {
              inString = false;
              stringChar = null;
            }
          }

          i++;
        }

        const paramValue = source.slice(valueStart, i).trim();

        namedParameters.push({
          name: paramName,
          value: paramValue,
          originalMatch: `${paramName} = ${paramValue}`,
        });
      } else {
        // Skip positional parameter
        let parenCount = 0;
        let inString = false;
        let stringChar = null;

        while (i < endIndex) {
          const char = source[i];

          if (!inString) {
            if (COMPILED_PATTERNS.QUOTE_CHARS.test(char)) {
              inString = true;
              stringChar = char;
            } else if (char === '(') {
              parenCount++;
            } else if (char === ')') {
              parenCount--;
            } else if (char === ',' && parenCount === 0) {
              i++; // skip comma
              break;
            }
          } else {
            if (char === stringChar && (i === 0 || source[i - 1] !== '\\')) {
              inString = false;
              stringChar = null;
            }
          }

          i++;
        }
      }
    }

    return namedParameters;
  }

  /**
   * Validate a single function call for parameter naming violations
   * @param {Object} functionCall - Function call object
   * @returns {Array} Array of violation objects
   */
  validateFunctionCall(functionCall) {
    const violations = [];
    const { fullName, parameters, line, column } = functionCall;

    for (const param of parameters) {
      const { name: paramName } = param;

      // Check for deprecated parameter migrations first (highest priority)
      const deprecationViolation = this.checkDeprecatedParameter(fullName, paramName, line, column);
      if (deprecationViolation) {
        violations.push(deprecationViolation);
        continue; // Skip other checks for deprecated parameters
      }

      // Check parameter naming convention
      const namingViolation = this.checkParameterNamingConvention(
        fullName,
        paramName,
        line,
        column
      );
      if (namingViolation) {
        violations.push(namingViolation);
      }
    }

    return violations;
  }

  /**
   * Check if parameter is deprecated and needs migration
   * @param {string} functionName - Full function name
   * @param {string} paramName - Parameter name
   * @param {number} line - Line number
   * @param {number} column - Column number
   * @returns {Object|null} Violation object or null
   */
  checkDeprecatedParameter(functionName, paramName, line, column) {
    const migrations = this.deprecatedMigrations[functionName];
    if (!migrations || !migrations[paramName]) {
      return null;
    }

    const correctParam = migrations[paramName];

    return {
      errorCode: 'DEPRECATED_PARAMETER_NAME',
      severity: 'error',
      category: 'parameter_validation',
      message: `The "${functionName}" function does not have an argument with the name "${paramName}". Use "${correctParam}" instead.`,
      suggestedFix: `Replace "${paramName}" with "${correctParam}"`,
      line,
      column,
      functionName,
      parameterName: paramName,
      correctParameterName: correctParam,
    };
  }

  /**
   * Check parameter naming convention against Pine Script standards
   * @param {string} functionName - Full function name
   * @param {string} paramName - Parameter name
   * @param {number} line - Line number
   * @param {number} column - Column number
   * @returns {Object|null} Violation object or null
   */
  checkParameterNamingConvention(functionName, paramName, line, column) {
    // Skip validation for known correct parameters
    if (this.isKnownValidParameter(paramName)) {
      return null;
    }

    // Check for parameter naming convention violations
    const namingIssue = this.detectNamingConventionViolation(paramName);
    if (namingIssue) {
      return {
        errorCode: 'INVALID_PARAMETER_NAMING_CONVENTION',
        severity: 'error',
        category: 'parameter_validation',
        message: `Parameter "${paramName}" in "${functionName}" uses ${namingIssue.detected} naming. Pine Script function parameters should use ${namingIssue.expected}.`,
        suggestedFix: `Consider using "${namingIssue.suggestion}" instead of "${paramName}"`,
        line,
        column,
        functionName,
        parameterName: paramName,
        suggestedParameterName: namingIssue.suggestion,
        namingConvention: {
          detected: namingIssue.detected,
          expected: namingIssue.expected,
        },
      };
    }

    return null;
  }

  /**
   * Check if parameter name is in the known valid parameters list
   * @param {string} paramName - Parameter name to check
   * @returns {boolean} True if parameter is known to be valid
   */
  isKnownValidParameter(paramName) {
    return (
      this.parameterPatterns.singleWord.has(paramName) ||
      this.parameterPatterns.snakeCase.has(paramName) ||
      this.parameterPatterns.hiddenParams.has(paramName)
    );
  }

  /**
   * Detect naming convention violations
   * @param {string} paramName - Parameter name to analyze
   * @returns {Object|null} Naming issue details or null
   */
  detectNamingConventionViolation(paramName) {
    // Single character parameters are usually invalid (except 'a', 'x', 'y' etc which should be in singleWord list)
    if (paramName.length === 1) {
      return {
        detected: 'single character',
        expected: 'descriptive parameter name',
        suggestion: paramName + '_value', // generic suggestion
      };
    }

    // Check for camelCase pattern (starts lowercase, contains uppercase)
    if (this.isCamelCase(paramName)) {
      return {
        detected: 'camelCase',
        expected: 'snake_case or single word',
        suggestion: this.convertCamelToSnake(paramName),
      };
    }

    // Check for PascalCase pattern (starts uppercase)
    if (this.isPascalCase(paramName)) {
      return {
        detected: 'PascalCase',
        expected: 'snake_case or single word',
        suggestion: this.convertPascalToSnake(paramName),
      };
    }

    // Check for ALL_CAPS pattern (should be snake_case for parameters)
    if (this.isAllCaps(paramName)) {
      return {
        detected: 'ALL_CAPS',
        expected: 'snake_case or single word',
        suggestion: this.convertAllCapsToSnake(paramName),
      };
    }

    return null;
  }

  /**
   * Check if string follows camelCase pattern
   * @param {string} str - String to check
   * @returns {boolean} True if camelCase
   */
  isCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*[A-Z]/.test(str);
  }

  /**
   * Check if string follows PascalCase pattern
   * @param {string} str - String to check
   * @returns {boolean} True if PascalCase
   */
  isPascalCase(str) {
    return /^[A-Z][a-zA-Z0-9]*/.test(str) && !this.isAllCaps(str);
  }

  /**
   * Check if string is ALL_CAPS
   * @param {string} str - String to check
   * @returns {boolean} True if ALL_CAPS
   */
  isAllCaps(str) {
    return /^[A-Z][A-Z0-9_]*$/.test(str) && str.length > 1;
  }

  /**
   * Convert camelCase to snake_case
   * @param {string} str - camelCase string
   * @returns {string} snake_case string
   */
  convertCamelToSnake(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  /**
   * Convert PascalCase to snake_case
   * @param {string} str - PascalCase string
   * @returns {string} snake_case string
   */
  convertPascalToSnake(str) {
    return (
      str.charAt(0).toLowerCase() +
      str
        .slice(1)
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
    );
  }

  /**
   * Convert ALL_CAPS to snake_case
   * @param {string} str - ALL_CAPS string
   * @returns {string} snake_case string
   */
  convertAllCapsToSnake(str) {
    return str.toLowerCase();
  }
}

/**
 * Quick validation wrapper for integration with existing validation pipeline
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Quick validation result
 */
export async function quickValidateParameterNaming(source) {
  const validator = new ParameterNamingValidator();
  return validator.validateParameterNaming(source);
}

/**
 * Enhanced validation for specific error codes (legacy compatibility)
 * @param {string} source - Pine Script source code
 * @param {string} errorCode - Specific error code to check
 * @returns {Promise<Object>} Validation result
 */
export async function validateSpecificParameterError(source, errorCode) {
  const validator = new ParameterNamingValidator();
  const result = await validator.validateParameterNaming(source);

  // Filter violations by specific error code
  const filteredViolations = result.violations.filter((v) => v.errorCode === errorCode);

  return {
    ...result,
    violations: filteredViolations,
    isValid: filteredViolations.length === 0,
  };
}

// Export the validator class and utility functions
// Note: ParameterNamingValidator is already exported in the class definition above
