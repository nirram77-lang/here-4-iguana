#!/bin/bash

################################################################################
# Dependency Validation
# Verifies all required npm packages are installed
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "Checking package dependencies..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}✗ node_modules not found${NC}"
    echo "  Run: npm install"
    exit 1
fi

# Extract dependencies and devDependencies
ALL_DEPS=$(cat package.json | grep -A 9999 '"dependencies"' | grep -B 9999 '^  }' | grep '"' | cut -d'"' -f2 | grep -v "dependencies" | grep -v "^$")

# Core dependencies for I4IGUANA
CRITICAL_DEPS=(
    "next"
    "react"
    "react-dom"
    "firebase"
    "typescript"
)

echo "Verifying critical dependencies..."

for dep in "${CRITICAL_DEPS[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo -e "  ${GREEN}✓${NC} $dep"
    else
        echo -e "  ${RED}✗${NC} $dep - MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check for package-lock.json or yarn.lock
if [ ! -f "package-lock.json" ] && [ ! -f "yarn.lock" ]; then
    echo -e "${YELLOW}⚠ Warning: No lock file found${NC}"
    echo "  Consider running 'npm install' to generate package-lock.json"
fi

# Check for outdated critical security packages
echo ""
echo "Checking for security updates..."
if command -v npm &> /dev/null; then
    # Check for vulnerabilities
    AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo "{}")
    
    CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | cut -d':' -f2 || echo "0")
    HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | cut -d':' -f2 || echo "0")
    
    if [ "$CRITICAL_VULNS" != "0" ] || [ "$HIGH_VULNS" != "0" ]; then
        echo -e "${YELLOW}⚠ Security vulnerabilities found:${NC}"
        echo "  Critical: $CRITICAL_VULNS"
        echo "  High: $HIGH_VULNS"
        echo "  Run: npm audit fix"
    else
        echo -e "${GREEN}✓ No critical security issues${NC}"
    fi
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All dependencies are installed correctly${NC}"
    exit 0
else
    echo -e "${RED}✗ Missing ${ERRORS} critical dependency/dependencies${NC}"
    echo "  Run: npm install"
    exit 1
fi
