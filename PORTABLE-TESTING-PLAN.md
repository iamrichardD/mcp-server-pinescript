# Portable Testing Plan for Pine Script MCP Server

## 🎯 Purpose
Standardized testing framework for validating Pine Script MCP server functionality across different projects and contexts, ensuring consistent behavior and validation accuracy.

## 📋 Quick Test Suite (5 minutes)

### Pre-Test Environment Check
```bash
# 1. Verify prerequisites
node --version    # ≥18.0.0
npm --version     # ≥8.0.0
claude --version  # Claude Code CLI installed

# 2. Check MCP server connection
claude mcp list
# Expected: pinescript-docs/pine-server: Connected ✓

# 3. Validate data foundation
claude -p "Use pinescript_reference to search 'ta.sma' and show function count"
# Expected: Function details + metadata showing 457 functions loaded
```

### Core Validation Tests

#### Test 1: SHORT_TITLE_TOO_LONG Validation
```bash
# Test case: 11-character short title (should trigger error)
claude -p "Use pinescript_review to check: strategy('Test', shorttitle='RIBBON_v1.1', overlay=false)"

# Expected Result:
# {
#   "violations": [
#     {
#       "code": "SHORT_TITLE_TOO_LONG",
#       "severity": "error", 
#       "message": "shorttitle 'RIBBON_v1.1' (11 chars) exceeds 10 character limit",
#       "line": 1,
#       "fix": "Use max 10 characters for shorttitle parameter"
#     }
#   ]
# }

# CRITICAL: If no error is returned, validation rules are not working correctly
```

#### Test 2: INVALID_PRECISION Validation  
```bash
# Test case: Precision > 8 (should trigger error)
claude -p "Use pinescript_review to check: strategy('Test', precision=15)"

# Expected Result:
# {
#   "violations": [
#     {
#       "code": "INVALID_PRECISION", 
#       "severity": "error",
#       "message": "precision=15 exceeds maximum allowed value of 8"
#     }
#   ]
# }
```

#### Test 3: Multiple Validation Errors
```bash
# Test case: Multiple violations in single code block
claude -p "Use pinescript_review to check: strategy('Test Strategy Name', shorttitle='VERY_LONG_TITLE_NAME', precision=25, max_bars_back=10000)"

# Expected Result: 3 violations
# - SHORT_TITLE_TOO_LONG (20 chars > 10)
# - INVALID_PRECISION (25 > 8) 
# - INVALID_MAX_BARS_BACK (10000 > 5000)
```

#### Test 4: Performance Benchmark
```bash
# Test case: Response time validation
time claude -p "Use pinescript_reference to search 'array functions'"

# Expected Result: <50ms total response time
# Critical threshold: >100ms indicates performance regression
```

#### Test 5: Data Integrity Verification
```bash
# Test case: Complete data access
claude -p "Use pinescript_reference to search 'strategy' and show total function count"

# Expected Result: 
# - Functions: 457 loaded
# - Variables: 427 loaded  
# - Total: 884 Pine Script items accessible
```

## 🔧 Diagnostic Commands

### When Tests Fail

#### No Validation Errors Detected
```bash
# Debug validation rule loading
claude -p "List all available pinescript_review validation rules"

# Check server startup logs for validation rule count
npm start 2>&1 | grep -E "(validation|rules|loaded)"

# Verify validation rules file exists and has content
ls -la docs/validation-rules.json
cat docs/validation-rules.json | jq '.rules | length'
```

#### Slow Performance (>100ms)
```bash
# Check data loading status
claude -p "Use pinescript_reference metadata to show preloading status"

# Verify memory preloading occurred
npm start 2>&1 | grep -E "(preload|memory|performance)"

# Test file I/O vs memory access
time cat docs/processed/language-reference.json > /dev/null
# Should be significantly slower than MCP queries
```

#### Connection Issues
```bash
# Verify MCP registration
claude mcp list | grep -E "(pine|script)"

# Check server process
ps aux | grep "index.js"

# Test direct server startup
npm start &
sleep 2
curl -X POST http://localhost:3000/health || echo "No HTTP endpoint available"
```

## 📊 Cross-Project Validation Checklist

### Before Testing in New Project Context

- [ ] **Environment Verification**: Node.js ≥18, Claude CLI installed
- [ ] **MCP Registration**: Server properly connected to Claude CLI
- [ ] **Data Foundation**: 457 functions + 427 variables loaded
- [ ] **Validation Rules**: 9 validation rules operational
- [ ] **Performance Baseline**: <50ms response times established

### Expected Behavior Standards

- [ ] **SHORT_TITLE_TOO_LONG**: Triggers for >10 character shorttitle
- [ ] **INVALID_PRECISION**: Triggers for precision >8
- [ ] **INVALID_MAX_BARS_BACK**: Triggers for max_bars_back >5000
- [ ] **Function Search**: Returns detailed function documentation <50ms
- [ ] **Streaming Support**: Large results delivered progressively
- [ ] **Error Handling**: Graceful degradation with helpful error messages

### Success Criteria

✅ **Validation Accuracy**: All test cases trigger expected violations  
✅ **Performance Standards**: <50ms response times consistently  
✅ **Data Completeness**: Full Pine Script reference accessible  
✅ **Error Quality**: Specific, actionable violation messages  
✅ **Streaming Capability**: Large datasets handled without timeout  

### Failure Investigation Protocol

1. **Immediate Diagnosis**: Run all 5 core tests and document failures
2. **Data Verification**: Confirm 457+427 items loaded in language-reference.json
3. **Rule Validation**: Verify validation-rules.json contains expected rule definitions
4. **Performance Analysis**: Measure response times and identify bottlenecks
5. **Context Documentation**: Record project-specific configuration differences

## 🚀 Advanced Testing Scenarios

### Enterprise Environment Testing
```bash
# Concurrent load testing
for i in {1..10}; do (claude -p "Use pinescript_reference to search 'indicator'" &); done; wait

# Large file processing
claude -p "Use pinescript_review with format=stream on 500+ line Pine Script file"

# Directory scanning capability  
claude -p "Use pinescript_review with source_type=directory on multi-file project"
```

### Integration Testing
```bash
# API compatibility
curl -X POST "http://localhost:3000/api/reference" -H "Content-Type: application/json" -d '{"query": "ta.sma"}'

# CLI integration patterns
claude --json -p "Use pinescript_review to analyze sample strategy" | jq '.violations | length'

# Streaming JSON validation
claude -p "Use pinescript_review with format=stream" | jq --stream
```

## 📝 Test Result Documentation Template

```markdown
## Test Execution Report
**Date**: YYYY-MM-DD  
**Environment**: [Development/Staging/Production]  
**MCP Server Version**: [package.json version]  
**Context**: [Project/Organization name]

### Test Results Summary
- [ ] Core Validation Tests: PASS/FAIL  
- [ ] Performance Benchmarks: PASS/FAIL (<50ms)
- [ ] Data Integrity: PASS/FAIL (457+427 items)
- [ ] Error Handling: PASS/FAIL
- [ ] Streaming Capability: PASS/FAIL

### Issues Identified
1. **Issue**: Description  
   **Impact**: High/Medium/Low  
   **Resolution**: Action taken or required

### Performance Metrics
- Average response time: XXms
- Data loading status: Complete/Partial/Failed
- Validation accuracy rate: XX/XX tests passed

### Recommendations
- Immediate actions required
- Performance optimizations needed  
- Configuration adjustments suggested
```

## 🎯 Continuous Validation Strategy

### Regular Health Checks
```bash
# Daily validation suite (automated)
./run-portable-tests.sh --quick

# Weekly comprehensive testing
./run-portable-tests.sh --full --performance-analysis

# Release validation  
./run-portable-tests.sh --enterprise --load-testing
```

### Project-Specific Adaptation
1. **Configuration Review**: Adapt test parameters for project context
2. **Baseline Establishment**: Measure project-specific performance characteristics  
3. **Custom Test Cases**: Add project-relevant Pine Script validation scenarios
4. **Integration Points**: Test MCP server with project's specific AI toolchain

This portable testing plan ensures consistent validation behavior across different projects while providing systematic debugging approaches for any issues encountered.