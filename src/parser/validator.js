/**
 * Pine Script Parameter Validator
 * 
 * Validates function parameters using AST analysis and validation rules.
 * Implements SHORT_TITLE_TOO_LONG and other parameter validations.
 * 
 * Performance target: <5ms validation for typical Pine Script files
 * Integration: Designed to integrate with index.js:577-579 validation system
 */

import { extractFunctionParameters } from './parser.js';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {ValidationViolation[]} violations - Validation violations found
 * @property {string[]} warnings - Non-critical warnings
 * @property {Object} metrics - Validation performance metrics
 * @property {number} metrics.validationTimeMs - Time spent on validation
 * @property {number} metrics.functionsAnalyzed - Number of functions analyzed
 */

/**
 * Validation violation structure
 * @typedef {Object} ValidationViolation
 * @property {string} code - Error code (e.g., 'SHORT_TITLE_TOO_LONG')
 * @property {string} message - Human-readable error message
 * @property {import('./ast-types.js').SourceLocation} location - Source location
 * @property {'error'|'warning'} severity - Violation severity
 * @property {string} category - Violation category
 * @property {Object} [metadata] - Additional violation data
 */

/**
 * Function parameter constraints loaded from validation-rules.json
 */
let VALIDATION_RULES = null;

/**
 * Load validation rules from the rules file
 * @param {Object} rules - Validation rules object
 */
export function loadValidationRules(rules) {
  VALIDATION_RULES = rules;
}

/**
 * Validate Pine Script parameters using AST analysis
 * @param {string} source - Pine Script source code
 * @param {Object} [validationRules] - Custom validation rules (optional)
 * @returns {ValidationResult} - Validation result
 */
export function validateParameters(source, validationRules = null) {
  const startTime = performance.now();
  const rules = validationRules || VALIDATION_RULES;
  
  if (!rules) {
    throw new Error('Validation rules not loaded. Call loadValidationRules() first.');
  }
  
  // Extract function calls and parameters using AST
  const parseResult = extractFunctionParameters(source);
  const violations = [];
  const warnings = [];
  
  // Validate each function call
  for (const funcCall of parseResult.functionCalls) {
    const funcViolations = validateFunctionCall(funcCall, rules);
    violations.push(...funcViolations);
  }
  
  // Add any parse errors as violations
  for (const error of parseResult.errors) {
    violations.push({
      code: error.code,
      message: error.message,
      location: error.location,
      severity: error.severity,
      category: 'parse_error'
    });
  }
  
  const endTime = performance.now();
  
  return {
    violations,
    warnings,
    metrics: {
      validationTimeMs: endTime - startTime,
      functionsAnalyzed: parseResult.functionCalls.length,
      parseTimeMs: parseResult.metrics.parseTimeMs
    }
  };
}

/**
 * Validate a single function call against validation rules
 * @param {Object} funcCall - Function call data from parser
 * @param {Object} rules - Validation rules
 * @returns {ValidationViolation[]} - Violations found
 */
function validateFunctionCall(funcCall, rules) {
  const violations = [];
  
  // Construct full function name for validation lookup
  const fullFunctionName = funcCall.namespace ? `${funcCall.namespace}.${funcCall.name}` : funcCall.name;
  
  // Get validation rules for this function
  const functionRules = getFunctionValidationRules(fullFunctionName, rules);
  if (!functionRules || !functionRules.argumentConstraints) {
    return violations; // No rules for this function
  }
  
  // Special handling for strategy function to avoid duplicate shorttitle validation
  const isStrategy = fullFunctionName === 'strategy';
  const hasShortTitle = 'shorttitle' in funcCall.parameters;
  
  // Validate each parameter
  for (const [paramName, paramValue] of Object.entries(funcCall.parameters)) {
    // Skip _1 validation for strategy if shorttitle is also present (avoid duplicate)
    if (isStrategy && paramName === '_1' && hasShortTitle && 
        funcCall.parameters.shorttitle === funcCall.parameters._1) {
      continue;
    }
    
    const paramRules = functionRules.argumentConstraints[paramName];
    if (paramRules && paramRules.validation_constraints) {
      const paramViolations = validateParameter(
        paramName, 
        paramValue, 
        paramRules.validation_constraints,
        funcCall
      );
      violations.push(...paramViolations);
    }
  }
  
  return violations;
}

/**
 * Validate a single parameter against its constraints
 * @param {string} paramName - Parameter name
 * @param {any} paramValue - Parameter value
 * @param {Object} constraints - Validation constraints
 * @param {Object} funcCall - Function call context
 * @returns {ValidationViolation[]} - Violations found
 */
function validateParameter(paramName, paramValue, constraints, funcCall) {
  const violations = [];
  
  // Construct full function name for metadata
  const fullFunctionName = funcCall.namespace ? `${funcCall.namespace}.${funcCall.name}` : funcCall.name;
  
  // STRING LENGTH VALIDATION (SHORT_TITLE_TOO_LONG, etc.)
  if (constraints.maxLength && typeof paramValue === 'string') {
    if (paramValue.length > constraints.maxLength) {
      violations.push({
        code: constraints.errorCode || 'STRING_TOO_LONG',
        message: formatErrorMessage(constraints.errorMessage, {
          length: paramValue.length,
          maxLength: constraints.maxLength,
          value: paramValue
        }),
        location: funcCall.location,
        severity: constraints.severity || 'error',
        category: constraints.category || 'parameter_validation',
        metadata: {
          functionName: fullFunctionName,
          parameterName: paramName,
          actualLength: paramValue.length,
          maxLength: constraints.maxLength,
          actualValue: paramValue
        }
      });
    }
  }
  
  // NUMERIC RANGE VALIDATION
  if (constraints.type === 'integer' || constraints.type === 'number') {
    const numValue = typeof paramValue === 'number' ? paramValue : Number(paramValue);
    
    if (isNaN(numValue)) {
      violations.push({
        code: constraints.errorCode || 'INVALID_NUMBER',
        message: `Parameter '${paramName}' must be a valid number, got: ${paramValue}`,
        location: funcCall.location,
        severity: constraints.severity || 'error',
        category: constraints.category || 'parameter_validation',
        metadata: {
          functionName: fullFunctionName,
          parameterName: paramName,
          actualValue: paramValue,
          expectedType: constraints.type
        }
      });
    } else {
      // Check min/max constraints
      if (constraints.min !== undefined && numValue < constraints.min) {
        violations.push({
          code: constraints.errorCode || 'VALUE_TOO_LOW',
          message: formatErrorMessage(constraints.errorMessage, {
            value: numValue,
            min: constraints.min,
            max: constraints.max
          }),
          location: funcCall.location,
          severity: constraints.severity || 'error',
          category: constraints.category || 'parameter_validation',
          metadata: {
            functionName: fullFunctionName,
            parameterName: paramName,
            actualValue: numValue,
            minValue: constraints.min,
            maxValue: constraints.max
          }
        });
      }
      
      if (constraints.max !== undefined && numValue > constraints.max) {
        violations.push({
          code: constraints.errorCode || 'VALUE_TOO_HIGH',
          message: formatErrorMessage(constraints.errorMessage, {
            value: numValue,
            min: constraints.min,
            max: constraints.max
          }),
          location: funcCall.location,
          severity: constraints.severity || 'error',
          category: constraints.category || 'parameter_validation',
          metadata: {
            functionName: fullFunctionName,
            parameterName: paramName,
            actualValue: numValue,
            minValue: constraints.min,
            maxValue: constraints.max
          }
        });
      }
      
      // Integer validation
      if (constraints.type === 'integer' && !Number.isInteger(numValue)) {
        violations.push({
          code: constraints.errorCode || 'NOT_INTEGER',
          message: `Parameter '${paramName}' must be an integer, got: ${numValue}`,
          location: funcCall.location,
          severity: constraints.severity || 'error',
          category: constraints.category || 'parameter_validation',
          metadata: {
            functionName: fullFunctionName,
            parameterName: paramName,
            actualValue: numValue
          }
        });
      }
    }
  }
  
  return violations;
}

/**
 * Get validation rules for a specific function
 * @param {string} functionName - Function name
 * @param {Object} rules - All validation rules
 * @returns {Object|null} - Function validation rules or null
 */
function getFunctionValidationRules(functionName, rules) {
  if (!rules.functionValidationRules) {
    return null;
  }
  
  // Map function names to rule keys
  const functionRuleMap = {
    'indicator': 'fun_indicator',
    'strategy': 'fun_strategy'
  };
  
  const ruleKey = functionRuleMap[functionName];
  return ruleKey ? rules.functionValidationRules[ruleKey] : null;
}

/**
 * Format error message with template variables
 * @param {string} template - Error message template
 * @param {Object} variables - Template variables
 * @returns {string} - Formatted error message
 */
function formatErrorMessage(template, variables) {
  if (!template) return 'Validation error';
  
  let message = template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  
  return message;
}

/**
 * Validate Pine Script using the existing integration pattern
 * This function is designed to integrate with the existing validation system
 * @param {string} source - Pine Script source code
 * @param {Object} validationRules - Validation rules from validation-rules.json
 * @returns {Object} - Violations in the same format as existing system
 */
export function validatePineScriptParameters(source, validationRules) {
  const result = validateParameters(source, validationRules);
  
  // Transform violations to match existing format used in index.js
  const violations = result.violations.map(violation => ({
    line: violation.location.line,
    column: violation.location.column,
    severity: violation.severity,
    message: violation.message,
    rule: violation.code,
    category: violation.category,
    metadata: violation.metadata
  }));
  
  return {
    violations,
    metrics: result.metrics
  };
}

/**
 * Create a SHORT_TITLE_TOO_LONG validation specifically
 * This is the high-priority validation mentioned in the requirements
 * @param {string} source - Pine Script source code
 * @returns {Object} - Focused validation result for shorttitle parameter
 */
export function validateShortTitle(source) {
  // Quick validation rules for shorttitle only
  const shortTitleRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          shorttitle: {
            validation_constraints: {
              maxLength: 10,
              errorCode: 'SHORT_TITLE_TOO_LONG',
              errorMessage: 'The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          shorttitle: {
            validation_constraints: {
              maxLength: 10,
              errorCode: 'SHORT_TITLE_TOO_LONG',
              errorMessage: 'The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)',
              severity: 'error',
              category: 'parameter_validation'
            }
          },
          _1: {  // Second positional parameter is shorttitle for strategy function
            validation_constraints: {
              maxLength: 10,
              errorCode: 'SHORT_TITLE_TOO_LONG',
              errorMessage: 'The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    }
  };
  
  const result = validatePineScriptParameters(source, shortTitleRules);
  
  return {
    success: true,
    hasShortTitleError: result.violations.some(v => v.rule === 'SHORT_TITLE_TOO_LONG'),
    violations: result.violations,
    metrics: result.metrics
  };
}

// Export for testing
export { getFunctionValidationRules, formatErrorMessage };

/**
 * Create an INVALID_PRECISION validation specifically
 * This implements the constraint: 0 ≤ precision ≤ 8 (integer) for strategy() and indicator() functions
 * Following the atomic testing success pattern from SHORT_TITLE_TOO_LONG
 * @param {string} source - Pine Script source code
 * @returns {Object} - Focused validation result for precision parameter
 */
export function validatePrecision(source) {
  // Quick validation rules for precision only
  const precisionRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          precision: {
            validation_constraints: {
              type: 'integer',
              min: 0,
              max: 8,
              errorCode: 'INVALID_PRECISION',
              errorMessage: 'Parameter precision must be between 0 and 8 (inclusive), got {value}. (INVALID_PRECISION)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          precision: {
            validation_constraints: {
              type: 'integer',
              min: 0,
              max: 8,
              errorCode: 'INVALID_PRECISION',
              errorMessage: 'Parameter precision must be between 0 and 8 (inclusive), got {value}. (INVALID_PRECISION)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    }
  };
  
  const result = validatePineScriptParameters(source, precisionRules);
  
  return {
    success: true,
    hasPrecisionError: result.violations.some(v => v.rule === 'INVALID_PRECISION'),
    violations: result.violations,
    metrics: result.metrics
  };
}

/**
 * Quick precision validation function for atomic testing integration
 * Implements the same pattern as quickValidateShortTitle for consistency
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result matching test expectations
 */
export function quickValidatePrecision(source) {
  return validatePrecision(source);
}
/**
 * Create an INVALID_MAX_BARS_BACK validation specifically
 * This implements the constraint: 1 ≤ max_bars_back ≤ 5000 (integer) for strategy() and indicator() functions
 * Following the atomic testing success pattern from INVALID_PRECISION
 * @param {string} source - Pine Script source code
 * @returns {Object} - Focused validation result for max_bars_back parameter
 */
export function validateMaxBarsBack(source) {
  // Quick validation rules for max_bars_back only
  const maxBarsBackRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          max_bars_back: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 5000,
              errorCode: 'INVALID_MAX_BARS_BACK',
              errorMessage: 'Parameter max_bars_back must be between 1 and 5000 (inclusive), got {value}. (INVALID_MAX_BARS_BACK)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          max_bars_back: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 5000,
              errorCode: 'INVALID_MAX_BARS_BACK',
              errorMessage: 'Parameter max_bars_back must be between 1 and 5000 (inclusive), got {value}. (INVALID_MAX_BARS_BACK)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    },
    errorDefinitions: {
      INVALID_MAX_BARS_BACK: {
        description: "max_bars_back parameter outside valid range (1-5000)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls how far back the script can reference historical data"
      }
    }
  };

  // Use the focused validation approach with limited rules
  const result = validatePineScriptParameters(source, maxBarsBackRules);
  
  return {
    success: true,
    hasMaxBarsBackError: result.violations.some(v => v.rule === 'INVALID_MAX_BARS_BACK'),
    violations: result.violations,
    metrics: result.metrics
  };
}
/**
 * Quick max_bars_back validation function for atomic testing integration
 * Implements the same pattern as quickValidatePrecision for consistency
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result matching test expectations
 */
export function quickValidateMaxBarsBack(source) {
  return validateMaxBarsBack(source);
}

/**
 * Validates max_lines_count parameter for drawing object count limits
 * Prevents performance issues from excessive line objects
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result with line count violations
 */
export function validateMaxLinesCount(source) {
  // Quick validation rules for max_lines_count only
  const maxLinesCountRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          max_lines_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LINES_COUNT',
              errorMessage: 'Parameter max_lines_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LINES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          max_lines_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LINES_COUNT',
              errorMessage: 'Parameter max_lines_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LINES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    },
    errorDefinitions: {
      INVALID_MAX_LINES_COUNT: {
        description: "max_lines_count parameter outside valid range (1-500)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls maximum drawing objects to prevent performance issues"
      }
    }
  };

  // Use the focused validation approach with limited rules
  const result = validatePineScriptParameters(source, maxLinesCountRules);
  
  return {
    success: true,
    hasMaxLinesCountError: result.violations.some(v => v.rule === 'INVALID_MAX_LINES_COUNT'),
    violations: result.violations,
    metrics: result.metrics
  };
}

/**
 * Quick max_lines_count validation function for atomic testing integration
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result matching test expectations
 */
export function quickValidateMaxLinesCount(source) {
  return validateMaxLinesCount(source);
}

/**
 * Validates max_labels_count parameter for drawing object count limits
 * Prevents performance issues from excessive label objects
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result with label count violations
 */
export function validateMaxLabelsCount(source) {
  // Quick validation rules for max_labels_count only
  const maxLabelsCountRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          max_labels_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LABELS_COUNT',
              errorMessage: 'Parameter max_labels_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LABELS_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          max_labels_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LABELS_COUNT',
              errorMessage: 'Parameter max_labels_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LABELS_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    },
    errorDefinitions: {
      INVALID_MAX_LABELS_COUNT: {
        description: "max_labels_count parameter outside valid range (1-500)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls maximum label objects to prevent performance issues"
      }
    }
  };

  // Use the focused validation approach with limited rules
  const result = validatePineScriptParameters(source, maxLabelsCountRules);
  
  return {
    success: true,
    hasMaxLabelsCountError: result.violations.some(v => v.rule === 'INVALID_MAX_LABELS_COUNT'),
    violations: result.violations,
    metrics: result.metrics
  };
}

/**
 * Quick max_labels_count validation function for atomic testing integration
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result matching test expectations
 */
export function quickValidateMaxLabelsCount(source) {
  return validateMaxLabelsCount(source);
}

/**
 * Validates max_boxes_count parameter for drawing object count limits
 * Prevents performance issues from excessive box objects
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result with box count violations
 */
export function validateMaxBoxesCount(source) {
  // Quick validation rules for max_boxes_count only
  const maxBoxesCountRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          max_boxes_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_BOXES_COUNT',
              errorMessage: 'Parameter max_boxes_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_BOXES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          max_boxes_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_BOXES_COUNT',
              errorMessage: 'Parameter max_boxes_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_BOXES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    },
    errorDefinitions: {
      INVALID_MAX_BOXES_COUNT: {
        description: "max_boxes_count parameter outside valid range (1-500)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls maximum box objects to prevent performance issues"
      }
    }
  };

  // Use the focused validation approach with limited rules
  const result = validatePineScriptParameters(source, maxBoxesCountRules);
  
  return {
    success: true,
    hasMaxBoxesCountError: result.violations.some(v => v.rule === 'INVALID_MAX_BOXES_COUNT'),
    violations: result.violations,
    metrics: result.metrics
  };
}

/**
 * Quick max_boxes_count validation function for atomic testing integration
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result matching test expectations
 */
export function quickValidateMaxBoxesCount(source) {
  return validateMaxBoxesCount(source);
}

/**
 * Batch validation for all drawing object count parameters
 * Efficient validation of max_lines_count, max_labels_count, and max_boxes_count
 * @param {string} source - Pine Script source code
 * @returns {Object} - Combined validation result for all drawing object counts
 */
export function validateDrawingObjectCounts(source) {
  // Combined validation rules for all drawing object count parameters
  const drawingObjectCountRules = {
    functionValidationRules: {
      fun_indicator: {
        argumentConstraints: {
          max_lines_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LINES_COUNT',
              errorMessage: 'Parameter max_lines_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LINES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          },
          max_labels_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LABELS_COUNT',
              errorMessage: 'Parameter max_labels_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LABELS_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          },
          max_boxes_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_BOXES_COUNT',
              errorMessage: 'Parameter max_boxes_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_BOXES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      },
      fun_strategy: {
        argumentConstraints: {
          max_lines_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LINES_COUNT',
              errorMessage: 'Parameter max_lines_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LINES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          },
          max_labels_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_LABELS_COUNT',
              errorMessage: 'Parameter max_labels_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_LABELS_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          },
          max_boxes_count: {
            validation_constraints: {
              type: 'integer',
              min: 1,
              max: 500,
              errorCode: 'INVALID_MAX_BOXES_COUNT',
              errorMessage: 'Parameter max_boxes_count must be between 1 and 500 (inclusive), got {value}. (INVALID_MAX_BOXES_COUNT)',
              severity: 'error',
              category: 'parameter_validation'
            }
          }
        }
      }
    },
    errorDefinitions: {
      INVALID_MAX_LINES_COUNT: {
        description: "max_lines_count parameter outside valid range (1-500)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls maximum drawing objects to prevent performance issues"
      },
      INVALID_MAX_LABELS_COUNT: {
        description: "max_labels_count parameter outside valid range (1-500)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls maximum label objects to prevent performance issues"
      },
      INVALID_MAX_BOXES_COUNT: {
        description: "max_boxes_count parameter outside valid range (1-500)",
        severity: "error",
        category: "parameter_validation",
        documentation: "Controls maximum box objects to prevent performance issues"
      }
    }
  };

  // Use the focused validation approach with limited rules
  const result = validatePineScriptParameters(source, drawingObjectCountRules);
  
  return {
    success: true,
    hasDrawingObjectCountError: result.violations.some(v => 
      ['INVALID_MAX_LINES_COUNT', 'INVALID_MAX_LABELS_COUNT', 'INVALID_MAX_BOXES_COUNT'].includes(v.rule)
    ),
    hasMaxLinesCountError: result.violations.some(v => v.rule === 'INVALID_MAX_LINES_COUNT'),
    hasMaxLabelsCountError: result.violations.some(v => v.rule === 'INVALID_MAX_LABELS_COUNT'),
    hasMaxBoxesCountError: result.violations.some(v => v.rule === 'INVALID_MAX_BOXES_COUNT'),
    violations: result.violations,
    metrics: result.metrics
  };
}

/**
 * Quick batch validation function for all drawing object count parameters
 * @param {string} source - Pine Script source code
 * @returns {Object} - Combined validation result for atomic testing
 */
export function quickValidateDrawingObjectCounts(source) {
  return validateDrawingObjectCounts(source);
}

/**
 * Phase 1: Core Type Validation Functions Following Atomic Pattern
 * INPUT_TYPE_MISMATCH validation for detecting Pine Script type mismatches
 * Following the proven success methodology from 5 validated rules
 */

/**
 * ATOMIC FUNCTION 1: Extract function calls from a Pine Script line
 * @param {string} line - Single line of Pine Script code
 * @returns {Array} - Array of function call objects with name and parameters
 */
export function extractFunctionCalls(line) {
  const functionCalls = [];
  
  if (!line || typeof line !== 'string') {
    return functionCalls;
  }
  
  // Pine Script function call pattern: functionName(params...)
  const functionCallRegex = /([a-zA-Z_][a-zA-Z0-9_.]*)\s*\(/g;
  
  let match;
  while ((match = functionCallRegex.exec(line)) !== null) {
    const functionName = match[1];
    const startPos = match.index + match[1].length;
    
    // Skip common false positives that aren't function calls
    if (['if', 'while', 'for'].includes(functionName)) {
      continue;
    }
    
    // Extract parameters for this function call
    const params = extractParametersForFunction(line, startPos);
    
    functionCalls.push({
      name: functionName,
      parameters: params,
      position: match.index
    });
  }
  
  return functionCalls;
}

/**
 * ATOMIC FUNCTION 2: Extract parameters from a function call
 * @param {string} line - Line containing function call
 * @param {number} startPos - Position after function name and opening paren
 * @returns {Array} - Array of parameter values
 */
function extractParametersForFunction(line, startPos) {
  const params = [];
  let depth = 1;
  let current = '';
  let i = startPos + 1; // Skip opening parenthesis
  
  while (i < line.length && depth > 0) {
    const char = line[i];
    
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        if (current.trim()) {
          params.push(current.trim());
        }
        break;
      } else {
        current += char;
      }
    } else if (char === ',' && depth === 1) {
      if (current.trim()) {
        params.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  return params;
}

/**
 * ATOMIC FUNCTION 3: Infer parameter types from Pine Script usage
 * @param {string} paramValue - Parameter value as string
 * @returns {string} - Inferred type (int, float, string, bool, series, etc.)
 */
export function inferParameterTypes(paramValue) {
  if (!paramValue || typeof paramValue !== 'string') {
    return 'unknown';
  }
  
  const trimmed = paramValue.trim();
  
  // String literals (quoted)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return 'string';
  }
  
  // Boolean literals
  if (trimmed === 'true' || trimmed === 'false') {
    return 'bool';
  }
  
  // Integer literals
  if (/^-?\d+$/.test(trimmed)) {
    return 'int';
  }
  
  // Float literals
  if (/^-?\d*\.\d+$/.test(trimmed)) {
    return 'float';
  }
  
  // Color literals
  if (trimmed.startsWith('#') || trimmed.startsWith('color.')) {
    return 'color';
  }
  
  // Variable/series references
  if (/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(trimmed)) {
    // Common Pine Script series variables
    if (['close', 'open', 'high', 'low', 'volume', 'time'].includes(trimmed)) {
      return 'series float';
    }
    // Could be any variable - assume series for safety
    return 'series';
  }
  
  // Function call result - infer return type based on function
  if (trimmed.includes('(')) {
    const functionMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)\s*\(/);
    if (functionMatch) {
      const functionName = functionMatch[1];
      // Common Pine Script function return types
      const returnTypes = {
        'ta.sma': 'series float',
        'ta.ema': 'series float',
        'ta.rsi': 'series float',
        'ta.macd': 'series float',
        'math.max': 'float',
        'math.min': 'float',
        'math.abs': 'float',
        'str.tostring': 'string',
        'str.tonumber': 'float'
      };
      
      return returnTypes[functionName] || 'function_result';
    }
    return 'function_result';
  }
  
  return 'unknown';
}

/**
 * ATOMIC FUNCTION 4: Get expected parameter types from language reference
 * @param {string} functionName - Pine Script function name
 * @returns {Object} - Expected parameter types and constraints
 */
export function getExpectedTypes(functionName) {
  // Common Pine Script functions with type requirements
  const typeDefinitions = {
    'ta.sma': {
      params: [
        { name: 'source', type: 'series int/float', required: true },
        { name: 'length', type: 'series int', required: true }
      ]
    },
    'ta.ema': {
      params: [
        { name: 'source', type: 'series int/float', required: true },
        { name: 'length', type: 'series int', required: true }
      ]
    },
    'math.max': {
      params: [
        { name: 'value1', type: 'int/float', required: true },
        { name: 'value2', type: 'int/float', required: true }
      ]
    },
    'str.contains': {
      params: [
        { name: 'source', type: 'string', required: true },
        { name: 'substring', type: 'string', required: true }
      ]
    },
    'alert': {
      params: [
        { name: 'message', type: 'series string', required: true },
        { name: 'freq', type: 'input string', required: false }
      ]
    }
  };
  
  return typeDefinitions[functionName] || { params: [] };
}

/**
 * ATOMIC FUNCTION 5: Compare expected vs actual types for mismatches
 * @param {string} expectedType - Expected parameter type from language reference
 * @param {string} actualType - Actual inferred type from code
 * @returns {Object} - Type comparison result with mismatch details
 */
export function compareTypes(expectedType, actualType) {
  if (!expectedType || !actualType) {
    return { isValid: false, reason: 'missing_type_info' };
  }
  
  // Exact match
  if (expectedType === actualType) {
    return { isValid: true };
  }
  
  // Type compatibility rules for Pine Script
  const compatible = checkTypeCompatibility(expectedType, actualType);
  
  return {
    isValid: compatible.isCompatible,
    reason: compatible.reason || 'type_mismatch',
    expected: expectedType,
    actual: actualType
  };
}

/**
 * Helper function: Check Pine Script type compatibility
 * @param {string} expected - Expected type
 * @param {string} actual - Actual type  
 * @returns {Object} - Compatibility result
 */
function checkTypeCompatibility(expected, actual) {
  // Handle series types more flexibly
  if (expected.includes('series') && actual.includes('series')) {
    const baseExpected = expected.replace('series ', '');
    const baseActual = actual.replace('series ', '');
    
    // series int/float can accept series float, series int, etc.
    if (baseExpected === 'int/float' && (baseActual === 'int' || baseActual === 'float')) {
      return { isCompatible: true, reason: 'series_numeric_compatible' };
    }
    if (baseExpected === baseActual) {
      return { isCompatible: true, reason: 'series_exact_match' };
    }
  }
  
  // Series can accept simpler types
  if (expected.includes('series') && !actual.includes('series')) {
    const baseExpected = expected.replace('series ', '');
    if (baseExpected === actual || 
        (baseExpected === 'int/float' && (actual === 'int' || actual === 'float'))) {
      return { isCompatible: true, reason: 'series_accepts_simple' };
    }
  }
  
  // int/float accepts both int and float
  if (expected === 'int/float' && (actual === 'int' || actual === 'float')) {
    return { isCompatible: true, reason: 'numeric_compatible' };
  }
  
  // String type requirements are strict
  if (expected === 'string' && actual !== 'string') {
    return { isCompatible: false, reason: 'requires_string' };
  }
  
  // Numeric requirements
  if ((expected === 'int' || expected === 'float' || expected === 'int/float') && 
      (actual === 'string' || actual === 'bool')) {
    return { isCompatible: false, reason: 'requires_numeric' };
  }
  
  // Boolean requirements
  if (expected === 'bool' && actual !== 'bool') {
    return { isCompatible: false, reason: 'requires_boolean' };
  }
  
  // Handle unknown function results more gracefully
  if (actual === 'function_result') {
    // Don't report violations for unknown function results - could be any type
    return { isCompatible: true, reason: 'function_result_unknown' };
  }
  
  return { isCompatible: false, reason: 'incompatible_types' };
}

/**
 * Core Type Validation Engine - Phase 1 Implementation
 * Validates INPUT_TYPE_MISMATCH using atomic functions
 * @param {string} source - Pine Script source code
 * @returns {Object} - Type validation result following atomic pattern
 */
export function validateInputTypes(source) {
  const violations = [];
  
  // Handle null/undefined inputs gracefully
  if (!source || typeof source !== 'string') {
    return {
      success: true,
      violations: [],
      metrics: {
        functionsAnalyzed: 0,
        typeChecksPerformed: 0
      }
    };
  }
  
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const functionCalls = extractFunctionCalls(line);
    
    functionCalls.forEach(funcCall => {
      const expectedTypes = getExpectedTypes(funcCall.name);
      
      if (expectedTypes.params.length === 0) {
        return; // Skip functions we don't have type info for
      }
      
      funcCall.parameters.forEach((param, paramIndex) => {
        if (paramIndex < expectedTypes.params.length) {
          const expected = expectedTypes.params[paramIndex];
          const actualType = inferParameterTypes(param);
          const comparison = compareTypes(expected.type, actualType);
          
          if (!comparison.isValid) {
            violations.push({
              line: lineIndex + 1,
              column: funcCall.position + 1,
              severity: 'error',
              message: `Parameter ${paramIndex + 1} of ${funcCall.name}() expects ${expected.type} but got ${actualType}. (INPUT_TYPE_MISMATCH)`,
              rule: 'INPUT_TYPE_MISMATCH',
              category: 'type_validation',
              functionName: funcCall.name,
              parameterName: expected.name,
              expectedType: expected.type,
              actualType: actualType,
              reason: comparison.reason
            });
          }
        }
      });
    });
  });
  
  return {
    success: true,
    violations: violations,
    metrics: {
      functionsAnalyzed: lines.reduce((total, line) => total + extractFunctionCalls(line).length, 0),
      typeChecksPerformed: violations.length + 
        lines.reduce((total, line) => {
          return total + extractFunctionCalls(line).reduce((subtotal, func) => {
            const expected = getExpectedTypes(func.name);
            return subtotal + Math.min(func.parameters.length, expected.params.length);
          }, 0);
        }, 0)
    }
  };
}

/**
 * Quick Input Type validation following proven atomic pattern
 * Implements the same pattern as quickValidatePrecision for consistency
 * @param {string} source - Pine Script source code
 * @returns {Object} - Type validation result matching test expectations
 */
export function quickValidateInputTypes(source) {
  return validateInputTypes(source);
}
