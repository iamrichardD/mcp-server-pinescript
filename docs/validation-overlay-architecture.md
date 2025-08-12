# Validation Overlay Architecture

## Overview

This document outlines the validation overlay system that maintains Pine Script validation rules separately from the core documentation processing, enabling enhanced parameter validation without modifying source documentation integrity.

## Architecture Design

### Current Processing Flow
```
docs/v6/__pine-script-reference.html 
    ↓ (processing)
    ↓
docs/processed/language-reference.json
```

### Enhanced Processing Flow  
```
docs/v6/__pine-script-reference.html + docs/validation-rules.json
    ↓ (enhanced processing)
    ↓
docs/processed/language-reference.json (with validation_constraints)
```

## Component Overview

### 1. Validation Rules Storage (`docs/validation-rules.json`)

**Purpose**: Central repository for validation constraints not available in official Pine Script documentation.

**Structure**:
- Function-based organization using Pine Script function IDs
- Parameter-specific validation constraints
- Error code definitions and documentation
- Processing instructions for merge operations

**Key Features**:
- Version tracking for validation rule changes
- Source attribution for validation requirements
- Maintainer information and update history
- Clear separation from official documentation

### 2. Enhancement Processor (`scripts/enhancement-processor.js`)

**Purpose**: Merge validation rules with processed language reference during documentation generation.

**Responsibilities**:
- Load validation rules from `docs/validation-rules.json`
- Match rules to function/parameter combinations
- Enhance language-reference.json with validation_constraints
- Preserve all existing documentation structure
- Handle missing functions/parameters gracefully

### 3. Enhanced Validation Engine (`index.js` modifications)

**Purpose**: Utilize enhanced language reference for parameter-level validation during code review.

**Capabilities**:
- Parse function parameters from Pine Script code
- Apply validation constraints from enhanced language reference
- Generate specific error codes (e.g., SHORT_TITLE_TOO_LONG)
- Provide actionable error messages and suggestions

## Implementation Strategy

### Phase 1: Foundation Setup

**Files Created/Modified**:
- ✅ `docs/validation-rules.json` - Central validation repository
- ✅ `docs/validation-overlay-architecture.md` - Architecture documentation
- 🔄 `scripts/enhancement-processor.js` - Merge processing logic
- 🔄 `package.json` - Updated build scripts

**Integration Points**:
1. Documentation processing pipeline
2. Language reference enhancement
3. Validation engine updates

### Phase 2: Processing Integration

**Enhancement Processor Implementation**:
```javascript
// scripts/enhancement-processor.js
const fs = require('fs');
const path = require('path');

function enhanceLanguageReference() {
  // Load base language reference
  const languageRef = JSON.parse(fs.readFileSync(
    'docs/processed/language-reference.json', 'utf8'
  ));
  
  // Load validation rules
  const validationRules = JSON.parse(fs.readFileSync(
    'docs/validation-rules.json', 'utf8'
  ));
  
  // Merge validation constraints
  const enhanced = mergeValidationRules(languageRef, validationRules);
  
  // Write enhanced version
  fs.writeFileSync(
    'docs/processed/language-reference.json',
    JSON.stringify(enhanced, null, 2)
  );
}

function mergeValidationRules(languageRef, validationRules) {
  const enhanced = JSON.parse(JSON.stringify(languageRef)); // Deep copy
  
  for (const [functionId, constraints] of Object.entries(validationRules.functionValidationRules)) {
    if (enhanced.functions[functionId]) {
      const functionDef = enhanced.functions[functionId];
      
      for (const argument of functionDef.arguments || []) {
        const argConstraints = constraints.argumentConstraints[argument.name];
        if (argConstraints) {
          argument.validation_constraints = argConstraints.validation_constraints;
        }
      }
    }
  }
  
  return enhanced;
}
```

### Phase 3: Validation Engine Enhancement

**Parameter Parsing Logic**:
```javascript
// index.js enhancements
function validateFunctionParameters(functionCall, lineNumber) {
  const { functionName, parameters } = parseFunctionCall(functionCall);
  const functionDef = getLanguageReference(functionName);
  
  if (!functionDef || !functionDef.arguments) return [];
  
  const errors = [];
  
  for (const argument of functionDef.arguments) {
    if (argument.validation_constraints && parameters[argument.name]) {
      const error = validateParameter(
        argument.validation_constraints,
        parameters[argument.name],
        lineNumber
      );
      if (error) errors.push(error);
    }
  }
  
  return errors;
}

function validateParameter(constraints, value, lineNumber) {
  // Handle shorttitle length validation
  if (constraints.maxLength && value.length > constraints.maxLength) {
    return {
      line: lineNumber,
      rule: 'parameter_validation',
      severity: constraints.severity || 'error',
      message: constraints.errorMessage.replace('{length}', value.length),
      category: constraints.category || 'validation',
      errorCode: constraints.errorCode,
      suggested_fix: `Shorten to ${constraints.maxLength} characters or less`
    };
  }
  
  // Handle other constraint types (min, max, type, etc.)
  return validateOtherConstraints(constraints, value, lineNumber);
}
```

## Validation Rules Structure

### Function Organization
```json
{
  "functionValidationRules": {
    "fun_strategy": {
      "argumentConstraints": {
        "shorttitle": {
          "validation_constraints": {
            "maxLength": 10,
            "errorCode": "SHORT_TITLE_TOO_LONG",
            "errorMessage": "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)",
            "severity": "error"
          }
        }
      }
    }
  }
}
```

### Enhanced Language Reference Output
```json
{
  "functions": {
    "fun_strategy": {
      "arguments": [
        {
          "name": "shorttitle",
          "type": "const string",
          "description": "The short title...",
          "validation_constraints": {
            "maxLength": 10,
            "errorCode": "SHORT_TITLE_TOO_LONG",
            "errorMessage": "The shorttitle is too long ({length} characters). It should be 10 characters or less.(SHORT_TITLE_TOO_LONG)",
            "severity": "error"
          }
        }
      ]
    }
  }
}
```

## Maintenance Workflow

### Adding New Validation Rules

1. **Identify Validation Requirement**:
   - Discover missing validation from user reports
   - Research TradingView Pine Script Editor behavior
   - Document validation constraint details

2. **Update Validation Rules**:
   ```bash
   # Edit docs/validation-rules.json
   # Add new constraint to appropriate function/parameter
   ```

3. **Regenerate Enhanced Documentation**:
   ```bash
   npm run enhance-docs  # Runs enhancement processor
   ```

4. **Test Validation**:
   ```bash
   # Test with sample Pine Script code
   # Verify error detection and messaging
   ```

5. **Commit Changes**:
   ```bash
   git add docs/validation-rules.json
   git commit -m "Add validation rule for [parameter]: [description]"
   ```

### Updating Existing Rules

1. **Modify Validation Rules**: Update constraint values or error messages
2. **Regenerate Documentation**: Re-run enhancement processor
3. **Test Impact**: Verify existing code validation behavior
4. **Document Changes**: Clear commit messages and change documentation

## Error Code Management

### Error Code Registry
All validation error codes are centrally defined in `docs/validation-rules.json`:

```json
{
  "errorCodeDefinitions": {
    "SHORT_TITLE_TOO_LONG": {
      "description": "Function shorttitle parameter exceeds 10 character limit",
      "severity": "error",
      "category": "parameter_validation",
      "documentation": "The shorttitle parameter is displayed in chart legends and must be concise"
    }
  }
}
```

### Error Message Templates
Support dynamic error messages with parameter interpolation:
- `{length}` - Actual parameter length
- `{value}` - Parameter value
- `{min}` - Minimum constraint value  
- `{max}` - Maximum constraint value

## Performance Considerations

### Memory Impact
- **Validation Rules**: ~2-5MB additional memory usage
- **Enhanced Language Reference**: Negligible increase (~1-2% larger)
- **Processing Overhead**: <10ms merge time during documentation generation

### Processing Performance
- **Code Review Speed**: No impact (validation rules loaded once)
- **Startup Time**: Minimal increase (<100ms)
- **Memory Footprint**: Current 161MB → ~163-166MB estimated

### Optimization Strategies
- **Lazy Loading**: Load validation rules only when needed
- **Caching**: Cache merged language reference in memory
- **Selective Enhancement**: Only enhance functions with validation rules

## Testing Strategy

### Unit Tests
```javascript
// Test validation rule merging
describe('ValidationRuleMerging', () => {
  test('should merge shorttitle constraints', () => {
    const enhanced = mergeValidationRules(baseLanguageRef, validationRules);
    const shorttitleArg = enhanced.functions.fun_strategy.arguments
      .find(arg => arg.name === 'shorttitle');
    
    expect(shorttitleArg.validation_constraints.maxLength).toBe(10);
    expect(shorttitleArg.validation_constraints.errorCode).toBe('SHORT_TITLE_TOO_LONG');
  });
});

// Test parameter validation
describe('ParameterValidation', () => {
  test('should detect shorttitle too long', () => {
    const code = 'strategy("Test", "RIBBON_v1.1", overlay=false)';
    const errors = validateCode(code);
    
    expect(errors).toHaveLength(1);
    expect(errors[0].errorCode).toBe('SHORT_TITLE_TOO_LONG');
  });
});
```

### Integration Tests
- Full documentation processing pipeline
- Code validation with enhanced language reference
- Performance regression testing
- Backward compatibility verification

## Risk Mitigation

### Data Integrity
- **Source Preservation**: Never modify original language-reference.json processing
- **Validation**: Schema validation for validation-rules.json
- **Backup**: Version control for all rule changes

### Performance Protection
- **Memory Monitoring**: Track memory usage impact
- **Performance Benchmarks**: Maintain current response time standards
- **Fallback Logic**: Graceful degradation if enhancement fails

### Compatibility Assurance
- **Backward Compatibility**: All existing functionality preserved
- **API Stability**: No breaking changes to existing interfaces
- **Migration Path**: Clear upgrade path for existing implementations

## Future Extensions

### Advanced Validation Types
- **Cross-parameter Validation**: Relationships between multiple parameters
- **Conditional Constraints**: Rules that depend on other parameter values
- **Dynamic Validation**: Runtime constraint evaluation

### Enhanced Error Reporting
- **IDE Integration**: Rich error information for development environments  
- **Quick Fixes**: Automated parameter correction suggestions
- **Context-aware Messages**: Errors tailored to specific use cases

### Validation Rule Sources
- **Community Contributions**: Framework for user-submitted validation rules
- **Automated Discovery**: Parse Pine Script forums/documentation for new constraints
- **Version-specific Rules**: Different constraints for different Pine Script versions

## Conclusion

The validation overlay architecture provides a maintainable, scalable solution for enhancing Pine Script parameter validation while preserving the integrity of the official documentation processing pipeline. This approach enables the team to:

- **Catch Missing Errors**: Like SHORT_TITLE_TOO_LONG that wasn't detected before
- **Maintain Separation**: Keep validation logic separate from documentation processing
- **Enable Growth**: Framework supports expanding validation coverage over time
- **Preserve Performance**: Minimal impact on existing optimized system

The architecture successfully addresses the original issue while providing a foundation for comprehensive Pine Script validation enhancement.