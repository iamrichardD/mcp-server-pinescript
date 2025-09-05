#!/usr/bin/env node

// Debug test for quickValidateSeriesTypeWhereSimpleExpected
async function testFunction() {
  try {
    const { quickValidateSeriesTypeWhereSimpleExpected } = await import('./src/parser/index.js');
    
    const testCode = `
      //@version=6
      type MyUDT
          float adaptiveSlowLength
      var myUdt = MyUDT.new(14.0)
      ta.ema(close, myUdt.adaptiveSlowLength)
    `;
    
    console.log('All exports:');
    const allExports = await import('./dist/src/parser/index.js');
    console.log('Exported keys:', Object.keys(allExports));
    console.log('quickValidateSeriesTypeWhereSimpleExpected type:', typeof allExports.quickValidateSeriesTypeWhereSimpleExpected);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFunction();