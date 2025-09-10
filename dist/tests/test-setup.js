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
import { initializeDocumentationLoader } from '../src/parser/documentation-loader.js';
console.log('[Test Setup] Global setup file loaded');
/**
 * Global setup function called once before all tests
 * Ensures documentation is preloaded for optimal test performance
 */
export async function setup() {
    console.log('[Test Setup] Initializing documentation loader for test environment...');
    try {
        // Initialize documentation loader with error handling
        await initializeDocumentationLoader();
        console.log('[Test Setup] Documentation loader successfully initialized');
    }
    catch (error) {
        console.error('[Test Setup] Failed to initialize documentation loader:', error);
        // Don't fail tests if documentation can't be loaded - allow graceful degradation
        console.warn('[Test Setup] Tests will proceed without preloaded documentation');
    }
}
/**
 * Global teardown function called once after all tests
 * Currently no cleanup needed but provides hook for future requirements
 */
export async function teardown() {
    console.log('[Test Setup] Test environment teardown complete');
}
