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

// Type validation helpers for runtime type checking
// These will become proper TypeScript type guards

/**
 * Type guard for AST nodes
 * @param {any} node - Object to check
 * @returns {node is BaseASTNode} - Type predicate
 */
export function isASTNode(node) {
  return node && 
         typeof node === 'object' && 
         typeof node.type === 'string' && 
         node.location &&
         typeof node.location.line === 'number' &&
         typeof node.location.column === 'number';
}

/**
 * Type guard for function call nodes
 * @param {any} node - Object to check
 * @returns {node is FunctionCallNode} - Type predicate
 */
export function isFunctionCallNode(node) {
  return isASTNode(node) && 
         node.type === 'FunctionCall' &&
         typeof node.name === 'string' &&
         Array.isArray(node.parameters);
}

/**
 * Type guard for parameter nodes
 * @param {any} node - Object to check
 * @returns {node is ParameterNode} - Type predicate
 */
export function isParameterNode(node) {
  return isASTNode(node) && 
         node.type === AST_NODE_TYPES.PARAMETER &&
         node.value &&
         typeof node.position === 'number' &&
         typeof node.isNamed === 'boolean';
}

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
export function createFunctionCallNode(name, parameters, location, namespace) {
  return {
    type: 'FunctionCall',
    name,
    parameters: parameters || [],
    location,
    namespace,
    isBuiltIn: isBuiltInFunction(name, namespace)
  };
}

/**
 * Create a parameter node
 * @param {LiteralNode|IdentifierNode|FunctionCallNode} value - Parameter value
 * @param {SourceLocation} location - Source location
 * @param {string} [name] - Parameter name for named parameters
 * @param {number} position - Parameter position
 * @returns {ParameterNode} - Parameter node
 */
export function createParameterNode(value, location, name, position) {
  return {
    type: AST_NODE_TYPES.PARAMETER,
    value,
    location,
    name,
    position,
    isNamed: Boolean(name)
  };
}

/**
 * Create a literal node
 * @param {string|number|boolean} value - Literal value
 * @param {SourceLocation} location - Source location
 * @param {string} raw - Raw source text
 * @returns {LiteralNode} - Literal node
 */
export function createLiteralNode(value, location, raw) {
  let dataType;
  if (typeof value === 'string') {
    dataType = 'string';
  } else if (typeof value === 'number') {
    dataType = 'number';
  } else if (typeof value === 'boolean') {
    dataType = 'boolean';
  } else {
    dataType = 'unknown';
  }

  return {
    type: 'Literal',
    value,
    location,
    raw,
    dataType
  };
}

/**
 * Create source location object
 * @param {number} line - Line number (1-based)
 * @param {number} column - Column number (0-based)
 * @param {number} offset - Character offset
 * @param {number} length - Token length
 * @returns {SourceLocation} - Source location
 */
export function createSourceLocation(line, column, offset, length) {
  return { line, column, offset, length };
}

/**
 * Check if a function is a built-in Pine Script function
 * @param {string} name - Function name
 * @param {string} [namespace] - Namespace
 * @returns {boolean} - Whether function is built-in
 */
function isBuiltInFunction(name, namespace) {
  // Common built-in functions - this would be populated from language-reference.json
  const builtIns = new Set([
    'indicator', 'strategy', 'library',
    'plot', 'plotshape', 'plotchar', 'plotbar', 'plotcandle',
    'hline', 'fill', 'bgcolor',
    'var', 'varip',
    'if', 'for', 'while', 'switch'
  ]);

  const namespacedBuiltIns = new Set([
    'ta.sma', 'ta.ema', 'ta.rsi', 'ta.macd', 'ta.stoch',
    'math.abs', 'math.max', 'math.min', 'math.round',
    'str.tostring', 'str.tonumber', 'str.length',
    'array.new', 'array.push', 'array.get',
    'matrix.new', 'matrix.set', 'matrix.get'
  ]);

  if (namespace) {
    return namespacedBuiltIns.has(`${namespace}.${name}`);
  }
  
  return builtIns.has(name);
}

// Export type information for runtime introspection
export const AST_NODE_TYPES = {
  PROGRAM: 'Program',
  FUNCTION_CALL: 'FunctionCall', 
  PARAMETER: 'Parameter',
  LITERAL: 'Literal',
  IDENTIFIER: 'Identifier',
  DECLARATION: 'Declaration'
};

export const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  COLOR: 'color',
  UNKNOWN: 'unknown'
};