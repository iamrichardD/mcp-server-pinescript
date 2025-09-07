/**
 * Runtime Validation Rules Configuration
 *
 * Extends the existing validation rule system with comprehensive
 * runtime error detection capabilities for NA object access patterns.
 *
 * Maintains strict TypeScript compliance and integrates seamlessly
 * with existing ValidationRules interface.
 */

import type {
  ValidationRules,
  ValidationConstraints,
  FunctionValidationRules,
  ArgumentConstraints,
} from './types.js';

import type {
  NAObjectErrorCode,
  EnhancedErrorCategory,
  RuntimeErrorSeverity,
  NAObjectDetectionRules,
  RuntimeSafetyConstraints,
} from './na-object-types.js';

// ============================================================================
// EXTENDED VALIDATION RULE STRUCTURE
// ============================================================================

/**
 * Enhanced validation rules that extend existing system with runtime detection
 */
export interface EnhancedValidationRules extends ValidationRules {
  readonly naObjectDetectionRules: NAObjectRuntimeRules;
  readonly runtimeSafetyConfiguration: RuntimeSafetyValidationConfig;
  readonly udtPatternValidation: UDTPatternValidationRules;
  readonly integrationSettings: ValidationIntegrationConfig;
}

/**
 * Core runtime rules for NA object detection
 */
export interface NAObjectRuntimeRules {
  readonly version: string;
  readonly enabled: boolean;
  readonly strictMode: boolean;
  readonly rules: readonly RuntimeValidationRule[];
  readonly errorThresholds: RuntimeErrorThresholds;
  readonly patternMatching: PatternMatchingConfiguration;
}

/**
 * Individual runtime validation rule configuration
 */
export interface RuntimeValidationRule {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly category: EnhancedErrorCategory;
  readonly severity: RuntimeErrorSeverity;
  readonly enabled: boolean;
  readonly description: string;
  readonly detectionPattern: DetectionPattern;
  readonly violationMessage: string;
  readonly suggestedFix: string;
  readonly documentation: string;
  readonly examples: readonly RuleExample[];
}

/**
 * Pattern matching configuration for runtime error detection
 */
export interface DetectionPattern {
  readonly patternType: 'regex' | 'ast_traversal' | 'semantic_analysis';
  readonly pattern: string | RegExp;
  readonly contextRequirements: readonly ContextRequirement[];
  readonly excludePatterns?: readonly string[];
  readonly multilineSupport: boolean;
  readonly caseSensitive: boolean;
}

/**
 * Context requirements for pattern matching
 */
export interface ContextRequirement {
  readonly requirementType: 'preceding_declaration' | 'object_initialization' | 'scope_analysis';
  readonly specification: string;
  readonly optional: boolean;
}

/**
 * Rule example for documentation and testing
 */
export interface RuleExample {
  readonly exampleType: 'violation' | 'correct_usage';
  readonly code: string;
  readonly description: string;
  readonly expectedResult?: string;
}

// ============================================================================
// RUNTIME ERROR CONFIGURATION
// ============================================================================

/**
 * Thresholds for runtime error detection
 */
export interface RuntimeErrorThresholds {
  readonly maxRuntimeErrorsBeforeFailure: number;
  readonly warningToErrorEscalationCount: number;
  readonly criticalErrorImmediateFailure: boolean;
  readonly allowPartialAnalysis: boolean;
}

/**
 * Pattern matching engine configuration
 */
export interface PatternMatchingConfiguration {
  readonly enableAdvancedPatterns: boolean;
  readonly cachePatternResults: boolean;
  readonly optimizeForPerformance: boolean;
  readonly maxPatternComplexity: number;
  readonly parallelPatternMatching: boolean;
}

/**
 * Runtime safety validation configuration
 */
export interface RuntimeSafetyValidationConfig {
  readonly enforceObjectInitialization: boolean;
  readonly requireNAChecksForHistoricalAccess: boolean;
  readonly strictUDTTypeTracking: boolean;
  readonly allowConditionalInitialization: boolean;
  readonly runtimeSafetyReporting: RuntimeSafetyReportingConfig;
}

/**
 * Runtime safety reporting configuration
 */
export interface RuntimeSafetyReportingConfig {
  readonly includeRiskAssessment: boolean;
  readonly generateFixSuggestions: boolean;
  readonly includeCodeExamples: boolean;
  readonly detailedMetrics: boolean;
  readonly performanceImpactAnalysis: boolean;
}

// ============================================================================
// UDT PATTERN VALIDATION RULES
// ============================================================================

/**
 * Validation rules specific to User-Defined Type patterns
 */
export interface UDTPatternValidationRules {
  readonly enabled: boolean;
  readonly strictTypeChecking: boolean;
  readonly udtSpecificRules: readonly UDTSpecificRule[];
  readonly fieldAccessValidation: FieldAccessValidationConfig;
  readonly initializationValidation: InitializationValidationConfig;
}

/**
 * Rules for specific UDT types
 */
export interface UDTSpecificRule {
  readonly udtTypeName: string;
  readonly requiredInitialization: 'always' | 'conditional' | 'optional';
  readonly allowedAccessPatterns: readonly AccessPatternRule[];
  readonly forbiddenOperations: readonly string[];
  readonly customValidationRules: readonly CustomValidationRule[];
}

/**
 * Access pattern rules for UDT objects
 */
export interface AccessPatternRule {
  readonly patternName: string;
  readonly pattern: RegExp;
  readonly allowed: boolean;
  readonly severity: RuntimeErrorSeverity;
  readonly errorMessage: string;
  readonly suggestion: string;
}

/**
 * Custom validation rule for specific scenarios
 */
export interface CustomValidationRule {
  readonly ruleName: string;
  readonly condition: string; // Logical condition as string
  readonly action: 'error' | 'warning' | 'suggestion';
  readonly message: string;
  readonly applicableContexts: readonly string[];
}

/**
 * Field access validation configuration
 */
export interface FieldAccessValidationConfig {
  readonly validateDirectAccess: boolean;
  readonly validateHistoricalAccess: boolean;
  readonly requireNAChecks: boolean;
  readonly trackObjectLifecycle: boolean;
  readonly maximumHistoricalDepth: number;
}

/**
 * Initialization validation configuration
 */
export interface InitializationValidationConfig {
  readonly enforceExplicitInitialization: boolean;
  readonly allowNAInitialization: boolean;
  readonly requireConstructorCalls: boolean;
  readonly validateInitializationTiming: boolean;
  readonly trackInitializationState: boolean;
}

// ============================================================================
// INTEGRATION CONFIGURATION
// ============================================================================

/**
 * Configuration for integrating with existing validation system
 */
export interface ValidationIntegrationConfig {
  readonly mergeWithExistingRules: boolean;
  readonly prioritizeRuntimeErrors: boolean;
  readonly preserveExistingCategories: boolean;
  readonly enhanceExistingMessages: boolean;
  readonly backwardCompatibility: 'strict' | 'enhanced' | 'legacy';
  readonly performanceOptimization: IntegrationPerformanceConfig;
}

/**
 * Performance optimization for integration
 */
export interface IntegrationPerformanceConfig {
  readonly incrementalValidation: boolean;
  readonly cacheValidationResults: boolean;
  readonly parallelProcessing: boolean;
  readonly memoryOptimization: boolean;
  readonly maxAnalysisTimeMs: number;
}

// ============================================================================
// SPECIFIC RULE DEFINITIONS FOR NA OBJECT DETECTION
// ============================================================================

/**
 * Pre-configured rules for the three critical patterns identified in bug report
 */
export const CRITICAL_NA_OBJECT_RULES: readonly RuntimeValidationRule[] = [
  {
    ruleId: 'NA_OBJECT_DIRECT_ACCESS',
    ruleName: 'Direct NA Object Field Access',
    category: 'na_object_access' as const,
    severity: 'error' as const,
    enabled: true,
    description: 'Detects direct field access on objects initialized as na',
    detectionPattern: {
      patternType: 'semantic_analysis',
      pattern: /(\w+)\s*=\s*na[\s\S]*?(\w+)\s*=\s*\1\.(\w+)/,
      contextRequirements: [
        {
          requirementType: 'preceding_declaration',
          specification: 'var_declaration_with_na_initialization',
          optional: false,
        },
      ],
      multilineSupport: true,
      caseSensitive: true,
    },
    violationMessage:
      'Cannot access field of undefined (na) object. Initialize object before accessing fields.',
    suggestedFix: 'Initialize object with constructor call or add na validation check',
    documentation:
      'https://www.tradingview.com/pine-script-docs/en/v6/language/User-defined_types.html#na-values',
    examples: [
      {
        exampleType: 'violation',
        code: 'var MyType obj = na\nvalue = obj.field',
        description: 'Direct access to field of na object',
        expectedResult: 'Runtime error: Cannot access field of undefined object',
      },
    ],
  },
  {
    ruleId: 'NA_OBJECT_HISTORICAL_ACCESS',
    ruleName: 'Historical NA Object Field Access',
    category: 'na_object_history_access' as const,
    severity: 'error' as const,
    enabled: true,
    description: 'Detects field access on potentially na historical objects',
    detectionPattern: {
      patternType: 'regex',
      pattern: /\((\w+)\[(\d+)\]\)\.(\w+)/,
      contextRequirements: [
        {
          requirementType: 'object_initialization',
          specification: 'may_contain_na_values',
          optional: false,
        },
      ],
      multilineSupport: false,
      caseSensitive: true,
    },
    violationMessage:
      'Cannot access field of potentially undefined historical object. Add na check.',
    suggestedFix: 'Add na validation: not na(object[n]) ? (object[n]).field : defaultValue',
    documentation:
      'https://www.tradingview.com/pine-script-docs/en/v6/language/User-defined_types.html#history-referencing',
    examples: [
      {
        exampleType: 'violation',
        code: 'historicalValue = (myObject[1]).field',
        description: 'Historical access without na validation',
        expectedResult: 'Runtime error if historical object is na',
      },
    ],
  },
  {
    ruleId: 'UDT_UNINITIALIZED_ACCESS',
    ruleName: 'Uninitialized UDT Object Access',
    category: 'udt_lifecycle_error' as const,
    severity: 'error' as const,
    enabled: true,
    description: 'Detects access to uninitialized user-defined type objects',
    detectionPattern: {
      patternType: 'ast_traversal',
      pattern: 'object_field_access_without_initialization',
      contextRequirements: [
        {
          requirementType: 'scope_analysis',
          specification: 'track_object_initialization_state',
          optional: false,
        },
      ],
      multilineSupport: true,
      caseSensitive: true,
    },
    violationMessage: 'Object accessed before proper initialization. Runtime error likely.',
    suggestedFix: 'Initialize object with constructor or add initialization check',
    documentation:
      'https://www.tradingview.com/pine-script-docs/en/v6/language/User-defined_types.html',
    examples: [
      {
        exampleType: 'violation',
        code: 'type Data\n    float value\nvar Data d\nresult = d.value',
        description: 'Access to uninitialized object field',
        expectedResult: 'Runtime error: Cannot access field of undefined object',
      },
    ],
  },
] as const;

// ============================================================================
// VALIDATION CONSTRAINTS FOR RUNTIME ERRORS
// ============================================================================

/**
 * Enhanced validation constraints that include runtime safety
 */
export interface RuntimeValidationConstraints extends ValidationConstraints {
  readonly runtimeSafety: RuntimeSafetyConstraint;
  readonly udtValidation: UDTValidationConstraint;
  readonly naObjectHandling: NAObjectHandlingConstraint;
}

/**
 * Runtime safety constraint specification
 */
export interface RuntimeSafetyConstraint {
  readonly requireInitializationCheck: boolean;
  readonly allowNAValues: boolean;
  readonly enforceNAValidation: boolean;
  readonly runtimeErrorTolerance: 'none' | 'minimal' | 'moderate';
}

/**
 * UDT-specific validation constraints
 */
export interface UDTValidationConstraint {
  readonly enforceTypeConsistency: boolean;
  readonly requireConstructorUsage: boolean;
  readonly validateFieldAccess: boolean;
  readonly trackObjectLifecycle: boolean;
}

/**
 * NA object handling constraints
 */
export interface NAObjectHandlingConstraint {
  readonly preventDirectNAAccess: boolean;
  readonly requireHistoricalValidation: boolean;
  readonly enforceInitializationPattern: boolean;
  readonly suggestSafeAlternatives: boolean;
}

// ============================================================================
// RULE FACTORY AND BUILDER TYPES
// ============================================================================

/**
 * Factory interface for creating runtime validation rules
 */
export interface RuntimeValidationRuleFactory {
  createNAObjectAccessRule(
    pattern: DetectionPattern,
    severity: RuntimeErrorSeverity,
    message: string
  ): RuntimeValidationRule;

  createHistoricalAccessRule(
    udtTypeName: string,
    fieldNames: readonly string[],
    options?: Partial<RuntimeValidationRule>
  ): RuntimeValidationRule;

  createInitializationRule(
    requiredPattern: string,
    violationPattern: string,
    customMessage?: string
  ): RuntimeValidationRule;

  buildRuleSet(rules: readonly Partial<RuntimeValidationRule>[]): readonly RuntimeValidationRule[];
}

/**
 * Builder pattern for constructing complex validation configurations
 */
export interface EnhancedValidationRulesBuilder {
  withBaseRules(rules: ValidationRules): EnhancedValidationRulesBuilder;
  withNAObjectDetection(config: NAObjectRuntimeRules): EnhancedValidationRulesBuilder;
  withRuntimeSafety(config: RuntimeSafetyValidationConfig): EnhancedValidationRulesBuilder;
  withUDTPatterns(config: UDTPatternValidationRules): EnhancedValidationRulesBuilder;
  withIntegrationSettings(config: ValidationIntegrationConfig): EnhancedValidationRulesBuilder;
  build(): EnhancedValidationRules;
  validate(): readonly string[]; // Validation errors in configuration
}

// ============================================================================
// CONFIGURATION PRESETS
// ============================================================================

/**
 * Pre-configured validation rule sets for common scenarios
 */
export const VALIDATION_RULE_PRESETS = {
  STRICT_RUNTIME_SAFETY: 'strict_runtime_safety',
  BALANCED_DEVELOPMENT: 'balanced_development',
  PERMISSIVE_MIGRATION: 'permissive_migration',
  INSTITUTIONAL_GRADE: 'institutional_grade',
} as const;

export type ValidationRulePreset =
  (typeof VALIDATION_RULE_PRESETS)[keyof typeof VALIDATION_RULE_PRESETS];

/**
 * Factory function for creating preset configurations
 */
export declare function createValidationRulePreset(
  preset: ValidationRulePreset
): EnhancedValidationRules;

/**
 * Utility function for merging validation configurations
 */
export declare function mergeValidationRules(
  base: ValidationRules,
  enhancement: Partial<EnhancedValidationRules>
): EnhancedValidationRules;

/**
 * Configuration validation utility
 */
export declare function validateRuntimeRulesConfiguration(config: EnhancedValidationRules): {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
};

// ============================================================================
// TYPE EXPORTS FOR IMPLEMENTATION
// ============================================================================

export type {
  EnhancedValidationRules,
  NAObjectRuntimeRules,
  RuntimeValidationRule,
  DetectionPattern,
  RuntimeValidationConstraints,
  UDTPatternValidationRules,
  ValidationIntegrationConfig,
};

/**
 * Default export for easy importing of complete rule system
 */
export default interface RuntimeValidationSystem {
  readonly rules: typeof CRITICAL_NA_OBJECT_RULES;
  readonly factory: RuntimeValidationRuleFactory;
  readonly builder: EnhancedValidationRulesBuilder;
  readonly presets: typeof VALIDATION_RULE_PRESETS;
  readonly utilities: {
    createPreset: typeof createValidationRulePreset;
    mergeRules: typeof mergeValidationRules;
    validateConfig: typeof validateRuntimeRulesConfiguration;
  };
}
