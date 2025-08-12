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
  
  // Get validation rules for this function
  const functionRules = getFunctionValidationRules(funcCall.name, rules);
  if (!functionRules || !functionRules.argumentConstraints) {
    return violations; // No rules for this function
  }
  
  // Validate each parameter
  for (const [paramName, paramValue] of Object.entries(funcCall.parameters)) {
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
          functionName: funcCall.name,
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
          functionName: funcCall.name,
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
            functionName: funcCall.name,
            parameterName: paramName,
            actualValue: numValue,
            minValue: constraints.min
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
            functionName: funcCall.name,
            parameterName: paramName,
            actualValue: numValue,
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
            functionName: funcCall.name,
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