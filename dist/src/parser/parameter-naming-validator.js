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
/**
 * Core class for parameter naming convention validation
 */
// Pre-compiled regex patterns for optimal performance
const COMPILED_PATTERNS = {
    FUNCTION_NAME: /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s*\(/g,
    PARAMETER_NAME: /[a-zA-Z0-9_]/,
    WHITESPACE: /[\s,]/,
    QUOTE_CHARS: /['"]/
};
export class ParameterNamingValidator {
    parameterPatterns;
    deprecatedMigrations;
    constructor() {
        // Known Pine Script parameter naming patterns
        this.parameterPatterns = {
            // Common single-word parameters (correct)
            singleWord: new Set([
                "defval",
                "title",
                "tooltip",
                "inline",
                "group",
                "confirm",
                "display",
                "active",
                "series",
                "color",
                "style",
                "offset",
                "precision",
                "format",
                "join",
                "linewidth",
                "trackprice",
                "histbase",
                "editable",
                "overlay",
                "bgcolor",
                "width",
                "height",
                "source",
                "length",
                "when",
                "comment",
                "id",
                "direction",
                "qty",
                "limit",
                "stop",
                "xloc",
                "yloc",
                "size",
                "columns",
                "rows",
                "position",
            ]),
            // Common snake_case parameters (correct)
            snakeCase: new Set([
                "text_color",
                "text_size",
                "text_halign",
                "text_valign",
                "text_wrap",
                "text_font_family",
                "text_formatting",
                "table_id",
                "column",
                "row",
                "border_color",
                "border_width",
                "border_style",
                "oca_name",
                "alert_message",
                "show_last",
                "force_overlay",
                "max_bars_back",
                "max_lines_count",
                "max_labels_count",
                "max_boxes_count",
            ]),
            // Hidden/optional parameters (not in formal signatures but valid)
            hiddenParams: new Set(["minval", "maxval", "step", "options"]),
        };
        // Known deprecated parameter migrations (v5 -> v6)
        this.deprecatedMigrations = {
            "table.cell": {
                textColor: "text_color",
                textSize: "text_size",
                textHalign: "text_halign",
                textValign: "text_valign",
            },
            "box.new": {
                textColor: "text_color",
                textSize: "text_size",
                textHalign: "text_halign",
                textValign: "text_valign",
            },
            "label.new": {
                textColor: "text_color",
                textSize: "text_size",
            },
        };
    }
    /**
     * Main validation entry point
     * @param source - Pine Script source code
     * @returns Validation result with violations and performance metrics
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
            const elapsedTime = performance.now() - startTime;
            return {
                isValid: violations.length === 0,
                violations,
                metrics: {
                    validationTimeMs: elapsedTime > 0 ? Math.max(Math.trunc(elapsedTime * 1000) / 1000, 0.001) : 0,
                    functionsAnalyzed: functionCalls.length,
                    violationsFound: violations.length,
                },
            };
        }
        catch (error) {
            return {
                isValid: false,
                violations: [
                    {
                        errorCode: "VALIDATION_ERROR",
                        severity: "error",
                        message: `Parameter naming validation failed: ${error instanceof Error ? error.message : String(error)}`,
                        category: "validation_error",
                        suggestedFix: "Check source code syntax",
                        line: 1,
                        column: 1,
                    },
                ],
                metrics: {
                    validationTimeMs: Math.max(Math.trunc((performance.now() - startTime) * 1000) / 1000, 0.001),
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
    extractFunctionCalls(source) {
        const functionCalls = [];
        // Use pre-compiled regex pattern for maximum performance
        const functionNameRegex = COMPILED_PATTERNS.FUNCTION_NAME;
        let match;
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
            let stringChar = null;
            while (i < source.length && parenCount > 0) {
                const char = source[i];
                if (!inString) {
                    if (char === '"' || char === "'") {
                        inString = true;
                        stringChar = char;
                    }
                    else if (char === "(") {
                        parenCount++;
                    }
                    else if (char === ")") {
                        parenCount--;
                    }
                }
                else {
                    if (char === stringChar && source.charAt(i - 1) !== "\\") {
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
                    const line = beforeMatch.split("\n").length;
                    const lastNewline = beforeMatch.lastIndexOf("\n");
                    const column = match.index - lastNewline;
                    // Extract namespace and function name
                    const parts = fullFunctionName.split(".");
                    const namespace = parts.length > 1 ? parts[0] + "." : null;
                    const functionName = parts.length > 1 ? (parts[1] || fullFunctionName) : (parts[0] || fullFunctionName);
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
    extractNamedParametersInPlace(source, startIndex, endIndex) {
        const namedParameters = [];
        let i = startIndex;
        while (i < endIndex) {
            // Skip whitespace and commas using pre-compiled pattern
            while (i < endIndex && COMPILED_PATTERNS.WHITESPACE.test(source.charAt(i))) {
                i++;
            }
            if (i >= endIndex)
                break;
            // Look for parameter name followed by = using pre-compiled pattern
            const paramStart = i;
            while (i < endIndex && COMPILED_PATTERNS.PARAMETER_NAME.test(source.charAt(i))) {
                i++;
            }
            if (i >= endIndex)
                break;
            // Skip whitespace after parameter name
            while (i < endIndex && /\s/.test(source.charAt(i))) {
                i++;
            }
            if (i < endIndex && source.charAt(i) === "=") {
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
                let stringChar = null;
                // Find end of parameter value
                while (i < endIndex) {
                    const char = source.charAt(i);
                    if (!inString) {
                        if (COMPILED_PATTERNS.QUOTE_CHARS.test(char)) {
                            inString = true;
                            stringChar = char;
                        }
                        else if (char === "(") {
                            parenCount++;
                        }
                        else if (char === ")") {
                            parenCount--;
                        }
                        else if (char === "," && parenCount === 0) {
                            break; // End of this parameter
                        }
                    }
                    else {
                        if (char === stringChar && (i === 0 || source.charAt(i - 1) !== "\\")) {
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
            }
            else {
                // Skip positional parameter
                let parenCount = 0;
                let inString = false;
                let stringChar = null;
                while (i < endIndex) {
                    const char = source.charAt(i);
                    if (!inString) {
                        if (COMPILED_PATTERNS.QUOTE_CHARS.test(char)) {
                            inString = true;
                            stringChar = char;
                        }
                        else if (char === "(") {
                            parenCount++;
                        }
                        else if (char === ")") {
                            parenCount--;
                        }
                        else if (char === "," && parenCount === 0) {
                            i++; // skip comma
                            break;
                        }
                    }
                    else {
                        if (char === stringChar && (i === 0 || source.charAt(i - 1) !== "\\")) {
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
            const namingViolation = this.checkParameterNamingConvention(fullName, paramName, line, column);
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
    checkDeprecatedParameter(functionName, paramName, line, column) {
        const migrations = this.deprecatedMigrations[functionName];
        if (!migrations || !migrations[paramName]) {
            return null;
        }
        const correctParam = migrations[paramName];
        return {
            errorCode: "DEPRECATED_PARAMETER_NAME",
            severity: "error",
            category: "parameter_validation",
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
    checkParameterNamingConvention(functionName, paramName, line, column) {
        // Skip validation for known correct parameters (FIXES BUG 2: Built-in parameter false positives)
        if (this.isKnownValidParameter(paramName)) {
            return null;
        }
        // Context-aware validation: Skip built-in function parameters
        // This prevents false positives for required snake_case built-in parameters like text_color
        if (this.isBuiltInFunctionParameter(functionName, paramName)) {
            return null;
        }
        // Check for parameter naming convention violations (user-defined variables only)
        const namingIssue = this.detectNamingConventionViolation(paramName);
        if (namingIssue) {
            return {
                errorCode: "INVALID_PARAMETER_NAMING_CONVENTION",
                severity: "error", // Must be "error" to match test expectations
                category: "parameter_validation",
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
    isKnownValidParameter(paramName) {
        return (this.parameterPatterns.singleWord.has(paramName) ||
            this.parameterPatterns.snakeCase.has(paramName) ||
            this.parameterPatterns.hiddenParams.has(paramName));
    }
    /**
     * Context-aware check: Determine if parameter belongs to a built-in function
     * CRITICAL FIX for BUG 2: Prevents false positives on built-in parameters using required snake_case
     * @param functionName - Full function name (e.g., "table.cell", "strategy.entry")
     * @param paramName - Parameter name to check
     * @returns True if this is a built-in function parameter that should skip validation
     */
    isBuiltInFunctionParameter(functionName, paramName) {
        // Built-in functions that require snake_case parameters (avoid false positives)
        const builtInFunctionParameters = {
            'table.cell': new Set([
                'table_id', 'column', 'row', 'text', 'text_color', 'text_size',
                'text_halign', 'text_valign', 'text_wrap', 'text_font_family',
                'text_formatting', 'bgcolor', 'width', 'height', 'tooltip'
            ]),
            'table.new': new Set([
                'position', 'columns', 'rows', 'bgcolor', 'border_color',
                'border_width', 'border_style', 'frame_color', 'frame_width'
            ]),
            'box.new': new Set([
                'left', 'top', 'right', 'bottom', 'border_color', 'border_width',
                'border_style', 'extend', 'xloc', 'bgcolor', 'text', 'text_size',
                'text_color', 'text_halign', 'text_valign', 'text_wrap', 'text_font_family'
            ]),
            'label.new': new Set([
                'x', 'y', 'text', 'xloc', 'yloc', 'color', 'style', 'textcolor',
                'size', 'text_align', 'text_font_family', 'tooltip'
            ]),
            'line.new': new Set([
                'x1', 'y1', 'x2', 'y2', 'xloc', 'extend', 'color', 'style', 'width'
            ]),
            'strategy.entry': new Set([
                'id', 'direction', 'qty', 'limit', 'stop', 'oca_name', 'oca_type',
                'comment', 'alert_message', 'disable_alert'
            ]),
            'strategy.exit': new Set([
                'id', 'from_entry', 'qty', 'qty_percent', 'profit', 'loss', 'trail_price',
                'trail_points', 'trail_offset', 'oca_name', 'comment', 'alert_message',
                'disable_alert'
            ]),
            'strategy.close': new Set([
                'id', 'comment', 'qty', 'qty_percent', 'alert_message', 'disable_alert'
            ]),
            'strategy.cancel': new Set([
                'id', 'disable_alert'
            ]),
            'indicator': new Set([
                'title', 'shorttitle', 'overlay', 'format', 'precision', 'scale',
                'max_bars_back', 'max_lines_count', 'max_labels_count', 'max_boxes_count',
                'timeframe', 'timeframe_gaps', 'explicit_plot_zorder'
            ]),
            'strategy': new Set([
                'title', 'shorttitle', 'overlay', 'format', 'precision', 'scale',
                'pyramiding', 'calc_on_order_fills', 'calc_on_every_tick',
                'max_bars_back', 'backtest_fill_limits_assumption', 'default_qty_type',
                'default_qty_value', 'initial_capital', 'currency', 'slippage',
                'commission_type', 'commission_value', 'process_orders_on_close',
                'close_entries_rule', 'risk_free_rate', 'max_lines_count',
                'max_labels_count', 'max_boxes_count'
            ]),
            'input': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm',
                'display', 'minval', 'maxval', 'step', 'options'
            ]),
            'input.int': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm',
                'display', 'minval', 'maxval', 'step'
            ]),
            'input.float': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm',
                'display', 'minval', 'maxval', 'step'
            ]),
            'input.bool': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'
            ]),
            'input.string': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm',
                'display', 'options'
            ]),
            'input.color': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'
            ]),
            'input.source': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'
            ]),
            'input.timeframe': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'
            ]),
            'input.session': new Set([
                'defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'
            ])
        };
        // Check if this function and parameter combination is a known built-in
        const functionParams = builtInFunctionParameters[functionName];
        if (functionParams && functionParams.has(paramName)) {
            return true;
        }
        // Additional check for namespaced functions (e.g., ta.sma, math.max)
        const namespaceParts = functionName.split('.');
        if (namespaceParts.length === 2) {
            const [namespace, funcName] = namespaceParts;
            // Check common namespaced functions
            if (namespace === 'ta' || namespace === 'math' || namespace === 'array' ||
                namespace === 'matrix' || namespace === 'map' || namespace === 'str') {
                // Most technical analysis and math functions use standard parameter names
                const commonTAParams = new Set([
                    'source', 'length', 'offset', 'mult', 'basis', 'dev', 'stdev',
                    'fastlength', 'slowlength', 'signallength', 'smooth', 'smoothK', 'smoothD'
                ]);
                if (commonTAParams.has(paramName)) {
                    return true;
                }
            }
        }
        // For any parameter that's already in our known snake_case set,
        // it's likely a built-in parameter, so skip validation
        if (this.parameterPatterns.snakeCase.has(paramName)) {
            return true;
        }
        return false;
    }
    /**
     * Detect naming convention violations
     * @param paramName - Parameter name to analyze
     * @returns Naming issue details or null
     */
    detectNamingConventionViolation(paramName) {
        // Single character parameters are usually invalid (except 'a', 'x', 'y' etc which should be in singleWord list)
        if (paramName.length === 1) {
            return {
                detected: "single character",
                expected: "descriptive parameter name",
                suggestion: paramName + "_value", // generic suggestion
            };
        }
        // Check for camelCase pattern (starts lowercase, contains uppercase)
        if (this.isCamelCase(paramName)) {
            return {
                detected: "camelCase",
                expected: "snake_case or single word",
                suggestion: this.convertCamelToSnake(paramName),
            };
        }
        // Check for PascalCase pattern (starts uppercase)
        if (this.isPascalCase(paramName)) {
            return {
                detected: "PascalCase",
                expected: "snake_case or single word",
                suggestion: this.convertPascalToSnake(paramName),
            };
        }
        // Check for ALL_CAPS pattern (should be snake_case for parameters)
        if (this.isAllCaps(paramName)) {
            return {
                detected: "ALL_CAPS",
                expected: "snake_case or single word",
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
    isCamelCase(str) {
        return /^[a-z][a-zA-Z0-9]*[A-Z]/.test(str);
    }
    /**
     * Check if string follows PascalCase pattern
     * @param str - String to check
     * @returns True if PascalCase
     */
    isPascalCase(str) {
        return /^[A-Z][a-zA-Z0-9]*/.test(str) && !this.isAllCaps(str);
    }
    /**
     * Check if string is ALL_CAPS
     * @param str - String to check
     * @returns True if ALL_CAPS
     */
    isAllCaps(str) {
        return /^[A-Z][A-Z0-9_]*$/.test(str) && str.length > 1;
    }
    /**
     * Convert camelCase to snake_case
     * @param str - camelCase string
     * @returns snake_case string
     */
    convertCamelToSnake(str) {
        return str.replace(/([A-Z])/g, "_$1").toLowerCase();
    }
    /**
     * Convert PascalCase to snake_case
     * @param str - PascalCase string
     * @returns snake_case string
     */
    convertPascalToSnake(str) {
        return (str.charAt(0).toLowerCase() +
            str
                .slice(1)
                .replace(/([A-Z])/g, "_$1")
                .toLowerCase());
    }
    /**
     * Convert ALL_CAPS to snake_case
     * @param str - ALL_CAPS string
     * @returns snake_case string
     */
    convertAllCapsToSnake(str) {
        return str.toLowerCase();
    }
}
/**
 * Quick validation wrapper for integration with existing validation pipeline
 * @param source - Pine Script source code
 * @returns Quick validation result
 */
// Singleton instance for performance optimization
let _validatorInstance = null;
export async function quickValidateParameterNaming(source) {
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
export async function validateSpecificParameterError(source, errorCode) {
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
export async function validatePineScriptParameters(source) {
    return quickValidateParameterNaming(source);
}
