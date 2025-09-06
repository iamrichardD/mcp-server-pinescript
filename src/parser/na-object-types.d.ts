/**
 * TypeScript Type Definitions for NA Object Access Detection
 * 
 * Comprehensive type system for detecting and preventing runtime errors
 * related to accessing fields of undefined (na) user-defined type objects.
 * 
 * Designed to integrate with existing validation system while maintaining
 * strict TypeScript compliance and avoiding `any` type usage.
 */

import type { 
  SourceLocation, 
  ValidationViolation, 
  ErrorSeverity,
  ASTNode,
  IdentifierNode,
  DeclarationNode 
} from './types.js';

// ============================================================================
// NA OBJECT ERROR CLASSIFICATION SYSTEM
// ============================================================================

/**
 * Extended error categories to include runtime error detection
 */
export const ENHANCED_ERROR_CATEGORIES = {
  RUNTIME_ERROR: 'runtime_error',
  NA_OBJECT_ACCESS: 'na_object_access', 
  NA_OBJECT_HISTORY_ACCESS: 'na_object_history_access',
  UDT_LIFECYCLE_ERROR: 'udt_lifecycle_error',
} as const;

export type EnhancedErrorCategory = typeof ENHANCED_ERROR_CATEGORIES[keyof typeof ENHANCED_ERROR_CATEGORIES];

/**
 * Extended error codes for NA object detection
 */
export const NA_OBJECT_ERROR_CODES = {
  NA_OBJECT_FIELD_ACCESS: 'NA_OBJECT_FIELD_ACCESS',
  NA_OBJECT_HISTORY_ACCESS: 'NA_OBJECT_HISTORY_ACCESS', 
  UDT_UNINITIALIZED_ACCESS: 'UDT_UNINITIALIZED_ACCESS',
  POTENTIAL_NA_ACCESS: 'POTENTIAL_NA_ACCESS',
  RUNTIME_ACCESS_VIOLATION: 'RUNTIME_ACCESS_VIOLATION',
} as const;

export type NAObjectErrorCode = typeof NA_OBJECT_ERROR_CODES[keyof typeof NA_OBJECT_ERROR_CODES];

/**
 * Severity levels specific to runtime errors
 */
export const RUNTIME_ERROR_SEVERITY = {
  RUNTIME_CRITICAL: 'error' as const, // Runtime breaking - must be 'error' severity
  RUNTIME_WARNING: 'warning' as const,  // Potential runtime issue
  RUNTIME_SUGGESTION: 'suggestion' as const, // Best practice recommendation
} as const;

export type RuntimeErrorSeverity = typeof RUNTIME_ERROR_SEVERITY[keyof typeof RUNTIME_ERROR_SEVERITY];

// ============================================================================
// UDT OBJECT STATE TRACKING TYPES
// ============================================================================

/**
 * User-Defined Type object initialization states
 */
export const UDT_INITIALIZATION_STATE = {
  UNINITIALIZED: 'uninitialized', // var UDT obj = na
  INITIALIZED: 'initialized',     // var UDT obj = UDT.new()
  CONDITIONALLY_INITIALIZED: 'conditional', // Initialized in some branches
  UNKNOWN: 'unknown',             // Cannot determine state
} as const;

export type UDTInitializationState = typeof UDT_INITIALIZATION_STATE[keyof typeof UDT_INITIALIZATION_STATE];

/**
 * UDT object declaration tracking information
 */
export interface UDTObjectDeclaration {
  readonly objectName: string;
  readonly udtTypeName: string;
  readonly initializationState: UDTInitializationState;
  readonly declarationLocation: SourceLocation;
  readonly initializationValue: 'na' | 'constructor' | 'expression';
  readonly isVariable: boolean; // true for 'var', false for direct assignment
}

/**
 * UDT field access pattern detection
 */
export interface UDTFieldAccess {
  readonly objectName: string;
  readonly fieldName: string;
  readonly accessType: 'direct' | 'historical'; // obj.field vs obj[1].field
  readonly accessLocation: SourceLocation;
  readonly isHistoricalIndex?: number; // For obj[n] access patterns
  readonly fullExpression: string; // Complete access expression
}

/**
 * Historical object access pattern (obj[n].field)
 */
export interface HistoricalObjectAccess extends UDTFieldAccess {
  readonly accessType: 'historical';
  readonly historicalIndex: number; // Always defined for historical access
  readonly baseObjectName: string;  // Object being accessed historically
}

// ============================================================================
// NA OBJECT DETECTION ANALYSIS TYPES
// ============================================================================

/**
 * Analysis result for NA object detection
 */
export interface NAObjectAnalysisResult {
  readonly udtDeclarations: readonly UDTObjectDeclaration[];
  readonly fieldAccesses: readonly UDTFieldAccess[];
  readonly violations: readonly NAObjectViolation[];
  readonly runtimeRisks: readonly RuntimeRiskAssessment[];
  readonly metrics: NAAnalysisMetrics;
}

/**
 * Specific violation for NA object access
 */
export interface NAObjectViolation extends ValidationViolation {
  readonly rule: string; // Will be one of the NA_OBJECT_ERROR_CODES
  readonly category: EnhancedErrorCategory;
  readonly naObjectDetails: NAObjectViolationDetails;
}

/**
 * Detailed information about NA object violation
 */
export interface NAObjectViolationDetails {
  readonly objectName: string;
  readonly udtTypeName?: string;
  readonly fieldName?: string;
  readonly violationType: 'direct_na_access' | 'historical_na_access' | 'uninitialized_access';
  readonly initializationState: UDTInitializationState;
  readonly suggestedFix: NAObjectFixSuggestion;
  readonly accessPattern: string; // The problematic code pattern
}

/**
 * Fix suggestions for NA object violations
 */
export interface NAObjectFixSuggestion {
  readonly fixType: 'initialize_object' | 'add_na_check' | 'conditional_access';
  readonly suggestedCode: string;
  readonly explanation: string;
  readonly preventionStrategy: string;
}

/**
 * Runtime risk assessment for potential issues
 */
export interface RuntimeRiskAssessment {
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly riskType: 'potential_na_access' | 'unvalidated_historical_access' | 'initialization_race';
  readonly affectedObjects: readonly string[];
  readonly recommendedActions: readonly string[];
  readonly location: SourceLocation;
}

/**
 * Performance metrics for NA object analysis
 */
export interface NAAnalysisMetrics {
  readonly totalUDTDeclarations: number;
  readonly totalFieldAccesses: number;
  readonly runtimeViolationsFound: number;
  readonly potentialRisksIdentified: number;
  readonly analysisTimeMs: number;
  readonly objectTrackingComplexity: number;
}

// ============================================================================
// VALIDATION RULE CONFIGURATION TYPES  
// ============================================================================

/**
 * Configuration for NA object detection rules
 */
export interface NAObjectDetectionRules {
  readonly enableDirectNAAccessDetection: boolean;
  readonly enableHistoricalNAAccessDetection: boolean;
  readonly enableInitializationTracking: boolean;
  readonly strictNAValidation: boolean;
  readonly allowConditionalInitialization: boolean;
  readonly historicalAccessDepthLimit: number;
}

/**
 * Enhanced validation constraints for runtime safety
 */
export interface RuntimeSafetyConstraints {
  readonly requireObjectInitialization: boolean;
  readonly requireNAChecksForHistoricalAccess: boolean;
  readonly allowUninitializedObjectAccess: boolean;
  readonly enforceNAValidationPattern: boolean;
  readonly runtimeSafetyLevel: 'permissive' | 'standard' | 'strict';
}

/**
 * Rule configuration for specific UDT patterns
 */
export interface UDTPatternRules {
  readonly udtTypeName: string;
  readonly requiredInitialization: boolean;
  readonly allowedAccessPatterns: readonly string[];
  readonly forbiddenAccessPatterns: readonly string[];
  readonly customValidationRules: readonly CustomUDTRule[];
}

/**
 * Custom validation rule for specific UDT patterns
 */
export interface CustomUDTRule {
  readonly ruleName: string;
  readonly pattern: RegExp;
  readonly severity: RuntimeErrorSeverity;
  readonly errorMessage: string;
  readonly suggestedFix: string;
}

// ============================================================================
// INTEGRATION WITH EXISTING VALIDATION SYSTEM
// ============================================================================

/**
 * Extended validation result that includes NA object analysis
 */
export interface EnhancedValidationResult {
  readonly violations: readonly ValidationViolation[];
  readonly naObjectAnalysis: NAObjectAnalysisResult;
  readonly runtimeSafetyReport: RuntimeSafetyReport;
  readonly warnings: readonly string[];
  readonly metrics: EnhancedValidationMetrics;
}

/**
 * Runtime safety summary report
 */
export interface RuntimeSafetyReport {
  readonly overallSafety: 'safe' | 'at_risk' | 'unsafe';
  readonly criticalIssuesCount: number;
  readonly warningIssuesCount: number;
  readonly runtimeErrorPrevention: readonly PreventionRecommendation[];
  readonly codeQualityImpact: 'positive' | 'neutral' | 'concerning';
}

/**
 * Recommendations for preventing runtime errors
 */
export interface PreventionRecommendation {
  readonly recommendationType: 'initialization' | 'validation' | 'refactoring';
  readonly priority: 'high' | 'medium' | 'low';
  readonly description: string;
  readonly codeExample: string;
  readonly benefits: readonly string[];
}

/**
 * Enhanced performance metrics including NA analysis
 */
export interface EnhancedValidationMetrics {
  readonly validationTimeMs: number;
  readonly naAnalysisTimeMs: number;
  readonly functionsAnalyzed: number;
  readonly udtObjectsTracked: number;
  readonly runtimePatternsDetected: number;
  readonly performanceImpact: 'minimal' | 'acceptable' | 'noticeable';
}

// ============================================================================
// TYPE GUARDS AND UTILITY TYPES
// ============================================================================

/**
 * Type guard for NA object violations
 */
export interface NAObjectTypeGuards {
  isNAObjectViolation(violation: ValidationViolation): violation is NAObjectViolation;
  isHistoricalAccess(access: UDTFieldAccess): access is HistoricalObjectAccess;
  isInitializedObject(declaration: UDTObjectDeclaration): boolean;
  isRuntimeCriticalViolation(violation: ValidationViolation): boolean;
}

/**
 * Factory functions for creating NA object violations
 */
export interface NAObjectViolationFactory {
  createDirectNAAccessViolation(
    objectName: string,
    fieldName: string,
    location: SourceLocation,
    udtType?: string
  ): NAObjectViolation;

  createHistoricalNAAccessViolation(
    objectName: string,
    fieldName: string,
    historicalIndex: number,
    location: SourceLocation,
    udtType?: string  
  ): NAObjectViolation;

  createUninitializedAccessViolation(
    objectName: string,
    initState: UDTInitializationState,
    location: SourceLocation,
    udtType?: string
  ): NAObjectViolation;

  createRuntimeRiskAssessment(
    riskType: RuntimeRiskAssessment['riskType'],
    objects: readonly string[],
    location: SourceLocation
  ): RuntimeRiskAssessment;
}

// ============================================================================
// API INTERFACES FOR NA OBJECT DETECTION
// ============================================================================

/**
 * Core NA object detection API
 */
export interface NAObjectDetectionAPI {
  /**
   * Analyze source code for NA object access patterns
   */
  analyzeNAObjectPatterns(
    source: string,
    rules?: NAObjectDetectionRules
  ): Promise<NAObjectAnalysisResult>;

  /**
   * Detect direct field access on NA objects (obj.field where obj = na)
   */
  detectDirectNAAccess(
    source: string
  ): Promise<readonly NAObjectViolation[]>;

  /**
   * Detect historical field access on potentially NA objects (obj[n].field)
   */
  detectHistoricalNAAccess(
    source: string
  ): Promise<readonly NAObjectViolation[]>;

  /**
   * Track UDT object initialization states throughout script
   */
  trackUDTInitializationStates(
    source: string
  ): Promise<readonly UDTObjectDeclaration[]>;

  /**
   * Assess runtime safety risks for UDT object operations
   */
  assessRuntimeSafety(
    declarations: readonly UDTObjectDeclaration[],
    accesses: readonly UDTFieldAccess[]
  ): RuntimeSafetyReport;
}

/**
 * Integration API with existing validation system
 */
export interface ValidationIntegrationAPI {
  /**
   * Extend existing validation with NA object detection
   */
  validateWithNAObjectDetection(
    source: string,
    existingRules?: unknown,
    naRules?: NAObjectDetectionRules
  ): Promise<EnhancedValidationResult>;

  /**
   * Merge NA object violations with existing validation violations
   */
  mergeValidationResults(
    existingViolations: readonly ValidationViolation[],
    naViolations: readonly NAObjectViolation[]
  ): readonly ValidationViolation[];

  /**
   * Convert NA object analysis to standard validation format
   */
  convertToStandardViolations(
    analysis: NAObjectAnalysisResult
  ): readonly ValidationViolation[];
}

// ============================================================================
// CONFIGURATION AND INITIALIZATION
// ============================================================================

/**
 * Complete configuration for NA object detection system
 */
export interface NAObjectDetectionConfiguration {
  readonly detectionRules: NAObjectDetectionRules;
  readonly safetyConstraints: RuntimeSafetyConstraints;
  readonly udtPatternRules: readonly UDTPatternRules[];
  readonly performanceSettings: NAObjectPerformanceSettings;
  readonly integrationSettings: IntegrationSettings;
}

/**
 * Performance tuning settings
 */
export interface NAObjectPerformanceSettings {
  readonly enableIncrementalAnalysis: boolean;
  readonly maxAnalysisTimeMs: number;
  readonly cacheAnalysisResults: boolean;
  readonly optimizeForLargeFiles: boolean;
  readonly parallelProcessing: boolean;
}

/**
 * Integration settings with existing systems
 */
export interface IntegrationSettings {
  readonly preserveExistingViolations: boolean;
  readonly prioritizeRuntimeErrors: boolean;
  readonly includePerformanceMetrics: boolean;
  readonly generateDetailedReports: boolean;
  readonly compatibilityMode: 'strict' | 'enhanced' | 'legacy';
}

/**
 * Initialization result for the NA object detection system
 */
export interface NAObjectDetectionInitResult {
  readonly success: boolean;
  readonly version: string;
  readonly configuration: NAObjectDetectionConfiguration;
  readonly capabilities: readonly string[];
  readonly errorMessage?: string;
  readonly performanceBaseline: NAAnalysisMetrics;
}

// ============================================================================
// EXPORT DECLARATIONS FOR TYPE SAFETY
// ============================================================================

/**
 * Ensure all types are properly exported for consumption
 * by implementation modules while maintaining strict typing
 */
declare global {
  namespace NAObjectDetection {
    // Re-export key types for global access
    type Violation = NAObjectViolation;
    type Analysis = NAObjectAnalysisResult; 
    type Configuration = NAObjectDetectionConfiguration;
    type API = NAObjectDetectionAPI;
  }
}

// Default export for main module integration
export interface NAObjectDetectionModule {
  readonly types: {
    NAObjectViolation: typeof NAObjectViolation;
    NAObjectAnalysisResult: typeof NAObjectAnalysisResult;
    NAObjectDetectionConfiguration: typeof NAObjectDetectionConfiguration;
  };
  readonly constants: {
    ENHANCED_ERROR_CATEGORIES: typeof ENHANCED_ERROR_CATEGORIES;
    NA_OBJECT_ERROR_CODES: typeof NA_OBJECT_ERROR_CODES;
    UDT_INITIALIZATION_STATE: typeof UDT_INITIALIZATION_STATE;
  };
  readonly guards: NAObjectTypeGuards;
  readonly factory: NAObjectViolationFactory;
  readonly api: NAObjectDetectionAPI;
}

/**
 * Type-safe initialization function signature
 */
export declare function initializeNAObjectDetection(
  config: NAObjectDetectionConfiguration
): Promise<NAObjectDetectionInitResult>;

/**
 * Main detection function with comprehensive typing
 */
export declare function detectNAObjectViolations(
  source: string,
  config?: Partial<NAObjectDetectionConfiguration>
): Promise<EnhancedValidationResult>;