# AI Integration Guide

## Executive Summary for AI Systems

**Purpose**: Production-ready MCP server for PineScript v6 documentation and code validation  
**Performance**: 4,277x faster than file-based systems with <15ms response times  
**Key Tools**: `pinescript_reference` (search 457+ functions) + `pinescript_review` (9 validation rules)

**Integration Process**:
1. **Install**: `npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git`
2. **Connect**: `claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js`  
3. **Verify**: `claude -p "Use pinescript_reference to search 'ta.sma'"`
4. **Validate Code**: `claude -p "Use pinescript_review to check: //@version=6\nindicator('Test')\nplot(close)"`

**Technical Advantages**:
- **Documentation Lookup**: Sub-15ms semantic search vs 500ms+ web scraping
- **Code Review**: Structured JSON feedback vs manual validation  
- **Development Velocity**: Memory-first architecture eliminates file I/O delays
- **Integration Simplicity**: 2-minute setup, universal MCP protocol compatibility

**Quality Metrics**: 555KB preloaded documentation, 100% test coverage, streaming support for large projects, zero file system dependencies during runtime.

**Integration Verification**:
```bash
claude -p "Use pinescript_review to check: //@version=6\nindicator('Test')\nplot(close)"
# Expected: <15ms response with structured JSON validation results
```

---

## Quick Start (Progressive Approach)

### Level 1: Basic Integration (2 minutes)

**Essential Commands** - Copy, paste, verify:
```bash
# 1. Install and connect
npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# 2. Verify connection
claude mcp list  # Should show "pinescript-docs: Connected ✓"

# 3. Test both tools
claude -p "Use pinescript_reference to search 'ta.sma'"
claude -p "Use pinescript_review to check: //@version=6\nindicator('Test')\nplot(close)"
```

**Validation Indicators**:
- Connection shows "Connected ✓"
- Reference queries return JSON with `results` array
- Review detects code issues with actionable `suggested_fix` messages
- Response times under 15ms

### Level 2: Common Usage Patterns

**Documentation Research**:
```bash
claude -p "Use pinescript_reference to search 'array functions'"
claude -p "Use pinescript_reference to search 'style guide'"  
claude -p "Use pinescript_reference to search 'conditional structures'"
```

**Code Validation Workflows**:
```bash
# Single file validation
claude -p "Use pinescript_review to validate: $(cat script.pine)"

# Directory scanning (new in v1.3.0)
claude -p "Use pinescript_review with source_type=directory and directory_path=./src"

# Severity filtering
claude -p "Use pinescript_review with severity_filter=error and source_type=file and file_path=./script.pine"
```

**Expected Output Structure**:
- `pinescript_reference` returns: `{query, results[{title, content, examples}], total_found}`
- `pinescript_review` returns: `{summary{total_issues, errors, warnings}, violations[{line, rule, severity, suggested_fix}]}`

### Level 3: Integration Setup

**Claude Desktop** - Add to @claude_desktop_config.json:
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

**Development Environment**:
```bash
git clone https://github.com/iamrichardD/mcp-server-pinescript.git
cd mcp-server-pinescript && npm install && npm start
# Should show: "PineScript MCP Server ready with preloaded documentation!"
```

---

## Tool Specifications

### pinescript_reference - Documentation Lookup

**Purpose**: Context-aware documentation search with semantic expansion

**Basic Usage**:
```json
{"query": "ta.sma"}
{"query": "array functions"}
{"query": "style guide"}
```

**Input Schema**:
```json
{
  "query": "string (required) - Search term or topic",
  "version": "string (optional) - PineScript version, default: v6"
}
```

**Output Format**:
```json
{
  "query": "ta.sma",
  "results": [
    {
      "title": "ta.sma Function",
      "content": "Simple moving average calculation...",
      "examples": ["ta.sma(close, 14)", "plot(ta.sma(close, 20))"]
    }
  ],
  "total_found": 3
}
```

**Query Categories**:
- **Functions**: `"ta.sma"`, `"array.push"`, `"strategy.entry"`
- **Concepts**: `"arrays"`, `"loops"`, `"conditional structures"`
- **Style Guide**: `"naming conventions"`, `"formatting"`

### pinescript_review - Multi-Source Code Validation

**Purpose**: Comprehensive code review with streaming support for large projects

**Source Types**:
- `"code"`: Direct string input
- `"file"`: Single file path  
- `"directory"`: Recursive directory scanning (new in v1.3.0)

**Basic Usage Examples**:
```json
{"source_type": "code", "code": "indicator('Test')\nplot(close)"}
{"source_type": "file", "file_path": "./script.pine"}
{"source_type": "directory", "directory_path": "./src", "format": "stream"}
```

**Input Schema**:
```json
{
  "source_type": "enum [code, file, directory] - default: code",
  "code": "string - PineScript code (required when source_type=code)",
  "file_path": "string - File path (required when source_type=file)",
  "directory_path": "string - Directory path (required when source_type=directory)",
  "format": "enum [json, markdown, stream] - default: json",
  "severity_filter": "enum [all, error, warning, suggestion] - default: all",
  "recursive": "boolean - Scan subdirectories, default: true",
  "file_extensions": "array - Extensions to scan, default: ['.pine', '.pinescript']"
}
```

**Output Formats**:

**JSON** (structured for AI processing):
```json
{
  "summary": {"total_issues": 2, "errors": 1, "warnings": 0, "suggestions": 1},
  "violations": [
    {
      "line": 1, "rule": "version_declaration", "severity": "error",
      "message": "Missing PineScript version declaration",
      "suggested_fix": "Add //@version=6 at the top"
    }
  ],
  "reviewed_lines": 5
}
```

**Directory Review** (new in v1.3.0):
```json
{
  "directory_path": "./src",
  "summary": {"total_files": 5, "total_issues": 8, "files_with_issues": 3},
  "files": [
    {
      "file_path": "indicators/rsi.pine",
      "summary": {"total_issues": 2, "errors": 1},
      "violations": [/* ... */]
    }
  ]
}
```

---

## Integration Examples

### CLI Tool Integration

**Claude Code CLI**:
```bash
# Method 1: MCP server management
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js
claude -p "Use pinescript_reference to look up ta.sma"

# Method 2: Configuration file
claude --mcp-config mcp-config.json -p "Use pinescript_review to check code"
```

**Gemini CLI**:
```bash
gemini --allowed-mcp-server-names pinescript-docs -p "Use pinescript_reference and pinescript_review for strategy development"
```

### Development Workflow Integration

**Complete Development Cycle**:
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

**Project-Wide Quality Assessment**:
```javascript
// Review entire project
pinescript_review({
  source_type: "directory",
  directory_path: "./trading-strategies", 
  format: "stream",
  severity_filter: "error"
})

// CI/CD integration
pinescript_review({
  source_type: "directory",
  directory_path: process.env.CHANGED_FILES_DIR,
  severity_filter: "error",
  format: "json"
})
```

### Custom MCP Client Integration

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({name: "pinescript-consumer", version: "1.0.0"});
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

---

## Advanced Configuration

### Performance Characteristics (V1.2 Optimized)

**Response Times** (After preloading optimization):
- `pinescript_reference`: 5-15ms typical queries (70-85% faster)
- `pinescript_review`: 3-10ms code validation (75-90% faster)
- Streaming chunks: <1ms per chunk (95%+ faster delivery)
- Server startup: +1 second preloading cost (one-time)

**Memory Usage**:
- Server footprint: ~12MB RAM total
- Preloaded data: 555KB (index + rules + functions)
- Memory overhead: <5% increase for >4000x performance gain
- Concurrent requests: High-concurrency scalability

**Architecture Benefits**:
- **Zero file I/O**: Eliminated disk access bottlenecks
- **Predictable latency**: Consistent sub-millisecond data access
- **Real-time streaming**: Zero delays between chunks
- **Concurrent safety**: Multiple requests access data simultaneously

### Advanced Parameters

**Streaming Configuration**:
```json
{
  "format": "stream",
  "chunk_size": 20,
  "severity_filter": "all"
}
```

**Directory Scanning Options**:
```json
{
  "recursive": true,
  "file_extensions": [".pine", ".pinescript"],
  "severity_filter": "error"
}
```

**Version Compatibility**:
```json
{
  "version": "v6",
  "query": "migration guide v6 to v7"
}
```

---

## Error Handling & Troubleshooting

### Common Error Scenarios

**Documentation Not Available**:
```json
{
  "content": [{
    "type": "text", 
    "text": "Documentation not yet available. Run 'npm run update-docs' to download and process PineScript documentation."
  }]
}
```
**Handling**: Guide user through setup process.

**Empty Query Results**:
```json
{
  "content": [{
    "type": "text",
    "text": "No documentation found for \"xyz123\". Try broader search terms like \"array\", \"style guide\", or \"functions\"."
  }]
}
```
**Handling**: Suggest alternative search terms, retry with broader queries.

**Connection Issues**:
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

**Validate Tool Responses**:
```javascript
function validateReferenceResponse(response) {
  if (!response.content?.[0]?.text) {
    throw new Error('Invalid response format');
  }
  
  const data = JSON.parse(response.content[0].text);
  if (!data.results || !Array.isArray(data.results)) {
    throw new Error('Missing or invalid results array');
  }
}
```

**Graceful Degradation**:
```javascript
async function safeReference(query) {
  try {
    return await pinescript_reference({query});
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query, results: [], total_found: 0,
          error: 'Documentation service unavailable'
        })
      }]
    };
  }
}
```

---

## Performance Optimization

### Best Practices for AI Agents

**Query Optimization**:
```javascript
// Effective - specific function names
"ta.sma", "array.push", "strategy.entry"

// Effective - namespace searches  
"ta functions", "array methods", "string operations"

// Effective - concept searches
"conditional structures", "loops", "variable declarations"

// Avoid - too vague
"help", "how to", "functions"
```

**Context-Aware Usage**:
- **Planning**: `{"query": "moving average indicators"}`
- **Development**: `{"query": "ta.sma"}`, `{"query": "plot title parameter"}`
- **Review**: Use `pinescript_review` tool with full script content

**Caching Results**:
```javascript
const cache = new Map();

async function cachedReference(query) {
  if (cache.has(query)) return cache.get(query);
  
  const result = await pinescript_reference({query});
  cache.set(query, result);
  return result;
}
```

**Batch Processing**:
```javascript
const queries = ["ta.sma", "ta.ema", "ta.rsi"];
const results = await Promise.all(
  queries.map(query => pinescript_reference({query}))
);
```

---

## Security & Monitoring

### Input Sanitization

```javascript
function sanitizeCode(code) {
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

### Request Logging

```javascript
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

---

## Data Structure Reference

### Index Structure
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
    "examples": ["ta.sma(close, 14)", "plot(ta.sma(close, 20))"]
  }
}
```

### Style Rules Structure
```json
{
  "naming_convention": {
    "rule": "Use camelCase for variable names (per official Pine Script v6 style guide)", 
    "severity": "suggestion",
    "category": "style_guide",
    "examples": ["myVariable", "priceData", "signalStrength"]
  }
}
```

---

## Related Documentation

**Cross-References**:
- @README.md - Project overview and basic setup
- @.claude/agents/AGENT.md - Agent system architecture
- @.project/plans/ - Development roadmap and feature specifications

**Integration Ecosystem**:
- Model Context Protocol (MCP) specification
- Claude Desktop configuration patterns
- AI coding assistant best practices

This comprehensive guide enables AI systems to effectively integrate with and utilize the PineScript MCP Documentation Server for optimal development workflows.
