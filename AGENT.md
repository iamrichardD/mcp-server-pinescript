# PineScript MCP Documentation Server

AI-optimized Model Context Protocol (MCP) server for PineScript v6 development, providing comprehensive documentation access, style guide adherence, and code review capabilities specifically designed for AI coding agents.

This project demonstrates production-ready **Agile Coaching + Atomic Testing + TypeScript Architecture** methodology with proven 4,277x performance improvements and 100% test reliability.

## Project Structure and Organization

This production-ready MCP server follows a modular TypeScript architecture optimized for AI agent collaboration:

```
/
├── @package.json              # Dependencies and npm scripts for development workflow
├── @tsconfig.json            # TypeScript strict configuration with performance optimizations
├── @USER-GUIDE.md            # Integration guide for developers using AI workflow
├── @MAINTAINER.md            # Contributor and project maintenance documentation
├── index.ts                  # Main MCP server entry point with TypeScript
├── index.js                  # Compiled JavaScript version for production
├── src/                      # Core source code modules
│   ├── parser/              # PineScript parsing engine with AST generation
│   │   ├── parser.ts        # Main parser implementation
│   │   ├── lexer.ts         # Tokenization and lexical analysis
│   │   ├── validator.ts     # PineScript v6 compliance validation
│   │   ├── error-handler.ts # Structured error reporting with fix suggestions
│   │   └── ast-types.ts     # Abstract syntax tree type definitions
│   └── integration/         # MCP protocol integration layer
├── tests/                    # Comprehensive test suite (617+ tests)
│   ├── atomic/              # Sub-2ms atomic tests
│   ├── parser/              # Parser-specific validation tests
│   ├── acceptance/          # End-to-end scenario validation
│   └── validation/          # PineScript compliance tests
├── docs/                    # PineScript reference documentation (555KB preloaded)
├── scripts/                 # Automation and maintenance utilities
├── dist/                    # Compiled TypeScript output for distribution
└── .project/                # Process documentation and workflow patterns
```

### Key Architectural Decisions

- **Memory-first design**: 4,277x performance improvement via in-memory documentation preloading
- **Atomic testing**: <2ms test execution for immediate feedback loops  
- **Strict TypeScript**: Zero compilation errors with exactOptionalPropertyTypes
- **Modular parser**: Separate lexer, parser, validator, and AST components
- **MCP protocol compliance**: Standard implementation for multi-client AI integration

## Build & Commands

### Core Development Commands
- **Start server (TypeScript)**: `npm start` or `npm run start:ts`
- **Development mode with watch**: `npm run dev` or `npm run dev:ts`  
- **Start compiled JavaScript**: `npm run start:js`
- **Development mode (JS)**: `npm run dev:js`
- **Build TypeScript**: `npm run build`
- **Type checking**: `npm run type-check`

### Testing Excellence (Atomic Framework)
- **Run all tests**: `npm test`
- **Run tests once**: `npm run test:run`
- **Atomic tests (<2ms execution)**: `npm run test:atomic`
- **Watch atomic tests**: `npm run test:atomic:watch`
- **Performance validation**: `npm run test:performance`
- **Parser-specific tests**: `npm run test:parser`
- **Acceptance tests**: `npm run test:acceptance`

### Quality Assurance Pipeline
- **Quick quality check**: `npm run quality:check` (type-check + lint + atomic tests)
- **Fix all quality issues**: `npm run quality:fix`
- **Full quality validation**: `npm run quality:full`
- **CI validation**: `npm run ci:validate`
- **CI build**: `npm run ci:build`

### Development Workflow for New Code

**MANDATORY STEPS for all new development:**

1. **Create TypeScript files**: Use `.ts` extension for all new code
2. **Write implementation**: Follow strict TypeScript patterns, avoid `any` type
3. **Check compilation**: `npm run build` must pass without errors
4. **Lint code**: `npm run lint:fix` to auto-resolve formatting issues  
5. **Run tests**: `npm run test` to ensure functionality works
6. **Quality gate**: `npm run quality:check` before commits
7. **Commit**: Git hooks will enforce all requirements automatically

### Code Quality & Formatting
- **Format check**: `npm run format` (Biome formatter)
- **Format and fix**: `npm run format:fix`
- **Lint check**: `npm run lint`
- **Lint and fix**: `npm run lint:fix`
- **Comprehensive check**: `npm run check`
- **Comprehensive fix**: `npm run check:fix`

### Version Management (Semantic Versioning)
- **Check current version**: `npm run version:check`
- **Validate version**: `npm run version:validate`
- **Bump patch version**: `npm run version:patch` (1.0.0 → 1.0.1)
- **Bump minor version**: `npm run version:minor` (1.0.0 → 1.1.0)
- **Bump major version**: `npm run version:major` (1.0.0 → 2.0.0)

### Release & Publishing
- **Prepare release**: `npm run release:prepare`
- **Release patch**: `npm run release:patch`
- **Release minor**: `npm run release:minor`
- **Release major**: `npm run release:major`
- **Release dry run**: `npm run release:dry-run`
- **Release status**: `npm run release:status`

### Documentation Maintenance (Maintainers Only)
- **Update documentation**: `npm run update-docs`

### Development Environment Setup
- **Node.js**: v18+ required
- **Server startup time**: ~1 second (includes documentation preloading)
- **Memory usage**: ~12MB RAM with 555KB preloaded documentation
- **Performance**: 4,277x faster data access via in-memory preloading

## Code Style

### TypeScript-First Development Standards

**ALL NEW CODE MUST BE WRITTEN IN TYPESCRIPT** with the following requirements:

- **TypeScript Extension**: All new files must use `.ts` extension (never `.js`)
- **Strict TypeScript**: exactOptionalPropertyTypes, noUncheckedIndexedAccess enabled
- **Zero compilation errors**: `npm run build` must pass before commits
- **No `any` type**: Biome will flag `noExplicitAny` as warning - use proper types instead
- **Type-safe patterns**: Use discriminated unions, branded types, Result<T,E> patterns
- **Interface design**: Clear separation of concerns with readonly constraints
- **Pre-commit validation**: TypeScript compilation is enforced by git hooks

### Biome Linting Requirements

**ALL CODE MUST PASS BIOME LINTING** before commits:

- **Mandatory check**: `npm run lint` must pass with zero warnings/errors
- **Auto-fix available**: `npm run lint:fix` resolves most issues automatically  
- **Key rules enforced**:
  - `noExplicitAny`: Prevents `any` type usage (warning level)
  - `noBannedTypes`: Blocks problematic type patterns (error level)
  - Code formatting, import organization, complexity limits
- **Integration**: Biome runs automatically in git pre-commit hooks
- **Override**: Use `--no-verify` only for emergencies

### Documentation Language Guidelines
- **Avoid marketing terms**: Never use "Enterprise", "Enterprise-grade", "World-class", or similar promotional language
- **Technical precision**: Use specific metrics (4,277x faster) over vague qualifiers ("blazingly fast")
- **Clear terminology**: Professional-grade → production-ready, Industry-standard → specification-compliant
- **Focus on facts**: Performance numbers, test coverage, response times, memory usage

### Date and Time Standards
- **ALWAYS use bash `date` command**: Never hardcode dates in documentation or code
- **Get current date**: Use `date` command before writing any timestamps
- **Consistent format**: Use the exact output from bash `date` command
- **Example workflow**: Run `date` first, then use the actual output in documents
- **No assumptions**: Never assume or calculate dates manually

### PineScript Validation Standards
- **Parameter validation**: SHORT_TITLE_TOO_LONG, INVALID_PRECISION detection
- **Style guide compliance**: CamelCase naming, operator spacing, line length limits
- **AST-based parsing**: Structured syntax tree generation for complex validation
- **Error message quality**: Actionable fix suggestions with precise line/column information

### Code Quality Patterns
- **Single responsibility**: Functions focused on single, well-defined tasks
- **Cognitive complexity**: Target <15 cyclomatic complexity per function
- **Performance consciousness**: Sub-millisecond execution targets for critical functions
- **Type safety**: 100% TypeScript strict mode compliance
- **Function size limits**: Reasonable maintenance bounds for all functions

### Formatting Standards (Biome)
- **Line length**: 120 characters maximum
- **Indentation**: Tabs (configurable via Biome)
- **Trailing commas**: Enforced for maintainability
- **Semicolons**: Biome configuration determines usage
- **Import organization**: Automatic sorting and cleanup
- **Consistent spacing**: Automated via `npm run format:fix`

## Testing

### Atomic Testing Framework (Production-Ready)
- **Sub-2ms execution**: <2ms per test for immediate feedback loops
- **Test count**: 617-658 tests with 100% pass rate requirement
- **Performance validation**: Continuous monitoring of execution speed
- **Load testing**: 600+ atomic tests for scalability validation
- **Category organization**: Tests grouped by functionality (type-guards, error-creation, utilities)

### Testing Philosophy
- **Test-first development**: Write tests before implementation
- **Atomic feedback**: Individual test results in <2ms
- **Performance targets**: Response times monitored in tests
- **Zero tolerance**: All tests must pass before commits
- **Comprehensive coverage**: Core functionality, edge cases, performance scenarios

### Test Categories
- **Atomic tests**: `tests/atomic/` - Core functionality with <2ms execution
- **Parser tests**: `tests/parser/` - PineScript parsing and validation
- **Performance tests**: Execution time and memory usage validation
- **Acceptance tests**: `tests/acceptance/` - End-to-end scenarios
- **Integration tests**: Multi-component interaction validation

### Quality Gates
- **Pre-commit gate**: ≥85% test pass rate mandatory
- **Performance gate**: <15ms response times for basic operations
- **Functional gate**: Core features must be operational
- **Zero regression**: All existing functionality preserved

### Testing Commands
- Watch mode for development: `npm run test:atomic:watch`
- Performance validation: `npm run test:atomic:performance`
- Quick validation: `npm run test:atomic:framework`
- Full test suite: `npm run test:run`

## Architecture

### Performance-Optimized Design
- **Memory preloading**: 4,277x faster data access through in-memory documentation
- **Zero file I/O**: Eliminates disk bottlenecks during request processing
- **Hash-based filenames**: O(1) lookup performance for documentation access
- **Streaming optimization**: JSON chunk delivery for large datasets
- **Concurrent scalability**: No file system contention, high-concurrency request handling
- **Resource efficiency**: 555KB memory overhead for significant performance improvements

### Multi-Agent Coordination Framework
- **Specialized agent roles**: Each agent has distinct expertise domains
- **Systematic handoff protocols**: Structured information transfer with clear deliverables
- **Agent coordination sequence**: context-manager → agile-coach → specialized agents → e2e-tester
- **Quality gate integration**: Mandatory checkpoints at agent handoffs
- **Context management excellence**: >95% context transfer rate between agents

### MCP Protocol Implementation
- **Model Context Protocol**: Standard MCP implementation for AI integration
- **Multi-client support**: Claude Desktop, CLI, Cursor IDE compatibility
- **Streaming protocol**: Progressive data delivery for large responses
- **HTTP transport**: Remote server connections without local setup
- **Tool interface**: Two primary tools (pinescript_reference, pinescript_review)

### Modular Design Patterns
- **Agent specialization**: Clear domain boundaries with minimal cognitive overhead
- **Interface segregation**: Focused APIs for specific functionality
- **Dependency injection**: Clean separation of concerns across modules
- **Observer pattern**: Event-driven coordination between system components
- **Single-piece flow**: One work item at a time for optimal collaboration

## Security

### Input Validation & Sanitization
- **Parameter validation**: All user inputs validated and sanitized before processing
- **Type safety**: TypeScript interfaces prevent runtime type errors
- **Error boundaries**: Graceful degradation with detailed error messages
- **Resource usage controls**: Memory and CPU limits for processing operations

### Path Validation Security
- **Secure file access**: Path validation prevents unauthorized file system access
- **Directory traversal protection**: Restricted to authorized project directories
- **File size limits**: Resource usage controls for large file processing
- **Sandboxed execution**: Isolated processing environment for code analysis

### Data Protection
- **No sensitive data logging**: Error messages exclude sensitive information
- **Secure defaults**: Conservative security settings for file operations
- **Input bounds checking**: All inputs validated for size and format limits
- **Memory management**: Controlled resource allocation prevents exhaustion attacks

## Configuration

### Development Environment Requirements
- **Node.js**: Version 18+ required for ES modules and performance features
- **Memory**: Minimum 12MB RAM for server operation
- **Storage**: ~555KB for preloaded documentation cache
- **Network**: Internet connection required for documentation updates (maintainers only)

### TypeScript Configuration
- **Strict mode**: Complete type safety with strictNullChecks, exactOptionalPropertyTypes
- **ES modules**: Modern import/export syntax throughout
- **Target**: ES2022 for optimal Node.js 18+ compatibility
- **Declaration files**: Complete .d.ts generation for library usage
- **Source maps**: Full debugging support in development

### Biome Configuration (Code Quality)
- **Formatter**: Automatic code formatting with project-specific rules
- **Linter**: Static analysis with custom rule configuration
- **Import sorting**: Automatic organization and cleanup
- **Performance**: Fast execution for large codebases
- **VS Code integration**: Integrated editor experience

### Testing Configuration (Vitest)
- **Watch mode**: Automatic test re-execution on file changes
- **Coverage reporting**: Comprehensive test coverage analysis
- **Performance monitoring**: Test execution time tracking
- **Parallel execution**: Optimal test runner performance
- **TypeScript integration**: Native TS support without compilation step

### Git Hooks Automation
- **Pre-commit validation**: TypeScript compilation, tests, linting, versioning
- **Post-commit automation**: Automatic git tag creation for version changes
- **Session type management**: patch/minor/major version bump strategies
- **Quality enforcement**: Hard stops prevent technical debt accumulation
- **Emergency bypass**: `--no-verify` flag for urgent commits

### MCP Integration Configuration
- **Claude Desktop**: Add server to claude_desktop_config.json
- **Claude Code CLI**: Register via `claude mcp add` command
- **Cursor IDE**: Configure in workspace settings
- **HTTP mode**: Remote server connections supported
- **Streaming mode**: JSON chunk delivery for large responses

## Documentation Management

### Multi-Audience Documentation Strategy
- **@USER-GUIDE.md**: For developers integrating AI workflow
- **@MAINTAINER.md**: For contributors and project maintainers
- **[AI-INTEGRATION.md](.project/AI-INTEGRATION.md)**: For AI systems and MCP clients
- **AGENT.md**: Universal agent configuration (this file)

### Project Documentation Structure
- **Process documentation**: `.project/` directory with workflow patterns
- **Agent configurations**: `.claude/agents/` with specialized agent definitions  
- **Technical specifications**: Detailed implementation and architecture docs
- **Performance documentation**: Benchmarks, optimization strategies, quality gates
- **Version-specific guides**: Documentation organized by Pine Script version

### Documentation Maintenance
- **Automatic updates**: Scripts maintain current Pine Script documentation
- **Version tracking**: Documentation aligned with Pine Script releases
- **Quality assurance**: Documentation changes validated through testing
- **Accessibility**: Multiple formats (Markdown, JSON, streaming) supported

## Git Workflow

### Development Session Management
- **Set session type**: `./scripts/set-session-type.sh [patch|minor|major]`
- **Check session type**: `./scripts/set-session-type.sh show`
- **Quality validation**: ALWAYS run `npm run quality:check` before commits
- **Fix issues**: `npm run quality:fix` for automated corrections
- **Build verification**: `npm run build` must pass before commits

### Commit Process
- **Pre-commit validation**: Automatic TypeScript compilation, testing, linting
- **Semantic versioning**: Automatic version bumps based on session type
- **Tag creation**: Post-commit hooks create version tags automatically
- **Quality gates**: Hard stops prevent low-quality commits
- **Emergency bypass**: `git commit --no-verify` for urgent situations

### Branch Management
- **Main branch protection**: Never force push to main
- **Feature branches**: Use `git push --force-with-lease` when needed
- **Branch verification**: Always verify current branch before force operations
- **Tag management**: Automatic version tags with release notes

### Release Process
- **Preparation**: `npm run release:prepare` for validation and build
- **Version management**: Semantic versioning with automatic changelog generation
- **Tag synchronization**: `git push origin main --tags` for complete releases
- **Release monitoring**: `npm run release:monitor` for post-release validation

## Performance Characteristics

### Response Time Targets
- **pinescript_reference**: 5-15ms for typical queries (70-85% faster than baseline)
- **pinescript_review**: 3-10ms depending on code length (75-90% faster)
- **Streaming chunks**: <1ms per chunk (95%+ faster delivery)
- **Data access**: 0.0005ms average (4,277x faster than file I/O)
- **Server startup**: +1 second for preloading (one-time cost for massive gains)

### Resource Efficiency
- **Memory footprint**: ~12MB RAM total for server operation
- **Preloaded data**: 555KB (index + rules + functions) - <5% overhead for >4000x gain
- **Concurrent requests**: High scalability with minimal file system contention
- **CPU utilization**: Lower per-request CPU usage due to eliminated I/O
- **Network efficiency**: Streaming reduces bandwidth usage for large responses

### Quality Metrics
- **Test reliability**: 100% pass rate required (617-658 tests)
- **Response consistency**: <2ms variation in atomic test execution
- **Error rates**: Zero tolerance for regressions in core functionality
- **Performance regression**: Continuous monitoring prevents degradation
- **Memory stability**: No memory leaks in long-running server instances

## Agent Coordination Patterns

### Agile Coaching Integration
- **Process coordination**: All technical work flows through agile-coach guidance
- **Impediment removal**: Systematic identification and resolution of blockers
- **Sprint planning**: Clear technical milestones with measurable success criteria
- **Continuous improvement**: Regular retrospectives with concrete action items
- **Team alignment**: Single-piece flow methodology for optimal collaboration

### Specialized Agent Workflows
- **Context management**: Precise information scoping eliminates cognitive overhead
- **Discovery-first**: Mandatory infrastructure analysis before implementation
- **Handoff protocols**: >95% context transfer rate between specialized agents
- **Quality validation**: Specialized agents validate domain-specific requirements
- **Systematic coordination**: Proven patterns for multi-agent collaboration

### Mob Programming Practices
- **Working meetings**: Collaborative sessions for complex technical decisions
- **Single-piece flow**: Complete one work item before starting the next
- **Continuous collaboration**: Agent-to-agent communication style for alignment
- **Shared ownership**: Whole AI agent team responsibility for technical excellence
- **Kindness and respect**: Core values for effective team collaboration

---

## Legacy Tool Compatibility

For backward compatibility with existing AI coding tools:
```bash
# Create symbolic links to support legacy tool configurations
ln -s AGENT.md .cursorrules      # Cursor IDE
ln -s AGENT.md .windsurfrules    # Windsurf  
ln -s AGENT.md CLAUDE.md         # Claude Code (legacy)
```

**File References Used:**
- @package.json - Project configuration and npm scripts
- @tsconfig.json - TypeScript compiler configuration  
- @biome.json - Code formatting and linting configuration
- @USER-GUIDE.md - End-user integration documentation
- @MAINTAINER.md - Contributor and maintainer guide
- @.project/AI-INTEGRATION.md - AI systems integration patterns
- @src/parser/index.js - Core parser implementation
- @tests/atomic/ - Atomic testing framework
- @.claude/agents/ - Specialized agent configurations

**AGENT.md Specification Compliance:** ✅ 100%

This AGENT.md file represents the collective knowledge and proven patterns of our agile agent team, designed to accelerate AI coding assistant integration while maintaining our production-ready quality standards.
