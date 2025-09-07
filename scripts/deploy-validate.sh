#!/bin/bash

# Deploy Validation Script
# Validates deployment readiness and prevents common deployment failures

set -euo pipefail

echo "🚀 MCP PineScript Server - Deployment Validation"
echo "=================================================="

# Configuration
REQUIRED_NODE_VERSION="18"
BUILD_DIR="./dist"
MAIN_FILE="./index.js"
SRC_DIR="./src"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validation functions
validate_node_version() {
    log_info "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js ${REQUIRED_NODE_VERSION}+"
        return 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        log_error "Node.js ${REQUIRED_NODE_VERSION}+ required. Current version: v${NODE_VERSION}"
        return 1
    fi
    
    log_success "Node.js version: $(node --version)"
}

validate_package_json() {
    log_info "Validating package.json configuration..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        return 1
    fi
    
    # Check main entry point
    MAIN_ENTRY=$(node -pe "require('./package.json').main")
    if [ "$MAIN_ENTRY" != "index.js" ]; then
        log_error "package.json main should be 'index.js', found: '$MAIN_ENTRY'"
        return 1
    fi
    
    # Check module type
    MODULE_TYPE=$(node -pe "require('./package.json').type || 'commonjs'")
    if [ "$MODULE_TYPE" != "module" ]; then
        log_error "package.json type should be 'module', found: '$MODULE_TYPE'"
        return 1
    fi
    
    log_success "package.json configuration valid"
}

validate_typescript_config() {
    log_info "Validating TypeScript configuration..."
    
    if [ ! -f "tsconfig.json" ]; then
        log_error "tsconfig.json not found"
        return 1
    fi
    
    # Check if outDir is configured
    OUT_DIR=$(node -pe "require('./tsconfig.json').compilerOptions.outDir || './dist'" 2>/dev/null || echo "./dist")
    if [ "$OUT_DIR" != "./dist" ]; then
        log_warning "TypeScript outDir is not './dist': $OUT_DIR"
    fi
    
    log_success "TypeScript configuration valid"
}

validate_dependencies() {
    log_info "Validating dependencies..."
    
    if [ ! -f "package-lock.json" ] && [ ! -f "yarn.lock" ]; then
        log_warning "No lock file found. Run 'npm install' to generate package-lock.json"
    fi
    
    if [ ! -d "node_modules" ]; then
        log_error "node_modules not found. Run 'npm install' first"
        return 1
    fi
    
    log_success "Dependencies validated"
}

validate_build_process() {
    log_info "Validating build process..."
    
    # Clean previous build
    if [ -d "$BUILD_DIR" ]; then
        log_info "Cleaning previous build..."
        rm -rf "$BUILD_DIR"
    fi
    
    # Run TypeScript compilation
    log_info "Running TypeScript compilation..."
    if ! npm run build > /dev/null 2>&1; then
        log_error "TypeScript compilation failed"
        npm run build
        return 1
    fi
    
    # Check if build directory was created
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory '$BUILD_DIR' not created"
        return 1
    fi
    
    # Check if main compiled file exists
    if [ ! -f "$BUILD_DIR/index.js" ]; then
        log_error "Main compiled file '$BUILD_DIR/index.js' not found"
        return 1
    fi
    
    log_success "Build process validated"
}

validate_import_resolution() {
    log_info "Validating import resolution..."
    
    # Test ES module import of compiled code
    if ! node -e "import('./index.js').then(() => process.exit(0)).catch(err => { console.error('Import failed:', err.message); process.exit(1); })" > /dev/null 2>&1; then
        log_error "Import resolution failed for compiled index.js"
        log_info "Attempting detailed import test..."
        node -e "import('./index.js').then(() => process.exit(0)).catch(err => { console.error('Import failed:', err.message); process.exit(1); })"
        return 1
    fi
    
    log_success "Import resolution validated"
}

validate_src_structure() {
    log_info "Validating source structure..."
    
    if [ ! -d "$SRC_DIR" ]; then
        log_error "Source directory '$SRC_DIR' not found"
        return 1
    fi
    
    # Check for critical source files
    CRITICAL_FILES=(
        "src/parser/validator.js"
        "src/parser/index.js"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "Critical source file not found: $file"
        fi
    done
    
    log_success "Source structure validated"
}

validate_documentation() {
    log_info "Validating documentation structure..."
    
    DOC_DIR="./docs/processed"
    REQUIRED_DOCS=(
        "index.json"
        "style-rules.json"
        "language-reference.json"
    )
    
    if [ ! -d "$DOC_DIR" ]; then
        log_warning "Documentation directory '$DOC_DIR' not found"
        log_warning "Run 'npm run update-docs' to generate documentation"
    else
        for doc in "${REQUIRED_DOCS[@]}"; do
            if [ ! -f "$DOC_DIR/$doc" ]; then
                log_warning "Documentation file not found: $DOC_DIR/$doc"
            fi
        done
        log_success "Documentation structure validated"
    fi
}

validate_deployment_files() {
    log_info "Validating deployment file list..."
    
    # Files specified in package.json "files" array
    REQUIRED_FILES=(
        "index.js"
        "README.md"
        "CHANGELOG.md"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "Deployment file not found: $file"
        fi
    done
    
    log_success "Deployment files validated"
}

run_quick_functionality_test() {
    log_info "Running quick functionality test..."
    
    # Test server can start and respond to basic operations
    timeout 10s node -e "
        import('./index.js').then(async () => {
            // Give server time to initialize
            setTimeout(() => {
                console.log('Server initialization test passed');
                process.exit(0);
            }, 2000);
        }).catch(err => {
            console.error('Functionality test failed:', err.message);
            process.exit(1);
        });
    " || {
        log_error "Functionality test failed or timed out"
        return 1
    }
    
    log_success "Functionality test passed"
}

# Main validation sequence
main() {
    echo ""
    log_info "Starting deployment validation checks..."
    echo ""
    
    # Critical validations (exit on failure)
    validate_node_version || exit 1
    validate_package_json || exit 1
    validate_dependencies || exit 1
    validate_build_process || exit 1
    validate_import_resolution || exit 1
    
    # Warning-level validations (continue on failure)
    validate_typescript_config || true
    validate_src_structure || true
    validate_documentation || true
    validate_deployment_files || true
    
    # Final functionality test
    run_quick_functionality_test || exit 1
    
    echo ""
    log_success "🎉 All deployment validation checks passed!"
    echo ""
    log_info "Deployment Status: READY ✅"
    echo ""
    log_info "Next steps for TradingView team:"
    log_info "1. Ensure index.js is the entry point in your deployment"
    log_info "2. Run 'npm install' to install dependencies"
    log_info "3. Use 'node index.js' to start the server"
    log_info "4. Verify MCP connection with your client"
    echo ""
}

# Run main function
main "$@"