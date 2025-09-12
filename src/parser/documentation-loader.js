/**
 * PineScript Documentation-Based Function Registry
 *
 * Forward-compatible system that loads function definitions from processed documentation
 * to dynamically identify built-in function parameters, eliminating hardcoded lists.
 *
 * This approach ensures:
 * 1. Zero maintenance when TradingView adds new functions
 * 2. Automatic support for all documented function parameters
 * 3. Always up-to-date with current PineScript API
 */
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Documentation-based parameter registry for forward-compatible validation
 * PERFORMANCE-OPTIMIZED: Pre-loads all documentation at service initialization
 */
export class PineScriptDocumentationLoader {
    registry = new Map();
    loaded = false;
    documentationPath;
    loadingPromise = null;
    constructor(documentationPath) {
        // Default to docs/processed/language-reference.json relative to project root
        this.documentationPath =
            documentationPath || join(__dirname, '../../docs/processed/language-reference.json');
    }
    /**
     * Load function definitions from processed documentation
     * OPTIMIZED: Uses singleton pattern to prevent duplicate loading
     * @returns Promise that resolves when documentation is loaded
     */
    async loadDocumentation() {
        // Return existing promise if already loading
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        // Return immediately if already loaded
        if (this.loaded) {
            return Promise.resolve();
        }
        // Create loading promise
        this.loadingPromise = this.performLoad();
        return this.loadingPromise;
    }
    /**
     * Perform the actual documentation loading
     * @private
     */
    async performLoad() {
        try {
            const startTime = Date.now();
            const documentationContent = await fs.readFile(this.documentationPath, 'utf-8');
            const rawDocumentation = JSON.parse(documentationContent);
            // Build function parameter registry from documentation
            // This creates an optimized in-memory lookup table
            let totalParameters = 0;
            // Check if documentation has a 'functions' property (new structure)
            let functionsData;
            if ('functions' in rawDocumentation && rawDocumentation.functions) {
                functionsData = rawDocumentation.functions;
            }
            else {
                functionsData = rawDocumentation;
            }
            for (const [functionId, functionDef] of Object.entries(functionsData)) {
                if (functionId.startsWith('fun_') && functionDef && functionDef.arguments) {
                    const functionName = functionDef.name;
                    const parameterNames = functionDef.arguments.map((arg) => arg.name);
                    this.registry.set(functionName, new Set(parameterNames));
                    totalParameters += parameterNames.length;
                }
            }
            const loadTime = Date.now() - startTime;
            this.loaded = true;
            console.log(`[PineScriptDocumentationLoader] Successfully loaded ${this.registry.size} functions ` +
                `with ${totalParameters} parameters in ${loadTime}ms`);
        }
        catch (error) {
            console.error('[PineScriptDocumentationLoader] Failed to load documentation:', error);
            this.loadingPromise = null; // Reset to allow retry
            throw new Error(`Failed to load PineScript documentation: ${error}`);
        }
    }
    /**
     * Check if a parameter name is valid for a specific function
     * @param functionName - Function name (e.g., "table.cell", "strategy.entry")
     * @param parameterName - Parameter name to validate
     * @returns True if parameter is valid for the function
     */
    isValidFunctionParameter(functionName, parameterName) {
        if (!this.loaded) {
            throw new Error('Documentation not loaded. Call loadDocumentation() first.');
        }
        const functionParameters = this.registry.get(functionName);
        return functionParameters ? functionParameters.has(parameterName) : false;
    }
    /**
     * Get all valid parameter names for a function
     * @param functionName - Function name
     * @returns Set of valid parameter names, or null if function not found
     */
    getFunctionParameters(functionName) {
        if (!this.loaded) {
            throw new Error('Documentation not loaded. Call loadDocumentation() first.');
        }
        return this.registry.get(functionName) || null;
    }
    /**
     * Get all registered function names
     * @returns Array of function names
     */
    getFunctionNames() {
        if (!this.loaded) {
            throw new Error('Documentation not loaded. Call loadDocumentation() first.');
        }
        return Array.from(this.registry.keys());
    }
    /**
     * Check if documentation has been loaded
     * @returns True if documentation is loaded
     */
    isLoaded() {
        return this.loaded;
    }
    /**
     * Get statistics about loaded documentation
     * @returns Object with registry statistics
     */
    getStatistics() {
        if (!this.loaded) {
            return { functionsLoaded: 0, totalParameters: 0 };
        }
        let totalParameters = 0;
        for (const parameters of this.registry.values()) {
            totalParameters += parameters.size;
        }
        return {
            functionsLoaded: this.registry.size,
            totalParameters,
        };
    }
    /**
     * Reset the loader (mainly for testing)
     */
    reset() {
        this.registry.clear();
        this.loaded = false;
    }
}
// Singleton instance for application-wide use
export const documentationLoader = new PineScriptDocumentationLoader();
/**
 * Initialize documentation loader at service startup
 * CRITICAL: Call this during service initialization for maximum performance
 * @returns Promise that resolves when all documentation is loaded into memory
 */
export async function initializeDocumentationLoader() {
    console.log('[PineScriptDocumentationLoader] Initializing documentation at service startup...');
    await documentationLoader.loadDocumentation();
    console.log('[PineScriptDocumentationLoader] Documentation initialization complete.');
}
