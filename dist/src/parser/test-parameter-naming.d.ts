/**
 * Run all test cases
 * @returns {Object} Complete test results
 */
export function runAllTests(): Object;
/**
 * Run a single test case
 * @param {Object} testCase - Test case object
 * @returns {Object} Test result
 */
export function runTestCase(testCase: Object): Object;
/**
 * Demo function showing the validator in action with detailed output
 */
export function demonstrateValidator(): Promise<void>;
/**
 * Test cases covering different parameter naming scenarios
 */
export const testCases: ({
    name: string;
    code: string;
    expectedViolations: number;
    expectedErrorCodes: string[];
    expectedSuggestions: string[];
} | {
    name: string;
    code: string;
    expectedViolations: number;
    expectedErrorCodes: string[];
    expectedSuggestions?: never;
})[];
