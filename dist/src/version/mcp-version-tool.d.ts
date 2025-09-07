export interface VersionInfo {
    version: string;
    buildTimestamp: string;
    commitHash: string;
    bugFixes: {
        runtimeNaObjectAccess: "RESOLVED" | "PENDING";
        namingConventionFalsePositives: "RESOLVED" | "PENDING";
    };
    deploymentStatus: "PRODUCTION_READY" | "DEVELOPMENT" | "BUILD_REQUIRED";
    buildInfo: {
        nodeVersion: string;
        typescriptCompilation: "SUCCESS" | "FAILED";
        lastBuildTime?: string;
    };
    gitInfo: {
        branch: string;
        isDirty: boolean;
        lastCommitDate: string;
    };
}
/**
 * Generate comprehensive version information
 */
export declare function generateVersionInfo(): VersionInfo;
/**
 * Format version info for MCP tool response
 */
export declare function formatVersionInfoForMCP(versionInfo: VersionInfo): string;
/**
 * Main export for MCP service version tool
 */
export declare function getServiceVersionInfo(): Promise<string>;
