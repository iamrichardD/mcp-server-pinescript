/**
 * Enhanced function signature validation with both bug fixes integrated
 * This is the function called by the MCP service integration
 */
export function quickValidateFunctionSignaturesEnhanced(source: any): Promise<{
    success: boolean;
    violations: any[];
    metrics: {
        validationTimeMs: number;
        functionsAnalyzed: number;
        signatureChecksPerformed: number;
    };
}>;
