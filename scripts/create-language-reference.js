#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Consolidate functions-from-html.json and variables-from-html.json 
 * into a single language-reference.json file
 */
async function createLanguageReference() {
  const docsDir = path.join(__dirname, '../docs/processed');
  
  console.log('🔄 Creating consolidated language-reference.json...');
  
  try {
    // Read the HTML-parsed data
    const functionsPath = path.join(docsDir, 'functions-from-html.json');
    const variablesPath = path.join(docsDir, 'variables-from-html.json');
    
    const functionsData = JSON.parse(await fs.readFile(functionsPath, 'utf8'));
    const variablesData = JSON.parse(await fs.readFile(variablesPath, 'utf8'));
    
    console.log(`📊 Loaded ${Object.keys(functionsData).length} functions`);
    console.log(`📊 Loaded ${Object.keys(variablesData).length} variables`);
    
    // Categorize variables for better metadata
    const categories = categorizeVariables(variablesData);
    
    // Create consolidated structure
    const languageReference = {
      functions: functionsData,
      variables: variablesData,
      metadata: {
        source: "Pine Script® language reference manual",
        extraction_method: "manual_html_parsing",
        last_updated: new Date().toISOString(),
        total_functions: Object.keys(functionsData).length,
        total_variables: Object.keys(variablesData).length,
        categories: {
          functions: Object.keys(functionsData).length,
          built_in_variables: categories.builtInVariables,
          constants: categories.constants,
          keywords: categories.keywords,
          types: categories.types,
          operators: categories.operators,
          annotations: categories.annotations
        }
      }
    };
    
    // Save consolidated file
    const outputPath = path.join(docsDir, 'language-reference.json');
    await fs.writeFile(outputPath, JSON.stringify(languageReference, null, 2));
    
    console.log('✅ Created language-reference.json with:');
    console.log(`   🔧 ${languageReference.metadata.categories.functions} functions`);
    console.log(`   📊 ${languageReference.metadata.categories.built_in_variables} built-in variables`);
    console.log(`   🎨 ${languageReference.metadata.categories.constants} constants`);
    console.log(`   🔑 ${languageReference.metadata.categories.keywords} keywords`);
    console.log(`   📝 ${languageReference.metadata.categories.types} types`);
    console.log(`   ➕ ${languageReference.metadata.categories.operators} operators`);
    console.log(`   📋 ${languageReference.metadata.categories.annotations} annotations`);
    console.log(`   📁 Saved to: ${outputPath}`);
    
    return languageReference;
    
  } catch (error) {
    console.error('❌ Failed to create language-reference.json:', error.message);
    throw error;
  }
}

/**
 * Categorize variables to provide better metadata
 */
function categorizeVariables(variablesData) {
  const categories = {
    builtInVariables: 0,
    constants: 0,
    keywords: 0,
    types: 0,
    operators: 0,
    annotations: 0
  };
  
  for (const [id, variable] of Object.entries(variablesData)) {
    const name = variable.name;
    
    if (name.startsWith('@')) {
      categories.annotations++;
    } else if (['and', 'or', 'not', 'if', 'for', 'while', 'switch', 'var', 'varip', 'const', 'import', 'export', 'enum', 'method', 'type', 'true', 'false'].includes(name)) {
      categories.keywords++;
    } else if (['int', 'float', 'string', 'bool', 'color', 'array', 'matrix', 'map', 'table', 'line', 'label', 'box', 'series', 'simple'].includes(name)) {
      categories.types++;
    } else if ([':=', '+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/', '%', '?:', '[]'].includes(name)) {
      categories.operators++;
    } else if (name.includes('.') && (name.startsWith('color.') || name.startsWith('currency.') || name.startsWith('strategy.') || name.startsWith('math.') || name.startsWith('format.') || name.startsWith('scale.') || name.startsWith('display.'))) {
      categories.constants++;
    } else {
      categories.builtInVariables++;
    }
  }
  
  return categories;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await createLanguageReference();
    console.log('\n🎉 Language reference consolidation completed successfully!');
  } catch (error) {
    console.error('\n💥 Consolidation failed:', error.message);
    process.exit(1);
  }
}

export default createLanguageReference;