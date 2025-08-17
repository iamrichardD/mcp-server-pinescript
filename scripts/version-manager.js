#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Automated Version Management System for mcp-server-pinescript
 * 
 * Features:
 * - Semantic versioning (patch, minor, major)
 * - Cross-file synchronization (package.json, git tags)
 * - Pre-release quality validation
 * - Automated git tag creation
 * - Rollback capabilities
 */

class VersionManager {
  constructor() {
    this.packagePath = path.join(process.cwd(), 'package.json');
    this.packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    this.currentVersion = this.packageData.version;
  }

  /**
   * Validates current environment before version changes
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        throw new Error('Working directory is not clean. Please commit or stash changes.');
      }
    } catch (error) {
      throw new Error(`Git validation failed: ${error.message}`);
    }

    // Check if we're on main branch
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (currentBranch !== 'main') {
        console.warn(`⚠️  Warning: You're on branch '${currentBranch}', not 'main'`);
      }
    } catch (error) {
      console.warn('⚠️  Could not determine current git branch');
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Runs comprehensive pre-release quality gates
   */
  async runQualityGates() {
    console.log('🔬 Running quality gates...');
    
    const gates = [
      { name: 'TypeScript compilation', command: 'npm run build' },
      { name: 'Type checking', command: 'npm run type-check' },
      { name: 'Test suite (323 tests)', command: 'npm run test:run' }
    ];

    for (const gate of gates) {
      console.log(`  Running ${gate.name}...`);
      try {
        execSync(gate.command, { stdio: 'pipe' });
        console.log(`  ✅ ${gate.name} passed`);
      } catch (error) {
        throw new Error(`Quality gate failed: ${gate.name}\n${error.message}`);
      }
    }

    console.log('✅ All quality gates passed');
  }

  /**
   * Calculates new version based on bump type
   */
  calculateNewVersion(bumpType) {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    
    switch (bumpType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error(`Invalid bump type: ${bumpType}. Use: major, minor, or patch`);
    }
  }

  /**
   * Updates package.json with new version
   */
  updatePackageJson(newVersion) {
    console.log(`📝 Updating package.json: ${this.currentVersion} → ${newVersion}`);
    
    this.packageData.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(this.packageData, null, 2) + '\n');
    
    console.log('✅ package.json updated');
  }

  /**
   * Creates git commit and tag for new version
   */
  createGitRelease(newVersion) {
    console.log(`🏷️  Creating git release for v${newVersion}...`);
    
    try {
      // Add package.json changes
      execSync('git add package.json');
      
      // Create commit
      const commitMessage = `chore: bump version to ${newVersion}\n\n🤖 Generated with automated version management\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
      execSync(`git commit -m "${commitMessage}"`);
      
      // Create tag
      execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
      
      console.log(`✅ Git release created: v${newVersion}`);
    } catch (error) {
      throw new Error(`Git release creation failed: ${error.message}`);
    }
  }

  /**
   * Rollback changes in case of failure
   */
  rollback() {
    console.log('🔄 Rolling back changes...');
    
    try {
      // Reset package.json
      execSync('git checkout HEAD -- package.json');
      
      // Remove any uncommitted changes
      execSync('git reset --hard HEAD');
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
    }
  }

  /**
   * Main version bump workflow
   */
  async bumpVersion(bumpType) {
    const newVersion = this.calculateNewVersion(bumpType);
    
    console.log(`🚀 Starting version bump: ${this.currentVersion} → ${newVersion}`);
    console.log(`📦 Package: ${this.packageData.name}`);
    console.log('');

    try {
      await this.validateEnvironment();
      await this.runQualityGates();
      
      this.updatePackageJson(newVersion);
      this.createGitRelease(newVersion);
      
      console.log('');
      console.log(`🎉 Version bump completed successfully!`);
      console.log(`📦 New version: ${newVersion}`);
      console.log(`🏷️  Git tag: v${newVersion}`);
      console.log('');
      console.log('Next steps:');
      console.log('  git push origin main');
      console.log('  git push origin --tags');
      console.log('  npm publish');
      
    } catch (error) {
      console.error(`❌ Version bump failed: ${error.message}`);
      this.rollback();
      process.exit(1);
    }
  }

  /**
   * Validates that current version matches git tag
   */
  validateVersionSync() {
    console.log('🔍 Checking version synchronization...');
    
    try {
      const gitTags = execSync('git tag --list', { encoding: 'utf8' });
      const expectedTag = `v${this.currentVersion}`;
      
      if (gitTags.includes(expectedTag)) {
        console.log(`✅ Version ${this.currentVersion} is synchronized with git tag ${expectedTag}`);
      } else {
        console.warn(`⚠️  Warning: Version ${this.currentVersion} does not have corresponding git tag`);
      }
      
    } catch (error) {
      console.error(`❌ Version sync check failed: ${error.message}`);
    }
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new VersionManager();
  const command = process.argv[2];
  const bumpType = process.argv[3];

  switch (command) {
    case 'bump':
      if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
        console.error('Usage: node scripts/version-manager.js bump <major|minor|patch>');
        process.exit(1);
      }
      await manager.bumpVersion(bumpType);
      break;
      
    case 'check':
      manager.validateVersionSync();
      break;
      
    case 'validate':
      try {
        await manager.validateEnvironment();
        await manager.runQualityGates();
        console.log('🎉 All validations passed - ready for release!');
      } catch (error) {
        console.error(`❌ Validation failed: ${error.message}`);
        process.exit(1);
      }
      break;
      
    default:
      console.log('🔧 Version Manager for mcp-server-pinescript');
      console.log('');
      console.log('Commands:');
      console.log('  bump <major|minor|patch>  - Bump version with full quality validation');
      console.log('  check                     - Check version synchronization');
      console.log('  validate                  - Run quality gates without version change');
      console.log('');
      console.log('Examples:');
      console.log('  npm run version:patch     - Bump patch version (3.1.0 → 3.1.1)');
      console.log('  npm run version:minor     - Bump minor version (3.1.0 → 3.2.0)');
      console.log('  npm run version:major     - Bump major version (3.1.0 → 4.0.0)');
      break;
  }
}

export default VersionManager;