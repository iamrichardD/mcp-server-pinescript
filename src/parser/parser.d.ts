/**
 * Type declarations for parser.js module
 */

import type { ParameterExtractionResult, ASTResult } from './types.js';

export function extractFunctionParameters(source: string): ParameterExtractionResult;
export function parseScript(source: string): ASTResult;