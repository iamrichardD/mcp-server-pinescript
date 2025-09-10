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

import { documentationLoader } from './documentation-loader.js';

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
  private parameterPatterns: {
    singleWord: Set<string>;
    snakeCase: Set<string>;
    hiddenParams: Set<string>;
  };

  private deprecatedMigrations: Record<string, Record<string, string>>;

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
   * @param source - Pine Script source code
   * @returns Validation result with violations and performance metrics
   */
  async validateParameterNaming(source: string): Promise<ValidationResult> {
    const startTime = performance.now();
    const violations: ValidationViolation[] = [];

    try {
      // Extract all function calls with named parameters
      const functionCalls = this.extractFunctionCalls(source);

      // Validate each function call
      for (const call of functionCalls) {
        const callViolations = this.validateFunctionCall(call);
        violations.push(...callViolations);
      }

      const elapsedTime = performance.now() - startTime;
      return {
        isValid: violations.length === 0,
        violations,
        metrics: {
          validationTimeMs:
            elapsedTime > 0 ? Math.max(Math.trunc(elapsedTime * 1000) / 1000, 0.001) : 0,
          functionsAnalyzed: functionCalls.length,
          violationsFound: violations.length,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        violations: [
          {
            errorCode: 'VALIDATION_ERROR',
            severity: 'error',
            message: `Parameter naming validation failed: ${error instanceof Error ? error.message : String(error)}`,
            category: 'validation_error',
            suggestedFix: 'Check source code syntax',
            line: 1,
            column: 1,
          },
        ],
        metrics: {
          validationTimeMs: Math.max(
            Math.trunc((performance.now() - startTime) * 1000) / 1000,
            0.001
          ),
          functionsAnalyzed: 0,
          violationsFound: 1,
        },
      };
    }
  }

  /**
   * Extract all function calls with named parameters from source code
   * @param source - Pine Script source code
   * @returns Array of function call objects
   */
  extractFunctionCalls(source: string): FunctionCall[] {
    const functionCalls: FunctionCall[] = [];

    // Use pre-compiled regex pattern for maximum performance
    const functionNameRegex = COMPILED_PATTERNS.FUNCTION_NAME;

    let match: RegExpExecArray | null;
    while ((match = functionNameRegex.exec(source)) !== null) {
      // Type-safe extraction of function name from regex match
      const fullFunctionName = match[1];
      if (!fullFunctionName) {
        continue; // Skip if regex capture group failed
      }
      const parenStart = match.index + match[0].length - 1; // Position of opening (

      // Find the matching closing parenthesis
      let parenCount = 1;
      let i = parenStart + 1;
      let inString = false;
      let stringChar: string | null = null;

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
          if (char === stringChar && source.charAt(i - 1) !== '\\') {
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
          const namespace = parts.length > 1 ? `${parts[0]}.` : null;
          const functionName =
            parts.length > 1 ? parts[1] || fullFunctionName : parts[0] || fullFunctionName;

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
   * Optimized in-place parameter extraction to avoid substring operations
   * @param source - The full source string
   * @param startIndex - Start index of parameters
   * @param endIndex - End index of parameters
   * @returns Array of named parameter objects
   */
  extractNamedParametersInPlace(
    source: string,
    startIndex: number,
    endIndex: number
  ): NamedParameter[] {
    const namedParameters: NamedParameter[] = [];

    let i = startIndex;
    while (i < endIndex) {
      // Skip whitespace and commas using pre-compiled pattern
      while (i < endIndex && COMPILED_PATTERNS.WHITESPACE.test(source.charAt(i))) {
        i++;
      }

      if (i >= endIndex) break;

      // Look for parameter name followed by = using pre-compiled pattern
      const paramStart = i;
      while (i < endIndex && COMPILED_PATTERNS.PARAMETER_NAME.test(source.charAt(i))) {
        i++;
      }

      if (i >= endIndex) break;

      // Skip whitespace after parameter name
      while (i < endIndex && /\s/.test(source.charAt(i))) {
        i++;
      }

      if (i < endIndex && source.charAt(i) === '=') {
        // Named parameter found
        const paramName = source.slice(paramStart, i).trim();
        i++; // skip =

        // Skip whitespace after =
        while (i < endIndex && /\s/.test(source.charAt(i))) {
          i++;
        }

        const valueStart = i;
        let parenCount = 0;
        let inString = false;
        let stringChar: string | null = null;

        // Find end of parameter value
        while (i < endIndex) {
          const char = source.charAt(i);

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
            if (char === stringChar && (i === 0 || source.charAt(i - 1) !== '\\')) {
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
        let stringChar: string | null = null;

        while (i < endIndex) {
          const char = source.charAt(i);

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
            if (char === stringChar && (i === 0 || source.charAt(i - 1) !== '\\')) {
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
   * @param functionCall - Function call object
   * @returns Array of violation objects
   */
  validateFunctionCall(functionCall: FunctionCall): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
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
   * @param functionName - Full function name
   * @param paramName - Parameter name
   * @param line - Line number
   * @param column - Column number
   * @returns Violation object or null
   */
  checkDeprecatedParameter(
    functionName: string,
    paramName: string,
    line: number,
    column: number
  ): ValidationViolation | null {
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
   * @param functionName - Full function name
   * @param paramName - Parameter name
   * @param line - Line number
   * @param column - Column number
   * @returns Violation object or null
   */
  checkParameterNamingConvention(
    functionName: string,
    paramName: string,
    line: number,
    column: number
  ): ValidationViolation | null {
    // Skip validation for known correct parameters (FIXES BUG 2: Built-in parameter false positives)
    if (this.isKnownValidParameter(paramName)) {
      return null;
    }

    // Context-aware validation: Skip built-in function parameters (DOCUMENTATION-BASED)
    // This prevents false positives for required snake_case built-in parameters like text_color
    // Uses FAST synchronous lookup from pre-loaded documentation registry
    if (this.isBuiltInFunctionParameter(functionName, paramName)) {
      return null;
    }

    // Check for parameter naming convention violations (user-defined variables only)
    const namingIssue = this.detectNamingConventionViolation(paramName);
    if (namingIssue) {
      return {
        errorCode: 'INVALID_PARAMETER_NAMING_CONVENTION',
        severity: 'error', // Must be "error" to match test expectations
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
   * @param paramName - Parameter name to check
   * @returns True if parameter is known to be valid
   */
  isKnownValidParameter(paramName: string): boolean {
    return (
      this.parameterPatterns.singleWord.has(paramName) ||
      this.parameterPatterns.snakeCase.has(paramName) ||
      this.parameterPatterns.hiddenParams.has(paramName)
    );
  }

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
  isBuiltInFunctionParameter(functionName: string, paramName: string): boolean {
    // Fast synchronous lookup using pre-loaded documentation (PERFORMANCE OPTIMIZED)
    if (documentationLoader.isLoaded()) {
      if (documentationLoader.isValidFunctionParameter(functionName, paramName)) {
        return true;
      }
    } else {
      console.warn(
        '[ParameterNamingValidator] Documentation not loaded! Call initializeDocumentationLoader() at service startup.'
      );
    }

    // Fallback: Check for any parameter that's in our known snake_case set
    // (for edge cases where documentation might be incomplete)
    if (this.parameterPatterns.snakeCase.has(paramName)) {
      return true;
    }

    // Final fallback: Use minimal hardcoded list for critical functions
    return this.isBuiltInFunctionParameterLegacy(functionName, paramName);
  }

  /**
   * Legacy hardcoded parameter detection (FALLBACK ONLY)
   * Used only when documentation loading fails
   */
  private isBuiltInFunctionParameterLegacy(functionName: string, paramName: string): boolean {
    // Minimal hardcoded list for critical functions (emergency fallback)
    const criticalBuiltIns: Record<string, Set<string>> = {
      'table.cell': new Set([
        'table_id',
        'column',
        'row',
        'text',
        'text_color',
        'text_size',
        'text_halign',
        'text_valign',
        'text_wrap',
        'text_font_family',
      ]),
      'strategy.entry': new Set([
        'id',
        'direction',
        'qty',
        'limit',
        'stop',
        'oca_name',
        'oca_type',
        'comment',
        'alert_message',
        'disable_alert',
      ]),
    };

    const functionParams = criticalBuiltIns[functionName];
    return functionParams
      ? functionParams.has(paramName)
      : this.parameterPatterns.snakeCase.has(paramName);
  }

  /**
   * Detect naming convention violations
   * @param paramName - Parameter name to analyze
   * @returns Naming issue details or null
   */
  detectNamingConventionViolation(paramName: string): NamingIssue | null {
    // Single character parameters are usually invalid (except 'a', 'x', 'y' etc which should be in singleWord list)
    if (paramName.length === 1) {
      return {
        detected: 'single character',
        expected: 'descriptive parameter name',
        suggestion: `${paramName}_value`, // generic suggestion
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
   * @param str - String to check
   * @returns True if camelCase
   */
  isCamelCase(str: string): boolean {
    return /^[a-z][a-zA-Z0-9]*[A-Z]/.test(str);
  }

  /**
   * Check if string follows PascalCase pattern
   * @param str - String to check
   * @returns True if PascalCase
   */
  isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*/.test(str) && !this.isAllCaps(str);
  }

  /**
   * Check if string is ALL_CAPS
   * @param str - String to check
   * @returns True if ALL_CAPS
   */
  isAllCaps(str: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(str) && str.length > 1;
  }

  /**
   * Convert camelCase to snake_case
   * @param str - camelCase string
   * @returns snake_case string
   */
  convertCamelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  /**
   * Convert PascalCase to snake_case
   * @param str - PascalCase string
   * @returns snake_case string
   */
  convertPascalToSnake(str: string): string {
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
   * @param str - ALL_CAPS string
   * @returns snake_case string
   */
  convertAllCapsToSnake(str: string): string {
    return str.toLowerCase();
  }
}

/**
 * Quick validation wrapper for integration with existing validation pipeline
 * @param source - Pine Script source code
 * @returns Quick validation result
 */
// Singleton instance for performance optimization
let _validatorInstance: ParameterNamingValidator | null = null;

export async function quickValidateParameterNaming(source: string): Promise<ValidationResult> {
  // Use singleton pattern to avoid expensive initialization on every call
  if (!_validatorInstance) {
    _validatorInstance = new ParameterNamingValidator();
  }
  return _validatorInstance.validateParameterNaming(source);
}

/**
 * Enhanced validation for specific error codes (legacy compatibility)
 * @param source - Pine Script source code
 * @param errorCode - Specific error code to check
 * @returns Validation result
 */
export async function validateSpecificParameterError(
  source: string,
  errorCode: string
): Promise<ValidationResult> {
  // Use singleton pattern to avoid expensive initialization on every call
  if (!_validatorInstance) {
    _validatorInstance = new ParameterNamingValidator();
  }
  const result = await _validatorInstance.validateParameterNaming(source);

  // Filter violations by specific error code
  const filteredViolations = result.violations.filter((v) => v.errorCode === errorCode);

  return {
    ...result,
    violations: filteredViolations,
    isValid: filteredViolations.length === 0,
  };
}

// Export main validation function for backward compatibility
export async function validatePineScriptParameters(source: string): Promise<ValidationResult> {
  return quickValidateParameterNaming(source);
}
