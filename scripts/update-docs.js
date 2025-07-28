#!/usr/bin/env node

import FirecrawlApp from '@mendable/firecrawl-js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

class PineScriptDocProcessor {
  constructor() {
    this.firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    this.version = 'v6';
    this.processedIndex = {};
    this.styleRules = {};
    this.functions = {};
    this.language = {};
    this.qualityStats = {
      totalAttempts: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      validContent: 0,
      invalidContent: 0
    };
  }

  async updateDocumentation() {
    console.log('🚀 Starting PineScript documentation update...');
    console.log('⏳ Note: This process includes 5-second delays between requests to respect TradingView servers');
    console.log('📊 Expected duration: ~5-10 minutes for complete documentation scraping');
    
    try {
      // Create directories
      await this.ensureDirectories();
      
      // Scrape documentation with delays between sections
      await this.scrapeStyleGuide();
      await this.delay(3000); // Brief pause between sections
      
      await this.scrapeLanguageDocs();
      await this.delay(3000); // Brief pause between sections
      
      await this.scrapeReferenceDocs();
      
      // Process and save data
      await this.saveProcessedData();
      
      // Generate quality report
      this.generateQualityReport();
      
      console.log('✅ Documentation update completed successfully!');
      console.log(`📊 Processed ${Object.keys(this.processedIndex).length} documentation entries`);
      
    } catch (error) {
      console.error('❌ Documentation update failed:', error);
      process.exit(1);
    }
  }

  validateScrapedContent(content, url) {
    this.qualityStats.totalAttempts++;
    
    const issues = [];
    
    // Check for HTTP error responses
    if (content.includes('404 Not Found') || 
        content.includes('403 Forbidden') || 
        content.includes('500 Internal Server Error')) {
      issues.push('HTTP error response detected');
    }
    
    // Check for AWS S3 errors
    if (content.includes('NoSuchKey') || 
        content.includes('AccessDenied')) {
      issues.push('AWS S3 error detected');
    }
    
    // Check for TradingView "page not found" messages
    if (content.includes("This isn't the page you're looking for") ||
        content.includes('Head back') ||
        content.includes('move along to the homepage')) {
      issues.push('TradingView page not found error detected');
    }
    
    // Check for empty or minimal content
    if (content.trim().length < 100) {
      issues.push('Content too short (< 100 characters)');
    }
    
    // Check for valid Pine Script content
    const hasValidContent = content.includes('Pine Script') || 
                           content.includes('PineScript') ||
                           content.includes('@version=6') ||
                           content.includes('TradingView') ||
                           content.includes('ta.') ||
                           content.includes('math.') ||
                           content.includes('array.') ||
                           content.includes('table.cell');
    
    if (!hasValidContent) {
      issues.push('No recognizable Pine Script content');
    }
    
    // Check for redirect pages
    if (content.includes('Redirecting') || 
        (content.includes('redirect') && content.trim().length < 500)) {
      issues.push('Appears to be redirect page');
    }
    
    const isValid = issues.length === 0;
    
    if (isValid) {
      this.qualityStats.validContent++;
    } else {
      this.qualityStats.invalidContent++;
      console.warn(`⚠️  Content quality issues for ${url}:`, issues.join(', '));
    }
    
    return {
      isValid,
      issues,
      url
    };
  }

  generateQualityReport() {
    console.log('\n📋 SCRAPING QUALITY REPORT');
    console.log('=============================');
    console.log(`📊 Total scraping attempts: ${this.qualityStats.totalAttempts}`);
    console.log(`✅ Valid content: ${this.qualityStats.validContent}`);
    console.log(`❌ Invalid content: ${this.qualityStats.invalidContent}`);
    
    if (this.qualityStats.totalAttempts > 0) {
      const successRate = ((this.qualityStats.validContent / this.qualityStats.totalAttempts) * 100).toFixed(1);
      console.log(`📈 Success rate: ${successRate}%`);
    }
    
    if (this.qualityStats.invalidContent > 0) {
      console.log('\n⚠️  Some content failed quality checks. Review warnings above.');
    } else {
      console.log('\n✅ All scraped content passed quality validation!');
    }
  }

  async ensureDirectories() {
    const dirs = [
      path.join(rootDir, 'docs', this.version),
      path.join(rootDir, 'docs', 'processed'),
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async scrapeStyleGuide() {
    console.log('📖 Scraping style guide...');
    
    const url = 'https://www.tradingview.com/pine-script-docs/writing/style-guide';
    const result = await this.scrapeWithRetry(url, {
      formats: ['markdown'],
    });
    
    await this.processStyleGuideContent(result.markdown);
  }

  async scrapeLanguageDocs() {
    console.log('📚 Scraping language documentation...');
    
    const baseUrl = 'https://www.tradingview.com/pine-script-docs/language';
    
    // First scrape the main language page to get navigation
    const mainResult = await this.scrapeWithRetry(baseUrl, {
      formats: ['markdown'],
    });
    
    await this.processLanguageContent(mainResult.markdown, 'overview');
    
    // Additional language topics that are commonly linked
    const languageTopics = [
      'operators',
      'variable-declarations',
      'conditional-structures',
      'loops',
      'methods',
      'objects',
      'arrays',
      'matrices',
      'execution-model',
      'type-system'
    ];
    
    for (const topic of languageTopics) {
      try {
        console.log(`  📄 Scraping ${topic}...`);
        const topicUrl = `${baseUrl}/${topic}`;
        const result = await this.scrapeWithRetry(topicUrl, {
          formats: ['markdown'],
        });
        
        await this.processLanguageContent(result.markdown, topic);
        
        // Rate limiting - be respectful to TradingView servers
        await this.delay(5000);
        
      } catch (error) {
        console.warn(`⚠️  Failed to scrape ${topic}:`, error.message);
      }
    }
  }

  async scrapeReferenceDocs() {
    console.log('🔍 Scraping reference documentation...');
    
    const baseUrl = 'https://www.tradingview.com/pine-script-reference/v6';
    
    // Scrape main reference page
    const mainResult = await this.scrapeWithRetry(baseUrl, {
      formats: ['markdown'],
    });
    
    // Extract function categories from main page
    const categories = this.extractReferenceCategories(mainResult.markdown);
    
    for (const category of categories) {
      try {
        console.log(`  🔧 Scraping ${category} functions...`);
        const categoryUrl = `${baseUrl}/${category}`;
        const result = await this.scrapeWithRetry(categoryUrl, {
          formats: ['markdown'],
        });
        
        await this.processReferenceContent(result.markdown, category);
        
        // Rate limiting - be respectful to TradingView servers
        await this.delay(5000);
        
      } catch (error) {
        console.warn(`⚠️  Failed to scrape ${category}:`, error.message);
      }
    }
  }

  extractReferenceCategories(markdown) {
    // Common PineScript namespaces/categories
    const defaultCategories = [
      'ta', 'math', 'array', 'matrix', 'map', 'str', 'color', 'line', 'box', 
      'label', 'table', 'bgcolor', 'plotshape', 'alertcondition', 'strategy',
      'input', 'request', 'timeframe', 'timestamp', 'dayofweek'
    ];
    
    // Try to extract more categories from the markdown
    const extractedCategories = [];
    const lines = markdown.split('\n');
    
    for (const line of lines) {
      // Look for links to function categories
      const matches = line.match(/\[([a-z]+)\]\([^)]+\)/g);
      if (matches) {
        for (const match of matches) {
          const category = match.match(/\[([a-z]+)\]/)?.[1];
          if (category && category.length > 1 && !extractedCategories.includes(category)) {
            extractedCategories.push(category);
          }
        }
      }
    }
    
    return [...new Set([...defaultCategories, ...extractedCategories])];
  }

  async processStyleGuideContent(markdown) {
    // Validate content quality first
    const validation = this.validateScrapedContent(markdown, 'style-guide');
    if (!validation.isValid) {
      console.warn('⚠️  Style guide content failed validation, skipping processing');
      return;
    }

    const hash = this.generateHash(markdown);
    const filename = `${hash}.md`;
    
    // Save raw markdown
    await fs.writeFile(
      path.join(rootDir, 'docs', this.version, filename),
      markdown
    );
    
    // Extract style rules
    const rules = this.extractStyleRules(markdown);
    Object.assign(this.styleRules, rules);
    
    // Add to index
    this.processedIndex[hash] = {
      title: 'PineScript Style Guide',
      type: 'style_guide',
      content: this.cleanMarkdown(markdown),
      tags: ['style', 'guide', 'naming', 'formatting', 'conventions'],
    };
  }

  async processLanguageContent(markdown, topic) {
    // Validate content quality first
    const validation = this.validateScrapedContent(markdown, `language/${topic}`);
    if (!validation.isValid) {
      console.warn(`⚠️  Language content for ${topic} failed validation, skipping processing`);
      return;
    }

    const hash = this.generateHash(markdown + topic);
    const filename = `${hash}.md`;
    
    // Save raw markdown
    await fs.writeFile(
      path.join(rootDir, 'docs', this.version, filename),
      markdown
    );
    
    // Extract language concepts
    const concepts = this.extractLanguageConcepts(markdown, topic);
    Object.assign(this.language, concepts);
    
    // Add to index
    this.processedIndex[hash] = {
      title: `PineScript Language: ${topic}`,
      type: 'language',
      content: this.cleanMarkdown(markdown),
      tags: ['language', topic, 'syntax', 'concepts'],
      examples: this.extractCodeExamples(markdown),
    };
  }

  async processReferenceContent(markdown, category) {
    // Validate content quality first
    const validation = this.validateScrapedContent(markdown, `reference/${category}`);
    if (!validation.isValid) {
      console.warn(`⚠️  Reference content for ${category} failed validation, skipping processing`);
      return;
    }

    const hash = this.generateHash(markdown + category);
    const filename = `${hash}.md`;
    
    // Save raw markdown
    await fs.writeFile(
      path.join(rootDir, 'docs', this.version, filename),
      markdown
    );
    
    // Extract function definitions
    const functions = this.extractFunctions(markdown, category);
    Object.assign(this.functions, functions);
    
    // Add to index
    this.processedIndex[hash] = {
      title: `${category} Functions`,
      type: 'reference',
      content: this.cleanMarkdown(markdown),
      tags: ['reference', 'functions', category, 'api'],
      examples: this.extractCodeExamples(markdown),
    };
  }

  extractStyleRules(markdown) {
    const rules = {};
    const lines = markdown.split('\n');
    
    // Basic rule extraction - can be enhanced
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('camelCase') || line.includes('naming')) {
        rules['naming_convention'] = {
          rule: 'Use camelCase for variable names',
          severity: 'suggestion',
          category: 'style_guide',
          examples: ['myVariable', 'priceData', 'signalStrength', 'maLengthInput']
        };
      }
      
      if (line.includes('SNAKE_CASE') || line.includes('constants')) {
        rules['constant_naming'] = {
          rule: 'Use SNAKE_CASE for constants',
          severity: 'suggestion',
          category: 'style_guide',
          examples: ['BULL_COLOR', 'BEAR_COLOR', 'MAX_LOOKBACK']
        };
      }
      
      if (line.includes('indentation') || line.includes('spaces')) {
        rules['indentation'] = {
          rule: 'Use consistent indentation',
          severity: 'suggestion',
          category: 'style_guide',
        };
      }
    }
    
    return rules;
  }

  extractLanguageConcepts(markdown, topic) {
    const concepts = {};
    
    concepts[topic] = {
      content: this.cleanMarkdown(markdown),
      examples: this.extractCodeExamples(markdown),
      type: 'language_concept',
    };
    
    return concepts;
  }

  extractFunctions(markdown, category) {
    const functions = {};
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for function signatures
      const functionMatch = line.match(/^#+\s*([a-z_]+\.[a-z_]+|\w+)\s*\(/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const fullName = functionName.includes('.') ? functionName : `${category}.${functionName}`;
        
        functions[fullName] = {
          name: fullName,
          category,
          signature: line,
          description: this.getNextContentLines(lines, i + 1, 3),
          examples: this.extractCodeExamples(lines.slice(i, i + 20).join('\n')),
        };
      }
    }
    
    return functions;
  }

  extractCodeExamples(markdown) {
    const examples = [];
    const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
    
    for (const block of codeBlocks) {
      const code = block.replace(/```\w*\n?/g, '').replace(/```/g, '').trim();
      if (code && code.length > 10) {
        examples.push(code);
      }
    }
    
    return examples;
  }

  getNextContentLines(lines, startIndex, maxLines) {
    const content = [];
    for (let i = startIndex; i < Math.min(startIndex + maxLines, lines.length); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#')) {
        content.push(line);
      }
    }
    return content.join(' ');
  }

  cleanMarkdown(markdown) {
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
      .replace(/\n{3,}/g, '\n\n') // Normalize whitespace
      .trim();
  }

  generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  async saveProcessedData() {
    // Save index
    await fs.writeFile(
      path.join(rootDir, 'docs', 'processed', 'index.json'),
      JSON.stringify(this.processedIndex, null, 2)
    );
    
    // Save style rules
    await fs.writeFile(
      path.join(rootDir, 'docs', 'processed', 'style-rules.json'),
      JSON.stringify(this.styleRules, null, 2)
    );
    
    // Save functions
    await fs.writeFile(
      path.join(rootDir, 'docs', 'processed', 'functions.json'),
      JSON.stringify(this.functions, null, 2)
    );
    
    // Save language concepts
    await fs.writeFile(
      path.join(rootDir, 'docs', 'processed', 'language.json'),
      JSON.stringify(this.language, null, 2)
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  🔄 Attempt ${attempt}/${maxRetries}: ${url}`);
        const result = await this.firecrawl.scrapeUrl(url, options);
        
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Unknown scraping error');
        }
      } catch (error) {
        console.warn(`  ⚠️  Attempt ${attempt} failed: ${error.message}`);
        
        if (error.statusCode === 429) {
          // Rate limited - wait longer before retry
          const backoffDelay = attempt * 10000; // 10s, 20s, 30s
          console.log(`  ⏳ Rate limited. Waiting ${backoffDelay/1000}s before retry...`);
          await this.delay(backoffDelay);
        } else if (attempt === maxRetries) {
          // Final attempt failed
          throw error;
        } else {
          // Other error - shorter wait
          await this.delay(2000);
        }
      }
    }
  }
}

// Main execution
if (process.argv[1] === __filename) {
  const processor = new PineScriptDocProcessor();
  processor.updateDocumentation();
}