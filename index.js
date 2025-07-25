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

const server = new Server(
  {
    name: 'mcp-server-pinescript',
    version: '1.1.1',
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
        description: 'Search PineScript documentation including style guide, language reference, and API docs. Context-aware for development and planning.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term or topic (e.g., "array functions", "style guide naming", "ta.sma")',
            },
            version: {
              type: 'string',
              description: 'PineScript version (default: v6)',
              default: 'v6',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'pinescript_review',
        description: 'Review PineScript code against style guide and language rules. Returns structured violation reports.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'PineScript code to review',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown'],
              description: 'Output format (default: json)',
              default: 'json',
            },
            version: {
              type: 'string',
              description: 'PineScript version (default: v6)',
              default: 'v6',
            },
          },
          required: ['code'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'pinescript_reference':
      return await searchReference(args.query, args.version || 'v6');
    
    case 'pinescript_review':
      return await reviewCode(args.code, args.format || 'json', args.version || 'v6');
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function searchReference(query, version) {
  try {
    // Load processed documentation index
    const indexPath = path.join(__dirname, 'docs', 'processed', 'index.json');
    
    // Debug: Check if file exists
    try {
      await fs.access(indexPath);
    } catch (accessError) {
      throw new Error(`Documentation index not found at ${indexPath}. Please ensure the repository includes the docs/processed/ directory.`);
    }
    
    const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
    
    // Perform grep-style keyword search
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [key, data] of Object.entries(index)) {
      if (key.toLowerCase().includes(queryLower) || 
          data.content.toLowerCase().includes(queryLower) ||
          (data.tags && data.tags.some(tag => tag.toLowerCase().includes(queryLower)))) {
        results.push({
          title: data.title,
          content: data.content,
          type: data.type,
          examples: data.examples || [],
        });
      }
    }
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No documentation found for "${query}". Try broader search terms like "array", "style guide", or "functions".`,
          },
        ],
      };
    }
    
    // Limit results for performance
    const limitedResults = results.slice(0, 10);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            version,
            results: limitedResults,
            total_found: results.length,
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

async function reviewCode(code, format, version) {
  try {
    // Load style guide rules
    const rulesPath = path.join(__dirname, 'docs', 'processed', 'style-rules.json');
    const functionsPath = path.join(__dirname, 'docs', 'processed', 'functions.json');
    
    // Debug: Check if files exist
    try {
      await fs.access(rulesPath);
      await fs.access(functionsPath);
    } catch (accessError) {
      throw new Error(`Documentation files not found. Expected at ${rulesPath} and ${functionsPath}. Please ensure the repository includes the docs/processed/ directory.`);
    }
    
    const styleGuide = JSON.parse(await fs.readFile(rulesPath, 'utf8'));
    const functions = JSON.parse(await fs.readFile(functionsPath, 'utf8'));
    
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
      }
      
      // Style guide checks
      if (line.includes('=') && !line.startsWith('//')) {
        const varMatch = line.match(/(\w+)\s*=/);
        if (varMatch) {
          const varName = varMatch[1];
          // Check snake_case naming
          if (!/^[a-z][a-z0-9_]*$/.test(varName) && !['ta', 'math', 'array', 'str'].includes(varName)) {
            violations.push({
              line: i + 1,
              column: line.indexOf(varName) + 1,
              rule: 'naming_convention',
              severity: 'suggestion',
              message: 'Variable should use snake_case naming convention',
              category: 'style_guide',
              suggested_fix: `Consider renaming '${varName}' to follow snake_case`,
            });
          }
        }
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
    
    const summary = {
      total_issues: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      suggestions: violations.filter(v => v.severity === 'suggestion').length,
    };
    
    const result = {
      summary,
      violations,
      version,
      reviewed_lines: lines.length,
    };
    
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

function formatAsMarkdown(result) {
  let markdown = '# PineScript Code Review Results\n\n';
  
  markdown += '## Summary\n';
  markdown += `- 🔴 ${result.summary.errors} Error${result.summary.errors !== 1 ? 's' : ''}\n`;
  markdown += `- 🟡 ${result.summary.warnings} Warning${result.summary.warnings !== 1 ? 's' : ''}\n`;
  markdown += `- 💡 ${result.summary.suggestions} Suggestion${result.summary.suggestions !== 1 ? 's' : ''}\n\n`;
  
  if (result.violations.length === 0) {
    markdown += '✅ **No issues found!**\n';
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});