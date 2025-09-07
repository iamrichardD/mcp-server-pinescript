/**
 * Create a new lexer instance
 * @param {string} source - Pine Script source code
 * @returns {LexerState} - Initial lexer state
 */
export function createLexer(source: string): LexerState;
/**
 * Tokenize Pine Script source code
 * @param {string} source - Pine Script source code
 * @returns {Token[]} - Array of tokens
 */
export function tokenize(source: string): Token[];
/**
 * Get the next token from the lexer
 * @param {LexerState} lexer - Lexer state
 * @returns {Token|null} - Next token or null if at end
 */
export function nextToken(lexer: LexerState): Token | null;
export namespace TOKEN_TYPES {
    let STRING: string;
    let NUMBER: string;
    let BOOLEAN: string;
    let COLOR: string;
    let IDENTIFIER: string;
    let KEYWORD: string;
    let ASSIGN: string;
    let ARITHMETIC: string;
    let COMPARISON: string;
    let LOGICAL: string;
    let OPERATOR: string;
    let LPAREN: string;
    let RPAREN: string;
    let LBRACKET: string;
    let RBRACKET: string;
    let COMMA: string;
    let DOT: string;
    let QUESTION: string;
    let COLON: string;
    let NEWLINE: string;
    let INDENT: string;
    let DEDENT: string;
    let COMMENT: string;
    let EOF: string;
    let ERROR: string;
}
export const KEYWORDS_ARRAY: string[];
/**
 * Token structure
 */
export type Token = {
    /**
     * - Token type from TOKEN_TYPES
     */
    type: string;
    /**
     * - Token value/text
     */
    value: string;
    /**
     * - Source location
     */
    location: SourceLocation;
    /**
     * - Additional token metadata
     */
    metadata?: any;
};
/**
 * Lexer state for tracking position and context
 */
export type LexerState = {
    /**
     * - Source code
     */
    source: string;
    /**
     * - Current character position
     */
    position: number;
    /**
     * - Current line (1-based)
     */
    line: number;
    /**
     * - Current column (0-based)
     */
    column: number;
    /**
     * - Current indentation level
     */
    indentLevel: number;
    /**
     * - Stack of indentation levels
     */
    indentStack: number[];
    /**
     * - Whether at start of line
     */
    atLineStart: boolean;
};
/**
 * Token structure
 * @typedef {Object} Token
 * @property {string} type - Token type from TOKEN_TYPES
 * @property {string} value - Token value/text
 * @property {SourceLocation} location - Source location
 * @property {any} [metadata] - Additional token metadata
 */
/**
 * Lexer state for tracking position and context
 * @typedef {Object} LexerState
 * @property {string} source - Source code
 * @property {number} position - Current character position
 * @property {number} line - Current line (1-based)
 * @property {number} column - Current column (0-based)
 * @property {number} indentLevel - Current indentation level
 * @property {number[]} indentStack - Stack of indentation levels
 * @property {boolean} atLineStart - Whether at start of line
 */
/**
 * Pine Script keywords
 */
export const KEYWORDS: Set<string>;
export { KEYWORDS_ARRAY as KEYWORDS_SET };
