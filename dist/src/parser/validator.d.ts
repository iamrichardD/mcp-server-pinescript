/**
 * Load validation rules from the main validation-rules.json
 * Called during MCP server initialization
 *
 * @param {Object} rules - Complete validation rules object
 */
export function loadValidationRules(rules: Object): void;
/**
 * Get current validation rules (for debugging/testing)
 * @returns {Object|null} Current validation rules or null if not loaded
 */
export function getCurrentValidationRules(): Object | null;
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
export function validatePineScriptParameters(source: string, rules?: Object): Promise<Object>;
/**
 * Validate function parameters against expected signatures
 * Core function for parameter type and count validation
 *
 * @param {Array} functionCalls - Extracted function calls from AST
 * @param {Object} rules - Validation rules
 * @returns {Promise<Object>} Validation result with violations array
 */
export function validateFunctionSignatures(functionCalls: any[], rules: Object): Promise<Object>;
/**
 * Validate short title length constraint
 */
export function validateShortTitle(source: any): {
    success: boolean;
    hasShortTitleError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: string | undefined;
            actualLength: number;
            maxLength: number;
            functionName: string | undefined;
            parameterName: string;
            violationType: string;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
};
/**
 * Validate short title length constraints
 */
export function quickValidateShortTitle(source: any): Promise<{
    success: boolean;
    hasShortTitleError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: string | undefined;
            actualLength: number;
            maxLength: number;
            functionName: string | undefined;
            parameterName: string;
            violationType: string;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate precision parameter constraints
 */
export function quickValidatePrecision(source: any): Promise<{
    success: boolean;
    hasPrecisionError: boolean;
    violations: ({
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isNonInteger: boolean;
            violationType: string;
            isOutOfRange?: never;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
            violationType: string;
            isNonInteger?: never;
        };
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate max_bars_back constraints
 */
export function quickValidateMaxBarsBack(source: any): Promise<{
    success: boolean;
    hasMaxBarsBackError: boolean;
    violations: ({
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isNonInteger: boolean;
            violationType: string;
            isOutOfRange?: never;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
            violationType: string;
            isNonInteger?: never;
        };
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate max lines count constraints
 */
export function quickValidateMaxLinesCount(source: any): Promise<{
    success: boolean;
    hasMaxLinesCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate max labels count constraints
 */
export function quickValidateMaxLabelsCount(source: any): Promise<{
    success: boolean;
    hasMaxLabelsCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate max boxes count constraints
 */
export function quickValidateMaxBoxesCount(source: any): Promise<{
    success: boolean;
    hasMaxBoxesCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * CRITICAL BUG 1 FIX: Runtime NA Object Access Validation
 * Comprehensive wrapper that delegates to the specialized RuntimeNAObjectValidator
 *
 * This addresses the complete failure to detect runtime-breaking NA object access patterns:
 * - Direct access: var UDT obj = na; value = obj.field
 * - Historical access: value = (obj[1]).field
 * - Uninitialized access: UDT obj; value = obj.field
 *
 * SUCCESS CRITERIA: Must detect 3+ runtime errors as "error" severity
 */
export function quickValidateRuntimeNAObjectAccess(source: any): Promise<{
    success: any;
    violations: any;
    hasRuntimeError: boolean;
    metrics: any;
}>;
/**
 * Validate series type where simple expected constraints
 * Detects when UDT fields are used where simple series types are expected
 */
export function quickValidateSeriesTypeWhereSimpleExpected(source: any): Promise<{
    violations: ({
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: any;
        column: number;
        details: {
            functionName: string | undefined;
            parameterName: any;
            parameterIndex: any;
            udtObject: any;
            udtField: any;
            expectedType: string;
            actualType: string;
            suggestion: string;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: any;
        column: number;
        details: {
            functionName: any;
            parameterName: string;
            parameterIndex: number;
            udtObject: any;
            udtField: any;
            expectedType: string;
            actualType: string;
            suggestion: string;
        };
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate input types for function parameters
 * Detects type mismatches in function parameter usage
 */
export function quickValidateInputTypes(source: any): Promise<{
    success: boolean;
    violations: {
        rule: string;
        functionName: any;
        parameterName: any;
        expectedType: any;
        actualType: string;
        severity: string;
        category: string;
        message: string;
        reason: string;
        line: any;
        column: any;
    }[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        typeChecksPerformed: number;
    };
}>;
/**
 * Validate builtin namespace conflicts
 * Detects when user variables conflict with Pine Script built-in namespaces
 */
export function quickValidateBuiltinNamespace(source: any): Promise<{
    success: boolean;
    hasNamespaceError: boolean;
    violations: {
        rule: string;
        code: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        location: {
            line: number;
            column: number;
            source: string;
        };
        metadata: {
            conflictingNamespace: string;
            variableAssignment: boolean;
            suggestedFix: string;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate line continuation syntax
 * Detects improper line continuation usage
 */
export function quickValidateLineContinuation(source: any): Promise<{
    violations: ({
        rule: string;
        errorCode: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        suggestedFix: string;
        details: {
            issue: string;
            pattern: string;
            suggestion: string;
        };
    } | {
        rule: string;
        errorCode: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        details: {
            issue: string;
            suggestion: string;
            pattern?: never;
        };
        suggestedFix?: never;
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
/**
 * Validate function signatures
 * Detects parameter count and type mismatches
 */
export function quickValidateFunctionSignatures(source: any): Promise<{
    success: boolean;
    violations: never[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        signatureChecksPerformed?: never;
    };
} | {
    success: boolean;
    violations: ({
        rule: string;
        severity: string;
        category: string;
        functionName: any;
        reason: string;
        expectedParams: any;
        actualParams: any;
        message: string;
        line: number;
        column: any;
        metadata: {
            functionName: any;
            expectedSignature: any;
            actualParameters: any;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        functionName: any;
        reason: string;
        parameterName: any;
        expectedType: any;
        actualType: any;
        message: string;
        line: number;
        column: any;
        metadata: {
            functionName: any;
            parameterIndex: number;
            expectedSignature: any;
            actualParameters: any;
        };
    })[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        signatureChecksPerformed: number;
    };
}>;
/**
 * Validate drawing object counts
 * Detects when drawing object limits are exceeded
 */
export function quickValidateDrawingObjectCounts(source: any): Promise<{
    success: boolean;
    hasDrawingObjectCountError: boolean;
    hasMaxLinesCountError: boolean;
    hasMaxLabelsCountError: boolean;
    hasMaxBoxesCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateSeriesTypeWhereSimpleExpected(source: any): Promise<{
    violations: ({
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: any;
        column: number;
        details: {
            functionName: string | undefined;
            parameterName: any;
            parameterIndex: any;
            udtObject: any;
            udtField: any;
            expectedType: string;
            actualType: string;
            suggestion: string;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: any;
        column: number;
        details: {
            functionName: any;
            parameterName: string;
            parameterIndex: number;
            udtObject: any;
            udtField: any;
            expectedType: string;
            actualType: string;
            suggestion: string;
        };
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateInputTypes(source: any): Promise<{
    success: boolean;
    violations: {
        rule: string;
        functionName: any;
        parameterName: any;
        expectedType: any;
        actualType: string;
        severity: string;
        category: string;
        message: string;
        reason: string;
        line: any;
        column: any;
    }[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        typeChecksPerformed: number;
    };
}>;
export function validateBuiltinNamespace(source: any): {
    success: boolean;
    hasNamespaceError: boolean;
    violations: {
        rule: string;
        code: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        location: {
            line: number;
            column: number;
            source: string;
        };
        metadata: {
            conflictingNamespace: string;
            variableAssignment: boolean;
            suggestedFix: string;
        };
    }[];
    metrics: {
        validationTimeMs: number;
        linesAnalyzed: number;
    };
};
export function validateLineContinuation(source: any): Promise<{
    violations: ({
        rule: string;
        errorCode: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        suggestedFix: string;
        details: {
            issue: string;
            pattern: string;
            suggestion: string;
        };
    } | {
        rule: string;
        errorCode: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        details: {
            issue: string;
            suggestion: string;
            pattern?: never;
        };
        suggestedFix?: never;
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateFunctionSignaturesFromSource(source: any): Promise<{
    success: boolean;
    violations: never[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        signatureChecksPerformed?: never;
    };
} | {
    success: boolean;
    violations: ({
        rule: string;
        severity: string;
        category: string;
        functionName: any;
        reason: string;
        expectedParams: any;
        actualParams: any;
        message: string;
        line: number;
        column: any;
        metadata: {
            functionName: any;
            expectedSignature: any;
            actualParameters: any;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        functionName: any;
        reason: string;
        parameterName: any;
        expectedType: any;
        actualType: any;
        message: string;
        line: number;
        column: any;
        metadata: {
            functionName: any;
            parameterIndex: number;
            expectedSignature: any;
            actualParameters: any;
        };
    })[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        signatureChecksPerformed: number;
    };
}>;
export function validateDrawingObjectCounts(source: any): Promise<{
    success: boolean;
    hasDrawingObjectCountError: boolean;
    hasMaxLinesCountError: boolean;
    hasMaxLabelsCountError: boolean;
    hasMaxBoxesCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validatePrecision(source: any): Promise<{
    success: boolean;
    hasPrecisionError: boolean;
    violations: ({
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isNonInteger: boolean;
            violationType: string;
            isOutOfRange?: never;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
            violationType: string;
            isNonInteger?: never;
        };
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateMaxBarsBack(source: any): Promise<{
    success: boolean;
    hasMaxBarsBackError: boolean;
    violations: ({
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isNonInteger: boolean;
            violationType: string;
            isOutOfRange?: never;
        };
    } | {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
            violationType: string;
            isNonInteger?: never;
        };
    })[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateMaxLinesCount(source: any): Promise<{
    success: boolean;
    hasMaxLinesCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateMaxLabelsCount(source: any): Promise<{
    success: boolean;
    hasMaxLabelsCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateMaxBoxesCount(source: any): Promise<{
    success: boolean;
    hasMaxBoxesCountError: boolean;
    violations: {
        rule: string;
        severity: string;
        category: string;
        message: string;
        line: number;
        column: number;
        metadata: {
            actualValue: number;
            minValue: number;
            maxValue: number;
            functionName: string | undefined;
            parameterName: string;
            isOutOfRange: boolean;
        };
    }[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function extractFunctionCalls(source: any): {
    name: any;
    parameters: any;
    position: any;
}[];
export function inferParameterTypes(paramValue: any): "string" | "identifier" | "unknown" | "int" | "float" | "bool" | "series float" | "function_result";
export function getExpectedTypes(functionName: any): {
    params: any;
};
export function compareTypes(expectedType: any, actualType: any): {
    isValid: boolean;
    reason: string;
    expected: any;
    actual: any;
};
export function getExpectedSignature(functionName: any): any;
export function validateParameterCount(signature: any, actualParams: any): {
    isValid: boolean;
    reason: string;
    expected?: never;
    actual?: never;
    message?: never;
} | {
    isValid: boolean;
    reason: string;
    expected: any;
    actual: any;
    message: string;
} | {
    isValid: boolean;
    reason: string;
    expected: any;
    actual: any;
    message?: never;
};
export function validateParameters(source: any, rules: any): Promise<{
    violations: never[];
    metrics: {
        validationTimeMs: number;
    };
}>;
export function validateParameterTypes(signature: any, actualParams: any): {
    isValid: boolean;
    reason: string;
    violations?: never;
} | {
    isValid: boolean;
    violations: {
        parameter: any;
        expected: any;
        actual: any;
        expectedType: any;
        actualType: any;
        index: number;
        message: string;
    }[];
    reason: string;
};
/**
 * Extract deprecated function calls from Pine Script source code
 * Identifies functions that need to be migrated to modern namespaced equivalents
 *
 * @param {string} source - Pine Script source code
 * @returns {Array} Array of deprecated function call objects
 */
export function extractDeprecatedFunctionCalls(source: string): any[];
/**
 * Analyze Pine Script version directive
 * Extracts and validates the @version directive
 *
 * @param {string} source - Pine Script source code
 * @returns {Object} Version analysis result
 */
export function analyzeVersionDirective(source: string): Object;
/**
 * Validate namespace requirements for function calls
 * Identifies functions that require specific namespaces in modern Pine Script
 *
 * @param {string} source - Pine Script source code
 * @returns {Array} Array of namespace requirement violations
 */
export function validateNamespaceRequirements(source: string): any[];
/**
 * Comprehensive syntax compatibility validation
 * Main validation function that orchestrates all syntax compatibility checks
 *
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Complete validation result
 */
export function validateSyntaxCompatibility(source: string): Promise<Object>;
/**
 * Quick syntax compatibility validation
 * Optimized version for high-performance validation
 *
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Validation result (same format as full validation)
 */
export function quickValidateSyntaxCompatibility(source: string): Promise<Object>;
