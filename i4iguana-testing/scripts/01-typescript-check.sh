#!/bin/bash

################################################################################
# TypeScript Syntax Validation
# Checks for TypeScript compilation errors before build
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Find TypeScript compiler
if command -v npx &> /dev/null && [ -f "package.json" ]; then
    TSC_CMD="npx tsc"
elif command -v tsc &> /dev/null; then
    TSC_CMD="tsc"
else
    echo -e "${RED}✗ TypeScript compiler not found${NC}"
    echo "  Install: npm install -g typescript"
    exit 1
fi

# Check if tsconfig.json exists
if [ ! -f "tsconfig.json" ]; then
    echo -e "${YELLOW}⚠ Warning: tsconfig.json not found${NC}"
    echo "  Creating basic tsconfig.json..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next", "out"]
}
EOF
fi

echo "Checking TypeScript compilation..."

# Run TypeScript compiler in no-emit mode
$TSC_CMD --noEmit 2>&1 | tee /tmp/tsc-output.log

# Check exit status
TSC_EXIT=${PIPESTATUS[0]}

if [ $TSC_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ No TypeScript errors found${NC}"
    rm -f /tmp/tsc-output.log
    exit 0
else
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.log || echo "0")
    echo ""
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    echo -e "${RED}  Found ${ERROR_COUNT} error(s)${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Check for missing type imports"
    echo "  2. Verify interface/type definitions match usage"
    echo "  3. Ensure all required props are passed to components"
    echo "  4. Check for typos in property names"
    rm -f /tmp/tsc-output.log
    exit 1
fi
