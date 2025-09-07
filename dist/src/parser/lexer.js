/**
 * Pine Script Lexer
 *
 * Tokenizes Pine Script source code for AST generation.
 * Designed with TypeScript migration in mind - clean interfaces and predictable behavior.
 *
 * Performance target: <5ms tokenization for typical Pine Script files
 * Memory efficient: Streaming tokenization without storing entire source
 */
import { createSourceLocation } from "./ast-types.js";
/**
 * Token types for Pine Script lexical analysis
 */
export const TOKEN_TYPES = {
    // Literals
    STRING: "STRING",
    NUMBER: "NUMBER",
    BOOLEAN: "BOOLEAN",
    COLOR: "COLOR",
    // Identifiers and keywords
    IDENTIFIER: "IDENTIFIER",
    KEYWORD: "KEYWORD",
    // Operators
    ASSIGN: "ASSIGN", // =, :=
    ARITHMETIC: "ARITHMETIC", // +, -, *, /, %
    COMPARISON: "COMPARISON", // ==, !=, <, >, <=, >=
    LOGICAL: "LOGICAL", // and, or, not
    OPERATOR: "OPERATOR", // Generic operator type for tests
    // Punctuation
    LPAREN: "LPAREN", // (
    RPAREN: "RPAREN", // )
    LBRACKET: "LBRACKET", // [
    RBRACKET: "RBRACKET", // ]
    COMMA: "COMMA", // ,
    DOT: "DOT", // .
    QUESTION: "QUESTION", // ?
    COLON: "COLON", // :
    // Special
    NEWLINE: "NEWLINE",
    INDENT: "INDENT",
    DEDENT: "DEDENT",
    COMMENT: "COMMENT",
    EOF: "EOF",
    // Error token
    ERROR: "ERROR",
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
const KEYWORDS = new Set([
    // Declarations
    "indicator",
    "strategy",
    "library",
    "var",
    "varip",
    // Control flow
    "if",
    "else",
    "for",
    "while",
    "break",
    "continue",
    "switch",
    // Built-in types
    "int",
    "float",
    "bool",
    "string",
    "color",
    "line",
    "label",
    "box",
    "table",
    "array",
    "matrix",
    "series",
    "simple",
    // Built-in constants
    "true",
    "false",
    "na",
    // Operators as keywords
    "and",
    "or",
    "not",
    // Import/export
    "import",
    "export",
    // Function modifiers
    "method",
]);
/**
 * Create a new lexer instance
 * @param {string} source - Pine Script source code
 * @returns {LexerState} - Initial lexer state
 */
export function createLexer(source) {
    const lexer = {
        source,
        position: 0,
        line: 1,
        column: 0,
        indentLevel: 0,
        indentStack: [0],
        atLineStart: true,
    };
    // Add tokenize method to the lexer for tests
    lexer.tokenize = function () {
        return tokenize(this.source);
    };
    return lexer;
}
/**
 * Tokenize Pine Script source code
 * @param {string} source - Pine Script source code
 * @returns {Token[]} - Array of tokens
 */
export function tokenize(source) {
    const lexer = createLexer(source);
    const tokens = [];
    while (!isAtEnd(lexer)) {
        const token = nextToken(lexer);
        if (token) {
            tokens.push(token);
        }
    }
    // Add EOF token
    tokens.push({
        type: TOKEN_TYPES.EOF,
        value: "",
        location: createSourceLocation(lexer.line, lexer.column, lexer.position, 0),
    });
    return tokens;
}
/**
 * Get the next token from the lexer
 * @param {LexerState} lexer - Lexer state
 * @returns {Token|null} - Next token or null if at end
 */
export function nextToken(lexer) {
    skipWhitespace(lexer);
    if (isAtEnd(lexer)) {
        return null;
    }
    const start = lexer.position;
    const startLine = lexer.line;
    const startColumn = lexer.column;
    const char = peek(lexer);
    // Handle newlines and indentation
    if (char === "\n") {
        advance(lexer);
        lexer.line++;
        lexer.column = 0;
        lexer.atLineStart = true;
        return createToken(TOKEN_TYPES.NEWLINE, "\n", startLine, startColumn, start, 1);
    }
    // Handle indentation at line start
    if (lexer.atLineStart && (char === " " || char === "\t")) {
        return handleIndentation(lexer, startLine, startColumn, start);
    }
    lexer.atLineStart = false;
    // Comments
    if (char === "/") {
        if (peekNext(lexer) === "/") {
            return readLineComment(lexer, startLine, startColumn, start);
        }
    }
    // String literals
    if (char === '"' || char === "'") {
        return readString(lexer, startLine, startColumn, start);
    }
    // Number literals
    if (isDigit(char) || (char === "." && isDigit(peekNext(lexer)))) {
        return readNumber(lexer, startLine, startColumn, start);
    }
    // Handle negative numbers (unary minus followed by digit)
    if (char === "-" && !isAtEnd(lexer) && isDigit(peekNext(lexer))) {
        return readNegativeNumber(lexer, startLine, startColumn, start);
    }
    // Identifiers and keywords
    if (isAlpha(char) || char === "_") {
        return readIdentifier(lexer, startLine, startColumn, start);
    }
    // Two-character operators
    const twoChar = peek(lexer) + peekNext(lexer);
    if (twoChar === ":=" ||
        twoChar === "==" ||
        twoChar === "!=" ||
        twoChar === "<=" ||
        twoChar === ">=" ||
        twoChar === "//" ||
        twoChar === "/*" ||
        twoChar === "*/") {
        advance(lexer);
        advance(lexer);
        const type = getOperatorType(twoChar);
        return createToken(type, twoChar, startLine, startColumn, start, 2);
    }
    // Single-character tokens
    advance(lexer);
    const type = getSingleCharType(char);
    return createToken(type, char, startLine, startColumn, start, 1);
}
/**
 * Handle indentation tokens at line start
 * @param {LexerState} lexer - Lexer state
 * @param {number} startLine - Start line
 * @param {number} startColumn - Start column
 * @param {number} start - Start position
 * @returns {Token|null} - Indent/dedent token or null
 */
function handleIndentation(lexer, startLine, startColumn, start) {
    let indentSize = 0;
    while (!isAtEnd(lexer) && (peek(lexer) === " " || peek(lexer) === "\t")) {
        if (peek(lexer) === "\t") {
            indentSize += 4; // Treat tab as 4 spaces
        }
        else {
            indentSize += 1;
        }
        advance(lexer);
    }
    const currentIndent = lexer.indentStack[lexer.indentStack.length - 1];
    if (indentSize > currentIndent) {
        lexer.indentStack.push(indentSize);
        lexer.atLineStart = false;
        return createToken(TOKEN_TYPES.INDENT, " ".repeat(indentSize), startLine, startColumn, start, indentSize);
    }
    else if (indentSize < currentIndent) {
        // Handle dedent
        while (lexer.indentStack.length > 1 &&
            lexer.indentStack[lexer.indentStack.length - 1] > indentSize) {
            lexer.indentStack.pop();
        }
        lexer.atLineStart = false;
        return createToken(TOKEN_TYPES.DEDENT, " ".repeat(indentSize), startLine, startColumn, start, indentSize);
    }
    lexer.atLineStart = false;
    return null; // Same indentation level, no token needed
}
/**
 * Read a string literal
 * @param {LexerState} lexer - Lexer state
 * @param {number} startLine - Start line
 * @param {number} startColumn - Start column
 * @param {number} start - Start position
 * @returns {Token} - String token
 */
function readString(lexer, startLine, startColumn, start) {
    const quote = advance(lexer); // Consume opening quote
    let value = "";
    while (!isAtEnd(lexer) && peek(lexer) !== quote) {
        if (peek(lexer) === "\\") {
            advance(lexer); // Consume backslash
            if (!isAtEnd(lexer)) {
                const escaped = advance(lexer);
                // Handle escape sequences
                switch (escaped) {
                    case "n":
                        value += "\n";
                        break;
                    case "t":
                        value += "\t";
                        break;
                    case "r":
                        value += "\r";
                        break;
                    case "\\":
                        value += "\\";
                        break;
                    case '"':
                        value += '"';
                        break;
                    case "'":
                        value += "'";
                        break;
                    default:
                        value += escaped;
                        break;
                }
            }
        }
        else {
            if (peek(lexer) === "\n") {
                lexer.line++;
                lexer.column = 0;
            }
            value += advance(lexer);
        }
    }
    if (!isAtEnd(lexer)) {
        advance(lexer); // Consume closing quote
    }
    const length = lexer.position - start;
    return createToken(TOKEN_TYPES.STRING, value, startLine, startColumn, start, length);
}
/**
 * Read a number literal
 * @param {LexerState} lexer - Lexer state
 * @param {number} startLine - Start line
 * @param {number} startColumn - Start column
 * @param {number} start - Start position
 * @returns {Token} - Number token
 */
function readNumber(lexer, startLine, startColumn, start) {
    let value = "";
    let hasDecimal = false;
    while (!isAtEnd(lexer) && (isDigit(peek(lexer)) || (!hasDecimal && peek(lexer) === "."))) {
        if (peek(lexer) === ".") {
            hasDecimal = true;
        }
        value += advance(lexer);
    }
    // Handle scientific notation
    if (!isAtEnd(lexer) && (peek(lexer) === "e" || peek(lexer) === "E")) {
        value += advance(lexer);
        if (!isAtEnd(lexer) && (peek(lexer) === "+" || peek(lexer) === "-")) {
            value += advance(lexer);
        }
        while (!isAtEnd(lexer) && isDigit(peek(lexer))) {
            value += advance(lexer);
        }
    }
    const length = lexer.position - start;
    return createToken(TOKEN_TYPES.NUMBER, value, startLine, startColumn, start, length);
}
/**
 * Read an identifier or keyword
 * @param {LexerState} lexer - Lexer state
 * @param {number} startLine - Start line
 * @param {number} startColumn - Start column
 * @param {number} start - Start position
 * @returns {Token} - Identifier or keyword token
 */
function readIdentifier(lexer, startLine, startColumn, start) {
    let value = "";
    while (!isAtEnd(lexer) && (isAlphaNumeric(peek(lexer)) || peek(lexer) === "_")) {
        value += advance(lexer);
    }
    const length = lexer.position - start;
    const type = KEYWORDS.has(value) ? TOKEN_TYPES.KEYWORD : TOKEN_TYPES.IDENTIFIER;
    // Special handling for boolean literals
    if (value === "true" || value === "false") {
        return createToken(TOKEN_TYPES.BOOLEAN, value, startLine, startColumn, start, length);
    }
    return createToken(type, value, startLine, startColumn, start, length);
}
/**
 * Read a line comment
 * @param {LexerState} lexer - Lexer state
 * @param {number} startLine - Start line
 * @param {number} startColumn - Start column
 * @param {number} start - Start position
 * @returns {Token} - Comment token
 */
function readLineComment(lexer, startLine, startColumn, start) {
    let value = "";
    // Consume '//'
    advance(lexer);
    advance(lexer);
    while (!isAtEnd(lexer) && peek(lexer) !== "\n") {
        value += advance(lexer);
    }
    const length = lexer.position - start;
    return createToken(TOKEN_TYPES.COMMENT, value.trim(), startLine, startColumn, start, length);
}
/**
 * Helper functions
 */
function createToken(type, value, line, column, offset, length) {
    return {
        type,
        value,
        location: createSourceLocation(line, column, offset, length),
    };
}
function isAtEnd(lexer) {
    return lexer.position >= lexer.source.length;
}
function peek(lexer) {
    if (isAtEnd(lexer))
        return "\0";
    return lexer.source[lexer.position];
}
function peekNext(lexer) {
    if (lexer.position + 1 >= lexer.source.length)
        return "\0";
    return lexer.source[lexer.position + 1];
}
function advance(lexer) {
    if (isAtEnd(lexer))
        return "\0";
    lexer.column++;
    return lexer.source[lexer.position++];
}
function skipWhitespace(lexer) {
    while (!isAtEnd(lexer)) {
        const char = peek(lexer);
        if (char === " " || char === "\t" || char === "\r") {
            if (!lexer.atLineStart) {
                // Only skip if not at line start (preserve indentation)
                advance(lexer);
            }
            else {
                break;
            }
        }
        else {
            break;
        }
    }
}
function isDigit(char) {
    return char >= "0" && char <= "9";
}
function isAlpha(char) {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";
}
function isAlphaNumeric(char) {
    return isAlpha(char) || isDigit(char);
}
function getSingleCharType(char) {
    switch (char) {
        case "(":
            return TOKEN_TYPES.LPAREN;
        case ")":
            return TOKEN_TYPES.RPAREN;
        case "[":
            return TOKEN_TYPES.LBRACKET;
        case "]":
            return TOKEN_TYPES.RBRACKET;
        case ",":
            return TOKEN_TYPES.COMMA;
        case ".":
            return TOKEN_TYPES.DOT;
        case "?":
            return TOKEN_TYPES.QUESTION;
        case ":":
            return TOKEN_TYPES.COLON;
        case "=":
            return TOKEN_TYPES.ASSIGN;
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
            return TOKEN_TYPES.ARITHMETIC;
        case "<":
        case ">":
        case "!":
            return TOKEN_TYPES.COMPARISON;
        default:
            return TOKEN_TYPES.ERROR;
    }
}
function getOperatorType(operator) {
    switch (operator) {
        case ":=":
        case "==":
        case "!=":
        case "<=":
        case ">=":
            return TOKEN_TYPES.COMPARISON;
        case "//":
        case "/*":
        case "*/":
            return TOKEN_TYPES.COMMENT;
        default:
            return TOKEN_TYPES.ERROR;
    }
}
// Export for testing and introspection
// Convert Set to Array for test compatibility
export const KEYWORDS_ARRAY = Array.from(KEYWORDS);
export { KEYWORDS, KEYWORDS_ARRAY as KEYWORDS_SET };
/**
 * Read a negative number literal
 * @param {LexerState} lexer - Lexer state
 * @param {number} startLine - Start line
 * @param {number} startColumn - Start column
 * @param {number} start - Start position
 * @returns {Token} - Number token with negative value
 */
function readNegativeNumber(lexer, startLine, startColumn, start) {
    let value = "";
    // Consume the minus sign
    value += advance(lexer);
    // Read the number part
    let hasDecimal = false;
    while (!isAtEnd(lexer) && (isDigit(peek(lexer)) || (!hasDecimal && peek(lexer) === "."))) {
        if (peek(lexer) === ".") {
            hasDecimal = true;
        }
        value += advance(lexer);
    }
    // Handle scientific notation
    if (!isAtEnd(lexer) && (peek(lexer) === "e" || peek(lexer) === "E")) {
        value += advance(lexer);
        if (!isAtEnd(lexer) && (peek(lexer) === "+" || peek(lexer) === "-")) {
            value += advance(lexer);
        }
        while (!isAtEnd(lexer) && isDigit(peek(lexer))) {
            value += advance(lexer);
        }
    }
    const length = lexer.position - start;
    return createToken(TOKEN_TYPES.NUMBER, value, startLine, startColumn, start, length);
}
