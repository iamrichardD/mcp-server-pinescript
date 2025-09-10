/**
 * Global Test Setup for Documentation Loader Initialization
 *
 * Resolves critical issue where documentation loader is not initialized in tests,
 * causing documentation loading errors and performance degradation.
 *
 * This global setup:
 * 1. Initializes documentation loader once for all tests
 * 2. Matches production behavior for optimal performance
 * 3. Eliminates per-test initialization overhead
 * 4. Provides forward-compatible documentation architecture alignment
 */
/**
 * Global setup function called once before all tests
 * Ensures documentation is preloaded for optimal test performance
 */
export declare function setup(): Promise<void>;
/**
 * Global teardown function called once after all tests
 * Currently no cleanup needed but provides hook for future requirements
 */
export declare function teardown(): Promise<void>;
