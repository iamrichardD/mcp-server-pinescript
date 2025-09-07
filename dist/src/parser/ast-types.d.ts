/**
 * AST Node Type Definitions
 *
 * TypeScript-ready interfaces defined as JSDoc-annotated JavaScript objects.
 * This module provides the foundation for Pine Script AST generation with
 * clear type patterns that will transition smoothly to TypeScript.
 *
 * Performance target: <15ms AST generation for typical Pine Script files
 * Integration point: index.js:577-579 validation system
 */
/**
 * Base AST Node interface
 * @typedef {Object} BaseASTNode
 * @property {'Program'|'FunctionCall'|'Parameter'|'Literal'|'Identifier'|'Declaration'} type - Node type
 * @property {SourceLocation} location - Source code location
 * @property {ASTNode[]} [children] - Child nodes (if applicable)
 */
/**
 * Source location for error reporting and debugging
 * @typedef {Object} SourceLocation
 * @property {number} line - Line number (1-based)
 * @property {number} column - Column number (0-based)
 * @property {number} offset - Character offset from start of file
 * @property {number} length - Length of the token
 */
/**
 * Program root node - represents the entire Pine Script file
 * @typedef {Object} ProgramNode
 * @property {'Program'} type
 * @property {SourceLocation} location
 * @property {DeclarationNode[]} declarations - Top-level declarations
 * @property {FunctionCallNode[]} statements - Function calls and expressions
 * @property {Object} metadata - File-level metadata
 * @property {string} metadata.version - Pine Script version detected
 * @property {'indicator'|'strategy'|'library'} [metadata.scriptType] - Script type if declared
 */
/**
 * Function call node - critical for parameter extraction
 * @typedef {Object} FunctionCallNode
 * @property {'FunctionCall'} type
 * @property {SourceLocation} location
 * @property {string} name - Function name (e.g., 'indicator', 'strategy', 'ta.sma')
 * @property {ParameterNode[]} parameters - Function parameters
 * @property {string} [namespace] - Namespace if applicable (e.g., 'ta' in 'ta.sma')
 * @property {boolean} isBuiltIn - Whether this is a built-in Pine Script function
 */
/**
 * Parameter node - supports both positional and named parameters
 * @typedef {Object} ParameterNode
 * @property {'Parameter'} type
 * @property {SourceLocation} location
 * @property {string} [name] - Parameter name (for named parameters)
 * @property {LiteralNode|IdentifierNode|FunctionCallNode} value - Parameter value
 * @property {number} position - Position in parameter list (0-based)
 * @property {boolean} isNamed - Whether this is a named parameter
 */
/**
 * Literal value node - strings, numbers, booleans
 * @typedef {Object} LiteralNode
 * @property {'Literal'} type
 * @property {SourceLocation} location
 * @property {string|number|boolean} value - The literal value
 * @property {'string'|'number'|'boolean'|'color'} dataType - Pine Script data type
 * @property {string} raw - Raw source text
 */
/**
 * Identifier node - variable names and references
 * @typedef {Object} IdentifierNode
 * @property {'Identifier'} type
 * @property {SourceLocation} location
 * @property {string} name - Identifier name
 * @property {string} [namespace] - Namespace if applicable
 * @property {'builtin'|'variable'|'function'} kind - Identifier kind
 */
/**
 * Declaration node - variable declarations and assignments
 * @typedef {Object} DeclarationNode
 * @property {'Declaration'} type
 * @property {SourceLocation} location
 * @property {string} name - Variable name
 * @property {LiteralNode|IdentifierNode|FunctionCallNode} [value] - Initial value
 * @property {'var'|'const'} declarationType - Declaration type
 * @property {string} [dataType] - Inferred or explicit data type
 */
/**
 * Parse error for graceful error handling
 * @typedef {Object} ParseError
 * @property {string} code - Error code (e.g., 'SYNTAX_ERROR', 'UNEXPECTED_TOKEN')
 * @property {string} message - Human-readable error message
 * @property {SourceLocation} location - Error location
 * @property {'error'|'warning'} severity - Error severity
 * @property {string} [suggestion] - Suggested fix if available
 */
/**
 * AST Generation Result - wraps the AST with metadata and errors
 * @typedef {Object} ASTResult
 * @property {ProgramNode} ast - The generated AST
 * @property {ParseError[]} errors - Parse errors encountered
 * @property {ParseError[]} warnings - Parse warnings
 * @property {Object} metrics - Performance metrics
 * @property {number} metrics.parseTimeMs - Parse time in milliseconds
 * @property {number} metrics.nodeCount - Total number of AST nodes
 * @property {number} metrics.maxDepth - Maximum AST depth
 */
/**
 * Type guard for AST nodes
 * @param {any} node - Object to check
 * @returns {node is BaseASTNode} - Type predicate
 */
export function isASTNode(node: any): node is BaseASTNode;
/**
 * Type guard for function call nodes
 * @param {any} node - Object to check
 * @returns {node is FunctionCallNode} - Type predicate
 */
export function isFunctionCallNode(node: any): node is FunctionCallNode;
/**
 * Type guard for parameter nodes
 * @param {any} node - Object to check
 * @returns {node is ParameterNode} - Type predicate
 */
export function isParameterNode(node: any): node is ParameterNode;
/**
 * Factory functions for creating AST nodes with proper typing
 */
/**
 * Create a function call node
 * @param {string} name - Function name
 * @param {ParameterNode[]} parameters - Function parameters
 * @param {SourceLocation} location - Source location
 * @param {string} [namespace] - Namespace if applicable
 * @returns {FunctionCallNode} - Function call node
 */
export function createFunctionCallNode(name: string, parameters: ParameterNode[], location: SourceLocation, namespace?: string): FunctionCallNode;
/**
 * Create a parameter node
 * @param {LiteralNode|IdentifierNode|FunctionCallNode} value - Parameter value
 * @param {SourceLocation} location - Source location
 * @param {string} [name] - Parameter name for named parameters
 * @param {number} position - Parameter position
 * @returns {ParameterNode} - Parameter node
 */
export function createParameterNode(value: LiteralNode | IdentifierNode | FunctionCallNode, location: SourceLocation, name?: string, position?: number): ParameterNode;
/**
 * Create a literal node
 * @param {string|number|boolean} value - Literal value
 * @param {SourceLocation} location - Source location
 * @param {string} raw - Raw source text
 * @returns {LiteralNode} - Literal node
 */
export function createLiteralNode(value: string | number | boolean, location: SourceLocation, raw: string): LiteralNode;
/**
 * Create source location object
 * @param {number} line - Line number (1-based)
 * @param {number} column - Column number (0-based)
 * @param {number} offset - Character offset
 * @param {number} length - Token length
 * @returns {SourceLocation} - Source location
 */
export function createSourceLocation(line: number, column: number, offset: number, length: number): SourceLocation;
export namespace AST_NODE_TYPES {
    let PROGRAM: string;
    let FUNCTION_CALL: string;
    let PARAMETER: string;
    let LITERAL: string;
    let IDENTIFIER: string;
    let DECLARATION: string;
}
export namespace DATA_TYPES {
    let STRING: string;
    let NUMBER: string;
    let BOOLEAN: string;
    let COLOR: string;
    let UNKNOWN: string;
}
/**
 * Base AST Node interface
 */
export type BaseASTNode = {
    /**
     * - Node type
     */
    type: "Program" | "FunctionCall" | "Parameter" | "Literal" | "Identifier" | "Declaration";
    /**
     * - Source code location
     */
    location: SourceLocation;
    /**
     * - Child nodes (if applicable)
     */
    children?: ASTNode[];
};
/**
 * Source location for error reporting and debugging
 */
export type SourceLocation = {
    /**
     * - Line number (1-based)
     */
    line: number;
    /**
     * - Column number (0-based)
     */
    column: number;
    /**
     * - Character offset from start of file
     */
    offset: number;
    /**
     * - Length of the token
     */
    length: number;
};
/**
 * Program root node - represents the entire Pine Script file
 */
export type ProgramNode = {
    type: "Program";
    location: SourceLocation;
    /**
     * - Top-level declarations
     */
    declarations: DeclarationNode[];
    /**
     * - Function calls and expressions
     */
    statements: FunctionCallNode[];
    /**
     * - File-level metadata
     */
    metadata: {
        version: string;
        scriptType?: "indicator" | "strategy" | "library" | undefined;
    };
};
/**
 * Function call node - critical for parameter extraction
 */
export type FunctionCallNode = {
    type: "FunctionCall";
    location: SourceLocation;
    /**
     * - Function name (e.g., 'indicator', 'strategy', 'ta.sma')
     */
    name: string;
    /**
     * - Function parameters
     */
    parameters: ParameterNode[];
    /**
     * - Namespace if applicable (e.g., 'ta' in 'ta.sma')
     */
    namespace?: string;
    /**
     * - Whether this is a built-in Pine Script function
     */
    isBuiltIn: boolean;
};
/**
 * Parameter node - supports both positional and named parameters
 */
export type ParameterNode = {
    type: "Parameter";
    location: SourceLocation;
    /**
     * - Parameter name (for named parameters)
     */
    name?: string;
    /**
     * - Parameter value
     */
    value: LiteralNode | IdentifierNode | FunctionCallNode;
    /**
     * - Position in parameter list (0-based)
     */
    position: number;
    /**
     * - Whether this is a named parameter
     */
    isNamed: boolean;
};
/**
 * Literal value node - strings, numbers, booleans
 */
export type LiteralNode = {
    type: "Literal";
    location: SourceLocation;
    /**
     * - The literal value
     */
    value: string | number | boolean;
    /**
     * - Pine Script data type
     */
    dataType: "string" | "number" | "boolean" | "color";
    /**
     * - Raw source text
     */
    raw: string;
};
/**
 * Identifier node - variable names and references
 */
export type IdentifierNode = {
    type: "Identifier";
    location: SourceLocation;
    /**
     * - Identifier name
     */
    name: string;
    /**
     * - Namespace if applicable
     */
    namespace?: string;
    /**
     * - Identifier kind
     */
    kind: "builtin" | "variable" | "function";
};
/**
 * Declaration node - variable declarations and assignments
 */
export type DeclarationNode = {
    type: "Declaration";
    location: SourceLocation;
    /**
     * - Variable name
     */
    name: string;
    /**
     * - Initial value
     */
    value?: LiteralNode | IdentifierNode | FunctionCallNode;
    /**
     * - Declaration type
     */
    declarationType: "var" | "const";
    /**
     * - Inferred or explicit data type
     */
    dataType?: string;
};
/**
 * Parse error for graceful error handling
 */
export type ParseError = {
    /**
     * - Error code (e.g., 'SYNTAX_ERROR', 'UNEXPECTED_TOKEN')
     */
    code: string;
    /**
     * - Human-readable error message
     */
    message: string;
    /**
     * - Error location
     */
    location: SourceLocation;
    /**
     * - Error severity
     */
    severity: "error" | "warning";
    /**
     * - Suggested fix if available
     */
    suggestion?: string;
};
/**
 * AST Generation Result - wraps the AST with metadata and errors
 */
export type ASTResult = {
    /**
     * - The generated AST
     */
    ast: ProgramNode;
    /**
     * - Parse errors encountered
     */
    errors: ParseError[];
    /**
     * - Parse warnings
     */
    warnings: ParseError[];
    /**
     * - Performance metrics
     */
    metrics: {
        parseTimeMs: number;
        nodeCount: number;
        maxDepth: number;
    };
};
