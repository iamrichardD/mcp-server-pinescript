# MCP PineScript-Docs Naming Convention Bug Report

## Bug Summary
The pinescript-docs MCP service incorrectly flags **built-in function parameter names** as naming convention violations when they use the required `snake_case` format. The service suggests converting mandatory snake_case parameters to camelCase, which would cause compilation errors.

## Severity: HIGH
- **Impact**: False positives in code review validation
- **Effect**: Misleading suggestions that would break Pine Script compilation
- **Scope**: All built-in functions using snake_case parameter names

## Bug Details

### Issue Description
The MCP service applies camelCase naming convention rules to **built-in function parameters** that MUST use snake_case according to TradingView's official API specification.

### Incorrect Behavior
```pinescript
// CORRECT Pine Script v6 syntax (MUST be snake_case)
table.cell(table_id=my_table, column=0, row=0, text="Test", text_color=color.white)
                                                      ^^^^^^^^^^
// MCP Service incorrectly flags 'text_color' as naming violation
// Suggests: "Consider renaming 'text_color' to follow camelCase"
```

### Expected Behavior
The MCP service should:
1. **NOT flag built-in function parameters** using required snake_case format
2. **Only flag user-defined variables** for camelCase convention
3. **Distinguish between built-in parameters and user variables**

## Examples from Strategy Analysis

### False Positive Cases
The following are **CORRECT** usage that MCP service incorrectly flags:

```pinescript
// Line 1669, column 41 - FALSE POSITIVE
table.cell(table_id=performanceTable, column=1, row=11, text=str.tostring(institutionalDeploymentReady), text_color=textColor)
                                                                                                          ^^^^^^^^^^

// Line 1300, column 57 - FALSE POSITIVE  
table.cell(table_id=performanceTable, column=1, row=0, text=str.tostring(basicPassRate, "#.##") + "%", text_color=textColor)
                                                                                                         ^^^^^^^^^^

// Line 1658, column 125 - FALSE POSITIVE
table.cell(table_id=performanceTable, column=1, row=9, text=str.tostring(enhancedPassRate, "#.##") + "%", text_color=textColor)
                                                                                                              ^^^^^^^^^^
```

## Root Cause Analysis

### Problem Source
The MCP service naming convention rule fails to distinguish between:
- **Built-in function parameters** (MUST be snake_case)
- **User-defined variables** (SHOULD be camelCase)

### Technical Context
- **TradingView API Specification**: Built-in functions use snake_case parameters
- **Pine Script v6 Compliance**: Changing `text_color` to `textColor` would cause compilation error
- **Official Documentation**: All built-in functions follow snake_case parameter naming

## Impact Assessment

### Immediate Impact
- **208 false positive suggestions** in current analysis
- **Misleading code review guidance** for developers
- **Potential compilation errors** if suggestions followed

### Long-term Impact
- **Reduced trust** in MCP service validation
- **Manual filtering required** to separate real issues from false positives
- **Development workflow disruption** during code reviews

## Proposed Solution

### Short-term Fix
MCP service should implement **context-aware naming validation**:

```typescript
// Pseudo-code for improved validation
function validateNamingConvention(identifier, context) {
    if (context.isBuiltInParameter) {
        // Don't validate built-in parameters - they use required snake_case
        return { valid: true };
    } else if (context.isUserVariable) {
        // Only validate user-defined variables for camelCase
        return validateCamelCase(identifier);
    }
}
```

### Long-term Enhancement
1. **Built-in Function Registry**: Maintain list of all built-in functions and their parameter names
2. **Context Detection**: Identify when parameters belong to built-in vs user-defined functions  
3. **Granular Rules**: Apply different naming conventions based on context

## Test Cases

### Should NOT Flag (Built-in Parameters)
```pinescript
table.cell(text_color=color.white)    // CORRECT - built-in parameter
plot(color=color.blue)                // CORRECT - built-in parameter  
strategy.entry(qty=position_size)     // CORRECT - built-in parameter
```

### Should Flag (User Variables)
```pinescript
my_custom_variable = 10               // SHOULD flag - user variable
user_defined_func(custom_param) =>    // SHOULD flag - user parameter
    local_var = custom_param          // SHOULD flag - user variable
```

## Validation Examples

### Current Incorrect Output
```json
{
  "line": 1669,
  "rule": "naming_convention", 
  "severity": "suggestion",
  "message": "Variable should use camelCase naming convention",
  "suggested_fix": "Consider renaming 'text_color' to follow camelCase"
}
```

### Expected Correct Output
```json
{
  "line": 1669,
  "rule": "naming_convention",
  "severity": "ignored", 
  "message": "Built-in parameter uses required snake_case format",
  "suggested_fix": "No action needed - built-in parameter format is correct"
}
```

## Priority: URGENT
This bug significantly impacts the reliability of the pinescript-docs MCP service for institutional-grade Pine Script development workflows.

## Environment
- **Service**: pinescript-docs MCP service
- **Pine Script Version**: v6
- **Analysis Type**: naming_convention rule
- **File**: strategy-v1.3.pine (1701 lines analyzed)

## Recommended Actions
1. **Immediate**: Update naming convention rule to exclude built-in function parameters
2. **Short-term**: Implement context-aware validation logic
3. **Long-term**: Comprehensive built-in function parameter registry

---

**Reported by**: Multi-Agent Development Ecosystem  
**Date**: 2025-09-06  
**Status**: Active Bug - Requiring MCP Service Team Investigation