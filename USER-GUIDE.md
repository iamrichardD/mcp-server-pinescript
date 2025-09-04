# User Guide

This guide is for developers who want to integrate the PineScript MCP Documentation Server into their AI-powered coding workflow.

## What This Does

The PineScript MCP Documentation Server provides two tools for AI assistants:

- **🔍 pinescript_reference**: Get instant access to PineScript documentation, style guides, and function references
- **🔧 pinescript_review**: Automatically review PineScript code, files, or entire directories for style and syntax issues

## Quick Setup

### 1. Install
```bash
git clone https://github.com/iamrichardD/mcp-server-pinescript.git
cd mcp-server-pinescript
npm install
```

### 2. Start the Server
```bash
npm start
```

The server is now ready to use. The PineScript v6 documentation is already processed and included in the repository.

## Integration with AI Tools

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

### Claude Code CLI

#### Installation and Setup
```bash
# 1. Install the package from GitHub
npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git

# 2. Add the MCP server (choose your preferred name)
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# 3. Verify it's connected
claude mcp list
# Should show: pinescript-docs: node ./node_modules/mcp-server-pinescript/index.js - ✓ Connected
```

#### Usage Examples
```bash
# Interactive mode
claude
# Then use: "Use pinescript_reference to look up ta.sma function"

# Non-interactive mode
claude -p "Use pinescript_reference to look up ta.sma function"
claude -p "Use pinescript_review to check this code: //@version=6\nindicator('Test')\nplot(close)"
```

#### Alternative Configuration Methods

**Option 1: Project Scope (recommended for project-specific use)**
```bash
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js --scope project
# Creates .mcp.json in your project directory
```

**Option 2: Config File Approach**
Create `mcp-config.json`:
```json
{
  "mcpServers": {
    "pinescript": {
      "command": "node",
      "args": ["./node_modules/mcp-server-pinescript/index.js"]
    }
  }
}
```

Then use:
```bash
claude --mcp-config mcp-config.json -p "Use pinescript_reference to look up ta.sma"
```

### Gemini CLI

```bash
# Start interactive session (assuming MCP server configured in Gemini)
gemini --allowed-mcp-server-names pinescript

# Single query
gemini --allowed-mcp-server-names pinescript -p "Use pinescript_reference to explain array functions in PineScript"
```

**Note**: Gemini CLI MCP configuration may vary - check Gemini documentation for MCP server setup.

### Cursor IDE

Add to your `.cursorrules` file:
```
When working with PineScript files (.pine):
1. Use pinescript_reference for function lookups and documentation
2. Use pinescript_review to validate code before completion
3. Follow PineScript v6 style guidelines from the documentation
```

## How to Use

### Getting Documentation

Ask your AI assistant natural questions:

```
"Use pinescript_reference to show me how to create moving averages"
"Look up array functions using pinescript_reference"
"Find style guide naming conventions with pinescript_reference"
```

**Common Searches:**
- Function names: `"ta.sma"`, `"array.push"`, `"strategy.entry"`
- Concepts: `"arrays"`, `"loops"`, `"conditional structures"`
- Style guide: `"naming conventions"`, `"formatting rules"`

### Code Review

Have your AI assistant review your code in multiple ways:

**Inline Code Review:**
```
"Review this PineScript code using pinescript_review"
```

**Single File Review:**
```
"Use pinescript_review to check the file ./indicators/my_rsi.pine"
```

**Directory Review (NEW in v1.3.0):**
```
"Review all PineScript files in my project using pinescript_review with directory_path ./src"
"Check my entire indicators directory for style violations"
```

## Workflow Examples

### Creating a New Indicator (Claude Code CLI)

```bash
# 1. Research RSI indicators
claude --mcp-config mcp-config.json -p "Use pinescript_reference to research RSI indicators and show implementation patterns"

# 2. Check style guide
claude --mcp-config mcp-config.json -p "Use pinescript_reference to find style guide for indicator structure and naming conventions"

# 3. Interactive development session
claude --mcp-config mcp-config.json
# Then in interactive mode:
# "Create an RSI indicator using the patterns from pinescript_reference, then review it with pinescript_review"

# 4. Review specific code file
claude --mcp-config mcp-config.json -p "Use pinescript_review to check this PineScript file: $(cat my_rsi_indicator.pine)"
```

### Debugging Existing Code (Gemini CLI)

```bash
# 1. Review existing file for issues
gemini --allowed-mcp-server-names pinescript -p "Use pinescript_review to find issues in this code: $(cat broken_script.pine)"

# 2. Look up correct function syntax
gemini --allowed-mcp-server-names pinescript -p "Use pinescript_reference to show the correct syntax for strategy.entry function"

# 3. Interactive debugging session
gemini --allowed-mcp-server-names pinescript
# Then ask: "Help me fix the issues found in the review using pinescript_reference for correct syntax"
```

### Learning PineScript Concepts

```bash
# Learn about arrays
claude --mcp-config mcp-config.json -p "Use pinescript_reference to explain PineScript arrays with examples"

# Practice with immediate feedback
claude --mcp-config mcp-config.json -p "Help me write a simple array manipulation script, then use pinescript_review to check my code"

# Study conditional structures
claude --mcp-config mcp-config.json -p "Use pinescript_reference to show examples of conditional structures and best practices"
```

### File-Based Workflows

```bash
# Create and review a new script
echo '//@version=6
indicator("My Test")
myVar = close
plot(myVar)' > test_script.pine

# Review the file
claude --mcp-config mcp-config.json -p "Use pinescript_review to check this file: $(cat test_script.pine)"

# Get improvement suggestions and apply them
claude --mcp-config mcp-config.json -p "Based on the pinescript_review results, use pinescript_reference to find better practices for this code: $(cat test_script.pine)"
```

### Directory Review Workflows (NEW in v1.3.0)

```bash
# Review entire project directory
claude --mcp-config mcp-config.json -p "Use pinescript_review with source_type=directory and directory_path=./src to review all PineScript files in my project"

# Review with streaming for large projects
claude --mcp-config mcp-config.json -p "Use pinescript_review with source_type=directory, directory_path=./indicators, and format=stream to review my indicators directory"

# Review only errors in project
claude --mcp-config mcp-config.json -p "Use pinescript_review with source_type=directory, directory_path=./strategies, and severity_filter=error to find critical issues"

# Interactive directory review
claude --mcp-config mcp-config.json
# Then ask: "Review my entire PineScript project in ./trading-bots directory, focus on errors and provide improvement suggestions"
```

## Output Formats

### Documentation Results (pinescript_reference)
```json
{
  "query": "ta.sma",
  "results": [
    {
      "title": "ta.sma Function",
      "content": "Simple moving average calculation...",
      "type": "reference",
      "examples": ["ta.sma(close, 14)", "plot(ta.sma(close, 20))"]
    }
  ]
}
```

### Code Review Results (pinescript_review)

**JSON Format for Single File/Code** (default):
```json
{
  "summary": {
    "total_issues": 2,
    "errors": 1,
    "warnings": 0,
    "suggestions": 1
  },
  "violations": [
    {
      "line": 1,
      "rule": "version_declaration",
      "severity": "error",
      "message": "Missing PineScript version declaration"
    }
  ],
  "file_path": "indicator.pine"
}
```

**JSON Format for Directory Review** (NEW):
```json
{
  "directory_path": "./src",
  "summary": {
    "total_files": 5,
    "total_issues": 8,
    "errors": 2,
    "warnings": 3,
    "suggestions": 3,
    "files_with_issues": 3
  },
  "files": [
    {
      "file_path": "indicators/rsi.pine",
      "summary": { "total_issues": 1, "errors": 0, "warnings": 1, "suggestions": 0 },
      "violations": ["...violations array..."]
    }
  ]
}
```

**Markdown Format** (human-readable):
```markdown
# PineScript Code Review Results

## Summary
- 🔴 1 Error
- 💡 1 Suggestion

## Issues
🔴 **Line 1:** Missing PineScript version declaration
- Suggested fix: Add //@version=6 at the top
```

## Troubleshooting

### "Documentation not yet available"
**Problem**: Tools return "Run 'npm run update-docs'" message
**Solution**: This indicates the processed documentation files are missing. The repository should include pre-processed documentation. If you're seeing this error, please file an issue on GitHub as the documentation files may not have been properly committed.

### "No documentation found"
**Problem**: Search returns no results
**Solutions**:
- Try broader terms ("array" instead of "array.push")
- Check spelling
- Use function names without parameters ("ta.sma" not "ta.sma(close, 14)")

### Server won't start
**Problem**: `npm start` fails
**Solutions**:
- Check Node.js version (need 18+)
- Verify all dependencies installed: `npm install`
- Check for port conflicts

### MCP Server Failed to Connect
**Problem**: `claude mcp list` shows "✗ Failed to connect" after installing from GitHub
**Solutions**:

1. **Check Installation**:
   ```bash
   # Verify the package was installed correctly
   ls node_modules/mcp-server-pinescript/
   # Should show: index.js, docs/, package.json, etc.
   ```

2. **Verify Documentation Files**:
   ```bash
   # Check if processed docs exist
   ls node_modules/mcp-server-pinescript/docs/processed/
   # Should show: index.json, language-reference.json, style-rules.json
   ```

3. **Test Server Manually**:
   ```bash
   # Try running the server directly to see error messages
   node ./node_modules/mcp-server-pinescript/index.js
   # Look for specific error messages about missing files
   ```

4. **Reinstall if Needed**:
   ```bash
   # Remove and reinstall the package
   npm uninstall mcp-server-pinescript
   npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git
   ```

5. **Check MCP Server Name**:
   ```bash
   # Make sure you're using the correct server name you added
   claude mcp list
   # Look for your server name (e.g., "pinescript-docs")
   ```

### Incorrect claude mcp add Syntax
**Problem**: Server not being added correctly
**Correct Syntax**:
```bash
# ✅ Correct
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# ❌ Wrong (using "node" as server name)
claude mcp add node ./node_modules/mcp-server-pinescript/index.js
```

**Note**: The server name (first argument) can be anything you choose: `pinescript-docs`, `pine-help`, `ps-reference`, etc.

## Best Practices

### Effective Prompts

**Good**:
- *"Use pinescript_reference to look up ta.sma function details"*
- *"Review this PineScript indicator code using pinescript_review"*
- *"Find array manipulation functions with pinescript_reference"*

**Less Effective**:
- *"Help me with PineScript"* (too vague)
- *"Fix my code"* (specify to use pinescript_review)
- *"What functions exist?"* (be more specific)

### Workflow Integration

1. **Always review code** before considering it complete
2. **Look up functions** you're unfamiliar with  
3. **Check style guide** when learning new patterns
4. **Use specific searches** rather than general questions

### Performance Tips (V1.2 Preloading Optimized)

- **Preloaded documentation**: All documentation loaded in memory for faster access
- **Memory-based data access**: Reduced response times through in-memory storage
- **Streaming support**: Large file processing with chunked delivery
- **Large file handling**: Streaming optimization for files of varying sizes
- **Concurrent processing**: Multiple requests handled without file system contention
- **Semantic search**: Auto-expansion finds more relevant results
- **Consistent performance**: Stable response times with memory-based architecture

## Version Management

### Current Version: PineScript v6
The server is configured for PineScript v6 by default. All documentation and code review rules are based on v6 standards.

### Future Versions
When PineScript v7 is released:
1. Maintainers will update the documentation
2. You'll need to run `npm run update-docs` again
3. The server will support both v6 and v7 side-by-side

## Getting Help

### Common Issues
1. Check this troubleshooting section first
2. Verify your setup follows the Quick Setup steps
3. Ensure the server is running (`npm start`)

### Documentation
- **This guide**: End-user focused setup and usage
- **README.md**: Complete technical documentation  
- **MAINTAINER.md**: For contributors and advanced users
- **[AI-INTEGRATION.md](.project/AI-INTEGRATION.md)**: For AI system developers

### Support
- GitHub Issues: https://github.com/iamrichardD/mcp-server-pinescript/issues
- Discussions: Use GitHub Discussions for questions

## Advanced Usage

### Streaming Integration with Claude Code CLI
The server now leverages Claude Code CLI's JSON streaming capabilities:

```
"Research RSI strategies comprehensively, create a large strategy file, stream the review, and save to git"
```

This enhanced workflow uses:
- **pinescript** server: Streaming documentation search and code review
- **filesystem** server: Handle large file operations
- **git** server: Version control with streaming feedback

### Streaming Benefits:
- **No token limits**: Handle files of any size
- **Real-time feedback**: See violations as they're detected
- **Progressive research**: Stream large documentation searches
- **Filtered results**: Focus on specific severity levels

### Multiple MCP Servers
This server works great with other MCP servers for comprehensive workflows.

### Custom Configurations

You can modify the server behavior by editing `index.js`, but this is advanced usage covered in the maintainer documentation.

### API Integration

If you're building custom tools, see `.project/AI-INTEGRATION.md` for detailed API specifications and integration examples.

---

**Ready to enhance your PineScript development with AI assistance!**

With V1.2's preloading optimization improving data access through memory-based documentation, combined with fast documentation lookup and automated code review, you'll experience improved PineScript development workflow and code quality.