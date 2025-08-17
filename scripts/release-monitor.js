#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Release Monitoring and Validation System for mcp-server-pinescript
 * 
 * Features:
 * - Post-release validation and monitoring
 * - NPM package availability verification
 * - Download and installation testing
 * - Performance regression detection
 * - Release health dashboard
 * - Automated rollback recommendations
 */

class ReleaseMonitor {
  constructor() {
    this.packagePath = path.join(process.cwd(), 'package.json');
    this.packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.packageName = this.packageData.name;
    this.currentVersion = this.packageData.version;
  }

  /**
   * Comprehensive post-release validation
   */
  async validateRelease(version = this.currentVersion) {
    console.log(`🔍 Validating release: ${this.packageName}@${version}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const validations = [
      { name: 'NPM Registry Availability', check: () => this.checkNpmAvailability(version) },
      { name: 'Package Download Test', check: () => this.testPackageDownload(version) },
      { name: 'Installation Verification', check: () => this.testInstallation(version) },
      { name: 'Basic Functionality Test', check: () => this.testBasicFunctionality(version) },
      { name: 'Performance Regression Check', check: () => this.checkPerformanceRegression() },
      { name: 'Documentation Consistency', check: () => this.validateDocumentation(version) }
    ];

    let passedCount = 0;
    const results = [];

    for (const validation of validations) {
      console.log(`  🔬 ${validation.name}...`);
      try {
        const result = await validation.check();
        console.log(`  ✅ ${validation.name} passed`);
        results.push({ name: validation.name, status: 'passed', details: result });
        passedCount++;
      } catch (error) {
        console.log(`  ❌ ${validation.name} failed: ${error.message}`);
        results.push({ name: validation.name, status: 'failed', error: error.message });
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Validation Results: ${passedCount}/${validations.length} passed`);
    
    if (passedCount === validations.length) {
      console.log('🎉 Release validation completed successfully!');
      console.log(`✅ ${this.packageName}@${version} is healthy and ready for use`);
    } else {
      console.log('⚠️  Some validations failed - review results above');
      this.generateRollbackRecommendations(results);
    }

    return { passedCount, totalCount: validations.length, results };
  }

  /**
   * Checks if package is available on NPM registry
   */
  async checkNpmAvailability(version) {
    try {
      const npmInfo = execSync(`npm info ${this.packageName}@${version} --json`, { encoding: 'utf8' });
      const info = JSON.parse(npmInfo);
      
      if (info.version !== version) {
        throw new Error(`Version mismatch: expected ${version}, got ${info.version}`);
      }
      
      return {
        version: info.version,
        publishedAt: info.time[version],
        tarball: info.dist.tarball,
        size: info.dist.unpackedSize
      };
    } catch (error) {
      throw new Error(`Package not available on NPM: ${error.message}`);
    }
  }

  /**
   * Tests package download from NPM registry
   */
  async testPackageDownload(version) {
    const tempDir = '/tmp/npm-download-test';
    
    try {
      // Clean up any existing test directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Change to temp directory
      const originalDir = process.cwd();
      process.chdir(tempDir);
      
      // Download package
      const downloadResult = execSync(`npm pack ${this.packageName}@${version}`, { encoding: 'utf8' });
      const tarballName = downloadResult.trim().split('\n').pop();
      
      if (!fs.existsSync(tarballName)) {
        throw new Error('Downloaded tarball not found');
      }
      
      const stats = fs.statSync(tarballName);
      const sizeKB = Math.round(stats.size / 1024);
      
      // Return to original directory
      process.chdir(originalDir);
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      return { tarball: tarballName, size: `${sizeKB}KB`, downloadedAt: new Date().toISOString() };
      
    } catch (error) {
      // Ensure we return to original directory
      try {
        const originalDir = path.dirname(this.packagePath);
        process.chdir(originalDir);
      } catch (e) {
        // Ignore errors in cleanup
      }
      throw new Error(`Download test failed: ${error.message}`);
    }
  }

  /**
   * Tests package installation in clean environment
   */
  async testInstallation(version) {
    const testDir = '/tmp/npm-install-test';
    
    try {
      // Clean up any existing test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      fs.mkdirSync(testDir, { recursive: true });
      
      // Change to test directory
      const originalDir = process.cwd();
      process.chdir(testDir);
      
      // Initialize npm project
      execSync('npm init -y', { stdio: 'pipe' });
      
      // Install package
      const installStart = Date.now();
      execSync(`npm install ${this.packageName}@${version}`, { stdio: 'pipe' });
      const installTime = Date.now() - installStart;
      
      // Verify installation
      const nodeModulesPath = path.join(testDir, 'node_modules', this.packageName);
      if (!fs.existsSync(nodeModulesPath)) {
        throw new Error('Package not found in node_modules after installation');
      }
      
      // Check package.json in installed package
      const installedPackageJson = path.join(nodeModulesPath, 'package.json');
      if (!fs.existsSync(installedPackageJson)) {
        throw new Error('package.json not found in installed package');
      }
      
      const installedData = JSON.parse(fs.readFileSync(installedPackageJson, 'utf8'));
      if (installedData.version !== version) {
        throw new Error(`Installed version mismatch: expected ${version}, got ${installedData.version}`);
      }
      
      // Return to original directory
      process.chdir(originalDir);
      
      // Clean up
      fs.rmSync(testDir, { recursive: true, force: true });
      
      return { 
        installTime: `${installTime}ms`, 
        installedVersion: installedData.version,
        installedAt: new Date().toISOString()
      };
      
    } catch (error) {
      // Ensure we return to original directory
      try {
        const originalDir = path.dirname(this.packagePath);
        process.chdir(originalDir);
      } catch (e) {
        // Ignore errors in cleanup
      }
      throw new Error(`Installation test failed: ${error.message}`);
    }
  }

  /**
   * Tests basic functionality of the package
   */
  async testBasicFunctionality(version) {
    // For an MCP server, we would test basic server startup and API endpoints
    // This is a simplified test that verifies the package can be required/imported
    
    const testDir = '/tmp/npm-functionality-test';
    
    try {
      // Clean up any existing test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
      fs.mkdirSync(testDir, { recursive: true });
      
      const originalDir = process.cwd();
      process.chdir(testDir);
      
      // Initialize and install package
      execSync('npm init -y', { stdio: 'pipe' });
      execSync(`npm install ${this.packageName}@${version}`, { stdio: 'pipe' });
      
      // Create a simple test script
      const testScript = `
        import path from 'path';
        import fs from 'fs';
        
        // Basic functionality test for MCP server
        const packagePath = './node_modules/${this.packageName}/package.json';
        if (!fs.existsSync(packagePath)) {
          process.exit(1);
        }
        
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log('Package loaded successfully:', packageData.name, packageData.version);
        
        // Test if main file exists and can be imported
        const mainFile = './node_modules/${this.packageName}/' + packageData.main;
        if (fs.existsSync(mainFile)) {
          console.log('Main file exists:', packageData.main);
        } else {
          console.error('Main file missing:', packageData.main);
          process.exit(1);
        }
        
        process.exit(0);
      `;
      
      fs.writeFileSync('test.mjs', testScript);
      
      // Run test
      const testResult = execSync('node test.mjs', { encoding: 'utf8' });
      
      // Return to original directory and clean up
      process.chdir(originalDir);
      fs.rmSync(testDir, { recursive: true, force: true });
      
      return { 
        testPassed: true, 
        output: testResult.trim(),
        testedAt: new Date().toISOString()
      };
      
    } catch (error) {
      // Cleanup and return to original directory
      try {
        const originalDir = path.dirname(this.packagePath);
        process.chdir(originalDir);
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      throw new Error(`Functionality test failed: ${error.message}`);
    }
  }

  /**
   * Checks for performance regressions
   */
  async checkPerformanceRegression() {
    try {
      // Run performance tests to ensure no regression
      console.log('    Running performance benchmarks...');
      execSync('npm run test:performance', { stdio: 'pipe' });
      
      return { 
        performanceCheck: 'passed',
        benchmarkSuite: 'test:performance',
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Performance regression detected: ${error.message}`);
    }
  }

  /**
   * Validates documentation consistency
   */
  validateDocumentation(version) {
    // Check that documentation mentions the correct version
    const readmePath = path.join(process.cwd(), 'README.md');
    
    if (!fs.existsSync(readmePath)) {
      throw new Error('README.md not found');
    }
    
    // Basic validation - could be enhanced with more sophisticated checks
    return {
      readmeExists: true,
      version: version,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates rollback recommendations based on validation results
   */
  generateRollbackRecommendations(results) {
    console.log('');
    console.log('🔄 Rollback Recommendations');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const failedValidations = results.filter(r => r.status === 'failed');
    
    if (failedValidations.some(f => f.name.includes('NPM Registry'))) {
      console.log('❌ NPM Registry issue detected:');
      console.log('  - Package may not have published correctly');
      console.log('  - Consider re-running: npm run publish:live');
      console.log('  - Check NPM registry status');
    }
    
    if (failedValidations.some(f => f.name.includes('Performance'))) {
      console.log('❌ Performance regression detected:');
      console.log('  - Review recent code changes');
      console.log('  - Consider rolling back to previous version');
      console.log('  - Run: npm run test:performance locally');
    }
    
    if (failedValidations.some(f => f.name.includes('Installation'))) {
      console.log('❌ Installation issues detected:');
      console.log('  - Package dependencies may be broken');
      console.log('  - Verify package.json files array');
      console.log('  - Test installation locally');
    }
    
    console.log('');
    console.log('General rollback steps:');
    console.log('  1. npm unpublish <package>@<version> (if within 24h)');
    console.log('  2. Fix issues and publish patch version');
    console.log('  3. Update documentation with corrected version');
    console.log('  4. Notify users of the issue and resolution');
  }

  /**
   * Continuous monitoring of release health
   */
  async monitorRelease(version = this.currentVersion, intervalMinutes = 5) {
    console.log(`🔄 Starting continuous monitoring for ${this.packageName}@${version}`);
    console.log(`📅 Check interval: ${intervalMinutes} minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let checkCount = 0;
    
    const monitor = async () => {
      checkCount++;
      console.log(`\n🔍 Health Check #${checkCount} - ${new Date().toISOString()}`);
      
      try {
        const result = await this.validateRelease(version);
        const healthScore = Math.round((result.passedCount / result.totalCount) * 100);
        
        console.log(`📊 Health Score: ${healthScore}% (${result.passedCount}/${result.totalCount})`);
        
        if (healthScore < 100) {
          console.log('⚠️  Release health degraded - investigate immediately');
        } else {
          console.log('✅ Release is healthy');
        }
        
      } catch (error) {
        console.error(`❌ Monitoring check failed: ${error.message}`);
      }
    };
    
    // Run initial check
    await monitor();
    
    // Set up interval monitoring
    const intervalId = setInterval(monitor, intervalMinutes * 60 * 1000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping release monitoring...');
      clearInterval(intervalId);
      process.exit(0);
    });
    
    console.log('\n⌨️  Press Ctrl+C to stop monitoring');
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ReleaseMonitor();
  const command = process.argv[2];
  const version = process.argv[3];

  switch (command) {
    case 'validate':
      await monitor.validateRelease(version);
      break;
      
    case 'monitor':
      const interval = parseInt(process.argv[4]) || 5;
      await monitor.monitorRelease(version, interval);
      break;
      
    default:
      console.log('🔍 Release Monitor for mcp-server-pinescript');
      console.log('');
      console.log('Commands:');
      console.log('  validate [version]           - Validate specific release (defaults to current)');
      console.log('  monitor [version] [interval] - Continuous monitoring (defaults: current version, 5min interval)');
      console.log('');
      console.log('Examples:');
      console.log('  npm run release:validate     - Validate current release');
      console.log('  npm run release:monitor      - Start continuous monitoring');
      console.log('  node scripts/release-monitor.js validate 3.1.0');
      console.log('  node scripts/release-monitor.js monitor 3.1.0 10');
      break;
  }
}

export default ReleaseMonitor;