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
    constructor() {
        // Pre-compiled regex patterns for optimal performance
        this.patterns = {
            // UDT type declaration: type MyType\n    float field
            udtTypeDeclaration: /^type\s+([A-Z][a-zA-Z0-9_]*)\s*$/,
            // UDT field declaration inside type
            udtFieldDeclaration: /^\s+((?:float|int|bool|string|color|array|matrix|map)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*$/,
            // Variable declaration with na: var UDTType objName = na
            varNADeclaration: /^var\s+([A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*na\s*$/,
            // Direct na assignment: UDTType objName = na (without var)
            directNAAssignment: /^([A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*na\s*$/,
            // Field access pattern: objName.fieldName
            fieldAccess: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g,
            // Historical field access: (objName[index]).fieldName
            historicalFieldAccess: /\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(\d+)\s*\]\s*\)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g,
            // UDT constructor call: UDTType.new(...)
            constructorCall: /([A-Z][a-zA-Z0-9_]*)\s*\.\s*new\s*\(/,
            // Assignment to object: objName = UDTType.new(...)
            objectAssignment: /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([A-Z][a-zA-Z0-9_]*)\s*\.\s*new/
        };
        // Track UDT types and their fields
        this.udtTypes = new Map();
        // Track object declarations and their initialization states
        this.objectStates = new Map();
    }
    /**
     * Main validation entry point - detects all NA object access violations
     * @param {string} source - Pine Script source code
     * @returns {Promise<Object>} Validation result with violations
     */
    async validateNAObjectAccess(source) {
        const startTime = performance.now();
        const violations = [];
        try {
            const lines = source.split('\n');
            // Phase 1: Parse UDT type definitions and track available types
            this.parseUDTTypeDefinitions(lines);
            // Phase 2: Track object declarations and initialization states
            this.trackObjectInitializationStates(lines);
            // Phase 3: Detect runtime violations
            const naViolations = this.detectNAObjectViolations(lines);
            violations.push(...naViolations);
            return {
                isValid: violations.length === 0,
                violations,
                metrics: {
                    validationTimeMs: performance.now() - startTime,
                    udtTypesFound: this.udtTypes.size,
                    objectsTracked: this.objectStates.size,
                    violationsFound: violations.length
                }
            };
        }
        catch (error) {
            return {
                isValid: false,
                violations: [{
                        severity: "error",
                        message: `Runtime NA object validation failed: ${error.message}`,
                        category: "validation_error",
                        line: 1,
                        column: 1,
                        rule: "NA_OBJECT_VALIDATION_ERROR"
                    }],
                metrics: {
                    validationTimeMs: performance.now() - startTime,
                    udtTypesFound: 0,
                    objectsTracked: 0,
                    violationsFound: 1
                }
            };
        }
    }
    /**
     * Phase 1: Parse UDT type definitions from source code
     * @param {string[]} lines - Source code lines
     */
    parseUDTTypeDefinitions(lines) {
        let currentUDTType = null;
        const currentFields = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Check for type declaration start
            const typeMatch = this.patterns.udtTypeDeclaration.exec(line);
            if (typeMatch) {
                // Save previous type if exists
                if (currentUDTType) {
                    this.udtTypes.set(currentUDTType, [...currentFields]);
                }
                // Start new type
                currentUDTType = typeMatch[1];
                currentFields.length = 0; // Clear array
                continue;
            }
            // Check for field declaration within type
            if (currentUDTType) {
                const fieldMatch = this.patterns.udtFieldDeclaration.exec(line);
                if (fieldMatch) {
                    const fieldName = fieldMatch[2];
                    currentFields.push(fieldName);
                    continue;
                }
                // If we hit a non-indented line that's not empty, we're out of the type
                if (line && !line.startsWith(' ') && !line.startsWith('\t')) {
                    this.udtTypes.set(currentUDTType, [...currentFields]);
                    currentUDTType = null;
                }
            }
        }
        // Save the last type if exists
        if (currentUDTType) {
            this.udtTypes.set(currentUDTType, [...currentFields]);
        }
    }
    /**
     * Phase 2: Track object initialization states throughout the script
     * @param {string[]} lines - Source code lines
     */
    trackObjectInitializationStates(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            // Check for var UDTType objName = na
            const varNAMatch = this.patterns.varNADeclaration.exec(line);
            if (varNAMatch) {
                const [, udtType, objectName] = varNAMatch;
                this.objectStates.set(objectName, {
                    type: udtType,
                    initializationState: 'na',
                    declarationLine: lineNumber,
                    isVariable: true
                });
                continue;
            }
            // Check for direct assignment: UDTType objName = na
            const directNAMatch = this.patterns.directNAAssignment.exec(line);
            if (directNAMatch) {
                const [, udtType, objectName] = directNAMatch;
                this.objectStates.set(objectName, {
                    type: udtType,
                    initializationState: 'na',
                    declarationLine: lineNumber,
                    isVariable: false
                });
                continue;
            }
            // Check for constructor assignments: objName = UDTType.new(...)
            const assignmentMatch = this.patterns.objectAssignment.exec(line);
            if (assignmentMatch) {
                const [, objectName, udtType] = assignmentMatch;
                // Update existing object state or create new one
                if (this.objectStates.has(objectName)) {
                    const existingState = this.objectStates.get(objectName);
                    existingState.initializationState = 'initialized';
                }
                else {
                    this.objectStates.set(objectName, {
                        type: udtType,
                        initializationState: 'initialized',
                        declarationLine: lineNumber,
                        isVariable: false
                    });
                }
            }
        }
    }
    /**
     * Phase 3: Detect all types of NA object access violations
     * @param {string[]} lines - Source code lines
     * @returns {Array} Array of violation objects
     */
    detectNAObjectViolations(lines) {
        const violations = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            // Detect direct field access violations
            violations.push(...this.detectDirectNAFieldAccess(line, lineNumber));
            // Detect historical field access violations
            violations.push(...this.detectHistoricalNAFieldAccess(line, lineNumber));
        }
        return violations;
    }
    /**
     * Detect direct field access on NA objects (obj.field where obj = na)
     * @param {string} line - Current line of code
     * @param {number} lineNumber - Line number (1-based)
     * @returns {Array} Array of violations found
     */
    detectDirectNAFieldAccess(line, lineNumber) {
        const violations = [];
        // Reset regex state for global regex
        this.patterns.fieldAccess.lastIndex = 0;
        let match;
        while ((match = this.patterns.fieldAccess.exec(line)) !== null) {
            const [fullMatch, objectName, fieldName] = match;
            const column = match.index + 1;
            // Check if this object is tracked and initialized as na
            if (this.objectStates.has(objectName)) {
                const objectState = this.objectStates.get(objectName);
                if (objectState.initializationState === 'na') {
                    // Verify the field exists in the UDT type (for more precise error)
                    const udtFields = this.udtTypes.get(objectState.type) || [];
                    const fieldExists = udtFields.length === 0 || udtFields.includes(fieldName);
                    violations.push({
                        line: lineNumber,
                        column: column,
                        rule: 'na_object_access',
                        severity: 'error',
                        message: `Cannot access field '${fieldName}' of undefined (na) object '${objectName}'. Initialize object before accessing fields.`,
                        category: 'runtime_error',
                        suggested_fix: `Initialize ${objectName} with ${objectState.type}.new() before accessing fields`,
                        metadata: {
                            objectName,
                            fieldName,
                            udtType: objectState.type,
                            violationType: 'direct_na_access',
                            declarationLine: objectState.declarationLine
                        }
                    });
                }
            }
        }
        return violations;
    }
    /**
     * Detect historical field access violations ((obj[n]).field)
     * @param {string} line - Current line of code
     * @param {number} lineNumber - Line number (1-based)
     * @returns {Array} Array of violations found
     */
    detectHistoricalNAFieldAccess(line, lineNumber) {
        const violations = [];
        // Reset regex state for global regex
        this.patterns.historicalFieldAccess.lastIndex = 0;
        let match;
        while ((match = this.patterns.historicalFieldAccess.exec(line)) !== null) {
            const [fullMatch, objectName, historicalIndex, fieldName] = match;
            const column = match.index + 1;
            // Check if this is a tracked UDT object
            if (this.objectStates.has(objectName)) {
                const objectState = this.objectStates.get(objectName);
                // Historical access is risky regardless of initialization state
                // because historical values can be na even if current value is initialized
                violations.push({
                    line: lineNumber,
                    column: column,
                    rule: 'na_object_history_access',
                    severity: 'error',
                    message: `Cannot access field '${fieldName}' of potentially undefined historical object '${objectName}[${historicalIndex}]'. Add na validation check.`,
                    category: 'runtime_error',
                    suggested_fix: `Add na check: not na(${objectName}[${historicalIndex}]) ? (${objectName}[${historicalIndex}]).${fieldName} : 0`,
                    metadata: {
                        objectName,
                        fieldName,
                        historicalIndex: parseInt(historicalIndex, 10),
                        udtType: objectState.type,
                        violationType: 'historical_na_access',
                        declarationLine: objectState.declarationLine
                    }
                });
            }
        }
        return violations;
    }
}
/**
 * Quick validation wrapper for integration with existing validation pipeline
 * @param {string} source - Pine Script source code
 * @returns {Promise<Object>} Quick validation result
 */
export async function quickValidateNAObjectAccess(source) {
    const validator = new RuntimeNAObjectValidator();
    return validator.validateNAObjectAccess(source);
}
/**
 * Factory function for creating NA object access violations
 * @param {string} objectName - Name of the object
 * @param {string} fieldName - Name of the field being accessed
 * @param {number} line - Line number
 * @param {number} column - Column number
 * @param {string} violationType - Type of violation
 * @returns {Object} Violation object
 */
export function createNAObjectViolation(objectName, fieldName, line, column, violationType) {
    const violationMessages = {
        direct_na_access: `Cannot access field '${fieldName}' of undefined (na) object '${objectName}'. Initialize object before accessing fields.`,
        historical_na_access: `Cannot access field '${fieldName}' of potentially undefined historical object. Add na validation check.`
    };
    const suggestedFixes = {
        direct_na_access: `Initialize ${objectName} before accessing fields`,
        historical_na_access: `Add na check before accessing historical object`
    };
    return {
        line,
        column,
        rule: violationType === 'direct_na_access' ? 'na_object_access' : 'na_object_history_access',
        severity: 'error',
        message: violationMessages[violationType] || 'Runtime NA object access error',
        category: 'runtime_error',
        suggested_fix: suggestedFixes[violationType] || 'Fix object initialization',
        metadata: {
            objectName,
            fieldName,
            violationType
        }
    };
}
// Export the validator class and utility functions (already exported above)
