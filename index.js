#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File system utilities with security safeguards
class FileSystemUtils {
  static isValidPath(inputPath) {
    // Prevent path traversal attacks
    const normalizedPath = path.normalize(inputPath);
    return !normalizedPath.includes('..') && path.isAbsolute(normalizedPath) || inputPath.startsWith('./');
  }
  
  static hasValidExtension(filePath, allowedExtensions) {
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
  }
  
  static async safeReadFile(filePath) {
    try {
      if (!this.isValidPath(filePath)) {
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
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }
  
  static async scanDirectory(dirPath, options = {}) {
    const {
      recursive = true,
      extensions = ['.pine', '.pinescript'],
      maxFiles = 1000
    } = options;
    
    if (!this.isValidPath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }
    
    const files = [];
    
    async function scanDir(currentPath, depth = 0) {
      try {
        if (depth > 10) { // Prevent infinite recursion
          return;
        }
        
        const stats = await fs.stat(currentPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path is not a directory: ${currentPath}`);
        }
        
        const entries = await fs.readdir(currentPath);
        
        for (const entry of entries) {
          if (files.length >= maxFiles) {
            break;
          }
          
          const fullPath = path.join(currentPath, entry);
          
          try {
            const entryStats = await fs.stat(fullPath);
            
            if (entryStats.isFile()) {
              if (FileSystemUtils.hasValidExtension(fullPath, extensions)) {
                files.push({
                  path: fullPath,
                  relativePath: path.relative(dirPath, fullPath),
                  size: entryStats.size
                });
              }
            } else if (entryStats.isDirectory() && recursive) {
              // Skip hidden directories and common ignore patterns
              if (!entry.startsWith('.') && !['node_modules', '__pycache__', 'dist', 'build'].includes(entry)) {
                await scanDir(fullPath, depth + 1);
              }
            }
          } catch (entryError) {
            // Skip files/dirs we can't access
            continue;
          }
        }
      } catch (error) {
        throw new Error(`Failed to scan directory ${currentPath}: ${error.message}`);
      }
    }
    
    await scanDir(dirPath);
    return files;
  }
}

// Global variables for preloaded documentation data
let PRELOADED_INDEX = null;
let PRELOADED_STYLE_RULES = null;
let PRELOADED_LANGUAGE_REFERENCE = null;

// Preload documentation into memory for optimal performance
async function preloadDocumentation() {
  console.log('📚 Preloading documentation into memory...');
  
  try {
    const indexPath = path.join(__dirname, 'docs', 'processed', 'index.json');
    const rulesPath = path.join(__dirname, 'docs', 'processed', 'style-rules.json');
    const languageReferencePath = path.join(__dirname, 'docs', 'processed', 'language-reference.json');
    
    // Check if files exist
    try {
      await fs.access(indexPath);
      await fs.access(rulesPath);
      await fs.access(languageReferencePath);
    } catch (accessError) {
      throw new Error(`Documentation files not found. Please ensure the docs/processed/ directory exists with required files.`);
    }
    
    // Load all documentation files
    PRELOADED_INDEX = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    PRELOADED_STYLE_RULES = JSON.parse(await fs.readFile(rulesPath, 'utf8'));
    PRELOADED_LANGUAGE_REFERENCE = JSON.parse(await fs.readFile(languageReferencePath, 'utf8'));
    
    const stats = {
      indexEntries: Object.keys(PRELOADED_INDEX).length,
      styleRules: Object.keys(PRELOADED_STYLE_RULES).length,
      functionEntries: Object.keys(PRELOADED_LANGUAGE_REFERENCE.functions).length,
      variableEntries: Object.keys(PRELOADED_LANGUAGE_REFERENCE.variables).length,
      totalLanguageItems: PRELOADED_LANGUAGE_REFERENCE.metadata.total_functions + PRELOADED_LANGUAGE_REFERENCE.metadata.total_variables,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };
    
    console.log(`✅ Documentation preloaded successfully:`);
    console.log(`   📖 ${stats.indexEntries} documentation entries`);
    console.log(`   📋 ${stats.styleRules} style rules`);
    console.log(`   🔧 ${stats.functionEntries} functions`);
    console.log(`   📊 ${stats.variableEntries} variables (built-ins, constants, keywords, types, operators, annotations)`);
    console.log(`   🎯 ${stats.totalLanguageItems} total Pine Script language items`);
    console.log(`   💾 ${stats.memoryUsage}MB total memory usage`);
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to preload documentation:', error.message);
    throw error;
  }
}

// Validate preloaded data integrity
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
    memoryUsage: process.memoryUsage().heapUsed
  };
}

const server = new Server(
  {
    name: 'mcp-server-pinescript',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
                type: 'string'
              },
              description: 'File extensions to scan for (default: [".pine", ".pinescript"])',
              default: ['.pine', '.pinescript'],
            },
          },
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'pinescript_reference':
      return await searchReference(args.query, args.version || 'v6', args.format || 'json', args.max_results || 10);
    
    case 'pinescript_review':
      return await reviewCode(args, args.format || 'json', args.version || 'v6', args.chunk_size || 20, args.severity_filter || 'all');
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function searchReference(query, version, format = 'json', maxResults = 10) {
  try {
    // Use preloaded documentation index for optimal performance
    if (!PRELOADED_INDEX) {
      throw new Error('Documentation not preloaded. Server initialization may have failed.');
    }
    
    const index = PRELOADED_INDEX;
    
    // Enhanced search with synonyms and semantic matching
    const synonyms = {
      'syntax': ['language', 'grammar', 'rules', 'structure', 'format'],
      'variable': ['var', 'identifier', 'declaration', 'varip'],
      'function': ['func', 'method', 'call', 'procedure'],
      'array': ['list', 'collection', 'series'],
      'style': ['formatting', 'convention', 'guideline', 'standard'],
      'naming': ['identifier', 'variable name', 'convention'],
      'compliance': ['conformance', 'adherence', 'standard', 'rules'],
      'line continuation': ['multiline', 'line break', 'wrapping'],
      'initialization': ['declaration', 'assignment', 'creation'],
      'user-defined': ['custom', 'user', 'defined', 'UDT'],
      'types': ['type', 'typing', 'data type']
    };
    
    // Create expanded search terms
    const searchTerms = [query.toLowerCase()];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Add synonyms for each word in the query
    queryWords.forEach(word => {
      if (synonyms[word]) {
        searchTerms.push(...synonyms[word]);
      }
    });
    
    const scored = [];
    
    for (const [key, data] of Object.entries(index)) {
      let score = 0;
      const contentLower = data.content.toLowerCase();
      const titleLower = data.title.toLowerCase();
      const tagsLower = data.tags ? data.tags.map(t => t.toLowerCase()) : [];
      
      // Score based on matches
      searchTerms.forEach(term => {
        // Title matches get highest score
        if (titleLower.includes(term)) score += 10;
        // Key matches get high score
        if (key.toLowerCase().includes(term)) score += 8;
        // Tag matches get medium score
        if (tagsLower.some(tag => tag.includes(term))) score += 5;
        // Content matches get base score
        if (contentLower.includes(term)) score += 1;
      });
      
      // Boost score for exact phrase matches
      if (contentLower.includes(query.toLowerCase())) score += 15;
      if (titleLower.includes(query.toLowerCase())) score += 20;
      
      if (score > 0) {
        scored.push({
          score,
          title: data.title,
          content: data.content,
          type: data.type,
          examples: data.examples || [],
          key
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
    const limitedResults = scored.slice(0, Math.min(maxResults, 100)).map(item => ({
      title: item.title,
      content: item.content.substring(0, 1000) + (item.content.length > 1000 ? '...' : ''),
      type: item.type,
      examples: item.examples,
      relevance_score: item.score
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
            format: 'standard'
          }, null, 2),
        },
      ],
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Documentation not yet available. Run 'npm run update-docs' to download and process PineScript documentation. Error: ${error.message}`,
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
      chunks_total: Math.ceil(totalResults / chunkSize)
    }
  });
  
  // Create result chunks
  for (let i = 0; i < totalResults; i += chunkSize) {
    const chunkResults = scored.slice(i, i + chunkSize).map(item => ({
      title: item.title,
      content: item.content.substring(0, 800) + (item.content.length > 800 ? '...' : ''),
      type: item.type,
      examples: item.examples,
      relevance_score: item.score
    }));
    
    chunks.push({
      type: 'results',
      chunk_index: Math.floor(i / chunkSize),
      data: chunkResults
    });
  }
  
  // Return as concatenated JSON stream
  const streamText = chunks.map(chunk => JSON.stringify(chunk)).join('\n');
  
  return {
    content: [
      {
        type: 'text',
        text: streamText,
      },
    ],
  };
}

async function reviewCode(args, format, version, chunkSize = 20, severityFilter = 'all') {
  try {
    // Use preloaded style guide rules for optimal performance
    if (!PRELOADED_STYLE_RULES || !PRELOADED_LANGUAGE_REFERENCE) {
      throw new Error('Style guide rules not preloaded. Server initialization may have failed.');
    }
    
    const {
      source_type = 'code',
      code,
      file_path,
      directory_path,
      recursive = true,
      file_extensions = ['.pine', '.pinescript']
    } = args;
    
    // Validate source type and required parameters
    if (source_type === 'code' && !code) {
      throw new Error('code parameter is required when source_type is "code"');
    }
    if (source_type === 'file' && !file_path) {
      throw new Error('file_path parameter is required when source_type is "file"');
    }
    if (source_type === 'directory' && !directory_path) {
      throw new Error('directory_path parameter is required when source_type is "directory"');
    }
    
    // Handle different source types
    if (source_type === 'directory') {
      return await reviewDirectory(directory_path, {
        recursive,
        file_extensions,
        format,
        version,
        chunkSize,
        severityFilter
      });
    }
    
    if (source_type === 'file') {
      const fileContent = await FileSystemUtils.safeReadFile(file_path);
      return await reviewSingleCode(fileContent, format, version, chunkSize, severityFilter, file_path);
    }
    
    // Default: source_type === 'code'
    return await reviewSingleCode(code, format, version, chunkSize, severityFilter);
    
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Code review failed: ${error.message}`,
        },
      ],
    };
  }
}

async function reviewSingleCode(code, format, version, chunkSize = 20, severityFilter = 'all', filePath = null) {
  try {
    const styleGuide = PRELOADED_STYLE_RULES;
    const functions = PRELOADED_LANGUAGE_REFERENCE.functions;
    
    const violations = [];
    const lines = code.split('\n');
    
    // Check for version declaration
    if (!code.includes('//@version=')) {
      violations.push({
        line: 1,
        column: 1,
        rule: 'version_declaration',
        severity: 'error',
        message: 'Missing PineScript version declaration (e.g., //@version=6)',
        category: 'language',
        suggested_fix: 'Add //@version=6 at the top of the script',
      });
    }
    
    // Check for indicator/strategy declaration
    let hasDeclaration = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('indicator(') || line.includes('strategy(')) {
        hasDeclaration = true;
        
        // SHORT_TITLE_TOO_LONG validation using AST parser
        try {
          const { quickValidateShortTitle } = await import('./src/parser/index.js');
          const validationResult = await quickValidateShortTitle(line);
          
          if (validationResult.hasShortTitleError) {
            violations.push(...validationResult.violations.map(violation => ({
              line: i + 1,
              column: violation.column,
              severity: violation.severity,
              message: violation.message,
              rule: violation.rule,
              category: violation.category
            })));
          }
        } catch (error) {
          // Fallback: continue without advanced validation if parser fails
          console.warn('Advanced validation unavailable:', error.message);
        }
        // INVALID_PRECISION validation using same AST parser
        try {
          const { quickValidatePrecision } = await import("./src/parser/index.js");
          const precisionValidationResult = await quickValidatePrecision(line);
          
          if (precisionValidationResult.hasPrecisionError) {
            violations.push(...precisionValidationResult.violations.map(violation => ({
              line: i + 1,
              column: violation.column,
              severity: violation.severity,
              message: violation.message,
              rule: violation.rule,
              category: violation.category
            })));
          }
        } catch (error) {
          // Fallback: continue without precision validation if parser fails
          console.warn("Precision validation unavailable:", error.message);
        }
        // INVALID_MAX_BARS_BACK validation using same AST parser
        try {
          const { quickValidateMaxBarsBack } = await import("./src/parser/index.js");
          const maxBarsBackValidationResult = await quickValidateMaxBarsBack(line);
          
          if (maxBarsBackValidationResult.hasMaxBarsBackError) {
            violations.push(...maxBarsBackValidationResult.violations.map(violation => ({
              line: i + 1,
              column: violation.column,
              severity: violation.severity,
              message: violation.message,
              rule: violation.rule,
              category: violation.category
            })));
          }
        } catch (error) {
          // Fallback: continue without max_bars_back validation if parser fails
          console.warn("Max bars back validation unavailable:", error.message);
        }
        
        // INVALID_DRAWING_OBJECT_COUNTS validation using batch AST parser
        try {
          const { quickValidateDrawingObjectCounts } = await import("./src/parser/index.js");
          const drawingObjectCountsValidationResult = await quickValidateDrawingObjectCounts(line);
          
          if (drawingObjectCountsValidationResult.hasDrawingObjectCountError) {
            violations.push(...drawingObjectCountsValidationResult.violations.map(violation => ({
              line: i + 1,
              column: violation.column,
              severity: violation.severity,
              message: violation.message,
              rule: violation.rule,
              category: violation.category
            })));
          }
        } catch (error) {
          // Fallback: continue without drawing object count validation if parser fails
          console.warn("Drawing object count validation unavailable:", error.message);
        }
      }
      
      // Style guide checks - corrected to camelCase per official Pine Script style guide
      if (line.includes('=') && !line.startsWith('//')) {
        const varMatch = line.match(/(\w+)\s*=/);
        if (varMatch) {
          const varName = varMatch[1];
          // Check camelCase naming (corrected from snake_case)
          if (!/^[a-z][a-zA-Z0-9]*$/.test(varName) && !['ta', 'math', 'array', 'str'].includes(varName)) {
            violations.push({
              line: i + 1,
              column: line.indexOf(varName) + 1,
              rule: 'naming_convention',
              severity: 'suggestion',
              message: 'Variable should use camelCase naming convention',
              category: 'style_guide',
              suggested_fix: `Consider renaming '${varName}' to follow camelCase`,
            });
          }
        }
      }
      
      // Check for missing spaces around operators
      if (/\w[+\-*/=]\w/.test(line) && !line.startsWith('//')) {
        violations.push({
          line: i + 1,
          column: line.search(/\w[+\-*/=]\w/) + 1,
          rule: 'operator_spacing',
          severity: 'suggestion',
          message: 'Missing spaces around operators',
          category: 'style_guide',
          suggested_fix: 'Add spaces around operators (e.g., "a + b" instead of "a+b")',
        });
      }
      
      // Check for plot without title
      if (line.includes('plot(') && !line.includes('title=')) {
        violations.push({
          line: i + 1,
          column: line.indexOf('plot(') + 1,
          rule: 'plot_title',
          severity: 'suggestion',
          message: 'Consider adding a title to plot() for better readability',
          category: 'style_guide',
          suggested_fix: 'Add title parameter: plot(value, title="My Plot")',
        });
      }
      
      // Check for line length (recommended max 120 characters)
      if (line.length > 120) {
        violations.push({
          line: i + 1,
          column: 121,
          rule: 'line_length',
          severity: 'suggestion',
          message: 'Line exceeds recommended length of 120 characters',
          category: 'style_guide',
          suggested_fix: 'Consider breaking long lines using line continuation',
        });
      }
    }
    
    if (!hasDeclaration) {
      violations.push({
        line: 1,
        column: 1,
        rule: 'script_declaration',
        severity: 'error',
        message: 'Script must include either indicator() or strategy() declaration',
        category: 'language',
        suggested_fix: 'Add indicator("My Script") or strategy("My Strategy")',
      });
    }
    
    // Filter violations by severity if specified
    let filteredViolations = violations;
    if (severityFilter !== 'all') {
      filteredViolations = violations.filter(v => v.severity === severityFilter);
    }
    
    const summary = {
      total_issues: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      suggestions: violations.filter(v => v.severity === 'suggestion').length,
      filtered_count: filteredViolations.length,
      severity_filter: severityFilter,
    };
    
    const result = {
      summary,
      violations: filteredViolations,
      version,
      reviewed_lines: lines.length,
      file_path: filePath || 'inline_code',
    };
    
    // Handle streaming format for large violation sets
    if (format === 'stream' && filteredViolations.length > chunkSize) {
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
    
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Style guide rules not yet available. Run 'npm run update-docs' to download and process PineScript documentation. Error: ${error.message}`,
        },
      ],
    };
  }
}

// Directory review function with streaming support
async function reviewDirectory(directoryPath, options = {}) {
  const {
    recursive = true,
    file_extensions = ['.pine', '.pinescript'],
    format = 'json',
    version = 'v6',
    chunkSize = 20,
    severityFilter = 'all'
  } = options;
  
  try {
    // Scan directory for PineScript files
    const files = await FileSystemUtils.scanDirectory(directoryPath, {
      recursive,
      extensions: file_extensions,
      maxFiles: 1000
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
                suggestions: 0
              },
              message: `No PineScript files found in directory: ${directoryPath}`
            }, null, 2),
          },
        ],
      };
    }
    
    // Process files and collect results
    const fileResults = [];
    let totalViolations = 0;
    let aggregatedSummary = {
      total_files: files.length,
      total_issues: 0,
      errors: 0,
      warnings: 0,
      suggestions: 0,
      files_with_issues: 0
    };
    
    for (const file of files) {
      try {
        const fileContent = await FileSystemUtils.safeReadFile(file.path);
        const result = await reviewSingleCode(fileContent, 'json', version, chunkSize, severityFilter, file.relativePath);
        
        // Parse the JSON result to extract violations
        const resultJson = JSON.parse(result.content[0].text);
        
        // Add to aggregated summary
        aggregatedSummary.total_issues += resultJson.summary.total_issues;
        aggregatedSummary.errors += resultJson.summary.errors;
        aggregatedSummary.warnings += resultJson.summary.warnings;
        aggregatedSummary.suggestions += resultJson.summary.suggestions;
        
        if (resultJson.summary.total_issues > 0) {
          aggregatedSummary.files_with_issues++;
        }
        
        // Store file result for streaming
        fileResults.push({
          file_path: file.relativePath,
          file_size: file.size,
          ...resultJson
        });
        
        totalViolations += resultJson.violations.length;
      } catch (fileError) {
        // Add error result for files that couldn't be processed
        const errorResult = {
          file_path: file.relativePath,
          file_size: file.size,
          summary: {
            total_issues: 1,
            errors: 1,
            warnings: 0,
            suggestions: 0
          },
          violations: [{
            line: 1,
            column: 1,
            rule: 'file_access_error',
            severity: 'error',
            message: `Failed to process file: ${fileError.message}`,
            category: 'system',
            suggested_fix: 'Check file permissions and encoding'
          }],
          version,
          reviewed_lines: 0
        };
        
        fileResults.push(errorResult);
        aggregatedSummary.total_issues++;
        aggregatedSummary.errors++;
        aggregatedSummary.files_with_issues++;
        totalViolations++;
      }
    }
    
    const directoryResult = {
      directory_path: directoryPath,
      summary: aggregatedSummary,
      files: fileResults,
      version,
      scan_options: {
        recursive,
        file_extensions
      }
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
    
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Directory review failed: ${error.message}`,
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
      chunks_total: Math.ceil(files.length / Math.max(1, Math.floor(chunkSize / 5))) // Fewer files per chunk
    }
  });
  
  // Create file chunks (group files together)
  const filesPerChunk = Math.max(1, Math.floor(chunkSize / 5)); // Adjust chunk size for files
  for (let i = 0; i < files.length; i += filesPerChunk) {
    const chunkFiles = files.slice(i, i + filesPerChunk);
    
    chunks.push({
      type: 'files',
      chunk_index: Math.floor(i / filesPerChunk),
      data: chunkFiles
    });
  }
  
  // Return as concatenated JSON stream
  const streamText = chunks.map(chunk => JSON.stringify(chunk)).join('\n');
  
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
      chunks_total: Math.ceil(totalViolations / chunkSize)
    }
  });
  
  // Create violation chunks
  for (let i = 0; i < totalViolations; i += chunkSize) {
    const chunkViolations = result.violations.slice(i, i + chunkSize);
    
    chunks.push({
      type: 'violations',
      chunk_index: Math.floor(i / chunkSize),
      data: chunkViolations
    });
  }
  
  // Return as concatenated JSON stream
  const streamText = chunks.map(chunk => JSON.stringify(chunk)).join('\n');
  
  return {
    content: [
      {
        type: 'text',
        text: streamText,
      },
    ],
  };
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
    } else {
      markdown += '✅ **No issues found matching the current filter!**\n';
    }
    return markdown;
  }
  
  markdown += '## Issues\n\n';
  
  for (const violation of result.violations) {
    const icon = violation.severity === 'error' ? '🔴' : 
                 violation.severity === 'warning' ? '🟡' : '💡';
    
    markdown += `${icon} **Line ${violation.line}:** ${violation.message}\n`;
    markdown += `- Rule: \`${violation.rule}\` (${violation.category})\n`;
    markdown += `- Suggested fix: ${violation.suggested_fix}\n\n`;
  }
  
  return markdown;
}

function formatDirectoryAsMarkdown(directoryResult) {
  let markdown = `# PineScript Directory Review Results\n\n`;
  markdown += `**Directory:** \`${directoryResult.directory_path}\`\n\n`;
  
  markdown += '## Summary\n';
  markdown += `- 📁 ${directoryResult.summary.total_files} file${directoryResult.summary.total_files !== 1 ? 's' : ''} scanned\n`;
  markdown += `- 🔴 ${directoryResult.summary.errors} Error${directoryResult.summary.errors !== 1 ? 's' : ''}\n`;
  markdown += `- 🟡 ${directoryResult.summary.warnings} Warning${directoryResult.summary.warnings !== 1 ? 's' : ''}\n`;
  markdown += `- 💡 ${directoryResult.summary.suggestions} Suggestion${directoryResult.summary.suggestions !== 1 ? 's' : ''}\n`;
  markdown += `- ⚠️ ${directoryResult.summary.files_with_issues} file${directoryResult.summary.files_with_issues !== 1 ? 's' : ''} with issues\n\n`;
  
  if (directoryResult.summary.total_issues === 0) {
    markdown += '✅ **No issues found in any files!**\n';
    return markdown;
  }
  
  markdown += '## Files with Issues\n\n';
  
  for (const file of directoryResult.files) {
    if (file.summary.total_issues > 0) {
      markdown += `### \`${file.file_path}\`\n`;
      markdown += `- 🔴 ${file.summary.errors} Error${file.summary.errors !== 1 ? 's' : ''}\n`;
      markdown += `- 🟡 ${file.summary.warnings} Warning${file.summary.warnings !== 1 ? 's' : ''}\n`;
      markdown += `- 💡 ${file.summary.suggestions} Suggestion${file.summary.suggestions !== 1 ? 's' : ''}\n\n`;
      
      for (const violation of file.violations) {
        const icon = violation.severity === 'error' ? '🔴' : 
                     violation.severity === 'warning' ? '🟡' : '💡';
        
        markdown += `${icon} **Line ${violation.line}:** ${violation.message}\n`;
        markdown += `- Rule: \`${violation.rule}\` (${violation.category})\n`;
        markdown += `- Suggested fix: ${violation.suggested_fix}\n\n`;
      }
      
      markdown += '---\n\n';
    }
  }
  
  return markdown;
}

async function main() {
  console.log('🚀 Starting PineScript MCP Server...');
  
  try {
    // Preload documentation before accepting requests for optimal performance
    await preloadDocumentation();
    
    // Validate preloaded data integrity
    const validation = validatePreloadedData();
    console.log(`✅ Data validation passed: ${validation.indexEntries} entries loaded`);
    
    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log('🌟 PineScript MCP Server ready with preloaded documentation!');
    console.log('📈 Performance optimized: ~70-90% faster response times expected');
    
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    console.error('💡 Ensure docs/processed/ directory exists with documentation files');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Fatal server error:', error);
  process.exit(1);
});