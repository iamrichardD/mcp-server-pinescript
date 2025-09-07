/**
 * Comprehensive Test Suite for Parameter Naming Convention Validation
 *
 * This test suite validates the parameter naming validation system against
 * various Pine Script function calls and naming convention violations.
 */
import { ParameterNamingValidator, quickValidateParameterNaming, } from "./parameter-naming-validator.js";
/**
 * Test cases covering different parameter naming scenarios
 */
const testCases = [
    // Deprecated parameter migrations (should trigger DEPRECATED_PARAMETER_NAME)
    {
        name: "table.cell with deprecated textColor",
        code: 'table.cell(perfTable, 0, 0, "Title", textColor = color.white, bgcolor = color.navy)',
        expectedViolations: 1,
        expectedErrorCodes: ["DEPRECATED_PARAMETER_NAME"],
        expectedSuggestions: ["text_color"],
    },
    {
        name: "table.cell with multiple deprecated parameters",
        code: 'table.cell(myTable, 1, 2, "Value", textColor = color.black, textSize = size.normal)',
        expectedViolations: 2,
        expectedErrorCodes: ["DEPRECATED_PARAMETER_NAME", "DEPRECATED_PARAMETER_NAME"],
        expectedSuggestions: ["text_color", "text_size"],
    },
    // Correct parameter naming (should pass)
    {
        name: "table.cell with correct parameters",
        code: 'table.cell(perfTable, 0, 0, "Title", text_color = color.white, bgcolor = color.navy)',
        expectedViolations: 0,
        expectedErrorCodes: [],
    },
    {
        name: "plot with correct single-word parameters",
        code: 'plot(high+low, title="Title", color=color.green, linewidth=2, style=plot.style_area, offset=15)',
        expectedViolations: 0,
        expectedErrorCodes: [],
    },
    {
        name: "input.int with correct parameters including hidden ones",
        code: 'input.int(10, "Length 1", minval=5, maxval=21, step=1)',
        expectedViolations: 0,
        expectedErrorCodes: [],
    },
    // General naming convention violations
    {
        name: "strategy.entry with camelCase parameter",
        code: "strategy.entry(id, direction, qty, qtyPercent = 50)",
        expectedViolations: 1,
        expectedErrorCodes: ["INVALID_PARAMETER_NAMING_CONVENTION"],
        expectedSuggestions: ["qty_percent"],
    },
    {
        name: "box.new with PascalCase parameter",
        code: "box.new(top_left, bottom_right, BorderColor = color.blue)",
        expectedViolations: 1,
        expectedErrorCodes: ["INVALID_PARAMETER_NAMING_CONVENTION"],
        expectedSuggestions: ["border_color"],
    },
    {
        name: "label.new with ALL_CAPS parameter",
        code: "label.new(bar_index, high, TEXT_COLOR = color.red)",
        expectedViolations: 1,
        expectedErrorCodes: ["INVALID_PARAMETER_NAMING_CONVENTION"],
        expectedSuggestions: ["text_color"],
    },
    // Complex nested function calls
    {
        name: "nested function call with mixed violations",
        code: "plot(ta.sma(close, input.int(20, minval=1)), lineWidth=2, textColor=color.green)",
        expectedViolations: 2, // lineWidth (camelCase) and textColor (deprecated/camelCase for plot)
        expectedErrorCodes: [
            "INVALID_PARAMETER_NAMING_CONVENTION",
            "INVALID_PARAMETER_NAMING_CONVENTION",
        ],
    },
    // Multiple function calls in same line
    {
        name: "multiple function calls with violations",
        code: 'table.cell(t, 0, 0, "A", textColor=color.white) and plot(close, lineWidth=3)',
        expectedViolations: 2,
        expectedErrorCodes: ["DEPRECATED_PARAMETER_NAME", "INVALID_PARAMETER_NAMING_CONVENTION"],
    },
    // Edge cases
    {
        name: "function call with no named parameters",
        code: "plot(close)",
        expectedViolations: 0,
        expectedErrorCodes: [],
    },
    {
        name: "function call with mixed positional and named parameters",
        code: 'plot(close, "My Plot", color.blue, linewidth = 2, trackprice = true)',
        expectedViolations: 0,
        expectedErrorCodes: [],
    },
];
/**
 * Run a single test case
 * @param {Object} testCase - Test case object
 * @returns {Object} Test result
 */
async function runTestCase(testCase) {
    try {
        const result = await quickValidateParameterNaming(testCase.code);
        const success = result.violations.length === testCase.expectedViolations &&
            result.violations.every((violation, index) => violation.errorCode === testCase.expectedErrorCodes[index]);
        return {
            name: testCase.name,
            success,
            result,
            expected: {
                violations: testCase.expectedViolations,
                errorCodes: testCase.expectedErrorCodes,
                suggestions: testCase.expectedSuggestions || [],
            },
        };
    }
    catch (error) {
        return {
            name: testCase.name,
            success: false,
            error: error.message,
            result: null,
            expected: {
                violations: testCase.expectedViolations,
                errorCodes: testCase.expectedErrorCodes,
                suggestions: testCase.expectedSuggestions || [],
            },
        };
    }
}
/**
 * Run all test cases
 * @returns {Object} Complete test results
 */
async function runAllTests() {
    console.log("🧪 Running Parameter Naming Convention Validation Tests\n");
    const results = [];
    const totalTests = testCases.length;
    let passedTests = 0;
    for (const testCase of testCases) {
        const testResult = await runTestCase(testCase);
        results.push(testResult);
        if (testResult.success) {
            passedTests++;
            console.log(`✅ ${testResult.name}`);
        }
        else {
            console.log(`❌ ${testResult.name}`);
            console.log(`   Expected: ${testResult.expected.violations} violations`);
            console.log(`   Got: ${testResult.result?.violations?.length || "Error"} violations`);
            if (testResult.error) {
                console.log(`   Error: ${testResult.error}`);
            }
            else if (testResult.result?.violations) {
                console.log(`   Violations found:`);
                testResult.result.violations.forEach((v, i) => {
                    console.log(`     ${i + 1}. ${v.errorCode}: ${v.message}`);
                });
            }
        }
    }
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);
    // Performance summary
    if (results.length > 0) {
        const avgValidationTime = results
            .filter((r) => r.result?.metrics?.validationTimeMs)
            .reduce((sum, r) => sum + r.result.metrics.validationTimeMs, 0) / results.length;
        console.log(`⚡ Average validation time: ${avgValidationTime.toFixed(2)}ms`);
    }
    return {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: (passedTests / totalTests) * 100,
        results,
    };
}
/**
 * Demo function showing the validator in action with detailed output
 */
async function demonstrateValidator() {
    console.log("🎯 Parameter Naming Validator Demonstration\n");
    const demoCode = `
//@version=6
indicator("Parameter Naming Demo", overlay=true)

// This will trigger violations:
length = input.int(20, "Length", minVal=1, maxVal=100)  // camelCase violation
table.cell(myTable, 0, 0, "Test", textColor = color.white)  // deprecated parameter
plot(close, lineWidth=2, textColor=color.blue)  // camelCase violations
box.new(bar_index, high, bar_index+1, low, BorderStyle=line.style_solid)  // PascalCase violation

// This will pass validation:
validLength = input.int(20, "Length", minval=1, maxval=100)  // correct
table.cell(myTable, 0, 0, "Test", text_color = color.white)  // correct
plot(close, linewidth=2, color=color.blue)  // correct
box.new(bar_index, high, bar_index+1, low, border_style=line.style_solid)  // correct
`;
    const result = await quickValidateParameterNaming(demoCode);
    console.log(`📋 Analysis Results:`);
    console.log(`   Functions analyzed: ${result.metrics.functionsAnalyzed}`);
    console.log(`   Violations found: ${result.metrics.violationsFound}`);
    console.log(`   Validation time: ${result.metrics.validationTimeMs}ms`);
    console.log(`   Status: ${result.isValid ? "✅ Valid" : "❌ Invalid"}\n`);
    if (result.violations.length > 0) {
        console.log("🚫 Parameter Naming Violations:\n");
        result.violations.forEach((violation, index) => {
            console.log(`${index + 1}. ${violation.errorCode} (Line ${violation.line})`);
            console.log(`   Function: ${violation.functionName}`);
            console.log(`   Parameter: ${violation.parameterName}`);
            console.log(`   Message: ${violation.message}`);
            console.log(`   Suggested fix: ${violation.suggestedFix}`);
            console.log("");
        });
    }
}
// Export test functions for external use
export { runAllTests, runTestCase, demonstrateValidator, testCases };
// If run directly, execute all tests
if (import.meta.url === `file://${process.argv[1]}`) {
    demonstrateValidator().then(() => {
        console.log("\n" + "=".repeat(60) + "\n");
        return runAllTests();
    });
}
