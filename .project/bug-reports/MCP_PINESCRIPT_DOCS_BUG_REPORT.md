# PineScript-Docs MCP Service Bug Report - Type System Error Detection Gap

**Report Date**: 2025-08-26  
**Reporter**: 12-Agent Institutional Trading Strategy Team  
**Severity**: CRITICAL  
**Category**: Compilation Error Detection Gap  

## **ISSUE SUMMARY**

The `pinescript-docs` MCP service failed to detect a critical Pine Script v6 compilation error related to type system violations (`simple int` vs `series int` parameter type mismatch in `ta.macd()` function calls).

## **BUG DESCRIPTION**

### **Error Not Detected by MCP Service**
```
Error at 291:56 Cannot call "ta.macd" with argument "fastlen"="activeFast". An argument of "series int" type was used but a "simple int" is expected.
Error at 291:68 Cannot call "ta.macd" with argument "slowlen"="activeSlow". An argument of "series int" type was used but a "simple int" is expected.
Error at 291:80 Cannot call "ta.macd" with argument "siglen"="activeSignal". An argument of "series int" type was used but a "simple int" is expected.
```

### **Problematic Code That Should Have Been Flagged**
```pinescript
//@version=6
strategy("Test Strategy", "TEST")

// These variables create series int types due to conditional logic
activeFast = input.bool(true) ? (someCondition ? 5 : 8) : 12
activeSlow = input.bool(true) ? (someCondition ? 13 : 21) : 26  
activeSignal = input.bool(true) ? (someCondition ? 3 : 5) : 9

// This should trigger an error but MCP service missed it
[macdLine, signalLine, histogramLine] = ta.macd(close, activeFast, activeSlow, activeSignal)
```

## **MCP SERVICE TEST RESULTS**

### **Test 1: Direct Code Review**
```bash
mcp__pinescript-docs__pinescript_review 
  source_type: "code"
  code: [problematic code above]
  severity_filter: "error"
```

**Result**: ❌ **FAILED TO DETECT**
- **Expected**: Error detection for type mismatch  
- **Actual**: No errors reported
- **MCP Response**: `"errors": 0, "warnings": 0`

### **Test 2: File Review**
```bash
mcp__pinescript-docs__pinescript_review
  source_type: "file"  
  file_path: [full strategy file with error]
  severity_filter: "error"
```

**Result**: ❌ **FAILED TO DETECT**
- **Expected**: Type system violation detection
- **Actual**: Only generic missing version/declaration errors
- **Critical Gap**: Type system analysis not performed

### **Test 3: Syntax Validation**
```bash
mcp__pinescript-docs__syntax_compatibility_validation
  code: [problematic code]
```

**Result**: ❌ **FAILED TO DETECT** 
- **Expected**: v6 compatibility violation
- **Actual**: `"versionCompatible": true` (incorrect)
- **Critical Issue**: Type system validation missing

## **REAL-WORLD IMPACT**

### **Production Impact**
- **Strategy Development**: 2+ hours debugging time lost
- **Institutional Deployment**: Delayed by type system compilation failures
- **Quality Assurance**: Required manual Pine Script v6 expertise to resolve
- **Developer Trust**: Reduced confidence in MCP service accuracy

### **Expected vs Actual Behavior**
- **Expected**: MCP service detects type system violations before TradingView compilation
- **Actual**: MCP service reports "no errors" for code that fails TradingView compilation
- **Gap**: Critical type system analysis not implemented in MCP service

## **DETAILED ERROR ANALYSIS**

### **Root Cause: Type System Validation Gap**
The MCP service appears to lack comprehensive Pine Script v6 type system analysis:

1. **Missing Type Resolution**: Cannot identify when conditional expressions create `series int` vs `simple int`
2. **Function Signature Validation**: Not checking parameter type requirements for built-in functions
3. **Contextual Analysis**: Missing understanding of Pine Script's strict type requirements

### **Specific Function Signature Issues**
```pinescript
// ta.macd() function signature (from Pine Script documentation)
ta.macd(source, fastlen, slowlen, siglen) → [macdLine, signalLine, histLine]

// Parameter Requirements:
// - source: series float 
// - fastlen: simple int (NOT series int)  ← MCP MISSED THIS
// - slowlen: simple int (NOT series int)  ← MCP MISSED THIS  
// - siglen: simple int (NOT series int)   ← MCP MISSED THIS
```

### **Type System Understanding Gap**
```pinescript
// This creates series int (MCP should flag this)
dynamic_param = condition ? value1 : value2

// This requires simple int (MCP should validate this)
ta.macd(close, dynamic_param, dynamic_param2, dynamic_param3)
```

## **RECOMMENDED FIXES FOR MCP TEAM**

### **1. Implement Type System Analysis**
- **Type Resolution**: Analyze variable declarations and conditional expressions
- **Type Tracking**: Follow type propagation through expressions
- **Function Validation**: Check parameter types against function signatures

### **2. Enhanced Built-in Function Validation**
- **Parameter Checking**: Validate all `ta.*` function parameter types
- **Signature Database**: Maintain comprehensive function signature database
- **Type Mismatch Detection**: Flag `simple int` vs `series int` violations

### **3. Contextual Code Analysis**
- **Variable Context**: Understand how variables are created and used
- **Conditional Analysis**: Detect when conditionals create series types
- **Cross-reference Validation**: Check variable usage against function requirements

### **4. Improved Error Reporting**
- **Specific Messages**: "Function ta.macd() requires simple int parameters, but series int provided"
- **Location Precision**: Exact line/column information for type violations
- **Suggestion Engine**: Recommend type system compliant alternatives

## **TEST CASES FOR VALIDATION**

### **Test Case 1: Basic Type Mismatch**
```pinescript
//@version=6
strategy("Test", "T")
fast = input.bool(true) ? 12 : 26
[m,s,h] = ta.macd(close, fast, 26, 9)  // Should error: fast is series int
```

### **Test Case 2: Complex Conditional Types**  
```pinescript
//@version=6
strategy("Test", "T")
regime = ta.atr(14) > ta.atr(50)
fast = regime ? (close > open ? 8 : 12) : 21
[m,s,h] = ta.macd(close, fast, 26, 9)  // Should error: complex series int
```

### **Test Case 3: Function Parameter Validation**
```pinescript
//@version=6 
strategy("Test", "T")
dynamic_len = input.int(14) + (close > open ? 1 : 0)
sma_val = ta.sma(close, dynamic_len)  // Should error if ta.sma requires simple int
```

## **PRIORITY LEVEL**

**CRITICAL** - This gap significantly undermines the utility of the pinescript-docs MCP service for institutional-grade Pine Script development. Type system violations are among the most common and frustrating compilation errors in Pine Script v6.

## **WORKAROUND IMPLEMENTED**

We resolved the issue by pre-calculating all MACD variants with `simple int` parameters and using conditional selection:

```pinescript
// Working solution: Pre-calculate with simple int
[macdHigh, signalHigh, histHigh] = ta.macd(close, 4, 10, 3)
[macdNormal, signalNormal, histNormal] = ta.macd(close, 6, 18, 4)
[macdLow, signalLow, histLow] = ta.macd(close, 10, 24, 8)

// Then select based on conditions
macdLine = condition ? macdHigh : (condition2 ? macdNormal : macdLow)
```

## **CONCLUSION**

The pinescript-docs MCP service requires immediate enhancement to detect Pine Script v6 type system violations. This is a foundational requirement for any serious Pine Script development tool and significantly impacts developer productivity and code quality validation.

**Request**: Please prioritize implementing comprehensive type system analysis in the next MCP service update.

---

**Contact**: 12-Agent Institutional Trading Strategy Team  
**Environment**: Pine Script v6, TradingView Platform  
**MCP Version**: Current (as of 2025-08-26)