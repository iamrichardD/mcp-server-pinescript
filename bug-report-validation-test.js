#!/usr/bin/env node

/**
 * Bug Report Validation Test
 * 
 * Tests using the EXACT code from the bug reports to verify that
 * both critical bugs are now fixed according to the success criteria.
 * 
 * BUG 1 SUCCESS CRITERIA: Must detect 3+ runtime errors as "error" severity
 * BUG 2 SUCCESS CRITERIA: Must eliminate false positives (208 → 0) on built-in parameters
 */

import { quickValidateFunctionSignatures } from './src/parser/index.js';

// ANSI colors for output
const colors = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m', bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.cyan}=== Bug Report Validation Test ===${colors.reset}\n`);

/**
 * Test the EXACT code from BUG REPORT 1: Runtime NA Object Access
 * From: MCP_PINESCRIPT_RUNTIME_NA_OBJECT_BUG_REPORT_02.md
 */
const BUG_1_TEST_CODE = `
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

/**
 * Test code with built-in parameters that were causing false positives in BUG 2
 * From: MCP_PINESCRIPT_NAMING_CONVENTION_BUG.md
 */
const BUG_2_TEST_CODE = `
//@version=6
strategy("Test Strategy", shorttitle="TEST", overlay=false)

// These built-in parameters MUST use snake_case and should NOT trigger violations
table.cell(table_id=performanceTable, column=1, row=11, text=str.tostring(institutionalDeploymentReady), text_color=textColor)
table.cell(table_id=performanceTable, column=1, row=0, text=str.tostring(basicPassRate, "#.##") + "%", text_color=textColor)
table.cell(table_id=performanceTable, column=1, row=9, text=str.tostring(enhancedPassRate, "#.##") + "%", text_color=textColor)

// Strategy functions with built-in parameters
strategy.entry(id="LONG", direction=strategy.long, qty=1, oca_name="Main")
strategy.exit(id="EXIT", from_entry="LONG", profit=100, oca_name="Main", alert_message="Exit")

// More built-in parameters that should not trigger false positives
box.new(left=bar_index, top=high, right=bar_index+10, bottom=low, border_color=color.blue, text_color=color.white)
`;

/**
 * Test BUG 1: Runtime NA Object Access Detection
 */
async function testBug1RuntimeErrors() {
  console.log(`${colors.bold}${colors.blue}Testing BUG 1: Runtime NA Object Access Detection${colors.reset}`);
  console.log(`${colors.yellow}Using exact code from bug report...${colors.reset}\n`);
  
  try {
    const result = await quickValidateFunctionSignatures(BUG_1_TEST_CODE);
    
    // Filter for runtime errors with "error" severity
    const runtimeErrors = result.violations.filter(v => 
      v.severity === 'error' && 
      (v.category === 'runtime_error' || v.rule.includes('na_object'))
    );
    
    console.log(`${colors.white}Runtime Errors Found: ${runtimeErrors.length}${colors.reset}`);
    
    if (runtimeErrors.length > 0) {
      runtimeErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. Line ${error.line}, Column ${error.column}: ${colors.red}${error.rule}${colors.reset}`);
        console.log(`     Message: ${error.message}`);
        console.log(`     Category: ${error.category}`);
        console.log(`     Severity: ${error.severity}`);
        if (error.suggested_fix) {
          console.log(`     Fix: ${error.suggested_fix}`);
        }
        console.log('');
      });
    }
    
    // SUCCESS CRITERIA: Must detect 3+ runtime errors as "error" severity
    const success = runtimeErrors.length >= 3;
    
    if (success) {
      console.log(`${colors.green}✅ BUG 1 SUCCESS: ${runtimeErrors.length} runtime errors detected (≥3 required)${colors.reset}`);
      console.log(`${colors.green}   All errors have "error" severity and "runtime_error" category${colors.reset}\n`);
    } else {
      console.log(`${colors.red}❌ BUG 1 FAILURE: Only ${runtimeErrors.length} runtime errors detected (3+ required)${colors.reset}\n`);
    }
    
    return { success, errorsFound: runtimeErrors.length };
  } catch (error) {
    console.log(`${colors.red}❌ BUG 1 TEST ERROR: ${error.message}${colors.reset}\n`);
    return { success: false, errorsFound: 0 };
  }
}

/**
 * Test BUG 2: Naming Convention False Positives
 */
async function testBug2FalsePositives() {
  console.log(`${colors.bold}${colors.blue}Testing BUG 2: Naming Convention False Positives${colors.reset}`);
  console.log(`${colors.yellow}Using built-in parameters that previously caused false positives...${colors.reset}\n`);
  
  try {
    const result = await quickValidateFunctionSignatures(BUG_2_TEST_CODE);
    
    // Filter for naming convention violations on built-in parameters
    const builtInParamViolations = result.violations.filter(v => {
      // Check if violation is about built-in parameters that use required snake_case
      const builtInParams = ['table_id', 'text_color', 'oca_name', 'alert_message', 'border_color'];
      return v.rule && (
        v.rule.includes('NAMING_CONVENTION') || 
        v.rule.includes('naming_convention')
      ) && builtInParams.some(param => 
        v.message && v.message.includes(param)
      );
    });
    
    // Count all naming violations for analysis
    const allNamingViolations = result.violations.filter(v => 
      v.rule && (v.rule.includes('NAMING_CONVENTION') || v.rule.includes('naming_convention'))
    );
    
    console.log(`${colors.white}Total Naming Violations: ${allNamingViolations.length}${colors.reset}`);
    console.log(`${colors.white}Built-in Parameter False Positives: ${builtInParamViolations.length}${colors.reset}`);
    
    if (builtInParamViolations.length > 0) {
      console.log(`${colors.red}False Positives Found:${colors.reset}`);
      builtInParamViolations.forEach((violation, i) => {
        console.log(`  ${i + 1}. Line ${violation.line}: ${violation.message}`);
        console.log(`     Rule: ${violation.rule}`);
        console.log(`     Severity: ${violation.severity}`);
      });
    } else {
      console.log(`${colors.green}No false positives detected on built-in parameters${colors.reset}`);
    }
    
    if (allNamingViolations.length > 0) {
      console.log(`${colors.cyan}All Naming Violations (for analysis):${colors.reset}`);
      allNamingViolations.forEach((violation, i) => {
        console.log(`  ${i + 1}. Line ${violation.line}: ${violation.message}`);
      });
    }
    
    // SUCCESS CRITERIA: Must eliminate false positives (208 → 0) on built-in parameters
    const success = builtInParamViolations.length === 0;
    
    if (success) {
      console.log(`\n${colors.green}✅ BUG 2 SUCCESS: ${builtInParamViolations.length} false positives (0 required)${colors.reset}`);
      console.log(`${colors.green}   Built-in parameters using required snake_case are no longer flagged${colors.reset}\n`);
    } else {
      console.log(`\n${colors.red}❌ BUG 2 FAILURE: ${builtInParamViolations.length} false positives found (0 required)${colors.reset}\n`);
    }
    
    return { success, falsePositives: builtInParamViolations.length };
  } catch (error) {
    console.log(`${colors.red}❌ BUG 2 TEST ERROR: ${error.message}${colors.reset}\n`);
    return { success: false, falsePositives: -1 };
  }
}

/**
 * Main test runner
 */
async function runBugReportValidation() {
  const startTime = performance.now();
  
  console.log(`${colors.bold}Validating fixes for both critical MCP service bugs...${colors.reset}\n`);
  
  const bug1Result = await testBug1RuntimeErrors();
  const bug2Result = await testBug2FalsePositives();
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  console.log(`${colors.bold}${colors.cyan}=== BUG REPORT VALIDATION RESULTS ===${colors.reset}`);
  console.log(`${colors.white}Total Test Time: ${totalTime.toFixed(2)}ms${colors.reset}`);
  
  const overallSuccess = bug1Result.success && bug2Result.success;
  
  if (overallSuccess) {
    console.log(`${colors.bold}${colors.green}🎉 ALL BUG FIXES VALIDATED SUCCESSFULLY!${colors.reset}`);
    console.log(`${colors.green}✅ BUG 1 (Runtime NA Object): ${bug1Result.errorsFound} runtime errors detected${colors.reset}`);
    console.log(`${colors.green}✅ BUG 2 (Naming False Positives): ${bug2Result.falsePositives} false positives eliminated${colors.reset}`);
    console.log(`${colors.green}🚀 MCP service now detects critical runtime errors and eliminates false positives${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}❌ BUG VALIDATION FAILED${colors.reset}`);
    console.log(`${colors.red}BUG 1: ${bug1Result.success ? 'FIXED' : 'NOT FIXED'} (${bug1Result.errorsFound} errors)${colors.reset}`);
    console.log(`${colors.red}BUG 2: ${bug2Result.success ? 'FIXED' : 'NOT FIXED'} (${bug2Result.falsePositives} false positives)${colors.reset}`);
    console.log(`${colors.red}Further investigation needed for failing components${colors.reset}`);
    process.exit(1);
  }
}

// Run the validation
runBugReportValidation().catch(error => {
  console.error(`${colors.red}Bug report validation failed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});