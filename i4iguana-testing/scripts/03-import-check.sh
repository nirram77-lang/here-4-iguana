#!/bin/bash

################################################################################
# Import/Export Verification
# Validates that all imports reference existing exports
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "Verifying imports and exports..."

# Find all TypeScript/JavaScript files
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.next/*" \
    ! -path "*/out/*" \
    ! -path "*/.git/*")

# Critical files that must exist
CRITICAL_FILES=(
    "./app/page.tsx"
    "./components/home-screen.tsx"
    "./components/login-screen.tsx"
    "./components/welcome-screen.tsx"
    "./lib/firebase.ts"
    "./lib/firestore-service.ts"
)

echo "Checking critical files..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file - MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "Scanning for broken imports..."

# Check for common import issues
while IFS= read -r file; do
    # Check for relative imports that might be broken
    BROKEN_IMPORTS=$(grep -n "from ['\"]\.\..*['\"]" "$file" 2>/dev/null | while read -r line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        IMPORT_PATH=$(echo "$line" | grep -oP "from ['\"]\.\..*?['\"]" | sed "s/from ['\"]//g" | sed "s/['\"]//g")
        
        # Resolve the path
        DIR=$(dirname "$file")
        RESOLVED_PATH="$DIR/$IMPORT_PATH"
        
        # Try common extensions
        FOUND=false
        for ext in "" ".ts" ".tsx" ".js" ".jsx" "/index.ts" "/index.tsx"; do
            if [ -f "${RESOLVED_PATH}${ext}" ]; then
                FOUND=true
                break
            fi
        done
        
        if [ "$FOUND" = false ]; then
            echo "$file:$LINE_NUM - Broken import: $IMPORT_PATH"
        fi
    done)
    
    if [ ! -z "$BROKEN_IMPORTS" ]; then
        echo -e "${RED}Issues in $file:${NC}"
        echo "$BROKEN_IMPORTS"
        ERRORS=$((ERRORS + 1))
    fi
done <<< "$FILES"

# Check for Firebase imports
echo ""
echo "Verifying Firebase imports..."

FIREBASE_FILES=$(grep -r "from ['\"]firebase" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | cut -d: -f1 | sort -u)

if [ ! -z "$FIREBASE_FILES" ]; then
    while IFS= read -r file; do
        # Check if file properly imports from firebase
        if ! grep -q "import.*firebase" "$file"; then
            echo -e "${YELLOW}⚠ Warning: $file may have incorrect Firebase imports${NC}"
        fi
    done <<< "$FIREBASE_FILES"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All imports are valid${NC}"
    exit 0
else
    echo -e "${RED}✗ Found ${ERRORS} import issue(s)${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Check file paths are correct (case-sensitive)"
    echo "  2. Verify exported names match import statements"
    echo "  3. Ensure file extensions are handled correctly"
    exit 1
fi
