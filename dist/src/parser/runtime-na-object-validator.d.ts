/**
 * Quick validation wrapper for integration with existing validation pipeline
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Quick validation result
 */
export function quickValidateNAObjectAccess(source: string): Promise<Object>;
/**
 * Factory function for creating NA object access violations
 * @param {string} objectName - Name of the object
 * @param {string} fieldName - Name of the field being accessed
 * @param {number} line - Line number
 * @param {number} column - Column number
 * @param {string} violationType - Type of violation
 * @returns {Object} Violation object
 */
export function createNAObjectViolation(objectName: string, fieldName: string, line: number, column: number, violationType: string): Object;
/**
 * Runtime NA Object Access Validation System
 *
 * This module detects critical runtime errors related to accessing fields
 * of undefined (na) user-defined type objects in Pine Script v6 code.
 *
 * Addresses CRITICAL BUG 1: Runtime NA Object Access Detection
 * - Detects direct field access on na objects (obj.field where obj = na)
 * - Detects historical field access on potentially na objects (obj[n].field)
 * - Tracks UDT object initialization states throughout script execution
 *
 * Performance Target: <3ms validation time for 2000+ line scripts
 * Error Detection: Must identify 3+ runtime errors as "error" severity
 */
/**
 * Core runtime validation class for NA object access detection
 */
export class RuntimeNAObjectValidator {
    patterns: {
        udtTypeDeclaration: RegExp;
        udtFieldDeclaration: RegExp;
        varNADeclaration: RegExp;
        directNAAssignment: RegExp;
        fieldAccess: RegExp;
        historicalFieldAccess: RegExp;
        constructorCall: RegExp;
        objectAssignment: RegExp;
    };
    udtTypes: Map<any, any>;
    objectStates: Map<any, any>;
    /**
     * Main validation entry point - detects all NA object access violations
     * @param {string} source - Pine Script source code
     * @returns {Promise<Object>} Validation result with violations
     */
    validateNAObjectAccess(source: string): Promise<Object>;
    /**
     * Phase 1: Parse UDT type definitions from source code
     * @param {string[]} lines - Source code lines
     */
    parseUDTTypeDefinitions(lines: string[]): void;
    /**
     * Phase 2: Track object initialization states throughout the script
     * @param {string[]} lines - Source code lines
     */
    trackObjectInitializationStates(lines: string[]): void;
    /**
     * Phase 3: Detect all types of NA object access violations
     * @param {string[]} lines - Source code lines
     * @returns {Array} Array of violation objects
     */
    detectNAObjectViolations(lines: string[]): any[];
    /**
     * Detect direct field access on NA objects (obj.field where obj = na)
     * @param {string} line - Current line of code
     * @param {number} lineNumber - Line number (1-based)
     * @returns {Array} Array of violations found
     */
    detectDirectNAFieldAccess(line: string, lineNumber: number): any[];
    /**
     * Detect historical field access violations ((obj[n]).field)
     * @param {string} line - Current line of code
     * @param {number} lineNumber - Line number (1-based)
     * @returns {Array} Array of violations found
     */
    detectHistoricalNAFieldAccess(line: string, lineNumber: number): any[];
}
