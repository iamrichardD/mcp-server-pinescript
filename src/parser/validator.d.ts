/**
 * Type declarations for validator.js module
 */

import type { ValidationResult } from './types.js';

export function validateParameters(source: string, rules?: any): ValidationResult;
export function validatePineScriptParameters(source: string, rules: any): ValidationResult;
export function validateShortTitle(source: string): ValidationResult;
export function loadValidationRules(rules: any): void;
export function validatePrecision(source: string): ValidationResult;
export function quickValidatePrecision(source: string): ValidationResult;
export function validateMaxBarsBack(source: string): ValidationResult;
export function quickValidateMaxBarsBack(source: string): ValidationResult;
export function validateMaxLinesCount(source: string): ValidationResult;
export function quickValidateMaxLinesCount(source: string): ValidationResult;
export function validateMaxLabelsCount(source: string): ValidationResult;
export function quickValidateMaxLabelsCount(source: string): ValidationResult;
export function validateMaxBoxesCount(source: string): ValidationResult;
export function quickValidateMaxBoxesCount(source: string): ValidationResult;
export function validateDrawingObjectCounts(source: string): ValidationResult;
export function quickValidateDrawingObjectCounts(source: string): ValidationResult;
export function validateInputTypes(source: string): ValidationResult;
export function quickValidateInputTypes(source: string): ValidationResult;
export function validateLineContinuation(source: string): ValidationResult;
export function quickValidateLineContinuation(source: string): { hasLineContinuationError: boolean; violations: any[] };
export function validateFunctionSignatures(source: string): ValidationResult;
export function quickValidateFunctionSignatures(source: string): { violations: any[] };
export function validateParameterCount(source: string): ValidationResult;
export function validateSeriesTypeWhereSimpleExpected(source: string): ValidationResult;
export function quickValidateSeriesTypeWhereSimpleExpected(source: string): ValidationResult;
export function validateParameterTypes(source: string): ValidationResult;
export function validateBuiltinNamespace(source: string): ValidationResult;
export function quickValidateBuiltinNamespace(source: string): ValidationResult;

export function extractFunctionCalls(line: string): Array<{ 
  name: string; 
  parameters: string[]; 
  position: number; 
}>;
export function inferParameterTypes(paramValue: string): string;
export function getExpectedTypes(functionName: string): {
  params: Array<{ name: string; type: string; required: boolean }>;
};
export function getExpectedSignature(functionName: string): any;
export function compareTypes(
  expectedType: string,
  actualType: string
): { isValid: boolean; reason?: string; expected?: string; actual?: string };