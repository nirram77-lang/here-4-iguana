#!/bin/bash

# 🚀 I4IGUANA Build Validator
# מערכת בדיקות אוטומטית מקיפה לפני build

set -e  # עצירה בשגיאה

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🦎 I4IGUANA BUILD VALIDATOR"
echo "  מערכת בדיקות אוטומטית מקיפה"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR=${1:-.}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# צבעים
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# מונים
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

START_TIME=$(date +%s)

# פונקציה להרצת בדיקה
run_test() {
    local test_name=$1
    local test_script=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo ""
    echo "▶️  Running: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$SCRIPT_DIR/$test_script" "$PROJECT_DIR"; then
        echo -e "${GREEN}✅ PASSED${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# בדיקה שהתיקייה קיימת
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi

echo "📂 Project Directory: $PROJECT_DIR"
echo ""

# הרצת כל הבדיקות
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 RUNNING VALIDATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Dependencies
run_test "📦 Dependencies Check" "check-dependencies.sh" || true

# Test 2: TypeScript Syntax
run_test "🔍 TypeScript Syntax Check" "check-typescript.sh"

# Test 3: Imports/Exports
run_test "🔗 Import/Export Validation" "check-imports.sh" || true

# Test 4: Props & Interfaces
run_test "🎯 Props & Interface Check" "check-props.sh" || true

# Test 5: Circular Dependencies
run_test "🔄 Circular Dependency Check" "check-circular.sh" || true

# חישוב זמן
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# סיכום
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Total Tests:  $TOTAL_TESTS"
echo -e "  ${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed:       $FAILED_TESTS${NC}"
echo "  Duration:     ${DURATION}s"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "  🚀 Safe to deploy!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${RED}❌ TESTS FAILED!${NC}"
    echo "  ⚠️  Fix errors before deploying!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi
