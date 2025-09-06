#!/usr/bin/env node

/**
 * Comprehensive Bug Fix Validation Test Suite
 * 
 * Tests both critical MCP PineScript service bug fixes:
 * BUG 1: Runtime NA Object Access Detection (CRITICAL)
 * BUG 2: Naming Convention False Positives (HIGH)
 * 
 * SUCCESS CRITERIA:
 * - BUG 1: Must detect 3+ runtime errors as "error" severity
 * - BUG 2: Must eliminate false positives for built-in parameters (208 → 0)
 */

import { 
  quickValidateRuntimeNAObjectAccess
} from './src/parser/index.js';

import { quickValidateParameterNaming } from './src/parser/parameter-naming-validator.js';

// ANSI colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.cyan}=== MCP PineScript Service Bug Fix Validation Suite ===${colors.reset}\n`);

/**
 * BUG 1 TEST: Runtime NA Object Access Detection
 * Test code that should trigger runtime error detection (from bug report)
 */
async function testBug1RuntimeNAObjectAccess() {
  console.log(`${colors.bold}${colors.blue}TEST 1: Runtime NA Object Access Detection (BUG 1)${colors.reset}`);
  
  const testCode = `
//@version=6
strategy("Runtime Error Test", shorttitle="RT_TEST", overlay=true)

// User-defined type for testing
type KellyData
    float winRate
    float avgWin
    float avgLoss
    int sampleSize

// Initialize with na - this will cause runtime error
var KellyData kellyData = na

// PROBLEMATIC CODE - This should cause runtime error on bar 0
// Cannot access field of undefined (na) object
sampleSize = kellyData.sampleSize  // ERROR: Cannot access 'KellyData.sampleSize' field of undefined object
winRate = kellyData.winRate        // ERROR: Cannot access 'KellyData.winRate' field of undefined object

// Another pattern - accessing na object field in history
historicalSample = (kellyData[1]).sampleSize  // ERROR if kellyData[1] is na

plot(sampleSize)
`;

  console.log(`${colors.yellow}Testing code with expected runtime NA object errors...${colors.reset}`);

  try {
    const result = await quickValidateRuntimeNAObjectAccess(testCode);
    const runtimeErrors = result.violations.filter(v => v.severity === 'error' && v.category === 'runtime_error');
    
    console.log(`${colors.white}Runtime Violations Found: ${runtimeErrors.length}${colors.reset}`);
    
    runtimeErrors.forEach((violation, index) => {
      console.log(`  ${index + 1}. Line ${violation.line}: ${colors.red}${violation.rule}${colors.reset}`);
      console.log(`     ${violation.message}`);
      console.log(`     Fix: ${violation.suggested_fix || 'N/A'}`);
    });

    // SUCCESS CRITERIA: Must detect 3+ runtime errors as "error" severity
    if (runtimeErrors.length >= 3) {
      console.log(`${colors.green}✅ BUG 1 FIX SUCCESSFUL: ${runtimeErrors.length} runtime errors detected (≥3 required)${colors.reset}`);
      return { success: true, errorsFound: runtimeErrors.length };
    } else {
      console.log(`${colors.red}❌ BUG 1 FIX FAILED: Only ${runtimeErrors.length} runtime errors detected (3+ required)${colors.reset}`);
      return { success: false, errorsFound: runtimeErrors.length };
    }
  } catch (error) {
    console.log(`${colors.red}❌ BUG 1 TEST ERROR: ${error.message}${colors.reset}`);
    return { success: false, errorsFound: 0 };
  }
}

/**
 * BUG 2 TEST: Naming Convention False Positives
 * Test built-in parameters that should NOT trigger naming violations
 */
async function testBug2NamingConventionFalsePositives() {
  console.log(`\n${colors.bold}${colors.blue}TEST 2: Naming Convention False Positives (BUG 2)${colors.reset}`);
  
  // Test code with built-in parameters using REQUIRED snake_case format
  const testCode = `
//@version=6
strategy("Test Strategy", shorttitle="TEST", overlay=false)

// Built-in parameters that MUST use snake_case (should NOT trigger violations)
table.cell(table_id=performanceTable, column=1, row=11, text="Test", text_color=color.white)
table.cell(table_id=performanceTable, column=1, row=0, text="Basic", text_color=color.blue)
box.new(left=bar_index, top=high, right=bar_index+10, bottom=low, text_color=color.green)
strategy.entry(id="LONG", direction=strategy.long, qty=1, oca_name="Main")
strategy.exit(id="EXIT", from_entry="LONG", profit=100, oca_name="Main")

// User-defined variables that SHOULD trigger suggestions (camelCase)
var userDefinedVariable = 10     // Should suggest snake_case
var anotherCamelCase = 20        // Should suggest snake_case
`;

  console.log(`${colors.yellow}Testing built-in parameters that should NOT trigger false positives...${colors.reset}`);

  try {
    const result = await quickValidateParameterNaming(testCode);
    
    // Count false positives: violations on built-in parameters using correct snake_case
    const builtInParameterViolations = result.violations.filter(violation => {
      const builtInParams = ['table_id', 'text_color', 'oca_name'];
      return builtInParams.includes(violation.parameterName);
    });
    
    // Count legitimate suggestions for user variables
    const userVariableViolations = result.violations.filter(violation => {
      const userVars = ['userDefinedVariable', 'anotherCamelCase'];
      return userVars.includes(violation.parameterName);
    });

    console.log(`${colors.white}Built-in Parameter False Positives: ${builtInParameterViolations.length}${colors.reset}`);
    console.log(`${colors.white}User Variable Suggestions: ${userVariableViolations.length}${colors.reset}`);
    
    if (builtInParameterViolations.length > 0) {
      console.log(`${colors.red}False Positives Found:${colors.reset}`);
      builtInParameterViolations.forEach((violation, index) => {
        console.log(`  ${index + 1}. Line ${violation.line}: ${violation.parameterName} (${violation.severity})`);
        console.log(`     ${violation.message}`);
      });
    }

    if (userVariableViolations.length > 0) {
      console.log(`${colors.cyan}Legitimate User Variable Suggestions:${colors.reset}`);
      userVariableViolations.forEach((violation, index) => {
        console.log(`  ${index + 1}. Line ${violation.line}: ${violation.parameterName} (${violation.severity})`);
      });
    }

    // SUCCESS CRITERIA: Must eliminate false positives for built-in parameters (208 → 0)
    if (builtInParameterViolations.length === 0) {
      console.log(`${colors.green}✅ BUG 2 FIX SUCCESSFUL: ${builtInParameterViolations.length} false positives (0 required)${colors.reset}`);
      return { success: true, falsePositives: builtInParameterViolations.length };
    } else {
      console.log(`${colors.red}❌ BUG 2 FIX FAILED: ${builtInParameterViolations.length} false positives found (0 required)${colors.reset}`);
      return { success: false, falsePositives: builtInParameterViolations.length };
    }
  } catch (error) {
    console.log(`${colors.red}❌ BUG 2 TEST ERROR: ${error.message}${colors.reset}`);
    return { success: false, falsePositives: -1 };
  }
}

/**
 * COMBINED TEST: Both bugs in single code scenario
 */
async function testCombinedScenario() {
  console.log(`\n${colors.bold}${colors.blue}TEST 3: Combined Scenario (Both Bugs)${colors.reset}`);
  
  const testCode = `
//@version=6
strategy("Combined Test", shorttitle="COMBINED", overlay=false)

// User-defined type
type TradeData
    float profit
    float drawdown
    int count

// NA object initialization (BUG 1 test)
var TradeData tradeStats = na

// Built-in parameter usage (BUG 2 test)
var performanceTable = table.new(position=position.top_right, columns=2, rows=5, 
                                 bgcolor=color.white, border_color=color.black)

table.cell(table_id=performanceTable, column=0, row=0, text="Metric", text_color=color.blue)
table.cell(table_id=performanceTable, column=1, row=0, text="Value", text_color=color.red)

// Runtime errors (should be detected)
currentProfit = tradeStats.profit      // ERROR: na object access
currentDrawdown = tradeStats.drawdown  // ERROR: na object access
historicalCount = (tradeStats[1]).count // ERROR: historical na access

// User variable (should suggest improvement)
var myCustomVariable = 100  // Should suggest snake_case

plot(currentProfit)
`;

  console.log(`${colors.yellow}Testing combined scenario with both bug patterns...${colors.reset}`);

  try {
    // Test runtime NA object access
    const naResult = await quickValidateRuntimeNAObjectAccess(testCode);
    const runtimeErrors = naResult.violations.filter(v => v.severity === 'error');
    
    // Test naming conventions
    const namingResult = await quickValidateParameterNaming(testCode);
    const namingFalsePositives = namingResult.violations.filter(violation => {
      const builtInParams = ['table_id', 'text_color', 'border_color'];
      return builtInParams.includes(violation.parameterName);
    });
    
    console.log(`${colors.white}Combined Results:${colors.reset}`);
    console.log(`  Runtime Errors Found: ${runtimeErrors.length}`);
    console.log(`  Naming False Positives: ${namingFalsePositives.length}`);
    
    const combinedSuccess = runtimeErrors.length >= 3 && namingFalsePositives.length === 0;
    
    if (combinedSuccess) {
      console.log(`${colors.green}✅ COMBINED TEST SUCCESSFUL: Both fixes working correctly${colors.reset}`);
      return { success: true, runtimeErrors: runtimeErrors.length, falsePositives: namingFalsePositives.length };
    } else {
      console.log(`${colors.red}❌ COMBINED TEST FAILED: Issues detected${colors.reset}`);
      return { success: false, runtimeErrors: runtimeErrors.length, falsePositives: namingFalsePositives.length };
    }
  } catch (error) {
    console.log(`${colors.red}❌ COMBINED TEST ERROR: ${error.message}${colors.reset}`);
    return { success: false, runtimeErrors: 0, falsePositives: -1 };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  const startTime = performance.now();
  
  console.log(`${colors.bold}Running comprehensive bug fix validation...${colors.reset}\n`);
  
  const results = {
    bug1: await testBug1RuntimeNAObjectAccess(),
    bug2: await testBug2NamingConventionFalsePositives(),
    combined: await testCombinedScenario()
  };
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  console.log(`\n${colors.bold}${colors.cyan}=== FINAL RESULTS ===${colors.reset}`);
  console.log(`${colors.white}Total Test Time: ${totalTime.toFixed(2)}ms${colors.reset}`);
  
  const allPassed = results.bug1.success && results.bug2.success && results.combined.success;
  
  if (allPassed) {
    console.log(`${colors.bold}${colors.green}🎉 ALL TESTS PASSED - Both critical bugs fixed!${colors.reset}`);
    console.log(`${colors.green}✅ BUG 1 (Runtime NA Object): ${results.bug1.errorsFound} errors detected${colors.reset}`);
    console.log(`${colors.green}✅ BUG 2 (Naming False Positives): ${results.bug2.falsePositives} false positives${colors.reset}`);
    console.log(`${colors.green}✅ COMBINED TEST: ${results.combined.runtimeErrors} runtime errors, ${results.combined.falsePositives} false positives${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}❌ TESTS FAILED - Bug fixes need attention${colors.reset}`);
    console.log(`${colors.red}BUG 1: ${results.bug1.success ? 'PASSED' : 'FAILED'} (${results.bug1.errorsFound} errors)${colors.reset}`);
    console.log(`${colors.red}BUG 2: ${results.bug2.success ? 'PASSED' : 'FAILED'} (${results.bug2.falsePositives} false positives)${colors.reset}`);
    console.log(`${colors.red}COMBINED: ${results.combined.success ? 'PASSED' : 'FAILED'}${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Test suite failed with error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});