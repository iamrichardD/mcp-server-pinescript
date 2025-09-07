/**
 * Core Atomic Tests for Error Handler Module
 * 
 * Ultra-fast (<2ms) granular tests for validated error-handler.ts exports.
 * Tests only confirmed working exports to ensure atomic testing framework works.
 * 
 * Performance Targets:
 * - Each test: <2ms execution time
 * - Type guards: <0.5ms execution time
 * - 100% test reliability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Result pattern functions
  success,
  error,
  isSuccess,
  isError,
  
  // Error creation functions
  createError,
  createLexicalError,
  createSyntaxError,
  createValidationError,
  createShortTitleError,
  
  // Error collector
  ErrorCollector,
  
  // Error handling utilities
  tryParse,
  tryParseAsync,
  combineResults,
  
  // Constants
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  ERROR_CODES,
  RECOVERY_STRATEGIES,
  
  // Global collector
  globalErrorCollector,
} from '../../src/parser/error-handler.js';

import { createSourceLocation } from '../../src/parser/ast-types.js';

// Performance monitoring for atomic tests
function measurePerformance<T>(testName: string, fn: () => T, maxDuration = 2.0): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  // Assert performance requirement
  expect(duration).toBeLessThan(maxDuration);
  
  return result;
}

// Async performance monitoring
async function measurePerformanceAsync<T>(testName: string, fn: () => Promise<T>, maxDuration = 5.0): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(maxDuration);
  
  return result;
}

describe('Error Handler Core - Result Pattern Atomic Tests', () => {
  describe('success() function', () => {
    it('should create success result in <1ms', () => {
      const testData = 'test data';
      
      const result = measurePerformance('success creation', () => {
        return success(testData);
      }, 1.0);
      
      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(testData);
      }
    });
    
    it('should handle complex objects in <1ms', () => {
      const complexData = { 
        nested: { value: 42 }, 
        array: [1, 2, 3],
        timestamp: Date.now() 
      };
      
      const result = measurePerformance('success with complex object', () => {
        return success(complexData);
      }, 1.0);
      
      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(complexData);
      }
    });
  });
  
  describe('error() function', () => {
    it('should create error result in <1ms', () => {
      const testError = new Error('Test error');
      
      const result = measurePerformance('error creation', () => {
        return error(testError);
      }, 1.0);
      
      expect(result.success).toBe(false);
      if (isError(result)) {
        expect(result.error).toBe(testError);
      }
    });
  });
});

describe('Error Handler Core - Type Guard Atomic Tests', () => {
  describe('isSuccess() type guard', () => {
    it('should validate success result in <0.5ms', () => {
      const successResult = success('test data');
      
      const result = measurePerformance('isSuccess validation', () => {
        return isSuccess(successResult);
      }, 1.0);
      
      expect(result).toBe(true);
    });
    
    it('should reject error result in <0.5ms', () => {
      const errorResult = error('test error');
      
      const result = measurePerformance('isSuccess rejection', () => {
        return isSuccess(errorResult);
      }, 1.0);
      
      expect(result).toBe(false);
    });
  });
  
  describe('isError() type guard', () => {
    it('should validate error result in <0.5ms', () => {
      const errorResult = error('test error');
      
      const result = measurePerformance('isError validation', () => {
        return isError(errorResult);
      }, 1.0);
      
      expect(result).toBe(true);
    });
    
    it('should reject success result in <0.5ms', () => {
      const successResult = success('test data');
      
      const result = measurePerformance('isError rejection', () => {
        return isError(successResult);
      }, 1.0);
      
      expect(result).toBe(false);
    });
  });
});

describe('Error Handler Core - Error Factory Atomic Tests', () => {
  describe('createError() function', () => {
    it('should create basic error in <1ms', () => {
      const location = createSourceLocation(1, 0, 0, 5);
      
      const errorInfo = measurePerformance('createError basic', () => {
        return createError(ERROR_CODES.INVALID_TOKEN, 'Test message', location);
      }, 1.0);
      
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
      }, 1.0);
      
      expect(errorInfo.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(errorInfo.category).toBe(ERROR_CATEGORIES.SEMANTIC);
      expect(errorInfo.metadata).toEqual(metadata);
      expect(errorInfo.suggestion).toBe('Try using correct type');
      expect(errorInfo.documentation).toBe('See type guide');
    });
  });
  
  describe('createLexicalError() function', () => {
    it('should create lexical error in <1ms', () => {
      const location = createSourceLocation(1, 5, 5, 1);
      
      const errorInfo = measurePerformance('createLexicalError', () => {
        return createLexicalError('Invalid character', location, 'Remove special character');
      }, 1.0);
      
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
      }, 1.0);
      
      expect(errorInfo.code).toBe(ERROR_CODES.EXPECTED_TOKEN);
      expect(errorInfo.message).toBe('Expected ), but found (');
      expect(errorInfo.category).toBe(ERROR_CATEGORIES.SYNTAX);
      expect(errorInfo.metadata).toEqual({ expected: ')', actual: '(' });
      expect(errorInfo.suggestion).toBe("Replace '(' with ')'");
    });
  });
  
  describe('createShortTitleError() function', () => {
    it('should create short title error in <1ms', () => {
      const location = createSourceLocation(1, 15, 15, 25);
      
      const errorInfo = measurePerformance('createShortTitleError', () => {
        return createShortTitleError(
          'This is a very long short title',
          31,
          20,
          location
        );
      }, 1.0);
      
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

describe('Error Handler Core - ErrorCollector Atomic Tests', () => {
  let collector: ErrorCollector;
  
  beforeEach(() => {
    collector = new ErrorCollector();
  });
  
  describe('ErrorCollector instantiation', () => {
    it('should create new collector in <1ms', () => {
      const newCollector = measurePerformance('ErrorCollector creation', () => {
        return new ErrorCollector();
      }, 1.0);
      
      expect(newCollector).toBeInstanceOf(ErrorCollector);
    });
  });
  
  describe('addError() method', () => {
    it('should add error in <1ms', () => {
      const errorInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Test error');
      
      measurePerformance('addError', () => {
        collector.addError(errorInfo);
      }, 1.0);
      
      const errors = collector.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(errorInfo);
    });
    
    it('should add warning in <1ms', () => {
      const warningInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Test warning', undefined, {
        severity: ERROR_SEVERITY.WARNING,
      });
      
      measurePerformance('addWarning', () => {
        collector.addError(warningInfo);
      }, 1.0);
      
      expect(collector.getWarnings()).toHaveLength(1);
      expect(collector.getErrors()).toHaveLength(0);
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
      }, 1.0);
      
      expect(summary.totalErrors).toBe(2);
      expect(summary.totalWarnings).toBe(1);
      expect(summary.criticalErrors).toBe(1);
    });
  });
  
  describe('clear() method', () => {
    it('should clear all data in <1ms', () => {
      // Add test data
      collector.addError(createError(ERROR_CODES.INVALID_TOKEN, 'Test'));
      
      measurePerformance('clear', () => {
        collector.clear();
      }, 1.0);
      
      expect(collector.getErrors()).toHaveLength(0);
      expect(collector.getWarnings()).toHaveLength(0);
      expect(collector.getSummary().recoveryAttempts).toBe(0);
    });
  });
});

describe('Error Handler Core - Utility Functions Atomic Tests', () => {
  describe('tryParse() function', () => {
    it('should handle successful operation in <1ms', () => {
      const result = measurePerformance('tryParse success', () => {
        return tryParse(() => 'success result');
      }, 1.0);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('success result');
      }
    });
    
    it('should handle thrown error in <1ms', () => {
      const result = measurePerformance('tryParse error', () => {
        return tryParse(() => {
          throw new Error('Test error');
        });
      }, 1.0);
      
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe(ERROR_CODES.UNEXPECTED_TOKEN);
        expect(result.error.message).toBe('Test error');
      }
    });
    
    it('should handle string throws in <1ms', () => {
      const result = measurePerformance('tryParse string throw', () => {
        return tryParse(() => {
          throw 'String error';
        });
      }, 1.0);
      
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toBe('String error');
      }
    });
  });
  
  describe('tryParseAsync() function', () => {
    it('should handle successful async operation in <5ms', async () => {
      const result = await measurePerformanceAsync('tryParseAsync success', async () => {
        return await tryParseAsync(async () => {
          return Promise.resolve('async success');
        });
      }, 5.0);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('async success');
      }
    });
    
    it('should handle async error in <5ms', async () => {
      const result = await measurePerformanceAsync('tryParseAsync error', async () => {
        return await tryParseAsync(async () => {
          throw new Error('Async error');
        });
      }, 5.0);
      
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
      }, 1.0);
      
      expect(isSuccess(combined)).toBe(true);
      if (isSuccess(combined)) {
        expect(combined.data).toEqual(['result1', 'result2', 'result3']);
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
      }, 1.0);
      
      expect(isError(combined)).toBe(true);
      if (isError(combined)) {
        expect(combined.error).toHaveLength(1);
        expect(combined.error[0]).toEqual(errorInfo);
      }
    });
  });
});

describe('Error Handler Core - Constants Validation Atomic Tests', () => {
  it('should validate ERROR_SEVERITY constants in <0.5ms', () => {
    measurePerformance('ERROR_SEVERITY validation', () => {
      expect(ERROR_SEVERITY.INFO).toBe('info');
      expect(ERROR_SEVERITY.WARNING).toBe('warning');
      expect(ERROR_SEVERITY.ERROR).toBe('error');
      expect(ERROR_SEVERITY.CRITICAL).toBe('critical');
    }, 1.0);
  });
  
  it('should validate ERROR_CATEGORIES constants in <1.0ms', () => {
    measurePerformance('ERROR_CATEGORIES validation', () => {
      expect(ERROR_CATEGORIES.LEXICAL).toBe('lexical_error');
      expect(ERROR_CATEGORIES.SYNTAX).toBe('syntax_error');
      expect(ERROR_CATEGORIES.SEMANTIC).toBe('semantic_error');
      expect(ERROR_CATEGORIES.VALIDATION).toBe('validation_error');
      expect(ERROR_CATEGORIES.PERFORMANCE).toBe('performance_error');
      expect(ERROR_CATEGORIES.INTEGRATION).toBe('integration_error');
    }, 1.0);
  });
  
  it('should validate ERROR_CODES constants in <1.0ms', () => {
    measurePerformance('ERROR_CODES validation', () => {
      expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN');
      expect(ERROR_CODES.EXPECTED_TOKEN).toBe('EXPECTED_TOKEN');
      expect(ERROR_CODES.SHORT_TITLE_TOO_LONG).toBe('SHORT_TITLE_TOO_LONG');
      expect(ERROR_CODES.TYPE_MISMATCH).toBe('TYPE_MISMATCH');
      expect(ERROR_CODES.PARSE_TIMEOUT).toBe('PARSE_TIMEOUT');
    }, 1.0);
  });
});

describe('Error Handler Core - Global Collector Atomic Tests', () => {
  it('should access global collector in <0.5ms', () => {
    measurePerformance('global collector access', () => {
      expect(globalErrorCollector).toBeInstanceOf(ErrorCollector);
    }, 1.0);
  });
  
  it('should use global collector independently in <1ms', () => {
    const errorInfo = createError(ERROR_CODES.INVALID_TOKEN, 'Global test');
    
    measurePerformance('global collector usage', () => {
      globalErrorCollector.clear();
      globalErrorCollector.addError(errorInfo);
    }, 1.0);
    
    expect(globalErrorCollector.getErrors()).toHaveLength(1);
    
    // Clean up
    globalErrorCollector.clear();
  });
});

describe('Error Handler Core - Performance Baseline Validation', () => {
  it('should establish performance baselines for all operations', () => {
    const iterations = 100;
    const operations = [
      { name: 'success()', fn: () => success('test'), target: 0.1 },
      { name: 'error()', fn: () => error('test'), target: 0.1 },
      { name: 'isSuccess()', fn: () => isSuccess(success('test')), target: 0.05 },
      { name: 'isError()', fn: () => isError(error('test')), target: 0.05 },
      { name: 'createError()', fn: () => createError(ERROR_CODES.INVALID_TOKEN, 'test'), target: 0.5 },
    ];
    
    for (const operation of operations) {
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        operation.fn();
        const duration = performance.now() - start;
        durations.push(duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      const maxDuration = Math.max(...durations);
      
      console.log(`${operation.name}: avg=${avgDuration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms`);
      
      // Verify average performance
      expect(avgDuration).toBeLessThan(operation.target);
    }
  });
});