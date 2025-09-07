/**
 * Pattern Detection Engine for NA Object Runtime Errors
 *
 * Advanced TypeScript interfaces for detecting complex Pine Script patterns
 * that lead to runtime NA object access violations.
 *
 * Implements semantic analysis, AST traversal, and pattern matching
 * with strict type safety and performance optimization.
 */

import type { ASTNode, SourceLocation, Token, DeclarationNode, IdentifierNode } from './types.js';

import type {
  UDTObjectDeclaration,
  UDTFieldAccess,
  UDTInitializationState,
  NAObjectViolation,
  RuntimeRiskAssessment,
} from './na-object-types.js';

// ============================================================================
// PATTERN DETECTION ENGINE CORE TYPES
// ============================================================================

/**
 * Main pattern detection engine interface
 */
export interface PatternDetectionEngine {
  readonly version: string;
  readonly capabilities: readonly PatternDetectionCapability[];
  readonly configuration: PatternDetectionConfiguration;

  // Core detection methods
  detectNAObjectPatterns(source: string, ast: ASTNode): Promise<DetectionResult>;
  detectUDTDeclarations(source: string, ast: ASTNode): Promise<readonly UDTObjectDeclaration[]>;
  detectFieldAccessPatterns(source: string, ast: ASTNode): Promise<readonly UDTFieldAccess[]>;
  analyzeObjectLifecycles(
    declarations: readonly UDTObjectDeclaration[],
    accesses: readonly UDTFieldAccess[]
  ): Promise<readonly ObjectLifecycleAnalysis[]>;

  // Pattern matching utilities
  matchPattern(pattern: DetectionPattern, source: string): Promise<readonly PatternMatch[]>;
  validatePatternResult(result: PatternMatch, context: AnalysisContext): ValidationOutcome;

  // Performance and optimization
  getPerformanceMetrics(): PatternDetectionMetrics;
  optimizeForLargeFiles(enabled: boolean): void;
  clearCache(): void;
}

/**
 * Capabilities supported by the pattern detection engine
 */
export const PATTERN_DETECTION_CAPABILITIES = {
  REGEX_MATCHING: 'regex_matching',
  AST_TRAVERSAL: 'ast_traversal',
  SEMANTIC_ANALYSIS: 'semantic_analysis',
  MULTILINE_PATTERNS: 'multiline_patterns',
  CONTEXT_AWARENESS: 'context_awareness',
  INCREMENTAL_ANALYSIS: 'incremental_analysis',
  PERFORMANCE_OPTIMIZATION: 'performance_optimization',
  PATTERN_CACHING: 'pattern_caching',
} as const;

export type PatternDetectionCapability =
  (typeof PATTERN_DETECTION_CAPABILITIES)[keyof typeof PATTERN_DETECTION_CAPABILITIES];

/**
 * Configuration for pattern detection engine
 */
export interface PatternDetectionConfiguration {
  readonly enabledCapabilities: readonly PatternDetectionCapability[];
  readonly performanceSettings: PatternPerformanceSettings;
  readonly analysisSettings: PatternAnalysisSettings;
  readonly cachingSettings: PatternCachingSettings;
  readonly debugSettings: PatternDebugSettings;
}

// ============================================================================
// PATTERN DETECTION SETTINGS
// ============================================================================

/**
 * Performance tuning settings for pattern detection
 */
export interface PatternPerformanceSettings {
  readonly maxAnalysisTimeMs: number;
  readonly enableParallelProcessing: boolean;
  readonly optimizeMemoryUsage: boolean;
  readonly incrementalProcessing: boolean;
  readonly batchSize: number;
  readonly timeoutHandling: 'graceful' | 'strict';
}

/**
 * Analysis depth and scope settings
 */
export interface PatternAnalysisSettings {
  readonly semanticAnalysisDepth: 'shallow' | 'moderate' | 'deep';
  readonly contextAwarenessLevel: 'local' | 'function' | 'global';
  readonly crossReferenceAnalysis: boolean;
  readonly historicalAccessDepthLimit: number;
  readonly typeInferenceEnabled: boolean;
  readonly scopeTrackingEnabled: boolean;
}

/**
 * Caching configuration for pattern results
 */
export interface PatternCachingSettings {
  readonly enablePatternCache: boolean;
  readonly cacheExpirationMs: number;
  readonly maxCacheEntries: number;
  readonly cacheStrategy: 'lru' | 'fifo' | 'adaptive';
  readonly persistCache: boolean;
}

/**
 * Debug and development settings
 */
export interface PatternDebugSettings {
  readonly enableDebugMode: boolean;
  readonly verboseLogging: boolean;
  readonly includePatternTrace: boolean;
  readonly reportPerformanceMetrics: boolean;
  readonly validatePatternMatches: boolean;
}

// ============================================================================
// DETECTION PATTERNS AND RESULTS
// ============================================================================

/**
 * Pattern definition for detection engine
 */
export interface DetectionPattern {
  readonly patternId: string;
  readonly patternName: string;
  readonly patternType: PatternType;
  readonly priority: PatternPriority;
  readonly specification: PatternSpecification;
  readonly contextRequirements: readonly ContextRequirement[];
  readonly validation: PatternValidation;
  readonly metadata: PatternMetadata;
}

/**
 * Types of patterns the engine can detect
 */
export const PATTERN_TYPES = {
  REGEX: 'regex',
  AST_NODE: 'ast_node',
  SEMANTIC: 'semantic',
  STRUCTURAL: 'structural',
  BEHAVIORAL: 'behavioral',
  COMPOSITE: 'composite',
} as const;

export type PatternType = (typeof PATTERN_TYPES)[keyof typeof PATTERN_TYPES];

/**
 * Pattern priority for processing order
 */
export const PATTERN_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFORMATIONAL: 'informational',
} as const;

export type PatternPriority = (typeof PATTERN_PRIORITIES)[keyof typeof PATTERN_PRIORITIES];

/**
 * Detailed pattern specification
 */
export interface PatternSpecification {
  readonly expression: string | RegExp | ASTNodeMatcher;
  readonly flags: readonly PatternFlag[];
  readonly constraints: readonly PatternConstraint[];
  readonly exclusions: readonly string[];
  readonly examples: readonly PatternExample[];
}

/**
 * Pattern matching flags
 */
export const PATTERN_FLAGS = {
  CASE_INSENSITIVE: 'case_insensitive',
  MULTILINE: 'multiline',
  GLOBAL: 'global',
  UNICODE: 'unicode',
  STICKY: 'sticky',
  DOT_ALL: 'dot_all',
} as const;

export type PatternFlag = (typeof PATTERN_FLAGS)[keyof typeof PATTERN_FLAGS];

/**
 * Constraints for pattern matching
 */
export interface PatternConstraint {
  readonly constraintType: 'position' | 'context' | 'precedence' | 'scope';
  readonly specification: string;
  readonly required: boolean;
  readonly weight: number;
}

/**
 * Example patterns for testing and documentation
 */
export interface PatternExample {
  readonly exampleType: 'positive' | 'negative' | 'edge_case';
  readonly sourceCode: string;
  readonly expectedMatches: readonly ExpectedMatch[];
  readonly description: string;
}

/**
 * Expected match result for pattern examples
 */
export interface ExpectedMatch {
  readonly location: SourceLocation;
  readonly matchedText: string;
  readonly captureGroups?: readonly string[];
  readonly contextData?: Record<string, unknown>;
}

// ============================================================================
// AST-BASED PATTERN MATCHING
// ============================================================================

/**
 * AST node matcher for structural pattern detection
 */
export interface ASTNodeMatcher {
  readonly nodeType: string | readonly string[];
  readonly propertyMatchers: readonly PropertyMatcher[];
  readonly childMatchers: readonly ChildMatcher[];
  readonly ancestorRequirements: readonly AncestorRequirement[];
  readonly siblingRequirements: readonly SiblingRequirement[];
}

/**
 * Property matching for AST nodes
 */
export interface PropertyMatcher {
  readonly propertyName: string;
  readonly matchType: 'exact' | 'regex' | 'range' | 'exists';
  readonly expectedValue: unknown;
  readonly optional: boolean;
}

/**
 * Child node matching requirements
 */
export interface ChildMatcher {
  readonly childIndex?: number; // Specific index or undefined for any
  readonly nodeType: string | readonly string[];
  readonly propertyRequirements: readonly PropertyMatcher[];
  readonly recursive: boolean;
  readonly minimumCount?: number;
  readonly maximumCount?: number;
}

/**
 * Ancestor node requirements for context matching
 */
export interface AncestorRequirement {
  readonly nodeType: string | readonly string[];
  readonly maxDistance: number; // Maximum levels up the tree
  readonly propertyRequirements: readonly PropertyMatcher[];
  readonly required: boolean;
}

/**
 * Sibling node requirements for context analysis
 */
export interface SiblingRequirement {
  readonly nodeType: string | readonly string[];
  readonly position: 'before' | 'after' | 'any';
  readonly maxDistance: number;
  readonly propertyRequirements: readonly PropertyMatcher[];
  readonly required: boolean;
}

// ============================================================================
// PATTERN MATCH RESULTS
// ============================================================================

/**
 * Result of pattern detection analysis
 */
export interface DetectionResult {
  readonly success: boolean;
  readonly patterns: readonly PatternMatch[];
  readonly violations: readonly NAObjectViolation[];
  readonly risks: readonly RuntimeRiskAssessment[];
  readonly metrics: PatternDetectionMetrics;
  readonly diagnostics: readonly DetectionDiagnostic[];
  readonly errors: readonly DetectionError[];
}

/**
 * Individual pattern match result
 */
export interface PatternMatch {
  readonly patternId: string;
  readonly matchId: string;
  readonly location: SourceLocation;
  readonly matchedText: string;
  readonly confidence: MatchConfidence;
  readonly context: MatchContext;
  readonly captures: readonly CaptureGroup[];
  readonly metadata: MatchMetadata;
}

/**
 * Confidence level for pattern matches
 */
export const MATCH_CONFIDENCE = {
  CERTAIN: 'certain',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNCERTAIN: 'uncertain',
} as const;

export type MatchConfidence = (typeof MATCH_CONFIDENCE)[keyof typeof MATCH_CONFIDENCE];

/**
 * Context information for pattern matches
 */
export interface MatchContext {
  readonly surroundingCode: string;
  readonly scopeInfo: ScopeInformation;
  readonly relatedNodes: readonly ASTNode[];
  readonly semanticContext: SemanticContext;
  readonly executionContext: ExecutionContext;
}

/**
 * Capture group information from pattern matching
 */
export interface CaptureGroup {
  readonly groupIndex: number;
  readonly groupName?: string;
  readonly capturedText: string;
  readonly location: SourceLocation;
  readonly semanticMeaning: string;
}

/**
 * Metadata associated with pattern matches
 */
export interface MatchMetadata {
  readonly detectionTimestamp: number;
  readonly detectionTimeMs: number;
  readonly patternComplexity: number;
  readonly contextComplexity: number;
  readonly additionalData: Record<string, unknown>;
}

// ============================================================================
// CONTEXT ANALYSIS TYPES
// ============================================================================

/**
 * Scope information for pattern context
 */
export interface ScopeInformation {
  readonly scopeType: 'global' | 'function' | 'block' | 'expression';
  readonly scopeName?: string;
  readonly scopeDepth: number;
  readonly variables: readonly VariableInfo[];
  readonly functions: readonly FunctionInfo[];
  readonly types: readonly TypeInfo[];
}

/**
 * Variable information in scope
 */
export interface VariableInfo {
  readonly name: string;
  readonly type: string;
  readonly declarationLocation: SourceLocation;
  readonly initializationState: 'uninitialized' | 'initialized' | 'conditional';
  readonly usageCount: number;
  readonly lastAccessLocation?: SourceLocation;
}

/**
 * Function information in scope
 */
export interface FunctionInfo {
  readonly name: string;
  readonly returnType: string;
  readonly parameters: readonly ParameterInfo[];
  readonly declarationLocation: SourceLocation;
  readonly callCount: number;
  readonly isBuiltIn: boolean;
}

/**
 * Parameter information for functions
 */
export interface ParameterInfo {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly required: boolean;
  readonly position: number;
}

/**
 * Type information in scope
 */
export interface TypeInfo {
  readonly typeName: string;
  readonly typeKind: 'primitive' | 'user_defined' | 'built_in';
  readonly fields: readonly TypeFieldInfo[];
  readonly declarationLocation?: SourceLocation;
  readonly usageCount: number;
}

/**
 * Type field information
 */
export interface TypeFieldInfo {
  readonly fieldName: string;
  readonly fieldType: string;
  readonly optional: boolean;
  readonly accessCount: number;
}

// ============================================================================
// SEMANTIC AND EXECUTION CONTEXT
// ============================================================================

/**
 * Semantic context for pattern analysis
 */
export interface SemanticContext {
  readonly dataFlowAnalysis: DataFlowInfo;
  readonly controlFlowAnalysis: ControlFlowInfo;
  readonly typeInference: TypeInferenceInfo;
  readonly dependencyAnalysis: DependencyInfo;
}

/**
 * Data flow analysis information
 */
export interface DataFlowInfo {
  readonly variableDefinitions: readonly VariableDefinition[];
  readonly variableUsages: readonly VariableUsage[];
  readonly dataFlowGraph: DataFlowGraph;
  readonly potentialNullReferences: readonly NullReferenceInfo[];
}

/**
 * Variable definition tracking
 */
export interface VariableDefinition {
  readonly variableName: string;
  readonly definitionLocation: SourceLocation;
  readonly definitionType: 'declaration' | 'assignment' | 'parameter';
  readonly assignedValue: string;
  readonly assignedType: string;
}

/**
 * Variable usage tracking
 */
export interface VariableUsage {
  readonly variableName: string;
  readonly usageLocation: SourceLocation;
  readonly usageType: 'read' | 'write' | 'read_write';
  readonly context: string;
}

/**
 * Data flow graph representation
 */
export interface DataFlowGraph {
  readonly nodes: readonly DataFlowNode[];
  readonly edges: readonly DataFlowEdge[];
  readonly entryPoints: readonly string[];
  readonly exitPoints: readonly string[];
}

/**
 * Data flow graph node
 */
export interface DataFlowNode {
  readonly nodeId: string;
  readonly nodeType: 'definition' | 'usage' | 'condition' | 'merge';
  readonly location: SourceLocation;
  readonly variablesAffected: readonly string[];
}

/**
 * Data flow graph edge
 */
export interface DataFlowEdge {
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly edgeType: 'direct' | 'conditional' | 'loop';
  readonly condition?: string;
}

/**
 * Null reference analysis
 */
export interface NullReferenceInfo {
  readonly variableName: string;
  readonly potentialNullLocation: SourceLocation;
  readonly accessLocation: SourceLocation;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'certain';
  readonly mitigationSuggestion: string;
}

/**
 * Control flow analysis information
 */
export interface ControlFlowInfo {
  readonly basicBlocks: readonly BasicBlock[];
  readonly branches: readonly BranchInfo[];
  readonly loops: readonly LoopInfo[];
  readonly unreachableCode: readonly SourceLocation[];
}

/**
 * Basic block in control flow
 */
export interface BasicBlock {
  readonly blockId: string;
  readonly startLocation: SourceLocation;
  readonly endLocation: SourceLocation;
  readonly statements: readonly string[];
  readonly predecessors: readonly string[];
  readonly successors: readonly string[];
}

/**
 * Branch information
 */
export interface BranchInfo {
  readonly branchId: string;
  readonly branchType: 'if' | 'switch' | 'ternary';
  readonly condition: string;
  readonly trueBlock: string;
  readonly falseBlock?: string;
  readonly location: SourceLocation;
}

/**
 * Loop information
 */
export interface LoopInfo {
  readonly loopId: string;
  readonly loopType: 'for' | 'while' | 'do_while';
  readonly condition: string;
  readonly bodyBlock: string;
  readonly location: SourceLocation;
  readonly iterationVariable?: string;
}

/**
 * Type inference information
 */
export interface TypeInferenceInfo {
  readonly inferredTypes: readonly InferredType[];
  readonly typeConstraints: readonly TypeConstraint[];
  readonly genericInstantiations: readonly GenericInstantiation[];
  readonly typeErrors: readonly TypeError[];
}

/**
 * Inferred type information
 */
export interface InferredType {
  readonly location: SourceLocation;
  readonly expression: string;
  readonly inferredType: string;
  readonly confidence: MatchConfidence;
  readonly inferenceReason: string;
}

/**
 * Type constraint information
 */
export interface TypeConstraint {
  readonly constraintId: string;
  readonly sourceLocation: SourceLocation;
  readonly targetLocation: SourceLocation;
  readonly constraintType: 'equality' | 'subtype' | 'supertype';
  readonly description: string;
}

/**
 * Generic type instantiation
 */
export interface GenericInstantiation {
  readonly genericType: string;
  readonly instantiatedType: string;
  readonly location: SourceLocation;
  readonly typeArguments: readonly string[];
}

/**
 * Type error information
 */
export interface TypeError {
  readonly errorId: string;
  readonly location: SourceLocation;
  readonly errorType: 'type_mismatch' | 'undefined_type' | 'invalid_operation';
  readonly message: string;
  readonly expectedType: string;
  readonly actualType: string;
}

/**
 * Dependency analysis information
 */
export interface DependencyInfo {
  readonly dependencies: readonly Dependency[];
  readonly circularDependencies: readonly CircularDependency[];
  readonly unusedDependencies: readonly UnusedDependency[];
  readonly missingDependencies: readonly MissingDependency[];
}

/**
 * Dependency relationship
 */
export interface Dependency {
  readonly dependentName: string;
  readonly dependencyName: string;
  readonly dependencyType: 'variable' | 'function' | 'type';
  readonly usageLocation: SourceLocation;
  readonly declarationLocation: SourceLocation;
}

/**
 * Circular dependency information
 */
export interface CircularDependency {
  readonly cycle: readonly string[];
  readonly cycleType: 'direct' | 'indirect';
  readonly locations: readonly SourceLocation[];
  readonly severity: 'warning' | 'error';
}

/**
 * Unused dependency information
 */
export interface UnusedDependency {
  readonly dependencyName: string;
  readonly dependencyType: 'variable' | 'function' | 'type';
  readonly declarationLocation: SourceLocation;
  readonly reason: string;
}

/**
 * Missing dependency information
 */
export interface MissingDependency {
  readonly dependencyName: string;
  readonly dependencyType: 'variable' | 'function' | 'type';
  readonly usageLocation: SourceLocation;
  readonly suggestion?: string;
}

/**
 * Execution context information
 */
export interface ExecutionContext {
  readonly executionPath: readonly ExecutionPathNode[];
  readonly possibleStates: readonly ExecutionState[];
  readonly runtimeBehavior: RuntimeBehaviorAnalysis;
  readonly performanceCharacteristics: PerformanceCharacteristics;
}

/**
 * Execution path node
 */
export interface ExecutionPathNode {
  readonly nodeId: string;
  readonly location: SourceLocation;
  readonly operation: string;
  readonly state: Record<string, unknown>;
  readonly possibleNextNodes: readonly string[];
}

/**
 * Execution state representation
 */
export interface ExecutionState {
  readonly stateId: string;
  readonly variableStates: Record<string, VariableState>;
  readonly constraints: readonly StateConstraint[];
  readonly probability: number;
}

/**
 * Variable state in execution
 */
export interface VariableState {
  readonly value: unknown;
  readonly type: string;
  readonly initialized: boolean;
  readonly nullable: boolean;
  readonly confidence: MatchConfidence;
}

/**
 * State constraint
 */
export interface StateConstraint {
  readonly constraintType: 'equality' | 'inequality' | 'range' | 'type';
  readonly target: string;
  readonly constraint: string;
  readonly confidence: MatchConfidence;
}

/**
 * Runtime behavior analysis
 */
export interface RuntimeBehaviorAnalysis {
  readonly potentialErrors: readonly PotentialRuntimeError[];
  readonly performanceBottlenecks: readonly PerformanceBottleneck[];
  readonly resourceUsage: ResourceUsageAnalysis;
  readonly sideEffects: readonly SideEffectAnalysis[];
}

/**
 * Potential runtime error
 */
export interface PotentialRuntimeError {
  readonly errorType: string;
  readonly probability: number;
  readonly location: SourceLocation;
  readonly condition: string;
  readonly impact: 'low' | 'medium' | 'high' | 'critical';
  readonly preventionStrategy: string;
}

/**
 * Performance bottleneck information
 */
export interface PerformanceBottleneck {
  readonly bottleneckType: 'computation' | 'memory' | 'io' | 'algorithm';
  readonly location: SourceLocation;
  readonly severity: 'minor' | 'moderate' | 'significant' | 'critical';
  readonly description: string;
  readonly optimization: string;
}

/**
 * Resource usage analysis
 */
export interface ResourceUsageAnalysis {
  readonly memoryUsage: MemoryUsageInfo;
  readonly computationComplexity: ComputationComplexityInfo;
  readonly externalDependencies: readonly ExternalDependencyInfo[];
}

/**
 * Memory usage information
 */
export interface MemoryUsageInfo {
  readonly estimatedMemoryKB: number;
  readonly memoryGrowthRate: 'constant' | 'linear' | 'quadratic' | 'exponential';
  readonly memoryHotspots: readonly SourceLocation[];
  readonly optimizationOpportunities: readonly string[];
}

/**
 * Computation complexity information
 */
export interface ComputationComplexityInfo {
  readonly timeComplexity: string; // Big-O notation
  readonly spaceComplexity: string; // Big-O notation
  readonly complexityHotspots: readonly SourceLocation[];
  readonly algorithmicConcerns: readonly string[];
}

/**
 * External dependency information
 */
export interface ExternalDependencyInfo {
  readonly dependencyName: string;
  readonly dependencyType: 'library' | 'service' | 'data_source';
  readonly usagePattern: string;
  readonly reliabilityRisk: 'low' | 'medium' | 'high';
}

/**
 * Side effect analysis
 */
export interface SideEffectAnalysis {
  readonly effectType: 'global_state_modification' | 'external_io' | 'mutation';
  readonly location: SourceLocation;
  readonly target: string;
  readonly predictability: 'deterministic' | 'probabilistic' | 'unpredictable';
  readonly impact: 'isolated' | 'local' | 'global';
}

/**
 * Performance characteristics
 */
export interface PerformanceCharacteristics {
  readonly executionTimeEstimate: ExecutionTimeInfo;
  readonly scalabilityAnalysis: ScalabilityInfo;
  readonly resourceEfficiency: ResourceEfficiencyInfo;
  readonly optimizationOpportunities: readonly OptimizationOpportunity[];
}

/**
 * Execution time information
 */
export interface ExecutionTimeInfo {
  readonly estimatedTimeMs: number;
  readonly timeComplexityClass: string;
  readonly variabilityFactors: readonly string[];
  readonly benchmarkComparisons: readonly BenchmarkComparison[];
}

/**
 * Scalability information
 */
export interface ScalabilityInfo {
  readonly scalabilityFactor: number;
  readonly scalabilityType: 'linear' | 'logarithmic' | 'polynomial' | 'exponential';
  readonly scalabilityConstraints: readonly string[];
  readonly scalabilityRecommendations: readonly string[];
}

/**
 * Resource efficiency information
 */
export interface ResourceEfficiencyInfo {
  readonly cpuEfficiency: number; // 0-1 scale
  readonly memoryEfficiency: number; // 0-1 scale
  readonly ioEfficiency: number; // 0-1 scale
  readonly overallEfficiency: number; // 0-1 scale
  readonly efficiencyBottlenecks: readonly string[];
}

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  readonly opportunityType: 'algorithmic' | 'data_structure' | 'caching' | 'parallelization';
  readonly location: SourceLocation;
  readonly description: string;
  readonly expectedImprovement: string;
  readonly implementationComplexity: 'low' | 'medium' | 'high';
}

/**
 * Benchmark comparison
 */
export interface BenchmarkComparison {
  readonly benchmarkName: string;
  readonly relativePerformance: number; // Ratio to benchmark
  readonly comparisonContext: string;
  readonly significanceLevel: number;
}

// ============================================================================
// OBJECT LIFECYCLE ANALYSIS
// ============================================================================

/**
 * Comprehensive object lifecycle analysis
 */
export interface ObjectLifecycleAnalysis {
  readonly objectName: string;
  readonly udtTypeName: string;
  readonly lifecyclePhases: readonly LifecyclePhase[];
  readonly riskAssessment: ObjectLifecycleRisk;
  readonly usagePatterns: readonly UsagePattern[];
  readonly recommendations: readonly LifecycleRecommendation[];
}

/**
 * Object lifecycle phase
 */
export interface LifecyclePhase {
  readonly phaseName: 'declaration' | 'initialization' | 'usage' | 'modification' | 'disposal';
  readonly location: SourceLocation;
  readonly state: ObjectState;
  readonly transitions: readonly StateTransition[];
  readonly duration: PhaseInformation;
}

/**
 * Object state during lifecycle
 */
export interface ObjectState {
  readonly initialized: boolean;
  readonly nullable: boolean;
  readonly mutable: boolean;
  readonly accessCount: number;
  readonly modificationCount: number;
  readonly lastAccess: SourceLocation;
}

/**
 * State transition information
 */
export interface StateTransition {
  readonly fromState: string;
  readonly toState: string;
  readonly trigger: string;
  readonly location: SourceLocation;
  readonly probability: number;
}

/**
 * Phase duration information
 */
export interface PhaseInformation {
  readonly startLocation: SourceLocation;
  readonly endLocation?: SourceLocation;
  readonly estimatedDurationMs?: number;
  readonly criticalPath: boolean;
}

/**
 * Object lifecycle risk assessment
 */
export interface ObjectLifecycleRisk {
  readonly overallRisk: 'low' | 'medium' | 'high' | 'critical';
  readonly riskFactors: readonly RiskFactor[];
  readonly mitigationStrategies: readonly MitigationStrategy[];
  readonly riskMetrics: RiskMetrics;
}

/**
 * Risk factor in object lifecycle
 */
export interface RiskFactor {
  readonly factorType:
    | 'uninitialized_access'
    | 'null_reference'
    | 'race_condition'
    | 'resource_leak';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly probability: number;
  readonly locations: readonly SourceLocation[];
  readonly description: string;
}

/**
 * Mitigation strategy for lifecycle risks
 */
export interface MitigationStrategy {
  readonly strategyType: 'validation' | 'initialization' | 'defensive_programming' | 'refactoring';
  readonly description: string;
  readonly implementation: string;
  readonly effectivenessRating: number; // 0-1 scale
  readonly implementationCost: 'low' | 'medium' | 'high';
}

/**
 * Risk metrics for quantitative analysis
 */
export interface RiskMetrics {
  readonly riskScore: number; // 0-100 scale
  readonly confidenceInterval: [number, number];
  readonly historicalTrends: readonly HistoricalRiskData[];
  readonly comparativeBenchmarks: readonly RiskBenchmark[];
}

/**
 * Historical risk data
 */
export interface HistoricalRiskData {
  readonly timePoint: number;
  readonly riskScore: number;
  readonly incidents: number;
  readonly context: string;
}

/**
 * Risk benchmark comparison
 */
export interface RiskBenchmark {
  readonly benchmarkName: string;
  readonly benchmarkScore: number;
  readonly comparisonResult: 'better' | 'similar' | 'worse';
  readonly significanceLevel: number;
}

/**
 * Usage pattern analysis
 */
export interface UsagePattern {
  readonly patternName: string;
  readonly patternType: 'access' | 'modification' | 'lifecycle';
  readonly frequency: number;
  readonly locations: readonly SourceLocation[];
  readonly riskAssociation: 'safe' | 'cautionary' | 'dangerous';
  readonly alternativeRecommendations: readonly string[];
}

/**
 * Lifecycle recommendation
 */
export interface LifecycleRecommendation {
  readonly recommendationType:
    | 'best_practice'
    | 'optimization'
    | 'safety_improvement'
    | 'refactoring';
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly codeExample: string;
  readonly benefits: readonly string[];
  readonly implementationNotes: readonly string[];
}

// ============================================================================
// PERFORMANCE AND DIAGNOSTICS
// ============================================================================

/**
 * Pattern detection performance metrics
 */
export interface PatternDetectionMetrics {
  readonly totalAnalysisTimeMs: number;
  readonly patternMatchingTimeMs: number;
  readonly semanticAnalysisTimeMs: number;
  readonly contextAnalysisTimeMs: number;
  readonly postProcessingTimeMs: number;
  readonly memoryUsageKB: number;
  readonly patternsProcessed: number;
  readonly matchesFound: number;
  readonly cacheHitRate: number;
  readonly parallelizationEfficiency: number;
}

/**
 * Detection diagnostic information
 */
export interface DetectionDiagnostic {
  readonly diagnosticId: string;
  readonly diagnosticType: 'performance' | 'accuracy' | 'coverage' | 'reliability';
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly message: string;
  readonly location?: SourceLocation;
  readonly recommendation: string;
  readonly metrics: Record<string, number>;
}

/**
 * Detection error information
 */
export interface DetectionError {
  readonly errorId: string;
  readonly errorType:
    | 'pattern_compilation'
    | 'analysis_failure'
    | 'resource_exhaustion'
    | 'timeout';
  readonly errorMessage: string;
  readonly location?: SourceLocation;
  readonly stackTrace?: string;
  readonly recoveryStrategy: string;
  readonly impactAssessment: string;
}

/**
 * Validation outcome for pattern matches
 */
export interface ValidationOutcome {
  readonly isValid: boolean;
  readonly confidence: MatchConfidence;
  readonly validationReasons: readonly string[];
  readonly potentialIssues: readonly string[];
  readonly recommendedActions: readonly string[];
  readonly qualityScore: number; // 0-1 scale
}

/**
 * Analysis context for pattern detection
 */
export interface AnalysisContext {
  readonly sourceCode: string;
  readonly ast: ASTNode;
  readonly tokens: readonly Token[];
  readonly semanticModel: SemanticContext;
  readonly analysisScope: 'local' | 'module' | 'project';
  readonly analysisDepth: 'shallow' | 'moderate' | 'deep';
  readonly timeConstraints: AnalysisTimeConstraints;
  readonly qualityRequirements: AnalysisQualityRequirements;
}

/**
 * Time constraints for analysis
 */
export interface AnalysisTimeConstraints {
  readonly maxTotalTimeMs: number;
  readonly maxPerPatternTimeMs: number;
  readonly enableTimeoutGrace: boolean;
  readonly prioritizePatterns: boolean;
}

/**
 * Quality requirements for analysis
 */
export interface AnalysisQualityRequirements {
  readonly minimumConfidence: MatchConfidence;
  readonly requireContextValidation: boolean;
  readonly enableFalsePositiveReduction: boolean;
  readonly comprehensiveCoverage: boolean;
}

// ============================================================================
// FACTORY AND BUILDER INTERFACES
// ============================================================================

/**
 * Factory for creating pattern detection components
 */
export interface PatternDetectionFactory {
  createEngine(config: PatternDetectionConfiguration): PatternDetectionEngine;
  createPattern(specification: PatternSpecification): DetectionPattern;
  createMatcher(type: PatternType, expression: string): ASTNodeMatcher;
  createAnalysisContext(source: string, ast: ASTNode): AnalysisContext;
  buildDetectionResult(matches: readonly PatternMatch[]): DetectionResult;
}

/**
 * Builder for pattern detection configuration
 */
export interface PatternDetectionConfigurationBuilder {
  withCapabilities(
    capabilities: readonly PatternDetectionCapability[]
  ): PatternDetectionConfigurationBuilder;
  withPerformanceSettings(
    settings: PatternPerformanceSettings
  ): PatternDetectionConfigurationBuilder;
  withAnalysisSettings(settings: PatternAnalysisSettings): PatternDetectionConfigurationBuilder;
  withCachingSettings(settings: PatternCachingSettings): PatternDetectionConfigurationBuilder;
  withDebugSettings(settings: PatternDebugSettings): PatternDetectionConfigurationBuilder;
  build(): PatternDetectionConfiguration;
  validate(): readonly string[];
}

/**
 * Main export interface for pattern detection system
 */
export interface PatternDetectionSystem {
  readonly factory: PatternDetectionFactory;
  readonly builder: PatternDetectionConfigurationBuilder;
  readonly engine: PatternDetectionEngine;
  readonly patterns: {
    readonly naObjectAccess: readonly DetectionPattern[];
    readonly historicalAccess: readonly DetectionPattern[];
    readonly initializationPatterns: readonly DetectionPattern[];
    readonly custom: readonly DetectionPattern[];
  };
  readonly utilities: {
    validatePattern: (pattern: DetectionPattern) => readonly string[];
    optimizePatterns: (patterns: readonly DetectionPattern[]) => readonly DetectionPattern[];
    benchmarkPerformance: (engine: PatternDetectionEngine) => Promise<PatternDetectionMetrics>;
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  PatternDetectionEngine,
  DetectionPattern,
  PatternMatch,
  DetectionResult,
  ObjectLifecycleAnalysis,
  PatternDetectionMetrics,
  AnalysisContext,
  ValidationOutcome,
};

/**
 * Default export for complete pattern detection system
 */
export default PatternDetectionSystem;
