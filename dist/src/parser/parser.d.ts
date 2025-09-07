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
export function parseScript(source: string): import("./ast-types.js").ASTResult;
/**
 * Extract function parameters for validation
 * Specialized function for SHORT_TITLE_TOO_LONG and similar validations
 * @param {string} source - Pine Script source code
 * @returns {Object} - Extracted function calls and parameters
 */
export function extractFunctionParameters(source: string): Object;
/**
 * Parser state for tracking tokens and position
 */
export type ParserState = {
    /**
     * - Array of tokens from lexer
     */
    tokens: Token[];
    /**
     * - Current token index
     */
    current: number;
    /**
     * - Parse errors encountered
     */
    errors: ParseError[];
    /**
     * - Parse warnings
     */
    warnings: ParseError[];
    /**
     * - Parse start time for metrics
     */
    startTime: number;
};
