/**
 * Minimal Atomic Performance Testing Framework
 *
 * Demonstrates ultra-fast atomic testing with <2ms performance targets.
 * Tests core functions that are confirmed to work in the codebase.
 *
 * This framework demonstrates:
 * - <2ms per atomic test execution
 * - Performance regression detection
 * - Fast feedback loops for development
 * - Granular test coverage
 */
import { describe, it, expect } from 'vitest';
import { success, error, isSuccess, isError, createError, ERROR_CODES, ERROR_SEVERITY, ERROR_CATEGORIES, tryParse, combineResults, } from '../../src/parser/error-handler.js';
// Ultra-fast performance monitoring for atomic tests
function measureAtomicPerformance(testName, targetMs, fn) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    const passed = duration <= targetMs;
    return { result, duration, passed };
}
// Performance tracking for test suite
class AtomicPerformanceTracker {
    tests = [];
    record(name, duration, target, passed) {
        this.tests.push({ name, duration, target, passed });
    }
    getSummary() {
        if (this.tests.length === 0) {
            return {
                total: 0,
                passed: 0,
                failed: 0,
                averageDuration: 0,
                slowestTest: '',
                fastestTest: '',
            };
        }
        const durations = this.tests.map(t => t.duration);
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        const slowestTest = this.tests.find(t => t.duration === maxDuration)?.name || '';
        const fastestTest = this.tests.find(t => t.duration === minDuration)?.name || '';
        return {
            total: this.tests.length,
            passed: this.tests.filter(t => t.passed).length,
            failed: this.tests.filter(t => !t.passed).length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            slowestTest,
            fastestTest,
        };
    }
    getFailures() {
        return this.tests
            .filter(t => !t.passed)
            .map(t => ({ name: t.name, duration: t.duration, target: t.target }));
    }
}
const tracker = new AtomicPerformanceTracker();
describe('Atomic Performance Framework - Core Functions', () => {
    describe('Result Pattern Performance (<1ms)', () => {
        it('success() should execute in <0.5ms', () => {
            const measurement = measureAtomicPerformance('success() creation', 0.5, () => success('test data'));
            tracker.record('success()', measurement.duration, 0.5, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result.success).toBe(true);
            if (isSuccess(measurement.result)) {
                expect(measurement.result.data).toBe('test data');
            }
        });
        it('error() should execute in <0.5ms', () => {
            const measurement = measureAtomicPerformance('error() creation', 0.5, () => error('test error'));
            tracker.record('error()', measurement.duration, 0.5, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result.success).toBe(false);
            if (isError(measurement.result)) {
                expect(measurement.result.error).toBe('test error');
            }
        });
        it('isSuccess() should execute in <0.2ms', () => {
            const testResult = success('test');
            const measurement = measureAtomicPerformance('isSuccess() check', 0.2, () => isSuccess(testResult));
            tracker.record('isSuccess()', measurement.duration, 0.2, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result).toBe(true);
        });
        it('isError() should execute in <0.2ms', () => {
            const testResult = error('test');
            const measurement = measureAtomicPerformance('isError() check', 0.2, () => isError(testResult));
            tracker.record('isError()', measurement.duration, 0.2, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result).toBe(true);
        });
    });
    describe('Error Creation Performance (<1ms)', () => {
        it('createError() basic should execute in <1ms', () => {
            const measurement = measureAtomicPerformance('createError() basic', 1.0, () => createError(ERROR_CODES.INVALID_TOKEN, 'Test error'));
            tracker.record('createError() basic', measurement.duration, 1.0, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result.code).toBe(ERROR_CODES.INVALID_TOKEN);
            expect(measurement.result.message).toBe('Test error');
        });
        it('createError() with options should execute in <1.5ms', () => {
            const measurement = measureAtomicPerformance('createError() with options', 1.5, () => createError(ERROR_CODES.TYPE_MISMATCH, 'Type error', undefined, {
                severity: ERROR_SEVERITY.WARNING,
                category: ERROR_CATEGORIES.SEMANTIC,
                metadata: { context: 'test' },
                suggestion: 'Fix the type',
            }));
            tracker.record('createError() complex', measurement.duration, 1.5, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result.severity).toBe(ERROR_SEVERITY.WARNING);
            expect(measurement.result.category).toBe(ERROR_CATEGORIES.SEMANTIC);
        });
    });
    describe('Utility Functions Performance (<2ms)', () => {
        it('tryParse() success should execute in <1ms', () => {
            const measurement = measureAtomicPerformance('tryParse() success', 1.0, () => tryParse(() => 'successful operation'));
            tracker.record('tryParse() success', measurement.duration, 1.0, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(isSuccess(measurement.result)).toBe(true);
        });
        it('tryParse() error should execute in <1.5ms', () => {
            const measurement = measureAtomicPerformance('tryParse() error', 1.5, () => tryParse(() => { throw new Error('test error'); }));
            tracker.record('tryParse() error', measurement.duration, 1.5, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(isError(measurement.result)).toBe(true);
        });
        it('combineResults() should execute in <1ms', () => {
            const results = [
                success('result1'),
                success('result2'),
                success('result3'),
            ];
            const measurement = measureAtomicPerformance('combineResults()', 1.0, () => combineResults(results));
            tracker.record('combineResults()', measurement.duration, 1.0, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(isSuccess(measurement.result)).toBe(true);
        });
    });
    describe('Constants Access Performance (<0.1ms)', () => {
        it('ERROR_CODES access should execute in <0.1ms', () => {
            const measurement = measureAtomicPerformance('ERROR_CODES access', 0.1, () => {
                return [
                    ERROR_CODES.INVALID_TOKEN,
                    ERROR_CODES.EXPECTED_TOKEN,
                    ERROR_CODES.SHORT_TITLE_TOO_LONG,
                    ERROR_CODES.TYPE_MISMATCH,
                ];
            });
            tracker.record('ERROR_CODES access', measurement.duration, 0.1, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result).toHaveLength(4);
        });
        it('ERROR_SEVERITY access should execute in <0.1ms', () => {
            const measurement = measureAtomicPerformance('ERROR_SEVERITY access', 0.1, () => {
                return [
                    ERROR_SEVERITY.INFO,
                    ERROR_SEVERITY.WARNING,
                    ERROR_SEVERITY.ERROR,
                    ERROR_SEVERITY.CRITICAL,
                ];
            });
            tracker.record('ERROR_SEVERITY access', measurement.duration, 0.1, measurement.passed);
            expect(measurement.passed).toBe(true);
            expect(measurement.result).toEqual(['info', 'warning', 'error', 'critical']);
        });
    });
});
describe('Atomic Performance Framework - Batch Performance', () => {
    describe('High-Volume Operations', () => {
        it('should maintain performance across 1000 success() calls', () => {
            const iterations = 1000;
            const durations = [];
            for (let i = 0; i < iterations; i++) {
                const measurement = measureAtomicPerformance(`success() ${i}`, 0.5, () => success(`data ${i}`));
                durations.push(measurement.duration);
            }
            const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
            const maxDuration = Math.max(...durations);
            tracker.record('batch success() avg', avgDuration, 0.1, avgDuration <= 0.1);
            tracker.record('batch success() max', maxDuration, 8.0, maxDuration <= 8.0);
            expect(avgDuration).toBeLessThan(0.1); // Average should be very fast
            expect(maxDuration).toBeLessThan(8.0); // Even worst case should be fast
        });
        it('should maintain performance across 100 createError() calls', () => {
            const iterations = 100;
            const durations = [];
            for (let i = 0; i < iterations; i++) {
                const measurement = measureAtomicPerformance(`createError() ${i}`, 2.0, () => createError(ERROR_CODES.INVALID_TOKEN, `Error ${i}`));
                durations.push(measurement.duration);
            }
            const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
            const maxDuration = Math.max(...durations);
            tracker.record('batch createError() avg', avgDuration, 0.5, avgDuration <= 0.5);
            tracker.record('batch createError() max', maxDuration, 2.0, maxDuration <= 2.0);
            expect(avgDuration).toBeLessThan(0.5);
            expect(maxDuration).toBeLessThan(2.0);
        });
    });
});
describe('Atomic Performance Framework - Regression Detection', () => {
    describe('Performance Baseline Validation', () => {
        it('should establish baseline performance metrics', () => {
            const baselineOperations = [
                { name: 'success()', fn: () => success('test'), target: 0.5 },
                { name: 'error()', fn: () => error('test'), target: 0.5 },
                { name: 'isSuccess()', fn: () => isSuccess(success('test')), target: 0.2 },
                { name: 'isError()', fn: () => isError(error('test')), target: 0.2 },
                { name: 'createError()', fn: () => createError(ERROR_CODES.INVALID_TOKEN, 'test'), target: 1.0 },
            ];
            const baselines = {};
            for (const operation of baselineOperations) {
                const iterations = 50;
                const durations = [];
                for (let i = 0; i < iterations; i++) {
                    const measurement = measureAtomicPerformance(operation.name, operation.target, operation.fn);
                    durations.push(measurement.duration);
                }
                const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
                baselines[operation.name] = avgDuration;
                tracker.record(`${operation.name} baseline`, avgDuration, operation.target, avgDuration <= operation.target);
            }
            // Validate all baselines are within targets
            for (const [name, duration] of Object.entries(baselines)) {
                const target = baselineOperations.find(op => op.name === name)?.target || 1.0;
                expect(duration).toBeLessThan(target);
            }
            console.log('Performance Baselines:', baselines);
        });
    });
    describe('Memory Usage Validation', () => {
        it('should monitor memory efficiency', () => {
            if (typeof process === 'undefined' || !process.memoryUsage) {
                // Skip memory test in non-Node environments
                return;
            }
            const memoryBefore = process.memoryUsage().heapUsed;
            // Perform operations that could leak memory
            for (let i = 0; i < 1000; i++) {
                const result = success(`data ${i}`);
                const error = createError(ERROR_CODES.INVALID_TOKEN, `error ${i}`);
                isSuccess(result);
                // Removed isError check for createError result - not compatible types
            }
            const memoryAfter = process.memoryUsage().heapUsed;
            const memoryIncrease = (memoryAfter - memoryBefore) / 1024 / 1024; // MB
            // Memory increase should be reasonable for 1000 operations
            expect(memoryIncrease).toBeLessThan(10); // <10MB for 1000 operations
            console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB for 1000 operations`);
        });
    });
});
describe('Atomic Performance Framework - Summary and Reporting', () => {
    describe('Performance Summary', () => {
        it('should generate comprehensive performance report', () => {
            const summary = tracker.getSummary();
            const failures = tracker.getFailures();
            console.log('=== ATOMIC PERFORMANCE FRAMEWORK SUMMARY ===');
            console.log(`Total tests: ${summary.total}`);
            console.log(`Passed: ${summary.passed}`);
            console.log(`Failed: ${summary.failed}`);
            console.log(`Average duration: ${summary.averageDuration.toFixed(3)}ms`);
            console.log(`Slowest test: ${summary.slowestTest}`);
            console.log(`Fastest test: ${summary.fastestTest}`);
            if (failures.length > 0) {
                console.log('\\n=== PERFORMANCE REGRESSIONS DETECTED ===');
                failures.forEach(failure => {
                    console.log(`❌ ${failure.name}: ${failure.duration.toFixed(3)}ms > ${failure.target}ms`);
                });
            }
            else {
                console.log('\\n✅ ALL PERFORMANCE TARGETS MET');
            }
            // All tests should pass performance targets
            expect(summary.failed).toBe(0);
            // Average should be very fast for atomic operations
            expect(summary.averageDuration).toBeLessThan(1.0);
            // Report should be comprehensive
            expect(summary.total).toBeGreaterThanOrEqual(20);
        });
    });
    describe('Framework Validation', () => {
        it('should validate atomic testing framework performance', () => {
            const frameworkStart = performance.now();
            // Measure the overhead of the framework itself
            for (let i = 0; i < 100; i++) {
                measureAtomicPerformance('framework test', 1.0, () => 'test');
            }
            const frameworkDuration = performance.now() - frameworkStart;
            const perTestOverhead = frameworkDuration / 100;
            console.log(`Framework overhead: ${perTestOverhead.toFixed(3)}ms per test`);
            // Framework overhead should be minimal
            expect(perTestOverhead).toBeLessThan(0.1);
            // Total framework execution should be fast
            expect(frameworkDuration).toBeLessThan(50); // <50ms for 100 measurements
        });
    });
});
