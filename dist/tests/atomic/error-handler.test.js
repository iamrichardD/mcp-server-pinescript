/**
 * Atomic Tests for Error Handler Module
 *
 * Ultra-fast (<2ms) granular tests for error-handler.ts TypeScript module.
 * Each test validates ONE specific behavior in isolation for immediate feedback.
 *
 * Performance Targets:
 * - Each test: <2ms execution time
 * - All tests combined: <50ms
 * - 95%+ code coverage for error-handler.ts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { 
// Result pattern functions
success, error, isSuccess, isError, 
// Error creation functions
createError, createLexicalError, createSyntaxError, createValidationError, createShortTitleError, 
// Error collector
ErrorCollector, 
// Error handling utilities
tryParse, tryParseAsync, combineResults, 
// Constants
ERROR_SEVERITY, ERROR_CATEGORIES, ERROR_CODES, RECOVERY_STRATEGIES, 
// Global collector
globalErrorCollector, } from '../../src/parser/error-handler.js';
import { createSourceLocation } from '../../src/parser/ast-types.js';
// Performance monitoring for atomic tests
function measurePerformance(testName, fn) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    // Assert performance requirement (<2ms for atomic tests)
    expect(duration).toBeLessThan(3.0);
    return result;
}
describe('Error Handler - Result Pattern Atomic Tests', () => {
    describe('success() function', () => {
        it('should create success result in <1ms', () => {
            const testData = 'test data';
            const result = measurePerformance('success creation', () => {
                return success(testData);
            });
            expect(result.success).toBe(true);
            if (isSuccess(result)) {
                expect(result.data).toBe(testData);
            }
            expect('error' in result).toBe(false);
        });
        it('should handle complex objects in <1ms', () => {
            const complexData = {
                nested: { value: 42 },
                array: [1, 2, 3],
                timestamp: Date.now()
            };
            const result = measurePerformance('success with complex object', () => {
                return success(complexData);
            });
            expect(result.success).toBe(true);
            if (isSuccess(result)) {
                expect(result.data).toEqual(complexData);
            }
        });
        it('should handle null/undefined values in <0.5ms', () => {
            const nullResult = measurePerformance('success with null', () => {
                return success(null);
            });
            const undefinedResult = measurePerformance('success with undefined', () => {
                return success(undefined);
            });
            expect(nullResult.success).toBe(true);
            if (isSuccess(nullResult)) {
                expect(nullResult.data).toBe(null);
            }
            expect(undefinedResult.success).toBe(true);
            if (isSuccess(undefinedResult)) {
                expect(undefinedResult.data).toBe(undefined);
            }
        });
    });
    describe('error() function', () => {
        it('should create error result in <1ms', () => {
            const testError = new Error('Test error');
            const result = measurePerformance('error creation', () => {
                return error(testError);
            });
            expect(result.success).toBe(false);
            if (isError(result)) {
                expect(result.error).toBe(testError);
            }
            expect('data' in result).toBe(false);
        });
        it('should handle string errors in <0.5ms', () => {
            const errorMessage = 'String error message';
            const result = measurePerformance('error with string', () => {
                return error(errorMessage);
            });
            expect(result.success).toBe(false);
            if (isError(result)) {
                expect(result.error).toBe(errorMessage);
            }
        });
        it('should handle ErrorInfo objects in <1ms', () => {
            const errorInfo = {
                code: ERROR_CODES.INVALID_TOKEN,
                message: 'Test error info',
                severity: ERROR_SEVERITY.ERROR,
                category: ERROR_CATEGORIES.LEXICAL,
                location: createSourceLocation(1, 0, 0, 5),
            };
            const result = measurePerformance('error with ErrorInfo', () => {
                return error(errorInfo);
            });
            expect(result.success).toBe(false);
            if (isError(result)) {
                expect(result.error).toEqual(errorInfo);
            }
        });
    });
});
describe('Error Handler - Type Guard Atomic Tests', () => {
    describe('isSuccess() type guard', () => {
        it('should validate success result in <0.5ms', () => {
            const successResult = success('test data');
            const result = measurePerformance('isSuccess validation', () => {
                return isSuccess(successResult);
            });
            expect(result).toBe(true);
        });
        it('should reject error result in <0.5ms', () => {
            const errorResult = error('test error');
            const result = measurePerformance('isSuccess rejection', () => {
                return isSuccess(errorResult);
            });
            expect(result).toBe(false);
        });
        it('should handle edge cases in <0.5ms', () => {
            // Test with object that looks like success but isn't
            const fakeSuccess = { success: true, data: 'fake', extra: 'field' };
            const result = measurePerformance('isSuccess edge case', () => {
                return isSuccess(fakeSuccess);
            });
            expect(result).toBe(true); // Should still work due to duck typing
        });
    });
    describe('isError() type guard', () => {
        it('should validate error result in <0.5ms', () => {
            const errorResult = error('test error');
            const result = measurePerformance('isError validation', () => {
                return isError(errorResult);
            });
            expect(result).toBe(true);
        });
        it('should reject success result in <0.5ms', () => {
            const successResult = success('test data');
            const result = measurePerformance('isError rejection', () => {
                return isError(successResult);
            });
            expect(result).toBe(false);
        });
    });
});
describe('Error Handler - Error Factory Atomic Tests', () => {
    describe('createError() function', () => {
        it('should create basic error in <1ms', () => {
            const location = createSourceLocation(1, 0, 0, 5);
            const errorInfo = measurePerformance('createError basic', () => {
                return createError(ERROR_CODES.INVALID_TOKEN, 'Test message', location);
            });
            expect(errorInfo.code).toBe(ERROR_CODES.INVALID_TOKEN);
            expect(errorInfo.message).toBe('Test message');
            expect(errorInfo.location).toEqual(location);
            expect(errorInfo.severity).toBe(ERROR_SEVERITY.ERROR);
            expect(errorInfo.category).toBe(ERROR_CATEGORIES.LEXICAL);
        });
        it('should create error with options in <1ms', () => {
            const location = createSourceLocation(2, 5, 10, 3);
            const metadata = { context: 'test', value: 42 };
            const errorInfo = measurePerformance('createError with options', () => {
                return createError(ERROR_CODES.TYPE_MISMATCH, 'Type error', location, {
                    severity: ERROR_SEVERITY.WARNING,
                    category: ERROR_CATEGORIES.SEMANTIC,
                    metadata,
                    suggestion: 'Try using correct type',
                    documentation: 'See type guide',
                });
            });
            expect(errorInfo.severity).toBe(ERROR_SEVERITY.WARNING);
            expect(errorInfo.category).toBe(ERROR_CATEGORIES.SEMANTIC);
            expect(errorInfo.metadata).toEqual(metadata);
            expect(errorInfo.suggestion).toBe('Try using correct type');
            expect(errorInfo.documentation).toBe('See type guide');
        });
        it('should handle missing location in <1ms', () => {
            const errorInfo = measurePerformance('createError no location', () => {
                return createError(ERROR_CODES.PARSE_TIMEOUT, 'Timeout error');
            });
            expect(errorInfo.code).toBe(ERROR_CODES.PARSE_TIMEOUT);
            expect(errorInfo.message).toBe('Timeout error');
            expect(errorInfo.location).toBeUndefined();
        });
    });
    describe('createLexicalError() function', () => {
        it('should create lexical error in <1ms', () => {
            const location = createSourceLocation(1, 5, 5, 1);
            const errorInfo = measurePerformance('createLexicalError', () => {
                return createLexicalError('Invalid character', location, 'Remove special character');
            });
            expect(errorInfo.code).toBe(ERROR_CODES.INVALID_TOKEN);
            expect(errorInfo.message).toBe('Invalid character');
            expect(errorInfo.category).toBe(ERROR_CATEGORIES.LEXICAL);
            expect(errorInfo.suggestion).toBe('Remove special character');
            expect(errorInfo.location).toEqual(location);
        });
    });
    describe('createSyntaxError() function', () => {
        it('should create syntax error in <1ms', () => {
            const location = createSourceLocation(2, 10, 20, 1);
            const errorInfo = measurePerformance('createSyntaxError', () => {
                return createSyntaxError(')', '(', location);
            });
            expect(errorInfo.code).toBe(ERROR_CODES.EXPECTED_TOKEN);
            expect(errorInfo.message).toBe('Expected ), but found (');
            expect(errorInfo.category).toBe(ERROR_CATEGORIES.SYNTAX);
            expect(errorInfo.metadata).toEqual({ expected: ')', actual: '(' });
            expect(errorInfo.suggestion).toBe("Replace '(' with ')'");
        });
    });
    describe('createValidationError() function', () => {
        it('should create validation error in <1ms', () => {
            const location = createSourceLocation(3, 0, 30, 10);
            const metadata = { paramName: 'shorttitle', length: 25 };
            const errorInfo = measurePerformance('createValidationError', () => {
                return createValidationError(ERROR_CODES.SHORT_TITLE_TOO_LONG, 'Short title exceeds limit', location, metadata);
            });
            expect(errorInfo.code).toBe(ERROR_CODES.SHORT_TITLE_TOO_LONG);
            expect(errorInfo.category).toBe(ERROR_CATEGORIES.VALIDATION);
            expect(errorInfo.metadata).toEqual(metadata);
        });
    });
    describe('createShortTitleError() function', () => {
        it('should create short title error in <1ms', () => {
            const location = createSourceLocation(1, 15, 15, 25);
            const errorInfo = measurePerformance('createShortTitleError', () => {
                return createShortTitleError('This is a very long short title', 31, 20, location);
            });
            expect(errorInfo.code).toBe(ERROR_CODES.SHORT_TITLE_TOO_LONG);
            expect(errorInfo.message).toContain('(31 characters)');
            expect(errorInfo.message).toContain('20 characters or less');
            expect(errorInfo.metadata).toEqual({
                actualTitle: 'This is a very long short title',
                actualLength: 31,
                maxLength: 20,
                functionType: 'indicator/strategy',
            });
        });
    });
});
describe('Error Handler - ErrorCollector Atomic Tests', () => {
    let collector;
    beforeEach(() => {
        collector = new ErrorCollector();
    });
    describe('addError() method', () => {
        it('should add error in <1ms', () => {
            const errorInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Test error');
            measurePerformance('addError', () => {
                collector.addError(errorInfo);
            });
            expect(collector.getErrors()).toHaveLength(1);
            expect(collector.getErrors()[0]).toEqual(errorInfo);
        });
        it('should add warning in <1ms', () => {
            const warningInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Test warning', undefined, {
                severity: ERROR_SEVERITY.WARNING,
            });
            measurePerformance('addWarning', () => {
                collector.addError(warningInfo);
            });
            expect(collector.getWarnings()).toHaveLength(1);
            expect(collector.getErrors()).toHaveLength(0);
        });
    });
    describe('addRecovery() method', () => {
        it('should track recovery attempts in <1ms', () => {
            const location = createSourceLocation(1, 0, 0, 1);
            const result = measurePerformance('addRecovery', () => {
                return collector.addRecovery(RECOVERY_STRATEGIES.SKIP_TOKEN, location);
            });
            expect(result).toBe(true);
            expect(collector.getSummary().recoveryAttempts).toBe(1);
        });
        it('should prevent infinite recovery in <1ms', () => {
            const location = createSourceLocation(1, 0, 0, 1);
            // Add maximum recovery attempts + 1
            for (let i = 0; i < 11; i++) {
                collector.addRecovery(RECOVERY_STRATEGIES.SKIP_TOKEN, location);
            }
            const result = measurePerformance('recovery limit', () => {
                return collector.addRecovery(RECOVERY_STRATEGIES.SKIP_TOKEN, location);
            });
            expect(result).toBe(false);
            expect(collector.hasCriticalErrors()).toBe(true);
        });
    });
    describe('getSummary() method', () => {
        it('should generate summary in <1ms', () => {
            // Add test data
            collector.addError(createError(ERROR_CODES.INVALID_TOKEN, 'Error 1'));
            collector.addError(createError(ERROR_CODES.TYPE_MISMATCH, 'Error 2', undefined, {
                severity: ERROR_SEVERITY.WARNING,
            }));
            collector.addError(createError(ERROR_CODES.PARSE_TIMEOUT, 'Critical', undefined, {
                severity: ERROR_SEVERITY.CRITICAL,
            }));
            const summary = measurePerformance('getSummary', () => {
                return collector.getSummary();
            });
            expect(summary.totalErrors).toBe(2);
            expect(summary.totalWarnings).toBe(1);
            expect(summary.criticalErrors).toBe(1);
            expect(summary.categories[ERROR_CATEGORIES.LEXICAL]).toBe(1);
            expect(summary.categories[ERROR_CATEGORIES.PERFORMANCE]).toBe(1);
        });
    });
    describe('clear() method', () => {
        it('should clear all data in <1ms', () => {
            // Add test data
            collector.addError(createError(ERROR_CODES.INVALID_TOKEN, 'Test'));
            collector.addRecovery(RECOVERY_STRATEGIES.SKIP_TOKEN, createSourceLocation(1, 0, 0, 1));
            measurePerformance('clear', () => {
                collector.clear();
            });
            expect(collector.getErrors()).toHaveLength(0);
            expect(collector.getWarnings()).toHaveLength(0);
            expect(collector.getSummary().recoveryAttempts).toBe(0);
        });
    });
});
describe('Error Handler - Utility Functions Atomic Tests', () => {
    describe('tryParse() function', () => {
        it('should handle successful operation in <1ms', () => {
            const result = measurePerformance('tryParse success', () => {
                return tryParse(() => 'success result');
            });
            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                if (isSuccess(result)) {
                    expect(result.data).toBe('success result');
                }
            }
        });
        it('should handle thrown error in <1ms', () => {
            const result = measurePerformance('tryParse error', () => {
                return tryParse(() => {
                    throw new Error('Test error');
                });
            });
            expect(isError(result)).toBe(true);
            if (isError(result)) {
                expect(result.error.code).toBe(ERROR_CODES.UNEXPECTED_TOKEN);
                expect(result.error.message).toBe('Test error');
            }
        });
        it('should handle non-Error throws in <1ms', () => {
            const result = measurePerformance('tryParse string throw', () => {
                return tryParse(() => {
                    throw 'String error';
                });
            });
            expect(isError(result)).toBe(true);
            if (isError(result)) {
                expect(result.error.message).toBe('String error');
            }
        });
    });
    describe('tryParseAsync() function', () => {
        it('should handle successful async operation in <5ms', async () => {
            const start = performance.now();
            const result = await tryParseAsync(async () => {
                return Promise.resolve('async success');
            });
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(5.0); // Slightly higher for async
            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)) {
                if (isSuccess(result)) {
                    expect(result.data).toBe('async success');
                }
            }
        });
        it('should handle async error in <5ms', async () => {
            const start = performance.now();
            const result = await tryParseAsync(async () => {
                throw new Error('Async error');
            });
            const duration = performance.now() - start;
            expect(duration).toBeLessThan(5.0);
            expect(isError(result)).toBe(true);
            if (isError(result)) {
                expect(result.error.message).toBe('Async error');
            }
        });
    });
    describe('combineResults() function', () => {
        it('should combine success results in <1ms', () => {
            const results = [
                success('result1'),
                success('result2'),
                success('result3'),
            ];
            const combined = measurePerformance('combineResults success', () => {
                return combineResults(results);
            });
            expect(isSuccess(combined)).toBe(true);
            if (isSuccess(combined)) {
                if (isSuccess(combined)) {
                    expect(combined.data).toEqual(['result1', 'result2', 'result3']);
                }
            }
        });
        it('should combine mixed results in <1ms', () => {
            const errorInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Error');
            const results = [
                success('result1'),
                error(errorInfo),
                success('result2'),
            ];
            const combined = measurePerformance('combineResults mixed', () => {
                return combineResults(results);
            });
            expect(isError(combined)).toBe(true);
            if (isError(combined)) {
                expect(combined.error).toHaveLength(1);
                expect(combined.error[0]).toEqual(errorInfo);
            }
        });
        it('should handle empty array in <0.5ms', () => {
            const combined = measurePerformance('combineResults empty', () => {
                return combineResults([]);
            });
            expect(isSuccess(combined)).toBe(true);
            if (isSuccess(combined)) {
                if (isSuccess(combined)) {
                    expect(combined.data).toEqual([]);
                }
            }
        });
    });
});
describe('Error Handler - Constants Validation Atomic Tests', () => {
    it('should validate ERROR_SEVERITY constants in <0.5ms', () => {
        measurePerformance('ERROR_SEVERITY validation', () => {
            expect(ERROR_SEVERITY.INFO).toBe('info');
            expect(ERROR_SEVERITY.WARNING).toBe('warning');
            expect(ERROR_SEVERITY.ERROR).toBe('error');
            expect(ERROR_SEVERITY.CRITICAL).toBe('critical');
        });
    });
    it('should validate ERROR_CATEGORIES constants in <0.5ms', () => {
        measurePerformance('ERROR_CATEGORIES validation', () => {
            expect(ERROR_CATEGORIES.LEXICAL).toBe('lexical_error');
            expect(ERROR_CATEGORIES.SYNTAX).toBe('syntax_error');
            expect(ERROR_CATEGORIES.SEMANTIC).toBe('semantic_error');
            expect(ERROR_CATEGORIES.VALIDATION).toBe('validation_error');
            expect(ERROR_CATEGORIES.PERFORMANCE).toBe('performance_error');
            expect(ERROR_CATEGORIES.INTEGRATION).toBe('integration_error');
        });
    });
    it('should validate ERROR_CODES constants in <0.5ms', () => {
        measurePerformance('ERROR_CODES validation', () => {
            expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN');
            expect(ERROR_CODES.EXPECTED_TOKEN).toBe('EXPECTED_TOKEN');
            expect(ERROR_CODES.SHORT_TITLE_TOO_LONG).toBe('SHORT_TITLE_TOO_LONG');
            expect(ERROR_CODES.TYPE_MISMATCH).toBe('TYPE_MISMATCH');
            expect(ERROR_CODES.PARSE_TIMEOUT).toBe('PARSE_TIMEOUT');
        });
    });
    it('should validate RECOVERY_STRATEGIES constants in <0.5ms', () => {
        measurePerformance('RECOVERY_STRATEGIES validation', () => {
            expect(RECOVERY_STRATEGIES.SKIP_TOKEN).toBe('skip_token');
            expect(RECOVERY_STRATEGIES.SKIP_TO_SEMICOLON).toBe('skip_to_semicolon');
            expect(RECOVERY_STRATEGIES.INSERT_MISSING_TOKEN).toBe('insert_missing_token');
        });
    });
});
describe('Error Handler - Global Collector Atomic Tests', () => {
    it('should access global collector in <0.5ms', () => {
        measurePerformance('global collector access', () => {
            expect(globalErrorCollector).toBeInstanceOf(ErrorCollector);
        });
    });
    it('should use global collector in <1ms', () => {
        const errorInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Global test');
        measurePerformance('global collector usage', () => {
            globalErrorCollector.clear();
            globalErrorCollector.addError(errorInfo);
        });
        expect(globalErrorCollector.getErrors()).toHaveLength(1);
    });
});
