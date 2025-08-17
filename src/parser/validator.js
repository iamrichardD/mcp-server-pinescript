/**
 * Comprehensive Pine Script Parameter Validation System
 * Phase 2 Implementation - Advanced AST-based validation
 * 
 * This module provides comprehensive parameter validation for Pine Script code,
 * supporting the complete validation rule overlay system designed for atomic testing.
 * 
 * Key Features:
 * - Atomic function architecture for modular testing
 * - Sub-5ms validation performance targets
 * - Complete AST-based parsing for complex parameter extraction
 * - Integration with validation-rules.json overlay system
 * - Type-safe architecture designed for TypeScript migration
 */

import { parseScript, extractFunctionParameters } from './parser.js';
import { createSourceLocation } from './ast-types.js';

/**
 * Validation Rules Storage
 * Populated by loadValidationRules() during initialization
 */
let validationRules = null;
let loadedRulesTimestamp = null;

/**
 * Load validation rules from the main validation-rules.json
 * Called during MCP server initialization
 * 
 * @param {Object} rules - Complete validation rules object
 */
export function loadValidationRules(rules) {
  validationRules = rules;
  loadedRulesTimestamp = Date.now();
  console.log(`Loaded ${Object.keys(rules).length} validation rules`);
}

/**
 * Get current validation rules (for debugging/testing)
 * @returns {Object|null} Current validation rules or null if not loaded
 */
export function getCurrentValidationRules() {
  return validationRules;
}

/**
 * Validate Pine Script parameters using the complete validation rule system
 * 
 * This is the main validation function that coordinates all individual validators
 * and integrates with the MCP server validation pipeline.
 * 
 * @param {string} source - Pine Script source code
 * @param {Object} rules - Validation rules (optional, uses loaded rules if not provided)
 * @returns {Promise<Object>} Complete validation result
 */
export async function validatePineScriptParameters(source, rules = null) {
  const startTime = performance.now();
  const rulesToUse = rules || validationRules;
  
  if (!rulesToUse) {
    throw new Error('Validation rules not loaded. Call loadValidationRules() first.');
  }
  
  // Phase 1: Extract function parameters using AST parsing
  const parseResult = extractFunctionParameters(source);
  if (!parseResult.success) {
    return {
      success: false,
      violations: [],
      errors: parseResult.errors,
      metrics: {
        totalTimeMs: performance.now() - startTime,
        parseTimeMs: 0,
        validationTimeMs: 0
      }
    };
  }
  
  // Phase 2: Run individual validators in parallel for performance
  const validationPromises = [];
  
  // Short title validation (highest priority)
  if (rulesToUse.SHORT_TITLE_TOO_LONG) {
    validationPromises.push(validateShortTitle(source));
  }
  
  // Parameter constraint validations
  if (rulesToUse.INVALID_PRECISION) {
    validationPromises.push(quickValidatePrecision(source));
  }
  
  if (rulesToUse.INVALID_MAX_BARS_BACK) {
    validationPromises.push(quickValidateMaxBarsBack(source));
  }
  
  // Drawing object validations
  if (rulesToUse.TOO_MANY_DRAWING_OBJECTS) {
    validationPromises.push(quickValidateDrawingObjectCounts(source));
  }
  
  // Run all validations in parallel
  const validationResults = await Promise.all(validationPromises);
  
  // Combine all violations
  const allViolations = [];
  validationResults.forEach(result => {
    if (result.violations) {
      allViolations.push(...result.violations);
    }
  });
  
  const endTime = performance.now();
  
  return {
    success: true,
    violations: allViolations,
    functionCalls: parseResult.functionCalls,
    metrics: {
      totalTimeMs: endTime - startTime,
      parseTimeMs: parseResult.metrics.parseTimeMs,
      validationTimeMs: endTime - startTime - parseResult.metrics.parseTimeMs,
      violationsFound: allViolations.length,
      functionsAnalyzed: parseResult.functionCalls.length
    },
    errors: []
  };
}

/**
 * Validate function parameters against expected signatures
 * Core function for parameter type and count validation
 * 
 * @param {Array} functionCalls - Extracted function calls from AST
 * @param {Object} validationRules - Rules containing function signatures
 * @returns {Array} Array of validation violations
 */
export function validateParameters(functionCalls, validationRules) {
  const violations = [];
  
  functionCalls.forEach(functionCall => {
    const { name, parameters, location } = functionCall;
    
    // Check if we have validation rules for this function
    const functionRule = validationRules[name];
    if (!functionRule || !functionRule.expectedSignature) {
      return; // Skip validation for unknown functions
    }
    
    const expectedSig = functionRule.expectedSignature;
    
    // Validate parameter count
    const actualParamCount = parameters.length;
    const expectedParamCount = expectedSig.parameters ? expectedSig.parameters.length : 0;
    
    if (actualParamCount !== expectedParamCount) {
      violations.push({
        line: location.line,
        column: location.column,
        severity: 'error',
        message: `Function '${name}()' expects ${expectedParamCount} parameters, got ${actualParamCount}`,
        rule: 'PARAMETER_COUNT_MISMATCH',
        category: 'parameter_validation',
        details: {
          functionName: name,
          expectedCount: expectedParamCount,
          actualCount: actualParamCount,
          expectedSignature: expectedSig
        }
      });
    }
    
    // Validate parameter types (if type information is available)
    if (expectedSig.parameters) {
      parameters.forEach((param, index) => {
        if (index < expectedSig.parameters.length) {
          const expectedParam = expectedSig.parameters[index];
          const actualType = inferParameterType(param);
          
          if (expectedParam.type && actualType && !isTypeCompatible(actualType, expectedParam.type)) {
            violations.push({
              line: location.line,
              column: location.column,
              severity: 'error',
              message: `Parameter ${index + 1} of '${name}()' expects type '${expectedParam.type}', got '${actualType}'`,
              rule: 'PARAMETER_TYPE_MISMATCH',
              category: 'parameter_validation',
              details: {
                functionName: name,
                parameterIndex: index,
                parameterName: expectedParam.name,
                expectedType: expectedParam.type,
                actualType: actualType,
                actualValue: param.value
              }
            });
          }
        }
      });
    }
  });
  
  return violations;
}

/**
 * Infer the type of a parameter from its value
 * Helper function for type validation
 * 
 * @param {Object} parameter - Parameter object from AST
 * @returns {string} Inferred type name
 */
function inferParameterType(parameter) {
  if (parameter.type === 'literal') {
    const value = parameter.value;
    
    if (typeof value === 'string') {
      // Check if it's a quoted string literal
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        return 'string';
      }
      return 'identifier'; // Unquoted identifier
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float';
    }
    
    if (typeof value === 'boolean') {
      return 'bool';
    }
  }
  
  return 'unknown';
}

/**
 * Check if two types are compatible
 * Helper function for type validation
 * 
 * @param {string} actualType - Actual parameter type
 * @param {string} expectedType - Expected parameter type
 * @returns {boolean} True if types are compatible
 */
function isTypeCompatible(actualType, expectedType) {
  // Exact match
  if (actualType === expectedType) {
    return true;
  }
  
  // Numeric compatibility
  if (expectedType === 'simple_int' && actualType === 'int') {
    return true;
  }
  
  if (expectedType === 'simple_float' && (actualType === 'float' || actualType === 'int')) {
    return true;
  }
  
  // String compatibility
  if (expectedType === 'simple_string' && actualType === 'string') {
    return true;
  }
  
  return false;
}

/**
 * SHORT_TITLE_TOO_LONG Validation
 * Atomic function implementing the highest priority validation rule
 * 
 * Validates that strategy() and indicator() shorttitle parameters
 * do not exceed the 10-character limit.
 * 
 * @param {string} source - Pine Script source code
 * @returns {Object} Validation result with violations array
 */
export function validateShortTitle(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Regex pattern to match strategy() and indicator() calls with shorttitle parameter
    const strategyRegex = /(?:strategy|indicator)\s*\(\s*[^,]*,\s*shorttitle\s*=\s*["']([^"']*)["']/g;
    
    let match;
    while ((match = strategyRegex.exec(line)) !== null) {
      const shortTitle = match[1];
      const shortTitleLength = shortTitle.length;
      
      if (shortTitleLength > 10) {
        const column = line.indexOf(match[0]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `Short title "${shortTitle}" exceeds 10 character limit (${shortTitleLength} characters)`,
          rule: 'SHORT_TITLE_TOO_LONG',
          category: 'parameter_validation',
          details: {
            actualLength: shortTitleLength,
            maxLength: 10,
            shortTitle: shortTitle,
            suggestion: shortTitle.substring(0, 10)
          }
        });
      }
    }
  });
  
  return {
    violations,
    warnings: []
  };
}

/**
 * INVALID_PRECISION Validation
 * Validates that strategy() and indicator() precision parameters are within valid range (0-8)
 * 
 * @param {string} source - Pine Script source code  
 * @returns {Object} Validation result
 */
export function validatePrecision(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Match strategy() or indicator() calls with precision parameter
    const precisionRegex = /(?:strategy|indicator)\s*\([^)]*precision\s*=\s*(\d+)/g;
    
    let match;
    while ((match = precisionRegex.exec(line)) !== null) {
      const precision = parseInt(match[1]);
      
      if (precision < 0 || precision > 8) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `Invalid precision value: ${precision}. Must be between 0 and 8.`,
          rule: 'INVALID_PRECISION',
          category: 'parameter_validation',
          details: {
            actualValue: precision,
            minValue: 0,
            maxValue: 8,
            suggestion: Math.max(0, Math.min(8, precision))
          }
        });
      }
    }
  });
  
  return {
    violations,
    warnings: []
  };
}

/**
 * Quick precision validation for performance-optimized validation
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Validation result
 */
export async function quickValidatePrecision(source) {
  const startTime = performance.now();
  const result = validatePrecision(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: {
      validationTimeMs: endTime - startTime
    }
  };
}

/**
 * INVALID_MAX_BARS_BACK Validation
 * Validates max_bars_back parameter constraints
 */
export function validateMaxBarsBack(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Match max_bars_back parameter in strategy() or indicator() calls
    const maxBarsBackRegex = /(?:strategy|indicator)\s*\([^)]*max_bars_back\s*=\s*(\d+)/g;
    
    let match;
    while ((match = maxBarsBackRegex.exec(line)) !== null) {
      const maxBarsBack = parseInt(match[1]);
      
      // Validate reasonable range (example constraint)
      if (maxBarsBack < 1 || maxBarsBack > 5000) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'warning',
          message: `max_bars_back value ${maxBarsBack} may cause performance issues. Consider using a value between 1 and 5000.`,
          rule: 'INVALID_MAX_BARS_BACK',
          category: 'parameter_validation',
          details: {
            actualValue: maxBarsBack,
            recommendedMin: 1,
            recommendedMax: 5000,
            suggestion: Math.max(1, Math.min(5000, maxBarsBack))
          }
        });
      }
    }
  });
  
  return {
    violations,
    warnings: []
  };
}

/**
 * Quick max_bars_back validation
 */
export async function quickValidateMaxBarsBack(source) {
  const startTime = performance.now();
  const result = validateMaxBarsBack(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: {
      validationTimeMs: endTime - startTime
    }
  };
}

/**
 * Drawing Object Count Validations
 * Validates constraints on drawing objects like max_lines_count, max_labels_count, etc.
 */

/**
 * Validate max_lines_count parameter
 */
export function validateMaxLinesCount(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const maxLinesRegex = /(?:strategy|indicator)\s*\([^)]*max_lines_count\s*=\s*(\d+)/g;
    
    let match;
    while ((match = maxLinesRegex.exec(line)) !== null) {
      const maxLines = parseInt(match[1]);
      
      if (maxLines < 1 || maxLines > 500) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `max_lines_count value ${maxLines} is invalid. Must be between 1 and 500.`,
          rule: 'TOO_MANY_DRAWING_OBJECTS',
          category: 'drawing_objects_validation',
          details: {
            objectType: 'lines',
            actualValue: maxLines,
            minValue: 1,
            maxValue: 500,
            suggestion: Math.max(1, Math.min(500, maxLines))
          }
        });
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateMaxLinesCount(source) {
  const startTime = performance.now();
  const result = validateMaxLinesCount(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * Validate max_labels_count parameter
 */
export function validateMaxLabelsCount(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const maxLabelsRegex = /(?:strategy|indicator)\s*\([^)]*max_labels_count\s*=\s*(\d+)/g;
    
    let match;
    while ((match = maxLabelsRegex.exec(line)) !== null) {
      const maxLabels = parseInt(match[1]);
      
      if (maxLabels < 1 || maxLabels > 500) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `max_labels_count value ${maxLabels} is invalid. Must be between 1 and 500.`,
          rule: 'TOO_MANY_DRAWING_OBJECTS',
          category: 'drawing_objects_validation',
          details: {
            objectType: 'labels',
            actualValue: maxLabels,
            minValue: 1,
            maxValue: 500,
            suggestion: Math.max(1, Math.min(500, maxLabels))
          }
        });
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateMaxLabelsCount(source) {
  const startTime = performance.now();
  const result = validateMaxLabelsCount(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * Validate max_boxes_count parameter
 */
export function validateMaxBoxesCount(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const maxBoxesRegex = /(?:strategy|indicator)\s*\([^)]*max_boxes_count\s*=\s*(\d+)/g;
    
    let match;
    while ((match = maxBoxesRegex.exec(line)) !== null) {
      const maxBoxes = parseInt(match[1]);
      
      if (maxBoxes < 1 || maxBoxes > 500) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `max_boxes_count value ${maxBoxes} is invalid. Must be between 1 and 500.`,
          rule: 'TOO_MANY_DRAWING_OBJECTS',
          category: 'drawing_objects_validation',
          details: {
            objectType: 'boxes',
            actualValue: maxBoxes,
            minValue: 1,
            maxValue: 500,
            suggestion: Math.max(1, Math.min(500, maxBoxes))
          }
        });
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateMaxBoxesCount(source) {
  const startTime = performance.now();
  const result = validateMaxBoxesCount(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * Comprehensive drawing object count validation
 * Validates all drawing object count parameters in a single pass
 */
export function validateDrawingObjectCounts(source) {
  const violations = [];
  const lines = source.split('\n');
  
  const drawingObjectRules = [
    { param: 'max_lines_count', min: 1, max: 500, type: 'lines' },
    { param: 'max_labels_count', min: 1, max: 500, type: 'labels' },
    { param: 'max_boxes_count', min: 1, max: 500, type: 'boxes' },
    { param: 'max_polylines_count', min: 1, max: 100, type: 'polylines' },
    { param: 'max_tables_count', min: 1, max: 100, type: 'tables' }
  ];
  
  lines.forEach((line, lineIndex) => {
    drawingObjectRules.forEach(rule => {
      const regex = new RegExp(`(?:strategy|indicator)\\s*\\([^)]*${rule.param}\\s*=\\s*(\\d+)`, 'g');
      
      let match;
      while ((match = regex.exec(line)) !== null) {
        const value = parseInt(match[1]);
        
        if (value < rule.min || value > rule.max) {
          const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
          
          violations.push({
            line: lineIndex + 1,
            column: column,
            severity: 'error',
            message: `${rule.param} value ${value} is invalid. Must be between ${rule.min} and ${rule.max}.`,
            rule: 'TOO_MANY_DRAWING_OBJECTS',
            category: 'drawing_objects_validation',
            details: {
              objectType: rule.type,
              parameter: rule.param,
              actualValue: value,
              minValue: rule.min,
              maxValue: rule.max,
              suggestion: Math.max(rule.min, Math.min(rule.max, value))
            }
          });
        }
      }
    });
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateDrawingObjectCounts(source) {
  const startTime = performance.now();
  const result = validateDrawingObjectCounts(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * INPUT_TYPE_MISMATCH Validation
 * Validates input() function type consistency and parameter constraints
 */

/**
 * Extract input function calls and validate type consistency
 */
function extractInputFunctions(source) {
  const inputCalls = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Match input() function calls with comprehensive parameter extraction
    const inputRegex = /input\s*\(\s*([^)]+)\)/g;
    
    let match;
    while ((match = inputRegex.exec(line)) !== null) {
      const paramString = match[1];
      const column = line.indexOf(match[0]) + 1;
      
      // Parse parameters (simplified parsing)
      const params = parseInputParameters(paramString);
      
      inputCalls.push({
        line: lineIndex + 1,
        column: column,
        parameters: params,
        source: line.trim()
      });
    }
  });
  
  return inputCalls;
}

/**
 * Parse input() function parameters
 * Simplified parameter parsing for validation
 */
function parseInputParameters(paramString) {
  const params = {};
  
  // Extract defval (default value)
  const defvalMatch = paramString.match(/defval\s*=\s*([^,)]+)/);
  if (defvalMatch) {
    params.defval = defvalMatch[1].trim();
  } else {
    // First parameter is often the default value
    const firstParam = paramString.split(',')[0].trim();
    if (firstParam) {
      params.defval = firstParam;
    }
  }
  
  // Extract type
  const typeMatch = paramString.match(/type\s*=\s*([^,)]+)/);
  if (typeMatch) {
    params.type = typeMatch[1].trim();
  }
  
  // Extract title
  const titleMatch = paramString.match(/title\s*=\s*["']([^"']+)["']/);
  if (titleMatch) {
    params.title = titleMatch[1];
  }
  
  // Extract minval/maxval
  const minvalMatch = paramString.match(/minval\s*=\s*([^,)]+)/);
  if (minvalMatch) {
    params.minval = minvalMatch[1].trim();
  }
  
  const maxvalMatch = paramString.match(/maxval\s*=\s*([^,)]+)/);
  if (maxvalMatch) {
    params.maxval = maxvalMatch[1].trim();
  }
  
  return params;
}

/**
 * Infer type from default value
 */
function inferInputType(defval) {
  if (!defval) return 'unknown';
  
  // Remove quotes and whitespace
  const cleanValue = defval.replace(/["']/g, '').trim();
  
  // Check for boolean values
  if (cleanValue === 'true' || cleanValue === 'false') {
    return 'bool';
  }
  
  // Check for numeric values
  if (/^-?\d+$/.test(cleanValue)) {
    return 'int';
  }
  
  if (/^-?\d*\.\d+$/.test(cleanValue)) {
    return 'float';
  }
  
  // Check for string values (quoted or unquoted)
  if (defval.includes('"') || defval.includes("'")) {
    return 'string';
  }
  
  return 'string'; // Default assumption for unquoted values
}

/**
 * Compare types for compatibility
 */
function compareInputTypes(expectedType, actualType) {
  if (expectedType === actualType) {
    return { compatible: true, message: null };
  }
  
  // Type conversion rules
  const conversions = {
    'int': ['float'], // int can be used where float is expected
    'float': [], // float cannot be automatically converted
    'string': [], // string cannot be automatically converted
    'bool': [] // bool cannot be automatically converted
  };
  
  if (conversions[actualType] && conversions[actualType].includes(expectedType)) {
    return { compatible: true, message: `Automatic conversion from ${actualType} to ${expectedType}` };
  }
  
  return {
    compatible: false,
    message: `Type mismatch: expected ${expectedType}, got ${actualType}`
  };
}

/**
 * Validate input function type consistency
 */
export function validateInputTypes(source) {
  const violations = [];
  const inputCalls = extractInputFunctions(source);
  
  inputCalls.forEach(inputCall => {
    const { parameters, line, column } = inputCall;
    
    // Skip validation if we don't have enough information
    if (!parameters.defval) {
      return;
    }
    
    const inferredType = inferInputType(parameters.defval);
    
    // If explicit type is specified, validate against inferred type
    if (parameters.type) {
      const explicitType = parameters.type.replace(/["']/g, '');
      const typeComparison = compareInputTypes(explicitType, inferredType);
      
      if (!typeComparison.compatible) {
        violations.push({
          line: line,
          column: column,
          severity: 'error',
          message: `Input type mismatch: ${typeComparison.message}`,
          rule: 'INPUT_TYPE_MISMATCH',
          category: 'input_validation',
          details: {
            expectedType: explicitType,
            inferredType: inferredType,
            defaultValue: parameters.defval,
            suggestion: `Change type to '${inferredType}' or adjust default value`
          }
        });
      }
    }
    
    // Validate range constraints for numeric types
    if ((inferredType === 'int' || inferredType === 'float') && 
        (parameters.minval || parameters.maxval)) {
      
      const defaultValue = parseFloat(parameters.defval);
      
      if (parameters.minval) {
        const minValue = parseFloat(parameters.minval);
        if (defaultValue < minValue) {
          violations.push({
            line: line,
            column: column,
            severity: 'error',
            message: `Default value ${defaultValue} is below minimum value ${minValue}`,
            rule: 'INPUT_TYPE_MISMATCH',
            category: 'input_validation',
            details: {
              type: 'range_violation',
              defaultValue: defaultValue,
              minValue: minValue,
              suggestion: `Set default value to at least ${minValue}`
            }
          });
        }
      }
      
      if (parameters.maxval) {
        const maxValue = parseFloat(parameters.maxval);
        if (defaultValue > maxValue) {
          violations.push({
            line: line,
            column: column,
            severity: 'error',
            message: `Default value ${defaultValue} exceeds maximum value ${maxValue}`,
            rule: 'INPUT_TYPE_MISMATCH',
            category: 'input_validation',
            details: {
              type: 'range_violation',
              defaultValue: defaultValue,
              maxValue: maxValue,
              suggestion: `Set default value to at most ${maxValue}`
            }
          });
        }
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateInputTypes(source) {
  const startTime = performance.now();
  const result = validateInputTypes(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * FUNCTION_SIGNATURE_VALIDATION Implementation
 * Validates function calls against expected Pine Script v6 signatures
 */

/**
 * Extract function calls from source code
 */
export function extractFunctionCalls(source) {
  const functionCalls = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Regex to match function calls: functionName(parameters)
    const functionRegex = /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\(/g;
    
    let match;
    while ((match = functionRegex.exec(line)) !== null) {
      const functionName = match[1];
      const startPos = match.index;
      
      // Extract parameters (simplified - doesn't handle nested parentheses perfectly)
      const paramStart = line.indexOf('(', startPos) + 1;
      let paramEnd = -1;
      let parenCount = 1;
      
      for (let i = paramStart; i < line.length && parenCount > 0; i++) {
        if (line[i] === '(') parenCount++;
        if (line[i] === ')') parenCount--;
        if (parenCount === 0) {
          paramEnd = i;
          break;
        }
      }
      
      if (paramEnd > paramStart) {
        const paramString = line.substring(paramStart, paramEnd);
        const parameters = parseParameters(paramString);
        
        functionCalls.push({
          name: functionName,
          parameters: parameters,
          line: lineIndex + 1,
          column: startPos + 1,
          source: line.trim()
        });
      }
    }
  });
  
  return functionCalls;
}

/**
 * Parse function parameters from parameter string
 */
function parseParameters(paramString) {
  if (!paramString.trim()) {
    return [];
  }
  
  const parameters = [];
  const paramParts = paramString.split(',');
  
  paramParts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed) {
      // Check for named parameters (key=value)
      const namedMatch = trimmed.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
      if (namedMatch) {
        parameters.push({
          name: namedMatch[1],
          value: namedMatch[2].trim(),
          isNamed: true
        });
      } else {
        parameters.push({
          name: null,
          value: trimmed,
          isNamed: false
        });
      }
    }
  });
  
  return parameters;
}

/**
 * Infer parameter types from values
 */
export function inferParameterTypes(parameters) {
  return parameters.map(param => {
    const value = param.value;
    
    // String literals
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return { ...param, inferredType: 'string' };
    }
    
    // Boolean literals
    if (value === 'true' || value === 'false') {
      return { ...param, inferredType: 'bool' };
    }
    
    // Numeric literals
    if (/^-?\d+$/.test(value)) {
      return { ...param, inferredType: 'int' };
    }
    
    if (/^-?\d*\.\d+$/.test(value)) {
      return { ...param, inferredType: 'float' };
    }
    
    // Color constants
    if (value.startsWith('color.') || value.startsWith('#')) {
      return { ...param, inferredType: 'color' };
    }
    
    // Default to series or identifier
    return { ...param, inferredType: 'identifier' };
  });
}

/**
 * Get expected function signature from language reference
 * This would typically load from the language reference data
 */
export function getExpectedSignature(functionName) {
  // Simplified signature database - in practice, this would load from
  // the processed language reference data
  const signatures = {
    'strategy': {
      name: 'strategy',
      parameters: [
        { name: 'title', type: 'string', required: true },
        { name: 'shorttitle', type: 'string', required: false },
        { name: 'overlay', type: 'bool', required: false },
        { name: 'precision', type: 'int', required: false },
        { name: 'pyramiding', type: 'int', required: false }
      ]
    },
    'ta.sma': {
      name: 'ta.sma',
      parameters: [
        { name: 'source', type: 'series', required: true },
        { name: 'length', type: 'int', required: true }
      ]
    },
    'plot': {
      name: 'plot',
      parameters: [
        { name: 'series', type: 'series', required: true },
        { name: 'title', type: 'string', required: false },
        { name: 'color', type: 'color', required: false },
        { name: 'linewidth', type: 'int', required: false }
      ]
    }
  };
  
  return signatures[functionName] || null;
}

/**
 * Compare actual types with expected types
 */
export function compareTypes(actualType, expectedType) {
  const typeHierarchy = {
    'int': ['float', 'series'],
    'float': ['series'],
    'bool': ['series'],
    'string': [],
    'color': [],
    'series': [],
    'identifier': ['int', 'float', 'bool', 'string', 'color', 'series']
  };
  
  if (actualType === expectedType) {
    return { compatible: true, exact: true };
  }
  
  if (typeHierarchy[actualType] && typeHierarchy[actualType].includes(expectedType)) {
    return { compatible: true, exact: false };
  }
  
  return { compatible: false, exact: false };
}

/**
 * Validate function signatures against expected signatures
 */
export function validateFunctionSignatures(source) {
  const violations = [];
  const functionCalls = extractFunctionCalls(source);
  
  functionCalls.forEach(functionCall => {
    const expectedSig = getExpectedSignature(functionCall.name);
    
    if (!expectedSig) {
      // Unknown function - could be user-defined or library function
      return;
    }
    
    const typedParameters = inferParameterTypes(functionCall.parameters);
    
    // Validate parameter count
    const requiredParams = expectedSig.parameters.filter(p => p.required);
    if (typedParameters.length < requiredParams.length) {
      violations.push({
        line: functionCall.line,
        column: functionCall.column,
        severity: 'error',
        message: `Function '${functionCall.name}()' requires at least ${requiredParams.length} parameters, got ${typedParameters.length}`,
        rule: 'FUNCTION_SIGNATURE_VALIDATION',
        category: 'function_signature',
        details: {
          functionName: functionCall.name,
          expectedMinParams: requiredParams.length,
          actualParams: typedParameters.length,
          missingParams: requiredParams.slice(typedParameters.length).map(p => p.name)
        }
      });
    }
    
    // Validate parameter types
    typedParameters.forEach((param, index) => {
      if (index < expectedSig.parameters.length) {
        const expectedParam = expectedSig.parameters[index];
        const typeComparison = compareTypes(param.inferredType, expectedParam.type);
        
        if (!typeComparison.compatible) {
          violations.push({
            line: functionCall.line,
            column: functionCall.column,
            severity: 'error',
            message: `Parameter ${index + 1} of '${functionCall.name}()' expects ${expectedParam.type}, got ${param.inferredType}`,
            rule: 'FUNCTION_SIGNATURE_VALIDATION',
            category: 'function_signature',
            details: {
              functionName: functionCall.name,
              parameterIndex: index,
              parameterName: expectedParam.name,
              expectedType: expectedParam.type,
              actualType: param.inferredType,
              actualValue: param.value
            }
          });
        }
      }
    });
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateFunctionSignatures(source) {
  const startTime = performance.now();
  const result = validateFunctionSignatures(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * Helper functions for modular testing
 */
export function validateParameterCount(functionCall, expectedSignature) {
  const requiredParams = expectedSignature.parameters.filter(p => p.required);
  const actualParamCount = functionCall.parameters.length;
  
  if (actualParamCount < requiredParams.length) {
    return {
      valid: false,
      error: `Function '${functionCall.name}()' requires at least ${requiredParams.length} parameters, got ${actualParamCount}`,
      expectedMin: requiredParams.length,
      actual: actualParamCount
    };
  }
  
  if (actualParamCount > expectedSignature.parameters.length) {
    return {
      valid: false,
      error: `Function '${functionCall.name}()' accepts at most ${expectedSignature.parameters.length} parameters, got ${actualParamCount}`,
      expectedMax: expectedSignature.parameters.length,
      actual: actualParamCount
    };
  }
  
  return { valid: true };
}

export function validateParameterTypes(functionCall, expectedSignature) {
  const violations = [];
  const typedParameters = inferParameterTypes(functionCall.parameters);
  
  typedParameters.forEach((param, index) => {
    if (index < expectedSignature.parameters.length) {
      const expectedParam = expectedSignature.parameters[index];
      const typeComparison = compareTypes(param.inferredType, expectedParam.type);
      
      if (!typeComparison.compatible) {
        violations.push({
          parameterIndex: index,
          parameterName: expectedParam.name,
          expectedType: expectedParam.type,
          actualType: param.inferredType,
          actualValue: param.value,
          error: `Parameter ${index + 1} expects ${expectedParam.type}, got ${param.inferredType}`
        });
      }
    }
  });
  
  return { valid: violations.length === 0, violations };
}

/**
 * PARAMETER_RANGE_VALIDATION Implementation
 * Validates that numeric parameters are within acceptable ranges
 */

/**
 * Define parameter range constraints
 * These would typically be loaded from validation-rules.json
 */
const PARAMETER_RANGES = {
  'strategy': {
    'precision': { min: 0, max: 8, type: 'int' },
    'pyramiding': { min: 0, max: 1000, type: 'int' },
    'calc_on_order_fills': { values: [true, false], type: 'bool' },
    'calc_on_every_tick': { values: [true, false], type: 'bool' }
  },
  'indicator': {
    'precision': { min: 0, max: 8, type: 'int' },
    'max_bars_back': { min: 1, max: 5000, type: 'int' },
    'max_lines_count': { min: 1, max: 500, type: 'int' },
    'max_labels_count': { min: 1, max: 500, type: 'int' },
    'max_boxes_count': { min: 1, max: 500, type: 'int' }
  },
  'plot': {
    'linewidth': { min: 1, max: 4, type: 'int' },
    'transp': { min: 0, max: 100, type: 'int' }
  },
  'input': {
    'minval': { type: 'numeric' },
    'maxval': { type: 'numeric' },
    'step': { min: 0, type: 'numeric' }
  }
};

/**
 * Extract parameter values for range validation
 */
function extractParameterRanges(source) {
  const parameterValues = [];
  const functionCalls = extractFunctionCalls(source);
  
  functionCalls.forEach(functionCall => {
    const constraints = PARAMETER_RANGES[functionCall.name];
    if (!constraints) return;
    
    functionCall.parameters.forEach(param => {
      if (param.isNamed && constraints[param.name]) {
        const constraint = constraints[param.name];
        const value = parseParameterValue(param.value, constraint.type);
        
        parameterValues.push({
          functionName: functionCall.name,
          parameterName: param.name,
          value: value,
          constraint: constraint,
          location: {
            line: functionCall.line,
            column: functionCall.column
          }
        });
      }
    });
  });
  
  return parameterValues;
}

/**
 * Parse parameter value according to expected type
 */
function parseParameterValue(valueString, expectedType) {
  const cleanValue = valueString.trim();
  
  switch (expectedType) {
    case 'int':
      return parseInt(cleanValue);
    case 'float':
    case 'numeric':
      return parseFloat(cleanValue);
    case 'bool':
      return cleanValue === 'true';
    default:
      return cleanValue;
  }
}

/**
 * Validate parameter ranges
 */
export function validateParameterRanges(source) {
  const violations = [];
  const parameterValues = extractParameterRanges(source);
  
  parameterValues.forEach(paramValue => {
    const { value, constraint, functionName, parameterName, location } = paramValue;
    
    // Skip validation if value couldn't be parsed
    if (isNaN(value) && (constraint.type === 'int' || constraint.type === 'float' || constraint.type === 'numeric')) {
      return;
    }
    
    // Range validation
    if (constraint.min !== undefined && value < constraint.min) {
      violations.push({
        line: location.line,
        column: location.column,
        severity: 'error',
        message: `Parameter '${parameterName}' in ${functionName}() is below minimum value. Got ${value}, minimum is ${constraint.min}`,
        rule: 'PARAMETER_RANGE_VALIDATION',
        category: 'parameter_validation',
        details: {
          functionName: functionName,
          parameterName: parameterName,
          actualValue: value,
          minValue: constraint.min,
          constraint: constraint,
          suggestion: constraint.min
        }
      });
    }
    
    if (constraint.max !== undefined && value > constraint.max) {
      violations.push({
        line: location.line,
        column: location.column,
        severity: 'error',
        message: `Parameter '${parameterName}' in ${functionName}() exceeds maximum value. Got ${value}, maximum is ${constraint.max}`,
        rule: 'PARAMETER_RANGE_VALIDATION',
        category: 'parameter_validation',
        details: {
          functionName: functionName,
          parameterName: parameterName,
          actualValue: value,
          maxValue: constraint.max,
          constraint: constraint,
          suggestion: constraint.max
        }
      });
    }
    
    // Enum/values validation
    if (constraint.values && !constraint.values.includes(value)) {
      violations.push({
        line: location.line,
        column: location.column,
        severity: 'error',
        message: `Parameter '${parameterName}' in ${functionName}() has invalid value. Got ${value}, expected one of: ${constraint.values.join(', ')}`,
        rule: 'PARAMETER_RANGE_VALIDATION',
        category: 'parameter_validation',
        details: {
          functionName: functionName,
          parameterName: parameterName,
          actualValue: value,
          allowedValues: constraint.values,
          constraint: constraint,
          suggestion: constraint.values[0]
        }
      });
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateParameterRanges(source) {
  const startTime = performance.now();
  const result = validateParameterRanges(source);
  const endTime = performance.now();
  
  return {
    ...result,
    metrics: { validationTimeMs: endTime - startTime }
  };
}

/**
 * SYNTAX_COMPATIBILITY_VALIDATION Implementation  
 * Validates Pine Script v6 syntax compatibility and migration requirements
 */

/**
 * Extract deprecated function calls that need migration to v6
 */
function extractDeprecatedFunctionCalls(source) {
  const deprecatedFunctions = {
    'iff': 'Deprecated in v6. Use conditional operator ?: instead',
    'na': 'Use na constant instead of na() function',
    'nz': 'Replaced with nz() built-in function with updated signature',
    'security': 'Replaced with request.security() in v6',
    'study': 'Replaced with indicator() in v6',
    'color.new': 'Use color.rgb() or color constants in v6',
    'input.resolution': 'Use input.timeframe() in v6',
    'input.symbol': 'Use input.symbol() with updated parameters in v6'
  };
  
  const deprecatedCalls = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    Object.keys(deprecatedFunctions).forEach(deprecatedFunc => {
      const pattern = new RegExp(`\\b${deprecatedFunc}\\s*\\(`, 'g');
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const column = match.index + 1;
        
        deprecatedCalls.push({
          name: deprecatedFunc,
          line: lineIndex + 1,
          column: column,
          message: deprecatedFunctions[deprecatedFunc],
          modernEquivalent: getModernEquivalent(deprecatedFunc),
          source: line.trim()
        });
      }
    });
  });
  
  return deprecatedCalls;
}

/**
 * Get modern equivalent for deprecated functions
 */
function getModernEquivalent(deprecatedFunction) {
  const equivalents = {
    'iff': 'condition ? value1 : value2',
    'na': 'na',
    'nz': 'nz',
    'security': 'request.security',
    'study': 'indicator',
    'color.new': 'color.rgb',
    'input.resolution': 'input.timeframe',
    'input.symbol': 'input.symbol'
  };
  
  return equivalents[deprecatedFunction] || 'unknown';
}

/**
 * Analyze version directive compatibility
 */
function analyzeVersionDirective(source) {
  const versionPattern = /\/\/@version\s*=\s*(\d+)/;
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(versionPattern);
    if (match) {
      const version = parseInt(match[1]);
      return {
        version: version,
        line: i + 1,
        isV6Compatible: version >= 6,
        source: lines[i].trim()
      };
    }
  }
  
  // No version directive found
  return {
    version: null,
    line: 0,
    isV6Compatible: false,
    source: null,
    warning: 'No version directive found. Add //@version=6 for v6 compatibility'
  };
}

/**
 * Validate namespace requirements for v6 functions
 */
function validateNamespaceRequirements(source) {
  const namespacedFunctions = {
    'sma': { namespace: 'ta', modernForm: 'ta.sma' },
    'ema': { namespace: 'ta', modernForm: 'ta.ema' },
    'rsi': { namespace: 'ta', modernForm: 'ta.rsi' },
    'macd': { namespace: 'ta', modernForm: 'ta.macd' },
    'stoch': { namespace: 'ta', modernForm: 'ta.stoch' },
    'atr': { namespace: 'ta', modernForm: 'ta.atr' },
    'highest': { namespace: 'ta', modernForm: 'ta.highest' },
    'lowest': { namespace: 'ta', modernForm: 'ta.lowest' },
    'crossover': { namespace: 'ta', modernForm: 'ta.crossover' },
    'crossunder': { namespace: 'ta', modernForm: 'ta.crossunder' },
    'abs': { namespace: 'math', modernForm: 'math.abs' },
    'floor': { namespace: 'math', modernForm: 'math.floor' },
    'ceil': { namespace: 'math', modernForm: 'math.ceil' },
    'round': { namespace: 'math', modernForm: 'math.round' },
    'max': { namespace: 'math', modernForm: 'math.max' },
    'min': { namespace: 'math', modernForm: 'math.min' },
    'pow': { namespace: 'math', modernForm: 'math.pow' },
    'sqrt': { namespace: 'math', modernForm: 'math.sqrt' }
  };
  
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    Object.keys(namespacedFunctions).forEach(funcName => {
      // Look for function calls without proper namespace
      const pattern = new RegExp(`\\b(?!(?:ta|math|str|array|matrix|color)\\.)${funcName}\\s*\\(`, 'g');
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const column = match.index + 1;
        const functionInfo = namespacedFunctions[funcName];
        
        violations.push({
          functionName: funcName,
          line: lineIndex + 1,
          column: column,
          requiredNamespace: functionInfo.namespace,
          modernForm: functionInfo.modernForm,
          source: line.trim()
        });
      }
    });
  });
  
  return violations;
}

/**
 * Core syntax compatibility validation function
 * Detects deprecated functions, version issues, and namespace violations
 * @param {string} source - Pine Script source code
 * @returns {Object} - Comprehensive syntax compatibility validation result
 */
export function validateSyntaxCompatibility(source) {
  const startTime = performance.now();
  
  // Phase 1: Extract deprecated function calls
  const deprecatedCalls = extractDeprecatedFunctionCalls(source);
  
  // Phase 2: Analyze version directive
  const versionAnalysis = analyzeVersionDirective(source);
  
  // Phase 3: Validate namespace requirements
  const namespaceViolations = validateNamespaceRequirements(source);
  
  const violations = [];
  
  // Create violations for deprecated functions
  deprecatedCalls.forEach(call => {
    violations.push({
      line: call.line,
      column: call.column,
      severity: 'error',
      message: `Function '${call.name}()' is deprecated in Pine Script v6. Use '${call.modernEquivalent}()' instead.`,
      rule: 'SYNTAX_COMPATIBILITY_VALIDATION',
      category: 'syntax_compatibility',
      details: {
        deprecatedFunction: call.name,
        modernEquivalent: call.modernEquivalent,
        migrationRequired: true
      }
    });
  });
  
  // Create violations for version compatibility issues
  if (versionAnalysis.version && versionAnalysis.version < 6) {
    violations.push({
      line: versionAnalysis.line,
      column: 1,
      severity: 'warning',
      message: `Pine Script v${versionAnalysis.version} is outdated. Consider upgrading to v6 for latest features and compatibility.`,
      rule: 'SYNTAX_COMPATIBILITY_VALIDATION',
      category: 'syntax_compatibility',
      details: {
        currentVersion: versionAnalysis.version,
        recommendedVersion: 6,
        upgradeRecommended: true
      }
    });
  }
  
  // Create violations for namespace requirements
  namespaceViolations.forEach(violation => {
    violations.push({
      line: violation.line,
      column: violation.column,
      severity: 'error',
      message: `Function '${violation.functionName}()' requires '${violation.requiredNamespace}' namespace in v6. Use '${violation.modernForm}()'.`,
      rule: 'SYNTAX_COMPATIBILITY_VALIDATION',
      category: 'syntax_compatibility',
      details: {
        functionName: violation.functionName,
        requiredNamespace: violation.requiredNamespace,
        modernForm: violation.modernForm,
        namespaceRequired: true
      }
    });
  });
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  return {
    success: true,
    hasSyntaxCompatibilityError: violations.length > 0,
    violations,
    metrics: {
      executionTime,
      deprecatedFunctionsFound: deprecatedCalls.length,
      namespaceViolationsFound: namespaceViolations.length,
      versionCompatible: versionAnalysis.isV6Compatible,
      totalViolations: violations.length
    },
    details: {
      versionAnalysis,
      deprecatedCalls,
      namespaceViolations
    }
  };
}

/**
 * Quick syntax compatibility validation function for atomic testing integration
 * Implements the same pattern as quickValidateFunctionSignatures for consistency
 * @param {string} source - Pine Script source code
 * @returns {Object} - Validation result matching test expectations
 */
export function quickValidateSyntaxCompatibility(source) {
  return validateSyntaxCompatibility(source);
}

/**
 * Validate Pine Script code for builtin namespace conflicts
 * Phase 1: Regex-based detection for variable assignments
 * 
 * @param {string} source - Pine Script source code
 * @returns {ValidationResult} - Validation result with namespace violations
 */
export function validateBuiltinNamespace(source) {
  const startTime = performance.now();
  const violations = [];
  
  // Reserved namespaces from validation-rules.json
  const reservedNamespaces = [
    "position", "strategy", "ta", "math", "array", "matrix", "color", 
    "alert", "time", "str", "table", "label", "line", "box", "polyline",
    "plot", "hline", "input", "barstate", "session", "syminfo", 
    "location", "shape", "size", "scale", "extend", "xloc", "yloc",
    "order", "bool", "int", "float", "string"
  ];
  
  const lines = source.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // Create a single regex that can find ALL namespace conflicts on a line
    // Pattern: optionally var type, then capture any reserved namespace followed by =
    const allNamespacesPattern = new RegExp(
      `\\b(?:var\\s+[\\w<>\\.]+\\s+)?(${reservedNamespaces.join('|')})\\s*=`, 
      'g'
    );
    
    let match;
    while ((match = allNamespacesPattern.exec(line)) !== null) {
      const namespace = match[1];
      const column = match.index + match[0].indexOf(namespace) + 1;
      
      violations.push({
        code: 'INVALID_OBJECT_NAME_BUILTIN',
        rule: 'INVALID_OBJECT_NAME_BUILTIN',
        message: `Invalid object name: ${namespace}. Namespaces of built-ins cannot be used.`,
        severity: 'error',
        category: 'naming_validation',
        location: {
          line: lineIndex + 1,
          column: column,
          source: line.trim()
        },
        metadata: {
          conflictingNamespace: namespace,
          suggestedFix: `Rename variable to avoid conflict (e.g., '${namespace}' → '${namespace}State', '${namespace}' → 'my${namespace.charAt(0).toUpperCase() + namespace.slice(1)}')`
        }
      });
    }
  }
  
  const endTime = performance.now();
  
  return {
    violations,
    warnings: [],
    metrics: {
      validationTimeMs: endTime - startTime,
      functionsAnalyzed: 0, // Not function-based validation
      linesAnalyzed: lines.length
    }
  };
}

/**
 * Quick validation wrapper for INVALID_OBJECT_NAME_BUILTIN
 * Optimized for integration with index.js validation flow
 * 
 * @param {string} source - Pine Script source code
 * @returns {ValidationResult} - Quick validation result
 */
export function quickValidateBuiltinNamespace(source) {
  const startTime = performance.now();
  
  try {
    const result = validateBuiltinNamespace(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasNamespaceError: result.violations.some(v => v.rule === 'INVALID_OBJECT_NAME_BUILTIN'),
      violations: result.violations.filter(v => v.rule === 'INVALID_OBJECT_NAME_BUILTIN'),
      metrics: {
        validationTimeMs: endTime - startTime
      }
    };
    
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasNamespaceError: false,
      violations: [],
      error: error.message,
      metrics: {
        validationTimeMs: endTime - startTime
      }
    };
  }
}