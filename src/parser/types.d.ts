/**
 * TypeScript Type Definitions for Pine Script Parser
 *
 * This file demonstrates how the JavaScript architecture will transition
 * smoothly to TypeScript. All interfaces are designed to match the existing
 * JavaScript objects perfectly.
 *
 * These types can be gradually introduced as the codebase migrates to TypeScript.
 */

// Source location for error reporting and debugging
export interface SourceLocation {
  line: number; // Line number (1-based)
  column: number; // Column number (0-based)
  offset: number; // Character offset from start of file
  length: number; // Length of the token
}

// Base AST Node interface
export interface BaseASTNode {
  type: ASTNodeType;
  location: SourceLocation;
  children?: ASTNode[];
}

// AST Node types
export type ASTNodeType =
  | "Program"
  | "FunctionCall"
  | "Parameter"
  | "Literal"
  | "Identifier"
  | "Declaration";

// Program root node
export interface ProgramNode extends BaseASTNode {
  type: "Program";
  declarations: DeclarationNode[];
  statements: FunctionCallNode[];
  metadata: {
    version: string;
    scriptType?: "indicator" | "strategy" | "library";
  };
}

// Function call node
export interface FunctionCallNode extends BaseASTNode {
  type: "FunctionCall";
  name: string;
  parameters: ParameterNode[];
  namespace?: string;
  isBuiltIn: boolean;
}

// Parameter node
export interface ParameterNode extends BaseASTNode {
  type: "Parameter";
  name?: string;
  value: LiteralNode | IdentifierNode | FunctionCallNode;
  position: number;
  isNamed: boolean;
}

// Literal value node
export interface LiteralNode extends BaseASTNode {
  type: "Literal";
  value: string | number | boolean;
  dataType: "string" | "number" | "boolean" | "color";
  raw: string;
}

// Identifier node
export interface IdentifierNode extends BaseASTNode {
  type: "Identifier";
  name: string;
  namespace?: string;
  kind: "builtin" | "variable" | "function";
}

// Declaration node
export interface DeclarationNode extends BaseASTNode {
  type: "Declaration";
  name: string;
  value?: LiteralNode | IdentifierNode | FunctionCallNode;
  declarationType: "var" | "const";
  dataType?: string;
}

// Union type for all AST nodes
export type ASTNode =
  | ProgramNode
  | FunctionCallNode
  | ParameterNode
  | LiteralNode
  | IdentifierNode
  | DeclarationNode;

// Parse error
export interface ParseError {
  code: string;
  message: string;
  location: SourceLocation;
  severity: "error" | "warning";
  suggestion?: string;
}

// AST Generation Result
export interface ASTResult {
  ast: ProgramNode;
  errors: ParseError[];
  warnings: ParseError[];
  metrics: {
    parseTimeMs: number;
    nodeCount: number;
    maxDepth: number;
  };
}

// Token types
export type TokenType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "COLOR"
  | "IDENTIFIER"
  | "KEYWORD"
  | "ASSIGN"
  | "ARITHMETIC"
  | "COMPARISON"
  | "LOGICAL"
  | "LPAREN"
  | "RPAREN"
  | "LBRACKET"
  | "RBRACKET"
  | "COMMA"
  | "DOT"
  | "QUESTION"
  | "COLON"
  | "NEWLINE"
  | "INDENT"
  | "DEDENT"
  | "COMMENT"
  | "EOF"
  | "ERROR";

// Token structure
export interface Token {
  type: TokenType;
  value: string;
  location: SourceLocation;
  metadata?: any;
}

// Lexer state
export interface LexerState {
  source: string;
  position: number;
  line: number;
  column: number;
  indentLevel: number;
  indentStack: number[];
  atLineStart: boolean;
}

// Parser state
export interface ParserState {
  tokens: Token[];
  current: number;
  errors: ParseError[];
  warnings: ParseError[];
  startTime: number;
}

// Validation violation
export interface ValidationViolation {
  line: number;
  column: number;
  rule: string;
  severity: "error" | "warning" | "suggestion";
  message: string;
  category: string;
  suggested_fix?: string;
  details?: {
    deprecatedFunction?: string;
    modernEquivalent?: string;
    namespaceRequired?: boolean;
    modernForm?: string;
    functionName?: string;
    upgradeRecommended?: boolean;
    currentVersion?: number;
    recommendedVersion?: number;
    requiredNamespace?: string;
  };
}

// Validation result
export interface ValidationResult {
  violations: ValidationViolation[];
  warnings: string[];
  metrics: {
    validationTimeMs: number;
    functionsAnalyzed: number;
  };
}

// Function call analysis result
export interface FunctionCallAnalysis {
  name: string;
  namespace?: string;
  parameters: Record<string, any>;
  location: SourceLocation;
  isBuiltIn: boolean;
}

// Parameter extraction result
export interface ParameterExtractionResult {
  functionCalls: FunctionCallAnalysis[];
  errors: ParseError[];
  metrics: {
    parseTimeMs: number;
    nodeCount: number;
    maxDepth: number;
  };
}

// Analysis result for MCP integration
export interface AnalysisResult {
  success: boolean;
  violations: ValidationViolation[];
  functionCalls: FunctionCallAnalysis[];
  metrics: {
    totalTimeMs: number;
    parseTimeMs: number;
    functionsFound: number;
    errorsFound: number;
  };
  errors: string[];
}

// Error handling result pattern
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Type guards
export interface TypeGuards {
  isASTNode(node: any): node is BaseASTNode;
  isFunctionCallNode(node: any): node is FunctionCallNode;
  isParameterNode(node: any): node is ParameterNode;
  isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T };
  isError<T, E>(result: Result<T, E>): result is { success: false; error: E };
}

// Factory functions
export interface ASTFactory {
  createFunctionCallNode(
    name: string,
    parameters: ParameterNode[],
    location: SourceLocation,
    namespace?: string
  ): FunctionCallNode;

  createParameterNode(
    value: LiteralNode | IdentifierNode | FunctionCallNode,
    location: SourceLocation,
    name?: string,
    position?: number
  ): ParameterNode;

  createLiteralNode(
    value: string | number | boolean,
    location: SourceLocation,
    raw: string
  ): LiteralNode;

  createSourceLocation(
    line: number,
    column: number,
    offset: number,
    length: number
  ): SourceLocation;
}

// Parser API
export interface ParserAPI {
  parseScript(source: string): ASTResult;
  extractFunctionParameters(source: string): ParameterExtractionResult;
  tokenize(source: string): Token[];
  createLexer(source: string): LexerState;
}

// Validator API
export interface ValidatorAPI {
  validateParameters(source: string, rules?: any): ValidationResult;
  validateShortTitle(source: string): ValidationResult;
  loadValidationRules(rules: any): void;
}

// Integration API
export interface IntegrationAPI {
  analyzePineScript(source: string, rules?: any): Promise<AnalysisResult>;
  quickValidateShortTitle(source: string): Promise<AnalysisResult>;
  quickValidateInputTypes(source: string): Promise<AnalysisResult>;
  extractFunctionCalls(
    line: string
  ): Array<{ name: string; parameters: string[]; position: number }>;
  inferParameterTypes(paramValue: string): string;
  getExpectedTypes(functionName: string): {
    params: Array<{ name: string; type: string; required: boolean }>;
  };
  compareTypes(
    expectedType: string,
    actualType: string
  ): { isValid: boolean; reason?: string; expected?: string; actual?: string };
  initializeParser(rules: any): Promise<boolean>;
  getParserStatus(): ParserStatus;
}

// Parser status information
export interface ParserStatus {
  version: string;
  capabilities: string[];
  performance: {
    targetParseTime: string;
    targetValidationTime: string;
    memoryEfficient: boolean;
    streamingSupport: boolean;
  };
  integration: {
    mcpServerCompatible: boolean;
    typescriptReady: boolean;
    testFramework: string;
  };
}

// Performance monitoring
export interface PerformanceMetrics {
  parseTimeMs: number;
  validationTimeMs: number;
  totalTimeMs: number;
  nodeCount: number;
  functionsAnalyzed: number;
  memoryUsageKB?: number;
}

// Error categories and codes for strict typing
export const ERROR_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
} as const;

export const ERROR_CATEGORIES = {
  LEXICAL: "lexical_error",
  SYNTAX: "syntax_error",
  SEMANTIC: "semantic_error",
  VALIDATION: "validation_error",
  PERFORMANCE: "performance_error",
  INTEGRATION: "integration_error",
} as const;

export const AST_NODE_TYPES = {
  PROGRAM: "Program",
  FUNCTION_CALL: "FunctionCall",
  PARAMETER: "Parameter",
  LITERAL: "Literal",
  IDENTIFIER: "Identifier",
  DECLARATION: "Declaration",
} as const;

export const TOKEN_TYPES = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  COLOR: "COLOR",
  IDENTIFIER: "IDENTIFIER",
  KEYWORD: "KEYWORD",
  ASSIGN: "ASSIGN",
  ARITHMETIC: "ARITHMETIC",
  COMPARISON: "COMPARISON",
  LOGICAL: "LOGICAL",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  COMMA: "COMMA",
  DOT: "DOT",
  QUESTION: "QUESTION",
  COLON: "COLON",
  NEWLINE: "NEWLINE",
  INDENT: "INDENT",
  DEDENT: "DEDENT",
  COMMENT: "COMMENT",
  EOF: "EOF",
  ERROR: "ERROR",
} as const;

// Validation rule types for type safety
export interface ValidationConstraints {
  maxLength?: number;
  minLength?: number;
  type?: "string" | "number" | "integer" | "boolean";
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  errorCode: string;
  errorMessage: string;
  severity: "error" | "warning";
  category: string;
}

export interface ArgumentConstraints {
  [parameterName: string]: {
    validation_constraints: ValidationConstraints;
  };
}

export interface FunctionValidationRules {
  [functionId: string]: {
    argumentConstraints: ArgumentConstraints;
  };
}

export interface ValidationRules {
  version: string;
  description: string;
  functionValidationRules: FunctionValidationRules;
  errorCodeDefinitions: Record<
    string,
    {
      description: string;
      severity: string;
      category: string;
      documentation: string;
    }
  >;
}

// Export all types for easy importing
export * from "./types";
