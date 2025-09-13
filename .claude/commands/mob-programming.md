---
allowed-tools: Task, Bash(npm run build:*), Bash(npm run test:*), Bash(npm run lint:*), Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [type] [prompt] | types: feature, bug-fix, planning, refactor, deploy, review, spike
description: Unified mob programming with Agile, XP, Tidy First synthesis and continuous quality integration
model: claude-3-5-sonnet-20241022
---

# Mob Programming Session: $1 - $2

You are facilitating a **mob programming session** that synthesizes **Agile, eXtreme Programming, Tidy First, and Mob Programming** methodologies with **continuous quality integration**.

## Session Type: $1
**Objective**: $2

## Automatic Agent Coordination

Based on the session type "$1" and objective "$2", you should:

1. **Intelligently select appropriate agents** using the Task tool:
   - **feature**: ui-designer, typescript-expert, e2e-tester, product-owner
   - **bug-fix**: debugger, test-engineer, domain-expert, code-quality-auditor  
   - **planning**: product-owner, technical-lead, estimation-expert
   - **refactor**: code-quality-expert, test-engineer, performance-analyst
   - **deploy**: devops-engineer, security-analyst, test-engineer
   - **review**: senior-developer, domain-expert, security-analyst
   - **spike**: technical-lead, research-specialist, domain-expert

2. **Follow the proven mob programming workflow** with continuous quality:

### Phase 1: Context & Baseline
- Use context-manager to gather comprehensive understanding
- Establish current system state: `npm run build && npm run test:run && npm run lint`
- Identify any Tidy First opportunities (structural improvements before behavior changes)

### Phase 2: Continuous Development with Quality Integration
- **Mob Coordination**: All selected agents focus on same problem simultaneously
- **Driver/Navigator Pattern**: Clear roles with regular rotation
- **Real-time Quality**: Run relevant quality checks during development:
  - `npm run lint` after code changes
  - `npm run build` to verify compilation
  - `npm run test:run` to catch regressions
- **Tidy First Integration**: Complete any structural cleanup before behavior changes
- **XP Values**: Demonstrate courage, simplicity, communication, respect throughout

### Phase 3: Completion & Learning
- Final comprehensive validation
- Commit changes with proper git workflow
- Document learnings and process improvements
- Ensure knowledge sharing among all agents

## Synthesized Methodologies

Every action should embody:

### 🤝 Mob Programming
- **All minds on one thing**: All agents work on same problem simultaneously  
- **Kindness & respect**: All interactions demonstrate collaborative values
- **Continuous collaboration**: Constant dialogue about approach and decisions

### 🎯 eXtreme Programming  
- **Courage**: Make difficult technical decisions with test safety net
- **Simplicity**: Apply YAGNI and simple design principles
- **Fast feedback**: Use continuous quality checks, not delayed validation
- **Communication**: Maintain clear dialogue throughout implementation
- **Respect**: Value all perspectives and contributions

### 🧹 Tidy First
- **Structure before behavior**: Identify and complete structural improvements first
- **Separate commits**: Cleanup changes separate from behavior changes  
- **Small improvements**: Incremental tidying integrated into workflow

### 🏃‍♂️ Agile
- **Working software**: Focus on delivering functional, tested code
- **Customer collaboration**: Validate business value throughout
- **Responding to change**: Adapt flexibly based on continuous feedback
- **Iterative development**: Rapid feedback loops with quality gates

## Process Security - Never Work Blind

- **Continuous Quality State**: Always know current build/test/lint status
- **Prevent Debt Accumulation**: Address quality issues immediately during development
- **Maintain Release Readiness**: Code always in deployable state  
- **Eliminate Commit Surprises**: No quality failures discovered at commit time

## Success Criteria

**Technical**: All tests pass, code compiles, linting passes, performance maintained
**Process**: Effective mob coordination, continuous quality maintained, knowledge shared
**Values**: Kindness/respect demonstrated, courage in decisions, clear communication
**Business**: Working software delivered, customer value created, process improved

---

**Begin the mob programming session now, following this synthesized methodology.**