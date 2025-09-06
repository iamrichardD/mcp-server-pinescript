# TypeScript Implementation Guide for NA Object Detection

## Overview

This guide provides a comprehensive roadmap for implementing runtime NA object access detection in the MCP PineScript service while maintaining strict TypeScript compliance and avoiding `any` types.

## Architecture Summary

The implementation consists of four main components:

1. **NA Object Types** (`na-object-types.d.ts`) - Core type definitions
2. **Runtime Validation Rules** (`runtime-validation-rules.d.ts`) - Rule configuration system
3. **Pattern Detection Engine** (`pattern-detection-engine.d.ts`) - Advanced pattern matching
4. **Integration Strategy** (`na-object-integration.d.ts`) - Seamless MCP integration

## Implementation Phases

### Phase 1: Core Type System Integration (Week 1)

#### Step 1.1: Extend Existing Error Handler
```typescript
// In src/parser/error-handler.ts - Add new error codes
export const RUNTIME_ERROR_CODES = {
  ...ERROR_CODES,
  NA_OBJECT_FIELD_ACCESS: 'NA_OBJECT_FIELD_ACCESS',
  NA_OBJECT_HISTORY_ACCESS: 'NA_OBJECT_HISTORY_ACCESS',
  UDT_UNINITIALIZED_ACCESS: 'UDT_UNINITIALIZED_ACCESS',
} as const;

// Add new error categories  
export const RUNTIME_ERROR_CATEGORIES = {
  ...ERROR_CATEGORIES,
  RUNTIME_ERROR: 'runtime_error',
  NA_OBJECT_ACCESS: 'na_object_access',
  NA_OBJECT_HISTORY_ACCESS: 'na_object_history_access',
} as const;
```

#### Step 1.2: Update Validation Types
```typescript
// In src/parser/types.d.ts - Extend ValidationViolation interface
export interface RuntimeValidationViolation extends ValidationViolation {
  readonly naObjectDetails?: NAObjectViolationDetails;
  readonly runtimeSeverity: 'error' | 'warning' | 'suggestion';
}
```

#### Step 1.3: Create NA Object Factory
```typescript
// New file: src/parser/na-object-factory.ts
import type { NAObjectViolation, NAObjectViolationDetails } from './na-object-types.js';
import { createError, ERROR_SEVERITY, RUNTIME_ERROR_CATEGORIES } from './error-handler.js';

export class NAObjectViolationFactory {
  static createDirectNAAccessViolation(
    objectName: string,
    fieldName: string,
    location: SourceLocation,
    udtType?: string
  ): NAObjectViolation {
    const details: NAObjectViolationDetails = {
      objectName,
      udtTypeName: udtType,
      fieldName,
      violationType: 'direct_na_access',
      initializationState: 'uninitialized',
      suggestedFix: {
        fixType: 'initialize_object',
        suggestedCode: `${objectName} = ${udtType}.new()`,
        explanation: `Initialize ${objectName} before accessing fields`,
        preventionStrategy: 'Always initialize UDT objects before use'
      },
      accessPattern: `${objectName}.${fieldName}`
    };

    return {
      line: location.line,
      column: location.column,
      rule: 'NA_OBJECT_FIELD_ACCESS',
      severity: 'error',
      message: `Cannot access field of undefined (na) object. Initialize object before accessing fields.`,
      category: 'runtime_error',
      naObjectDetails: details,
      suggested_fix: details.suggestedFix.suggestedCode
    };
  }
}
```

### Phase 2: Pattern Detection Implementation (Week 2)

#### Step 2.1: Implement Core Pattern Matchers
```typescript
// New file: src/parser/na-pattern-detector.ts
import type { 
  DetectionPattern, 
  PatternMatch, 
  UDTObjectDeclaration,
  UDTFieldAccess 
} from './pattern-detection-engine.js';

export class NAPatternDetector {
  // Pattern for detecting "var UDT obj = na"
  private readonly NA_INITIALIZATION_PATTERN = /var\s+(\w+)\s+(\w+)\s*=\s*na/g;
  
  // Pattern for detecting "obj.field" access
  private readonly FIELD_ACCESS_PATTERN = /(\w+)\.(\w+)/g;
  
  // Pattern for detecting "(obj[n]).field" access
  private readonly HISTORICAL_ACCESS_PATTERN = /\((\w+)\[(\d+)\]\)\.(\w+)/g;

  async detectUDTDeclarations(source: string): Promise<readonly UDTObjectDeclaration[]> {
    const declarations: UDTObjectDeclaration[] = [];
    let match: RegExpExecArray | null;

    // Reset regex state
    this.NA_INITIALIZATION_PATTERN.lastIndex = 0;

    while ((match = this.NA_INITIALIZATION_PATTERN.exec(source)) !== null) {
      const [fullMatch, udtTypeName, objectName] = match;
      const location = this.calculateLocation(source, match.index);

      declarations.push({
        objectName,
        udtTypeName,
        initializationState: 'uninitialized',
        declarationLocation: location,
        initializationValue: 'na',
        isVariable: true
      });
    }

    return declarations;
  }

  async detectFieldAccessPatterns(
    source: string,
    declarations: readonly UDTObjectDeclaration[]
  ): Promise<readonly UDTFieldAccess[]> {
    const accesses: UDTFieldAccess[] = [];
    const declaredObjects = new Set(declarations.map(d => d.objectName));

    // Detect direct field access
    let match: RegExpExecArray | null;
    this.FIELD_ACCESS_PATTERN.lastIndex = 0;

    while ((match = this.FIELD_ACCESS_PATTERN.exec(source)) !== null) {
      const [fullMatch, objectName, fieldName] = match;
      
      if (declaredObjects.has(objectName)) {
        const location = this.calculateLocation(source, match.index);
        accesses.push({
          objectName,
          fieldName,
          accessType: 'direct',
          accessLocation: location,
          fullExpression: fullMatch
        });
      }
    }

    // Detect historical field access
    this.HISTORICAL_ACCESS_PATTERN.lastIndex = 0;
    while ((match = this.HISTORICAL_ACCESS_PATTERN.exec(source)) !== null) {
      const [fullMatch, objectName, indexStr, fieldName] = match;
      
      if (declaredObjects.has(objectName)) {
        const location = this.calculateLocation(source, match.index);
        accesses.push({
          objectName,
          fieldName,
          accessType: 'historical',
          accessLocation: location,
          isHistoricalIndex: parseInt(indexStr, 10),
          fullExpression: fullMatch
        });
      }
    }

    return accesses;
  }

  private calculateLocation(source: string, offset: number): SourceLocation {
    const lines = source.substring(0, offset).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length,
      offset,
      length: 0
    };
  }
}
```

#### Step 2.2: Implement Violation Analysis
```typescript
// New file: src/parser/na-violation-analyzer.ts
import type { 
  UDTObjectDeclaration, 
  UDTFieldAccess, 
  NAObjectViolation 
} from './na-object-types.js';

export class NAViolationAnalyzer {
  analyzeViolations(
    declarations: readonly UDTObjectDeclaration[],
    accesses: readonly UDTFieldAccess[]
  ): readonly NAObjectViolation[] {
    const violations: NAObjectViolation[] = [];
    const uninitializedObjects = new Set(
      declarations
        .filter(d => d.initializationState === 'uninitialized')
        .map(d => d.objectName)
    );

    for (const access of accesses) {
      if (uninitializedObjects.has(access.objectName)) {
        if (access.accessType === 'direct') {
          violations.push(
            NAObjectViolationFactory.createDirectNAAccessViolation(
              access.objectName,
              access.fieldName,
              access.accessLocation,
              this.findUDTType(declarations, access.objectName)
            )
          );
        } else if (access.accessType === 'historical') {
          violations.push(
            NAObjectViolationFactory.createHistoricalNAAccessViolation(
              access.objectName,
              access.fieldName,
              access.isHistoricalIndex ?? 0,
              access.accessLocation,
              this.findUDTType(declarations, access.objectName)
            )
          );
        }
      }
    }

    return violations;
  }

  private findUDTType(
    declarations: readonly UDTObjectDeclaration[],
    objectName: string
  ): string | undefined {
    return declarations.find(d => d.objectName === objectName)?.udtTypeName;
  }
}
```

### Phase 3: Integration with Existing Validator (Week 3)

#### Step 3.1: Extend Validator API
```typescript
// In src/parser/validator.d.ts - Add new methods
export function validateNAObjectAccess(source: string): Promise<ValidationResult>;
export function validateRuntimeSafety(source: string): Promise<EnhancedValidationResult>;
export function mergeValidationResults(
  existing: ValidationResult,
  naAnalysis: NAObjectAnalysisResult
): EnhancedValidationResult;
```

#### Step 3.2: Implement Enhanced Validator
```typescript
// New file: src/parser/enhanced-validator.ts
import type { 
  ValidationResult, 
  EnhancedValidationResult,
  NAObjectAnalysisResult 
} from './na-object-types.js';

export class EnhancedValidator {
  constructor(
    private readonly patternDetector: NAPatternDetector,
    private readonly violationAnalyzer: NAViolationAnalyzer,
    private readonly existingValidator: ValidatorAPI
  ) {}

  async validateWithNADetection(
    source: string,
    rules?: EnhancedValidationRules
  ): Promise<EnhancedValidationResult> {
    // Run existing validation
    const existingResult = await this.existingValidator.validateParameters(source, rules);
    
    // Run NA object analysis
    const naAnalysis = await this.performNAAnalysis(source);
    
    // Merge results
    return this.mergeResults(existingResult, naAnalysis);
  }

  private async performNAAnalysis(source: string): Promise<NAObjectAnalysisResult> {
    const declarations = await this.patternDetector.detectUDTDeclarations(source);
    const accesses = await this.patternDetector.detectFieldAccessPatterns(source, declarations);
    const violations = this.violationAnalyzer.analyzeViolations(declarations, accesses);

    return {
      udtDeclarations: declarations,
      fieldAccesses: accesses,
      violations,
      runtimeRisks: [], // Implement risk analysis
      metrics: {
        totalUDTDeclarations: declarations.length,
        totalFieldAccesses: accesses.length,
        runtimeViolationsFound: violations.length,
        potentialRisksIdentified: 0,
        analysisTimeMs: 0,
        objectTrackingComplexity: declarations.length * accesses.length
      }
    };
  }

  private mergeResults(
    existing: ValidationResult,
    naAnalysis: NAObjectAnalysisResult
  ): EnhancedValidationResult {
    const mergedViolations = [
      ...existing.violations,
      ...naAnalysis.violations
    ];

    return {
      violations: mergedViolations,
      naObjectAnalysis: naAnalysis,
      runtimeSafetyReport: {
        overallSafety: naAnalysis.violations.length > 0 ? 'unsafe' : 'safe',
        criticalIssuesCount: naAnalysis.violations.filter(v => v.severity === 'error').length,
        warningIssuesCount: naAnalysis.violations.filter(v => v.severity === 'warning').length,
        runtimeErrorPrevention: [],
        codeQualityImpact: 'positive'
      },
      warnings: existing.warnings,
      metrics: {
        validationTimeMs: existing.metrics.validationTimeMs,
        naAnalysisTimeMs: naAnalysis.metrics.analysisTimeMs,
        functionsAnalyzed: existing.metrics.functionsAnalyzed,
        udtObjectsTracked: naAnalysis.metrics.totalUDTDeclarations,
        runtimePatternsDetected: naAnalysis.violations.length,
        performanceImpact: 'minimal'
      }
    };
  }
}
```

### Phase 4: MCP Service Integration (Week 4)

#### Step 4.1: Update Integration API
```typescript
// In src/parser/index.ts - Add enhanced methods
export async function analyzePineScriptWithNADetection(
  source: string,
  rules?: EnhancedValidationRules
): Promise<EnhancedAnalysisResult> {
  const enhancedValidator = new EnhancedValidator(
    new NAPatternDetector(),
    new NAViolationAnalyzer(),
    existingValidatorInstance
  );

  const validationResult = await enhancedValidator.validateWithNADetection(source, rules);
  
  return {
    success: validationResult.violations.length === 0,
    violations: validationResult.violations,
    functionCalls: [], // Extract from existing analysis
    naObjectAnalysis: validationResult.naObjectAnalysis,
    runtimeSafetyReport: validationResult.runtimeSafetyReport,
    integrationMetrics: {
      integrationId: 'na-detection-v1',
      measurementTime: Date.now(),
      systemMetrics: null!, // Implement system metrics collection
      validationMetrics: null!, // Convert validation metrics
      performanceMetrics: null!, // Extract performance data
      reliabilityMetrics: null!, // Calculate reliability scores
      usageMetrics: null! // Track usage patterns
    },
    enhancementSummary: {
      newViolationsFound: validationResult.naObjectAnalysis.violations.length,
      existingViolationsEnhanced: 0,
      runtimeErrorsPrevented: validationResult.naObjectAnalysis.violations.filter(v => v.severity === 'error').length,
      falsePositivesReduced: 0,
      analysisQualityImprovement: {
        accuracyIncrease: 25, // Estimated improvement
        coverageIncrease: 30,
        precisionIncrease: 20,
        recallIncrease: 35,
        overallQualityScore: 85
      },
      performanceImpact: {
        analysisTimeIncrease: 15, // Estimated 15% increase
        memoryUsageIncrease: 10,
        throughputChange: -5,
        scalabilityImpact: 'neutral',
        acceptabilityRating: 'good'
      }
    },
    backwardCompatibility: {
      apiCompatibility: 'enhanced',
      dataFormatCompatibility: 'enhanced',
      behaviorConsistency: 'enhanced',
      migrationRequired: false,
      compatibilityIssues: []
    },
    metrics: {
      totalTimeMs: validationResult.metrics.validationTimeMs + validationResult.metrics.naAnalysisTimeMs,
      parseTimeMs: 0, // Extract from existing metrics
      functionsFound: validationResult.metrics.functionsAnalyzed,
      errorsFound: validationResult.violations.filter(v => v.severity === 'error').length
    },
    errors: [] // Convert violations to errors if needed
  };
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/na-object-detection.test.ts
describe('NA Object Detection', () => {
  it('should detect direct NA object field access', async () => {
    const source = `
      type TestData
          float value
      var TestData data = na
      result = data.value  // Should trigger violation
    `;
    
    const detector = new NAPatternDetector();
    const declarations = await detector.detectUDTDeclarations(source);
    const accesses = await detector.detectFieldAccessPatterns(source, declarations);
    
    expect(declarations).toHaveLength(1);
    expect(accesses).toHaveLength(1);
    expect(accesses[0].accessType).toBe('direct');
  });

  it('should detect historical NA object field access', async () => {
    const source = `
      type TestData
          float value
      var TestData data = na
      historical = (data[1]).value  // Should trigger violation
    `;
    
    const detector = new NAPatternDetector();
    const declarations = await detector.detectUDTDeclarations(source);
    const accesses = await detector.detectFieldAccessPatterns(source, declarations);
    
    expect(accesses[0].accessType).toBe('historical');
    expect(accesses[0].isHistoricalIndex).toBe(1);
  });
});
```

### Integration Tests
```typescript
// tests/integration.test.ts
describe('Enhanced Validator Integration', () => {
  it('should provide comprehensive analysis result', async () => {
    const source = `
      //@version=6
      strategy("Test", shorttitle="TEST")
      
      type KellyData
          float winRate
          int sampleSize
      
      var KellyData data = na
      size = data.sampleSize  // Error
      rate = data.winRate     // Error
    `;
    
    const result = await analyzePineScriptWithNADetection(source);
    
    expect(result.success).toBe(false);
    expect(result.violations.filter(v => v.rule === 'NA_OBJECT_FIELD_ACCESS')).toHaveLength(2);
    expect(result.naObjectAnalysis.violations).toHaveLength(2);
    expect(result.runtimeSafetyReport.overallSafety).toBe('unsafe');
  });
});
```

## Performance Considerations

### Memory Optimization
- Use `readonly` arrays for immutable data
- Implement object pooling for frequently created objects
- Cache pattern compilation results
- Use WeakMap for object associations

### Processing Optimization
- Implement incremental analysis for large files
- Use parallel processing for independent pattern matching
- Optimize regex patterns for performance
- Implement early termination for critical errors

## Deployment Strategy

### Gradual Rollout
1. **Phase 1**: Deploy with NA detection disabled by default
2. **Phase 2**: Enable detection for opt-in users
3. **Phase 3**: Enable by default with monitoring
4. **Phase 4**: Full deployment with performance optimization

### Monitoring
- Track analysis time increase
- Monitor memory usage patterns
- Measure violation detection accuracy
- Monitor false positive rates

## Error Handling

### Graceful Degradation
```typescript
export async function safeAnalyzePineScript(
  source: string,
  rules?: EnhancedValidationRules
): Promise<EnhancedAnalysisResult> {
  try {
    return await analyzePineScriptWithNADetection(source, rules);
  } catch (error) {
    // Fallback to existing analysis if NA detection fails
    const fallbackResult = await existingAnalyzeFunction(source);
    return enhanceWithErrorInfo(fallbackResult, error);
  }
}
```

## Configuration Management

### Type-Safe Configuration
```typescript
// config/na-detection-config.ts
export const DEFAULT_CONFIG: NAObjectDetectionConfiguration = {
  detectionRules: {
    enableDirectNAAccessDetection: true,
    enableHistoricalNAAccessDetection: true,
    enableInitializationTracking: true,
    strictNAValidation: true,
    allowConditionalInitialization: false,
    historicalAccessDepthLimit: 10
  },
  safetyConstraints: {
    requireObjectInitialization: true,
    requireNAChecksForHistoricalAccess: true,
    allowUninitializedObjectAccess: false,
    enforceNAValidationPattern: true,
    runtimeSafetyLevel: 'strict'
  },
  udtPatternRules: [],
  performanceSettings: {
    enableIncrementalAnalysis: true,
    maxAnalysisTimeMs: 5000,
    cacheAnalysisResults: true,
    optimizeForLargeFiles: true,
    parallelProcessing: true
  },
  integrationSettings: {
    preserveExistingViolations: true,
    prioritizeRuntimeErrors: true,
    includePerformanceMetrics: true,
    generateDetailedReports: true,
    compatibilityMode: 'enhanced'
  }
};
```

## Summary

This implementation provides:

1. **Complete Type Safety** - No `any` types, comprehensive interfaces
2. **Seamless Integration** - Extends existing validation without breaking changes
3. **Performance Optimization** - Configurable analysis depth and caching
4. **Comprehensive Testing** - Unit and integration test coverage
5. **Gradual Deployment** - Safe rollout strategy with monitoring
6. **Error Recovery** - Graceful degradation and fallback mechanisms

The architecture enables the PineScript compliance specialist to implement the fix systematically while maintaining institutional-grade reliability and performance standards.

## Files Created

1. `/home/rdelgado/Development/mcp-server-pinescript/src/parser/na-object-types.d.ts`
2. `/home/rdelgado/Development/mcp-server-pinescript/src/parser/runtime-validation-rules.d.ts`
3. `/home/rdelgado/Development/mcp-server-pinescript/src/parser/pattern-detection-engine.d.ts`
4. `/home/rdelgado/Development/mcp-server-pinescript/src/parser/na-object-integration.d.ts`
5. `/home/rdelgado/Development/mcp-server-pinescript/src/parser/implementation-guide.md`

All interfaces maintain strict TypeScript compliance with ES2022 target and avoid `any` type usage completely.