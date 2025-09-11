# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.13] - 2025-09-11

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.12] - 2025-09-11

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.11] - 2025-09-10

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.10] - 2025-09-09

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.9] - 2025-09-09

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.8] - 2025-09-08

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.7] - 2025-09-08

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.6] - 2025-09-07

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.5] - 2025-09-07

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.4] - 2025-09-07

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.3] - 2025-08-25

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.2] - 2025-08-22

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.1] - 2025-08-19

### Fixed
- Automated patch version bump with validation enhancements

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [3.3.0] - 2025-08-19

### Added
- Implement enterprise-grade automation with git hooks and validation enhancements
- Add comprehensive git hooks automation system (.githooks/ directory)
- Implement pre-commit validation: build, test, lint, version bump, changelog
- Add post-commit automatic git tagging
- Create session type management system for semantic versioning
- Add CHANGELOG.md automation to prevent sync issues
- Clean up unused JavaScript automation scripts (1,348 lines removed)
- Enhance Pine Script validation with new comprehensive rules
- Update documentation with git hooks setup and workflow
- Maintain backward compatibility for all MCP interfaces

🤖 Generated with automated version management

Co-Authored-By: Claude <noreply@anthropic.com>

---

## [2.0.0] - 2025-07-28

### ⚠️ BREAKING CHANGES
- **File Structure**: Replaced `functions.json` and `language.json` with single `language-reference.json`
- **Data Format**: MCP server now loads consolidated language reference instead of separate files
- **API Changes**: Internal preloading mechanism restructured to use unified data structure

### Added
- **Complete Pine Script Coverage**: 457 functions + 427 variables/constants/keywords/types/operators/annotations
- **Manual HTML Parser**: Custom parser for Pine Script® language reference manual bypassing Firecrawl limitations
- **Semantic Categorization**: Proper categorization of language elements with metadata
- **Enhanced Statistics**: Detailed breakdown of language element categories in server startup
- **Consolidated Scripts**: New `create-language-reference.js` and enhanced `parse-html-reference.js`

### Fixed
- **Parameter Naming**: Confirmed correct snake_case naming (`text_color`, `default_qty_type`)
- **Function Signatures**: 100% accurate function signatures from official language manual
- **JavaScript Rendering Issues**: Manual HTML parsing eliminates Firecrawl JavaScript dependency problems
- **Documentation Quality**: Eliminated 404 errors and incomplete function data

### Changed
- **Memory Usage**: Improved efficiency with single file loading (15MB total)
- **Performance**: Faster server startup and response times
- **File Organization**: Cleaner structure with single authoritative reference file
- **Documentation**: Updated README, MAINTAINER, USER-GUIDE, and QUALITY-ANALYSIS to reflect new structure

### Removed
- `functions.json` (incomplete Firecrawl data)
- `language.json` (empty/error content)
- `functions-from-html.json` (consolidated)
- `variables-from-html.json` (consolidated)

### Migration Guide
For users upgrading from v1.x:
1. The MCP server will automatically use the new `language-reference.json` file
2. No client-side changes required - the MCP protocol interface remains the same
3. Verify `docs/processed/` contains: `index.json`, `language-reference.json`, `style-rules.json`

---

## [1.3.0] - 2025-07-27

### Added
- Enhanced documentation quality validation
- Systematic fixes for Firecrawl scraping issues
- Manual HTML parsing capability for JavaScript-dependent pages

### Fixed
- Removed invalid URLs from scraping configuration
- Added quality validation to detect error pages
- Enhanced processing to skip invalid content

---

## [1.2.0] - Previous Release
### Added
- Pine Script function signature extraction
- Parameter name validation for table.cell function

---

## [1.1.2] - Previous Release
### Fixed
- Updated documentation with correct CLI usage

---

## [1.1.1] - Previous Release  
### Fixed
- npm install from GitHub repository

---

## [1.1.0] - Previous Release
### Added
- Enhanced documentation with CLI integration examples

---

## [1.0.0] - Initial Release
### Added
- Initial implementation of PineScript MCP Documentation Server