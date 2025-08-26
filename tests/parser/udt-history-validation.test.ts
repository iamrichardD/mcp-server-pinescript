
import { describe, it, expect } from 'vitest';
import { analyzePineScript } from '../../src/parser';

describe('UDT History-Referencing Validation', () => {
  it('should detect incorrect history-referencing on a UDT field', async () => {
    const pineScriptWithUdtError = `//@version=6
strategy("UDT History Test", shorttitle="UDT_TEST", overlay=true)

// User-defined type for testing
type TestState
    float value
    int count
    bool active

// Initialize state
var TestState state = TestState.new(0.0, 0, false)

// PROBLEMATIC CODE - This should cause the compilation error
// Using object.field[1] instead of (object[1]).field
badValue = state.value[1]  // ERROR: Cannot use history-referencing on UDT fields
badCount = state.count[1]  // ERROR: Cannot use history-referencing on UDT fields

plot(badValue)
`;

    const result = await analyzePineScript(pineScriptWithUdtError);

    // Expect at least two parsing errors for the two incorrect lines
    expect(result.errors).toBeInstanceOf(Array);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);

    // Check for the specific UDT history syntax error
    const udtHistoryErrors = result.errors.filter(
      (e) => e.code === 'UDT_HISTORY_SYNTAX_ERROR'
    );
    expect(udtHistoryErrors.length).toBe(2);

    // Verify details of the first error
    const error1 = udtHistoryErrors.find((e) => e.location.line === 15);
    expect(error1).toBeDefined();
    if (error1) {
      expect(error1.severity).toBe('error');
      expect(error1.message).toContain("Cannot use the history-referencing operator on fields of user-defined types. Reference the history of the object first (e.g., '(object[1]).field').");
    }

    // Verify details of the second error
    const error2 = udtHistoryErrors.find((e) => e.location.line === 16);
    expect(error2).toBeDefined();
    if (error2) {
      expect(error2.severity).toBe('error');
      expect(error2.message).toContain("Cannot use the history-referencing operator on fields of user-defined types. Reference the history of the object first (e.g., '(object[1]).field').");
    }
  });
});
