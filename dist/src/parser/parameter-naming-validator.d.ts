/**
 * Quick validation wrapper for integration with existing validation pipeline
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Quick validation result
 */
export function quickValidateParameterNaming(source: string): Promise<Object>;
/**
 * Enhanced validation for specific error codes (legacy compatibility)
 * @param {string} source - Pine Script source code
 * @param {string} errorCode - Specific error code to check
 * @returns {Promise<Object>} Validation result
 */
export function validateSpecificParameterError(source: string, errorCode: string): Promise<Object>;
export class ParameterNamingValidator {
    parameterPatterns: {
        singleWord: Set<string>;
        snakeCase: Set<string>;
        hiddenParams: Set<string>;
    };
    deprecatedMigrations: {
        "table.cell": {
            textColor: string;
            textSize: string;
            textHalign: string;
            textValign: string;
        };
        "box.new": {
            textColor: string;
            textSize: string;
            textHalign: string;
            textValign: string;
        };
        "label.new": {
            textColor: string;
            textSize: string;
        };
    };
    /**
     * Main validation entry point
     * @param {string} source - Pine Script source code
     * @returns {Object} Validation result with violations and performance metrics
     */
    validateParameterNaming(source: string): Object;
    /**
     * Extract all function calls with named parameters from source code
     * @param {string} source - Pine Script source code
     * @returns {Array} Array of function call objects
     */
    extractFunctionCalls(source: string): any[];
    /**
     * Extract named parameters from parameter string
     * @param {string} paramString - The parameter string from function call
     * @returns {Array} Array of named parameter objects
     */
    extractNamedParameters(paramString: string): any[];
    /**
     * Optimized in-place parameter extraction to avoid substring operations
     * @param {string} source - The full source string
     * @param {number} startIndex - Start index of parameters
     * @param {number} endIndex - End index of parameters
     * @returns {Array} Array of named parameter objects
     */
    extractNamedParametersInPlace(source: string, startIndex: number, endIndex: number): any[];
    /**
     * Validate a single function call for parameter naming violations
     * @param {Object} functionCall - Function call object
     * @returns {Array} Array of violation objects
     */
    validateFunctionCall(functionCall: Object): any[];
    /**
     * Check if parameter is deprecated and needs migration
     * @param {string} functionName - Full function name
     * @param {string} paramName - Parameter name
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {Object|null} Violation object or null
     */
    checkDeprecatedParameter(functionName: string, paramName: string, line: number, column: number): Object | null;
    /**
     * Check parameter naming convention against Pine Script standards
     * @param {string} functionName - Full function name
     * @param {string} paramName - Parameter name
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {Object|null} Violation object or null
     */
    checkParameterNamingConvention(functionName: string, paramName: string, line: number, column: number): Object | null;
    /**
     * Check if parameter name is in the known valid parameters list
     * @param {string} paramName - Parameter name to check
     * @returns {boolean} True if parameter is known to be valid
     */
    isKnownValidParameter(paramName: string): boolean;
    /**
     * Context-aware check: Determine if parameter belongs to a built-in function
     * CRITICAL FIX for BUG 2: Prevents false positives on built-in parameters using required snake_case
     * @param {string} functionName - Full function name (e.g., "table.cell", "strategy.entry")
     * @param {string} paramName - Parameter name to check
     * @returns {boolean} True if this is a built-in function parameter that should skip validation
     */
    isBuiltInFunctionParameter(functionName: string, paramName: string): boolean;
    /**
     * Detect naming convention violations
     * @param {string} paramName - Parameter name to analyze
     * @returns {Object|null} Naming issue details or null
     */
    detectNamingConventionViolation(paramName: string): Object | null;
    /**
     * Check if string follows camelCase pattern
     * @param {string} str - String to check
     * @returns {boolean} True if camelCase
     */
    isCamelCase(str: string): boolean;
    /**
     * Check if string follows PascalCase pattern
     * @param {string} str - String to check
     * @returns {boolean} True if PascalCase
     */
    isPascalCase(str: string): boolean;
    /**
     * Check if string is ALL_CAPS
     * @param {string} str - String to check
     * @returns {boolean} True if ALL_CAPS
     */
    isAllCaps(str: string): boolean;
    /**
     * Convert camelCase to snake_case
     * @param {string} str - camelCase string
     * @returns {string} snake_case string
     */
    convertCamelToSnake(str: string): string;
    /**
     * Convert PascalCase to snake_case
     * @param {string} str - PascalCase string
     * @returns {string} snake_case string
     */
    convertPascalToSnake(str: string): string;
    /**
     * Convert ALL_CAPS to snake_case
     * @param {string} str - ALL_CAPS string
     * @returns {string} snake_case string
     */
    convertAllCapsToSnake(str: string): string;
}
