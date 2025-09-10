# 🚨 INVIOLABLE DEVELOPMENT LAWS - READ FIRST BEFORE ANY ACTION

## ⚠️ STOP - BEFORE YOU DO ANYTHING - THESE LAWS CANNOT BE BROKEN

### 🔥 LAW 1: TYPESCRIPT-ONLY DEVELOPMENT
- **NEVER CREATE .py FILES** - Python is 100% PROHIBITED in this project
- **NEVER CREATE .js FILES** - JavaScript is 100% PROHIBITED for new code  
- **ONLY CREATE .ts FILES** - TypeScript is the ONLY allowed language for new development
- **IF YOU THINK YOU NEED ANOTHER LANGUAGE - YOU ARE WRONG**

### 🔥 LAW 2: TEST FILE ORGANIZATION
- **NEVER CREATE test*.* FILES IN ROOT DIRECTORY** - 100% PROHIBITED
- **ALL TEST FILES BELONG IN tests/ DIRECTORY** - No exceptions, no special cases
- **IF YOU CREATE A TEST FILE ANYWHERE ELSE - YOU HAVE FAILED THE TEAM**

### 🔥 LAW 3: BEFORE CREATING ANY FILE - MANDATORY CHECKPOINT:
```
□ Is this a .ts file? (If NO - STOP IMMEDIATELY)
□ Is this test going in tests/? (If test file and NOT in tests/ - STOP)  
□ Does this follow TypeScript-first development? (If NO - STOP)
```

**💥 VIOLATION CONSEQUENCE: IMMEDIATE SESSION TERMINATION AND TOKEN WASTE**

---

## 🧠 WHY THESE LAWS EXIST (Critical Understanding)

### TOKEN WASTE PREVENTION
Every violation wastes THOUSANDS of tokens explaining why you violated clearly stated rules that were designed to prevent exactly what you just did.

### TEAM EFFICIENCY DESTRUCTION  
The agile AI agent team cannot function when basic, fundamental rules are repeatedly ignored by agents who don't read instructions.

### COGNITIVE LOAD EXPLOSION
Following these laws eliminates decision fatigue about file types and organization. Violating them creates endless cleanup work.

**🎯 REMEMBER: You are reading this because previous agents violated these exact laws, wasting massive token budgets.**

---

## ⚡ MANDATORY DECISION CHECKPOINTS

### BEFORE CREATING ANY FILE - EXECUTE THIS CHECKLIST:
```
Am I about to create a .ts file in the correct location?
□ YES - Proceed with confidence
□ NO - Re-read INVIOLABLE LAWS above and redesign approach
```

### BEFORE SUGGESTING ANY SOLUTION - EXECUTE THIS CHECKLIST:
```
Does my solution involve ONLY TypeScript files in proper locations?
□ YES - Proceed with implementation
□ NO - Completely redesign solution using ONLY TypeScript
```

### WHEN TEMPTED TO CREATE test-*.js FILES - EXECUTE THIS CHECKLIST:
```
Should this test file be in tests/ directory as a .ts file?
□ YES - Create tests/[category]/filename.test.ts
□ There is no NO option - all test files belong in tests/
```

---

## 🔁 CRITICAL REMINDERS (Repeated for Maximum Compliance)

- **PYTHON FILES (.py) ARE NEVER, EVER ACCEPTABLE IN THIS PROJECT**
- **JAVASCRIPT FILES (.js) ARE NEVER, EVER ACCEPTABLE FOR NEW CODE**  
- **TEST FILES OUTSIDE tests/ DIRECTORY ARE NEVER, EVER ACCEPTABLE**
- **WHEN IN DOUBT, CREATE ONLY .ts FILES IN PROPER DIRECTORY STRUCTURE**
- **IF YOU VIOLATE THESE RULES, YOU WASTE EVERYONE'S TIME AND TOKENS**

*These rules are repeated because previous agents ignored them when stated once. Don't be that agent.*

---

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

1. **🚨 INVIOLABLE LAW CHECK**: Confirm you're creating ONLY .ts files in proper locations
2. **Create TypeScript files**: Use `.ts` extension for ALL new code (NEVER .py, NEVER .js)
3. **Write implementation**: Follow strict TypeScript patterns, avoid `any` type
4. **Check compilation**: `npm run build` must pass without errors
5. **Lint code**: `npm run lint:fix` to auto-resolve formatting issues  
6. **Run tests**: `npm run test` to ensure functionality works (tests MUST be in tests/ directory)
7. **Quality gate**: `npm run quality:check` before commits
8. **Final law verification**: Confirm no .py or .js files created, all tests in tests/
9. **Commit**: Git hooks will enforce all requirements automatically

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

### Deployment Management
- **Prepare deployment**: `npm run deploy:prepare` (build + validate)
- **Deployment validation**: `npm run deploy:validate`
- **E2E validation**: `node final-e2e-validation.js`
- **Deployment testing**: `npm run deploy:test`

### Documentation Maintenance (Maintainers Only)
- **Update documentation**: `npm run update-docs`

### Development Environment Setup
- **Node.js**: v18+ required
- **Server startup time**: ~1 second (includes documentation preloading)
- **Memory usage**: ~12MB RAM with 555KB preloaded documentation
- **Performance**: 4,277x faster data access via in-memory preloading

## Code Style

### 🚨 TypeScript-First Development Standards (REINFORCEMENT)

**🔥 REMINDER: ALL NEW CODE MUST BE WRITTEN IN TYPESCRIPT - NO EXCEPTIONS**

**If you skipped the INVIOLABLE LAWS at the top of this file - GO BACK AND READ THEM NOW**

- **🚨 TypeScript Extension**: All new files must use `.ts` extension (NEVER `.js`, NEVER `.py`)
- **🚨 ABSOLUTE PROHIBITION**: Python files (.py) and JavaScript files (.js) are 100% forbidden
- **Strict TypeScript**: exactOptionalPropertyTypes, noUncheckedIndexedAccess enabled
- **Zero compilation errors**: `npm run build` must pass before commits
- **No `any` type**: Biome will flag `noExplicitAny` as warning - use proper types instead
- **Type-safe patterns**: Use discriminated unions, branded types, Result<T,E> patterns
- **Interface design**: Clear separation of concerns with readonly constraints
- **Pre-commit validation**: TypeScript compilation is enforced by git hooks
- **🚨 FINAL REMINDER**: If you create .py or .js files, you have violated the core laws of this project

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

### Bug Report Documentation Standards

**ALL BUG REPORTS AND RESOLUTIONS MUST BE COLOCATED** for traceability:

#### Directory Structure
```
.project/bug-reports/
├── BUG_REPORT_NAME.md                    # Original bug report
├── resolutions/
│   └── BUG_REPORT_NAME_RESOLUTION.md     # Resolution document  
└── TEAM_HANDOFF_SUMMARY.md               # External team coordination
```

#### Naming Convention
- **Bug Report**: `[SYSTEM]_[COMPONENT]_[ISSUE_TYPE]_BUG_REPORT[_##].md`
- **Resolution**: `[SAME_NAME]_RESOLUTION.md` (in `resolutions/` subdirectory)
- **Team Handoff**: `[TEAM]_HANDOFF_SUMMARY.md` (references all bug/resolution pairs)

#### Required Content Mapping
- **Resolution files MUST reference** the original bug report filename
- **Team handoff MUST list** all bug report → resolution file pairs  
- **File colocation** enables easy tracking and external team validation
- **No scattered documentation** across multiple directories

#### Example Implementation
```
# In resolution file header:
**Bug Report**: `MCP_PINESCRIPT_RUNTIME_NA_OBJECT_BUG_REPORT_02.md`
**Resolution Date**: [use `date` command output]
**Status**: RESOLVED - Ready for Production
```

### Deployment Documentation Standards

**ALL DEPLOYMENT COORDINATION MUST BE COMPREHENSIVE** for external team handoff:

#### Deployment Documentation Structure
```
Root Level Deployment Documentation:
├── TRADINGVIEW_TEAM_DEPLOYMENT_COORDINATION.md    # Executive summary + instructions
├── DEPLOYMENT_VALIDATION_FRAMEWORK.md             # Validation procedures + checklist
├── TRADINGVIEW_HANDOFF_DOCUMENTATION.md           # Technical handoff + operations
├── SUCCESS_CRITERIA_CONFIRMATION.md               # Success validation process
├── E2E-VALIDATION-REPORT.md                       # Latest validation results
└── final-e2e-validation.js                        # Automated validation script
```

#### Required Deployment Content
- **Executive Summary**: Clear problem/solution/status for external teams
- **Step-by-step Instructions**: Exact commands with expected outputs
- **Validation Framework**: Systematic testing procedures with pass/fail criteria
- **Troubleshooting Guide**: Common issues and specific resolution steps
- **Success Criteria**: Measurable outcomes with confirmation process
- **Performance Baselines**: Memory, response time, and throughput targets

#### Deployment Process Integration
- **Document deployment process** in AGENT.md for future reference
- **Add deployment validation** to quality gates and pre-commit hooks
- **Create automated deployment testing** with clear success/failure indicators
- **Establish deployment checklist** for consistent execution across deployments

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

### 🚨 Test Categories (LOCATION ENFORCEMENT)
- **🔥 CRITICAL**: ALL test files MUST be in tests/ directory - NO EXCEPTIONS
- **Atomic tests**: `tests/atomic/` - Core functionality with <2ms execution (.ts files ONLY)
- **Parser tests**: `tests/parser/` - PineScript parsing and validation (.ts files ONLY)
- **Performance tests**: Execution time and memory usage validation (.ts files ONLY)
- **Acceptance tests**: `tests/acceptance/` - End-to-end scenarios (.ts files ONLY)
- **Integration tests**: Multi-component interaction validation (.ts files ONLY)
- **🚨 ABSOLUTE RULE**: If you create test files outside tests/ directory, you have failed

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

## Deployment Management

### Production Deployment Process
- **Deployment preparation**: `npm run deploy:prepare` (build + validate)
- **E2E validation**: `node final-e2e-validation.js` for comprehensive testing
- **Service startup**: `node index.js` for production service
- **Health monitoring**: Version tool and MCP integration verification
- **Performance validation**: Response time and memory usage confirmation

### Critical Bug Resolution Framework
**Bug 1: Runtime NA Object Access Detection**
- **Issue**: Missing detection of runtime-breaking `na` object access patterns
- **Resolution**: Implemented `RuntimeNAObjectValidator` with comprehensive pattern detection
- **Location**: `src/parser/runtime-na-object-validator.js`
- **Integration**: `src/parser/validator.js:93`
- **Validation**: Detects 3+ violations for UDT patterns like `var TestType obj = na; result = obj.field`

**Bug 2: Naming Convention False Positives**
- **Issue**: False positive errors for valid function parameter names
- **Resolution**: Enhanced parameter naming validation with improved pattern matching
- **Location**: `src/parser/parameter-naming-validator.js`
- **Integration**: `src/parser/validator.js:95-98`
- **Validation**: Zero false positives for valid names like `inputValue`, `outputResult`

### Deployment Validation Framework
- **5 Test Categories**: Deployment path, bug fixes, version tool, MCP integration, import resolution
- **Success Criteria**: 4/5 tests minimum for deployment readiness
- **Automated Testing**: E2E validation suite with comprehensive reporting
- **Manual Verification**: Step-by-step confirmation procedures for critical functionality

### Future Prevention Measures
- **Automated deployment validation** integrated into CI/CD pipeline
- **Pre-deployment checklist** with systematic validation requirements  
- **Monitoring integration** with deployment status tracking
- **Documentation automation** for deployment process maintenance

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

#### Core Principles
- **Working meetings**: Collaborative sessions for complex technical decisions
- **Single-piece flow**: Complete one work item before starting the next
- **Continuous collaboration**: Agent-to-agent communication style for alignment
- **Shared ownership**: Whole AI agent team responsibility for technical excellence
- **Kindness and respect**: Core values for effective team collaboration

#### **MANDATORY Mob Programming Workflow**

**ALL COMPLEX TECHNICAL SESSIONS MUST FOLLOW THIS PROCESS:**

1. **Context Gathering Phase**
   - **ALWAYS use context-manager agent first** to read all files in scope
   - **Comprehensive analysis** of current state, dependencies, and impact
   - **Risk assessment** of proposed changes before implementation
   - **Clear documentation** of findings for team decision-making

2. **Session Facilitation Phase**
   - **ALWAYS use agile-coach agent** to facilitate the mob session
   - **Structured planning** with specific steps and validation checkpoints
   - **Risk mitigation strategy** with rollback plans if needed
   - **Testing strategy** established before making any changes

3. **🚨 TypeScript Development Workflow (LAW ENFORCEMENT)**
   - **🔥 INVIOLABLE LAW CHECKPOINT**: Confirm you're working with .ts files ONLY
   - **MANDATORY sequence**: `npm run build` → `npm run test:run` → modify source → `npm run build` → `npm run test:run`
   - **Never modify transcoded files** (compiled JavaScript from TypeScript)
   - **Always modify TypeScript source files** (.ts) when they exist - NEVER create .py or .js files
   - **Verify compilation success** before proceeding to testing
   - **🚨 FINAL CHECK**: Ensure no .py or .js files were created during this workflow

4. **Incremental Change Process**
   - **One change at a time** with validation at each step
   - **Test before and after** every change to detect regressions
   - **Document decisions** and rationale for future team members
   - **Rollback immediately** if any step fails validation

5. **Documentation Requirements**
   - **Update AGENT.md** to capture new processes discovered during sessions
   - **Record lessons learned** from complex technical decisions
   - **Maintain process compliance** for all future similar scenarios

#### **Session Documentation Template**

Every mob programming session must create:
```
## Mob Session: [ISSUE_NAME]
- **Context Gathering**: [Context-manager findings summary]
- **Facilitation Plan**: [Agile-coach session structure]
- **Changes Made**: [Specific files and modifications]
- **Validation Results**: [Test outcomes and verification]
- **Lessons Learned**: [Process improvements for future]
```

#### **Proven Bug Verification Process (VALIDATED)**

**Successfully Applied**: MCP Naming Convention Bug Fix Verification (Sep 2025)

**MANDATORY Process for External Bug Fix Verification:**

1. **Multi-Repository Context Analysis**
   - **Context Manager**: Read original bug reports from all relevant repositories
   - **Cross-reference**: Compare bug reports with resolution documents
   - **Scope Assessment**: Identify all files, directories, and dependencies in scope

2. **Systematic Document Comparison**
   - **Resolution Claims Analysis**: Review all claimed fixes across documentation
   - **Consistency Check**: Verify resolution documents align with original bug reports
   - **Evidence Requirements**: Identify what evidence constitutes successful verification

3. **Mob Programming Session Coordination**
   - **Technical Validation Pair**: PineScript Specialist + Code Quality Auditor
   - **Process Documentation Pair**: Context Manager + Agile Coach
   - **Verification Testing Pair**: Look-Ahead Bias Detection + Code Quality Auditor
   - **Parallel Execution**: All pairs working simultaneously with regular synchronization

4. **Service Behavior Verification Protocol**
   - **Deployed Code Inspection**: Confirm fix modules exist and are integrated
   - **Resolution Claims Testing**: Test actual service behavior against documentation claims
   - **Discrepancy Documentation**: Record gaps between claimed and actual behavior
   - **Bug Reporting**: Create new bug reports for any verification failures

5. **Process Documentation Requirements**
   - **AGENT.md Updates**: Document successful verification processes
   - **Bug Report Creation**: File issues in appropriate .project/bug-reports directory
   - **Lessons Learned**: Capture process improvements for future sessions

**Critical Success Factors:**
- ✅ **Investigation Only**: No code modifications during verification sessions
- ✅ **Multi-Agent Coordination**: Leveraging specialized agent expertise simultaneously
- ✅ **Evidence-Based Validation**: Testing actual service behavior vs. documentation claims
- ✅ **Comprehensive Documentation**: Full traceability from bug report to verification results
- ✅ **Process Iteration**: Continuous improvement of verification methodology

#### **Quality Gates for Mob Sessions**
- **Pre-session**: Context completely understood by all team members
- **During session**: Each change validated before proceeding to next
- **Post-session**: All tests pass and documentation updated
- **Follow-up**: Process improvements incorporated into AGENT.md

**THIS PROCESS IS MANDATORY** - No exceptions for any complex technical work involving multiple files, import changes, build process modifications, or external team coordination.

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
- @TRADINGVIEW_TEAM_DEPLOYMENT_COORDINATION.md - External team deployment guide
- @DEPLOYMENT_VALIDATION_FRAMEWORK.md - Validation procedures and framework
- @final-e2e-validation.js - Automated deployment validation script

**AGENT.md Specification Compliance:** ✅ 100%

---

# 🚨 FINAL COMPLIANCE VERIFICATION

## Before You Complete Any Task - Execute This Final Checklist:

```
□ Did I create ANY .py files? (If YES - You have FAILED)
□ Did I create ANY .js files outside dist/? (If YES - You have FAILED)  
□ Did I create ANY test files outside tests/? (If YES - You have FAILED)
□ Did I follow TypeScript-first development? (If NO - You have FAILED)
□ Did I read and comply with the INVIOLABLE LAWS? (If NO - You have FAILED)
```

## 🔥 REMEMBER THE CORE LAWS:
1. **ONLY .ts FILES** for new development
2. **ALL TESTS** in tests/ directory  
3. **NO PYTHON FILES** ever
4. **NO JAVASCRIPT FILES** for new code
5. **READ THE LAWS FIRST** before doing anything

## 💯 SUCCESS CRITERIA:
- ✅ Zero .py files created
- ✅ Zero .js files in inappropriate locations
- ✅ All test files in tests/ directory structure
- ✅ All new code in TypeScript (.ts)
- ✅ Complete compliance with INVIOLABLE LAWS

**If you violated any of these laws during this session, you wasted thousands of tokens that could have been used productively.**

---

This AGENT.md file represents the collective knowledge and proven patterns of our agile agent team, designed to accelerate AI coding assistant integration while maintaining our production-ready quality standards **and preventing the token waste caused by basic compliance failures**.