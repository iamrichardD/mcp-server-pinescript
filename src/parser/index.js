/**
 * Pine Script Parser Module
 * 
 * Main entry point for the AST generation engine.
 * Provides clean, TypeScript-migration-ready interfaces for Pine Script parsing,
 * AST generation, and parameter validation.
 * 
 * This module is designed to integrate with the existing MCP server
 * at index.js:577-579 while maintaining high performance and clean architecture.
 */

// Core parsing functionality
import {
  parseScript as _parseScript,
  extractFunctionParameters as _extractFunctionParameters
} from './parser.js';

export {
  _parseScript as parseScript,
  _extractFunctionParameters as extractFunctionParameters
};

// Lexical analysis
export { 
  tokenize, 
  createLexer, 
  TOKEN_TYPES, 
  KEYWORDS
} from './lexer.js';

// AST type definitions and utilities
export {
  isASTNode,
  isFunctionCallNode,
  isParameterNode,
  createFunctionCallNode,
  createParameterNode,
  createLiteralNode,
  createSourceLocation,
  AST_NODE_TYPES,
  DATA_TYPES
} from './ast-types.js';

// Parameter validation
import { 
  validateParameters as _validateParameters,
  validatePineScriptParameters as _validatePineScriptParameters,
  validateShortTitle as _validateShortTitle,
  loadValidationRules as _loadValidationRules,
  validatePrecision as _validatePrecision,
  quickValidatePrecision as _quickValidatePrecision,
  validateMaxBarsBack as _validateMaxBarsBack,
  quickValidateMaxBarsBack as _quickValidateMaxBarsBack,
  validateMaxLinesCount as _validateMaxLinesCount,
  quickValidateMaxLinesCount as _quickValidateMaxLinesCount,
  validateMaxLabelsCount as _validateMaxLabelsCount,
  quickValidateMaxLabelsCount as _quickValidateMaxLabelsCount,
  validateMaxBoxesCount as _validateMaxBoxesCount,
  quickValidateMaxBoxesCount as _quickValidateMaxBoxesCount,
  validateDrawingObjectCounts as _validateDrawingObjectCounts,
  quickValidateDrawingObjectCounts as _quickValidateDrawingObjectCounts,
  validateInputTypes as _validateInputTypes,
  quickValidateInputTypes as _quickValidateInputTypes,
  extractFunctionCalls as _extractFunctionCalls,
  inferParameterTypes as _inferParameterTypes,
  compareTypes as _compareTypes,
  validateFunctionSignatures as _validateFunctionSignatures,
  quickValidateFunctionSignatures as _quickValidateFunctionSignatures,
  getExpectedSignature as _getExpectedSignature,
  validateParameterCount as _validateParameterCount,
  validateParameterTypes as _validateParameterTypes,
  validateBuiltinNamespace as _validateBuiltinNamespace,
  quickValidateBuiltinNamespace as _quickValidateBuiltinNamespace,
} from './validator.js';

export {
  _validateParameters as validateParameters,
  _validatePineScriptParameters as validatePineScriptParameters,  
  _validateShortTitle as validateShortTitle,
  _loadValidationRules as loadValidationRules,
  _validatePrecision as validatePrecision,
  _quickValidatePrecision as quickValidatePrecision,
  _validateMaxBarsBack as validateMaxBarsBack,
  _quickValidateMaxBarsBack as quickValidateMaxBarsBack,
  _validateMaxLinesCount as validateMaxLinesCount,
  _quickValidateMaxLinesCount as quickValidateMaxLinesCount,
  _validateMaxLabelsCount as validateMaxLabelsCount,
  _quickValidateMaxLabelsCount as quickValidateMaxLabelsCount,
  _validateMaxBoxesCount as validateMaxBoxesCount,
  _quickValidateMaxBoxesCount as quickValidateMaxBoxesCount,
  _validateDrawingObjectCounts as validateDrawingObjectCounts,
  _quickValidateDrawingObjectCounts as quickValidateDrawingObjectCounts,
  _validateInputTypes as validateInputTypes,
  _quickValidateInputTypes as quickValidateInputTypes,
  _extractFunctionCalls as extractFunctionCalls,
  _inferParameterTypes as inferParameterTypes,
  _compareTypes as compareTypes,
  _validateFunctionSignatures as validateFunctionSignatures,
  _quickValidateFunctionSignatures as quickValidateFunctionSignatures,
  _getExpectedSignature as getExpectedSignature,
  _validateParameterCount as validateParameterCount,
  _validateParameterTypes as validateParameterTypes,
  _validateBuiltinNamespace as validateBuiltinNamespace,
  _quickValidateBuiltinNamespace as quickValidateBuiltinNamespace,
};

/**
 * High-level API for Pine Script analysis
 * Provides the main integration points for the MCP server
 */

/**
 * Analyze Pine Script code for parameter validation
 * Main integration function for index.js:577-579
 * 
 * @param {string} source - Pine Script source code
 * @param {Object} [validationRules] - Validation rules from validation-rules.json
 * @returns {Promise<Object>} - Analysis result with violations and metrics
 */
export async function analyzePineScript(source, validationRules = null) {
  const startTime = performance.now();
  
  try {
    // Parse the script to extract function calls and parameters
    const parseResult = _extractFunctionParameters(source);
    
    // If validation rules are provided, validate parameters
    // If no rules provided, default to SHORT_TITLE_TOO_LONG validation
    let violations = [];
    if (validationRules) {
      const validationResult = await _validatePineScriptParameters(source, validationRules);
      violations = validationResult.violations;
    } else {
      // Default to short title validation
      const shortTitleResult = _validateShortTitle(source);
      violations = shortTitleResult.violations;
    }
    
    const endTime = performance.now();
    
    return {
      success: true,
      violations,
      functionCalls: parseResult.functionCalls,
      metrics: {
        totalTimeMs: endTime - startTime,
        parseTimeMs: parseResult.metrics.parseTimeMs,
        functionsFound: parseResult.functionCalls.length,
        errorsFound: violations.length
      },
      errors: parseResult.errors
    };
    
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      error: {
        message: error.message,
        code: 'ANALYSIS_FAILED'
      },
      violations: [],
      functionCalls: [],
      metrics: {
        totalTimeMs: endTime - startTime,
        parseTimeMs: 0,
        functionsFound: 0,
        errorsFound: 1
      },
      errors: [error.message]
    };
  }
}

/**
 * Quick validation for SHORT_TITLE_TOO_LONG specifically
 * Optimized for the highest priority validation requirement
 * 
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} - Quick validation result
 */
export async function quickValidateShortTitle(source) {
  const startTime = performance.now();
  
  try {
    const result = _validateShortTitle(source);
    const endTime = performance.now();
    
    return {
      success: true,
      hasShortTitleError: result.violations.some(v => v.rule === 'SHORT_TITLE_TOO_LONG'),
      violations: result.violations.filter(v => v.rule === 'SHORT_TITLE_TOO_LONG'),
      metrics: {
        validationTimeMs: endTime - startTime
      }
    };
    
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      hasShortTitleError: false,
      violations: [],
      error: error.message,
      metrics: {
        validationTimeMs: endTime - startTime
      }
    };
  }
}

/**
 * Initialize the parser with validation rules
 * Should be called once during MCP server startup
 * 
 * @param {Object} validationRules - Validation rules from validation-rules.json
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeParser(validationRules) {
  try {
    _loadValidationRules(validationRules);
    return true;
  } catch (error) {
    console.error('Failed to initialize parser:', error);
    return false;
  }
}

/**
 * Get parser capabilities and status
 * Useful for debugging and monitoring
 * 
 * @returns {Object} - Parser status information
 */
export function getParserStatus() {
  return {
    version: '1.0.0',
    capabilities: [
      'pine_script_parsing',
      'ast_generation', 
      'parameter_extraction',
      'function_call_analysis',
      'shorttitle_validation',
      'parameter_constraint_validation'
    ],
    performance: {
      targetParseTime: '<15ms',
      targetValidationTime: '<5ms',
      memoryEfficient: true,
      streamingSupport: false // Could be added in future
    },
    integration: {
      mcpServerCompatible: true,
      typescriptReady: true,
      testFramework: 'vitest'
    }
  };
}

/**
 * Error handling patterns designed for TypeScript migration
 */

/**
 * Parser error base class
 * Will become proper TypeScript error classes
 */
export class PineScriptParseError extends Error {
  constructor(message, location, code = 'PARSE_ERROR') {
    super(message);
    this.name = 'PineScriptParseError';
    this.location = location;
    this.code = code;
  }
}

/**
 * Validation error class
 */
export class PineScriptValidationError extends Error {
  constructor(message, violations, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'PineScriptValidationError';
    this.violations = violations;
    this.code = code;
  }
}

/**
 * Type guards for error handling (TypeScript-ready)
 */

export function isPineScriptParseError(error) {
  return error instanceof PineScriptParseError;
}

export function isPineScriptValidationError(error) {
  return error instanceof PineScriptValidationError;
}

/**
 * Performance monitoring utilities
 * These will help maintain the <15ms target performance
 */

/**
 * Performance monitor for parsing operations
 */
export class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
  }
  
  start(operation) {
    this.measurements.set(operation, performance.now());
  }
  
  end(operation) {
    const startTime = this.measurements.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.measurements.delete(operation);
      return duration;
    }
    return 0;
  }
  
  measure(operation, fn) {
    this.start(operation);
    const result = fn();
    const duration = this.end(operation);
    
    return {
      result,
      duration
    };
  }
  
  async measureAsync(operation, fn) {
    this.start(operation);
    const result = await fn();
    const duration = this.end(operation);
    
    return {
      result,
      duration
    };
  }
}

// Export singleton performance monitor
export const performanceMonitor = new PerformanceMonitor();