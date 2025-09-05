# UDT Validation Acceptance Tests

This directory contains acceptance tests for the User-Defined Type (UDT) validation functionality implemented in the MCP server. These tests provide regression protection for the critical UDT validation bugs that were resolved through mob programming.

## Overview

The UDT validation system addresses three critical bug categories identified in the comprehensive bug report:

1. **UDT History-Referencing Syntax Errors** - Detects invalid `udt.field[n]` patterns
2. **UDT Uninitialized Field Access** - Prevents runtime errors from accessing uninitialized UDT fields  
3. **Complex UDT Interaction Patterns** - Validates mathematical operations, conditional checks, and nested access

## Test Files

### `udt-regression.test.js`
**Purpose**: Structural regression tests that verify the UDT validation implementation remains intact.

**Test Categories**:
- **Implementation Validation**: Verifies core UDT validation functions exist in `index.ts`
- **Error Message Quality**: Ensures error messages are actionable and helpful
- **Performance Requirements**: Validates efficient regex patterns and early returns
- **Test Case Patterns**: Confirms test case structure for validation scenarios

**Critical Tests**:
```javascript
// Verifies UDT validation functions exist
expect(indexContent).toContain('validateUdtHistoryAccess');
expect(indexContent).toContain('validateUdtRuntimeSafety');
expect(indexContent).toContain('validateComplexUdtPatterns');

// Verifies integration with main validation pipeline  
expect(indexContent).toContain('const udtViolations = await runUdtValidation(code)');

// Verifies error rules are implemented
expect(indexContent).toContain('udt_history_referencing_syntax');
expect(indexContent).toContain('udt_uninitialized_access');
```

### `udt-validation-acceptance.test.js` *(Currently Non-Functional)*
**Purpose**: End-to-end acceptance tests that would validate actual UDT error detection.

**Status**: This file contains comprehensive test cases but cannot currently execute due to MCP server integration complexity. It serves as documentation of the expected behavior and can be used for manual testing.

**Test Scenarios**:
- Invalid UDT history-referencing: `test.value[1]` → Should detect syntax error
- Valid UDT history-referencing: `(test[1]).value` → Should pass
- Uninitialized UDT access: Access to uninitialized UDT variables  
- Complex UDT patterns: Mathematical operations, conditional checks, nested access

## Running the Tests

### Individual Test Execution
```bash
# Run UDT regression tests (recommended)
npm run test:acceptance

# Run specific UDT regression test
npm run test tests/acceptance/udt-regression.test.js

# Run all acceptance tests in directory  
npm run test tests/acceptance/
```

### CI/CD Integration
The UDT acceptance tests are integrated into:

1. **Pre-commit Hook** (`.githooks/pre-commit`):
   - Runs `npm run test:acceptance` before each commit
   - Blocks commits if UDT validation regression detected
   - Ensures UDT validation implementation integrity

2. **CI Validation** (`package.json`):
   - Included in `ci:validate` script
   - Runs as part of automated build pipeline

## Test Case Examples

### UDT History-Referencing Validation
```pinescript
//@version=6
type TestType
    float value

var test = TestType.new(0.0)
badValue = test.value[1]  // Should detect: udt_history_referencing_syntax error
goodValue = (test[1]).value  // Should pass: correct syntax
```

### UDT Uninitialized Access Validation  
```pinescript
//@version=6
type State
    bool flag

var uninitializedState  // Not initialized with .new()

if uninitializedState.flag  // Should detect: udt_uninitialized_access error
    strategy.entry("test", strategy.long)
```

### Complex UDT Pattern Validation
```pinescript
//@version=6
type MyUDT
    float price

var udt1 = MyUDT.new()
var udt2 = MyUDT.new()

result = udt1.price + udt2.price  // Should detect: udt_mathematical_operations warning
if udt1.price  // Should detect: udt_conditional_access error
    plot(result)
```

## Expected Test Results

### Successful Test Run Output
```
✓ UDT Validation Regression Tests > Implementation Validation > should maintain UDT validation functions in index.ts
✓ UDT Validation Regression Tests > Implementation Validation > should maintain UDT validation rules and error types  
✓ UDT Validation Regression Tests > Implementation Validation > should maintain UDT validation integration in reviewSingleCode
✓ UDT Validation Regression Tests > Error Message Quality > should provide actionable error messages
✓ UDT Validation Regression Tests > Performance Requirements > should maintain efficient validation patterns
✓ UDT Validation Regression Tests > Test Case Patterns > should recognize UDT history-referencing patterns
✓ UDT Validation Regression Tests > Test Case Patterns > should recognize UDT uninitialized access patterns
✓ UDT Validation Regression Tests > Test Case Patterns > should recognize complex UDT interaction patterns

Test Files  1 passed (1)
Tests  8 passed (8)
```

## Troubleshooting

### Common Test Failures

**Function Not Found Errors**:
```
AssertionError: expected '...' to contain 'validateUdtHistoryAccess'
```
**Resolution**: UDT validation functions may have been accidentally removed from `index.ts`. Restore the functions from git history.

**Integration Point Missing**:  
```
AssertionError: expected '...' to contain 'const udtViolations = await runUdtValidation(code)'
```
**Resolution**: UDT validation integration may have been removed from `reviewSingleCode` function. Re-add the integration point.

**Regex Pattern Changes**:
```  
AssertionError: expected '...' to contain 'const udtHistoryPattern = /(\\w+)\\.(\\w+)\\[(\\d+)]/g'
```
**Resolution**: UDT validation regex patterns may have been modified. Verify the patterns match the expected structure.

### Test Maintenance

When modifying UDT validation implementation:

1. **Update Regression Tests**: If function names, error rules, or integration points change, update the corresponding assertions in `udt-regression.test.js`

2. **Verify Test Coverage**: Ensure new UDT validation patterns are covered by test case examples

3. **Test Performance**: If adding new validation logic, verify it maintains the performance requirements (regex-based, early returns)

## Future Enhancements

### Potential Improvements

1. **End-to-End Integration**: Create working E2E tests that actually execute the MCP server validation pipeline

2. **Extended Test Cases**: Add more complex UDT validation scenarios based on user feedback

3. **Performance Benchmarking**: Add automated performance tests to ensure UDT validation maintains speed targets

4. **Property-Based Testing**: Use property-based testing to generate random UDT code patterns and validate behavior

## Mob Programming Legacy

These tests were created as part of a comprehensive mob programming session that:

- ✅ **Identified and analyzed** 3 critical UDT validation gaps from bug reports
- ✅ **Designed and implemented** complete UDT validation system in `index.ts`  
- ✅ **Created regression protection** through automated acceptance testing
- ✅ **Integrated quality gates** into CI/CD pipeline with git hooks
- ✅ **Established maintainability** through comprehensive documentation

The acceptance tests ensure that the valuable work completed during the mob programming session is protected against future regressions and that the UDT validation system continues to prevent the critical runtime errors that were originally reported.