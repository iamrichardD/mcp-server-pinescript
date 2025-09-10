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
export interface FunctionArgument {
    name: string;
    type: string;
    description: string;
}
export interface FunctionDefinition {
    id: string;
    name: string;
    description: string;
    syntax: string;
    arguments: FunctionArgument[];
    examples?: string[];
    type?: string;
    seeAlso?: Array<{
        name: string;
        href: string;
    }>;
}
export interface DocumentationWithFunctions {
    functions: {
        [functionId: string]: FunctionDefinition;
    };
}
export interface DocumentationRegistry {
    [functionId: string]: FunctionDefinition;
}
/**
 * Documentation-based parameter registry for forward-compatible validation
 * PERFORMANCE-OPTIMIZED: Pre-loads all documentation at service initialization
 */
export declare class PineScriptDocumentationLoader {
    private registry;
    private loaded;
    private documentationPath;
    private loadingPromise;
    constructor(documentationPath?: string);
    /**
     * Load function definitions from processed documentation
     * OPTIMIZED: Uses singleton pattern to prevent duplicate loading
     * @returns Promise that resolves when documentation is loaded
     */
    loadDocumentation(): Promise<void>;
    /**
     * Perform the actual documentation loading
     * @private
     */
    private performLoad;
    /**
     * Check if a parameter name is valid for a specific function
     * @param functionName - Function name (e.g., "table.cell", "strategy.entry")
     * @param parameterName - Parameter name to validate
     * @returns True if parameter is valid for the function
     */
    isValidFunctionParameter(functionName: string, parameterName: string): boolean;
    /**
     * Get all valid parameter names for a function
     * @param functionName - Function name
     * @returns Set of valid parameter names, or null if function not found
     */
    getFunctionParameters(functionName: string): Set<string> | null;
    /**
     * Get all registered function names
     * @returns Array of function names
     */
    getFunctionNames(): string[];
    /**
     * Check if documentation has been loaded
     * @returns True if documentation is loaded
     */
    isLoaded(): boolean;
    /**
     * Get statistics about loaded documentation
     * @returns Object with registry statistics
     */
    getStatistics(): {
        functionsLoaded: number;
        totalParameters: number;
    };
    /**
     * Reset the loader (mainly for testing)
     */
    reset(): void;
}
export declare const documentationLoader: PineScriptDocumentationLoader;
/**
 * Initialize documentation loader at service startup
 * CRITICAL: Call this during service initialization for maximum performance
 * @returns Promise that resolves when all documentation is loaded into memory
 */
export declare function initializeDocumentationLoader(): Promise<void>;
