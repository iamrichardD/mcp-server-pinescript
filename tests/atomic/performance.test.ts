/**
 * Atomic Performance Validation Framework
 * 
 * Ultra-fast performance regression detection with <2ms individual test execution.
 * Monitors performance across all parser modules to ensure <15ms total parsing target.
 * 
 * Performance Targets:
 * - Individual atomic tests: <2ms
 * - Total parsing operations: <15ms
 * - Memory usage monitoring
 * - Automated performance alerts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  analyzePineScript,
  quickValidateShortTitle,
  performanceMonitor,
  PerformanceMonitor,
  getParserStatus,
} from '../../src/parser/index.js';

import {
  success,
  error,
  isSuccess,
  isError,
  createError,
  ErrorCollector,
  tryParse,
  combineResults,
  ERROR_CODES,
} from '../../src/parser/error-handler.js';

// Performance benchmarking utilities
interface PerformanceBenchmark {
  operation: string;
  target: number; // Maximum allowed duration in ms
  actual: number;
  passed: boolean;
  memoryBefore?: number;
  memoryAfter?: number;
}

class PerformanceBenchmarker {
  private benchmarks: PerformanceBenchmark[] = [];
  
  async measureOperation(
    operation: string, 
    target: number, 
    fn: () => Promise<any> | any
  ): Promise<{ result: any; benchmark: PerformanceBenchmark }> {
    const memoryBefore = this.getMemoryUsage();
    const start = performance.now();
    
    const result = await fn();
    
    const duration = performance.now() - start;
    const memoryAfter = this.getMemoryUsage();
    
    const benchmark: PerformanceBenchmark = {
      operation,
      target,
      actual: duration,
      passed: duration <= target,
      memoryBefore,
      memoryAfter,
    };
    
    this.benchmarks.push(benchmark);
    
    return { result, benchmark };
  }
  
  measureSync<T>(
    operation: string,
    target: number,
    fn: () => T
  ): { result: T; benchmark: PerformanceBenchmark } {
    const memoryBefore = this.getMemoryUsage();
    const start = performance.now();
    
    const result = fn();
    
    const duration = performance.now() - start;
    const memoryAfter = this.getMemoryUsage();
    
    const benchmark: PerformanceBenchmark = {
      operation,
      target,
      actual: duration,
      passed: duration <= target,
      memoryBefore,
      memoryAfter,
    };
    
    this.benchmarks.push(benchmark);
    
    return { result, benchmark };
  }
  
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }
  
  getBenchmarks(): PerformanceBenchmark[] {
    return [...this.benchmarks];
  }
  
  getFailedBenchmarks(): PerformanceBenchmark[] {
    return this.benchmarks.filter(b => !b.passed);
  }
  
  clear(): void {
    this.benchmarks = [];
  }
  
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
  } {
    if (this.benchmarks.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }
    
    const durations = this.benchmarks.map(b => b.actual);
    
    return {
      total: this.benchmarks.length,
      passed: this.benchmarks.filter(b => b.passed).length,
      failed: this.benchmarks.filter(b => !b.passed).length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
    };
  }
}

describe('Performance Validation Framework - Atomic Test Performance', () => {
  let benchmarker: PerformanceBenchmarker;
  
  beforeEach(() => {
    benchmarker = new PerformanceBenchmarker();
  });
  
  afterEach(() => {
    const failed = benchmarker.getFailedBenchmarks();
    if (failed.length > 0) {
      console.warn('Performance regressions detected:', failed);
    }
  });
  
  describe('Error Handler Performance Validation', () => {
    it('should validate result pattern performance', () => {
      const { benchmark: successBench } = benchmarker.measureSync(
        'success() creation',
        1.0, // <1ms target
        () => success('test data')
      );
      
      const { benchmark: errorBench } = benchmarker.measureSync(
        'error() creation', 
        1.0,
        () => error('test error')
      );
      
      const { benchmark: isSuccessBench } = benchmarker.measureSync(
        'isSuccess() check',
        0.5, // <0.5ms target
        () => isSuccess(success('test'))
      );
      
      expect(successBench.passed).toBe(true);
      expect(errorBench.passed).toBe(true);
      expect(isSuccessBench.passed).toBe(true);
    });
    
    it('should validate error creation performance', () => {
      const { benchmark: createErrorBench } = benchmarker.measureSync(
        'createError() basic',
        1.0,
        () => createError(ERROR_CODES.INVALID_TOKEN, 'Test error')
      );
      
      const { benchmark: createComplexBench } = benchmarker.measureSync(
        'createError() complex',
        1.5,
        () => createError(ERROR_CODES.TYPE_MISMATCH, 'Complex error', undefined, {
          severity: 'warning' as const,
          metadata: { key: 'value', nested: { data: 42 } },
          suggestion: 'Try this fix',
        })
      );
      
      expect(createErrorBench.passed).toBe(true);
      expect(createComplexBench.passed).toBe(true);
    });
    
    it('should validate error collector performance', () => {
      const collector = new ErrorCollector();
      
      const { benchmark: addErrorBench } = benchmarker.measureSync(
        'ErrorCollector.addError()',
        1.0,
        () => {
          collector.addError(createError(ERROR_CODES.INVALID_TOKEN, 'Test'));
        }
      );
      
      const { benchmark: getSummaryBench } = benchmarker.measureSync(
        'ErrorCollector.getSummary()',
        1.0,
        () => collector.getSummary()
      );
      
      expect(addErrorBench.passed).toBe(true);
      expect(getSummaryBench.passed).toBe(true);
    });
    
    it('should validate utility functions performance', () => {
      const { benchmark: tryParseBench } = benchmarker.measureSync(
        'tryParse() success',
        1.0,
        () => tryParse(() => 'successful operation')
      );
      
      const { benchmark: tryParseErrorBench } = benchmarker.measureSync(
        'tryParse() error',
        1.0,
        () => tryParse(() => { throw new Error('test error'); })
      );
      
      const results = [success('a'), success('b'), error(createError(ERROR_CODES.INVALID_TOKEN, 'c'))] as any;
      const { benchmark: combineBench } = benchmarker.measureSync(
        'combineResults()',
        1.0,
        () => combineResults(results)
      );
      
      expect(tryParseBench.passed).toBe(true);
      expect(tryParseErrorBench.passed).toBe(true);
      expect(combineBench.passed).toBe(true);
    });
  });
  
  describe('Parser Index Performance Validation', () => {
    it('should validate performance monitor performance', () => {
      const monitor = new PerformanceMonitor();
      
      const { benchmark: measureBench } = benchmarker.measureSync(
        'PerformanceMonitor.measure()',
        1.0,
        () => monitor.measure('test-op', () => 'test result')
      );
      
      const { benchmark: startEndBench } = benchmarker.measureSync(
        'PerformanceMonitor start/end',
        1.0,
        () => {
          monitor.start('timing-test');
          return monitor.end('timing-test');
        }
      );
      
      expect(measureBench.passed).toBe(true);
      expect(startEndBench.passed).toBe(true);
    });
    
    it('should validate status functions performance', () => {
      const { benchmark: statusBench } = benchmarker.measureSync(
        'getParserStatus()',
        1.0,
        () => getParserStatus()
      );
      
      expect(statusBench.passed).toBe(true);
    });
  });
});

describe('Performance Validation Framework - Integration Performance', () => {
  let benchmarker: PerformanceBenchmarker;
  
  beforeEach(() => {
    benchmarker = new PerformanceBenchmarker();
  });
  
  describe('Main Parser API Performance', () => {
    it('should meet <15ms parsing target for simple scripts', async () => {
      const simpleScript = 'indicator("Test", "T", overlay=true)';
      
      const { benchmark } = await benchmarker.measureOperation(
        'analyzePineScript() simple',
        15.0, // <15ms target
        () => analyzePineScript(simpleScript)
      );
      
      expect(benchmark.passed).toBe(true);
      if (!benchmark.passed) {
        console.warn(`Parse time exceeded target: ${benchmark.actual}ms > ${benchmark.target}ms`);
      }
    });
    
    it('should meet <15ms parsing target for medium complexity', async () => {
      const mediumScript = `
        indicator("Medium Test", "MT", overlay=true)
        plot(close, "Close", color.blue)
        plot(open, "Open", color.red)
        hline(0, "Zero", color.gray)
        bgcolor(close > open ? color.green : color.red)
      `;
      
      const { benchmark } = await benchmarker.measureOperation(
        'analyzePineScript() medium',
        15.0,
        () => analyzePineScript(mediumScript)
      );
      
      expect(benchmark.passed).toBe(true);
    });
    
    it('should meet <5ms validation target', async () => {
      const validScript = 'indicator("Valid", "V", overlay=true)';
      
      const { benchmark } = await benchmarker.measureOperation(
        'quickValidateShortTitle()',
        5.0, // <5ms target
        () => quickValidateShortTitle(validScript)
      );
      
      expect(benchmark.passed).toBe(true);
    });
    
    it('should handle error cases within performance targets', async () => {
      const malformedScript = 'invalid pine script @#$%^&*()';
      
      const { benchmark } = await benchmarker.measureOperation(
        'analyzePineScript() error handling',
        15.0, // Should still meet target even with errors
        () => analyzePineScript(malformedScript)
      );
      
      // Error handling should not degrade performance
      expect(benchmark.passed).toBe(true);
    });
  });
  
  describe('Batch Operations Performance', () => {
    it('should maintain performance across multiple operations', async () => {
      const scripts = [
        'indicator("Test1", "T1")',
        'indicator("Test2", "T2")',
        'indicator("Test3", "T3")',
        'strategy("Strat1", "S1")',
        'strategy("Strat2", "S2")',
      ];
      
      const { benchmark } = await benchmarker.measureOperation(
        'Batch analysis (5 scripts)',
        50.0, // 5 scripts * ~10ms each
        async () => {
          const results = await Promise.all(
            scripts.map(script => analyzePineScript(script))
          );
          return results;
        }
      );
      
      expect(benchmark.passed).toBe(true);
    });
    
    it('should validate sequential performance consistency', async () => {
      const script = 'indicator("Consistency Test", "CT")';
      const iterations = 10;
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const { benchmark } = await benchmarker.measureOperation(
          `Sequential analysis ${i + 1}`,
          15.0,
          () => analyzePineScript(script)
        );
        
        durations.push(benchmark.actual);
        expect(benchmark.passed).toBe(true);
      }
      
      // Verify consistency (no performance degradation over time)
      const avgFirst5 = durations.slice(0, 5).reduce((a, b) => a + b) / 5;
      const avgLast5 = durations.slice(-5).reduce((a, b) => a + b) / 5;
      
      // Last 5 should not be significantly slower than first 5
      expect(avgLast5).toBeLessThan(avgFirst5 * 1.5); // Allow 50% variance
    });
  });
});

describe('Performance Validation Framework - Memory Usage Monitoring', () => {
  let benchmarker: PerformanceBenchmarker;
  
  beforeEach(() => {
    benchmarker = new PerformanceBenchmarker();
  });
  
  describe('Memory Efficiency Validation', () => {
    it('should monitor memory usage during parsing', async () => {
      const largerScript = `
        indicator("Memory Test", "MT", overlay=true)
        ${Array(20).fill(0).map((_, i) => `plot(close[${i}], "Line${i}", color.blue)`).join('\n')}
      `;
      
      const { benchmark } = await benchmarker.measureOperation(
        'Memory usage analysis',
        15.0,
        () => analyzePineScript(largerScript)
      );
      
      expect(benchmark.passed).toBe(true);
      
      // Memory usage should be reasonable
      if (benchmark.memoryBefore && benchmark.memoryAfter) {
        const memoryIncrease = benchmark.memoryAfter - benchmark.memoryBefore;
        expect(memoryIncrease).toBeLessThan(50); // <50MB increase
      }
    });
    
    it('should validate error collector memory efficiency', () => {
      const collector = new ErrorCollector();
      
      const { benchmark } = benchmarker.measureSync(
        'Error collector bulk operations',
        5.0,
        () => {
          // Add many errors
          for (let i = 0; i < 1000; i++) {
            collector.addError(createError(ERROR_CODES.INVALID_TOKEN, `Error ${i}`));
          }
          
          // Get summary
          const summary = collector.getSummary();
          
          // Clear
          collector.clear();
          
          return summary;
        }
      );
      
      expect(benchmark.passed).toBe(true);
    });
  });
});

describe('Performance Validation Framework - Regression Detection', () => {
  let benchmarker: PerformanceBenchmarker;
  
  beforeEach(() => {
    benchmarker = new PerformanceBenchmarker();
  });
  
  describe('Performance Baseline Validation', () => {
    it('should establish and validate performance baselines', async () => {
      const testCases = [
        { script: 'indicator("Baseline1", "B1")', target: 10.0 },
        { script: 'strategy("Baseline2", "B2")', target: 12.0 },
        { script: 'indicator("Long Title", "Very Long Short Title Here")', target: 8.0 },
      ];
      
      for (const testCase of testCases) {
        const { benchmark } = await benchmarker.measureOperation(
          `Baseline: ${testCase.script.slice(0, 20)}...`,
          testCase.target,
          () => analyzePineScript(testCase.script)
        );
        
        expect(benchmark.passed).toBe(true);
      }
    });
    
    it('should detect performance regressions', async () => {
      const script = 'indicator("Regression Test", "RT")';
      const acceptableVariance = 2.0; // 2ms variance allowed
      
      // Run baseline
      const { benchmark: baseline } = await benchmarker.measureOperation(
        'Regression baseline',
        15.0,
        () => analyzePineScript(script)
      );
      
      // Run follow-up tests
      for (let i = 0; i < 5; i++) {
        const { benchmark } = await benchmarker.measureOperation(
          `Regression test ${i + 1}`,
          baseline.actual + acceptableVariance,
          () => analyzePineScript(script)
        );
        
        expect(benchmark.passed).toBe(true);
      }
    });
  });
  
  describe('Performance Summary and Reporting', () => {
    it('should generate performance summary', async () => {
      // Run various operations
      await benchmarker.measureOperation('Summary test 1', 10.0, () => 
        analyzePineScript('indicator("S1", "S1")')
      );
      
      benchmarker.measureSync('Summary test 2', 1.0, () => 
        success('test')
      );
      
      benchmarker.measureSync('Summary test 3', 0.5, () => 
        createError(ERROR_CODES.INVALID_TOKEN, 'test')
      );
      
      const summary = benchmarker.getSummary();
      
      expect(summary.total).toBe(3);
      expect(summary.passed).toBeGreaterThan(0);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.maxDuration).toBeGreaterThan(0);
      expect(summary.minDuration).toBeGreaterThan(0);
    });
    
    it('should identify slowest operations', async () => {
      const operations = [
        { name: 'Fast', fn: () => success('fast'), target: 1.0 },
        { name: 'Medium', fn: () => analyzePineScript('indicator("M", "M")'), target: 15.0 },
        { name: 'Instant', fn: () => isSuccess(success('instant')), target: 0.5 },
      ];
      
      for (const op of operations) {
        await benchmarker.measureOperation(op.name, op.target, op.fn);
      }
      
      const benchmarks = benchmarker.getBenchmarks();
      const sorted = [...benchmarks].sort((a, b) => b.actual - a.actual);
      
      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted[0]?.operation).toBe('Medium'); // Slowest
      expect(["Fast", "Instant"]).toContain(sorted[sorted.length - 1]?.operation); // Fastest
    });
  });
});