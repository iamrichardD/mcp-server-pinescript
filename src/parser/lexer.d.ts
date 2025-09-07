/**
 * Type declarations for lexer.js module
 */

import type { Token, LexerState } from './types.js';

export const TOKEN_TYPES: {
  readonly STRING: 'STRING';
  readonly NUMBER: 'NUMBER';
  readonly BOOLEAN: 'BOOLEAN';
  readonly COLOR: 'COLOR';
  readonly IDENTIFIER: 'IDENTIFIER';
  readonly KEYWORD: 'KEYWORD';
  readonly ASSIGN: 'ASSIGN';
  readonly ARITHMETIC: 'ARITHMETIC';
  readonly COMPARISON: 'COMPARISON';
  readonly LOGICAL: 'LOGICAL';
  readonly LPAREN: 'LPAREN';
  readonly RPAREN: 'RPAREN';
  readonly LBRACKET: 'LBRACKET';
  readonly RBRACKET: 'RBRACKET';
  readonly COMMA: 'COMMA';
  readonly DOT: 'DOT';
  readonly QUESTION: 'QUESTION';
  readonly COLON: 'COLON';
  readonly NEWLINE: 'NEWLINE';
  readonly INDENT: 'INDENT';
  readonly DEDENT: 'DEDENT';
  readonly COMMENT: 'COMMENT';
  readonly EOF: 'EOF';
  readonly ERROR: 'ERROR';
};

export const KEYWORDS: readonly string[];

export function tokenize(source: string): Token[];
export function createLexer(source: string): LexerState;
