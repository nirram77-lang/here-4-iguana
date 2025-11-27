#!/bin/bash

################################################################################
# I4IGUANA - Automated Build Validation System
# Main Test Runner
# 
# Runs all validation tests before deployment to catch issues early
# Saves 30-150 minutes per development cycle by catching build failures
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        I4IGUANA - Automated Build Validation System         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local test_script="$2"
    
    echo -e "${YELLOW}► Running: ${test_name}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if bash "${SCRIPT_DIR}/${test_script}"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASSED: ${test_name}${NC}\n"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAILED: ${test_name}${NC}\n"
    fi
}

# Run all tests
echo -e "${BLUE}Starting validation tests...${NC}\n"

run_test "TypeScript Syntax Check" "01-typescript-check.sh"
run_test "Dependency Validation" "02-dependency-check.sh"
run_test "Import/Export Verification" "03-import-check.sh"
run_test "Props Compatibility Check" "04-props-check.sh"
run_test "Circular Dependency Detection" "05-circular-deps-check.sh"
run_test "Firebase Configuration Check" "06-firebase-check.sh"

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL TESTS PASSED - Ready for deployment! 🚀              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ TESTS FAILED - Fix issues before deployment              ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
