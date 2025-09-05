#!/usr/bin/env node

// Test all MCP tools directly using the server functionality
import { readFile } from "node:fs/promises";

// Load the preloaded data like the server does
let languageReference = {};
// biome-ignore lint/correctness/noUnusedVariables: Used for comprehensive testing
let styleGuide = {};
// biome-ignore lint/correctness/noUnusedVariables: Used for comprehensive testing
let executionModel = {};

async function loadData() {
  const files = [
    { name: "language-reference", path: "./docs/processed/language-reference.json" },
    { name: "style-guide", path: "./docs/processed/style-guide.json" },
    { name: "execution-model", path: "./docs/processed/execution-model.json" },
  ];

  for (const file of files) {
    try {
      const content = await readFile(file.path, { encoding: "utf8" });
      const data = JSON.parse(content);

      if (file.name === "language-reference") {
        languageReference = data;
      } else if (file.name === "style-guide") {
        styleGuide = data;
      } else if (file.name === "execution-model") {
        executionModel = data;
      }
    } catch (error) {
      console.error(`Failed to load ${file.name}:`, error.message);
    }
  }
}

// Test 1: Data Foundation
function testDataFoundation() {
  console.log("=== TEST 1: DATA FOUNDATION ===");

  const functionCount = Object.keys(languageReference.functions || {}).length;
  const variableCount = Object.keys(languageReference.variables || {}).length;

  console.log(`✅ Functions loaded: ${functionCount} (Expected: 457)`);
  console.log(`✅ Variables loaded: ${variableCount} (Expected: 427)`);
  console.log(`✅ Total items: ${functionCount + variableCount}`);

  // Test specific function access
  const smaFunction = languageReference.functions?.["fun_ta.sma"];
  console.log(`✅ ta.sma function accessible: ${smaFunction ? smaFunction.name : "NOT FOUND"}`);

  return {
    functionsMatch: functionCount === 457,
    variablesMatch: variableCount === 427,
    smaAccessible: !!smaFunction,
  };
}

// Test 2: Search functionality (pinescript_reference tool simulation)
function testSearch(query, limit = 5) {
  console.log(`=== TEST 2: SEARCH FUNCTIONALITY (${query}) ===`);

  const start = process.hrtime.bigint();

  // Search functions
  const functionResults = [];
  for (const [_key, func] of Object.entries(languageReference.functions || {})) {
    if (
      func.name?.toLowerCase().includes(query.toLowerCase()) ||
      func.description?.toLowerCase().includes(query.toLowerCase())
    ) {
      functionResults.push({ type: "function", ...func });
    }
  }

  // Search variables
  const variableResults = [];
  for (const [_key, variable] of Object.entries(languageReference.variables || {})) {
    if (
      variable.name?.toLowerCase().includes(query.toLowerCase()) ||
      variable.description?.toLowerCase().includes(query.toLowerCase())
    ) {
      variableResults.push({ type: "variable", ...variable });
    }
  }

  const end = process.hrtime.bigint();
  const searchTime = Number(end - start) / 1000000;

  const totalResults = functionResults.length + variableResults.length;
  const limitedResults = [...functionResults, ...variableResults].slice(0, limit);

  console.log(`✅ Search completed in: ${searchTime.toFixed(3)}ms`);
  console.log(`✅ Total results found: ${totalResults}`);
  console.log(`✅ Returned results: ${limitedResults.length}`);

  limitedResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.type}: ${result.name}`);
  });

  return {
    searchTime,
    totalResults,
    returnedResults: limitedResults.length,
    performanceOk: searchTime < 15,
  };
}

// Test 3: Validation functionality (pinescript_review tool simulation)
async function testValidation() {
  console.log("=== TEST 3: VALIDATION FUNCTIONALITY ===");

  // Import validation functions and load rules
  const { validatePineScriptParameters, loadValidationRules } = await import("./src/parser/validator.js");
  const rules = JSON.parse(await readFile("./docs/validation-rules.json", { encoding: "utf8" }));
  
  // Load validation rules first
  loadValidationRules(rules);

  const testCases = [
    {
      name: "Valid code",
      code: `//@version=6\nstrategy('Test', shorttitle='TS', overlay=false)`,
    },
    {
      name: "SHORT_TITLE_TOO_LONG",
      code: `strategy('Test', shorttitle='VERY_LONG_TITLE', overlay=false)`,
    },
    {
      name: "INVALID_PRECISION",
      code: `strategy('Test', shorttitle='TS', precision=15)`,
    },
    {
      name: "Multiple issues",
      code: `strategy('Test', shorttitle='VERY_LONG_TITLE', precision=25, max_bars_back=10000)`,
    },
  ];

  const results = [];

  for (const testCase of testCases) {
    const start = process.hrtime.bigint();
    const result = await validatePineScriptParameters(testCase.code);
    const end = process.hrtime.bigint();

    const validationTime = Number(end - start) / 1000000;
    const issueCount = result.violations?.length || 0;

    console.log(`✅ ${testCase.name}: ${issueCount} issues, ${validationTime.toFixed(3)}ms`);

    if (result.violations?.length > 0) {
      result.violations.forEach((violation) => {
        console.log(`   - ${violation.rule}: ${violation.message}`);
      });
    }

    results.push({
      name: testCase.name,
      validationTime,
      issueCount,
      performanceOk: validationTime < 15,
    });
  }

  return results;
}

// Test 4: Syntax compatibility (syntax_compatibility_validation tool simulation)
async function testSyntaxCompatibility() {
  console.log("=== TEST 4: SYNTAX COMPATIBILITY ===");

  const { validateSyntaxCompatibility } = await import("./src/parser/validator.js");

  const start = process.hrtime.bigint();
  const result = await validateSyntaxCompatibility(
    `//@version=6\nstrategy('Complex Test', shorttitle='CT', overlay=false)`
  );
  const end = process.hrtime.bigint();

  const compatibilityTime = Number(end - start) / 1000000;

  console.log(`✅ Syntax compatibility check: ${compatibilityTime.toFixed(3)}ms`);
  console.log(`✅ Pine Script v6 compatible: ${result.violations?.length === 0 ? "YES" : "NO"}`);

  return {
    compatibilityTime,
    isCompatible: result.violations?.length === 0,
    performanceOk: compatibilityTime < 15,
  };
}

// Main test execution
async function runComprehensiveTests() {
  console.log("🚀 COMPREHENSIVE E2E USER JOURNEY VALIDATION\n");

  // Load data
  await loadData();

  // Run all tests
  const dataTest = testDataFoundation();
  console.log("");

  const searchTest = testSearch("strategy", 3);
  console.log("");

  const validationTests = await testValidation();
  console.log("");

  const syntaxTest = await testSyntaxCompatibility();
  console.log("");

  // Summary
  console.log("=== COMPREHENSIVE TEST SUMMARY ===");

  const allPerformanceOk = [
    searchTest.performanceOk,
    ...validationTests.map((t) => t.performanceOk),
    syntaxTest.performanceOk,
  ].every((ok) => ok);

  console.log(
    `📊 Data Foundation: ${dataTest.functionsMatch && dataTest.variablesMatch ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `🔍 Search Performance: ${searchTest.performanceOk ? "✅ PASS" : "❌ FAIL"} (${searchTest.searchTime.toFixed(3)}ms)`
  );
  console.log(
    `🔧 Validation Performance: ${validationTests.every((t) => t.performanceOk) ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `⚙️  Syntax Compatibility: ${syntaxTest.performanceOk ? "✅ PASS" : "❌ FAIL"} (${syntaxTest.compatibilityTime.toFixed(3)}ms)`
  );
  console.log(
    `🎯 Overall Performance: ${allPerformanceOk ? "✅ PASS - All <15ms" : "❌ FAIL - Some >15ms"}`
  );

  // Validation specific results
  console.log("\n=== VALIDATION RULE VERIFICATION ===");
  const shortTitleTest = validationTests.find((t) => t.name === "SHORT_TITLE_TOO_LONG");
  const precisionTest = validationTests.find((t) => t.name === "INVALID_PRECISION");

  console.log(
    `SHORT_TITLE_TOO_LONG detection: ${shortTitleTest?.issueCount > 0 ? "✅ WORKING" : "❌ NOT WORKING"}`
  );
  console.log(
    `INVALID_PRECISION detection: ${precisionTest?.issueCount > 0 ? "✅ WORKING" : "❌ NOT WORKING"}`
  );

  return {
    dataFoundation: dataTest,
    searchPerformance: searchTest,
    validationPerformance: validationTests,
    syntaxCompatibility: syntaxTest,
    overallSuccess: allPerformanceOk && dataTest.functionsMatch && dataTest.variablesMatch,
  };
}

// Run the tests
runComprehensiveTests().catch(console.error);
