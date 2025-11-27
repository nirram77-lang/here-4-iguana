#!/bin/bash

################################################################################
# Circular Dependency Detection
# Identifies circular imports that cause build failures
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TEMP_DIR="/tmp/circular-deps-$$"
mkdir -p "$TEMP_DIR"

echo "Analyzing import graph for circular dependencies..."

# Build dependency map
declare -A IMPORTS

# Find all source files
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.next/*" \
    ! -path "*/out/*")

# Parse imports for each file
while IFS= read -r file; do
    IMPORTS[$file]=$(grep -E "^import.*from ['\"](\.|\.\.)" "$file" 2>/dev/null | \
        sed -E "s/.*from ['\"](.*)['\"].*/\1/" | \
        while read -r import; do
            # Resolve relative path
            DIR=$(dirname "$file")
            
            # Handle different import styles
            if [[ "$import" =~ ^\. ]]; then
                # Relative import
                RESOLVED="$DIR/$import"
                # Normalize path
                RESOLVED=$(echo "$RESOLVED" | sed 's#/\./#/#g' | sed 's#/[^/]*/\.\./#/#g')
                
                # Try different extensions
                for ext in ".ts" ".tsx" "/index.ts" "/index.tsx"; do
                    if [ -f "${RESOLVED}${ext}" ]; then
                        echo "${RESOLVED}${ext}"
                        break
                    fi
                done
            fi
        done | tr '\n' ' ')
done <<< "$FILES"

# Detect cycles using DFS
detect_cycle() {
    local current="$1"
    local path="$2"
    local visited="$3"
    
    # Check if we've seen this file in current path
    if [[ "$path" == *"|$current|"* ]]; then
        # Found cycle
        CYCLE_PATH=$(echo "$path" | sed "s/.*|$current|//" | sed "s/|/ -> /g")
        echo "$current -> $CYCLE_PATH -> $current"
        return 1
    fi
    
    # Mark as visited in current path
    local new_path="$path|$current|"
    
    # Visit dependencies
    local deps="${IMPORTS[$current]}"
    for dep in $deps; do
        if [ -f "$dep" ]; then
            if ! detect_cycle "$dep" "$new_path" "$visited"; then
                return 1
            fi
        fi
    done
    
    return 0
}

CYCLES_FOUND=0

# Check each file as potential cycle start
while IFS= read -r file; do
    if ! detect_cycle "$file" "" "" 2>/dev/null; then
        CYCLES_FOUND=$((CYCLES_FOUND + 1))
    fi
done <<< "$FILES"

# Alternative simple check: look for common patterns
echo ""
echo "Checking common circular dependency patterns..."

# Check if services import from components
SERVICES=$(find ./lib -name "*.ts" 2>/dev/null)
while IFS= read -r service; do
    if grep -q "from ['\"].*components" "$service" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Warning: Service imports from components${NC}"
        echo "  $service"
        echo "  Services should not import UI components"
    fi
done <<< "$SERVICES"

# Check if components have circular imports
COMPONENTS=$(find ./components -name "*.tsx" 2>/dev/null)

declare -A COMPONENT_IMPORTS

while IFS= read -r comp; do
    COMP_NAME=$(basename "$comp")
    IMPORTS_LIST=$(grep -oP "from ['\"]\.\.?/components/\K[^'\"]*" "$comp" 2>/dev/null || true)
    
    if [ ! -z "$IMPORTS_LIST" ]; then
        while IFS= read -r imported; do
            IMPORTED_FILE="./components/${imported}.tsx"
            
            if [ -f "$IMPORTED_FILE" ]; then
                # Check if imported file imports back
                if grep -q "from ['\"]\.\.?/components/$(basename "$comp" .tsx)" "$IMPORTED_FILE" 2>/dev/null; then
                    echo -e "${RED}✗ Circular dependency detected:${NC}"
                    echo "  $comp <-> $IMPORTED_FILE"
                    CYCLES_FOUND=$((CYCLES_FOUND + 1))
                fi
            fi
        done <<< "$IMPORTS_LIST"
    fi
done <<< "$COMPONENTS"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""

if [ $CYCLES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No circular dependencies detected${NC}"
    exit 0
else
    echo -e "${RED}✗ Found ${CYCLES_FOUND} circular dependency issue(s)${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Extract shared code to a separate utility file"
    echo "  2. Use dependency injection instead of direct imports"
    echo "  3. Restructure components to have clearer hierarchy"
    echo "  4. Consider using React Context for shared state"
    exit 1
fi
