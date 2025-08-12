# Pine Script Validation Gap Analysis & Enhancement Plan

## Issue Summary

**Problem**: The mcp-server-pinescript failed to catch a `SHORT_TITLE_TOO_LONG` error for Pine Script code where the `shorttitle` parameter exceeded the 10-character limit.

**Error Details**:
- Code: `strategy("EMA Ribbon MACD v1.1", "RIBBON_v1.1", overlay = false, ...)`
- Issue: `"RIBBON_v1.1"` is 11 characters (exceeds 10-character limit)
- Expected Error: `SHORT_TITLE_TOO_LONG`
- Current Behavior: No validation error reported

## Root Cause Analysis

### Current System Limitations

The validation system in `index.js` has the following limitations:

1. **No Parameter Parsing**: Function calls are only detected, not parsed
2. **Missing Validation Rules**: No parameter-level validation constraints
3. **Incomplete Documentation**: Language reference lacks validation constraints

### Architecture Gap

**Current Implementation** (`index.js:577-579`):
```javascript
if (line.includes('indicator(') || line.includes('strategy(')) {
  hasDeclaration = true;
}
```

**Missing Capabilities**:
- Parameter extraction from function calls
- Parameter value validation
- Constraint checking (length, type, range)
- Error code generation (SHORT_TITLE_TOO_LONG)

## Documentation Analysis

### Current Language Reference Structure

The `docs/processed/language-reference.json` contains function definitions but lacks validation constraints:

```json
{
  "name": "shorttitle",
  "type": "const string",
  "description": "The"
}
```

**Issues**:
- Incomplete descriptions (truncated)
- No validation rules
- No constraint information
- Missing error mappings

### Documentation Source Limitations

The source documentation `docs/v6/__pine-script-reference.html` does not provide validation constraint information, requiring enrichment from external sources.

## Enhanced Solution Architecture

### Phase 1: Documentation Enrichment System

**Objective**: Create a system to enhance language reference with validation constraints

**Implementation Plan**:
1. Create validation rules database
2. Enhance language-reference.json with constraints
3. Add error code mappings

**Example Enhanced Structure**:
```json
{
  "name": "shorttitle",
  "type": "const string",
  "description": "The short title of the script displayed in the chart legend. Must be 10 characters or less.",
  "validation": {
    "maxLength": 10,
    "errorCode": "SHORT_TITLE_TOO_LONG",
    "errorMessage": "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)"
  }
}
```

### Phase 2: Parameter Validation Engine

**Objective**: Implement comprehensive parameter parsing and validation

**Components**:
1. **Parameter Parser**: Extract parameters from function calls
2. **Validation Engine**: Apply constraints and generate errors
3. **Error Reporter**: Format and report validation errors

**Technical Architecture**:
```javascript
// Parameter parsing
function parseStrategyCall(line, lineNumber) {
  const regex = /strategy\s*\(\s*([^)]+)\)/;
  const match = line.match(regex);
  if (!match) return null;
  
  return parseParameterList(match[1], lineNumber);
}

// Validation engine
function validateParameters(functionName, parameters, lineNumber) {
  const definition = getLanguageReference(functionName);
  const errors = [];
  
  for (const [name, value] of Object.entries(parameters)) {
    const paramDef = definition.arguments.find(arg => arg.name === name);
    if (paramDef && paramDef.validation) {
      const error = validateParameter(paramDef, value, lineNumber);
      if (error) errors.push(error);
    }
  }
  
  return errors;
}
```

### Phase 3: Integration & Testing

**Objective**: Integrate enhanced validation into existing system

**Integration Points**:
- Modify `reviewSingleCode()` function
- Add parameter validation to function detection
- Enhance error reporting format

## Implementation Tasks

### High Priority

| Task | Description | Files | Effort |
|------|-------------|--------|---------|
| DOC-001 | Create validation rules database | `docs/validation-rules.json` | 4-6h |
| DOC-002 | Enhance language reference with constraints | `docs/processed/language-reference.json` | 6-8h |
| VAL-001 | Implement parameter parsing engine | `index.js` | 8-12h |
| VAL-002 | Add shorttitle length validation | `index.js` | 2-3h |
| VAL-003 | Update error reporting format | `index.js` | 3-4h |

### Medium Priority

| Task | Description | Files | Effort |
|------|-------------|--------|---------|
| DOC-003 | Create documentation enrichment CLI tool | `scripts/enrich-docs.js` | 6-8h |
| VAL-004 | Add validation for other strategy parameters | `index.js` | 8-10h |
| VAL-005 | Add indicator() function validation | `index.js` | 4-6h |
| TEST-001 | Create comprehensive test suite | `test/` | 8-12h |

## Validation Rules Database Structure

Create `docs/validation-rules.json` with comprehensive constraint definitions:

```json
{
  "functions": {
    "strategy": {
      "parameters": {
        "shorttitle": {
          "constraints": {
            "maxLength": 10,
            "errorCode": "SHORT_TITLE_TOO_LONG",
            "errorTemplate": "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)"
          }
        },
        "title": {
          "constraints": {
            "required": true,
            "minLength": 1,
            "errorCode": "TITLE_REQUIRED"
          }
        },
        "max_bars_back": {
          "constraints": {
            "type": "integer",
            "min": 1,
            "max": 5000,
            "errorCode": "INVALID_MAX_BARS_BACK"
          }
        }
      }
    },
    "indicator": {
      "parameters": {
        "shorttitle": {
          "constraints": {
            "maxLength": 10,
            "errorCode": "SHORT_TITLE_TOO_LONG",
            "errorTemplate": "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)"
          }
        }
      }
    }
  }
}
```

## Enhanced Language Reference Schema

Update the language reference structure to include validation information:

```json
{
  "fun_strategy": {
    "arguments": [
      {
        "name": "shorttitle",
        "type": "const string",
        "description": "The short title of the script displayed in the chart legend. Must be 10 characters or less.",
        "optional": true,
        "validation": {
          "maxLength": 10,
          "errorCode": "SHORT_TITLE_TOO_LONG",
          "errorMessage": "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)",
          "severity": "error"
        }
      }
    ]
  }
}
```

## Parameter Parsing Strategy

### Multi-line Function Call Handling

Pine Script functions can span multiple lines, requiring sophisticated parsing:

```pinescript
strategy(
    "Long Strategy",
    "LONG_STR",
    overlay = false,
    default_qty_type = strategy.percent_of_equity,
    default_qty_value = 2
)
```

**Parsing Approach**:
1. Detect function start with opening parenthesis
2. Track parenthesis balance to find function end
3. Extract complete parameter string
4. Parse individual parameters with proper quote handling

### Parameter Types and Parsing

```javascript
function parseParameterList(paramString) {
  const params = {};
  const segments = splitParameters(paramString);
  
  segments.forEach((segment, index) => {
    if (segment.includes('=')) {
      // Named parameter: name = value
      const [name, value] = segment.split('=', 2);
      params[name.trim()] = parseValue(value.trim());
    } else {
      // Positional parameter
      const paramName = getPositionalParamName(index);
      params[paramName] = parseValue(segment.trim());
    }
  });
  
  return params;
}
```

## Error Reporting Enhancement

### Current Error Format
```javascript
{
  line: number,
  rule: string,
  severity: string,
  message: string,
  category: string
}
```

### Enhanced Error Format
```javascript
{
  line: number,
  column: number,
  rule: string,
  severity: 'error' | 'warning' | 'info',
  message: string,
  category: 'validation' | 'style' | 'syntax',
  errorCode: 'SHORT_TITLE_TOO_LONG',
  parameter: 'shorttitle',
  actualValue: 'RIBBON_v1.1',
  expectedConstraint: 'maxLength: 10',
  suggestedFix: 'Shorten to "RIBBON_v11"'
}
```

## Testing Strategy

### Test Cases for Shorttitle Validation

```javascript
// Valid cases
strategy("Test", "TEST", overlay=true)  // 4 chars - valid
strategy("Test", "", overlay=true)      // 0 chars - valid
strategy("Test", "1234567890", overlay=true) // 10 chars - valid

// Invalid cases
strategy("Test", "12345678901", overlay=true) // 11 chars - invalid
strategy("Test", "RIBBON_v1.1", overlay=true) // 11 chars - invalid
strategy("Test", "Very Long Title", overlay=true) // 15 chars - invalid
```

### Multi-line Test Cases

```javascript
// Multi-line strategy call
strategy(
    "EMA Ribbon MACD v1.1", 
    "RIBBON_v1.1",  // Should trigger error
    overlay = false,
    default_qty_type = strategy.percent_of_equity
)
```

## Performance Considerations

### Parsing Performance
- **Current System**: Simple string matching (fast)
- **Enhanced System**: Regex parsing + validation (moderate impact)
- **Optimization**: Cache parsed results, lazy evaluation

### Memory Usage
- **Additional Data**: Validation rules database (~50KB)
- **Runtime Memory**: Parameter parsing objects (minimal)
- **Caching**: Function definition lookups

## Success Metrics

### Validation Coverage
- ✅ Detect SHORT_TITLE_TOO_LONG errors (primary goal)
- ✅ Handle 95%+ of strategy()/indicator() patterns
- ✅ Support multi-line function calls
- ✅ Maintain performance (<500ms validation time)

### Quality Assurance
- Zero false positives for valid Pine Script code
- Comprehensive error messages with actionable suggestions
- Backward compatibility with existing validation

## Future Extensions

### Additional Parameter Validations
- `max_bars_back`: Range validation (1-5000)
- `commission_value`: Type and range validation
- `default_qty_value`: Positive number validation
- `precision`: Integer range validation (0-8)

### Function Coverage Expansion
- `plot()` function parameter validation
- `input()` function constraint checking
- Custom function parameter validation
- Import/library function validation

## Conclusion

This enhancement addresses the critical validation gap by implementing:
1. **Documentation Enrichment**: Adding validation constraints to language reference
2. **Parameter Parsing**: Extracting and validating function parameters
3. **Comprehensive Validation**: Checking constraints and generating appropriate errors

The solution provides a scalable foundation for expanding Pine Script validation coverage while maintaining performance and accuracy.