# AI Integration Guide

This document is specifically for AI coding assistants, MCP clients, and automated systems that will consume the PineScript MCP Documentation Server programmatically.

## Quick Start for AI Systems

### Command Line Integration
Most AI systems will interact with this MCP server through CLI tools. Here are the essential patterns:

```bash
# Step 1: Install and configure the MCP server
npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# Step 2: Use the configured server
# Claude Code CLI - Reference lookup
claude -p "Use pinescript_reference to look up ta.sma function"

# Claude Code CLI - Code review (multiple modes)
claude -p "Use pinescript_review to validate: $(cat script.pine)"
claude -p "Use pinescript_review with source_type=file and file_path=./script.pine"
claude -p "Use pinescript_review with source_type=directory and directory_path=./src"

# Alternative: Config file approach
claude --mcp-config '{"mcpServers":{"pinescript":{"command":"node","args":["./node_modules/mcp-server-pinescript/index.js"]}}}' -p "Use pinescript_reference to look up ta.sma"

# Gemini CLI - Interactive session (assuming MCP server configured)
gemini --allowed-mcp-server-names pinescript-docs -p "Use pinescript_reference and pinescript_review to help develop a moving average crossover strategy"
```

### Expected Response Format
Both tools return structured JSON that AI systems can parse:

**pinescript_reference** returns:
```json
{
  "query": "ta.sma", 
  "results": [{"title": "...", "content": "...", "examples": [...]}],
  "total_found": 3
}
```

**pinescript_review** returns (single file):
```json
{
  "summary": {"total_issues": 2, "errors": 1, "suggestions": 1},
  "violations": [{"line": 1, "rule": "version_declaration", "severity": "error"}],
  "reviewed_lines": 5,
  "file_path": "script.pine"
}
```

**pinescript_review** returns (directory, NEW in v1.3.0):
```json
{
  "directory_path": "./src",
  "summary": {"total_files": 5, "total_issues": 8, "files_with_issues": 3},
  "files": [{"file_path": "indicators/rsi.pine", "summary": {...}, "violations": [...]}]
}
```

## Tool Specifications

### pinescript_reference

**Purpose**: Context-aware documentation lookup for development guidance

#### Input Schema
```json
{
  "name": "pinescript_reference",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search term or topic",
        "required": true
      },
      "version": {
        "type": "string",
        "description": "PineScript version (default: v6)",
        "default": "v6",
        "enum": ["v6", "v7"]
      }
    },
    "required": ["query"]
  }
}
```

#### Output Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"query\": \"ta.sma\",
        \"version\": \"v6\",
        \"results\": [
          {
            \"title\": \"ta.sma Function\",
            \"content\": \"Simple moving average calculation...\",
            \"type\": \"reference\",
            \"examples\": [
              \"ta.sma(close, 14)\",
              \"plot(ta.sma(close, 20), title=\\\"SMA\\\")\"
            ]
          }
        ],
        \"total_found\": 3
      }"
    }
  ]
}
```

#### Query Patterns

**Function Lookup:**
```json
{"query": "ta.sma"}
{"query": "array.at"}
{"query": "strategy.entry"}
```

**Concept Search:**
```json
{"query": "arrays"}
{"query": "conditional structures"}
{"query": "loops"}
```

**Style Guide:**
```json
{"query": "naming conventions"}
{"query": "style guide"}
{"query": "formatting"}
```

### pinescript_review

**Purpose**: Multi-source code validation with streaming support (v1.3.0 enhanced)

#### Input Schema
```json
{
  "name": "pinescript_review",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source_type": {
        "type": "string",
        "enum": ["code", "file", "directory"],
        "description": "Source type: code (string), file (path), directory (scan)",
        "default": "code"
      },
      "code": {
        "type": "string",
        "description": "PineScript code to review (required when source_type=code)"
      },
      "file_path": {
        "type": "string", 
        "description": "Path to PineScript file (required when source_type=file)"
      },
      "directory_path": {
        "type": "string",
        "description": "Directory path to scan (required when source_type=directory)"
      },
      "format": {
        "type": "string",
        "enum": ["json", "markdown", "stream"],
        "description": "Output format (default: json)",
        "default": "json"
      },
      "version": {
        "type": "string",
        "description": "PineScript version (default: v6)",
        "default": "v6"
      },
      "chunk_size": {
        "type": "number",
        "description": "Violations per chunk in stream mode (default: 20)",
        "default": 20
      },
      "severity_filter": {
        "type": "string",
        "enum": ["all", "error", "warning", "suggestion"],
        "description": "Filter violations by severity (default: all)",
        "default": "all"
      },
      "recursive": {
        "type": "boolean",
        "description": "For directory: scan subdirectories (default: true)", 
        "default": true
      },
      "file_extensions": {
        "type": "array",
        "items": {"type": "string"},
        "description": "File extensions to scan (default: [\".pine\", \".pinescript\"])",
        "default": [".pine", ".pinescript"]
      }
    },
    "required": []
  }
}
```

#### JSON Output Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"summary\": {
          \"total_issues\": 2,
          \"errors\": 1,
          \"warnings\": 0,
          \"suggestions\": 1
        },
        \"violations\": [
          {
            \"line\": 1,
            \"column\": 1,
            \"rule\": \"version_declaration\",
            \"severity\": \"error\",
            \"message\": \"Missing PineScript version declaration\",
            \"category\": \"language\",
            \"suggested_fix\": \"Add //@version=6 at the top\"
          },
          {
            \"line\": 3,
            \"column\": 5,
            \"rule\": \"naming_convention\",
            \"severity\": \"suggestion\",
            \"message\": \"Variable should use camelCase naming\",
            \"category\": \"style_guide\",
            \"suggested_fix\": \"Rename 'my_var' to 'myVar' (corrected to match official Pine Script style guide)\"
          }
        ],
        \"version\": \"v6\",
        \"reviewed_lines\": 5
      }"
    }
  ]
}
```

#### Markdown Output Format
```markdown
# PineScript Code Review Results

## Summary
- 🔴 1 Error
- 🟡 0 Warnings
- 💡 1 Suggestion

## Issues

🔴 **Line 1:** Missing PineScript version declaration
- Rule: `version_declaration` (language)
- Suggested fix: Add //@version=6 at the top

💡 **Line 3:** Variable should use camelCase naming
- Rule: `naming_convention` (style_guide) 
- Suggested fix: Rename 'my_var' to 'myVar' (corrected per official style guide)
```

## Performance Characteristics (V1.2 Preloading Optimized)

### Response Times (After Preloading Optimization)
- **pinescript_reference**: ~5-15ms for typical queries (70-85% faster)
- **pinescript_review**: ~3-10ms depending on code length (75-90% faster)
- **Streaming chunks**: <1ms per chunk (95%+ faster delivery)
- **Server startup**: +1 second for preloading (one-time cost)
- **Data access**: 0.0005ms average (4,277x faster than file I/O)

### Memory Usage (Optimized)
- **Server footprint**: ~12MB RAM total (highly efficient)
- **Preloaded data**: 555KB (index + rules + functions)
- **Memory overhead**: <5% increase for >4000x performance gain
- **Concurrent requests**: Unlimited scalability (no file system contention)

### Preloading Architecture Benefits
- **Zero file I/O**: Eliminated disk access bottlenecks completely
- **Predictable latency**: Consistent sub-millisecond data access
- **Real-time streaming**: Zero delays between chunks
- **Concurrent safety**: Multiple requests access data simultaneously
- **Memory efficient**: Negligible overhead on modern systems

### Performance Improvements
- **Search operations**: 70-85% faster response times
- **Code reviews**: 75-90% faster processing
- **Streaming delivery**: 95%+ faster chunk delivery
- **Server throughput**: Dramatically improved concurrent handling

### Rate Limits & Scalability
- **No built-in rate limiting** on MCP tool usage
- **Unlimited concurrency**: No file system contention
- **Scraping rate limited** during documentation updates only
- **Recommended**: No longer limited by file I/O constraints

## Error Handling

### Common Error Scenarios

#### 1. Documentation Not Available
```json
{
  "content": [
    {
      "type": "text", 
      "text": "Documentation not yet available. Run 'npm run update-docs' to download and process PineScript documentation. Error: ENOENT: no such file or directory"
    }
  ]
}
```

**Handling**: Check if documentation has been downloaded, guide user to setup.

#### 2. Empty Query Results
```json
{
  "content": [
    {
      "type": "text",
      "text": "No documentation found for \"xyz123\". Try broader search terms like \"array\", \"style guide\", or \"functions\"."
    }
  ]
}
```

**Handling**: Suggest alternative search terms, retry with broader queries.

#### 3. Invalid Code Input
```json
{
  "violations": [],
  "summary": {
    "total_issues": 0,
    "errors": 0,
    "warnings": 0,
    "suggestions": 0
  }
}
```

**Handling**: Empty violations array indicates either valid code or parsing issues.

## Best Practices for AI Agents

### Query Optimization

#### Effective Search Terms
```javascript
// Good - specific function names
"ta.sma", "array.push", "strategy.entry"

// Good - namespace searches  
"ta functions", "array methods", "string operations"

// Good - concept searches
"conditional structures", "loops", "variable declarations"

// Avoid - too vague
"help", "how to", "functions"
```

#### Context-Aware Usage

**During Planning Phase:**
```json
{"query": "moving average indicators"}
{"query": "style guide best practices"}
{"query": "strategy development patterns"}
```

**During Development:**
```json
{"query": "ta.sma"}
{"query": "plot title parameter"}
{"query": "input.int validation"}
```

**During Review:**
```json
// Use pinescript_review tool instead
{"code": "entire_script_content"}
```

### Code Review Integration

#### Pre-Development Validation
```javascript
// Check style guide before writing
pinescript_reference({query: "naming conventions"})
pinescript_reference({query: "function structure"})
```

#### Post-Development Review
```javascript
// Comprehensive code review
pinescript_review({
  code: full_script_content,
  format: "json"  // For programmatic processing
})
```

#### Iterative Improvement
```javascript
// After fixing issues, re-review
pinescript_review({
  code: updated_script_content,
  format: "markdown"  // For human-readable output
})
```

### Directory Review Workflows (NEW in v1.3.0)

#### Project-Wide Code Quality Assessment
```javascript
// Review entire PineScript project
pinescript_review({
  source_type: "directory",
  directory_path: "./trading-strategies",
  format: "stream",  // Handle large projects efficiently
  severity_filter: "error"  // Focus on critical issues
})

// Single directory review with detailed output
pinescript_review({
  source_type: "directory", 
  directory_path: "./indicators",
  format: "json",
  recursive: true,
  file_extensions: [".pine"]
})

// Non-recursive scan (current directory only)
pinescript_review({
  source_type: "directory",
  directory_path: "./src",
  recursive: false,
  severity_filter: "all"
})
```

#### CI/CD Integration Patterns
```javascript
// Pre-commit hook: Check only errors
pinescript_review({
  source_type: "directory",
  directory_path: process.env.CHANGED_FILES_DIR,
  severity_filter: "error",
  format: "json"
})

// Release validation: Full project scan
pinescript_review({
  source_type: "directory", 
  directory_path: "./",
  format: "stream",
  chunk_size: 50  // Larger chunks for CI efficiency
})
```

### Multi-Tool Workflows

#### Complete Development Cycle
```javascript
// 1. Research phase
await pinescript_reference({query: "RSI indicator development"})

// 2. Style guide consultation  
await pinescript_reference({query: "style guide"})

// 3. Function reference
await pinescript_reference({query: "ta.rsi"})

// 4. Development (write code)

// 5. Code review
await pinescript_review({code: generated_code})

// 6. Refinement based on feedback
```

#### Integration with File Operations
```javascript
// Read existing file
const code = await read_file("script.pine")

// Review existing code
const review = await pinescript_review({code})

// Look up improvements
const reference = await pinescript_reference({query: "performance optimization"})

// Write improved version
await write_file("script.pine", improved_code)
```

## Integration Patterns

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "pinescript": {
      "command": "node",
      "args": ["/path/to/mcp-server-pinescript/index.js"]
    }
  }
}
```

### CLI Integration Examples

#### Claude Code CLI Integration
```bash
# Method 1: Direct MCP server management (recommended)
npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# Usage examples (server auto-detected)
claude -p "Use pinescript_reference to look up ta.sma"
claude -p "Use pinescript_review to check: //@version=6\nindicator('Test')\nplot(close)"

# Method 2: Configuration file approach
# Create mcp-config.json:
{
  "mcpServers": {
    "pinescript": {
      "command": "node", 
      "args": ["./node_modules/mcp-server-pinescript/index.js"]
    }
  }
}

# Then use:
claude --mcp-config mcp-config.json -p "Use pinescript_reference to look up ta.sma"
```

#### Gemini CLI Integration  
```bash
# Usage examples (assuming MCP server configured in Gemini)
gemini --allowed-mcp-server-names pinescript-docs -p "Use pinescript_reference to explain array functions"
gemini --allowed-mcp-server-names pinescript-docs -p "Use pinescript_review to validate this PineScript code"
```

### Usage in Prompts
```
User: "Create a Bollinger Bands indicator using pinescript_reference"
AI: Uses pinescript_reference({query: "bollinger bands"}) to get implementation guidance
AI: Uses pinescript_reference({query: "ta.sma"}) for moving average details  
AI: Writes code following retrieved patterns and style guide
AI: Uses pinescript_review({code: generated_code}) to validate result
```

### Cursor IDE Integration
```javascript
// In cursor rules or AI instructions
"When working with PineScript files (.pine), always use pinescript_reference for function lookups and pinescript_review for code validation before completing tasks."
```

### Custom MCP Client Integration
```javascript
// Example MCP client usage in Node.js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "pinescript-consumer",
  version: "1.0.0"
});

// Connect to PineScript MCP server
await client.connect(transport);

// Use tools
const reference = await client.request({
  method: "tools/call",
  params: {
    name: "pinescript_reference",
    arguments: { query: "ta.sma" }
  }
});

const review = await client.request({
  method: "tools/call", 
  params: {
    name: "pinescript_review",
    arguments: { 
      code: "indicator('Test')\nplot(close)",
      format: "json"
    }
  }
});
```

## Data Structure Reference

### Index Structure
The processed documentation follows this structure:

```json
{
  "hash_id": {
    "title": "Human readable title",
    "type": "reference|style_guide|language",
    "content": "Cleaned markdown content",
    "tags": ["array", "category", "keywords"],
    "examples": ["code_example_1", "code_example_2"]
  }
}
```

### Function Data Structure
```json
{
  "ta.sma": {
    "name": "ta.sma",
    "category": "ta",
    "signature": "ta.sma(source, length) → series[float]",
    "description": "Simple moving average calculation",
    "examples": [
      "ta.sma(close, 14)",
      "plot(ta.sma(close, 20), title=\"SMA\")"
    ]
  }
}
```

### Style Rules Structure (Updated)
```json
{
  "naming_convention": {
    "rule": "Use camelCase for variable names (per official Pine Script v6 style guide)", 
    "severity": "suggestion",
    "category": "style_guide",
    "examples": ["myVariable", "priceData", "signalStrength", "maLengthInput"]
  },
  "constant_naming": {
    "rule": "Use SNAKE_CASE for constants",
    "severity": "suggestion", 
    "category": "style_guide",
    "examples": ["BULL_COLOR", "BEAR_COLOR", "MAX_LOOKBACK"]
  },
  "operator_spacing": {
    "rule": "Add spaces around operators",
    "severity": "suggestion", 
    "category": "style_guide",
    "examples": ["a + b", "close > open", "x = y * 2"]
  }
}
```

## Performance Optimization Tips

### Caching Results
```javascript
// Cache frequent queries to reduce response time
const cache = new Map();

async function cachedReference(query) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const result = await pinescript_reference({query});
  cache.set(query, result);
  return result;
}
```

### Batch Processing
```javascript
// Process multiple queries efficiently
const queries = ["ta.sma", "ta.ema", "ta.rsi"];
const results = await Promise.all(
  queries.map(query => pinescript_reference({query}))
);
```

### Memory Management (Preloading Optimized)
```javascript
// Monitor memory usage with preloaded data
function getMemoryStats() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    preloadedDataSize: 555, // KB
    efficiency: '555KB overhead for 4,277x performance gain'
  };
}

// Memory usage is now predictable and minimal
const stats = getMemoryStats();
console.log(`Memory: ${stats.heapUsed}MB (${stats.efficiency})`);
```

## Troubleshooting for AI Systems

### Connection Issues
```javascript
// Retry logic for MCP connections
async function connectWithRetry(transport, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect(transport);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Response Validation
```javascript
// Validate tool responses
function validateReferenceResponse(response) {
  if (!response.content?.[0]?.text) {
    throw new Error('Invalid response format');
  }
  
  try {
    const data = JSON.parse(response.content[0].text);
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Missing or invalid results array');
    }
  } catch (e) {
    throw new Error('Response is not valid JSON');
  }
}
```

### Fallback Strategies
```javascript
// Graceful degradation when tools are unavailable
async function safeReference(query) {
  try {
    return await pinescript_reference({query});
  } catch (error) {
    console.warn(`Reference lookup failed for "${query}": ${error.message}`);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          results: [],
          total_found: 0,
          error: 'Documentation service unavailable'
        })
      }]
    };
  }
}
```

## Version Compatibility

### Version Detection
```javascript
// Check available versions
const versions = await pinescript_reference({query: "version"});

// Use specific version
const v6Result = await pinescript_reference({
  query: "ta.sma",
  version: "v6"
});
```

### Migration Support
```javascript
// When v7 becomes available
const migrationGuide = await pinescript_reference({
  query: "migration guide v6 to v7",
  version: "v7"
});
```

## Security Considerations

### Input Sanitization
```javascript
// Sanitize code input for review
function sanitizeCode(code) {
  // Remove potentially harmful content
  return code
    .replace(/import\s+["'][^"']*["']/g, '') // Remove imports
    .replace(/export\s+/g, '')              // Remove exports
    .substring(0, 50000);                   // Limit length
}

const review = await pinescript_review({
  code: sanitizeCode(userProvidedCode)
});
```

### Rate Limiting
```javascript
// Implement client-side rate limiting
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.requests[0] + this.windowMs - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

## Monitoring and Logging

### Request Logging
```javascript
// Log all tool requests for debugging
function logRequest(toolName, args, response) {
  console.log({
    timestamp: new Date().toISOString(),
    tool: toolName,
    query: args.query || 'N/A',
    responseSize: JSON.stringify(response).length,
    success: !response.error
  });
}
```

### Performance Metrics
```javascript
// Track performance metrics
const metrics = {
  requestCount: 0,
  totalResponseTime: 0,
  errorCount: 0
};

async function timedRequest(toolName, args) {
  const start = Date.now();
  metrics.requestCount++;
  
  try {
    const response = await tools[toolName](args);
    metrics.totalResponseTime += Date.now() - start;
    return response;
  } catch (error) {
    metrics.errorCount++;
    throw error;
  }
}
```

This comprehensive guide should enable AI systems to effectively integrate with and utilize the PineScript MCP Documentation Server for optimal PineScript development workflows.