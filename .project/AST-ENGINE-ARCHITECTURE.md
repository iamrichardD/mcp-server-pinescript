# Pine Script AST Generation Engine

## Overview

The Pine Script AST Generation Engine is a TypeScript-migration-ready JavaScript architecture designed for high-performance parsing and validation of Pine Script v6 code. Built for the mob programming team's test-first approach, this engine provides comprehensive parameter extraction and validation capabilities.

## Key Features

- **🚀 High Performance**: <15ms AST generation, <5ms validation
- **🔧 TypeScript Ready**: Clean interfaces designed for smooth TypeScript migration  
- **🧪 Test-First**: Comprehensive test suite with Vitest
- **🔗 MCP Integration**: Seamless integration with existing MCP server architecture
- **📊 Advanced Validation**: AST-based parameter validation including SHORT_TITLE_TOO_LONG detection
- **⚡ Memory Efficient**: Streaming tokenization and optimized AST structures

## Architecture

### Module Structure

```
src/parser/
├── index.js              # Main API entry point
├── ast-types.js          # AST node type definitions
├── lexer.js              # Tokenization engine
├── parser.js             # AST generation engine
├── validator.js          # Parameter validation engine
├── error-handler.js      # Error handling patterns
├── types.d.ts            # TypeScript type definitions
└── README.md             # This documentation
```

### Integration Structure

```
src/integration/
└── mcp-integration.js    # MCP server integration patterns
```

### Test Structure

```
tests/parser/
└── parser.test.js        # Comprehensive test suite
```

## Core Components

### 1. AST Types (`ast-types.js`)

Defines TypeScript-ready AST node structures:

```javascript
// Function call node for parameter extraction
const functionCall = createFunctionCallNode(
  'indicator',
  parameters,
  location,
  namespace
);

// Parameter node with validation metadata
const parameter = createParameterNode(
  value,
  location,
  'shorttitle',
  position
);
```

**Key Features:**
- Type guards for runtime validation
- Factory functions for consistent node creation
- Source location tracking for error reporting
- Performance-optimized structures

### 2. Lexer (`lexer.js`)

High-performance tokenization engine:

```javascript
// Tokenize Pine Script source
const tokens = tokenize(source);

// Streaming lexer for memory efficiency
const lexer = createLexer(source);
const token = nextToken(lexer);
```

**Capabilities:**
- Pine Script v6 keyword recognition
- String literal parsing with escape sequences
- Numeric literal parsing (integer, float, scientific notation)
- Indentation tracking for block structure
- Comment preservation

### 3. Parser (`parser.js`)

AST generation with parameter extraction focus:

```javascript
// Full AST generation
const astResult = parseScript(source);

// Focused parameter extraction
const parameters = extractFunctionParameters(source);
```

**Specializations:**
- Function call parameter extraction
- Named and positional parameter handling
- Multi-line function call support
- Namespaced function recognition (`ta.sma`, `math.abs`)
- Graceful error recovery

### 4. Validator (`validator.js`)

AST-based parameter validation:

```javascript
// Comprehensive validation
const result = validateParameters(source, validationRules);

// Quick SHORT_TITLE_TOO_LONG check
const shortTitleResult = validateShortTitle(source);
```

**Validation Types:**
- String length constraints (SHORT_TITLE_TOO_LONG)
- Numeric range validation
- Type validation (integer, float, boolean)
- Required parameter checking
- Custom constraint validation

### 5. Error Handler (`error-handler.js`)

TypeScript-ready error patterns:

```javascript
// Result pattern for type safety
const result = tryParse(() => parseScript(source));
if (isSuccess(result)) {
  // Handle success
} else {
  // Handle error with detailed information
}
```

**Error Features:**
- Structured error information with location
- Error recovery strategies
- Performance monitoring
- Graceful degradation

## Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| AST Generation | <15ms | Typical Pine Script file |
| Parameter Validation | <5ms | Function parameter analysis |
| Memory Usage | <2MB | Parser state and AST |
| Error Recovery | <1ms | Per recovery attempt |

## Integration with MCP Server

### Quick Integration

Add AST-based validation to existing validation loop:

```javascript
// In index.js around line 577-579
import { quickShortTitleValidation } from './src/integration/mcp-integration.js';

// Replace basic check with enhanced validation
if (line.includes('indicator(') || line.includes('strategy(')) {
  hasDeclaration = true;
  
  // Add AST-based parameter validation
  const astViolations = await quickShortTitleValidation(code);
  violations.push(...astViolations);
}
```

### Full Integration

Use comprehensive analysis:

```javascript
import { enhancedPineScriptValidation } from './src/integration/mcp-integration.js';

const result = await enhancedPineScriptValidation(
  code, 
  validationRules,
  { performanceMode: 'fast' }
);
```

## TypeScript Migration Path

### Phase 1: Type Definitions
- ✅ Complete TypeScript interfaces (`types.d.ts`)
- ✅ JSDoc annotations for immediate type hints
- ✅ Type guards for runtime validation

### Phase 2: Gradual Migration
```typescript
// Rename files to .ts extensions
mv ast-types.js ast-types.ts
mv lexer.js lexer.ts
mv parser.js parser.ts

// Add proper TypeScript configuration
// Update imports to use type-safe interfaces
```

### Phase 3: Strict Type Safety
```typescript
// Enable strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Testing Strategy

### Test Structure

```javascript
// Comprehensive test coverage
describe('Pine Script Parser', () => {
  describe('Basic Function Call Parsing', () => {
    it('should parse simple indicator() function call', () => {
      // Test implementation
    });
  });
  
  describe('SHORT_TITLE_TOO_LONG Validation', () => {
    it('should detect violations correctly', () => {
      // Validation tests
    });
  });
  
  describe('Performance Requirements', () => {
    it('should parse in <15ms', () => {
      // Performance tests
    });
  });
});
```

### Running Tests

```bash
# Install dependencies
npm install

# Run tests with Vitest
npm test

# Run tests with coverage
npm run test:coverage

# Run performance benchmarks
npm run test:performance
```

## Usage Examples

### Basic Parameter Extraction

```javascript
import { extractFunctionParameters } from './src/parser/index.js';

const source = `indicator("My Indicator", shorttitle="VERYLONGNAME")`;
const result = extractFunctionParameters(source);

// Result structure
{
  functionCalls: [{
    name: 'indicator',
    parameters: {
      shorttitle: 'VERYLONGNAME'
    },
    location: { line: 1, column: 1, offset: 0, length: 50 }
  }],
  errors: [],
  metrics: { parseTimeMs: 2.5 }
}
```

### SHORT_TITLE_TOO_LONG Detection

```javascript
import { validateShortTitle } from './src/parser/index.js';

const source = `strategy("Test", shorttitle="TOOLONGNAME")`;
const result = validateShortTitle(source);

// Violation detected
{
  success: true,
  hasShortTitleError: true,
  violations: [{
    rule: 'SHORT_TITLE_TOO_LONG',
    message: 'The shorttitle is too long (11 characters)...',
    line: 1,
    column: 25,
    metadata: {
      actualLength: 11,
      maxLength: 10,
      actualValue: 'TOOLONGNAME'
    }
  }]
}
```

### Comprehensive Analysis

```javascript
import { analyzePineScript } from './src/parser/index.js';

const source = `
//@version=6
indicator("Advanced Indicator", shorttitle="ADVANCED")
length = input.int(20, "Length")
plot(ta.sma(close, length))
`;

const result = await analyzePineScript(source, validationRules);

// Complete analysis result
{
  success: true,
  violations: [/* violations found */],
  functionCalls: [/* all function calls */],
  metrics: {
    totalTimeMs: 12.3,
    parseTimeMs: 8.1,
    functionsFound: 3,
    errorsFound: 1
  }
}
```

## Error Handling

### Graceful Error Recovery

```javascript
import { tryParse, isSuccess } from './src/parser/error-handler.js';

const result = tryParse(() => parseScript(source));

if (isSuccess(result)) {
  // Process successful parse
  const ast = result.data;
} else {
  // Handle error with context
  console.error(result.error.message);
  console.error('Location:', result.error.location);
}
```

### Error Categories

- **Lexical Errors**: Invalid tokens, unterminated strings
- **Syntax Errors**: Missing parentheses, unexpected tokens
- **Validation Errors**: Parameter constraint violations
- **Performance Errors**: Parse timeouts, memory limits

## Configuration

### Parser Options

```javascript
const options = {
  performanceMode: 'fast',        // 'fast' | 'accurate'
  maxRecoveryAttempts: 10,        // Error recovery limit
  includeComments: false,         // Include comment nodes in AST
  strictMode: true,               // Strict Pine Script validation
  targetVersion: 'v6'             // Pine Script version
};
```

### Validation Rules

```javascript
const validationRules = {
  functionValidationRules: {
    fun_indicator: {
      argumentConstraints: {
        shorttitle: {
          validation_constraints: {
            maxLength: 10,
            errorCode: 'SHORT_TITLE_TOO_LONG'
          }
        }
      }
    }
  }
};
```

## Monitoring and Debugging

### Performance Monitoring

```javascript
import { performanceMonitor } from './src/parser/index.js';

const { result, duration } = performanceMonitor.measure('parsing', () => {
  return parseScript(source);
});

console.log(`Parsing took ${duration}ms`);
```

### Debug Information

```javascript
import { getParserStatus } from './src/parser/index.js';

const status = getParserStatus();
console.log('Parser capabilities:', status.capabilities);
console.log('Performance targets:', status.performance);
```

## Contributing

### Development Setup

```bash
# Clone and setup
git clone <repository>
cd mcp-server-pinescript
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type checking (when migrating to TypeScript)
npm run type-check
```

### Code Standards

- **ES Modules**: Use `import/export` syntax
- **JSDoc**: Comprehensive documentation for TypeScript migration
- **Type Safety**: Use type guards and validation
- **Performance**: Maintain <15ms parse target
- **Testing**: Test-first development with Vitest

### Architecture Principles

1. **Gradual Typing**: Design for smooth TypeScript migration
2. **Performance First**: Sub-15ms targets for all operations
3. **Error Recovery**: Graceful handling of malformed input
4. **Modular Design**: Clear separation of concerns
5. **Integration Friendly**: Easy MCP server integration

## Roadmap

### Immediate (Current Sprint)
- ✅ Core AST generation engine
- ✅ SHORT_TITLE_TOO_LONG validation
- ✅ MCP server integration patterns
- ✅ Comprehensive test suite

### Next Sprint
- TypeScript migration execution
- Advanced validation rules engine
- Performance optimization
- Streaming parser for large files

### Future Releases
- Pine Script v7 support (when available)
- IDE integration plugins
- Advanced static analysis
- Custom validation rule DSL

---

*Built for the mob programming team's test-first approach to Pine Script validation and analysis.*