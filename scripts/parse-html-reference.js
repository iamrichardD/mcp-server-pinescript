#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse Pine Script reference HTML file to extract function signatures and documentation
 */
class PineScriptHTMLParser {
    constructor(htmlFilePath) {
        this.htmlFilePath = htmlFilePath;
        this.functions = new Map();
        this.variables = new Map();
    }

    parse() {
        console.log(`Parsing HTML file: ${this.htmlFilePath}`);
        
        const htmlContent = fs.readFileSync(this.htmlFilePath, 'utf8');
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // Find all Pine Script reference items
        const referenceItems = document.querySelectorAll('.tv-pine-reference-item');
        console.log(`Found ${referenceItems.length} reference items`);

        for (const item of referenceItems) {
            this.parseReferenceItem(item);
        }

        return {
            functions: Object.fromEntries(this.functions),
            variables: Object.fromEntries(this.variables)
        };
    }

    parseReferenceItem(item) {
        const id = item.getAttribute('id');
        if (!id) return;

        const header = item.querySelector('.tv-pine-reference-item__header');
        if (!header) return;

        const name = header.textContent.trim();
        const isFunction = name.includes('()') || id.startsWith('fun_');
        
        const description = this.extractDescription(item);
        const syntax = this.extractSyntax(item);
        const functionArgs = this.extractArguments(item);
        const examples = this.extractExamples(item);
        const type = this.extractType(item);
        const seeAlso = this.extractSeeAlso(item);

        const referenceData = {
            id,
            name: name.replace('()', ''),
            description,
            syntax,
            arguments: functionArgs,
            examples,
            type,
            seeAlso
        };

        if (isFunction) {
            this.functions.set(id, referenceData);
            console.log(`Parsed function: ${name}`);
        } else {
            this.variables.set(id, referenceData);
            console.log(`Parsed variable: ${name}`);
        }
    }

    extractDescription(item) {
        const textElements = item.querySelectorAll('.tv-pine-reference-item__text');
        if (textElements.length === 0) return '';
        
        // First text element is usually the main description
        return textElements[0].textContent.trim();
    }

    extractSyntax(item) {
        const syntaxElement = item.querySelector('.tv-pine-reference-item__syntax');
        return syntaxElement ? syntaxElement.textContent.trim() : '';
    }

    extractArguments(item) {
        const argumentElements = item.querySelectorAll('.tv-pine-reference-item__text');
        const args = [];

        for (const element of argumentElements) {
            const text = element.textContent.trim();
            // Look for argument pattern: "argname (type) description"
            const argMatch = text.match(/^(\w+)\s*\(([^)]+)\)\s+(.+)/);
            if (argMatch) {
                args.push({
                    name: argMatch[1],
                    type: argMatch[2],
                    description: argMatch[3]
                });
            }
        }

        return args;
    }

    extractExamples(item) {
        const exampleElements = item.querySelectorAll('.tv-pine-reference-item__example code');
        const examples = [];

        for (const element of exampleElements) {
            // Get text content and clean up HTML entities
            const code = element.textContent
                .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
                .trim();
            
            if (code) {
                examples.push(code);
            }
        }

        return examples;
    }

    extractType(item) {
        const textElements = item.querySelectorAll('.tv-pine-reference-item__text');
        
        for (const element of textElements) {
            const previousElement = element.previousElementSibling;
            if (previousElement && 
                previousElement.classList.contains('tv-pine-reference-item__sub-header') &&
                previousElement.textContent.trim() === 'Type') {
                return element.textContent.trim();
            }
        }
        
        return '';
    }

    extractSeeAlso(item) {
        const seeAlsoElement = item.querySelector('.tv-pine-reference-item__see-also');
        if (!seeAlsoElement) return [];

        const links = seeAlsoElement.querySelectorAll('a');
        return Array.from(links).map(link => ({
            name: link.textContent.trim(),
            href: link.getAttribute('data-href') || link.getAttribute('href')
        }));
    }

    /**
     * Extract function parameters from syntax string
     */
    static extractParametersFromSyntax(syntax) {
        if (!syntax) return [];

        // Find parameters within parentheses
        const paramMatch = syntax.match(/\(([^)]+)\)/);
        if (!paramMatch) return [];

        const paramString = paramMatch[1];
        const params = paramString.split(',').map(param => param.trim());
        
        return params.filter(param => param && !param.includes('→')); // Remove return type
    }

    /**
     * Save parsed data to JSON files
     */
    saveResults(outputDir) {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Create consolidated language reference
        const languageReference = {
            functions: Object.fromEntries(this.functions),
            variables: Object.fromEntries(this.variables),
            metadata: {
                source: "Pine Script® language reference manual",
                extraction_method: "manual_html_parsing",
                last_updated: new Date().toISOString(),
                total_functions: this.functions.size,
                total_variables: this.variables.size,
                categories: this.categorizeVariables()
            }
        };

        const languageReferencePath = path.join(outputDir, 'language-reference.json');
        fs.writeFileSync(languageReferencePath, JSON.stringify(languageReference, null, 2));

        console.log(`✅ Saved consolidated language reference to ${languageReferencePath}`);
        console.log(`   🔧 ${languageReference.metadata.total_functions} functions`);
        console.log(`   📊 ${languageReference.metadata.categories.built_in_variables} built-in variables`);
        console.log(`   🎨 ${languageReference.metadata.categories.constants} constants`);
        console.log(`   🔑 ${languageReference.metadata.categories.keywords} keywords`);
        console.log(`   📝 ${languageReference.metadata.categories.types} types`);
        console.log(`   ➕ ${languageReference.metadata.categories.operators} operators`);
        console.log(`   📋 ${languageReference.metadata.categories.annotations} annotations`);

        // Also save separate files for backward compatibility (temporary)
        const functionsPath = path.join(outputDir, 'functions-from-html.json');
        const variablesPath = path.join(outputDir, 'variables-from-html.json');
        fs.writeFileSync(functionsPath, JSON.stringify(Object.fromEntries(this.functions), null, 2));
        fs.writeFileSync(variablesPath, JSON.stringify(Object.fromEntries(this.variables), null, 2));
    }

    /**
     * Categorize variables to provide better metadata
     */
    categorizeVariables() {
        const categories = {
            built_in_variables: 0,
            constants: 0,
            keywords: 0,
            types: 0,
            operators: 0,
            annotations: 0
        };
        
        for (const [id, variable] of this.variables) {
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
                categories.built_in_variables++;
            }
        }
        
        return categories;
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const htmlFile = process.argv[2] || path.join(__dirname, '../docs/v6/__pine-script-reference.html');
    const outputDir = process.argv[3] || path.join(__dirname, '../docs/processed');

    if (!fs.existsSync(htmlFile)) {
        console.error(`HTML file not found: ${htmlFile}`);
        process.exit(1);
    }

    try {
        const parser = new PineScriptHTMLParser(htmlFile);
        const results = parser.parse();
        
        // Save results
        parser.saveResults(outputDir);
        
        // Display strategy function info specifically
        const strategyFunction = results.functions['fun_strategy'];
        if (strategyFunction) {
            console.log('\n=== STRATEGY FUNCTION ===');
            console.log('Name:', strategyFunction.name);
            console.log('Syntax:', strategyFunction.syntax);
            
            const params = PineScriptHTMLParser.extractParametersFromSyntax(strategyFunction.syntax);
            console.log('Parameters:', params);
            
            // Check for default_qty_type specifically
            const hasDefaultQtyType = params.some(param => param.includes('default_qty_type'));
            console.log('Contains default_qty_type parameter:', hasDefaultQtyType);
        }
        
        console.log('\nParsing completed successfully!');
        
    } catch (error) {
        console.error('Error parsing HTML file:', error);
        process.exit(1);
    }
}

export default PineScriptHTMLParser;