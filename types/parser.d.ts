// Type definitions for parser modules

declare module './src/parser/validator.js' {
  export interface SyntaxCompatibilityResult {
    success: boolean;
    hasSyntaxCompatibilityError: boolean;
    violations: Array<{
      line: number;
      column: number;
      severity: string;
      message: string;
      rule: string;
      category: string;
      details?: {
        deprecatedFunction?: string;
        modernEquivalent?: string;
        namespaceRequired?: boolean;
        functionName?: string;
        requiredNamespace?: string;
        modernForm?: string;
        upgradeRecommended?: boolean;
        currentVersion?: string;
        recommendedVersion?: string;
      };
    }>;
    metrics: {
      executionTime: number;
      deprecatedFunctionsFound: number;
      namespaceViolationsFound: number;
      versionCompatible: boolean;
    };
    details: any;
  }

  export function validateSyntaxCompatibility(code: string): SyntaxCompatibilityResult;
}

declare module './src/parser/index.js' {
  export interface ValidationResult {
    hasShortTitleError?: boolean;
    hasPrecisionError?: boolean;
    hasMaxBarsBackError?: boolean;
    hasDrawingObjectCountError?: boolean;
    violations: Array<{
      line: number;
      column: number;
      severity: string;
      message: string;
      rule: string;
      category: string;
    }>;
  }

  export function quickValidateShortTitle(code: string): Promise<ValidationResult>;
  export function quickValidatePrecision(code: string): Promise<ValidationResult>;
  export function quickValidateMaxBarsBack(code: string): Promise<ValidationResult>;
  export function quickValidateDrawingObjectCounts(code: string): Promise<ValidationResult>;
  export function quickValidateInputTypes(code: string): Promise<ValidationResult>;
  export function quickValidateFunctionSignatures(code: string): Promise<ValidationResult>;
}