# Version Synchronization Strategy

## 🚨 Current Issue Analysis

**Problem Identified**: Critical version mismatch across project versioning systems
- **package.json**: v2.0.0  
- **Latest git tag**: v3.1.0
- **Impact**: Inconsistent version references, deployment confusion, release tracking failures

## 🎯 Comprehensive Version Management Framework

### Single Source of Truth: package.json
All version references must derive from `package.json` version field as the authoritative source.

### Version Sync Points
1. **package.json** - Primary version source
2. **Git tags** - Release markers (prefixed with 'v')
3. **index.js** - MCP server version declaration
4. **Documentation** - README, CHANGELOG version references
5. **CI/CD** - Build and deployment version metadata

## 🔧 Immediate Sync Resolution

### Step 1: Audit Current Version State
```bash
# Check current versions across all sources
echo "=== VERSION AUDIT ==="
echo "package.json: $(jq -r '.version' package.json)"
echo "Git tags: $(git tag --list --sort=-version:refname | head -3)"
echo "MCP server: $(grep -n 'version:' index.js | head -1)"
echo "README references: $(grep -n 'v[0-9]\+\.[0-9]\+\.[0-9]\+' README.md | head -3)"
```

### Step 2: Determine Correct Version
Based on git tag v3.1.0 being most recent and representing the Style Guide Processing Enhancement milestone:

**Target Version: v3.1.0**

### Step 3: Synchronize All Version References
```bash
# Update package.json to match latest functional release
npm version 3.1.0 --no-git-tag-version

# Verify index.js version matches
grep -n "version:" index.js
# Should show: version: '3.1.0'

# Update any documentation references
sed -i 's/v2\.0\.0/v3.1.0/g' README.md
sed -i 's/version 2\.0\.0/version 3.1.0/g' *.md
```

## 🚀 Automated Version Management System

### Version Update Script
Create `scripts/sync-versions.js`:

```javascript
#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';

async function syncVersions() {
  // 1. Read authoritative version from package.json
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const version = packageJson.version;
  
  console.log(`🎯 Syncing to version: ${version}`);
  
  // 2. Update index.js MCP server version
  let indexContent = await readFile('index.js', 'utf8');
  indexContent = indexContent.replace(
    /version: '[0-9]+\.[0-9]+\.[0-9]+'/,
    `version: '${version}'`
  );
  await writeFile('index.js', indexContent);
  console.log('✅ Updated index.js');
  
  // 3. Verify git tag exists for current version
  try {
    execSync(`git tag -l v${version}`, { stdio: 'pipe' });
    console.log(`✅ Git tag v${version} exists`);
  } catch {
    console.log(`⚠️  Git tag v${version} missing - create with: git tag v${version}`);
  }
  
  // 4. Update documentation references
  const files = ['README.md', 'USER-GUIDE.md', 'CHANGELOG.md'];
  for (const file of files) {
    try {
      let content = await readFile(file, 'utf8');
      const updated = content.replace(/v[0-9]+\.[0-9]+\.[0-9]+/g, `v${version}`);
      if (content !== updated) {
        await writeFile(file, updated);
        console.log(`✅ Updated ${file}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not update ${file}: ${error.message}`);
    }
  }
  
  console.log('🎉 Version sync complete!');
}

syncVersions().catch(console.error);
```

### Package.json Scripts Integration
```json
{
  "scripts": {
    "version:sync": "node scripts/sync-versions.js",
    "version:check": "node scripts/check-version-consistency.js",
    "release:patch": "npm version patch && npm run version:sync && git add . && git commit -m 'chore: sync versions' && git tag v$(node -p 'require(\"./package.json\").version')",
    "release:minor": "npm version minor && npm run version:sync && git add . && git commit -m 'chore: sync versions' && git tag v$(node -p 'require(\"./package.json\").version')",
    "release:major": "npm version major && npm run version:sync && git add . && git commit -m 'chore: sync versions' && git tag v$(node -p 'require(\"./package.json\").version')"
  }
}
```

## 🔄 Release Workflow

### Semantic Versioning Strategy
- **MAJOR (x.0.0)**: Breaking changes, API incompatibility
- **MINOR (x.y.0)**: New features, backward compatible
- **PATCH (x.y.z)**: Bug fixes, performance improvements

### Release Process
```bash
# 1. Determine release type based on changes
# For new features (Style Guide Enhancement = MINOR):
npm run release:minor

# 2. Automated workflow will:
#    - Update package.json version
#    - Sync all version references  
#    - Create git commit
#    - Create git tag
#    - Push to remote

# 3. Verify version consistency
npm run version:check
```

## 📋 Version Consistency Checker

Create `scripts/check-version-consistency.js`:

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { execSync } from 'child_process';

async function checkVersionConsistency() {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const packageVersion = packageJson.version;
  
  console.log(`📦 Package.json version: ${packageVersion}`);
  
  // Check index.js
  const indexContent = await readFile('index.js', 'utf8');
  const indexMatch = indexContent.match(/version: '([0-9]+\.[0-9]+\.[0-9]+)'/);
  const indexVersion = indexMatch ? indexMatch[1] : 'NOT FOUND';
  
  console.log(`🔧 Index.js version: ${indexVersion}`);
  
  // Check latest git tag
  try {
    const latestTag = execSync('git tag --list --sort=-version:refname | head -1', { encoding: 'utf8' }).trim();
    console.log(`🏷️  Latest git tag: ${latestTag}`);
    
    // Check if package version has corresponding tag
    const expectedTag = `v${packageVersion}`;
    const tagExists = execSync(`git tag -l ${expectedTag}`, { encoding: 'utf8' }).trim();
    console.log(`🎯 Expected tag ${expectedTag}: ${tagExists ? 'EXISTS' : 'MISSING'}`);
  } catch (error) {
    console.log('⚠️  Could not check git tags');
  }
  
  // Version consistency analysis
  const allVersionsMatch = indexVersion === packageVersion;
  
  console.log('\n=== VERSION CONSISTENCY REPORT ===');
  console.log(`✅ All versions synced: ${allVersionsMatch ? 'YES' : 'NO'}`);
  
  if (!allVersionsMatch) {
    console.log('\n🚨 ACTION REQUIRED:');
    console.log('Run: npm run version:sync');
  }
  
  return allVersionsMatch;
}

checkVersionConsistency().catch(console.error);
```

## 🎯 Implementation Priority

### Immediate Actions (Next 30 minutes)
1. **Fix Current Mismatch**: Update package.json to v3.1.0
2. **Sync index.js**: Ensure MCP server version matches
3. **Verify Git Tag**: Confirm v3.1.0 tag exists and is correct
4. **Documentation Update**: Fix any version references in README

### Short-term Setup (Next session)
1. **Create Sync Scripts**: Implement automated version management
2. **Update Package Scripts**: Add version management commands  
3. **Test Workflow**: Verify release process works correctly
4. **Documentation**: Update version management in contributor guidelines

### Long-term Maintenance
1. **CI/CD Integration**: Automated version checking in builds
2. **Release Automation**: GitHub Actions for automated releases
3. **Version Monitoring**: Alerts for version inconsistencies
4. **Contributor Training**: Guidelines for proper version management

## 🛡️ Prevention Strategies

### Pre-commit Hooks
```bash
# Add version consistency check to pre-commit
#!/bin/bash
npm run version:check || {
  echo "❌ Version inconsistency detected!"
  echo "Run: npm run version:sync"
  exit 1
}
```

### CI/CD Version Validation
```yaml
# .github/workflows/version-check.yml
name: Version Consistency
on: [push, pull_request]
jobs:
  version-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run version:check
```

### Release Automation
```yaml
# .github/workflows/release.yml  
name: Automated Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Verify version consistency
        run: npm run version:check
      - name: Create GitHub Release
        uses: actions/create-release@v1
```

This comprehensive version synchronization strategy ensures all version references remain consistent while providing automated tools for maintenance and validation.