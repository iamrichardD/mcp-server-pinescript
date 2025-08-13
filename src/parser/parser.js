/**
 * Pine Script Parser
 * 
 * Transforms tokens into an Abstract Syntax Tree (AST) for Pine Script code.
 * Focuses on function call parsing for parameter extraction and validation.
 * 
 * Performance target: <10ms parsing for typical Pine Script files  
 * Integration: Works with existing MCP server validation at index.js:577-579
 */

import { tokenize, TOKEN_TYPES } from './lexer.js';
import { 
  createFunctionCallNode, 
  createParameterNode, 
  createLiteralNode,
  createSourceLocation,
  AST_NODE_TYPES 
} from './ast-types.js';

/**
 * Parser state for tracking tokens and position
 * @typedef {Object} ParserState
 * @property {Token[]} tokens - Array of tokens from lexer
 * @property {number} current - Current token index
 * @property {ParseError[]} errors - Parse errors encountered
 * @property {ParseError[]} warnings - Parse warnings
 * @property {number} startTime - Parse start time for metrics
 */

/**
 * Parse Pine Script source code into an AST
 * @param {string} source - Pine Script source code
 * @returns {import('./ast-types.js').ASTResult} - AST result with errors and metrics
 */
export function parseScript(source) {
  const startTime = performance.now();
  const tokens = tokenize(source);
  const parser = createParser(tokens);
  
  const ast = {
    type: AST_NODE_TYPES.PROGRAM,
    location: createSourceLocation(1, 0, 0, source.length),
    body: [], // Match test expectations
    declarations: [],
    statements: [], // Keep for backward compatibility
    metadata: {
      version: detectPineScriptVersion(source),
      scriptType: null
    }
  };
  
  // Parse top-level statements
  while (!isAtEnd(parser)) {
    try {
      const stmt = parseStatement(parser);
      if (stmt) {
        // Add to body for test compatibility
        ast.body.push(stmt);
        
        if (stmt.type === AST_NODE_TYPES.FUNCTION_CALL) {
          ast.statements.push(stmt);
          
          // Detect script type from special functions
          if (stmt.name === 'indicator' || stmt.name === 'strategy' || stmt.name === 'library') {
            ast.metadata.scriptType = stmt.name;
          }
        } else if (stmt.type === AST_NODE_TYPES.DECLARATION) {
          ast.declarations.push(stmt);
        }
      }
    } catch (error) {
      // Graceful error handling - record error and continue
      parser.errors.push({
        code: 'PARSE_ERROR',
        message: error.message,
        location: getCurrentLocation(parser),
        severity: 'error'
      });
      
      // Skip to next statement
      synchronize(parser);
    }
  }
  
  const endTime = performance.now();
  const nodeCount = countNodes(ast);
  
  return {
    success: parser.errors.length === 0,
    ast,
    errors: parser.errors,
    warnings: parser.warnings,
    metrics: {
      parseTimeMs: endTime - startTime,
      nodeCount,
      maxDepth: calculateMaxDepth(ast)
    }
  };
}

/**
 * Extract function parameters for validation
 * Specialized function for SHORT_TITLE_TOO_LONG and similar validations
 * @param {string} source - Pine Script source code
 * @returns {Object} - Extracted function calls and parameters
 */
export function extractFunctionParameters(source) {
  const result = parseScript(source);
  const functionCalls = [];
  
  // Extract function calls with their parameters
  // Process both direct function calls and function calls within assignments
  for (const stmt of result.ast.statements) {
    if (stmt.type === AST_NODE_TYPES.FUNCTION_CALL) {
      addFunctionCall(stmt, functionCalls);
    }
  }
  
  // Also check the body for assignments and other statements
  for (const stmt of result.ast.body) {
    if (stmt && Array.isArray(stmt)) {
      // Handle assignments that return arrays of function calls
      for (const funcCall of stmt) {
        if (funcCall && funcCall.type === AST_NODE_TYPES.FUNCTION_CALL) {
          addFunctionCall(funcCall, functionCalls);
          // Recursively extract nested function calls
          extractNestedFunctionCalls(funcCall, functionCalls);
        }
      }
    } else if (stmt && stmt.type === AST_NODE_TYPES.FUNCTION_CALL) {
      addFunctionCall(stmt, functionCalls);
      // Recursively extract nested function calls
      extractNestedFunctionCalls(stmt, functionCalls);
    }
  }
  
  // Remove duplicates based on location
  const uniqueFunctionCalls = [];
  const seenLocations = new Set();
  
  for (const funcCall of functionCalls) {
    const locationKey = `${funcCall.location.line}:${funcCall.location.column}:${funcCall.name}`;
    if (!seenLocations.has(locationKey)) {
      seenLocations.add(locationKey);
      uniqueFunctionCalls.push(funcCall);
    }
  }
  
  return {
    success: result.success,
    functionCalls: uniqueFunctionCalls,
    errors: result.errors,
    metrics: result.metrics
  };
}

/**
 * Create a new parser instance
 * @param {Token[]} tokens - Tokens from lexer
 * @returns {ParserState} - Parser state
 */
function createParser(tokens) {
  return {
    tokens,
    current: 0,
    errors: [],
    warnings: [],
    startTime: performance.now()
  };
}

/**
 * Parse a statement (function call, declaration, etc.)
 * @param {ParserState} parser - Parser state
 * @returns {Object|null} - AST node or null
 */
function parseStatement(parser) {
  skipNewlines(parser);
  
  if (isAtEnd(parser)) {
    return null;
  }
  
  // Skip comments
  if (check(parser, TOKEN_TYPES.COMMENT)) {
    advance(parser);
    return null;
  }
  
  // Check for assignments and function calls
  if (check(parser, TOKEN_TYPES.IDENTIFIER) || check(parser, TOKEN_TYPES.KEYWORD)) {
    const startToken = peek(parser);
    
    // Look ahead for assignment pattern: identifier '='
    if (peekNext(parser) && peekNext(parser).type === TOKEN_TYPES.ASSIGN) {
      return parseAssignment(parser);
    }
    
    // Look ahead for function call pattern: identifier '('
    if (peekNext(parser) && peekNext(parser).type === TOKEN_TYPES.LPAREN) {
      return parseFunctionCall(parser);
    }
    
    // Look ahead for namespaced function call: identifier '.' identifier '('
    if (peekNext(parser) && peekNext(parser).type === TOKEN_TYPES.DOT) {
      const namespaceToken = advance(parser); // consume namespace
      advance(parser); // consume dot
      
      if (check(parser, TOKEN_TYPES.IDENTIFIER) && 
          peekNext(parser) && peekNext(parser).type === TOKEN_TYPES.LPAREN) {
        return parseNamespacedFunctionCall(parser, namespaceToken.value);
      }
    }
  }
  
  // Skip unrecognized tokens
  advance(parser);
  return null;
}

/**
 * Parse a function call
 * @param {ParserState} parser - Parser state
 * @returns {import('./ast-types.js').FunctionCallNode} - Function call node
 */
function parseFunctionCall(parser) {
  const nameToken = advance(parser); // consume function name
  const location = nameToken.location;
  
  consume(parser, TOKEN_TYPES.LPAREN, "Expected '(' after function name");
  
  const parameters = [];
  let position = 0;
  
  while (!check(parser, TOKEN_TYPES.RPAREN) && !isAtEnd(parser)) {
    // Skip newlines at the beginning of each parameter
    skipNewlines(parser);
    
    const param = parseParameter(parser, position);
    if (param) {
      parameters.push(param);
      position++;
    }
    
    // Skip newlines and whitespace before checking for comma or closing paren
    skipNewlines(parser);
    
    if (!check(parser, TOKEN_TYPES.RPAREN)) {
      consume(parser, TOKEN_TYPES.COMMA, "Expected ',' between parameters");
      // Skip newlines after comma as well
      skipNewlines(parser);
    }
  }
  
  consume(parser, TOKEN_TYPES.RPAREN, "Expected ')' after parameters");
  
  return createFunctionCallNode(nameToken.value, parameters, location);
}

/**
 * Parse a namespaced function call (e.g., ta.sma())
 * @param {ParserState} parser - Parser state
 * @param {string} namespace - Namespace name
 * @returns {import('./ast-types.js').FunctionCallNode} - Function call node
 */
function parseNamespacedFunctionCall(parser, namespace) {
  const nameToken = advance(parser); // consume function name
  const location = nameToken.location;
  
  consume(parser, TOKEN_TYPES.LPAREN, "Expected '(' after function name");
  
  const parameters = [];
  let position = 0;
  
  while (!check(parser, TOKEN_TYPES.RPAREN) && !isAtEnd(parser)) {
    // Skip newlines at the beginning of each parameter
    skipNewlines(parser);
    
    const param = parseParameter(parser, position);
    if (param) {
      parameters.push(param);
      position++;
    }
    
    // Skip newlines and whitespace before checking for comma or closing paren
    skipNewlines(parser);
    
    if (!check(parser, TOKEN_TYPES.RPAREN)) {
      consume(parser, TOKEN_TYPES.COMMA, "Expected ',' between parameters");
      // Skip newlines after comma as well
      skipNewlines(parser);
    }
  }
  
  consume(parser, TOKEN_TYPES.RPAREN, "Expected ')' after parameters");
  
  return createFunctionCallNode(nameToken.value, parameters, location, namespace);
}

/**
 * Recursively extract nested function calls from a function call's parameters
 * @param {Object} funcCall - Function call AST node
 * @param {Array} functionCalls - Array to add function calls to
 */
function extractNestedFunctionCalls(funcCall, functionCalls) {
  if (!funcCall.parameters) return;
  
  for (const param of funcCall.parameters) {
    if (param.value && param.value.type === AST_NODE_TYPES.FUNCTION_CALL) {
      addFunctionCall(param.value, functionCalls);
      // Recursively check this nested function call for more nesting
      extractNestedFunctionCalls(param.value, functionCalls);
    }
  }
}

/**
 * Add a function call to the function calls array with parameter processing
 * @param {Object} stmt - Function call AST node
 * @param {Array} functionCalls - Array to add the function call to
 */
function addFunctionCall(stmt, functionCalls) {
  const params = {};
  
  // Process both positional and named parameters
  for (const param of stmt.parameters) {
    if (param.isNamed && param.name) {
      params[param.name] = extractParameterValue(param.value);
    } else {
      // For positional parameters, use index
      params[`_${param.position}`] = extractParameterValue(param.value);
      
      // Special handling for strategy function: second positional parameter is shorttitle
      if (stmt.name === 'strategy' && param.position === 1) {
        params['shorttitle'] = extractParameterValue(param.value);
      }
    }
  }
  
  functionCalls.push({
    name: stmt.name,
    namespace: stmt.namespace,
    parameters: params,
    location: stmt.location,
    isBuiltIn: stmt.isBuiltIn
  });
}

/**
 * Parse an assignment statement
 * @param {ParserState} parser - Parser state  
 * @returns {Array} - Array of function call nodes found in the assignment
 */
function parseAssignment(parser) {
  const varName = advance(parser); // consume variable name
  advance(parser); // consume '='
  
  // Parse the right-hand side expression which may contain function calls
  const expr = parseExpression(parser);
  
  // Extract function calls from the expression
  const functionCalls = extractFunctionCallsFromExpression(expr);
  
  // Return all function calls found in the assignment
  return functionCalls;
}

/**
 * Extract function calls from an expression recursively
 * @param {Object} expr - Expression node
 * @returns {Array} - Array of function call nodes
 */
function extractFunctionCallsFromExpression(expr) {
  const functionCalls = [];
  
  if (!expr) return functionCalls;
  
  if (expr.type === AST_NODE_TYPES.FUNCTION_CALL) {
    functionCalls.push(expr);
    
    // Also check parameters for nested function calls
    if (expr.parameters) {
      for (const param of expr.parameters) {
        if (param.value) {
          functionCalls.push(...extractFunctionCallsFromExpression(param.value));
        }
      }
    }
  }
  
  return functionCalls;
}

/**
 * Parse a function parameter
 * @param {ParserState} parser - Parser state
 * @param {number} position - Parameter position
 * @returns {import('./ast-types.js').ParameterNode} - Parameter node
 */
function parseParameter(parser, position) {
  const startLocation = getCurrentLocation(parser);
  
  // Check for named parameter: (identifier or keyword) '='
  if ((check(parser, TOKEN_TYPES.IDENTIFIER) || check(parser, TOKEN_TYPES.KEYWORD)) && 
      peekNext(parser) && peekNext(parser).type === TOKEN_TYPES.ASSIGN) {
    const nameToken = advance(parser); // consume parameter name
    advance(parser); // consume '='
    
    const value = parseExpression(parser);
    return createParameterNode(value, startLocation, nameToken.value, position);
  }
  
  // Positional parameter
  const value = parseExpression(parser);
  return createParameterNode(value, startLocation, null, position);
}

/**
 * Parse an expression (simplified for function parameters)
 * @param {ParserState} parser - Parser state
 * @returns {Object} - Expression node
 */
function parseExpression(parser) {
  // Handle literals
  if (check(parser, TOKEN_TYPES.STRING)) {
    const token = advance(parser);
    return createLiteralNode(token.value, token.location, `"${token.value}"`);
  }
  
  if (check(parser, TOKEN_TYPES.NUMBER)) {
    const token = advance(parser);
    const value = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value);
    return createLiteralNode(value, token.location, token.value);
  }
  
  if (check(parser, TOKEN_TYPES.BOOLEAN)) {
    const token = advance(parser);
    const value = token.value === 'true';
    return createLiteralNode(value, token.location, token.value);
  }
  
  // Handle identifiers and member expressions (e.g., strategy.percent_of_equity)
  // Note: Some keywords like 'strategy' can also be used as object names in member expressions
  if (check(parser, TOKEN_TYPES.IDENTIFIER) || check(parser, TOKEN_TYPES.KEYWORD)) {
    const token = advance(parser);
    let expr = {
      type: AST_NODE_TYPES.IDENTIFIER,
      name: token.value,
      location: token.location,
      kind: 'variable'
    };
    
    // Check for member expressions (dot notation)
    while (check(parser, TOKEN_TYPES.DOT)) {
      advance(parser); // consume dot
      if (check(parser, TOKEN_TYPES.IDENTIFIER) || check(parser, TOKEN_TYPES.KEYWORD)) {
        const memberToken = advance(parser);
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: {
            type: AST_NODE_TYPES.IDENTIFIER,
            name: memberToken.value,
            location: memberToken.location
          },
          location: token.location,
          computed: false // Not using bracket notation
        };
      } else {
        parser.errors.push({
          code: 'EXPECTED_IDENTIFIER',
          message: 'Expected identifier after dot',
          location: getCurrentLocation(parser),
          severity: 'error'
        });
        break;
      }
    }
    
    // Check if this is a function call after the member expression
    if (check(parser, TOKEN_TYPES.LPAREN)) {
      // Convert member expression to function call
      if (expr.type === 'MemberExpression') {
        // We need to construct this as a namespaced function call
        const namespace = expr.object.name;
        const functionName = expr.property.name;
        
        // Manually parse the function call parts
        advance(parser); // consume '('
        
        const parameters = [];
        let position = 0;
        
        while (!check(parser, TOKEN_TYPES.RPAREN) && !isAtEnd(parser)) {
          skipNewlines(parser);
          
          const param = parseParameter(parser, position);
          if (param) {
            parameters.push(param);
            position++;
          }
          
          skipNewlines(parser);
          
          if (!check(parser, TOKEN_TYPES.RPAREN)) {
            consume(parser, TOKEN_TYPES.COMMA, "Expected ',' between parameters");
            skipNewlines(parser);
          }
        }
        
        consume(parser, TOKEN_TYPES.RPAREN, "Expected ')' after parameters");
        
        return createFunctionCallNode(functionName, parameters, expr.location, namespace);
      } else if (expr.type === AST_NODE_TYPES.IDENTIFIER) {
        // Reset parser position to parse the function call properly
        parser.current--; // Go back to the identifier
        return parseFunctionCall(parser);
      }
    }
    
    return expr;
  }
  
  // Handle nested function calls
  if (check(parser, TOKEN_TYPES.IDENTIFIER) && 
      peekNext(parser) && peekNext(parser).type === TOKEN_TYPES.LPAREN) {
    return parseFunctionCall(parser);
  }
  
  // Fallback - create error token
  const token = advance(parser);
  parser.warnings.push({
    code: 'UNEXPECTED_EXPRESSION',
    message: `Unexpected token in expression: ${token.value}`,
    location: token.location,
    severity: 'warning'
  });
  
  return createLiteralNode(token.value, token.location, token.value);
}

/**
 * Extract the actual value from a parameter node for validation
 * @param {Object} parameterValue - Parameter value node
 * @returns {any} - Extracted value
 */
function extractParameterValue(parameterValue) {
  if (parameterValue.type === AST_NODE_TYPES.LITERAL) {
    const value = parameterValue.value;
    
    // Try to convert numeric strings to numbers
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }
    
    return value;
  }
  
  if (parameterValue.type === AST_NODE_TYPES.IDENTIFIER) {
    return parameterValue.name;
  }
  
  // Handle boolean literals
  if (parameterValue.type === AST_NODE_TYPES.BOOLEAN || 
      (parameterValue.type === AST_NODE_TYPES.LITERAL && 
       (parameterValue.value === 'true' || parameterValue.value === 'false'))) {
    return parameterValue.value === 'true';
  }
  
  if (parameterValue.type === 'MemberExpression') {
    // Convert member expression to string (e.g., strategy.percent_of_equity)
    return flattenMemberExpression(parameterValue);
  }
  
  if (parameterValue.type === AST_NODE_TYPES.FUNCTION_CALL) {
    return `${parameterValue.namespace ? parameterValue.namespace + '.' : ''}${parameterValue.name}()`;
  }
  
  return null;
}

/**
 * Convert a member expression to a dotted string
 * @param {Object} memberExpr - Member expression node
 * @returns {string} - Dotted string representation
 */
function flattenMemberExpression(memberExpr) {
  if (memberExpr.type === AST_NODE_TYPES.IDENTIFIER) {
    return memberExpr.name;
  }
  
  if (memberExpr.type === 'MemberExpression') {
    return flattenMemberExpression(memberExpr.object) + '.' + memberExpr.property.name;
  }
  
  return 'unknown';
}

/**
 * Utility functions for parser state management
 */

function isAtEnd(parser) {
  return parser.current >= parser.tokens.length || 
         peek(parser).type === TOKEN_TYPES.EOF;
}

function peek(parser) {
  if (parser.current >= parser.tokens.length) {
    return { type: TOKEN_TYPES.EOF, value: '', location: createSourceLocation(0, 0, 0, 0) };
  }
  return parser.tokens[parser.current];
}

function peekNext(parser) {
  if (parser.current + 1 >= parser.tokens.length) {
    return null;
  }
  return parser.tokens[parser.current + 1];
}

function advance(parser) {
  if (!isAtEnd(parser)) {
    parser.current++;
  }
  return parser.tokens[parser.current - 1];
}

function check(parser, type) {
  if (isAtEnd(parser)) return false;
  return peek(parser).type === type;
}

function consume(parser, type, message) {
  if (check(parser, type)) {
    return advance(parser);
  }
  
  parser.errors.push({
    code: 'EXPECTED_TOKEN',
    message,
    location: getCurrentLocation(parser),
    severity: 'error'
  });
  
  throw new Error(message);
}

function skipNewlines(parser) {
  while (check(parser, TOKEN_TYPES.NEWLINE) || 
         check(parser, TOKEN_TYPES.INDENT) || 
         check(parser, TOKEN_TYPES.DEDENT)) {
    advance(parser);
  }
}

function getCurrentLocation(parser) {
  const token = peek(parser);
  return token.location;
}

function synchronize(parser) {
  advance(parser);
  
  while (!isAtEnd(parser)) {
    if (peek(parser).type === TOKEN_TYPES.NEWLINE) {
      return;
    }
    
    const token = peek(parser);
    if (token.type === TOKEN_TYPES.KEYWORD) {
      return;
    }
    
    advance(parser);
  }
}

/**
 * Utility functions for AST analysis
 */

function detectPineScriptVersion(source) {
  // Look for version declaration at start of file
  const versionMatch = source.match(/^\/\/@version\s*=\s*(\d+)/m);
  if (versionMatch) {
    return `v${versionMatch[1]}`;
  }
  
  // Default to v6 if no version specified
  return 'v6';
}

function countNodes(node) {
  let count = 1;
  
  if (node.declarations) {
    count += node.declarations.reduce((sum, child) => sum + countNodes(child), 0);
  }
  
  if (node.statements) {
    count += node.statements.reduce((sum, child) => sum + countNodes(child), 0);
  }
  
  if (node.parameters) {
    count += node.parameters.reduce((sum, child) => sum + countNodes(child), 0);
  }
  
  if (node.value) {
    count += countNodes(node.value);
  }
  
  return count;
}

function calculateMaxDepth(node, depth = 0) {
  let maxDepth = depth;
  
  if (node.declarations) {
    for (const child of node.declarations) {
      maxDepth = Math.max(maxDepth, calculateMaxDepth(child, depth + 1));
    }
  }
  
  if (node.statements) {
    for (const child of node.statements) {
      maxDepth = Math.max(maxDepth, calculateMaxDepth(child, depth + 1));
    }
  }
  
  if (node.parameters) {
    for (const child of node.parameters) {
      maxDepth = Math.max(maxDepth, calculateMaxDepth(child, depth + 1));
    }
  }
  
  if (node.value) {
    maxDepth = Math.max(maxDepth, calculateMaxDepth(node.value, depth + 1));
  }
  
  return maxDepth;
}