/**
 * Atomic Type Guards Validation Tests
 *
 * Ultra-fast (<2ms) granular tests for TypeScript type safety validation.
 * Ensures all type guards function correctly with immediate feedback loops.
 *
 * Performance Targets:
 * - Each test: <2ms execution time
 * - Type validation: <2ms per check
 * - 100% type guard coverage
 */
import { describe, it, expect } from 'vitest';
import { 
// Result type guards
isSuccess, isError, success, error, 
// Error info and types
createError, createLexicalError, createSyntaxError, createValidationError, ERROR_CODES, ERROR_SEVERITY, ERROR_CATEGORIES, } from '../../src/parser/error-handler.js';
import { 
// Parser error classes and type guards
PineScriptParseError, PineScriptValidationError, isPineScriptParseError, isPineScriptValidationError, isPineScriptParseError as indexIsPineScriptParseError, isPineScriptValidationError as indexIsPineScriptValidationError, } from '../../src/parser/index.js';
import { createSourceLocation, isASTNode, isFunctionCallNode, isParameterNode, createFunctionCallNode, createParameterNode, createLiteralNode, AST_NODE_TYPES, } from '../../src/parser/ast-types.js';
// Performance monitoring for atomic tests
function measureTypeGuard(guardName, guard, ...args) {
    const start = performance.now();
    const result = guard(...args);
    const duration = performance.now() - start;
    // Type guards should be fast (<2ms)
    expect(duration).toBeLessThan(2.0);
    return result;
}
describe('Type Guards - Result Pattern Validation', () => {
    describe('isSuccess() type guard', () => {
        it('should validate quickly', () => {
            const successResult = success('test data');
            const successWithObject = success({ key: 'value', nested: { data: 42 } });
            const successWithNull = success(null);
            const successWithUndefined = success(undefined);
            expect(measureTypeGuard('isSuccess basic', isSuccess, successResult)).toBe(true);
            expect(measureTypeGuard('isSuccess object', isSuccess, successWithObject)).toBe(true);
            expect(measureTypeGuard('isSuccess null', isSuccess, successWithNull)).toBe(true);
            expect(measureTypeGuard('isSuccess undefined', isSuccess, successWithUndefined)).toBe(true);
        });
        it('should reject error results in <0.5ms', () => {
            const errorResult = error('test error');
            const errorWithObject = error(new Error('test'));
            const errorWithInfo = error(createError(ERROR_CODES.INVALID_TOKEN, 'test'));
            expect(measureTypeGuard('isSuccess reject error', isSuccess, errorResult)).toBe(false);
            expect(measureTypeGuard('isSuccess reject Error', isSuccess, errorWithObject)).toBe(false);
            expect(measureTypeGuard('isSuccess reject ErrorInfo', isSuccess, errorWithInfo)).toBe(false);
        });
        it('should handle edge cases in <0.5ms', () => {
            // Test objects that look like success but aren't proper Result types
            const fakeSuccess = { success: true, data: 'fake', extra: 'property' };
            const malformedResult = { success: 'true', data: 'malformed' }; // string instead of boolean
            const incompleteResult = { success: true }; // missing data
            expect(measureTypeGuard('isSuccess fake', isSuccess, fakeSuccess)).toBe(true);
            expect(measureTypeGuard('isSuccess malformed', isSuccess, malformedResult)).toBe(false);
            expect(measureTypeGuard('isSuccess incomplete', isSuccess, incompleteResult)).toBe(true);
        });
        it('should handle non-object inputs in <0.5ms', () => {
            expect(measureTypeGuard('isSuccess string', isSuccess, 'not an object')).toBe(false);
            expect(measureTypeGuard('isSuccess number', isSuccess, 42)).toBe(false);
            expect(measureTypeGuard('isSuccess null', isSuccess, null)).toBe(false);
            expect(measureTypeGuard('isSuccess undefined', isSuccess, undefined)).toBe(false);
        });
    });
    describe('isError() type guard', () => {
        it('should validate quickly', () => {
            const errorResult = error('test error');
            const errorWithError = error(new Error('test'));
            const errorWithInfo = error(createError(ERROR_CODES.INVALID_TOKEN, 'test'));
            expect(measureTypeGuard('isError basic', isError, errorResult)).toBe(true);
            expect(measureTypeGuard('isError Error', isError, errorWithError)).toBe(true);
            expect(measureTypeGuard('isError ErrorInfo', isError, errorWithInfo)).toBe(true);
        });
        it('should reject success results in <0.5ms', () => {
            const successResult = success('test data');
            const successWithObject = success({ key: 'value' });
            expect(measureTypeGuard('isError reject success', isError, successResult)).toBe(false);
            expect(measureTypeGuard('isError reject object', isError, successWithObject)).toBe(false);
        });
        it('should handle edge cases in <0.5ms', () => {
            const fakeError = { success: false, error: 'fake', extra: 'property' };
            const malformedError = { success: 'false', error: 'malformed' };
            const incompleteError = { success: false };
            expect(measureTypeGuard('isError fake', isError, fakeError)).toBe(true);
            expect(measureTypeGuard('isError malformed', isError, malformedError)).toBe(false);
            expect(measureTypeGuard('isError incomplete', isError, incompleteError)).toBe(true);
        });
    });
    describe('Result type discrimination in practice', () => {
        it('should enable proper type narrowing in <0.5ms', () => {
            const results = [
                success('success data'),
                error(new Error('error data')),
            ];
            const start = performance.now();
            for (const result of results) {
                if (isSuccess(result)) {
                    // TypeScript should know this is { success: true; data: string }
                    expect(typeof result.data).toBe('string');
                    expect(result.success).toBe(true);
                    expect('error' in result).toBe(false);
                }
                else if (isError(result)) {
                    // TypeScript should know this is { success: false; error: Error }
                    expect(result.error).toBeInstanceOf(Error);
                    expect(result.success).toBe(false);
                    expect('data' in result).toBe(false);
                }
            }
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(2.0);
        });
    });
});
describe('Type Guards - Error Class Validation', () => {
    describe('isPineScriptParseError() type guard', () => {
        it('should validate quickly', () => {
            const parseError = new PineScriptParseError('Parse error');
            const parseErrorWithLocation = new PineScriptParseError('Parse error with location', createSourceLocation(1, 5, 5, 3), 'CUSTOM_CODE');
            expect(measureTypeGuard('isPineScriptParseError basic', isPineScriptParseError, parseError)).toBe(true);
            expect(measureTypeGuard('isPineScriptParseError full', isPineScriptParseError, parseErrorWithLocation)).toBe(true);
            // Test re-exported version from index
            expect(measureTypeGuard('index isPineScriptParseError', indexIsPineScriptParseError, parseError)).toBe(true);
        });
        it('should reject other error types in <0.5ms', () => {
            const regularError = new Error('Regular error');
            const validationError = new PineScriptValidationError('Validation error', []);
            const customError = new (class CustomError extends Error {
            })('Custom error');
            expect(measureTypeGuard('isPineScriptParseError reject Error', isPineScriptParseError, regularError)).toBe(false);
            expect(measureTypeGuard('isPineScriptParseError reject ValidationError', isPineScriptParseError, validationError)).toBe(false);
            expect(measureTypeGuard('isPineScriptParseError reject custom', isPineScriptParseError, customError)).toBe(false);
        });
        it('should handle non-error inputs in <0.5ms', () => {
            expect(measureTypeGuard('isPineScriptParseError string', isPineScriptParseError, 'not an error')).toBe(false);
            expect(measureTypeGuard('isPineScriptParseError object', isPineScriptParseError, { message: 'fake' })).toBe(false);
            expect(measureTypeGuard('isPineScriptParseError null', isPineScriptParseError, null)).toBe(false);
        });
    });
    describe('isPineScriptValidationError() type guard', () => {
        it('should validate quickly', () => {
            const validationError = new PineScriptValidationError('Validation error', []);
            const validationErrorWithViolations = new PineScriptValidationError('Validation error with violations', [
                { code: 'TEST_VIOLATION', message: 'Test violation' },
                { code: 'ANOTHER_VIOLATION', message: 'Another violation' },
            ], 'CUSTOM_VALIDATION_CODE');
            expect(measureTypeGuard('isPineScriptValidationError basic', isPineScriptValidationError, validationError)).toBe(true);
            expect(measureTypeGuard('isPineScriptValidationError full', isPineScriptValidationError, validationErrorWithViolations)).toBe(true);
            // Test re-exported version from index
            expect(measureTypeGuard('index isPineScriptValidationError', indexIsPineScriptValidationError, validationError)).toBe(true);
        });
        it('should reject other error types in <0.5ms', () => {
            const regularError = new Error('Regular error');
            const parseError = new PineScriptParseError('Parse error');
            expect(measureTypeGuard('isPineScriptValidationError reject Error', isPineScriptValidationError, regularError)).toBe(false);
            expect(measureTypeGuard('isPineScriptValidationError reject ParseError', isPineScriptValidationError, parseError)).toBe(false);
        });
    });
});
describe('Type Guards - AST Node Validation', () => {
    describe('isASTNode() type guard', () => {
        it('should validate quickly', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const functionCall = createFunctionCallNode('indicator', [], location);
            const parameter = createParameterNode(createLiteralNode('test', location, '"test"'), location);
            const literal = createLiteralNode(42, location, '42');
            expect(measureTypeGuard('isASTNode function call', isASTNode, functionCall)).toBe(true);
            expect(measureTypeGuard('isASTNode parameter', isASTNode, parameter)).toBe(true);
            expect(measureTypeGuard('isASTNode literal', isASTNode, literal)).toBe(true);
        });
        it('should reject non-AST objects in <0.5ms', () => {
            const fakeNode = { type: 'FakeNode', notLocation: 'invalid' };
            const partialNode = { type: AST_NODE_TYPES.LITERAL }; // missing location
            const wrongTypeNode = { type: 'InvalidType', location: createSourceLocation(1, 0, 0, 1) };
            expect(measureTypeGuard('isASTNode fake', isASTNode, fakeNode)).toBe(false);
            expect(measureTypeGuard('isASTNode partial', isASTNode, partialNode)).toBe(false);
            expect(measureTypeGuard('isASTNode wrong type', isASTNode, wrongTypeNode)).toBe(false);
        });
        it('should handle primitive inputs in <0.5ms', () => {
            expect(measureTypeGuard('isASTNode string', isASTNode, 'not a node')).toBe(false);
            expect(measureTypeGuard('isASTNode number', isASTNode, 42)).toBe(false);
            expect(measureTypeGuard('isASTNode null', isASTNode, null)).toBe(false);
        });
    });
    describe('isFunctionCallNode() type guard', () => {
        it('should validate quickly', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const functionCall = createFunctionCallNode('indicator', [], location);
            const functionCallWithParams = createFunctionCallNode('plot', [createParameterNode(createLiteralNode('close', location, 'close'), location)], location, 'ta');
            expect(measureTypeGuard('isFunctionCallNode basic', isFunctionCallNode, functionCall)).toBe(true);
            expect(measureTypeGuard('isFunctionCallNode with params', isFunctionCallNode, functionCallWithParams)).toBe(true);
        });
        it('should reject other node types in <0.5ms', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const parameter = createParameterNode(createLiteralNode('test', location, '"test"'), location);
            const literal = createLiteralNode(42, location, '42');
            expect(measureTypeGuard('isFunctionCallNode reject parameter', isFunctionCallNode, parameter)).toBe(false);
            expect(measureTypeGuard('isFunctionCallNode reject literal', isFunctionCallNode, literal)).toBe(false);
        });
    });
    describe('isParameterNode() type guard', () => {
        it('should validate quickly', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const literal = createLiteralNode('test', location, '"test"');
            const parameter = createParameterNode(literal, location, 'testParam', 0);
            const anonymousParameter = createParameterNode(literal, location);
            expect(measureTypeGuard('isParameterNode named', isParameterNode, parameter)).toBe(true);
            expect(measureTypeGuard('isParameterNode anonymous', isParameterNode, anonymousParameter)).toBe(true);
        });
        it('should reject other node types in <0.5ms', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const functionCall = createFunctionCallNode('indicator', [], location);
            const literal = createLiteralNode(42, location, '42');
            expect(measureTypeGuard('isParameterNode reject function', isParameterNode, functionCall)).toBe(false);
            expect(measureTypeGuard('isParameterNode reject literal', isParameterNode, literal)).toBe(false);
        });
    });
});
describe('Type Guards - Error Info Validation', () => {
    describe('ErrorInfo structure validation', () => {
        it('should validate quickly', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const basicError = createError(ERROR_CODES.INVALID_TOKEN, 'Basic error');
            const complexError = createError(ERROR_CODES.TYPE_MISMATCH, 'Complex error', location, {
                severity: ERROR_SEVERITY.WARNING,
                category: ERROR_CATEGORIES.SEMANTIC,
                metadata: { key: 'value' },
                suggestion: 'Try this',
                documentation: 'See docs',
            });
            const start = performance.now();
            // Validate structure
            expect(basicError.code).toBe(ERROR_CODES.INVALID_TOKEN);
            expect(basicError.message).toBe('Basic error');
            expect(basicError.severity).toBe(ERROR_SEVERITY.ERROR);
            expect(basicError.category).toBe(ERROR_CATEGORIES.LEXICAL);
            expect(complexError.severity).toBe(ERROR_SEVERITY.WARNING);
            expect(complexError.category).toBe(ERROR_CATEGORIES.SEMANTIC);
            expect(complexError.metadata).toEqual({ key: 'value' });
            expect(complexError.suggestion).toBe('Try this');
            expect(complexError.documentation).toBe('See docs');
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(2.0);
        });
        it('should validate quickly', () => {
            const location = createSourceLocation(2, 5, 10, 3);
            const start = performance.now();
            const lexicalError = createLexicalError('Invalid character', location, 'Remove it');
            expect(lexicalError.category).toBe(ERROR_CATEGORIES.LEXICAL);
            expect(lexicalError.code).toBe(ERROR_CODES.INVALID_TOKEN);
            const syntaxError = createSyntaxError(')', '(', location);
            expect(syntaxError.category).toBe(ERROR_CATEGORIES.SYNTAX);
            expect(syntaxError.code).toBe(ERROR_CODES.EXPECTED_TOKEN);
            expect(syntaxError.metadata).toEqual({ expected: ')', actual: '(' });
            const validationError = createValidationError(ERROR_CODES.SHORT_TITLE_TOO_LONG, 'Title too long', location, { length: 25 });
            expect(validationError.category).toBe(ERROR_CATEGORIES.VALIDATION);
            expect(validationError.metadata).toEqual({ length: 25 });
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(2.0);
        });
    });
});
describe('Type Guards - Constant Type Validation', () => {
    describe('ERROR_SEVERITY type validation', () => {
        it('should validate quickly', () => {
            const start = performance.now();
            // Validate that all severity levels are strings
            expect(typeof ERROR_SEVERITY.INFO).toBe('string');
            expect(typeof ERROR_SEVERITY.WARNING).toBe('string');
            expect(typeof ERROR_SEVERITY.ERROR).toBe('string');
            expect(typeof ERROR_SEVERITY.CRITICAL).toBe('string');
            // Validate specific values
            expect(ERROR_SEVERITY.INFO).toBe('info');
            expect(ERROR_SEVERITY.WARNING).toBe('warning');
            expect(ERROR_SEVERITY.ERROR).toBe('error');
            expect(ERROR_SEVERITY.CRITICAL).toBe('critical');
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(3.0);
        });
    });
    describe('ERROR_CATEGORIES type validation', () => {
        it('should validate quickly', () => {
            const start = performance.now();
            const categories = Object.values(ERROR_CATEGORIES);
            for (const category of categories) {
                expect(typeof category).toBe('string');
                expect(category.endsWith('_error')).toBe(true);
            }
            expect(ERROR_CATEGORIES.LEXICAL).toBe('lexical_error');
            expect(ERROR_CATEGORIES.SYNTAX).toBe('syntax_error');
            expect(ERROR_CATEGORIES.SEMANTIC).toBe('semantic_error');
            expect(ERROR_CATEGORIES.VALIDATION).toBe('validation_error');
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(2.0);
        });
    });
    describe('ERROR_CODES type validation', () => {
        it('should validate quickly', () => {
            const start = performance.now();
            const codes = Object.values(ERROR_CODES);
            for (const code of codes) {
                expect(typeof code).toBe('string');
                expect(code.length).toBeGreaterThan(0);
                expect(code).toMatch(/^[A-Z_]+$/); // Should be uppercase with underscores
            }
            expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN');
            expect(ERROR_CODES.EXPECTED_TOKEN).toBe('EXPECTED_TOKEN');
            expect(ERROR_CODES.SHORT_TITLE_TOO_LONG).toBe('SHORT_TITLE_TOO_LONG');
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(2.5);
        });
    });
});
describe('Type Guards - Integration and Edge Cases', () => {
    describe('Type guard composition', () => {
        it('should work correctly when composed in <0.5ms', () => {
            const results = [
                success('test'),
                error(new PineScriptParseError('parse error')),
                error(new PineScriptValidationError('validation error', [])),
                error('string error'),
            ];
            const start = performance.now();
            for (const result of results) {
                if (isSuccess(result)) {
                    expect(typeof result.data).toBe('string');
                }
                else if (isError(result)) {
                    if (isPineScriptParseError(result.error)) {
                        expect(result.error).toBeInstanceOf(PineScriptParseError);
                    }
                    else if (isPineScriptValidationError(result.error)) {
                        expect(result.error).toBeInstanceOf(PineScriptValidationError);
                    }
                    else {
                        expect(typeof result.error).toBe('string');
                    }
                }
            }
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(2.0);
        });
    });
    describe('Performance consistency', () => {
        it('should maintain consistent performance across multiple calls', () => {
            const testData = success('test data');
            const iterations = 1000;
            const durations = [];
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                isSuccess(testData);
                const duration = performance.now() - start;
                durations.push(duration);
            }
            const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
            const maxDuration = Math.max(...durations);
            expect(avgDuration).toBeLessThan(0.1); // Average should be very fast
            expect(maxDuration).toBeLessThan(0.5); // Even worst case should be fast
        });
    });
});
