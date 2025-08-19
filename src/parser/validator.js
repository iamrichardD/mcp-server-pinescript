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
  
  // Helper function to check if a rule exists in the nested structure
  function hasValidationRule(errorCode) {
    if (rulesToUse.functionValidationRules) {
      for (const funcRule of Object.values(rulesToUse.functionValidationRules)) {
        if (funcRule.argumentConstraints) {
          for (const argConstraint of Object.values(funcRule.argumentConstraints)) {
            if (argConstraint.validation_constraints && 
                argConstraint.validation_constraints.errorCode === errorCode) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  
  // Short title validation (highest priority)
  if (hasValidationRule('SHORT_TITLE_TOO_LONG')) {
    validationPromises.push(validateShortTitle(source));
  }
  
  // Parameter constraint validations
  if (hasValidationRule('INVALID_PRECISION')) {
    validationPromises.push(quickValidatePrecision(source));
  }
  
  if (hasValidationRule('INVALID_MAX_BARS_BACK')) {
    validationPromises.push(quickValidateMaxBarsBack(source));
  }
  
  // Drawing object validations
  if (hasValidationRule('INVALID_MAX_LINES_COUNT') || 
      hasValidationRule('INVALID_MAX_LABELS_COUNT') || 
      hasValidationRule('INVALID_MAX_BOXES_COUNT')) {
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
        metadata: {
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
              metadata: {
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
    // Pattern 1: Named parameter - shorttitle="value"
    const namedRegex = /(?:strategy|indicator)\s*\(\s*[^,]*,\s*shorttitle\s*=\s*["']([^"']*)["']/g;
    
    let match;
    while ((match = namedRegex.exec(line)) !== null) {
      const shortTitle = match[1];
      const shortTitleLength = shortTitle.length;
      const functionName = line.includes('strategy') ? 'strategy' : 'indicator';
      
      if (shortTitleLength > 10) {
        const column = line.indexOf(match[0]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `SHORT_TITLE_TOO_LONG: Title "${shortTitle}" is too long (${shortTitleLength} characters). Must be 10 characters or less.`,
          rule: 'SHORT_TITLE_TOO_LONG',
          category: 'parameter_validation',
          metadata: {
            actualValue: shortTitle,
            actualLength: shortTitleLength,
            functionName: functionName,
            parameterName: 'shorttitle',
            maxLength: 10,
            shortTitle: shortTitle,
            suggestion: shortTitle.substring(0, 10)
          }
        });
      }
    }
    
    // Pattern 2: Positional parameter - strategy("title", "shorttitle") or indicator("title", "shorttitle")
    const positionalRegex = /(strategy|indicator)\s*\(\s*["']([^"']*)["']\s*,\s*["']([^"']*)["']/g;
    
    while ((match = positionalRegex.exec(line)) !== null) {
      const functionName = match[1];
      const shortTitle = match[3]; // Second parameter is shorttitle
      const shortTitleLength = shortTitle.length;
      
      if (shortTitleLength > 10) {
        const column = line.indexOf(match[0]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `SHORT_TITLE_TOO_LONG: Title "${shortTitle}" is too long (${shortTitleLength} characters). Must be 10 characters or less.`,
          rule: 'SHORT_TITLE_TOO_LONG',
          category: 'parameter_validation',
          metadata: {
            actualValue: shortTitle,
            actualLength: shortTitleLength,
            functionName: functionName,
            parameterName: 'shorttitle',
            maxLength: 10,
            shortTitle: shortTitle,
            suggestion: shortTitle.substring(0, 10)
          }
        });
      }
    }
  });
  
  return {
    success: true,
    hasShortTitleError: violations.length > 0,
    violations: violations.map(v => ({
      ...v,
      metadata: {
        ...v.metadata,
        actualValue: v.metadata.actualValue,
        actualLength: v.metadata.actualLength,
        functionName: v.metadata.functionName,
        parameterName: v.metadata.parameterName
      }
    }))
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
    // Skip commented lines
    if (line.trim().startsWith('//')) {
      return;
    }
    
    // Match strategy() or indicator() calls with precision parameter
    // Updated regex to capture any value (including non-numeric)
    const precisionRegex = /(strategy|indicator)\s*\([^)]*precision\s*=\s*([^,)]+)/g;
    
    let match;
    while ((match = precisionRegex.exec(line)) !== null) {
      const functionName = match[1]; // Extract function name (strategy or indicator)
      const precisionValue = match[2].trim();
      const column = line.indexOf(match[0]) + match[0].indexOf(match[2]) + 1;
      
      // Check if it's a quoted string (non-numeric)
      if ((precisionValue.startsWith('"') && precisionValue.endsWith('"')) ||
          (precisionValue.startsWith("'") && precisionValue.endsWith("'"))) {
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_PRECISION: precision must be an integer between 0 and 8`,
          rule: 'INVALID_PRECISION',
          category: 'parameter_validation',
          metadata: {
            actualValue: precisionValue,
            minValue: 0,
            maxValue: 8,
            functionName: functionName,
            parameterName: 'precision',
            suggestion: 'Use an integer value between 0 and 8'
          }
        });
        return;
      }
      
      // Try to parse as number
      const numericValue = parseFloat(precisionValue);
      
      // Check if it's not a valid number
      if (isNaN(numericValue)) {
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_PRECISION: precision must be an integer between 0 and 8`,
          rule: 'INVALID_PRECISION',
          category: 'parameter_validation',
          metadata: {
            actualValue: precisionValue,
            minValue: 0,
            maxValue: 8,
            functionName: functionName,
            parameterName: 'precision',
            suggestion: 'Use an integer value between 0 and 8'
          }
        });
        return;
      }
      
      // Check if it's not an integer (has decimal places)
      if (!Number.isInteger(numericValue)) {
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_PRECISION: precision must be an integer between 0 and 8`,
          rule: 'INVALID_PRECISION',
          category: 'parameter_validation',
          metadata: {
            actualValue: numericValue,
            minValue: 0,
            maxValue: 8,
            functionName: functionName,
            parameterName: 'precision',
            suggestion: Math.floor(numericValue)
          }
        });
        return;
      }
      
      // Finally check the range (convert to integer)
      const precision = parseInt(precisionValue);
      if (precision < 0 || precision > 8) {
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_PRECISION: precision must be between 0 and 8`,
          rule: 'INVALID_PRECISION',
          category: 'parameter_validation',
          metadata: {
            actualValue: precision,
            minValue: 0,
            maxValue: 8,
            functionName: functionName,
            parameterName: 'precision',
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
  
  try {
    const result = validatePrecision(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasPrecisionError: result.violations.length > 0,
      violations: result.violations,
      warnings: result.warnings,
      metrics: { validationTimeMs: endTime - startTime }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasPrecisionError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
}

/**
 * INVALID_MAX_BARS_BACK Validation
 * Validates max_bars_back parameter constraints
 */
export function validateMaxBarsBack(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Skip commented lines
    if (line.trim().startsWith('//')) {
      return;
    }
    
    // Match max_bars_back parameter in strategy() or indicator() calls
    // Updated regex to capture any numeric value (including floats)
    const maxBarsBackRegex = /(strategy|indicator)\s*\([^)]*max_bars_back\s*=\s*([+-]?\d*\.?\d+)/g;
    
    let match;
    while ((match = maxBarsBackRegex.exec(line)) !== null) {
      const functionName = match[1]; // Extract function name (strategy or indicator)
      const valueString = match[2];
      const numericValue = parseFloat(valueString);
      const isInteger = Number.isInteger(numericValue);
      
      // Check if it's not an integer
      if (!isInteger) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[2]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_MAX_BARS_BACK: max_bars_back must be an integer`,
          rule: 'INVALID_MAX_BARS_BACK',
          category: 'parameter_validation',
          metadata: {
            actualValue: numericValue,
            minValue: 1,
            maxValue: 5000,
            functionName: functionName,
            parameterName: 'max_bars_back',
            suggestion: Math.floor(numericValue)
          }
        });
        continue;
      }
      
      const maxBarsBack = parseInt(valueString);
      
      // Validate reasonable range (example constraint)
      if (maxBarsBack < 1 || maxBarsBack > 5000) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[2]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_MAX_BARS_BACK: max_bars_back must be between 1 and 5000`,
          rule: 'INVALID_MAX_BARS_BACK',
          category: 'parameter_validation',
          metadata: {
            actualValue: maxBarsBack,
            minValue: 1,
            maxValue: 5000,
            functionName: functionName,
            parameterName: 'max_bars_back',
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
  
  try {
    const result = validateMaxBarsBack(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasMaxBarsBackError: result.violations.length > 0,
      violations: result.violations,
      warnings: result.warnings,
      metrics: { validationTimeMs: endTime - startTime }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasMaxBarsBackError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
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
    const maxLinesRegex = /(strategy|indicator)\s*\([^)]*max_lines_count\s*=\s*(-?\d+)/g;
    
    let match;
    while ((match = maxLinesRegex.exec(line)) !== null) {
      const functionName = match[1];
      const maxLines = parseInt(match[2]);
      
      if (maxLines < 1 || maxLines > 500) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[2]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `INVALID_MAX_LINES_COUNT: max_lines_count value ${maxLines} is invalid. Must be between 1 and 500.`,
          rule: 'INVALID_MAX_LINES_COUNT',
          category: 'drawing_objects_validation',
          metadata: {
            objectType: 'lines',
            actualValue: maxLines,
            minValue: 1,
            maxValue: 500,
            suggestion: Math.max(1, Math.min(500, maxLines)),
            functionName: functionName,
            parameterName: 'max_lines_count'
          }
        });
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateMaxLinesCount(source) {
  const startTime = performance.now();
  
  try {
    const result = validateMaxLinesCount(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasMaxLinesCountError: result.violations.length > 0,
      violations: result.violations,
      warnings: result.warnings,
      metrics: { validationTimeMs: endTime - startTime }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasMaxLinesCountError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
}

/**
 * Validate max_labels_count parameter
 */
export function validateMaxLabelsCount(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const maxLabelsRegex = /(strategy|indicator)\s*\([^)]*max_labels_count\s*=\s*(-?\d+)/g;
    
    let match;
    while ((match = maxLabelsRegex.exec(line)) !== null) {
      const functionName = match[1]; const maxLabels = parseInt(match[2]);
      
      if (maxLabels < 1 || maxLabels > 500) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `max_labels_count value ${maxLabels} is invalid. Must be between 1 and 500.`,
          rule: 'INVALID_MAX_LABELS_COUNT',
          category: 'drawing_objects_validation',
          metadata: {
            objectType: 'labels',
            actualValue: maxLabels,
            minValue: 1,
            maxValue: 500,
            suggestion: Math.max(1, Math.min(500, maxLabels)),
            functionName: functionName,
            parameterName: 'max_labels_count'
          }
        });
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateMaxLabelsCount(source) {
  const startTime = performance.now();
  
  try {
    const result = validateMaxLabelsCount(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasMaxLabelsCountError: result.violations.length > 0,
      violations: result.violations,
      warnings: result.warnings,
      metrics: { validationTimeMs: endTime - startTime }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasMaxLabelsCountError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
}

/**
 * Validate max_boxes_count parameter
 */
export function validateMaxBoxesCount(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const maxBoxesRegex = /(strategy|indicator)\s*\([^)]*max_boxes_count\s*=\s*(-?\d+)/g;
    
    let match;
    while ((match = maxBoxesRegex.exec(line)) !== null) {
      const functionName = match[1]; const maxBoxes = parseInt(match[2]);
      
      if (maxBoxes < 1 || maxBoxes > 500) {
        const column = line.indexOf(match[0]) + match[0].indexOf(match[1]) + 1;
        
        violations.push({
          line: lineIndex + 1,
          column: column,
          severity: 'error',
          message: `max_boxes_count value ${maxBoxes} is invalid. Must be between 1 and 500.`,
          rule: 'INVALID_MAX_BOXES_COUNT',
          category: 'drawing_objects_validation',
          metadata: {
            objectType: 'boxes',
            actualValue: maxBoxes,
            minValue: 1,
            maxValue: 500,
            suggestion: Math.max(1, Math.min(500, maxBoxes)),
            functionName: functionName,
            parameterName: 'max_boxes_count'
          }
        });
      }
    }
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateMaxBoxesCount(source) {
  const startTime = performance.now();
  
  try {
    const result = validateMaxBoxesCount(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasMaxBoxesCountError: result.violations.length > 0,
      violations: result.violations,
      warnings: result.warnings,
      metrics: { validationTimeMs: endTime - startTime }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasMaxBoxesCountError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
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
            metadata: {
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
  
  try {
    // Run all individual validators in parallel for better performance
    const [linesResult, labelsResult, boxesResult] = await Promise.all([
      quickValidateMaxLinesCount(source),
      quickValidateMaxLabelsCount(source),
      quickValidateMaxBoxesCount(source)
    ]);
    
    // Combine all violations
    const allViolations = [
      ...linesResult.violations,
      ...labelsResult.violations,  
      ...boxesResult.violations
    ];
    
    const endTime = performance.now();
    
    return {
      success: true,
      hasDrawingObjectCountError: allViolations.length > 0,
      hasMaxLinesCountError: linesResult.hasMaxLinesCountError,
      hasMaxLabelsCountError: labelsResult.hasMaxLabelsCountError,
      hasMaxBoxesCountError: boxesResult.hasMaxBoxesCountError,
      violations: allViolations,
      warnings: [],
      metrics: { validationTimeMs: endTime - startTime }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasDrawingObjectCountError: false,
      hasMaxLinesCountError: false,
      hasMaxLabelsCountError: false,
      hasMaxBoxesCountError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
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
  const functionCalls = extractFunctionCalls(source);
  
  functionCalls.forEach(functionCall => {
    const { name, parameters, line, column } = functionCall;
    const expectedSignature = getExpectedTypes(name);
    
    // Skip validation for unknown functions
    if (!expectedSignature.params || expectedSignature.params.length === 0) {
      return;
    }
    
    // Validate each parameter type
    parameters.forEach((paramValue, index) => {
      if (index < expectedSignature.params.length) {
        const expectedParam = expectedSignature.params[index];
        const actualType = inferParameterTypes(paramValue);
        const typeComparison = compareTypes(expectedParam.type, actualType);
        
        if (!typeComparison.compatible) {
          violations.push({
            line: line,
            column: column,
            severity: 'error',
            message: `INPUT_TYPE_MISMATCH: Parameter ${index + 1} of '${name}()' expects ${expectedParam.type}, got ${actualType}`,
            rule: 'INPUT_TYPE_MISMATCH',
            category: 'type_validation',
            functionName: name,
            parameterIndex: index,
            parameterName: expectedParam.name,
            expectedType: expectedParam.type,
            actualType: actualType,
            actualValue: paramValue,
            reason: typeComparison.reason || 'type_incompatible',
            metadata: {
              functionName: name,
              parameterIndex: index,
              parameterName: expectedParam.name,
              expectedType: expectedParam.type,
              actualType: actualType,
              actualValue: paramValue,
              suggestion: `Expected ${expectedParam.type}, but got ${actualType}`
            }
          });
        }
      }
    });
  });
  
  return { violations, warnings: [] };
}

export async function quickValidateInputTypes(source) {
  const startTime = performance.now();
  
  try {
    const result = validateInputTypes(source);
    const functionCalls = extractFunctionCalls(source);
    const endTime = performance.now();
    
    // Calculate type checks performed
    let typeChecksPerformed = 0;
    functionCalls.forEach(functionCall => {
      const expectedSignature = getExpectedTypes(functionCall.name);
      if (expectedSignature.params && expectedSignature.params.length > 0) {
        typeChecksPerformed += Math.min(functionCall.parameters.length, expectedSignature.params.length);
      }
    });
    
    return {
      success: true,
      hasInputTypesError: result.violations.length > 0,
      violations: result.violations,
      warnings: result.warnings,
      metrics: { 
        validationTimeMs: endTime - startTime,
        functionsAnalyzed: functionCalls.length,
        typeChecksPerformed: typeChecksPerformed
      }
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasInputTypesError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { 
        validationTimeMs: endTime - startTime,
        functionsAnalyzed: 0,
        typeChecksPerformed: 0
      }
    };
  }
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
      
      if (paramEnd >= paramStart) {
        const paramString = line.substring(paramStart, paramEnd);
        const parameters = parseParameters(paramString);
        
        functionCalls.push({
          name: functionName,
          parameters: parameters.map(p => p.value),
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
  // Handle single string parameter (test interface)
  if (typeof parameters === "string") {
    const value = parameters;
    
    // Guard against null/undefined values
    if (!value) {
      return "unknown";
    }

    // String literals
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return "string";
    }
    
    // Boolean literals
    if (value === "true" || value === "false") {
      return "bool";
    }
    
    // Numeric literals
    if (/^-?\d+$/.test(value)) {
      return "int";
    }
    
    if (/^-?\d*\.\d+$/.test(value)) {
      return "float";
    }
    
    // Pine Script series variables
    if (['close', 'open', 'high', 'low', 'volume'].includes(value)) {
      return 'series float';
    }
    
    // Function calls - basic parsing for return type
    if (value.includes('ta.')) {
      return 'series float'; // Most ta.* functions return series
    }
    
    if (value.includes('math.')) {
      return 'float'; // Most math.* functions return float
    }
    
    // Unknown function calls
    if (value.includes('(') && value.includes(')')) {
      return 'function_result'; // Function calls return generic function result
    }
    
    // Color constants
    if (value.startsWith("color.") || value.startsWith("#")) {
      return "color";
    }
    
    // Default to series or identifier
    return "identifier";
  }
  
  // Handle array of parameter objects (existing internal interface)
  return parameters.map(param => {
    const value = param.value;
    
    // Guard against null/undefined values
    if (!value) {
      return { ...param, inferredType: "unknown" };
    }

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return { ...param, inferredType: "string" };
    }
    
    // Boolean literals
    if (value === "true" || value === "false") {
      return { ...param, inferredType: "bool" };
    }
    
    // Numeric literals
    if (/^-?\d+$/.test(value)) {
      return { ...param, inferredType: "int" };
    }
    
    if (/^-?\d*\.\d+$/.test(value)) {
      return { ...param, inferredType: "float" };
    }
    
    // Color constants
    if (value.startsWith("color.") || value.startsWith("#")) {
      return { ...param, inferredType: "color" };
    }
    
    // Default to series or identifier
    return { ...param, inferredType: "identifier" };
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
        { name: 'source', type: 'series int/float', required: true },
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
    ,
    'alert': {
      name: 'alert',
      parameters: [
        { name: 'message', type: 'string', required: true },
        { name: 'freq', type: 'string', required: false }
      ]
    }
  };
  
  return signatures[functionName] || { name: functionName, parameters: [] };
}

/**
 * Compare actual types with expected types
 */
export function compareTypes(expectedType, actualType) {
  // Handle exact matches first
  if (actualType === expectedType) {
    return { isValid: true, compatible: true, exact: true };
  }
  
  // Pine Script type compatibility rules
  const compatibilityMap = {
    'series float': ['float', 'int', 'series int', 'identifier'],
    'series int': ['int', 'identifier'], 
    'float': ['int', 'identifier'],
    'string': ['identifier'],
    'bool': ['identifier'],
    'int': ['identifier']
  };
  
  const compatibleTypes = compatibilityMap[expectedType] || [];
  
  if (compatibleTypes.includes(actualType)) {
    return { isValid: true, compatible: true, exact: false, reason: 'compatible_type' };
  }
  
  // Handle compound types (e.g., 'series int/float', 'series float')
  if (expectedType === 'series int/float') {
    if (['series int', 'series float', 'series', 'int', 'float', 'identifier'].includes(actualType)) {
      return { isValid: true, compatible: true, exact: false, reason: 'series_accepts_simple' };
    }
  }
  
  // Handle int/float compatibility
  if (expectedType === 'int/float') {
    if (['int', 'float'].includes(actualType)) {
      return { isValid: true, compatible: true, exact: false, reason: 'numeric_compatible' };
    }
  }
  
  if (expectedType === 'simple int') {
    if (['int', 'simple int', 'identifier'].includes(actualType)) {
      return { isValid: true, compatible: true, exact: false };
    }
  }
  
  // Original type hierarchy for basic types
  const typeHierarchy = {
    'int': ['float', 'series'],
    'float': ['series'],
    'bool': ['series'],
    'string': [],
    'color': [],
    'series': [],
    'identifier': ['int', 'float', 'bool', 'string', 'color', 'series']
  };
  
  if (typeHierarchy[actualType] && typeHierarchy[actualType].includes(expectedType)) {
    return { isValid: true, compatible: true, exact: false };
  }
  
  return { 
    isValid: false, 
    compatible: false, 
    exact: false, 
    reason: 'type_mismatch',
    expected: expectedType,
    actual: actualType 
  };
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
        metadata: {
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
        const typeComparison = compareTypes(expectedParam.type, param.inferredType);
        
        if (!typeComparison.compatible) {
          violations.push({
            line: functionCall.line,
            column: functionCall.column,
            severity: 'error',
            message: `Parameter ${index + 1} of '${functionCall.name}()' expects ${expectedParam.type}, got ${param.inferredType}`,
            rule: 'FUNCTION_SIGNATURE_VALIDATION',
            category: 'function_signature',
            metadata: {
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
  
  try {
    const violations = [];
    const functionCalls = extractFunctionCalls(source);
    const functionsAnalyzed = functionCalls.length;
    const signatureChecksPerformed = functionCalls.length;
    
    functionCalls.forEach(functionCall => {
      const { name, parameters, line, column } = functionCall;
      const expectedSignature = getExpectedSignature(name);
      
      // Skip unknown functions (they return empty signature)
      if (!expectedSignature.parameters || expectedSignature.parameters.length === 0) {
        return;
      }
      
      // Validate parameter count using atomic function
      const countResult = validateParameterCount(expectedSignature, parameters);
      if (!countResult.isValid) {
        const violation = {
          line: line,
          column: column,
          severity: 'error',
          rule: 'FUNCTION_SIGNATURE_VALIDATION',
          category: 'function_signature',
          functionName: name,
          reason: countResult.reason,
          expectedParams: countResult.expected,
          actualParams: countResult.actual,
          message: `FUNCTION_SIGNATURE_VALIDATION: Function '${name}()' ${countResult.reason} (expected ${countResult.expected}, got ${countResult.actual})`
        };
        
        // Add extra details for specific violation types
        if (countResult.reason === 'too_many_parameters') {
          violation.extraParams = parameters.slice(countResult.expected);
        } else if (countResult.reason === 'missing_required_parameters') {
          violation.missingParams = expectedSignature.parameters
            .filter(p => p.required)
            .slice(countResult.actual)
            .map(p => p.name);
        }
        
        violations.push(violation);
        return; // Skip type validation if count is wrong
      }
      
      // Validate parameter types using atomic function
      const typedParams = parameters.map(param => ({
        value: param,
        type: inferParameterTypes(param)
      }));
      
      const typeResult = validateParameterTypes(expectedSignature, typedParams);
      if (!typeResult.isValid) {
        typeResult.violations.forEach((typeViolation, index) => {
          violations.push({
            line: line,
            column: column,
            severity: 'error',
            rule: 'FUNCTION_SIGNATURE_VALIDATION',
            category: 'function_signature',
            functionName: name,
            reason: 'parameter_type_mismatch',
            parameterName: typeViolation.parameter,
            expectedType: typeViolation.expectedType,
            actualType: typeViolation.actualType,
            message: `FUNCTION_SIGNATURE_VALIDATION: Parameter '${typeViolation.parameter}' of '${name}()' expects ${typeViolation.expectedType}, got ${typeViolation.actualType}`
          });
        });
      }
    });
    
    const endTime = performance.now();
    
    return {
      success: true,
      hasFunctionSignaturesError: violations.length > 0,
      violations: violations,
      warnings: [],
      metrics: { 
        validationTimeMs: endTime - startTime,
        functionsAnalyzed: functionsAnalyzed,
        signatureChecksPerformed: signatureChecksPerformed
      }
    };
    
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasFunctionSignaturesError: false,
      violations: [],
      warnings: [],
      error: error.message,
      metrics: { validationTimeMs: endTime - startTime }
    };
  }
}

/**
 * Helper functions for modular testing
 */
export function validateParameterCount(expectedSignature, actualParams) {
  // Guard against null/undefined expectedSignature or parameters
  if (!expectedSignature || !expectedSignature.parameters) {
    return { isValid: true }; // Skip validation for unknown functions
  }

  const requiredParams = expectedSignature.parameters.filter(p => p.required);
  const actualParamCount = actualParams.length;
  
  if (actualParamCount < requiredParams.length) {
    return {
      isValid: false,
      reason: "missing_required_parameters",
      expected: requiredParams.length,
      actual: actualParamCount
    };
  }
  
  if (actualParamCount > expectedSignature.parameters.length) {
    return {
      isValid: false,
      reason: "too_many_parameters",
      expected: expectedSignature.parameters.length,
      actual: actualParamCount
    };
  }
  
  return { isValid: true };
}

export function validateParameterTypes(expectedSignature, actualParams) {
  const violations = [];
  // Guard against null/undefined expectedSignature or parameters
  if (!expectedSignature || !expectedSignature.parameters) {
    return { isValid: true, violations: [] }; // Skip validation for unknown functions
  }

  actualParams.forEach((param, index) => {
    if (index < expectedSignature.parameters.length) {
      const expectedParam = expectedSignature.parameters[index];
      const typeComparison = compareTypes(expectedParam.type, param.type);
      
      if (!typeComparison.compatible) {
        violations.push({
          parameter: expectedParam.name,
          expectedType: expectedParam.type,
          actualType: param.type,
          actualValue: param.value
        });
      }
    }
  });
  
  return { isValid: violations.length === 0, violations };
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
        metadata: {
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
        metadata: {
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
        metadata: {
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
export function extractDeprecatedFunctionCalls(source) {
  const deprecatedFunctions = {
    'iff': 'Deprecated in v6. Use conditional operator ?: instead',
    'na': 'Use na constant instead of na() function',
    'nz': 'Replaced with nz() built-in function with updated signature',
    'security': 'Replaced with request.security() in v6',
    'study': 'Replaced with indicator() in v6',
    'color.new': 'Use color.rgb() or color constants in v6',
    'input.resolution': 'Use input.timeframe() in v6',
    'input.symbol': 'Use input.symbol() with updated parameters in v6',
    'tostring': 'Replaced with str.tostring() in v6',
    'rsi': 'Replaced with ta.rsi() in v6',
    'sma': 'Replaced with ta.sma() in v6',
    'ema': 'Replaced with ta.ema() in v6',
    'crossover': 'Replaced with ta.crossover() in v6',
    'crossunder': 'Replaced with ta.crossunder() in v6'
  };
  
  const deprecatedCalls = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Skip comment lines
    if (line.trim().startsWith('//')) {
      return;
    }
    
    Object.keys(deprecatedFunctions).forEach(deprecatedFunc => {
      // Use negative lookbehind to ensure function is not preceded by namespace
      const pattern = new RegExp(`(?<!(?:ta|math|str|array|matrix|color|request)\\.)\\b${deprecatedFunc}\\s*\\(`, 'g');
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const column = match.index + 1;
        
        // Check if the match is inside a string literal
        const beforeMatch = line.substring(0, match.index);
        const quoteCount = (beforeMatch.match(/"/g) || []).length;
        const isInsideString = quoteCount % 2 === 1;
        
        if (!isInsideString) {
          deprecatedCalls.push({
            name: deprecatedFunc,
            line: lineIndex + 1,
            column: column,
            modernEquivalent: getModernEquivalent(deprecatedFunc)
          });
        }
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
    'input.symbol': 'input.symbol',
    'tostring': 'str.tostring'
    ,
    'rsi': 'ta.rsi',
    'sma': 'ta.sma',
    'ema': 'ta.ema',
    'crossover': 'ta.crossover',
    'crossunder': 'ta.crossunder'
  };
  
  return equivalents[deprecatedFunction] || 'unknown';
}

/**
 * Analyze version directive compatibility
 */
export function analyzeVersionDirective(source) {
  // Updated pattern to handle spaces: // @version = 6 or //@version=6
  const versionPattern = /\/\/\s*@version\s*=\s*(\d+)/;
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(versionPattern);
    if (match) {
      const version = parseInt(match[1]);
      return {
        version: version,
        line: i + 1,
        isV6Compatible: version >= 6,
        hasVersionDirective: true
      };
    }
  }
  
  // No version directive found
  return {
    version: null,
    line: -1,
    isV6Compatible: true, // Missing directive assumes latest (v6 compatible)
    hasVersionDirective: false
  };
}

/**
 * Validate namespace requirements for v6 functions
 */
export function validateNamespaceRequirements(source) {
  const namespacedFunctions = {
    // Note: Functions that are in deprecated list (sma, ema, rsi, security, tostring, crossover, crossunder) 
    // are handled by deprecated function detection, not namespace requirements
    'macd': { namespace: 'ta', modernForm: 'ta.macd' },
    'stoch': { namespace: 'ta', modernForm: 'ta.stoch' },
    'atr': { namespace: 'ta', modernForm: 'ta.atr' },
    'highest': { namespace: 'ta', modernForm: 'ta.highest' },
    'lowest': { namespace: 'ta', modernForm: 'ta.lowest' },
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
      // Use negative lookbehind to ensure function is not preceded by namespace
      const pattern = new RegExp(`(?<!(?:ta|math|str|array|matrix|color|request)\\.)\\b${funcName}\\s*\\(`, 'g');
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const column = match.index + 1;
        const functionInfo = namespacedFunctions[funcName];
        
        violations.push({
          functionName: funcName,
          line: lineIndex + 1,
          column: column,
          requiredNamespace: functionInfo.namespace,
          modernForm: functionInfo.modernForm
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
      metadata: {
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
      metadata: {
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
      metadata: {
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
      deprecatedFunctionsFound: violations.filter(v => v.metadata?.deprecatedFunction).length,
      namespaceViolationsFound: violations.filter(v => v.metadata?.namespaceRequired).length,
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

/**
 * SERIES_TYPE_WHERE_SIMPLE_EXPECTED ENHANCED VALIDATION
 * Comprehensive detection of series/simple type conversion errors
 * 
 * Detects:
 * 1. Multi-parameter functions where ALL UDT fields need detection
 * 2. int() conversion errors where dynamic series values cannot be converted to simple types
 * 3. Function parameter position mapping for accurate error reporting
 * 
 * Performance Target: <5ms validation time for 50+ function calls
 * Error Format: TradingView compliance
 */

/**
 * Enhanced UDT field and series/simple type mismatch detection
 * Addresses limitations in current validation patterns
 * 
 * @param {string} source - Pine Script source code
 * @returns {Object} Validation result with violations array
 */
export function validateSeriesTypeWhereSimpleExpected(source) {
  const violations = [];
  const lines = source.split('\n');
  
  // Enhanced patterns for comprehensive detection
  const patterns = {
    // Pattern 1: Multi-parameter functions with ALL UDT field detection
    // Captures: ta.macd(close, market.dynamicFast, market.dynamicSlow, market.dynamicSignal)
    // Enhancement: Detects ALL three UDT fields with their parameter positions
    taFunctionWithUDTFields: {
      regex: /(ta\.(ema|sma|rma|wma|vwma|atr|rsi|stoch|bb|macd))\s*\(\s*([^)]+)\)/gs, // Added 's' flag for multiline
      requiresSimpleParams: {
        'ta.ema': [1], // length parameter
        'ta.sma': [1], // length parameter  
        'ta.rma': [1], // length parameter
        'ta.wma': [1], // length parameter
        'ta.vwma': [1], // length parameter
        'ta.atr': [0], // length parameter
        'ta.rsi': [1], // length parameter
        'ta.stoch': [3, 4, 5], // %k (pos 3), %k_smoothing (pos 4), %d_smoothing (pos 5) - first 3 are high, low, close
        'ta.bb': [1, 2], // length, mult parameters  
        'ta.macd': [1, 2, 3] // fast_length, slow_length, signal_length parameters
      }
    },
    
    // Pattern 2: int() conversion error detection
    // Captures: int(market.adaptiveSlowLength) where adaptiveSlowLength is dynamic series
    // Enhancement: Detect series-to-simple conversion attempts including nested cases
    intConversionWithUDTField: {
      regex: /int\s*\(\s*([^)]+)\s*\)/gs,
      description: "Impossible int() conversion of dynamic UDT field"
    },
    
    // Pattern 3: Built-in math functions requiring simple types
    // Enhancement: Expand beyond ta.* functions to comprehensive coverage
    mathFunctionsWithUDTFields: {
      regex: /(math\.(abs|acos|asin|atan|ceil|cos|exp|floor|log|log10|max|min|pow|round|sign|sin|sqrt|tan))\s*\(\s*([^)]+)\)/gs,
      requiresSimpleParams: {} // Most math functions accept series, but some contexts require simple
    },
    
    // Pattern 4: Strategy/indicator functions with type constraints
    strategyFunctionsWithUDTFields: {
      regex: /(strategy\.(entry|exit|order|close|close_all))\s*\(\s*([^)]+)\)/gs,
      requiresSimpleParams: {
        'strategy.entry': [2], // qty parameter when using fixed quantities
        'strategy.exit': [2],  // qty parameter when using fixed quantities
        'strategy.order': [2]  // qty parameter when using fixed quantities
      }
    }
  };
  
  // Helper function to find line and column from string position
  function getLineAndColumn(source, position) {
    const beforePosition = source.substring(0, position);
    const lineNumber = (beforePosition.match(/\n/g) || []).length + 1;
    const lastNewlineIndex = beforePosition.lastIndexOf('\n');
    const column = position - lastNewlineIndex;
    return { line: lineNumber, column };
  }
  
  // Process entire source to handle multi-line function calls
  
  // Pattern 1: Enhanced ta.* function validation with ALL UDT field detection
  const taMatches = [...source.matchAll(patterns.taFunctionWithUDTFields.regex)];
  taMatches.forEach(match => {
    const functionName = match[1]; // e.g., "ta.macd"
    const parametersStr = match[3]; // All parameters as string
    const functionStartPos = match.index;
    const { line: lineNumber, column: functionStartCol } = getLineAndColumn(source, functionStartPos);
    
    // Parse individual parameters
    const parameters = parseParameterString(parametersStr);
    const simpleParamIndices = patterns.taFunctionWithUDTFields.requiresSimpleParams[functionName] || [];
    
    simpleParamIndices.forEach(paramIndex => {
      if (paramIndex < parameters.length) {
        const param = parameters[paramIndex];
        const udtFieldMatch = param.value.match(/([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)/);
        
        if (udtFieldMatch) {
          const udtField = udtFieldMatch[1];
          const paramCol = functionStartCol + parametersStr.indexOf(param.value);
          
          violations.push({
            line: lineNumber,
            column: paramCol,
            severity: 'error',
            message: `Cannot call "${functionName}" with argument "${param.name || `parameter ${paramIndex + 1}`}"="${udtField}". An argument of "series int" type was used but a "simple int" is expected.`,
            rule: 'SERIES_TYPE_WHERE_SIMPLE_EXPECTED',
            category: 'type_validation',
            metadata: {
              functionName: functionName,
              parameterName: param.name || `parameter ${paramIndex + 1}`,
              parameterValue: udtField,
              parameterIndex: paramIndex,
              expectedType: 'simple int',
              actualType: 'series int',
              suggestion: `Use conditional logic with multiple calculations using fixed simple parameters, then select the appropriate result based on conditions.`
            }
          });
        }
      }
    });
  });
  
  // Pattern 2: int() conversion error detection
  const intMatches = [...source.matchAll(patterns.intConversionWithUDTField.regex)];
  intMatches.forEach(match => {
    const intParameter = match[1];
    const intCallPos = match.index;
    const { line: lineNumber, column: intCallCol } = getLineAndColumn(source, intCallPos);
    
    // Find all UDT fields within the int() parameter
    const udtFieldMatches = [...intParameter.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)/g)];
    
    udtFieldMatches.forEach(udtMatch => {
      const udtField = udtMatch[1];
      
      violations.push({
        line: lineNumber,
        column: intCallCol,
        severity: 'error',
        message: `Cannot convert dynamic series value "${udtField}" to simple type using int(). Dynamic UDT fields remain series and cannot be converted to simple types.`,
        rule: 'SERIES_TYPE_WHERE_SIMPLE_EXPECTED',
        category: 'type_validation',
        metadata: {
          functionName: 'int',
          parameterName: 'value',
          parameterValue: udtField,
          parameterIndex: 0,
          expectedType: 'simple type',
          actualType: 'series int',
          suggestion: `CANNOT convert dynamic series to simple types. Use conditional logic with multiple calculations using fixed simple parameters.`
        }
      });
    });
  });
  
  // Pattern 3: Strategy function validation
  const strategyMatches = [...source.matchAll(patterns.strategyFunctionsWithUDTFields.regex)];
  strategyMatches.forEach(match => {
    const functionName = match[1];
    const parametersStr = match[3];
    const functionStartPos = match.index;
    const { line: lineNumber, column: functionStartCol } = getLineAndColumn(source, functionStartPos);
    
    const parameters = parseParameterString(parametersStr);
    const simpleParamIndices = patterns.strategyFunctionsWithUDTFields.requiresSimpleParams[functionName] || [];
    
    simpleParamIndices.forEach(paramIndex => {
      if (paramIndex < parameters.length) {
        const param = parameters[paramIndex];
        const udtFieldMatch = param.value.match(/([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)/);
        
        if (udtFieldMatch) {
          const udtField = udtFieldMatch[1];
          const paramCol = functionStartCol + parametersStr.indexOf(param.value);
          
          violations.push({
            line: lineNumber,
            column: paramCol,
            severity: 'error',
            message: `Cannot call "${functionName}" with argument "${param.name || `parameter ${paramIndex + 1}`}"="${udtField}". An argument of "series int" type was used but a "simple int" is expected.`,
            rule: 'SERIES_TYPE_WHERE_SIMPLE_EXPECTED',
            category: 'type_validation',
            metadata: {
              functionName: functionName,
              parameterName: param.name || `parameter ${paramIndex + 1}`,
              parameterValue: udtField,
              parameterIndex: paramIndex,
              expectedType: 'simple int',
              actualType: 'series int',
              suggestion: `Use fixed simple values for ${functionName} parameters.`
            }
          });
        }
      }
    });
  });
  
  
  return {
    violations,
    warnings: []
  };
}

/**
 * Parse parameter string into structured parameter objects
 * Handles both positional and named parameters
 * 
 * @param {string} parametersStr - Parameters string from function call
 * @returns {Array} Array of parameter objects with name, value, and position
 */
function parseParameterString(parametersStr) {
  const parameters = [];
  const paramParts = parametersStr.split(',').map(p => p.trim());
  
  paramParts.forEach((part, index) => {
    // Check if it's a named parameter (name=value)
    const namedMatch = part.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (namedMatch) {
      parameters.push({
        name: namedMatch[1],
        value: namedMatch[2].trim(),
        position: index,
        isNamed: true
      });
    } else {
      parameters.push({
        name: null,
        value: part.trim(),
        position: index,
        isNamed: false
      });
    }
  });
  
  return parameters;
}

/**
 * Quick validation wrapper for SERIES_TYPE_WHERE_SIMPLE_EXPECTED
 * Optimized for integration with index.js validation flow
 * Performance target: <5ms for 50+ function calls
 * 
 * @param {string} source - Pine Script source code
 * @returns {ValidationResult} - Quick validation result
 */
export function quickValidateSeriesTypeWhereSimpleExpected(source) {
  const startTime = performance.now();
  
  try {
    const result = validateSeriesTypeWhereSimpleExpected(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasSeriesTypeError: result.violations.length > 0,
      violations: result.violations,
      metrics: {
        validationTimeMs: endTime - startTime,
        violationsFound: result.violations.length
      }
    };
    
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasSeriesTypeError: false,
      violations: [],
      error: error.message,
      metrics: {
        validationTimeMs: endTime - startTime
      }
    };
  }
}

/**
 * INVALID_LINE_CONTINUATION Validation
 * Detects improper line continuation in ternary operators
 * 
 * Validates that ternary operators (? :) do not have line breaks at the ? operator,
 * which causes "end of line without line continuation" compilation errors in Pine Script v6.
 * 
 * @param {string} source - Pine Script source code
 * @returns {Object} Validation result with violations array
 */
export function validateLineContinuation(source) {
  const violations = [];
  const lines = source.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Look for lines ending with ? (ternary line continuation error)
    // Pattern: variable = condition ? (end of line or comment)
    const ternaryLineContinuationPattern = /^[^?]*\?\s*(\/\/.*)?$/;
    
    if (ternaryLineContinuationPattern.test(line.trim())) {
      // Make sure this is actually an assignment with a ternary operator
      const assignmentPattern = /([a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^?]*)\?\s*(\/\/.*)?$/;
      const match = line.match(assignmentPattern);
      
      if (match) {
        const questionMarkPos = line.lastIndexOf('?');
        
        violations.push({
          line: lineIndex + 1,
          column: questionMarkPos + 1,
          severity: 'error',
          message: "Syntax error at input 'end of line without line continuation'. ternary operators must be properly formatted without line breaks at the condition operator.",
          errorCode: 'INVALID_LINE_CONTINUATION',
          rule: 'INVALID_LINE_CONTINUATION',
          category: 'syntax_validation',
          suggestedFix: 'Keep ternary operators on a single line or use proper line continuation without breaking at the ? character',
          metadata: {
            errorPattern: 'ternary_line_continuation',
            problematicCode: line.trim(),
            suggestion: 'Keep ternary operators on a single line or use proper line continuation without breaking at the ? character',
            fixExample: `${match[1]}? value1 : value2`
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
 * Quick validation wrapper for INVALID_LINE_CONTINUATION
 * Optimized for integration with index.js validation flow
 * 
 * @param {string} source - Pine Script source code
 * @returns {ValidationResult} - Quick validation result
 */
export function quickValidateLineContinuation(source) {
  const startTime = performance.now();
  
  try {
    const result = validateLineContinuation(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasLineContinuationError: result.violations.length > 0,
      violations: result.violations,
      metrics: {
        validationTimeMs: endTime - startTime,
        violationsFound: result.violations.length
      }
    };
    
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasLineContinuationError: false,
      violations: [],
      error: error.message,
      metrics: {
        validationTimeMs: endTime - startTime
      }
    };
  }
}

/**
 * Get expected parameter types for Pine Script functions
 * @param {string} functionName - The name of the function
 * @returns {Object} Type definitions with params array
 */
export function getExpectedTypes(functionName) {
  // Pine Script function type definitions
  const functionTypes = {
    'ta.sma': {
      params: [
        { name: 'source', type: 'series int/float' },
        { name: 'length', type: 'series int' }
      ]
    },
    'str.contains': {
      params: [
        { name: 'source', type: 'string' },
        { name: 'substring', type: 'string' }
      ]
    },
    'math.max': {
      params: [
        { name: 'val1', type: 'int/float' },
        { name: 'val2', type: 'int/float' }
      ]
    }
  };
  
  return functionTypes[functionName] || { params: [] };
}

