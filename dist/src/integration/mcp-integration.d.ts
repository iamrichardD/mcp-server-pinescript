/**
 * Enhanced validation function that integrates with existing MCP server
 * This function can be called from index.js to add AST-based parameter validation
 *
 * @param {string} code - Pine Script source code
 * @param {Object} validationRules - Validation rules from validation-rules.json
 * @param {Object} [options] - Additional validation options
 * @returns {Promise<Object>} - Enhanced validation result
 */
export function enhancedPineScriptValidation(code: string, validationRules: Object, options?: Object): Promise<Object>;
/**
 * Quick SHORT_TITLE_TOO_LONG validation for immediate integration
 * This can be added to the existing validation loop in index.js
 *
 * @param {string} code - Pine Script source code
 * @returns {Promise<Object[]>} - Violations in MCP server format
 */
export function quickShortTitleValidation(code: string): Promise<Object[]>;
/**
 * Integration patch for existing validation function
 * This function shows how to integrate the new parser into index.js:577-579
 *
 * @param {string} code - Pine Script source code
 * @param {Array} existingViolations - Violations from current validation
 * @param {Object} validationRules - Validation rules
 * @returns {Promise<Array>} - Combined violations
 */
export function integrateWithExistingValidation(code: string, existingViolations: any[], validationRules: Object): Promise<any[]>;
/**
 * Backward compatibility checker
 * Ensures new validation doesn't break existing functionality
 */
export function validateBackwardCompatibility(oldViolations: any, newViolations: any): {
    compatible: boolean;
    issues: never[];
    improvements: never[];
};
/**
 * Example integration code for index.js
 * Shows exactly how to modify the existing validation loop
 */
export const INTEGRATION_EXAMPLE: "\n// INTEGRATION POINT: Add this to index.js around line 577-579\n// Replace the basic indicator/strategy check with enhanced validation\n\n// Import the integration module\nimport { integrateWithExistingValidation } from './src/integration/mcp-integration.js';\n\n// In the validation function, replace:\n// if (line.includes('indicator(') || line.includes('strategy(')) {\n//   hasDeclaration = true;\n// }\n\n// With enhanced validation:\nif (line.includes('indicator(') || line.includes('strategy(')) {\n  hasDeclaration = true;\n  \n  // Add AST-based parameter validation\n  try {\n    const enhancedViolations = await integrateWithExistingValidation(\n      code, \n      violations, \n      validationRules\n    );\n    violations = enhancedViolations;\n  } catch (error) {\n    // Graceful fallback - existing validation continues\n    console.warn('AST validation failed:', error.message);\n  }\n}\n";
/**
 * Performance monitoring for integration
 * Ensures the new validation doesn't violate the <15ms requirement
 */
export class IntegrationPerformanceMonitor {
    measurements: Map<any, any>;
    alerts: any[];
    startValidation(code: any): {
        startTime: number;
        codeLength: any;
        timestamp: Date;
    };
    endValidation(violations: any): any;
    getPerformanceReport(): {
        alerts: any[];
        alertCount: number;
        targetDuration: number;
        recommendations: string[];
    };
}
/**
 * Validation rules loader for integration
 * Handles loading and caching of validation rules
 */
export class ValidationRulesManager {
    rules: {
        functionValidationRules: {
            fun_indicator: {
                argumentConstraints: {
                    shorttitle: {
                        validation_constraints: {
                            maxLength: number;
                            errorCode: string;
                            errorMessage: string;
                            severity: string;
                            category: string;
                        };
                    };
                };
            };
            fun_strategy: {
                argumentConstraints: {
                    shorttitle: {
                        validation_constraints: {
                            maxLength: number;
                            errorCode: string;
                            errorMessage: string;
                            severity: string;
                            category: string;
                        };
                    };
                };
            };
        };
    } | null;
    lastLoaded: number | null;
    cacheValidMs: number;
    loadRules(rulesPath: any): Promise<{
        functionValidationRules: {
            fun_indicator: {
                argumentConstraints: {
                    shorttitle: {
                        validation_constraints: {
                            maxLength: number;
                            errorCode: string;
                            errorMessage: string;
                            severity: string;
                            category: string;
                        };
                    };
                };
            };
            fun_strategy: {
                argumentConstraints: {
                    shorttitle: {
                        validation_constraints: {
                            maxLength: number;
                            errorCode: string;
                            errorMessage: string;
                            severity: string;
                            category: string;
                        };
                    };
                };
            };
        };
    }>;
    getRules(): {
        functionValidationRules: {
            fun_indicator: {
                argumentConstraints: {
                    shorttitle: {
                        validation_constraints: {
                            maxLength: number;
                            errorCode: string;
                            errorMessage: string;
                            severity: string;
                            category: string;
                        };
                    };
                };
            };
            fun_strategy: {
                argumentConstraints: {
                    shorttitle: {
                        validation_constraints: {
                            maxLength: number;
                            errorCode: string;
                            errorMessage: string;
                            severity: string;
                            category: string;
                        };
                    };
                };
            };
        };
    } | null;
    clearCache(): void;
}
export const performanceMonitor: IntegrationPerformanceMonitor;
export const rulesManager: ValidationRulesManager;
export const integrationMonitor: IntegrationPerformanceMonitor;
