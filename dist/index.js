#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// @ts-expect-error - JavaScript module without type definitions
import { validateSyntaxCompatibility } from './src/parser/validator.js';
// Import version tool
import { getServiceVersionInfo } from './src/version/mcp-version-tool.js';
// Import documentation loader initialization
import { initializeDocumentationLoader } from './src/parser/documentation-loader.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ========================================
// FILE SYSTEM UTILITIES
// ========================================
function isValidPath(inputPath) {
    // Prevent path traversal attacks
    const normalizedPath = path.normalize(inputPath);
    return (!normalizedPath.includes('..') &&
        (path.isAbsolute(normalizedPath) || inputPath.startsWith('./')));
}
function hasValidExtension(filePath, allowedExtensions) {
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
}
async function safeReadFile(filePath) {
    try {
        if (!isValidPath(filePath)) {
            throw new Error(`Invalid file path: ${filePath}`);
        }
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
            throw new Error(`Path is not a file: ${filePath}`);
        }
        // Limit file size to 10MB for safety
        const maxSize = 10 * 1024 * 1024;
        if (stats.size > maxSize) {
            throw new Error(`File too large: ${filePath} (${Math.round(stats.size / 1024 / 1024)}MB > 10MB)`);
        }
        return await fs.readFile(filePath, 'utf8');
    }
    catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function scanDirectory(dirPath, options = {}) {
    const { recursive = true, extensions = ['.pine', '.pinescript'], maxFiles = 1000 } = options;
    if (!isValidPath(dirPath)) {
        throw new Error(`Invalid directory path: ${dirPath}`);
    }
    const scanner = new DirectoryScanner(dirPath, extensions, maxFiles, recursive);
    return await scanner.scan();
}
class DirectoryScanner {
    dirPath;
    extensions;
    maxFiles;
    recursive;
    files = [];
    constructor(dirPath, extensions, maxFiles, recursive) {
        this.dirPath = dirPath;
        this.extensions = extensions;
        this.maxFiles = maxFiles;
        this.recursive = recursive;
    }
    async scan() {
        await this.scanDirectory(this.dirPath, 0);
        return this.files;
    }
    async scanDirectory(currentPath, depth) {
        if (this.shouldStopScanning(depth)) {
            return;
        }
        try {
            await this.processSingleDirectory(currentPath, depth);
        }
        catch (error) {
            throw new Error(`Failed to scan directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    shouldStopScanning(depth) {
        return depth > 10 || this.files.length >= this.maxFiles;
    }
    async processSingleDirectory(currentPath, depth) {
        const stats = await fs.stat(currentPath);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${currentPath}`);
        }
        const entries = await fs.readdir(currentPath);
        await this.processDirectoryEntries(entries, currentPath, depth);
    }
    async processDirectoryEntries(entries, currentPath, depth) {
        for (const entry of entries) {
            if (this.files.length >= this.maxFiles) {
                break;
            }
            const fullPath = path.join(currentPath, entry);
            await this.processEntry(fullPath, entry, depth);
        }
    }
    async processEntry(fullPath, entry, depth) {
        try {
            const entryStats = await fs.stat(fullPath);
            if (entryStats.isFile()) {
                this.addFileIfValid(fullPath, entryStats);
                return;
            }
            if (entryStats.isDirectory() && this.recursive && !this.shouldSkipDirectory(entry)) {
                await this.scanDirectory(fullPath, depth + 1);
            }
        }
        catch (_entryError) {
            // Silent ignore of stat errors
        }
    }
    addFileIfValid(fullPath, entryStats) {
        if (hasValidExtension(fullPath, this.extensions)) {
            this.files.push({
                path: fullPath,
                relativePath: path.relative(this.dirPath, fullPath),
                size: entryStats.size,
            });
        }
    }
    shouldSkipDirectory(entry) {
        return (entry.startsWith('.') || ['node_modules', '__pycache__', 'dist', 'build'].includes(entry));
    }
}
// ========================================
// GLOBAL STATE MANAGEMENT
// ========================================
// Global variables for preloaded documentation data
let PRELOADED_INDEX = null;
let PRELOADED_STYLE_RULES = null;
let PRELOADED_LANGUAGE_REFERENCE = null;
// ========================================
// DOCUMENTATION PRELOADING
// ========================================
async function preloadDocumentation() {
    const indexPath = path.join(__dirname, 'docs', 'processed', 'index.json');
    const rulesPath = path.join(__dirname, 'docs', 'processed', 'style-rules.json');
    const languageReferencePath = path.join(__dirname, 'docs', 'processed', 'language-reference.json');
    // Check if files exist
    try {
        await fs.access(indexPath);
        await fs.access(rulesPath);
        await fs.access(languageReferencePath);
    }
    catch (_accessError) {
        throw new Error(`Documentation files not found. Please ensure the docs/processed/ directory exists with required files.`);
    }
    // Load all documentation files
    const indexData = await fs.readFile(indexPath, 'utf8');
    const rulesData = await fs.readFile(rulesPath, 'utf8');
    const languageReferenceData = await fs.readFile(languageReferencePath, 'utf8');
    PRELOADED_INDEX = JSON.parse(indexData);
    PRELOADED_STYLE_RULES = JSON.parse(rulesData);
    PRELOADED_LANGUAGE_REFERENCE = JSON.parse(languageReferenceData);
    const stats = {
        indexEntries: Object.keys(PRELOADED_INDEX).length,
        styleRules: Object.keys(PRELOADED_STYLE_RULES).length,
        functionEntries: Object.keys(PRELOADED_LANGUAGE_REFERENCE.functions).length,
        variableEntries: Object.keys(PRELOADED_LANGUAGE_REFERENCE.variables).length,
        totalLanguageItems: PRELOADED_LANGUAGE_REFERENCE.metadata.total_functions +
            PRELOADED_LANGUAGE_REFERENCE.metadata.total_variables,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
    return stats;
}
function validatePreloadedData() {
    if (!PRELOADED_INDEX || !PRELOADED_STYLE_RULES) {
        throw new Error('Critical documentation files not preloaded. Server cannot function properly.');
    }
    if (Object.keys(PRELOADED_INDEX).length === 0) {
        throw new Error('Documentation index is empty. Server cannot provide documentation lookup.');
    }
    return {
        isValid: true,
        indexEntries: Object.keys(PRELOADED_INDEX).length,
        styleRules: Object.keys(PRELOADED_STYLE_RULES).length,
        memoryUsage: process.memoryUsage().heapUsed,
    };
}
// ========================================
// MCP SERVER SETUP
// ========================================
const server = new Server({
    name: 'mcp-server-pinescript',
    version: '3.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [
        {
            name: 'pinescript_reference',
            description: 'Search PineScript documentation with enhanced semantic matching and streaming support for large result sets.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search term or topic with synonym expansion (e.g., "array functions", "style guide naming", "syntax rules")',
                    },
                    version: {
                        type: 'string',
                        description: 'PineScript version (default: v6)',
                        default: 'v6',
                    },
                    format: {
                        type: 'string',
                        enum: ['json', 'stream'],
                        description: 'Output format: json (all results), stream (chunked delivery)',
                        default: 'json',
                    },
                    max_results: {
                        type: 'number',
                        description: 'Maximum results to return (default: 10, max: 100)',
                        default: 10,
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'pinescript_review',
            description: 'Review PineScript code against style guide and language rules. Supports single files, directories, and streaming for large results via JSON chunks.',
            inputSchema: {
                type: 'object',
                properties: {
                    source_type: {
                        type: 'string',
                        enum: ['code', 'file', 'directory'],
                        description: 'Source type: code (string input), file (single file path), directory (scan for .pine files)',
                        default: 'code',
                    },
                    code: {
                        type: 'string',
                        description: 'PineScript code to review (required when source_type=code)',
                    },
                    file_path: {
                        type: 'string',
                        description: 'Path to PineScript file to review (required when source_type=file)',
                    },
                    directory_path: {
                        type: 'string',
                        description: 'Path to directory containing PineScript files (required when source_type=directory)',
                    },
                    format: {
                        type: 'string',
                        enum: ['json', 'markdown', 'stream'],
                        description: 'Output format: json (single response), markdown (formatted), stream (chunked JSON for large files/directories)',
                        default: 'json',
                    },
                    version: {
                        type: 'string',
                        description: 'PineScript version (default: v6)',
                        default: 'v6',
                    },
                    chunk_size: {
                        type: 'number',
                        description: 'For stream format: violations per chunk (default: 20, max: 100)',
                        default: 20,
                    },
                    severity_filter: {
                        type: 'string',
                        enum: ['all', 'error', 'warning', 'suggestion'],
                        description: 'Filter violations by severity (default: all)',
                        default: 'all',
                    },
                    recursive: {
                        type: 'boolean',
                        description: 'For directory source: scan subdirectories recursively (default: true)',
                        default: true,
                    },
                    file_extensions: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'File extensions to scan for (default: [".pine", ".pinescript"])',
                        default: ['.pine', '.pinescript'],
                    },
                },
                required: [],
            },
        },
        {
            name: 'syntax_compatibility_validation',
            description: 'Validate Pine Script code for v6 syntax compatibility and migration requirements.',
            inputSchema: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Pine Script source code to validate for syntax compatibility',
                    },
                    format: {
                        type: 'string',
                        enum: ['json', 'markdown'],
                        description: 'Output format for validation results',
                        default: 'json',
                    },
                    migration_guide: {
                        type: 'boolean',
                        description: 'Include migration guidance for deprecated functions',
                        default: false,
                    },
                },
                required: ['code'],
            },
        },
        {
            name: 'mcp_service_version',
            description: 'Get authoritative version information from package.json plus deployment diagnostics including build status, git commit, and bug fix resolution status.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    ];
    return { tools };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await handleToolRequest(request);
});
// Extract tool request handler logic
async function handleToolRequest(request) {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'pinescript_reference':
            return await handleReferenceRequest(args);
        case 'pinescript_review':
            return await handleReviewRequest(args);
        case 'syntax_compatibility_validation':
            return await handleSyntaxValidationRequest(args);
        case 'mcp_service_version':
            return await handleVersionRequest();
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
// Handle reference request
async function handleReferenceRequest(refArgs) {
    if (!refArgs || typeof refArgs.query !== 'string') {
        throw new Error('query parameter is required for pinescript_reference');
    }
    return await searchReference(refArgs.query, refArgs.version || 'v6', refArgs.format || 'json', refArgs.max_results || 10);
}
// Handle review request
async function handleReviewRequest(reviewArgs) {
    return await reviewCode(reviewArgs, reviewArgs?.format || 'json', reviewArgs?.version || 'v6', reviewArgs?.chunk_size || 20, reviewArgs?.severity_filter || 'all');
}
// Handle syntax validation request
async function handleSyntaxValidationRequest(syntaxArgs) {
    if (!syntaxArgs || typeof syntaxArgs.code !== 'string') {
        throw new Error('code parameter is required for syntax_compatibility_validation');
    }
    return await validateSyntaxCompatibilityTool(syntaxArgs.code, syntaxArgs.format || 'json', syntaxArgs.migration_guide || false);
}
// Handle version request
async function handleVersionRequest() {
    try {
        const versionInfo = await getServiceVersionInfo();
        return {
            content: [
                {
                    type: 'text',
                    text: versionInfo,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Version retrieval failed: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
// ========================================
// SEARCH FUNCTIONALITY
// ========================================
function calculateSearchScore(key, data, searchTerms, query) {
    let score = 0;
    const contentLower = data.content.toLowerCase();
    const titleLower = data.title.toLowerCase();
    const tagsLower = data.tags ? data.tags.map((t) => t.toLowerCase()) : [];
    // Score based on matches
    searchTerms.forEach((term) => {
        // Title matches get highest score
        if (titleLower.includes(term))
            score += 10;
        // Key matches get high score
        if (key.toLowerCase().includes(term))
            score += 8;
        // Tag matches get medium score
        if (tagsLower.some((tag) => tag.includes(term)))
            score += 5;
        // Content matches get base score
        if (contentLower.includes(term))
            score += 1;
    });
    // Boost score for exact phrase matches
    if (contentLower.includes(query.toLowerCase()))
        score += 15;
    if (titleLower.includes(query.toLowerCase()))
        score += 20;
    return score;
}
async function searchReference(query, version, format = 'json', maxResults = 10) {
    try {
        // Use preloaded documentation index for optimal performance
        if (!PRELOADED_INDEX) {
            throw new Error('Documentation not preloaded. Server initialization may have failed.');
        }
        const index = PRELOADED_INDEX;
        // Enhanced search with synonyms and semantic matching
        const synonyms = {
            syntax: ['language', 'grammar', 'rules', 'structure', 'format'],
            variable: ['var', 'identifier', 'declaration', 'varip'],
            function: ['func', 'method', 'call', 'procedure'],
            array: ['list', 'collection', 'series'],
            style: ['formatting', 'convention', 'guideline', 'standard'],
            naming: ['identifier', 'variable name', 'convention'],
            compliance: ['conformance', 'adherence', 'standard', 'rules'],
            'line continuation': ['multiline', 'line break', 'wrapping'],
            initialization: ['declaration', 'assignment', 'creation'],
            'user-defined': ['custom', 'user', 'defined', 'UDT'],
            types: ['type', 'typing', 'data type'],
        };
        // Create expanded search terms
        const searchTerms = [query.toLowerCase()];
        const queryWords = query.toLowerCase().split(/\s+/);
        // Add synonyms for each word in the query
        queryWords.forEach((word) => {
            if (synonyms[word]) {
                searchTerms.push(...synonyms[word]);
            }
        });
        const scored = [];
        for (const [key, data] of Object.entries(index)) {
            const score = calculateSearchScore(key, data, searchTerms, query);
            if (score > 0) {
                scored.push({
                    score,
                    title: data.title,
                    content: data.content,
                    type: data.type,
                    examples: data.examples || [],
                    relevance_score: score,
                    key,
                });
            }
        }
        // Sort by score
        scored.sort((a, b) => b.score - a.score);
        if (scored.length === 0) {
            const suggestions = Object.keys(synonyms).slice(0, 5).join('", "');
            return {
                content: [
                    {
                        type: 'text',
                        text: `No documentation found for "${query}". Try broader search terms like "${suggestions}", or specific function names like "ta.sma".`,
                    },
                ],
            };
        }
        // Handle streaming format
        if (format === 'stream') {
            return await streamSearchResults(scored, query, version, maxResults, searchTerms);
        }
        // Standard JSON response
        const limitedResults = scored.slice(0, Math.min(maxResults, 100)).map((item) => ({
            title: item.title,
            content: item.content.substring(0, 1000) + (item.content.length > 1000 ? '...' : ''),
            type: item.type,
            examples: item.examples,
            relevance_score: item.score,
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        query,
                        version,
                        results: limitedResults,
                        total_found: scored.length,
                        search_terms_used: searchTerms.slice(0, 10),
                        format: 'standard',
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Documentation not yet available. Run 'npm run update-docs' to download and process PineScript documentation. Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
// Helper function for streaming search results
async function streamSearchResults(scored, query, version, maxResults, searchTerms) {
    const chunkSize = 5; // Results per chunk
    const totalResults = Math.min(scored.length, maxResults);
    const chunks = [];
    // Create metadata chunk
    chunks.push({
        type: 'metadata',
        data: {
            query,
            version,
            total_found: scored.length,
            total_streaming: totalResults,
            search_terms_used: searchTerms.slice(0, 10),
            format: 'stream',
            chunks_total: Math.ceil(totalResults / chunkSize),
        },
    });
    // Create result chunks
    for (let i = 0; i < totalResults; i += chunkSize) {
        const chunkResults = scored.slice(i, i + chunkSize).map((item) => ({
            title: item.title,
            content: item.content.substring(0, 800) + (item.content.length > 800 ? '...' : ''),
            type: item.type,
            examples: item.examples,
            relevance_score: item.score,
        }));
        chunks.push({
            type: 'results',
            chunk_index: Math.floor(i / chunkSize),
            data: chunkResults,
        });
    }
    // Return as concatenated JSON stream
    const streamText = chunks.map((chunk) => JSON.stringify(chunk)).join('\n');
    return {
        content: [
            {
                type: 'text',
                text: streamText,
            },
        ],
    };
}
// ========================================
// CODE REVIEW FUNCTIONALITY
// ========================================
async function reviewCode(args, format, version, chunkSize = 20, severityFilter = 'all') {
    try {
        return await executeCodeReview(args, format, version, chunkSize, severityFilter);
    }
    catch (error) {
        return createErrorResponse(error);
    }
}
async function executeCodeReview(args, format, version, chunkSize, severityFilter) {
    validatePreloadedRules();
    const reviewParams = extractReviewParameters(args);
    return await executeReviewBySourceType(reviewParams, format, version, chunkSize, severityFilter);
}
// Extract validation logic
function validatePreloadedRules() {
    if (!PRELOADED_STYLE_RULES || !PRELOADED_LANGUAGE_REFERENCE) {
        throw new Error('Style guide rules not preloaded. Server initialization may have failed.');
    }
}
// Extract parameter extraction
function extractReviewParameters(args) {
    const { source_type = 'code', code, file_path, directory_path, recursive = true, file_extensions = ['.pine', '.pinescript'], } = args;
    validateSourceTypeParameters(source_type, code, file_path, directory_path);
    return {
        source_type,
        code: code || '',
        file_path,
        directory_path,
        recursive,
        file_extensions,
    };
}
// Extract parameter validation
function validateSourceTypeParameters(source_type, code, file_path, directory_path) {
    if (source_type === 'code' && !code) {
        throw new Error('code parameter is required when source_type is "code"');
    }
    if (source_type === 'file' && !file_path) {
        throw new Error('file_path parameter is required when source_type is "file"');
    }
    if (source_type === 'directory' && !directory_path) {
        throw new Error('directory_path parameter is required when source_type is "directory"');
    }
}
// Extract source type handling
async function executeReviewBySourceType(params, format, version, chunkSize, severityFilter) {
    switch (params.source_type) {
        case 'directory':
            return await handleDirectoryReview(params, format, version, chunkSize, severityFilter);
        case 'file':
            return await handleFileReview(params, format, version, chunkSize, severityFilter);
        default:
            return await reviewSingleCode(params.code || '', format, version, chunkSize, severityFilter);
    }
}
// Handle directory review
async function handleDirectoryReview(params, format, version, chunkSize, severityFilter) {
    if (!params.directory_path) {
        throw new Error('directory_path is required for directory review');
    }
    return await reviewDirectory(params.directory_path, {
        recursive: params.recursive,
        file_extensions: params.file_extensions,
        format,
        version,
        chunkSize,
        severityFilter,
    });
}
// Handle file review
async function handleFileReview(params, format, version, chunkSize, severityFilter) {
    if (!params.file_path) {
        throw new Error('file_path is required for file review');
    }
    const fileContent = await safeReadFile(params.file_path);
    return await reviewSingleCode(fileContent, format, version, chunkSize, severityFilter, params.file_path);
}
// Create error response
function createErrorResponse(error) {
    return {
        content: [
            {
                type: 'text',
                text: `Code review failed: ${error instanceof Error ? error.message : String(error)}`,
            },
        ],
    };
}
// Helper function to collect complete multi-line function declarations
function collectCompleteFunction(lines, startIndex) {
    const startLine = lines[startIndex] ?? '';
    const trimmedLine = startLine.trim();
    // If the line already contains complete function (ends with ')'), return single line
    if (trimmedLine.includes('(') && trimmedLine.endsWith(')')) {
        return { text: trimmedLine, endLine: startIndex };
    }
    return collectMultiLineFunction(lines, startIndex);
}
// Extract multi-line function collection logic
function collectMultiLineFunction(lines, startIndex) {
    let parenthesesCount = 0;
    let functionText = '';
    let inString = false;
    let stringChar = '';
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const trimmedLine = line.trim();
        functionText += (i > startIndex ? ' ' : '') + trimmedLine;
        // Track parentheses balance accounting for string literals
        const result = processLineForParentheses(trimmedLine, inString, stringChar, parenthesesCount);
        inString = result.inString;
        stringChar = result.stringChar;
        parenthesesCount = result.parenthesesCount;
        // Function complete when parentheses balanced
        if (parenthesesCount === 0 && functionText.includes('(')) {
            return { text: functionText, endLine: i };
        }
    }
    // Fallback: return single line if no complete function found
    const startLine = lines[startIndex] ?? '';
    return { text: startLine.trim(), endLine: startIndex };
}
// Extract parentheses tracking logic
function processLineForParentheses(line, inString, stringChar, parenthesesCount) {
    let state = {
        inString,
        stringChar,
        parenthesesCount,
    };
    for (let j = 0; j < line.length; j++) {
        const char = line[j] ?? '';
        state = processCharacter(char, line[j - 1] ?? '', state);
    }
    return state;
}
// Extract character processing logic
function processCharacter(char, prevChar, state) {
    if (state.inString) {
        return processStringChar(char, prevChar, state);
    }
    return processNonStringChar(char, state);
}
// Process character inside string
function processStringChar(char, prevChar, state) {
    if (char === state.stringChar && prevChar !== '\\') {
        return {
            ...state,
            inString: false,
            stringChar: '',
        };
    }
    return state;
}
// Process character outside string
function processNonStringChar(char, state) {
    if (char === '"' || char === "'") {
        return {
            ...state,
            inString: true,
            stringChar: char,
        };
    }
    if (char === '(') {
        return { ...state, parenthesesCount: state.parenthesesCount + 1 };
    }
    if (char === ')') {
        return { ...state, parenthesesCount: state.parenthesesCount - 1 };
    }
    return state;
}
// Extract basic validations
function checkVersionDeclaration(code) {
    if (!code.includes('//@version=')) {
        return [
            {
                line: 1,
                column: 1,
                rule: 'version_declaration',
                severity: 'error',
                message: 'Missing PineScript version declaration (e.g., //@version=6)',
                category: 'language',
                suggested_fix: 'Add //@version=6 at the top of the script',
            },
        ];
    }
    return [];
}
// Extract AST validation logic
async function runAstValidation(validatorName, completeFunctionText, lineNumber) {
    try {
        const parser = await import('./src/parser/index.js');
        const validator = parser[validatorName];
        if (!validator) {
            return [];
        }
        const validationResult = await validator(completeFunctionText);
        // Handle different result formats
        const violations = validationResult.violations || [];
        const hasError = validationResult.hasShortTitleError ||
            validationResult.hasPrecisionError ||
            validationResult.hasMaxBarsBackError ||
            validationResult.hasDrawingObjectCountError ||
            violations.length > 0;
        if (hasError) {
            return violations.map((violation) => ({
                line: lineNumber,
                column: violation.column,
                severity: violation.severity,
                message: violation.message,
                rule: violation.rule,
                category: violation.category,
            }));
        }
        return [];
    }
    catch (_error) {
        return [];
    }
}
// Process declarations and run all AST validations
async function processDeclarations(lines, violations) {
    const declarationProcessor = new DeclarationProcessor(lines, violations);
    return await declarationProcessor.process();
}
class DeclarationProcessor {
    lines;
    violations;
    hasDeclaration = false;
    astValidators = [
        'quickValidateShortTitle',
        'quickValidatePrecision',
        'quickValidateMaxBarsBack',
        'quickValidateDrawingObjectCounts',
        'quickValidateInputTypes',
    ];
    constructor(lines, violations) {
        this.lines = lines;
        this.violations = violations;
    }
    async process() {
        for (let i = 0; i < this.lines.length; i++) {
            const processResult = await this.processLineForDeclaration(i);
            if (processResult.skipToLine !== undefined) {
                i = processResult.skipToLine;
            }
        }
        return { hasDeclaration: this.hasDeclaration };
    }
    async processLineForDeclaration(lineIndex) {
        const line = this.lines[lineIndex] ?? '';
        const trimmedLine = line.trim();
        if (!this.isDeclarationLine(trimmedLine)) {
            return {};
        }
        this.hasDeclaration = true;
        const { text: completeFunctionText, endLine } = collectCompleteFunction(this.lines, lineIndex);
        const lineNumber = lineIndex + 1;
        await this.runAllAstValidations(completeFunctionText, lineNumber);
        return { skipToLine: endLine };
    }
    isDeclarationLine(trimmedLine) {
        return trimmedLine.includes('indicator(') || trimmedLine.includes('strategy(');
    }
    async runAllAstValidations(completeFunctionText, lineNumber) {
        for (const validatorName of this.astValidators) {
            const astViolations = await runAstValidation(validatorName, completeFunctionText, lineNumber);
            this.violations.push(...astViolations);
        }
    }
}
// Extract line continuation validation
async function runLineContinuationValidation(code) {
    try {
        const { quickValidateLineContinuation } = await import('./src/parser/index.js');
        const lineContinuationResult = await quickValidateLineContinuation(code);
        if (lineContinuationResult.hasLineContinuationError) {
            return lineContinuationResult.violations.map((violation) => ({
                line: violation.line,
                column: violation.column,
                severity: violation.severity,
                message: violation.message,
                rule: violation.rule,
                category: violation.category,
            }));
        }
        return [];
    }
    catch (_error) {
        return [];
    }
}
// Extract line-by-line style guide analysis
function performLineByLineAnalysis(lines) {
    const violations = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const trimmedLine = line.trim();
        // Skip comments
        if (trimmedLine.startsWith('//')) {
            continue;
        }
        // Check camelCase naming convention
        const namingViolation = checkNamingConvention(trimmedLine, i + 1, line);
        if (namingViolation) {
            violations.push(namingViolation);
        }
        // Check operator spacing
        const operatorViolation = checkOperatorSpacing(trimmedLine, i + 1);
        if (operatorViolation) {
            violations.push(operatorViolation);
        }
        // Check plot titles
        const plotViolation = checkPlotTitle(trimmedLine, i + 1);
        if (plotViolation) {
            violations.push(plotViolation);
        }
        // Check line length
        const lengthViolation = checkLineLength(trimmedLine, i + 1);
        if (lengthViolation) {
            violations.push(lengthViolation);
        }
    }
    return violations;
}
// Helper functions for individual checks
function checkNamingConvention(line, lineNumber, originalLine) {
    if (line.includes('=')) {
        const varMatch = line.match(/(\w+)\s*=/);
        if (varMatch) {
            const varName = varMatch[1] ?? '';
            // COMPREHENSIVE FIX: Skip all built-in parameters + function call context detection
            // Built-in TradingView parameters that MUST use snake_case
            const isBuiltInParam = (varName === 'table_id' || varName === 'text_color' || varName === 'text_size' ||
                varName === 'text_halign' || varName === 'text_valign' || varName === 'text_wrap' ||
                varName === 'text_font_family' || varName === 'text_formatting' ||
                varName === 'border_color' || varName === 'border_width' || varName === 'border_style' ||
                varName === 'oca_name' || varName === 'alert_message' || varName === 'show_last' ||
                varName === 'force_overlay' || varName === 'max_bars_back' ||
                varName === 'max_lines_count' || varName === 'max_labels_count' || varName === 'max_boxes_count');
            // Enhanced context detection: check if this appears to be a function parameter
            const beforeVar = originalLine.substring(0, originalLine.indexOf(varName));
            const isInFunctionCall = (beforeVar.includes('(') && !beforeVar.includes(')') &&
                (beforeVar.includes('table.') || beforeVar.includes('strategy.') ||
                    beforeVar.includes('plot(') || beforeVar.includes('input.')));
            // Skip validation if it's a built-in parameter OR appears to be in a function call
            if (isBuiltInParam || isInFunctionCall) {
                return null; // Skip validation
            }
            // Check if this looks like a function call parameter
            // Pattern: function_name(param1=value, param2=value)
            const beforeAssignment = originalLine.substring(0, originalLine.indexOf(varName));
            const afterAssignment = originalLine.substring(originalLine.indexOf(varName));
            // Enhanced detection: look for function call pattern or known parameter context
            if (
            // Direct function parameter pattern: func(param=
            /\w+\s*\([^)]*$/.test(beforeAssignment.trim()) ||
                // Parameter in function call: ,param= or (param=
                /[,(]\s*$/.test(beforeAssignment.trim()) ||
                // Parameter assignment with function-like context
                (beforeAssignment.includes('(') && !beforeAssignment.includes(')') && afterAssignment.includes('='))) {
                return null;
            }
            if (!/^[a-z][a-zA-Z0-9]*$/.test(varName) &&
                !['ta', 'math', 'array', 'str'].includes(varName)) {
                return {
                    line: lineNumber,
                    column: originalLine.indexOf(varName) + 1,
                    rule: 'naming_convention',
                    severity: 'suggestion',
                    message: 'Variable should use camelCase naming convention',
                    category: 'style_guide',
                    suggested_fix: `Consider renaming '${varName}' to follow camelCase`,
                };
            }
        }
    }
    return null;
}
function checkOperatorSpacing(line, lineNumber) {
    if (/\w[+\-*/=]\w/.test(line)) {
        return {
            line: lineNumber,
            column: line.search(/\w[+\-*/=]\w/) + 1,
            rule: 'operator_spacing',
            severity: 'suggestion',
            message: 'Missing spaces around operators',
            category: 'style_guide',
            suggested_fix: 'Add spaces around operators (e.g., "a + b" instead of "a+b")',
        };
    }
    return null;
}
function checkPlotTitle(line, lineNumber) {
    if (line.includes('plot(') && !line.includes('title=')) {
        return {
            line: lineNumber,
            column: line.indexOf('plot(') + 1,
            rule: 'plot_title',
            severity: 'suggestion',
            message: 'Consider adding a title to plot() for better readability',
            category: 'style_guide',
            suggested_fix: 'Add title parameter: plot(value, title="My Plot")',
        };
    }
    return null;
}
function checkLineLength(line, lineNumber) {
    if (line.length > 120) {
        return {
            line: lineNumber,
            column: 121,
            rule: 'line_length',
            severity: 'suggestion',
            message: 'Line exceeds recommended length of 120 characters',
            category: 'style_guide',
            suggested_fix: 'Consider breaking long lines using line continuation',
        };
    }
    return null;
}
// Extract function signature validation
async function runFunctionSignatureValidation(code) {
    try {
        const { quickValidateFunctionSignatures } = await import('./src/parser/index.js');
        const functionSignatureValidationResult = await quickValidateFunctionSignatures(code);
        if (functionSignatureValidationResult.violations.length > 0) {
            return functionSignatureValidationResult.violations.map((violation) => ({
                line: violation.line,
                column: violation.column,
                severity: violation.severity,
                message: violation.message,
                rule: violation.rule,
                category: violation.category,
            }));
        }
        return [];
    }
    catch (_error) {
        return [];
    }
}
// Create declaration violation helper
function createDeclarationViolation() {
    return {
        line: 1,
        column: 1,
        rule: 'script_declaration',
        severity: 'error',
        message: 'Script must include either indicator() or strategy() declaration',
        category: 'language',
        suggested_fix: 'Add indicator("My Script") or strategy("My Strategy")',
    };
}
// Extract final result processing
async function createFinalResult(violations, version, reviewedLines, filePath, format, chunkSize, severityFilter) {
    // Filter violations by severity if specified
    let filteredViolations = violations;
    if (severityFilter !== 'all') {
        filteredViolations = violations.filter((v) => v.severity === severityFilter);
    }
    const summary = {
        total_issues: violations.length,
        errors: violations.filter((v) => v.severity === 'error').length,
        warnings: violations.filter((v) => v.severity === 'warning').length,
        suggestions: violations.filter((v) => v.severity === 'suggestion').length,
        filtered_count: filteredViolations.length,
        severity_filter: severityFilter,
    };
    const result = {
        summary,
        violations: filteredViolations,
        version,
        reviewed_lines: reviewedLines,
        file_path: filePath || 'inline_code',
    };
    return formatResult(result, format, chunkSize);
}
// Extract result formatting logic
async function formatResult(result, format, chunkSize) {
    // Handle streaming format for large violation sets
    if (format === 'stream' && result.violations.length > chunkSize) {
        return await streamCodeReview(result, chunkSize);
    }
    if (format === 'markdown') {
        const markdown = formatAsMarkdown(result);
        return {
            content: [
                {
                    type: 'text',
                    text: markdown,
                },
            ],
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}
async function reviewSingleCode(code, format, version, chunkSize = 20, severityFilter = 'all', filePath = null) {
    try {
        const violations = [];
        const lines = code.split('\n');
        // Check for version declaration
        violations.push(...checkVersionDeclaration(code));
        // Check for indicator/strategy declaration and run AST validations
        const declarationResult = await processDeclarations(lines, violations);
        const hasDeclaration = declarationResult.hasDeclaration;
        // INVALID_LINE_CONTINUATION validation for entire code
        const lineContinuationViolations = await runLineContinuationValidation(code);
        violations.push(...lineContinuationViolations);
        // Continue with line-by-line analysis
        const styleGuideViolations = performLineByLineAnalysis(lines);
        violations.push(...styleGuideViolations);
        // FUNCTION_SIGNATURE_VALIDATION - validate all function calls across entire script
        const functionSignatureViolations = await runFunctionSignatureValidation(code);
        violations.push(...functionSignatureViolations);
        // Add missing declaration violation if needed
        if (!hasDeclaration) {
            violations.push(createDeclarationViolation());
        }
        // Process and format the final result
        return createFinalResult(violations, version, lines.length, filePath, format, chunkSize, severityFilter);
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Style guide rules not yet available. Run 'npm run update-docs' to download and process PineScript documentation. Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
async function processFileForReview(file, version, chunkSize, severityFilter, aggregatedSummary) {
    try {
        const fileContent = await safeReadFile(file.path);
        const result = await reviewSingleCode(fileContent, 'json', version, chunkSize, severityFilter, file.relativePath);
        // Parse the JSON result to extract violations
        const resultJson = JSON.parse(result.content[0].text);
        // Add to aggregated summary
        aggregatedSummary.total_issues += resultJson.summary.total_issues;
        aggregatedSummary.errors += resultJson.summary.errors;
        aggregatedSummary.warnings += resultJson.summary.warnings;
        aggregatedSummary.suggestions += resultJson.summary.suggestions;
        aggregatedSummary.filtered_count += resultJson.summary.filtered_count;
        if (resultJson.summary.total_issues > 0) {
            aggregatedSummary.files_with_issues++;
        }
        // Store file result for streaming
        const fileResult = {
            ...resultJson,
            file_path: file.relativePath,
            file_size: file.size,
        };
        return { fileResult, violationCount: resultJson.violations.length };
    }
    catch (fileError) {
        // Add error result for files that couldn't be processed
        const errorResult = {
            file_path: file.relativePath,
            file_size: file.size,
            summary: {
                total_issues: 1,
                errors: 1,
                warnings: 0,
                suggestions: 0,
                filtered_count: 1,
                severity_filter: 'all',
            },
            violations: [
                {
                    line: 1,
                    column: 1,
                    rule: 'file_access_error',
                    severity: 'error',
                    message: `Failed to process file: ${fileError instanceof Error ? fileError.message : String(fileError)}`,
                    category: 'system',
                    suggested_fix: 'Check file permissions and encoding',
                },
            ],
            version,
            reviewed_lines: 0,
        };
        aggregatedSummary.total_issues++;
        aggregatedSummary.errors++;
        aggregatedSummary.files_with_issues++;
        aggregatedSummary.filtered_count++;
        return { fileResult: errorResult, violationCount: 1 };
    }
}
// Directory review function with streaming support
async function reviewDirectory(directoryPath, options = {}) {
    const { recursive = true, file_extensions = ['.pine', '.pinescript'], format = 'json', version = 'v6', chunkSize = 20, severityFilter = 'all', } = options;
    try {
        // Scan directory for PineScript files
        const files = await scanDirectory(directoryPath, {
            recursive,
            extensions: file_extensions,
            maxFiles: 1000,
        });
        if (files.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            summary: {
                                total_files: 0,
                                total_issues: 0,
                                errors: 0,
                                warnings: 0,
                                suggestions: 0,
                            },
                            message: `No PineScript files found in directory: ${directoryPath}`,
                        }, null, 2),
                    },
                ],
            };
        }
        // Process files and collect results
        const fileResults = [];
        let totalViolations = 0;
        const aggregatedSummary = {
            total_files: files.length,
            total_issues: 0,
            errors: 0,
            warnings: 0,
            suggestions: 0,
            files_with_issues: 0,
            filtered_count: 0,
            severity_filter: severityFilter,
        };
        for (const file of files) {
            const result = await processFileForReview(file, version, chunkSize, severityFilter, aggregatedSummary);
            fileResults.push(result.fileResult);
            totalViolations += result.violationCount;
        }
        const directoryResult = {
            directory_path: directoryPath,
            summary: aggregatedSummary,
            files: fileResults,
            version,
            scan_options: {
                recursive,
                file_extensions,
            },
        };
        // Handle streaming format for large result sets
        if (format === 'stream' && (fileResults.length > 5 || totalViolations > chunkSize)) {
            return await streamDirectoryReview(directoryResult, chunkSize);
        }
        if (format === 'markdown') {
            const markdown = formatDirectoryAsMarkdown(directoryResult);
            return {
                content: [
                    {
                        type: 'text',
                        text: markdown,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(directoryResult, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Directory review failed: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
// Helper function for streaming directory review results
async function streamDirectoryReview(directoryResult, chunkSize) {
    const chunks = [];
    const files = directoryResult.files;
    // Create metadata chunk
    chunks.push({
        type: 'metadata',
        data: {
            directory_path: directoryResult.directory_path,
            summary: directoryResult.summary,
            version: directoryResult.version,
            scan_options: directoryResult.scan_options,
            total_files: files.length,
            format: 'stream',
            chunks_total: Math.ceil(files.length / Math.max(1, Math.floor(chunkSize / 5))), // Fewer files per chunk
        },
    });
    // Create file chunks (group files together)
    const filesPerChunk = Math.max(1, Math.floor(chunkSize / 5)); // Adjust chunk size for files
    for (let i = 0; i < files.length; i += filesPerChunk) {
        const chunkFiles = files.slice(i, i + filesPerChunk);
        chunks.push({
            type: 'files',
            chunk_index: Math.floor(i / filesPerChunk),
            data: chunkFiles,
        });
    }
    // Return as concatenated JSON stream
    const streamText = chunks.map((chunk) => JSON.stringify(chunk)).join('\n');
    return {
        content: [
            {
                type: 'text',
                text: streamText,
            },
        ],
    };
}
// Helper function for streaming code review results
async function streamCodeReview(result, chunkSize) {
    const chunks = [];
    const totalViolations = result.violations.length;
    // Create metadata chunk
    chunks.push({
        type: 'metadata',
        data: {
            summary: result.summary,
            version: result.version,
            reviewed_lines: result.reviewed_lines,
            total_violations: totalViolations,
            format: 'stream',
            chunks_total: Math.ceil(totalViolations / chunkSize),
        },
    });
    // Create violation chunks
    for (let i = 0; i < totalViolations; i += chunkSize) {
        const chunkViolations = result.violations.slice(i, i + chunkSize);
        chunks.push({
            type: 'violations',
            chunk_index: Math.floor(i / chunkSize),
            data: chunkViolations,
        });
    }
    // Return as concatenated JSON stream
    const streamText = chunks.map((chunk) => JSON.stringify(chunk)).join('\n');
    return {
        content: [
            {
                type: 'text',
                text: streamText,
            },
        ],
    };
}
function formatViolationSection(violations) {
    let issuesMarkdown = '## Issues\n\n';
    for (const violation of violations) {
        const icon = violation.severity === 'error' ? '🔴' : violation.severity === 'warning' ? '🟡' : '💡';
        issuesMarkdown += `${icon} **Line ${violation.line}:** ${violation.message}\n`;
        issuesMarkdown += `- Rule: \`${violation.rule}\` (${violation.category})\n`;
        if (violation.suggested_fix) {
            issuesMarkdown += `- Suggested fix: ${violation.suggested_fix}\n\n`;
        }
    }
    return issuesMarkdown;
}
function formatAsMarkdown(result) {
    let markdown = '# PineScript Code Review Results\n\n';
    markdown += '## Summary\n';
    markdown += `- 🔴 ${result.summary.errors} Error${result.summary.errors !== 1 ? 's' : ''}\n`;
    markdown += `- 🟡 ${result.summary.warnings} Warning${result.summary.warnings !== 1 ? 's' : ''}\n`;
    markdown += `- 💡 ${result.summary.suggestions} Suggestion${result.summary.suggestions !== 1 ? 's' : ''}\n`;
    if (result.summary.severity_filter !== 'all') {
        markdown += `- 📊 Filtered by: ${result.summary.severity_filter} (${result.summary.filtered_count} shown)\n`;
    }
    markdown += '\n';
    if (result.violations.length === 0) {
        if (result.summary.total_issues === 0) {
            markdown += '✅ **No issues found!**\n';
        }
        else {
            markdown += '✅ **No issues found matching the current filter!**\n';
        }
        return markdown;
    }
    markdown += formatViolationSection(result.violations);
    return markdown;
}
function formatDirectoryAsMarkdown(directoryResult) {
    let markdown = formatDirectoryHeader(directoryResult);
    markdown += formatDirectorySummary(directoryResult.summary);
    if (directoryResult.summary.total_issues === 0) {
        return `${markdown}✅ **No issues found in any files!**\n`;
    }
    markdown += formatDirectoryIssues(directoryResult.files);
    return markdown;
}
// Extract directory header formatting
function formatDirectoryHeader(directoryResult) {
    let markdown = `# PineScript Directory Review Results\n\n`;
    markdown += `**Directory:** \`${directoryResult.directory_path}\`\n\n`;
    return markdown;
}
// Extract summary formatting
function formatDirectorySummary(summary) {
    let markdown = '## Summary\n';
    markdown += formatCountLine('📁', summary.total_files, 'file');
    markdown += formatCountLine('🔴', summary.errors, 'Error');
    markdown += formatCountLine('🟡', summary.warnings, 'Warning');
    markdown += formatCountLine('💡', summary.suggestions, 'Suggestion');
    markdown += formatCountLine('⚠️', summary.files_with_issues, 'file', 'with issues');
    return `${markdown}\n`;
}
// Helper for count lines with proper pluralization
function formatCountLine(icon, count, noun, suffix = '') {
    const plural = count !== 1 ? 's' : '';
    const suffixText = suffix ? ` ${suffix}` : '';
    return `- ${icon} ${count} ${noun}${plural}${suffixText}\n`;
}
// Extract files with issues formatting
function formatDirectoryIssues(files) {
    let markdown = '## Files with Issues\n\n';
    for (const file of files) {
        if (file.summary.total_issues > 0) {
            markdown += formatFileSection(file);
        }
    }
    return markdown;
}
// Extract individual file formatting
function formatFileSection(file) {
    let markdown = `### \`${file.file_path}\`\n`;
    markdown += formatCountLine('🔴', file.summary.errors, 'Error');
    markdown += formatCountLine('🟡', file.summary.warnings, 'Warning');
    markdown += formatCountLine('💡', file.summary.suggestions, 'Suggestion');
    markdown += '\n';
    markdown += formatFileViolations(file.violations);
    markdown += '---\n\n';
    return markdown;
}
// Extract violation formatting
function formatFileViolations(violations) {
    let markdown = '';
    for (const violation of violations) {
        const icon = getSeverityIcon(violation.severity);
        markdown += `${icon} **Line ${violation.line}:** ${violation.message}\n`;
        markdown += `- Rule: \`${violation.rule}\` (${violation.category})\n`;
        if (violation.suggested_fix) {
            markdown += `- Suggested fix: ${violation.suggested_fix}\n\n`;
        }
    }
    return markdown;
}
// Helper for severity icons
function getSeverityIcon(severity) {
    switch (severity) {
        case 'error':
            return '🔴';
        case 'warning':
            return '🟡';
        default:
            return '💡';
    }
}
// ========================================
// SYNTAX COMPATIBILITY VALIDATION
// ========================================
async function validateSyntaxCompatibilityTool(code, format = 'json', migrationGuide = false) {
    try {
        const result = validateSyntaxCompatibility(code);
        if (format === 'markdown') {
            return {
                content: [
                    {
                        type: 'text',
                        text: formatSyntaxCompatibilityAsMarkdown(result, migrationGuide),
                    },
                ],
            };
        }
        // JSON format
        const response = {
            success: result.success,
            compatibility_status: result.hasSyntaxCompatibilityError ? 'issues_found' : 'v6_compatible',
            violations: result.violations,
            metrics: result.metrics,
            analysis: result.details,
        };
        if (migrationGuide && result.hasSyntaxCompatibilityError) {
            response.migration_guide = generateMigrationGuide(result);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Syntax compatibility validation failed: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
function formatSyntaxCompatibilityAsMarkdown(result, migrationGuide = false) {
    let markdown = '# Pine Script v6 Syntax Compatibility Report\n\n';
    if (!result.hasSyntaxCompatibilityError) {
        markdown += '✅ **Status: v6 Compatible**\n\n';
        markdown += 'Your Pine Script code is compatible with v6 syntax requirements.\n\n';
    }
    else {
        markdown += '⚠️ **Status: Migration Required**\n\n';
        markdown += `Found ${result.violations.length} compatibility issue(s) that require attention.\n\n`;
    }
    // Metrics
    markdown += '## Analysis Summary\n\n';
    markdown += `- **Execution Time**: ${result.metrics?.executionTime?.toFixed(2) || 'N/A'}ms\n`;
    markdown += `- **Deprecated Functions Found**: ${result.metrics?.deprecatedFunctionsFound || 0}\n`;
    markdown += `- **Namespace Violations Found**: ${result.metrics?.namespaceViolationsFound || 0}\n`;
    markdown += `- **Version Compatible**: ${result.metrics?.versionCompatible ? 'Yes' : 'No'}\n\n`;
    if (result.violations.length > 0) {
        markdown += '## Issues Found\n\n';
        result.violations.forEach((violation, index) => {
            markdown += `### ${index + 1}. Line ${violation.line}\n\n`;
            markdown += `**Type**: Syntax Compatibility Issue\n\n`;
            if (violation.details) {
                if (violation.details.deprecatedFunction) {
                    markdown += `**Migration**: Replace \`${violation.details.deprecatedFunction}()\` with \`${violation.details.modernEquivalent}()\`\n\n`;
                }
                if (violation.details.namespaceRequired) {
                    markdown += `**Required**: Use \`${violation.details.modernForm}\` instead of \`${violation.details.functionName}()\`\n\n`;
                }
                if (violation.details.upgradeRecommended) {
                    markdown += `**Recommendation**: Update @version directive from v${violation.details.currentVersion} to v${violation.details.recommendedVersion}\n\n`;
                }
            }
        });
    }
    if (migrationGuide && result.hasSyntaxCompatibilityError) {
        markdown += generateMigrationGuideMarkdown(result);
    }
    return markdown;
}
function generateMigrationGuide(result) {
    const guide = {
        summary: `Migration required for ${result.violations.length} compatibility issues`,
        deprecated_functions: {},
        namespace_requirements: {},
        version_updates: {},
    };
    result.violations.forEach((violation) => {
        if (violation.details?.deprecatedFunction) {
            guide.deprecated_functions[violation.details.deprecatedFunction] = {
                modernEquivalent: violation.details.modernEquivalent,
                line: violation.line,
            };
        }
        if (violation.details?.namespaceRequired && violation.details.functionName) {
            guide.namespace_requirements[violation.details.functionName] = {
                requiredNamespace: violation.details.requiredNamespace,
                modernForm: violation.details.modernForm,
                line: violation.line,
            };
        }
        if (violation.details?.upgradeRecommended) {
            guide.version_updates.current = violation.details.currentVersion;
            guide.version_updates.recommended = violation.details.recommendedVersion;
            guide.version_updates.line = violation.line;
        }
    });
    return guide;
}
function generateMigrationGuideMarkdown(result) {
    let markdown = '## Migration Guide\n\n';
    const deprecatedFunctions = result.violations.filter((v) => v.details?.deprecatedFunction);
    const namespaceIssues = result.violations.filter((v) => v.details?.namespaceRequired);
    const versionIssues = result.violations.filter((v) => v.details?.upgradeRecommended);
    if (deprecatedFunctions.length > 0) {
        markdown += '### Deprecated Functions to Replace\n\n';
        deprecatedFunctions.forEach((v) => {
            markdown += `- Line ${v.line}: Replace \`${v.details?.deprecatedFunction}()\` with \`${v.details?.modernEquivalent}()\`\n`;
        });
        markdown += '\n';
    }
    if (namespaceIssues.length > 0) {
        markdown += '### Namespace Requirements\n\n';
        namespaceIssues.forEach((v) => {
            markdown += `- Line ${v.line}: Use \`${v.details?.modernForm}\` instead of \`${v.details?.functionName}()\`\n`;
        });
        markdown += '\n';
    }
    if (versionIssues.length > 0) {
        markdown += '### Version Updates\n\n';
        versionIssues.forEach((v) => {
            markdown += `- Line ${v.line}: Update @version directive from v${v.details?.currentVersion} to v${v.details?.recommendedVersion}\n`;
        });
        markdown += '\n';
    }
    markdown += '### Quick Migration Steps\n\n';
    markdown += '1. Update version directive to `@version=6`\n';
    markdown += '2. Replace deprecated functions with their modern equivalents\n';
    markdown += '3. Add required namespaces (ta., request., str., math.)\n';
    markdown += '4. Test your script in TradingView Pine Script Editor\n\n';
    return markdown;
}
// ========================================
// MAIN SERVER STARTUP
// ========================================
async function main() {
    try {
        // Preload documentation before accepting requests for optimal performance
        await preloadDocumentation();
        // Validate preloaded data integrity
        // CRITICAL FIX: Initialize documentation loader for parameter naming validation
        await initializeDocumentationLoader();
        const _validation = validatePreloadedData();
        // Start the server
        const transport = new StdioServerTransport();
        await server.connect(transport);
    }
    catch (_error) {
        process.exit(1);
    }
}
main().catch((_error) => {
    process.exit(1);
});
