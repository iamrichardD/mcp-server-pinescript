# Integration Fix Recommendation

## Issue: MCP Review Tool Not Using Full Validation System

### Current State
The `pinescript_review` tool in `index.js` uses individual validation functions:
```javascript
// Lines ~600-650 in index.js
const { quickValidateShortTitle } = await import('./src/parser/index.js');
const { quickValidatePrecision } = await import("./src/parser/index.js");
const { quickValidateMaxBarsBack } = await import("./src/parser/index.js");
```

### Recommended Fix
Replace individual validators with the comprehensive validation system:

```javascript
// Import the full validation system
import { validateParameters, loadValidationRules } from './src/parser/validator.js';

// Load validation rules once at startup (add to server initialization)
const rulesContent = await fs.readFile('./docs/validation-rules.json', 'utf8');
const rules = JSON.parse(rulesContent);
loadValidationRules(rules);

// In reviewSingleCode function, replace individual validation with:
try {
  const validationResult = validateParameters(code);
  
  // Convert validation result to expected format
  validationResult.violations.forEach(violation => {
    violations.push({
      line: violation.location?.line || 1,
      column: violation.location?.column || 1,
      severity: violation.severity,
      message: violation.message,
      rule: violation.code,
      category: violation.category
    });
  });
} catch (error) {
  console.warn('Validation unavailable:', error.message);
}
```

### Benefits
1. **Complete validation coverage** - All 8 validation rules at once
2. **Improved performance** - Single parsing pass instead of multiple
3. **Consistent error format** - Unified violation structure
4. **Future-proof** - Automatically includes new validation rules

### Implementation Impact
- **Files to modify**: `index.js` (lines ~600-650)
- **Testing required**: Verify MCP tool responses match current format
- **Risk level**: Low (fallback error handling already in place)
- **Performance impact**: Positive (fewer parsing operations)

### Quick Test Command
```bash
claude -p --dangerously-skip-permissions "Use pinescript_review tool to validate: strategy('Test', shorttitle='VERY_LONG_TITLE', precision=15, max_bars_back=10000)"
```

Expected result after fix: Should detect all 3 violations (SHORT_TITLE_TOO_LONG, INVALID_PRECISION, INVALID_MAX_BARS_BACK) in a single validation pass.