/**
 * Type declarations for ast-types.js module
 */

import type {
  SourceLocation,
  FunctionCallNode,
  LiteralNode,
  ParameterNode,
  BaseASTNode,
} from './types.js';

export const AST_NODE_TYPES: {
  readonly PROGRAM: 'Program';
  readonly FUNCTION_CALL: 'FunctionCall';
  readonly PARAMETER: 'Parameter';
  readonly LITERAL: 'Literal';
  readonly IDENTIFIER: 'Identifier';
  readonly DECLARATION: 'Declaration';
};

export const DATA_TYPES: {
  readonly STRING: 'string';
  readonly NUMBER: 'number';
  readonly BOOLEAN: 'boolean';
  readonly COLOR: 'color';
};

export function createSourceLocation(
  line: number,
  column: number,
  offset: number,
  length: number
): SourceLocation;

export function createFunctionCallNode(
  name: string,
  parameters: ParameterNode[],
  location: SourceLocation,
  namespace?: string
): FunctionCallNode;

export function createParameterNode(
  value: LiteralNode | any,
  location: SourceLocation,
  name?: string,
  position?: number
): ParameterNode;

export function createLiteralNode(
  value: string | number | boolean,
  location: SourceLocation,
  raw: string
): LiteralNode;

export function isASTNode(node: any): node is BaseASTNode;
export function isFunctionCallNode(node: any): node is FunctionCallNode;
export function isParameterNode(node: any): node is ParameterNode;
