/**
 * MCP Server Integration Module
 *
 * Integrates the new AST-based parser with the existing MCP server validation system.
 * Designed to enhance index.js:577-579 with advanced parameter validation while
 * maintaining backward compatibility and performance.
 *
 * This integration demonstrates the mob programming team's approach to enhancing
 * existing systems without breaking changes.
 */

import { analyzePineScript, initializeParser, validateShortTitle } from "../parser/index.js";

/**
 * Enhanced validation function that integrates with existing MCP server
 * This function can be called from index.js to add AST-based parameter validation
 *
 * @param {string} code - Pine Script source code
 * @param {Object} validationRules - Validation rules from validation-rules.json
 * @param {Object} [options] - Additional validation options
 * @returns {Promise<Object>} - Enhanced validation result
 */
export async function enhancedPineScriptValidation(code, validationRules, options = {}) {
  const startTime = performance.now();

  // Initialize parser with validation rules if not already done
  if (!global.parserInitialized) {
    await initializeParser(validationRules);
    global.parserInitialized = true;
  }

  try {
    // Run AST-based analysis for parameter validation
    const astResult = await analyzePineScript(code, validationRules);

    // Convert AST violations to existing MCP server format
    const enhancedViolations = astResult.violations.map((violation) => ({
      line: violation.line,
      column: violation.column,
      rule: violation.rule,
      severity: violation.severity,
      message: violation.message,
      category: violation.category,
      metadata: violation.metadata,
      // Add AST-specific enhancements
      source: "ast_parser",
      functionContext: violation.metadata?.functionName,
      parameterContext: violation.metadata?.parameterName,
    }));

    const endTime = performance.now();

    return {
      success: astResult.success,
      violations: enhancedViolations,
      functionCalls: astResult.functionCalls,
      metrics: {
        ...astResult.metrics,
        integrationTimeMs: endTime - startTime,
      },
      astAnalysis: {
        functionsAnalyzed: astResult.functionCalls.length,
        parseSuccessful: astResult.errors.length === 0,
        errors: astResult.errors,
      },
    };
  } catch (error) {
    // Graceful fallback - don't break existing validation
    console.warn("AST validation failed, falling back to basic validation:", error.message);

    return {
      success: false,
      violations: [],
      functionCalls: [],
      metrics: {
        integrationTimeMs: performance.now() - startTime,
        fallback: true,
      },
      error: error.message,
    };
  }
}

/**
 * Quick SHORT_TITLE_TOO_LONG validation for immediate integration
 * This can be added to the existing validation loop in index.js
 *
 * @param {string} code - Pine Script source code
 * @returns {Promise<Object[]>} - Violations in MCP server format
 */
export async function quickShortTitleValidation(code) {
  try {
    const result = await validateShortTitle(code);

    if (!result.success) {
      return [];
    }

    // Convert to existing violation format
    return result.violations.map((violation) => ({
      line: violation.line,
      column: violation.column,
      rule: "SHORT_TITLE_TOO_LONG",
      severity: "error",
      message: violation.message,
      category: "parameter_validation",
      suggested_fix: `Shorten the shorttitle to 10 characters or less`,
      metadata: violation.metadata,
      source: "ast_parser",
    }));
  } catch (error) {
    console.warn("Quick shorttitle validation failed:", error.message);
    return [];
  }
}

/**
 * Integration patch for existing validation function
 * This function shows how to integrate the new parser into index.js:577-579
 *
 * @param {string} code - Pine Script source code
 * @param {Array} existingViolations - Violations from current validation
 * @param {Object} validationRules - Validation rules
 * @returns {Promise<Array>} - Combined violations
 */
export async function integrateWithExistingValidation(code, existingViolations, validationRules) {
  const astViolations = await quickShortTitleValidation(code);

  // Combine existing violations with new AST-based violations
  // Remove duplicates and prioritize AST-based parameter validation
  const combinedViolations = [...existingViolations];

  for (const astViolation of astViolations) {
    // Check if we already have a violation at this location
    const existingViolation = existingViolations.find(
      (v) => v.line === astViolation.line && v.rule === astViolation.rule
    );

    if (!existingViolation) {
      combinedViolations.push(astViolation);
    }
  }

  return combinedViolations;
}

/**
 * Example integration code for index.js
 * Shows exactly how to modify the existing validation loop
 */
export const INTEGRATION_EXAMPLE = `
// INTEGRATION POINT: Add this to index.js around line 577-579
// Replace the basic indicator/strategy check with enhanced validation

// Import the integration module
import { integrateWithExistingValidation } from './src/integration/mcp-integration.js';

// In the validation function, replace:
// if (line.includes('indicator(') || line.includes('strategy(')) {
//   hasDeclaration = true;
// }

// With enhanced validation:
if (line.includes('indicator(') || line.includes('strategy(')) {
  hasDeclaration = true;
  
  // Add AST-based parameter validation
  try {
    const enhancedViolations = await integrateWithExistingValidation(
      code, 
      violations, 
      validationRules
    );
    violations = enhancedViolations;
  } catch (error) {
    // Graceful fallback - existing validation continues
    console.warn('AST validation failed:', error.message);
  }
}
`;

/**
 * Performance monitoring for integration
 * Ensures the new validation doesn't violate the <15ms requirement
 */
export class IntegrationPerformanceMonitor {
  constructor() {
    this.measurements = new Map();
    this.alerts = [];
  }

  startValidation(code) {
    const measurement = {
      startTime: performance.now(),
      codeLength: code.length,
      timestamp: new Date(),
    };

    this.measurements.set("current", measurement);
    return measurement;
  }

  endValidation(violations) {
    const measurement = this.measurements.get("current");
    if (!measurement) return null;

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;

    const result = {
      ...measurement,
      endTime,
      duration,
      violationsFound: violations.length,
      performanceTarget: 15, // ms
      withinTarget: duration < 15,
    };

    // Alert if performance target exceeded
    if (!result.withinTarget) {
      this.alerts.push({
        timestamp: new Date(),
        duration,
        codeLength: result.codeLength,
        message: `Validation exceeded 15ms target: ${duration.toFixed(2)}ms`,
      });
    }

    this.measurements.delete("current");
    return result;
  }

  getPerformanceReport() {
    return {
      alerts: this.alerts,
      alertCount: this.alerts.length,
      targetDuration: 15,
      recommendations:
        this.alerts.length > 0
          ? [
              "Consider optimizing parser for large files",
              "Implement caching for repeated validations",
              "Profile AST generation performance",
            ]
          : [],
    };
  }
}

/**
 * Validation rules loader for integration
 * Handles loading and caching of validation rules
 */
export class ValidationRulesManager {
  constructor() {
    this.rules = null;
    this.lastLoaded = null;
    this.cacheValidMs = 60000; // 1 minute cache
  }

  async loadRules(rulesPath) {
    // Check cache validity
    if (this.rules && this.lastLoaded && Date.now() - this.lastLoaded < this.cacheValidMs) {
      return this.rules;
    }

    try {
      // In real implementation, this would load from file
      // For demo, we'll use the validation-rules.json structure
      this.rules = {
        functionValidationRules: {
          fun_indicator: {
            argumentConstraints: {
              shorttitle: {
                validation_constraints: {
                  maxLength: 10,
                  errorCode: "SHORT_TITLE_TOO_LONG",
                  errorMessage:
                    "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)",
                  severity: "error",
                  category: "parameter_validation",
                },
              },
            },
          },
          fun_strategy: {
            argumentConstraints: {
              shorttitle: {
                validation_constraints: {
                  maxLength: 10,
                  errorCode: "SHORT_TITLE_TOO_LONG",
                  errorMessage:
                    "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)",
                  severity: "error",
                  category: "parameter_validation",
                },
              },
            },
          },
        },
      };

      this.lastLoaded = Date.now();
      return this.rules;
    } catch (error) {
      console.error("Failed to load validation rules:", error);
      throw new Error(`Validation rules loading failed: ${error.message}`);
    }
  }

  getRules() {
    return this.rules;
  }

  clearCache() {
    this.rules = null;
    this.lastLoaded = null;
  }
}

// Export singleton instances for integration
export const performanceMonitor = new IntegrationPerformanceMonitor();
export const rulesManager = new ValidationRulesManager();

/**
 * Backward compatibility checker
 * Ensures new validation doesn't break existing functionality
 */
export function validateBackwardCompatibility(oldViolations, newViolations) {
  const compatibility = {
    compatible: true,
    issues: [],
    improvements: [],
  };

  // Check that all old violations are still present (or improved)
  for (const oldViolation of oldViolations) {
    const newViolation = newViolations.find(
      (v) => v.line === oldViolation.line && v.rule === oldViolation.rule
    );

    if (!newViolation) {
      compatibility.issues.push({
        type: "missing_violation",
        message: `Previous violation at line ${oldViolation.line} rule '${oldViolation.rule}' no longer detected`,
        oldViolation,
      });
      compatibility.compatible = false;
    }
  }

  // Identify new improvements
  for (const newViolation of newViolations) {
    const oldViolation = oldViolations.find(
      (v) => v.line === newViolation.line && v.rule === newViolation.rule
    );

    if (!oldViolation && newViolation.source === "ast_parser") {
      compatibility.improvements.push({
        type: "new_detection",
        message: `New AST-based validation detected: ${newViolation.rule} at line ${newViolation.line}`,
        newViolation,
      });
    }
  }

  return compatibility;
}

// Create performance monitor singleton
export const integrationMonitor = new IntegrationPerformanceMonitor();
