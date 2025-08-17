/**
 * Line Continuation Validation Test Suite
 * Tests detection and prevention of Pine Script v6 line continuation syntax errors
 * Specifically targets "end of line without line continuation" errors in ternary operators
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createPineScriptParser } from '../../src/parser/index.js'

describe('Line Continuation Validation', () => {
  let parser

  beforeAll(async () => {
    parser = await createPineScriptParser()
  })

  describe('INVALID_LINE_CONTINUATION Detection', () => {
    
    it('should detect ternary line continuation error - basic case', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
slowEma = useAdaptiveRibbon ? 
    (highVolRegime ? slowEma55 : slowEma34) : slowEmaBase
plot(slowEma)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error',
          category: 'syntax_validation',
          line: expect.any(Number),
          message: expect.stringContaining('end of line without line continuation')
        })
      )
    })

    it('should detect ternary line continuation error - nested case', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
macdLine = useDynamicMACD ? 
    (highVolRegime ? macdHigh : normalVolRegime ? macdNorm : macdLow) : macdDefault
plot(macdLine)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })

    it('should detect simple ternary line continuation error', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
result = condition ? 
    value1 : value2
plot(result)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })

    it('should detect color assignment line continuation error', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
color = bullish ? 
    color.green : color.red
plot(close, color=color)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })

    it('should detect function call assignment with line continuation', async () => {
      const problematicCode = `
//@version=6
strategy("Test")
direction = longCondition ? 
    strategy.long : strategy.short
strategy.entry("Trade", direction)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })

    it('should detect multiple ternary line continuation errors', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
fastEma = useFast ? 
    ta.ema(close, 8) : ta.ema(close, 12)
slowEma = useSlow ? 
    ta.ema(close, 21) : ta.ema(close, 34)
plot(fastEma)
plot(slowEma)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(2)
    })
  })

  describe('Valid Line Continuation Patterns', () => {
    
    it('should NOT flag properly formatted single-line ternary', async () => {
      const validCode = `
//@version=6
indicator("Test")
slowEma = useAdaptiveRibbon ? (highVolRegime ? slowEma55 : slowEma34) : slowEmaBase
plot(slowEma)
      `.trim()

      const result = await parser.validateCode(validCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })

    it('should NOT flag simple ternary operators', async () => {
      const validCode = `
//@version=6
indicator("Test")
result = condition ? value1 : value2
color = bullish ? color.green : color.red
direction = longSignal ? strategy.long : strategy.short
plot(result, color=color)
      `.trim()

      const result = await parser.validateCode(validCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })

    it('should NOT flag nested ternary operators on single line', async () => {
      const validCode = `
//@version=6
indicator("Test")
macdLine = useDynamic ? (highVol ? macdHigh : normalVol ? macdNorm : macdLow) : macdDefault
signalLine = useDynamic ? (highVol ? signalHigh : normalVol ? signalNorm : signalLow) : signalDefault
plot(macdLine)
plot(signalLine)
      `.trim()

      const result = await parser.validateCode(validCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })

    it('should NOT flag conditional blocks (not ternary)', async () => {
      const validCode = `
//@version=6
indicator("Test")
var float result = na
if condition
    result := value1
else
    result := value2
plot(result)
      `.trim()

      const result = await parser.validateCode(validCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })

    it('should NOT flag function calls with line breaks (not ternary)', async () => {
      const validCode = `
//@version=6
indicator("Test")
ema21 = ta.ema(
    close, 
    21
)
plot(ema21)
      `.trim()

      const result = await parser.validateCode(validCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })
  })

  describe('Edge Cases and Complex Scenarios', () => {
    
    it('should detect line continuation in complex market structure code', async () => {
      const problematicCode = `
//@version=6
strategy("Complex Test")
// Market structure state
type MarketStructure
    string volatilityRegime = "NORMAL"
    float adaptiveSlowLength = 34.0

var MarketStructure market = MarketStructure.new()

// This should trigger the error
slowEma = useAdaptiveRibbon ? 
    (market.volatilityRegime == "HIGH" ? ta.ema(close, 55) : ta.ema(close, 34)) : ta.ema(close, slowEmaLen)

plot(slowEma)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })

    it('should detect line continuation with comments', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
// This is a problematic assignment
result = condition ? // Comment here
    value1 : value2
plot(result)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })

    it('should handle multiple nested ternary with mixed line styles', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
// First one correct
result1 = condition1 ? value1 : value2
// Second one incorrect  
result2 = condition2 ? 
    (nested ? nestedValue1 : nestedValue2) : defaultValue
plot(result1)
plot(result2)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(1)
    })

    it('should detect line continuation in strategy parameter assignments', async () => {
      const problematicCode = `
//@version=6
strategy("Test")
qtyPercent = dynamicSizing ? 
    (highVolatility ? 0.5 : 1.0) : 2.0
strategy.entry("Long", strategy.long, qty=qtyPercent)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error'
        })
      )
    })
  })

  describe('Regression Prevention', () => {
    
    it('should continue to catch the original error case', async () => {
      // The exact case from the original bug report
      const originalBugCode = `
//@version=6
strategy("EMA Ribbon MACD v1.1", "RIB_v11", overlay = false)

slowEma55 = ta.ema(close, 55)
slowEma34 = ta.ema(close, 34) 
slowEmaBase = ta.ema(close, 34)
useAdaptiveRibbon = true
highVolRegime = true

slowEma = useAdaptiveRibbon ? 
    (highVolRegime ? slowEma55 : slowEma34) : slowEmaBase

plot(slowEma)
      `.trim()

      const result = await parser.validateCode(originalBugCode)
      
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          errorCode: 'INVALID_LINE_CONTINUATION',
          severity: 'error',
          message: expect.stringContaining('end of line without line continuation')
        })
      )
    })

    it('should validate the fix works correctly', async () => {
      // The fixed version should pass
      const fixedCode = `
//@version=6
strategy("EMA Ribbon MACD v1.1", "RIB_v11", overlay = false)

slowEma55 = ta.ema(close, 55)
slowEma34 = ta.ema(close, 34) 
slowEmaBase = ta.ema(close, 34)
useAdaptiveRibbon = true
highVolRegime = true

slowEma = useAdaptiveRibbon ? (highVolRegime ? slowEma55 : slowEma34) : slowEmaBase

plot(slowEma)
      `.trim()

      const result = await parser.validateCode(fixedCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })

    it('should provide helpful error messages', async () => {
      const problematicCode = `
//@version=6
indicator("Test")
result = condition ? 
    value : defaultValue
plot(result)
      `.trim()

      const result = await parser.validateCode(problematicCode)
      
      const lineContError = result.violations.find(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContError).toBeDefined()
      expect(lineContError.message).toMatch(/ternary operators.*properly formatted.*line breaks/)
      expect(lineContError.suggestedFix).toMatch(/single line.*proper line continuation/)
    })
  })

  describe('Performance and Accuracy', () => {
    
    it('should process large files efficiently', async () => {
      // Generate a larger code sample
      const largeCode = `
//@version=6
strategy("Large Test", overlay=false)

// Many valid assignments
${Array.from({length: 50}, (_, i) => `valid${i} = condition${i} ? value${i} : default${i}`).join('\n')}

// One problematic assignment in the middle
problematic = condition ? 
    value : defaultValue

// More valid assignments  
${Array.from({length: 50}, (_, i) => `valid${i + 50} = condition${i + 50} ? value${i + 50} : default${i + 50}`).join('\n')}

plot(problematic)
      `.trim()

      const startTime = Date.now()
      const result = await parser.validateCode(largeCode)
      const duration = Date.now() - startTime

      // Should complete within reasonable time (under 2 seconds)
      expect(duration).toBeLessThan(2000)
      
      // Should find exactly one line continuation error
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(1)
    })

    it('should have high precision (no false positives)', async () => {
      const validComplexCode = `
//@version=6
strategy("Complex Valid", overlay=false)

// Valid complex ternary expressions
result1 = (a and b) ? (c ? value1 : value2) : (d ? value3 : value4)
result2 = condition1 and condition2 ? complexValue : simpleValue  
result3 = not condition ? value : defaultValue
result4 = math.max(a, b) > threshold ? highValue : lowValue

// Valid multi-line constructs (not ternary)
if condition
    result5 := value1
else if otherCondition  
    result5 := value2
else
    result5 := value3

// Valid function calls with line breaks
ema = ta.ema(
    close,
    21
)

strategy.entry(
    "Long",
    strategy.long,
    qty=1.0
)

plot(result1)
      `.trim()

      const result = await parser.validateCode(validComplexCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(0)
    })

    it('should have high recall (no false negatives)', async () => {
      const problematicVariationsCode = `
//@version=6
indicator("Variations Test")

// All these should be caught
error1 = condition1 ? 
    value1 : default1

error2 = (complex and condition) ? 
    (nested ? nestedValue : nestedDefault) : mainDefault

error3 = not condition ? 
    positiveValue : negativeValue

error4 = ta.crossover(fast, slow) ? 
    color.green : color.red

plot(error1)
      `.trim()

      const result = await parser.validateCode(problematicVariationsCode)
      
      const lineContErrors = result.violations.filter(v => v.errorCode === 'INVALID_LINE_CONTINUATION')
      expect(lineContErrors).toHaveLength(4)
    })
  })
})