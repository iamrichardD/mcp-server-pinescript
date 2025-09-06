#!/usr/bin/env node

/**
 * MCP Integration Test for Bug Fixes
 * 
 * Tests the exact path used by the MCP service: quickValidateFunctionSignatures
 * This ensures both bug fixes work through the actual MCP service integration.
 */

import { quickValidateFunctionSignatures } from './src/parser/index.js';

// Test the exact same code pattern from the bug report
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
sampleSize = kellyData.sampleSize  // ERROR: Cannot access field of undefined (na) object
winRate = kellyData.winRate        // ERROR: Cannot access field of undefined (na) object

// Another pattern - accessing na object field in history
historicalSample = (kellyData[1]).sampleSize  // ERROR if kellyData[1] is na

// Built-in parameter test (should not trigger false positives)
table.cell(table_id=performanceTable, column=1, row=0, text="Test", text_color=color.white)

plot(sampleSize)
`;

console.log('Testing MCP Service Integration Path: quickValidateFunctionSignatures');
console.log('Expected: 3+ runtime errors detected as "error" severity');
console.log('Expected: 0 false positives on built-in parameters\n');

async function testMCPIntegration() {
  try {
    const result = await quickValidateFunctionSignatures(testCode);
    
    console.log('=== MCP Integration Results ===');
    console.log(`Total violations: ${result.violations.length}`);
    
    // Count runtime errors
    const runtimeErrors = result.violations.filter(v => 
      v.severity === 'error' && 
      (v.category === 'runtime_error' || v.rule.includes('na_object'))
    );
    
    // Count false positives on built-in parameters
    const builtinFalsePositives = result.violations.filter(v => {
      const builtInParams = ['table_id', 'text_color'];
      return builtInParams.some(param => v.message && v.message.includes(param));
    });
    
    console.log(`Runtime errors found: ${runtimeErrors.length}`);
    console.log(`Built-in parameter false positives: ${builtinFalsePositives.length}`);
    
    // Show runtime errors
    if (runtimeErrors.length > 0) {
      console.log('\n--- Runtime Errors (BUG 1 Fix) ---');
      runtimeErrors.forEach((error, i) => {
        console.log(`${i+1}. Line ${error.line}: ${error.rule}`);
        console.log(`   ${error.message}`);
        console.log(`   Severity: ${error.severity}`);
      });
    }
    
    // Show any false positives
    if (builtinFalsePositives.length > 0) {
      console.log('\n--- False Positives Found (BUG 2 Issue) ---');
      builtinFalsePositives.forEach((error, i) => {
        console.log(`${i+1}. Line ${error.line}: ${error.message}`);
      });
    }
    
    // Determine success
    const bug1Success = runtimeErrors.length >= 3;
    const bug2Success = builtinFalsePositives.length === 0;
    
    console.log('\n=== SUCCESS CRITERIA ===');
    console.log(`BUG 1 (Runtime NA Object): ${bug1Success ? '✅ PASSED' : '❌ FAILED'} (${runtimeErrors.length}/3+ runtime errors)`);
    console.log(`BUG 2 (Naming False Positives): ${bug2Success ? '✅ PASSED' : '❌ FAILED'} (${builtinFalsePositives.length}/0 false positives)`);
    
    if (bug1Success && bug2Success) {
      console.log('\n🎉 MCP INTEGRATION TEST PASSED - Both critical bugs fixed!');
      return true;
    } else {
      console.log('\n❌ MCP INTEGRATION TEST FAILED - Issues detected');
      return false;
    }
    
  } catch (error) {
    console.error('MCP Integration test failed with error:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testMCPIntegration().then(success => {
  process.exit(success ? 0 : 1);
});