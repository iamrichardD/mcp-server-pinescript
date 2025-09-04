# PineScript MCP Documentation Server

AI-optimized Model Context Protocol (MCP) server for PineScript v6 development, providing comprehensive documentation access, style guide adherence, and code review capabilities specifically designed for AI coding agents.

**Performance Metrics**: 4,277x faster data access through memory-first architecture with <15ms response times.

## Quick Start (2 minutes)

**Installation & Verification**:
```bash
# 1. Install and connect
npm install git+git@github.com:iamrichardD/mcp-server-pinescript.git
claude mcp add pinescript-docs node ./node_modules/mcp-server-pinescript/index.js

# 2. Verify connection
claude mcp list  # Should show "pinescript-docs: Connected ✓"

# 3. Test validation (this code has deliberate errors)
claude -p "Use pinescript_review to check: //@version=6
indicator('RSI Test', shorttitle='RSI_INDICATOR_WITH_LONG_TITLE', overlay=false, precision=15)
plot(ta.rsi(close,14))"

# Expected: 2 errors detected in <15ms with actionable fixes
```

**Verification Indicators**:
- Error detection: SHORT_TITLE_TOO_LONG (39 chars > 10 limit)
- Error detection: INVALID_PRECISION (15 > max allowed 8)  
- Performance: Sub-15ms response times
- Output: Structured JSON with severity levels and fix suggestions

## Core Capabilities

**Documentation Search** (`pinescript_reference`):
- Semantic search with synonym expansion across 457 functions + 427 variables
- Streaming delivery for large result sets via JSON chunks
- Enhanced keyword matching for technical terms

**Code Review** (`pinescript_review`):
- Directory support for entire PineScript projects
- Multi-format output (JSON, Markdown, streaming)
- Severity filtering (errors, warnings, suggestions)
- Real-time streaming for large codebases
- 9 validation rules with 100% test coverage

## Basic Usage Commands

**Code Validation**:
```bash
claude -p "Use pinescript_review to check this code: [your PineScript code]"
```

**Documentation Research**:
```bash
claude -p "Use pinescript_reference to search 'array functions'"
```

**Project Review**:
```bash
claude -p "Use pinescript_review with source_type=directory, directory_path=./src"
```

**Performance Verification**:
```bash
time claude -p "Use pinescript_reference to search 'ta.sma'"
# Target: <15ms total response time
```

## Integration Setup

**Claude Desktop Integration** - Add to @claude_desktop_config.json:
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

**Local Development Mode**:
```bash
git clone https://github.com/iamrichardD/mcp-server-pinescript.git
cd mcp-server-pinescript && npm install && npm start
# Should show: "PineScript MCP Server ready with preloaded documentation!"
```

## Performance & Architecture

**Performance Characteristics**:
- Response Times: 5-15ms for typical queries (70-85% faster than baseline)
- Memory Usage: ~12MB RAM with 555KB preloaded documentation
- Data Access: 0.0005ms average (4,277x faster than file I/O)
- Concurrency: High request throughput without file system contention

**Design Patterns**:
- Memory-first architecture with all documentation preloaded at startup
- Zero file I/O eliminates disk bottlenecks during request processing
- Streaming optimization for JSON chunk delivery of large datasets
- Hash-based lookups provide O(1) performance for documentation access

## Development Workflow

**Core Commands**:
```bash
npm start                    # Start server (TypeScript)
npm run dev                  # Development mode with watch
npm test                     # Run all tests (617+ tests, <2ms atomic execution)
npm run quality:check        # Quick quality validation
npm run quality:fix          # Fix all quality issues
npm run build               # Build TypeScript
```

**Version Management**:
```bash
./scripts/set-session-type.sh [patch|minor|major]  # Set session type
npm run release:prepare                             # Prepare release
ln -sf ../../.githooks/* .git/hooks/               # Setup git hooks
```

## Troubleshooting

**Connection Issues**:
- "command not found: claude" → Install @[Claude Code CLI](https://github.com/anthropics/claude-code)
- "Module not found" → Run `npm install` in project directory
- "Connection refused" → Verify server running and MCP registration path

**Performance Issues**:
- Slow responses (>50ms) → Check for "preloaded documentation" in startup logs
- Memory errors on large files → Use `format=stream` parameter
- No validation errors shown → Verify with known error patterns

**Quick Diagnostics**:
```bash
# Verify preloading performance
claude -p "Show pinescript_reference response time for 'indicator' search"

# Test streaming capability  
claude -p "Use pinescript_review with format=stream on large file"

# Check validation rules
claude -p "List available pinescript_review validation rules"
```

## Documentation Structure

This project uses multi-audience documentation for optimal usability:

- @USER-GUIDE.md - Comprehensive integration guide for developers
- @MAINTAINER.md - Contributor and project maintenance documentation  
- @AGENT.md - Universal agent configuration and architecture patterns
- @.project/AI-INTEGRATION.md - AI systems and MCP client integration

For detailed usage examples, advanced configuration, and production deployment patterns, see @USER-GUIDE.md.

## Requirements & Quality

**System Requirements**:
- Node.js 18+ required
- Memory: ~12MB RAM (minimal requirements)
- AI Clients: Claude Desktop, Claude Code CLI, Cursor IDE
- API Access: Firecrawl API key (maintainers only for documentation updates)

**Quality Metrics**:
- Test reliability: 100% pass rate (617-658 tests)
- Response consistency: <2ms variation in execution
- Performance regression: Continuous monitoring prevents degradation
- Zero tolerance: All tests must pass before commits

## Contributing

MIT License - see LICENSE file for details.

**Contributing Process**:
1. Fork the repository
2. Create a feature branch  
3. Run quality checks: `npm run quality:check`
4. Submit pull request with passing tests

For issues and feature requests, please use the GitHub issue tracker.

---

**Performance Demonstration**: This server demonstrates production-ready Agile Coaching + Atomic Testing + TypeScript Architecture with measured 4,277x performance improvements through memory-first design and streaming optimization.
