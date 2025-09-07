/**
 * Integration Strategy for NA Object Detection with Existing MCP Service
 *
 * Defines how the new NA object detection system integrates seamlessly
 * with the existing validation infrastructure while maintaining strict
 * TypeScript compliance and avoiding breaking changes.
 *
 * Provides backward compatibility and incremental adoption strategies.
 */

import type {
  ValidationResult,
  ValidationViolation,
  IntegrationAPI,
  AnalysisResult,
  ParserAPI,
  ValidatorAPI,
} from './types.js';

import type {
  NAObjectAnalysisResult,
  NAObjectViolation,
  EnhancedValidationResult,
  NAObjectDetectionConfiguration,
  RuntimeSafetyReport,
} from './na-object-types.js';

import type { EnhancedValidationRules, RuntimeValidationRule } from './runtime-validation-rules.js';

import type { PatternDetectionEngine, DetectionResult } from './pattern-detection-engine.js';

// ============================================================================
// INTEGRATION ARCHITECTURE
// ============================================================================

/**
 * Main integration service that extends existing MCP functionality
 */
export interface NAObjectIntegrationService {
  readonly version: string;
  readonly compatibility: IntegrationCompatibility;
  readonly configuration: IntegrationConfiguration;

  // Core integration methods
  integrateWithExistingValidator(existingValidator: ValidatorAPI): Promise<EnhancedValidatorAPI>;

  enhanceAnalysisResult(
    existingResult: AnalysisResult,
    naAnalysis: NAObjectAnalysisResult
  ): Promise<EnhancedAnalysisResult>;

  migrateValidationRules(
    existingRules: unknown,
    enhancedRules: EnhancedValidationRules
  ): Promise<MigrationResult>;

  // Backward compatibility
  provideLegacySupport(legacyRequest: LegacyValidationRequest): Promise<LegacyValidationResponse>;

  // Performance monitoring
  getIntegrationMetrics(): IntegrationMetrics;
  validateIntegration(): Promise<IntegrationValidationResult>;
}

/**
 * Integration compatibility information
 */
export interface IntegrationCompatibility {
  readonly mcpServiceVersion: string;
  readonly supportedApiVersions: readonly string[];
  readonly backwardCompatibility: 'full' | 'partial' | 'limited';
  readonly forwardCompatibility: 'guaranteed' | 'best_effort' | 'none';
  readonly migrationPath: 'automatic' | 'assisted' | 'manual';
  readonly deprecationWarnings: readonly DeprecationWarning[];
}

/**
 * Deprecation warning information
 */
export interface DeprecationWarning {
  readonly feature: string;
  readonly deprecationVersion: string;
  readonly removalVersion: string;
  readonly replacement: string;
  readonly migrationGuide: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

// ============================================================================
// ENHANCED API INTERFACES
// ============================================================================

/**
 * Enhanced validator API that includes NA object detection
 */
export interface EnhancedValidatorAPI extends ValidatorAPI {
  // Enhanced validation methods
  validateWithNADetection(
    source: string,
    rules?: EnhancedValidationRules
  ): Promise<EnhancedValidationResult>;

  quickValidateNAObjectAccess(source: string): Promise<AnalysisResult>;
  quickValidateRuntimeSafety(source: string): Promise<RuntimeSafetyReport>;

  // Configuration methods
  loadEnhancedValidationRules(rules: EnhancedValidationRules): Promise<void>;
  configureNAObjectDetection(config: NAObjectDetectionConfiguration): Promise<void>;

  // Analysis methods
  analyzeObjectLifecycles(source: string): Promise<ObjectLifecycleReport>;
  detectRuntimeViolations(source: string): Promise<readonly NAObjectViolation[]>;

  // Reporting methods
  generateRuntimeSafetyReport(source: string): Promise<RuntimeSafetyReport>;
  generateIntegrationDiagnostics(): Promise<IntegrationDiagnosticReport>;
}

/**
 * Enhanced analysis result that merges existing and new analysis
 */
export interface EnhancedAnalysisResult extends AnalysisResult {
  readonly naObjectAnalysis: NAObjectAnalysisResult;
  readonly runtimeSafetyReport: RuntimeSafetyReport;
  readonly integrationMetrics: IntegrationMetrics;
  readonly enhancementSummary: EnhancementSummary;
  readonly backwardCompatibility: BackwardCompatibilityReport;
}

/**
 * Enhancement summary for analysis results
 */
export interface EnhancementSummary {
  readonly newViolationsFound: number;
  readonly existingViolationsEnhanced: number;
  readonly runtimeErrorsPrevented: number;
  readonly falsePositivesReduced: number;
  readonly analysisQualityImprovement: QualityImprovement;
  readonly performanceImpact: PerformanceImpact;
}

/**
 * Quality improvement metrics
 */
export interface QualityImprovement {
  readonly accuracyIncrease: number; // Percentage improvement
  readonly coverageIncrease: number; // Percentage improvement
  readonly precisionIncrease: number; // Percentage improvement
  readonly recallIncrease: number; // Percentage improvement
  readonly overallQualityScore: number; // 0-100 scale
}

/**
 * Performance impact assessment
 */
export interface PerformanceImpact {
  readonly analysisTimeIncrease: number; // Percentage
  readonly memoryUsageIncrease: number; // Percentage
  readonly throughputChange: number; // Percentage (negative = decrease)
  readonly scalabilityImpact: 'positive' | 'neutral' | 'negative';
  readonly acceptabilityRating: 'excellent' | 'good' | 'acceptable' | 'concerning';
}

/**
 * Backward compatibility report
 */
export interface BackwardCompatibilityReport {
  readonly apiCompatibility: 'full' | 'partial' | 'breaking';
  readonly dataFormatCompatibility: 'full' | 'enhanced' | 'incompatible';
  readonly behaviorConsistency: 'identical' | 'enhanced' | 'changed';
  readonly migrationRequired: boolean;
  readonly compatibilityIssues: readonly CompatibilityIssue[];
}

/**
 * Compatibility issue information
 */
export interface CompatibilityIssue {
  readonly issueType: 'api_change' | 'data_format_change' | 'behavior_change';
  readonly severity: 'minor' | 'moderate' | 'major' | 'breaking';
  readonly description: string;
  readonly affectedComponents: readonly string[];
  readonly migrationStrategy: string;
  readonly workaround?: string;
}

// ============================================================================
// CONFIGURATION AND SETUP
// ============================================================================

/**
 * Integration configuration options
 */
export interface IntegrationConfiguration {
  readonly integrationMode: IntegrationMode;
  readonly validationStrategy: ValidationIntegrationStrategy;
  readonly performanceSettings: IntegrationPerformanceSettings;
  readonly compatibilitySettings: CompatibilitySettings;
  readonly reportingSettings: ReportingIntegrationSettings;
  readonly migrationSettings: MigrationSettings;
}

/**
 * Integration mode options
 */
export const INTEGRATION_MODES = {
  ENHANCED: 'enhanced', // Full enhancement with new features
  HYBRID: 'hybrid', // Mix of old and new validation
  GRADUAL: 'gradual', // Gradual replacement of existing features
  PARALLEL: 'parallel', // Run both systems in parallel
  LEGACY_PRESERVE: 'legacy_preserve', // Preserve all legacy behavior
} as const;

export type IntegrationMode = (typeof INTEGRATION_MODES)[keyof typeof INTEGRATION_MODES];

/**
 * Validation integration strategy
 */
export interface ValidationIntegrationStrategy {
  readonly mergeViolations: 'append' | 'merge' | 'prioritize' | 'separate';
  readonly conflictResolution: 'new_wins' | 'existing_wins' | 'merge_both' | 'user_choice';
  readonly severityHandling: 'preserve' | 'escalate' | 'harmonize';
  readonly categoryHandling: 'preserve' | 'enhance' | 'standardize';
  readonly messageEnhancement: boolean;
}

/**
 * Performance settings for integration
 */
export interface IntegrationPerformanceSettings {
  readonly enableParallelProcessing: boolean;
  readonly maxConcurrentAnalysis: number;
  readonly cacheIntegrationResults: boolean;
  readonly optimizeForLargeFiles: boolean;
  readonly performanceMonitoring: boolean;
  readonly timeoutHandling: TimeoutHandling;
}

/**
 * Timeout handling strategy
 */
export interface TimeoutHandling {
  readonly enableTimeouts: boolean;
  readonly maxAnalysisTimeMs: number;
  readonly timeoutStrategy: 'fail_fast' | 'graceful_degradation' | 'partial_results';
  readonly fallbackToLegacy: boolean;
}

/**
 * Compatibility settings
 */
export interface CompatibilitySettings {
  readonly maintainLegacyApi: boolean;
  readonly preserveDataFormats: boolean;
  readonly enableDeprecationWarnings: boolean;
  readonly strictCompatibilityMode: boolean;
  readonly migrationAssistance: boolean;
}

/**
 * Reporting integration settings
 */
export interface ReportingIntegrationSettings {
  readonly enhanceExistingReports: boolean;
  readonly generateSeparateReports: boolean;
  readonly includeIntegrationMetrics: boolean;
  readonly detailedCompatibilityReporting: boolean;
  readonly performanceReporting: boolean;
}

/**
 * Migration settings
 */
export interface MigrationSettings {
  readonly enableAutomaticMigration: boolean;
  readonly preserveLegacyBehavior: boolean;
  readonly generateMigrationReports: boolean;
  readonly validateMigrationResults: boolean;
  readonly rollbackSupport: boolean;
}

// ============================================================================
// LEGACY SUPPORT INTERFACES
// ============================================================================

/**
 * Legacy validation request structure
 */
export interface LegacyValidationRequest {
  readonly source: string;
  readonly rules?: unknown; // Legacy rule format
  readonly options?: LegacyValidationOptions;
  readonly format?: 'v1' | 'v2' | 'v3';
}

/**
 * Legacy validation options
 */
export interface LegacyValidationOptions {
  readonly strictMode?: boolean;
  readonly includeWarnings?: boolean;
  readonly maxViolations?: number;
  readonly categories?: readonly string[];
  readonly performanceMode?: 'fast' | 'thorough';
}

/**
 * Legacy validation response structure
 */
export interface LegacyValidationResponse {
  readonly success: boolean;
  readonly violations: readonly ValidationViolation[];
  readonly warnings: readonly string[];
  readonly errors?: readonly string[];
  readonly metrics?: unknown; // Legacy metrics format
  readonly compatibility: LegacyCompatibilityInfo;
}

/**
 * Legacy compatibility information
 */
export interface LegacyCompatibilityInfo {
  readonly originalFormat: boolean;
  readonly enhancementsApplied: readonly string[];
  readonly deprecationNotices: readonly string[];
  readonly migrationSuggestions: readonly string[];
}

// ============================================================================
// MIGRATION AND UPGRADE SUPPORT
// ============================================================================

/**
 * Migration result information
 */
export interface MigrationResult {
  readonly success: boolean;
  readonly migratedRules: EnhancedValidationRules;
  readonly migrationReport: MigrationReport;
  readonly validationResults: MigrationValidationResults;
  readonly rollbackInformation: RollbackInformation;
}

/**
 * Migration report details
 */
export interface MigrationReport {
  readonly migrationId: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly rulesProcessed: number;
  readonly rulesMigrated: number;
  readonly rulesSkipped: number;
  readonly rulesFailed: number;
  readonly issues: readonly MigrationIssue[];
  readonly summary: MigrationSummary;
}

/**
 * Migration issue information
 */
export interface MigrationIssue {
  readonly issueType: 'warning' | 'error' | 'information';
  readonly ruleId?: string;
  readonly description: string;
  readonly resolution: string;
  readonly impact: 'none' | 'minor' | 'moderate' | 'significant';
}

/**
 * Migration summary
 */
export interface MigrationSummary {
  readonly overallSuccess: boolean;
  readonly migrationQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  readonly recommendedActions: readonly string[];
  readonly followUpRequired: boolean;
}

/**
 * Migration validation results
 */
export interface MigrationValidationResults {
  readonly preValidation: ValidationTestResults;
  readonly postValidation: ValidationTestResults;
  readonly consistency: ConsistencyCheck;
  readonly performance: PerformanceComparison;
}

/**
 * Validation test results
 */
export interface ValidationTestResults {
  readonly testsRun: number;
  readonly testsPassed: number;
  readonly testsFailed: number;
  readonly testsSkipped: number;
  readonly failures: readonly TestFailure[];
  readonly overallScore: number;
}

/**
 * Test failure information
 */
export interface TestFailure {
  readonly testName: string;
  readonly expectedResult: string;
  readonly actualResult: string;
  readonly difference: string;
  readonly severity: 'minor' | 'moderate' | 'critical';
}

/**
 * Consistency check results
 */
export interface ConsistencyCheck {
  readonly dataConsistency: boolean;
  readonly behaviorConsistency: boolean;
  readonly apiConsistency: boolean;
  readonly performanceConsistency: boolean;
  readonly inconsistencies: readonly Inconsistency[];
}

/**
 * Inconsistency information
 */
export interface Inconsistency {
  readonly inconsistencyType: 'data' | 'behavior' | 'api' | 'performance';
  readonly description: string;
  readonly impact: 'cosmetic' | 'functional' | 'critical';
  readonly resolution: string;
}

/**
 * Performance comparison
 */
export interface PerformanceComparison {
  readonly baselinePerformance: PerformanceBenchmark;
  readonly migratedPerformance: PerformanceBenchmark;
  readonly performanceChange: PerformanceChange;
  readonly acceptabilityAssessment: AcceptabilityAssessment;
}

/**
 * Performance benchmark
 */
export interface PerformanceBenchmark {
  readonly averageTimeMs: number;
  readonly medianTimeMs: number;
  readonly p95TimeMs: number;
  readonly p99TimeMs: number;
  readonly memoryUsageKB: number;
  readonly throughputOpsPerSecond: number;
}

/**
 * Performance change analysis
 */
export interface PerformanceChange {
  readonly timeChange: number; // Percentage change
  readonly memoryChange: number; // Percentage change
  readonly throughputChange: number; // Percentage change
  readonly overallTrend: 'improved' | 'similar' | 'degraded';
  readonly significantChanges: readonly string[];
}

/**
 * Acceptability assessment
 */
export interface AcceptabilityAssessment {
  readonly acceptabilityLevel: 'excellent' | 'good' | 'acceptable' | 'unacceptable';
  readonly reasoningFactors: readonly string[];
  readonly recommendations: readonly string[];
  readonly requiresOptimization: boolean;
}

/**
 * Rollback information
 */
export interface RollbackInformation {
  readonly rollbackSupported: boolean;
  readonly rollbackComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
  readonly rollbackProcedure: readonly RollbackStep[];
  readonly rollbackRisks: readonly RollbackRisk[];
  readonly estimatedRollbackTime: number; // Minutes
}

/**
 * Rollback step
 */
export interface RollbackStep {
  readonly stepNumber: number;
  readonly stepDescription: string;
  readonly stepType: 'configuration' | 'data' | 'validation' | 'cleanup';
  readonly required: boolean;
  readonly estimatedTimeMinutes: number;
}

/**
 * Rollback risk
 */
export interface RollbackRisk {
  readonly riskType: 'data_loss' | 'functionality_loss' | 'performance_degradation';
  readonly probability: 'low' | 'medium' | 'high';
  readonly impact: 'minor' | 'moderate' | 'significant' | 'severe';
  readonly mitigation: string;
}

// ============================================================================
// REPORTING AND DIAGNOSTICS
// ============================================================================

/**
 * Object lifecycle report
 */
export interface ObjectLifecycleReport {
  readonly reportId: string;
  readonly generationTime: number;
  readonly analysisScope: string;
  readonly objectsAnalyzed: number;
  readonly lifecycleAnalyses: readonly ObjectLifecycleAnalysisInfo[];
  readonly summaryStatistics: LifecycleSummaryStatistics;
  readonly recommendations: readonly LifecycleRecommendation[];
}

/**
 * Object lifecycle analysis information
 */
export interface ObjectLifecycleAnalysisInfo {
  readonly objectName: string;
  readonly objectType: string;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly issuesFound: number;
  readonly recommendationsCount: number;
  readonly analysisQuality: number; // 0-1 scale
}

/**
 * Lifecycle summary statistics
 */
export interface LifecycleSummaryStatistics {
  readonly totalObjects: number;
  readonly safeObjects: number;
  readonly riskObjects: number;
  readonly criticalObjects: number;
  readonly averageRiskScore: number;
  readonly mostCommonIssues: readonly IssueFrequency[];
}

/**
 * Issue frequency information
 */
export interface IssueFrequency {
  readonly issueType: string;
  readonly frequency: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly examples: readonly string[];
}

/**
 * Lifecycle recommendation
 */
export interface LifecycleRecommendation {
  readonly recommendationId: string;
  readonly recommendationType: 'safety' | 'performance' | 'maintainability';
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly implementation: string;
  readonly benefits: readonly string[];
  readonly estimatedEffort: string;
}

/**
 * Integration diagnostic report
 */
export interface IntegrationDiagnosticReport {
  readonly reportId: string;
  readonly diagnosticTime: number;
  readonly systemHealth: SystemHealthInfo;
  readonly performanceAnalysis: IntegrationPerformanceAnalysis;
  readonly compatibilityStatus: CompatibilityStatus;
  readonly configurationValidation: ConfigurationValidation;
  readonly recommendations: readonly DiagnosticRecommendation[];
}

/**
 * System health information
 */
export interface SystemHealthInfo {
  readonly overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  readonly componentHealth: readonly ComponentHealth[];
  readonly systemErrors: readonly SystemError[];
  readonly systemWarnings: readonly SystemWarning[];
}

/**
 * Component health status
 */
export interface ComponentHealth {
  readonly componentName: string;
  readonly healthStatus: 'healthy' | 'warning' | 'error' | 'unavailable';
  readonly lastCheck: number;
  readonly metrics: Record<string, number>;
  readonly issues: readonly string[];
}

/**
 * System error information
 */
export interface SystemError {
  readonly errorId: string;
  readonly errorType: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly timestamp: number;
  readonly component: string;
  readonly resolution: string;
}

/**
 * System warning information
 */
export interface SystemWarning {
  readonly warningId: string;
  readonly warningType: string;
  readonly description: string;
  readonly timestamp: number;
  readonly component: string;
  readonly recommendation: string;
}

/**
 * Integration performance analysis
 */
export interface IntegrationPerformanceAnalysis {
  readonly baselineMetrics: IntegrationMetrics;
  readonly currentMetrics: IntegrationMetrics;
  readonly performanceTrends: readonly PerformanceTrend[];
  readonly bottlenecks: readonly PerformanceBottleneck[];
  readonly optimizationOpportunities: readonly OptimizationOpportunity[];
}

/**
 * Performance trend information
 */
export interface PerformanceTrend {
  readonly metricName: string;
  readonly trend: 'improving' | 'stable' | 'degrading';
  readonly trendMagnitude: number;
  readonly timeWindow: string;
  readonly significance: 'low' | 'medium' | 'high';
}

/**
 * Performance bottleneck
 */
export interface PerformanceBottleneck {
  readonly bottleneckId: string;
  readonly location: string;
  readonly impactSeverity: 'minor' | 'moderate' | 'significant' | 'critical';
  readonly description: string;
  readonly recommendedAction: string;
  readonly estimatedImprovement: string;
}

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  readonly opportunityId: string;
  readonly opportunityType: 'performance' | 'memory' | 'accuracy' | 'usability';
  readonly description: string;
  readonly implementationComplexity: 'low' | 'medium' | 'high';
  readonly expectedBenefit: string;
  readonly priority: 'low' | 'medium' | 'high';
}

/**
 * Compatibility status
 */
export interface CompatibilityStatus {
  readonly overallCompatibility: 'full' | 'high' | 'partial' | 'limited' | 'incompatible';
  readonly apiCompatibility: CompatibilityLevel;
  readonly dataCompatibility: CompatibilityLevel;
  readonly behaviorCompatibility: CompatibilityLevel;
  readonly compatibilityIssues: readonly CompatibilityIssue[];
}

/**
 * Compatibility level assessment
 */
export interface CompatibilityLevel {
  readonly level: 'full' | 'high' | 'partial' | 'limited' | 'none';
  readonly details: string;
  readonly riskAssessment: 'low' | 'medium' | 'high';
  readonly mitigationRequired: boolean;
}

/**
 * Configuration validation results
 */
export interface ConfigurationValidation {
  readonly configurationValid: boolean;
  readonly validationErrors: readonly ConfigurationError[];
  readonly validationWarnings: readonly ConfigurationWarning[];
  readonly configurationScore: number; // 0-100 scale
  readonly recommendedChanges: readonly ConfigurationChange[];
}

/**
 * Configuration error
 */
export interface ConfigurationError {
  readonly errorType: string;
  readonly configurationPath: string;
  readonly errorMessage: string;
  readonly severity: 'minor' | 'moderate' | 'critical';
  readonly resolution: string;
}

/**
 * Configuration warning
 */
export interface ConfigurationWarning {
  readonly warningType: string;
  readonly configurationPath: string;
  readonly warningMessage: string;
  readonly recommendation: string;
  readonly impact: string;
}

/**
 * Configuration change recommendation
 */
export interface ConfigurationChange {
  readonly changePath: string;
  readonly changeType: 'add' | 'modify' | 'remove';
  readonly currentValue: unknown;
  readonly recommendedValue: unknown;
  readonly justification: string;
  readonly priority: 'low' | 'medium' | 'high';
}

/**
 * Diagnostic recommendation
 */
export interface DiagnosticRecommendation {
  readonly recommendationId: string;
  readonly category: 'performance' | 'compatibility' | 'configuration' | 'maintenance';
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly title: string;
  readonly description: string;
  readonly actionItems: readonly string[];
  readonly expectedBenefit: string;
  readonly implementationTime: string;
}

// ============================================================================
// INTEGRATION METRICS AND MONITORING
// ============================================================================

/**
 * Integration metrics for monitoring system performance
 */
export interface IntegrationMetrics {
  readonly integrationId: string;
  readonly measurementTime: number;
  readonly systemMetrics: SystemMetrics;
  readonly validationMetrics: ValidationMetrics;
  readonly performanceMetrics: PerformanceMetrics;
  readonly reliabilityMetrics: ReliabilityMetrics;
  readonly usageMetrics: UsageMetrics;
}

/**
 * System-level metrics
 */
export interface SystemMetrics {
  readonly uptime: number; // Milliseconds
  readonly availability: number; // Percentage
  readonly memoryUsage: MemoryMetrics;
  readonly cpuUsage: CPUMetrics;
  readonly diskUsage: DiskMetrics;
  readonly networkMetrics: NetworkMetrics;
}

/**
 * Memory usage metrics
 */
export interface MemoryMetrics {
  readonly totalMemoryKB: number;
  readonly usedMemoryKB: number;
  readonly freeMemoryKB: number;
  readonly memoryUtilization: number; // Percentage
  readonly memoryLeaks: readonly MemoryLeak[];
}

/**
 * Memory leak information
 */
export interface MemoryLeak {
  readonly component: string;
  readonly leakRate: number; // KB per second
  readonly severity: 'minor' | 'moderate' | 'significant' | 'critical';
  readonly detectionTime: number;
}

/**
 * CPU usage metrics
 */
export interface CPUMetrics {
  readonly cpuUtilization: number; // Percentage
  readonly averageLoad: number;
  readonly peakLoad: number;
  readonly loadDistribution: readonly LoadDistribution[];
}

/**
 * Load distribution information
 */
export interface LoadDistribution {
  readonly timeWindow: string;
  readonly averageLoad: number;
  readonly peakLoad: number;
  readonly loadVariability: number;
}

/**
 * Disk usage metrics
 */
export interface DiskUsage {
  readonly totalSpaceKB: number;
  readonly usedSpaceKB: number;
  readonly freeSpaceKB: number;
  readonly diskUtilization: number; // Percentage
  readonly ioOperationsPerSecond: number;
}

/**
 * Network metrics
 */
export interface NetworkMetrics {
  readonly requestsPerSecond: number;
  readonly responsesPerSecond: number;
  readonly averageLatencyMs: number;
  readonly errorRate: number; // Percentage
  readonly bandwidthUtilization: number; // Percentage
}

/**
 * Validation-specific metrics
 */
export interface ValidationMetrics {
  readonly validationsPerformed: number;
  readonly validationSuccessRate: number; // Percentage
  readonly averageValidationTimeMs: number;
  readonly violationsDetected: number;
  readonly falsePositiveRate: number; // Percentage
  readonly falseNegativeRate: number; // Percentage
  readonly validationAccuracy: number; // Percentage
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly throughput: number; // Operations per second
  readonly latency: LatencyMetrics;
  readonly scalability: ScalabilityMetrics;
  readonly efficiency: EfficiencyMetrics;
}

/**
 * Latency metrics
 */
export interface LatencyMetrics {
  readonly averageLatencyMs: number;
  readonly medianLatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly maxLatencyMs: number;
}

/**
 * Scalability metrics
 */
export interface ScalabilityMetrics {
  readonly scalabilityFactor: number;
  readonly maxConcurrentOperations: number;
  readonly performanceDegradationPoint: number;
  readonly scalabilityBottlenecks: readonly string[];
}

/**
 * Efficiency metrics
 */
export interface EfficiencyMetrics {
  readonly resourceEfficiency: number; // 0-1 scale
  readonly operationalEfficiency: number; // 0-1 scale
  readonly costEfficiency: number; // 0-1 scale
  readonly overallEfficiency: number; // 0-1 scale
}

/**
 * Reliability metrics
 */
export interface ReliabilityMetrics {
  readonly uptime: number; // Percentage
  readonly errorRate: number; // Percentage
  readonly meanTimeBetweenFailures: number; // Hours
  readonly meanTimeToRecovery: number; // Minutes
  readonly reliabilityScore: number; // 0-1 scale
}

/**
 * Usage metrics
 */
export interface UsageMetrics {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly requestsPerUser: number;
  readonly usagePatterns: readonly UsagePattern[];
  readonly featureUtilization: readonly FeatureUtilization[];
}

/**
 * Usage pattern information
 */
export interface UsagePattern {
  readonly patternName: string;
  readonly frequency: number;
  readonly timeOfDay: string;
  readonly userDemographics: string;
  readonly performanceImpact: string;
}

/**
 * Feature utilization information
 */
export interface FeatureUtilization {
  readonly featureName: string;
  readonly utilizationRate: number; // Percentage
  readonly userAdoption: number; // Percentage
  readonly performanceImpact: 'positive' | 'neutral' | 'negative';
  readonly userSatisfaction: number; // 1-5 scale
}

// ============================================================================
// INTEGRATION VALIDATION
// ============================================================================

/**
 * Integration validation result
 */
export interface IntegrationValidationResult {
  readonly validationId: string;
  readonly validationTime: number;
  readonly overallStatus: 'passed' | 'warning' | 'failed' | 'error';
  readonly validationTests: readonly IntegrationTest[];
  readonly systemChecks: readonly SystemCheck[];
  readonly performanceValidation: PerformanceValidation;
  readonly compatibilityValidation: CompatibilityValidation;
  readonly summary: IntegrationValidationSummary;
}

/**
 * Integration test information
 */
export interface IntegrationTest {
  readonly testName: string;
  readonly testType: 'functional' | 'performance' | 'compatibility' | 'security';
  readonly status: 'passed' | 'failed' | 'skipped' | 'error';
  readonly duration: number; // Milliseconds
  readonly details: string;
  readonly artifacts: readonly TestArtifact[];
}

/**
 * Test artifact information
 */
export interface TestArtifact {
  readonly artifactType: 'log' | 'screenshot' | 'data' | 'report';
  readonly artifactName: string;
  readonly artifactSize: number; // Bytes
  readonly artifactPath: string;
  readonly description: string;
}

/**
 * System check information
 */
export interface SystemCheck {
  readonly checkName: string;
  readonly checkType: 'health' | 'configuration' | 'dependency' | 'resource';
  readonly status: 'healthy' | 'warning' | 'critical' | 'unavailable';
  readonly message: string;
  readonly recommendation?: string;
}

/**
 * Performance validation results
 */
export interface PerformanceValidation {
  readonly performanceSLA: PerformanceSLA;
  readonly actualPerformance: ActualPerformance;
  readonly complianceStatus: 'compliant' | 'warning' | 'non_compliant';
  readonly performanceIssues: readonly PerformanceIssue[];
}

/**
 * Performance SLA definition
 */
export interface PerformanceSLA {
  readonly maxResponseTimeMs: number;
  readonly minThroughputOps: number;
  readonly maxMemoryUsageKB: number;
  readonly maxCPUUtilization: number;
  readonly availabilityTarget: number; // Percentage
}

/**
 * Actual performance measurements
 */
export interface ActualPerformance {
  readonly averageResponseTimeMs: number;
  readonly actualThroughputOps: number;
  readonly actualMemoryUsageKB: number;
  readonly actualCPUUtilization: number;
  readonly actualAvailability: number; // Percentage
}

/**
 * Performance issue
 */
export interface PerformanceIssue {
  readonly issueType: 'latency' | 'throughput' | 'memory' | 'cpu' | 'availability';
  readonly severity: 'minor' | 'moderate' | 'significant' | 'critical';
  readonly description: string;
  readonly measuredValue: number;
  readonly expectedValue: number;
  readonly recommendation: string;
}

/**
 * Integration validation summary
 */
export interface IntegrationValidationSummary {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly skippedTests: number;
  readonly overallScore: number; // 0-100 scale
  readonly keyFindings: readonly string[];
  readonly criticalIssues: readonly string[];
  readonly recommendations: readonly string[];
  readonly nextSteps: readonly string[];
}

// ============================================================================
// FACTORY AND BUILDER INTERFACES
// ============================================================================

/**
 * Factory for creating integration components
 */
export interface IntegrationServiceFactory {
  createIntegrationService(config: IntegrationConfiguration): NAObjectIntegrationService;
  createEnhancedValidator(base: ValidatorAPI): EnhancedValidatorAPI;
  createCompatibilityLayer(mode: IntegrationMode): CompatibilityLayer;
  buildMigrationPlan(from: unknown, to: EnhancedValidationRules): MigrationPlan;
}

/**
 * Compatibility layer interface
 */
export interface CompatibilityLayer {
  translateLegacyRequest(request: LegacyValidationRequest): Promise<ValidationRequest>;
  translateResponse(response: EnhancedAnalysisResult): Promise<LegacyValidationResponse>;
  maintainBackwardCompatibility(result: AnalysisResult): Promise<AnalysisResult>;
}

/**
 * Migration plan interface
 */
export interface MigrationPlan {
  readonly planId: string;
  readonly migrationSteps: readonly MigrationStep[];
  readonly estimatedDuration: number; // Minutes
  readonly riskAssessment: MigrationRiskAssessment;
  readonly rollbackPlan: RollbackPlan;

  execute(): Promise<MigrationResult>;
  validate(): readonly string[];
  generateReport(): MigrationPlanReport;
}

/**
 * Migration step interface
 */
export interface MigrationStep {
  readonly stepId: string;
  readonly stepName: string;
  readonly stepType: 'preparation' | 'migration' | 'validation' | 'cleanup';
  readonly dependencies: readonly string[];
  readonly estimatedDuration: number; // Minutes

  execute(): Promise<StepResult>;
  rollback(): Promise<StepResult>;
  validate(): Promise<boolean>;
}

/**
 * Step result
 */
export interface StepResult {
  readonly success: boolean;
  readonly duration: number; // Milliseconds
  readonly output: string;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Migration risk assessment
 */
export interface MigrationRiskAssessment {
  readonly overallRisk: 'low' | 'medium' | 'high' | 'critical';
  readonly riskFactors: readonly MigrationRiskFactor[];
  readonly mitigationStrategies: readonly MitigationStrategy[];
  readonly contingencyPlans: readonly ContingencyPlan[];
}

/**
 * Migration risk factor
 */
export interface MigrationRiskFactor {
  readonly factorType: 'data_loss' | 'downtime' | 'functionality_loss' | 'performance_degradation';
  readonly probability: 'low' | 'medium' | 'high';
  readonly impact: 'minor' | 'moderate' | 'significant' | 'severe';
  readonly description: string;
  readonly mitigation: string;
}

/**
 * Mitigation strategy
 */
export interface MitigationStrategy {
  readonly strategyType: 'prevention' | 'detection' | 'recovery' | 'communication';
  readonly description: string;
  readonly implementation: readonly string[];
  readonly effectiveness: 'low' | 'medium' | 'high';
  readonly cost: 'low' | 'medium' | 'high';
}

/**
 * Contingency plan
 */
export interface ContingencyPlan {
  readonly planName: string;
  readonly triggerConditions: readonly string[];
  readonly actions: readonly string[];
  readonly responsibleParties: readonly string[];
  readonly timeframe: string;
}

/**
 * Rollback plan
 */
export interface RollbackPlan {
  readonly planId: string;
  readonly rollbackSteps: readonly RollbackStep[];
  readonly estimatedRollbackTime: number; // Minutes
  readonly rollbackRisks: readonly RollbackRisk[];

  execute(): Promise<RollbackResult>;
  validate(): readonly string[];
}

/**
 * Rollback result
 */
export interface RollbackResult {
  readonly success: boolean;
  readonly duration: number; // Milliseconds
  readonly stepsCompleted: number;
  readonly stepsFailed: number;
  readonly finalState: string;
  readonly issues: readonly string[];
}

/**
 * Migration plan report
 */
export interface MigrationPlanReport {
  readonly reportId: string;
  readonly planSummary: string;
  readonly riskAnalysis: string;
  readonly timelineEstimate: string;
  readonly resourceRequirements: readonly string[];
  readonly successCriteria: readonly string[];
  readonly approvalRequired: boolean;
}

// ============================================================================
// TYPE EXPORTS AND MAIN INTERFACE
// ============================================================================

export type {
  NAObjectIntegrationService,
  EnhancedValidatorAPI,
  EnhancedAnalysisResult,
  IntegrationConfiguration,
  MigrationResult,
  IntegrationMetrics,
  IntegrationValidationResult,
};

/**
 * Main integration module interface
 */
export interface NAObjectIntegrationModule {
  readonly service: NAObjectIntegrationService;
  readonly factory: IntegrationServiceFactory;
  readonly compatibility: CompatibilityLayer;
  readonly migration: {
    createPlan: (from: unknown, to: EnhancedValidationRules) => MigrationPlan;
    validateMigration: (plan: MigrationPlan) => Promise<readonly string[]>;
    executeMigration: (plan: MigrationPlan) => Promise<MigrationResult>;
    rollbackMigration: (plan: RollbackPlan) => Promise<RollbackResult>;
  };
  readonly monitoring: {
    collectMetrics: () => Promise<IntegrationMetrics>;
    validateIntegration: () => Promise<IntegrationValidationResult>;
    generateDiagnostics: () => Promise<IntegrationDiagnosticReport>;
  };
  readonly utilities: {
    createConfiguration: (mode: IntegrationMode) => IntegrationConfiguration;
    validateConfiguration: (config: IntegrationConfiguration) => readonly string[];
    optimizeConfiguration: (config: IntegrationConfiguration) => IntegrationConfiguration;
  };
}

/**
 * Default export for complete integration system
 */
export default NAObjectIntegrationModule;
