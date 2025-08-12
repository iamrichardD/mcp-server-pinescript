# Claude Code AI - mcp-server-pinescript Project Guide

## Project Overview
**mcp-server-pinescript** is a production-ready Model Control Protocol (MCP) server that provides comprehensive Pine Script v6 language reference and code review capabilities. The project enables AI systems to access and validate Pine Script code with high-performance streaming support.

## Project Documentation Location
📁 **All project-specific documentation is located in the `.project` directory.**

### Key Documents in `.project/`:
- **SESSION-HANDOFF.md** - Complete project context and current state (START HERE)
- **PROJECT-STATUS.md** - Project health dashboard and capabilities overview
- **NEXT-SESSION-GUIDE.md** - Immediate next steps and implementation priorities
- **FUTURE-TASK-PRIORITIES.md** - Detailed task prioritization matrix with effort estimates
- **AGENT-DEVELOPMENT-STATUS.md** - Team collaboration framework and agent implementation status
- **TECHNICAL-DEBT.md** - Known issues and improvement opportunities

## Quick Start for Claude Code AI

### 1. Read Project Context (5 minutes)
```
Read: .project/SESSION-HANDOFF.md
```
This provides complete project context including current state, completed work, and next steps.

### 2. Understand Current Priority
**HIGHEST PRIORITY**: Complete implementation of Ash (pinescript-parser-expert) agent for advanced Pine Script parameter validation, specifically to detect SHORT_TITLE_TOO_LONG errors.

### 3. Key Integration Points
- **Main Server**: `index.js` (lines 577-579 for validation integration)
- **Agent Definition**: `.claude/agents/pinescript-parser-expert.md` (ready for implementation)
- **Validation Rules**: `docs/validation-rules.json` (overlay system with constraints)
- **Language Reference**: `docs/processed/language-reference.json` (complete Pine Script v6 data)

### 4. Project Architecture
- **Type**: Node.js MCP server with memory preloading optimization
- **Performance**: 4,277x faster data access, sub-15ms response times
- **Coverage**: 457 Pine Script functions + 427 variables/constants/keywords
- **Status**: Production-ready, requires advanced parsing capabilities

## Current State Summary
- ✅ **Complete Pine Script v6 coverage** with optimized performance
- ✅ **Comprehensive validation overlay system** designed and documented
- ✅ **pinescript-parser-expert agent** specification complete
- 🔄 **Agent implementation in progress** - core parsing and AST generation needed
- 🔄 **SHORT_TITLE_TOO_LONG validation** - depends on parser implementation

## Immediate Action Plan
1. **Read complete context**: `.project/SESSION-HANDOFF.md`
2. **Use context-manager**: Gather Ash implementation requirements
3. **Implement Ash capabilities**: AST generation and parameter extraction
4. **Test validation**: Verify SHORT_TITLE_TOO_LONG error detection

## Working Directory Structure
```
mcp-server-pinescript/
├── .project/                    # 📁 All project documentation HERE
├── .claude/agents/             # AI agent definitions
├── docs/                       # Documentation and validation rules
├── index.js                    # Main MCP server (1,063 lines)
├── package.json               # Project configuration
└── README.md                  # User-facing documentation
```

## Team Collaboration Framework
The project uses specialized AI agents for different tasks:
- **project-manager**: Strategic planning and task coordination
- **context-manager**: Documentation gathering and context optimization  
- **pinescript-parser-expert (Ash)**: Pine Script parsing and AST generation
- **code-quality-auditor**: Code review and quality assurance

## Success Metrics
- **Performance**: Maintain <100ms response times with enhanced validation
- **Accuracy**: 95%+ Pine Script parsing accuracy for parameter extraction
- **Coverage**: Complete SHORT_TITLE_TOO_LONG and other parameter validation
- **Integration**: Seamless with existing high-performance architecture

---

**For complete project context and detailed next steps, always start by reading `.project/SESSION-HANDOFF.md`**