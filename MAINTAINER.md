# Maintainer Documentation

This document is for developers who maintain, contribute to, or need to understand the internal architecture of the PineScript MCP Documentation Server.

## Development Setup

### Prerequisites
- Node.js 18+
- Firecrawl API key
- Git

### Development Installation
```bash
git clone git@github.com:iamrichardD/mcp-server-pinescript.git
cd mcp-server-pinescript
npm install
export FIRECRAWL_API_KEY="your_api_key_here"
```

### Testing the Server
```bash
# Test server startup
npm start

# Test documentation update
npm run update-docs

# Test with sample MCP calls
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"pinescript_reference","arguments":"{\"query\":\"ta.sma\"}"}}' | npm start
```

## Architecture Overview

### Core Components

#### 1. MCP Server (`index.js`)
- **Purpose**: Main MCP server implementation
- **Key Functions**:
  - `searchReference()`: Handles pinescript_reference tool calls
  - `reviewCode()`: Handles pinescript_review tool calls
  - `formatAsMarkdown()`: Converts JSON output to human-readable format

#### 2. Documentation Processor (`scripts/update-docs.js`)
- **Purpose**: Scrapes and processes TradingView documentation
- **Key Classes**:
  - `PineScriptDocProcessor`: Main processing orchestrator
- **Key Methods**:
  - `scrapeWithRetry()`: Resilient scraping with exponential backoff
  - `processStyleGuideContent()`: Extracts style rules
  - `processReferenceContent()`: Extracts function definitions
  - `generateHash()`: Creates performance-optimized filenames

### Data Flow

```
TradingView Docs → Firecrawl → Raw Markdown → Processing Pipeline → Structured JSON → MCP Tools
```

1. **Scraping**: Firecrawl converts HTML to markdown
2. **Processing**: Extract functions, rules, examples from markdown
3. **Storage**: Hash-based filenames in flat directory structure
4. **Indexing**: JSON files for fast lookups
5. **Serving**: MCP tools query indexed data

### Performance Optimizations

#### File System
- **Hash-based filenames**: O(1) file access using MD5 hashes
- **Flat directory structure**: Eliminates filesystem traversal overhead
- **JSON data format**: Native JavaScript parsing, zero dependencies

#### Search Performance
- **In-memory indexing**: All processed data loaded into memory
- **Grep-style search**: Simple string matching, no complex queries
- **Result limiting**: Max 10 results to prevent memory issues

#### Rate Limiting
- **Base delay**: 5 seconds between requests
- **Exponential backoff**: 10s, 20s, 30s on 429 errors
- **Graceful degradation**: Continue processing if individual pages fail

## Adding New Documentation Sources

### 1. Modify `scripts/update-docs.js`

Add new scraping method:
```javascript
async scrapeNewSource() {
  console.log('📘 Scraping new source...');
  
  const url = 'https://example.com/new-docs';
  const result = await this.scrapeWithRetry(url, {
    formats: ['markdown'],
  });
  
  await this.processNewContent(result.markdown);
}
```

### 2. Add Processing Method
```javascript
async processNewContent(markdown) {
  const hash = this.generateHash(markdown);
  const filename = `${hash}.md`;
  
  // Save raw markdown
  await fs.writeFile(
    path.join(rootDir, 'docs', this.version, filename),
    markdown
  );
  
  // Extract structured data
  const data = this.extractNewData(markdown);
  Object.assign(this.newDataType, data);
  
  // Add to index
  this.processedIndex[hash] = {
    title: 'New Documentation Type',
    type: 'new_type',
    content: this.cleanMarkdown(markdown),
    tags: ['new', 'documentation'],
  };
}
```

### 3. Update Main Flow
Add call to `updateDocumentation()` method:
```javascript
await this.scrapeNewSource();
await this.delay(3000);
```

## Data Processing Pipeline

### Input Processing
1. **Markdown Cleaning**: Remove images, links, format headers
2. **Code Example Extraction**: Find ```code``` blocks
3. **Function Parsing**: Extract function signatures and descriptions
4. **Rule Extraction**: Identify style guide rules and patterns

### Output Generation
1. **Index Creation**: Master lookup table with all content
2. **Category Separation**: Functions, style rules, language concepts
3. **Hash Generation**: MD5 of content for consistent filenames
4. **JSON Serialization**: Structured data for MCP consumption

### File Organization
```
docs/
├── v6/                     # Version-specific raw markdown (gitignored)
│   ├── a1b2c3d4.md        # Hashed filenames for performance
│   └── f7e8d9c2.md
└── processed/             # Structured data (committed to git)
    ├── index.json         # Master search index
    ├── functions.json     # API reference
    ├── language.json      # Language concepts
    └── style-rules.json   # Style guide rules
```

## Testing and Validation

### Unit Testing (TODO)
```bash
npm test  # Not yet implemented
```

### Manual Testing
```bash
# Test documentation update
npm run update-docs

# Verify processed files
ls -la docs/processed/
cat docs/processed/index.json | jq keys | head

# Test MCP tools
npm start &
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | nc localhost 3000
```

### Integration Testing
1. **Fresh Environment**: Test on clean system
2. **Rate Limiting**: Verify 429 error handling
3. **Data Validation**: Check processed JSON structure
4. **MCP Compliance**: Test with actual MCP clients

## Release Process

### Version Updates

1. **Update Version Numbers**
   ```bash
   npm version patch|minor|major
   ```

2. **Test Changes**
   ```bash
   npm run update-docs
   npm start  # Test in separate terminal
   ```

3. **Commit and Tag**
   ```bash
   git add .
   git commit -m "Release vX.Y.Z"
   git tag -a vX.Y.Z -m "Version X.Y.Z release notes"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main --tags
   ```

5. **Create GitHub Release**
   - Go to GitHub releases page
   - Select tag
   - Add release notes
   - Publish release

### PineScript Version Updates

When PineScript v7 is released:

1. **Update Version Variable**
   ```javascript
   // In scripts/update-docs.js
   this.version = 'v7';  // Change from 'v6'
   ```

2. **Update Documentation URLs**
   ```javascript
   const baseUrl = 'https://www.tradingview.com/pine-script-reference/v7';
   ```

3. **Run Documentation Update**
   ```bash
   npm run update-docs
   ```

4. **Test Both Versions**
   ```bash
   # Test v6 compatibility
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"pinescript_reference","arguments":"{\"version\":\"v6\",\"query\":\"ta.sma\"}"}}' | npm start

   # Test v7 (new default)
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"pinescript_reference","arguments":"{\"query\":\"ta.sma\"}"}}' | npm start
   ```

## Troubleshooting

### Common Development Issues

#### 1. Firecrawl API Errors
```
Error: HTTP 403: API key invalid
```
**Solutions**:
- Verify `FIRECRAWL_API_KEY` environment variable
- Check API key at https://firecrawl.dev/
- Ensure sufficient API credits

#### 2. Rate Limiting During Development
```
Error: Status code: 429
```
**Solutions**:
- Wait for rate limit to reset (usually 1 hour)
- Use smaller test datasets during development
- Implement longer delays in development builds

#### 3. Memory Issues
```
Error: JavaScript heap out of memory
```
**Solutions**:
- Increase Node.js memory: `node --max-old-space-size=4096 scripts/update-docs.js`
- Process documentation in smaller batches
- Clear processed data between versions

#### 4. Git Issues with Large Files
```
Error: File too large
```
**Solutions**:
- Ensure `.gitignore` excludes `docs/v*/` directories
- Only commit processed JSON files
- Use `git reset` to unstage large files

### Performance Monitoring

#### Metrics to Track
- **Scraping Duration**: Total time for documentation update
- **File Count**: Number of processed documentation entries
- **Index Size**: Size of processed JSON files
- **Memory Usage**: Peak memory during processing
- **API Calls**: Number of Firecrawl requests made

#### Optimization Opportunities
- **Caching**: Cache successful scrapes during development
- **Parallel Processing**: Scrape multiple categories simultaneously
- **Incremental Updates**: Only update changed pages
- **Compression**: Gzip large JSON files

## Contributing Guidelines

### Code Style
- ES6+ modules
- Async/await for asynchronous operations
- Descriptive variable names
- Error handling for all API calls

### Commit Messages
- Use conventional commits format
- Include emoji for visual categorization
- Reference issues when applicable

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request
6. Respond to review feedback

## Package Configuration

### Files Included in Distribution

The `package.json` includes a `files` field to control what gets included when users install the package via GitHub:

```json
{
  "files": [
    "index.js",
    "docs/processed/",
    "README.md",
    "USER-GUIDE.md",
    "AI-INTEGRATION.md",
    "MAINTAINER.md"
  ]
}
```

**Important**: The `docs/processed/` directory contains the essential documentation data that the MCP server requires to function. Without these files, users will see "Documentation not yet available" errors.

### .npmignore Configuration

The `.npmignore` file excludes development artifacts while ensuring essential files are included:

```
# Exclude development and build artifacts
node_modules/
.git/
.github/
.vscode/
.idea/

# Exclude raw documentation files (keep processed ones)
docs/v*/

# Exclude development files
scripts/update-docs.js

# Keep these important files (explicit inclusion)
# index.js - main server file
# docs/processed/ - processed documentation data
# README.md, USER-GUIDE.md, AI-INTEGRATION.md, MAINTAINER.md - documentation
```

### GitHub Installation Issues

When users install via `npm install git+git@github.com:...`, the following issues may occur:

#### Common Problems:
1. **Missing processed files**: If `docs/processed/` isn't properly included
2. **Path resolution**: Server can't find files when installed in `node_modules`
3. **Permission issues**: Files not readable in installed location

#### Debugging Steps:
1. **Check package contents after installation**:
   ```bash
   ls -la node_modules/mcp-server-pinescript/
   ls -la node_modules/mcp-server-pinescript/docs/processed/
   ```

2. **Test server startup**:
   ```bash
   node ./node_modules/mcp-server-pinescript/index.js
   # Look for specific error messages about missing files
   ```

3. **Verify file inclusion**:
   - Ensure `docs/processed/` is committed to Git
   - Check `.gitignore` doesn't exclude processed files
   - Verify `package.json` files field includes necessary directories

#### Error Message Enhancements:
The server includes debugging code that provides specific file paths when documentation is missing:

```javascript
// Debug: Check if file exists
try {
  await fs.access(indexPath);
} catch (accessError) {
  throw new Error(`Documentation index not found at ${indexPath}. Please ensure the repository includes the docs/processed/ directory.`);
}
```

This helps users and maintainers quickly identify whether the issue is:
- Missing files in the package
- Incorrect path resolution
- File permission problems

### Testing Package Installation

Before releasing updates that affect packaging:

1. **Test GitHub installation in clean environment**:
   ```bash
   mkdir test-install && cd test-install
   npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git
   claude mcp add test-pinescript node ./node_modules/mcp-server-pinescript/index.js
   claude mcp list  # Should show ✓ Connected
   ```

2. **Verify all essential files are present**:
   ```bash
   ls -la node_modules/mcp-server-pinescript/docs/processed/
   # Should show: functions.json, index.json, language.json, style-rules.json
   ```

3. **Test functionality**:
   ```bash
   claude -p "Use pinescript_reference to look up ta.sma"
   # Should return structured documentation, not error messages
   ```

## Security Considerations

### API Key Management
- Never commit API keys to repository
- Use environment variables for credentials
- Rotate API keys regularly
- Monitor API usage for anomalies

### Rate Limiting
- Respect TradingView's terms of service
- Implement conservative rate limiting
- Add user-agent identification
- Monitor for 429/403 responses

### Data Validation
- Sanitize all scraped content
- Validate JSON structure before saving
- Prevent path traversal in file operations
- Limit memory usage during processing