#!/bin/bash

# Build Process Automation with Verification
# Comprehensive build automation for MCP PineScript Server deployment

set -euo pipefail

echo "🔧 MCP PineScript Server - Build Automation"
echo "============================================"

# Configuration
BUILD_DIR="./dist"
BACKUP_DIR="./dist.backup"
LOG_FILE="./build.log"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "ERROR: $1" >> "$LOG_FILE"
}

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
    echo "STEP: $1" >> "$LOG_FILE"
}

# Initialize logging
setup_logging() {
    echo "Build Automation Log - $TIMESTAMP" > "$LOG_FILE"
    echo "=================================" >> "$LOG_FILE"
    log_info "Build automation started at $TIMESTAMP"
}

# Pre-build cleanup and validation
pre_build_setup() {
    log_step "Pre-build setup and validation"
    
    # Create backup of existing build if it exists
    if [ -d "$BUILD_DIR" ]; then
        log_info "Creating backup of existing build..."
        if [ -d "$BACKUP_DIR" ]; then
            rm -rf "$BACKUP_DIR"
        fi
        mv "$BUILD_DIR" "$BACKUP_DIR"
        log_success "Backup created: $BACKUP_DIR"
    fi
    
    # Validate source files exist
    if [ ! -f "index.ts" ]; then
        log_error "Main TypeScript file 'index.ts' not found"
        return 1
    fi
    
    if [ ! -d "src" ]; then
        log_error "Source directory 'src' not found"
        return 1
    fi
    
    log_success "Pre-build validation completed"
}

# TypeScript compilation with detailed error handling
run_typescript_compilation() {
    log_step "Running TypeScript compilation"
    
    # Check if TypeScript is available
    if ! command -v tsc &> /dev/null; then
        log_error "TypeScript compiler not found. Run 'npm install' first"
        return 1
    fi
    
    # Run compilation with detailed output
    log_info "Starting TypeScript compilation..."
    
    if ! npx tsc 2>&1 | tee -a "$LOG_FILE"; then
        log_error "TypeScript compilation failed"
        
        # Show specific error information
        if [ -f "$BUILD_DIR/index.js" ]; then
            log_warning "Partial compilation may have occurred"
        fi
        
        # Restore backup if available
        if [ -d "$BACKUP_DIR" ]; then
            log_info "Restoring previous build from backup..."
            rm -rf "$BUILD_DIR" 2>/dev/null || true
            mv "$BACKUP_DIR" "$BUILD_DIR"
            log_success "Previous build restored"
        fi
        
        return 1
    fi
    
    log_success "TypeScript compilation completed successfully"
}

# Fix import path issues by copying compiled JS files to source
fix_import_paths() {
    log_step "Fixing import path issues"
    
    # Copy compiled JS files to source directories to resolve import issues
    log_info "Copying compiled files to source directories..."
    
    # Copy version tool
    if [ -f "$BUILD_DIR/src/version/mcp-version-tool.js" ] && [ ! -f "src/version/mcp-version-tool.js" ]; then
        cp "$BUILD_DIR/src/version/mcp-version-tool.js" "src/version/"
        log_success "Version tool copied to source directory"
    fi
    
    # Copy parser files if needed
    if [ -f "$BUILD_DIR/src/parser/validator.js" ] && [ ! -f "src/parser/validator.js.backup" ]; then
        # Create backup of original if it exists
        if [ -f "src/parser/validator.js" ]; then
            cp "src/parser/validator.js" "src/parser/validator.js.backup"
        fi
        cp "$BUILD_DIR/src/parser/validator.js" "src/parser/"
        log_success "Parser validator synchronized"
    fi
    
    log_success "Import path issues fixed"
}

# Verify build output structure
verify_build_output() {
    log_step "Verifying build output structure"
    
    # Check if build directory was created
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory '$BUILD_DIR' was not created"
        return 1
    fi
    
    # Check critical files
    CRITICAL_FILES=(
        "$BUILD_DIR/index.js"
        "$BUILD_DIR/index.d.ts"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Critical build file missing: $file"
            return 1
        fi
        
        # Check file is not empty
        if [ ! -s "$file" ]; then
            log_error "Critical build file is empty: $file"
            return 1
        fi
        
        log_success "Build file validated: $file ($(wc -c < "$file") bytes)"
    done
    
    # Verify source structure was preserved
    if [ -d "src" ] && [ ! -d "$BUILD_DIR/src" ]; then
        log_error "Source directory structure not preserved in build"
        return 1
    fi
    
    log_success "Build output structure verified"
}

# Validate JavaScript imports and syntax
verify_javascript_validity() {
    log_step "Validating JavaScript imports and syntax"
    
    # Test syntax validity
    log_info "Checking JavaScript syntax..."
    if ! node --check "$BUILD_DIR/index.js" 2>&1 | tee -a "$LOG_FILE"; then
        log_error "JavaScript syntax validation failed"
        return 1
    fi
    
    # Test ES module import capability
    log_info "Testing ES module import capability..."
    if ! timeout 15s node -e "
        import('$BUILD_DIR/index.js').then(() => {
            console.log('ES module import test passed');
            process.exit(0);
        }).catch(err => {
            console.error('ES module import test failed:', err.message);
            process.exit(1);
        });
    " 2>&1 | tee -a "$LOG_FILE"; then
        log_error "ES module import test failed"
        return 1
    fi
    
    log_success "JavaScript validation completed"
}

# Performance and size analysis
analyze_build_performance() {
    log_step "Analyzing build performance and size"
    
    # Calculate build size
    if command -v du &> /dev/null; then
        BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
        log_info "Build size: $BUILD_SIZE"
    fi
    
    # Count files
    FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
    log_info "Files generated: $FILE_COUNT"
    
    # Show largest files
    log_info "Largest build files:"
    find "$BUILD_DIR" -type f -exec ls -lah {} \; | sort -k5 -hr | head -5 | while read line; do
        log_info "  $line"
    done
    
    log_success "Build performance analysis completed"
}

# Run comprehensive build verification
run_build_verification() {
    log_step "Running comprehensive build verification"
    
    # Test server initialization
    log_info "Testing server initialization..."
    if ! timeout 10s node -e "
        console.log('Starting server initialization test...');
        import('$BUILD_DIR/index.js').then(() => {
            setTimeout(() => {
                console.log('Server initialization test completed successfully');
                process.exit(0);
            }, 3000);
        }).catch(err => {
            console.error('Server initialization failed:', err.message);
            process.exit(1);
        });
    " 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Server initialization test failed"
        return 1
    fi
    
    log_success "Build verification completed"
}

# Copy root level files needed for deployment
prepare_deployment_files() {
    log_step "Preparing deployment files"
    
    # Copy main index.js to root for deployment
    if [ -f "$BUILD_DIR/index.js" ]; then
        log_info "Copying main entry point to root..."
        cp "$BUILD_DIR/index.js" "./index.js"
        log_success "Main entry point copied to root"
    fi
    
    # Ensure critical deployment files exist
    DEPLOYMENT_FILES=(
        "README.md"
        "package.json"
        "CHANGELOG.md"
    )
    
    for file in "${DEPLOYMENT_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "Deployment file missing: $file"
        else
            log_success "Deployment file present: $file"
        fi
    done
    
    log_success "Deployment files prepared"
}

# Cleanup and finalization
cleanup_build_artifacts() {
    log_step "Cleaning up build artifacts"
    
    # Remove backup if build was successful
    if [ -d "$BACKUP_DIR" ]; then
        log_info "Removing backup directory..."
        rm -rf "$BACKUP_DIR"
        log_success "Backup directory removed"
    fi
    
    # Clean up temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    
    log_success "Build artifacts cleaned up"
}

# Generate build report
generate_build_report() {
    log_step "Generating build report"
    
    REPORT_FILE="build-report-$TIMESTAMP.md"
    
    cat > "$REPORT_FILE" << EOF
# Build Report - $TIMESTAMP

## Build Status: ✅ SUCCESS

## Summary
- **Build Started**: $TIMESTAMP
- **TypeScript Compilation**: ✅ Successful
- **Import Path Resolution**: ✅ Fixed
- **Import Validation**: ✅ Passed
- **Server Initialization**: ✅ Tested
- **Deployment Preparation**: ✅ Complete

## Build Output
- **Build Directory**: $BUILD_DIR
- **Main Entry Point**: index.js (copied to root)
- **Files Generated**: $FILE_COUNT

## Validation Results
- JavaScript Syntax: ✅ Valid
- ES Module Imports: ✅ Functional
- Server Startup: ✅ Successful

## Deployment Instructions
1. Use \`node index.js\` as the main command
2. Ensure all dependencies are installed with \`npm install\`
3. Run \`npm run deploy:validate\` for final deployment checks

## Log File
Full build log available at: $LOG_FILE

---
Generated by MCP PineScript Server Build Automation
EOF
    
    log_success "Build report generated: $REPORT_FILE"
}

# Handle build failure
handle_build_failure() {
    log_error "Build process failed!"
    
    # Restore backup if available
    if [ -d "$BACKUP_DIR" ]; then
        log_info "Restoring previous build from backup..."
        rm -rf "$BUILD_DIR" 2>/dev/null || true
        mv "$BACKUP_DIR" "$BUILD_DIR"
        log_success "Previous build restored"
    fi
    
    # Generate failure report
    FAILURE_REPORT="build-failure-$TIMESTAMP.md"
    cat > "$FAILURE_REPORT" << EOF
# Build Failure Report - $TIMESTAMP

## Build Status: ❌ FAILED

## Error Information
Please check the build log for detailed error information: $LOG_FILE

## Troubleshooting Steps
1. Ensure all dependencies are installed: \`npm install\`
2. Check TypeScript configuration: \`npm run type-check\`
3. Verify source files are present and valid
4. Run \`npm run lint\` to check for code issues

## Recovery
Previous build has been restored from backup (if available).

---
Generated by MCP PineScript Server Build Automation
EOF
    
    log_error "Failure report generated: $FAILURE_REPORT"
    exit 1
}

# Main build automation sequence
main() {
    setup_logging
    
    echo ""
    log_info "Starting comprehensive build automation..."
    echo ""
    
    # Set up error handling
    trap handle_build_failure ERR
    
    # Execute build sequence
    pre_build_setup
    run_typescript_compilation
    fix_import_paths
    verify_build_output
    verify_javascript_validity
    prepare_deployment_files
    analyze_build_performance
    run_build_verification
    cleanup_build_artifacts
    generate_build_report
    
    echo ""
    log_success "🎉 Build automation completed successfully!"
    echo ""
    log_info "Build Status: COMPLETE ✅"
    log_info "Entry Point: index.js (ready for deployment)"
    log_info "Next Step: Run 'npm run deploy:validate' for deployment validation"
    echo ""
}

# Run main function
main "$@"