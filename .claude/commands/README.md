# Unified Mob Programming Command System

## **Core Command**

```bash
/mob-programming <type> <prompt>
```

### **Types**
- **`feature`** - New functionality development
- **`bug-fix`** - Issue resolution with root cause analysis  
- **`planning`** - Sprint/iteration planning and story breakdown
- **`refactor`** - Code improvement without behavior change
- **`deploy`** - Production deployment coordination
- **`review`** - Code quality and design assessment
- **`spike`** - Time-boxed investigation of technical unknowns

### **Automatic Features**

#### **🤖 Intelligent Agent Selection**
Commands automatically select appropriate agents based on prompt analysis:
- **Feature work**: `ui-designer, typescript-expert, e2e-tester, product-owner`
- **Bug investigation**: `debugger, test-engineer, domain-expert`
- **Planning sessions**: `product-owner, technical-lead, estimation-expert`

#### **🔒 Continuous Quality Integration**
- **Real-time linting** during development (not delayed to commit)
- **Auto-formatting** applied as code changes
- **Type validation** continuous TypeScript checking
- **Smart testing** relevant tests run automatically

#### **🎯 Synthesized Methodologies**
Every command automatically includes:
- **Mob Programming**: All minds on one thing, kindness/respect
- **eXtreme Programming**: Courage, simplicity, feedback, communication
- **Tidy First**: Structure before behavior, separate commits
- **Agile**: Iterative development, working software focus

### **Examples**

```bash
# Feature Development
/mob-programming feature add dark mode toggle to user settings

# Bug Resolution  
/mob-programming bug-fix naming validator incorrectly flags built-in parameters

# Sprint Planning
/mob-programming planning scope next iteration based on user feedback
```

### **Process Security**
- Never work blind - always know current quality state
- Prevent debt accumulation - address issues immediately  
- Maintain release readiness - code always deployable
- Eliminate commit surprises - no quality issues at commit time

### **Universal Application**
Same approach works across all Agile AI Agent team projects with automatic tech stack discovery.