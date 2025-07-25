# PineScript MCP Documentation Server

AI-optimized Model Context Protocol (MCP) server for PineScript v6 development, providing comprehensive documentation access, style guide adherence, and code review capabilities specifically designed for AI coding agents.

## 📖 Documentation for Different Users

This project serves three distinct audiences with tailored documentation:

- **👤 [User Guide](USER-GUIDE.md)**: For developers integrating this into their AI workflow
- **🔧 [Maintainer Guide](MAINTAINER.md)**: For contributors and project maintainers  
- **🤖 [AI Integration Guide](AI-INTEGRATION.md)**: For AI systems and MCP client developers

**New users should start with the [User Guide](USER-GUIDE.md)** for quick setup and usage examples.

## Features

### 🔍 **pinescript_reference**
Context-aware documentation lookup for development and planning:
- Style guide patterns and conventions
- Language syntax and concepts  
- Complete API reference with examples
- Grep-style keyword search for instant results

### 🔧 **pinescript_review** 
Code validation against official style guide and language rules:
- Structured violation reports (JSON/Markdown)
- Severity levels: errors, warnings, suggestions
- Style guide compliance checking
- Function usage verification

## Quick Start

### For End Users (Recommended)

**See the [USER-GUIDE.md](USER-GUIDE.md) for complete setup instructions.**

Quick installation with Claude Code CLI:
```bash
# 1. Install from GitHub repository
npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git

# 2. Add MCP server
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# 3. Verify connection
claude mcp list
# Should show: pinescript-docs: node ./node_modules/mcp-server-pinescript/index.js - ✓ Connected

# 4. Use in Claude Code CLI
claude -p "Use pinescript_reference to look up ta.sma function"
```

### For Local Development

```bash
# 1. Clone repository
git clone https://github.com/iamrichardD/mcp-server-pinescript.git
cd mcp-server-pinescript

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

The PineScript v6 documentation is already processed and included in the repository.

## Usage Examples

### Development Workflow
```
User: "Create a moving average indicator using pinescript_reference"
AI: Uses pinescript_reference(query="moving average indicator")
→ Returns style guide patterns + ta.sma function reference + examples
```

### Code Review Workflow  
```
User: "Code review @my_script.pine using pinescript_review"
AI: Uses pinescript_review(code=file_content)
→ Returns JSON with style violations and function usage issues
```

### Integration Pattern
```
User: "Implement RSI strategy, then review the code"
AI: 
1. Uses pinescript_reference for RSI implementation guidance
2. Writes code following style guide
3. Uses pinescript_review for validation
4. Provides final polished code
```

## MCP Tools Documentation

### pinescript_reference

**Purpose**: Search PineScript documentation for development guidance

**Parameters**:
- `query` (string, required): Search term or topic
  - Examples: "array functions", "style guide naming", "ta.sma"
- `version` (string, optional): PineScript version (default: "v6")

**Returns**: JSON with relevant documentation sections, code examples, and style guide rules

### pinescript_review

**Purpose**: Review PineScript code against official standards

**Parameters**:
- `code` (string, required): PineScript code to review
- `format` (string, optional): Output format - "json" (default) or "markdown"
- `version` (string, optional): PineScript version (default: "v6")

**Returns**: Structured violation report with severity levels and suggestions

## Architecture

### Performance-Optimized Design
- **Hash-based filenames**: Fastest possible file access (O(1) lookups)
- **Flat directory structure**: Zero filesystem traversal overhead
- **JSON data format**: Native JavaScript parsing, no dependencies
- **Individual function granularity**: Direct access without nested searching
- **Grep-style search**: Instant keyword matching

### Directory Structure
```
/docs/
  /v6/                    # Current version (hash-based filenames)
    a1b2c3d4.md          # Style guide
    f7e8d9c2.md          # ta.sma function
    e3f4g5h6.md          # array.at function
    ...
  /v7/                    # Future version (when released)
  /processed/
    index.json           # Master search index
    style-rules.json     # Structured style rules
    functions.json       # API reference data
    language.json        # Language concepts
```

## Documentation Updates (For Maintainers)

**Note**: End users don't need to update documentation - it's already included in the repository.

Maintainers update documentation when:
- New PineScript versions are released (typically multi-year intervals)  
- Significant documentation changes are published by TradingView

See [MAINTAINER.md](MAINTAINER.md) for detailed update procedures.


## Integration with Claude Desktop

Add to your Claude Desktop configuration:

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

## Multi-Server Workflows

This server is designed to integrate with other MCP servers:

- **File servers**: Read PineScript files for review
- **Code execution servers**: Test generated PineScript code
- **Git servers**: Commit reviewed and validated code
- **Documentation servers**: Cross-reference with TradingView platform docs

## Troubleshooting

### Documentation Not Available
```
Error: Documentation not yet available. Run 'npm run update-docs'
```
**Solution**: The processed documentation should be included in the repository. If you see this error, please file a GitHub issue as the documentation files may be missing.

### Empty Results
```
No documentation found for "query"
```
**Solutions**:
- Try broader search terms ("array" instead of "array.at")
- Check spelling and terminology
- Verify documentation was successfully downloaded

## Development

### Project Structure
- `index.js`: Main MCP server implementation
- `scripts/update-docs.js`: Documentation scraping and processing
- `docs/`: All documentation storage (gitignored raw files)
- `docs/processed/`: Structured data files (committed to Git)

### Adding New Documentation Sources
1. Modify `scripts/update-docs.js`
2. Add new scraping methods
3. Update processing pipeline
4. Test with `npm run update-docs`

## Future Enhancements

### Planned for v7 Release
- Automatic version detection
- Side-by-side version comparison
- Migration guide integration
- Enhanced function signature parsing

### Potential Features
- Semantic search capabilities
- Code example generation
- Integration with Pine Editor
- Custom rule configuration

## Requirements

- Node.js 18+
- Firecrawl API key
- Internet connection for documentation updates

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Update documentation
5. Submit pull request

## Support

For issues and feature requests, please use the GitHub issue tracker.