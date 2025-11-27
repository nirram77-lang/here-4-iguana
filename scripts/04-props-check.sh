#!/bin/bash

################################################################################
# Props Compatibility Check
# Validates component props match their interface definitions
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "Analyzing component props..."

# Critical component props to check
declare -A COMPONENT_PROPS

# Define expected props for each component
COMPONENT_PROPS["welcome-screen.tsx"]="onGetStarted"
COMPONENT_PROPS["login-screen.tsx"]="onSuccess"
COMPONENT_PROPS["home-screen.tsx"]="userData userId onUpdateProfile onLogout onNavigate"
COMPONENT_PROPS["match-screen.tsx"]="currentMatch onLike onPass onBack"
COMPONENT_PROPS["chat-screen.tsx"]="matchData userId onBack"
COMPONENT_PROPS["profile-screen.tsx"]="userData onSave onBack"
COMPONENT_PROPS["settings-screen.tsx"]="userData onSave onLogout onDeleteAccount onBack"

echo "Checking component interfaces..."

for component in "${!COMPONENT_PROPS[@]}"; do
    COMPONENT_PATH="./components/$component"
    
    if [ ! -f "$COMPONENT_PATH" ]; then
        echo -e "  ${YELLOW}⚠${NC} $component - File not found (skipping)"
        WARNINGS=$((WARNINGS + 1))
        continue
    fi
    
    # Extract interface definition
    INTERFACE_CONTENT=$(sed -n '/interface.*Props/,/^}/p' "$COMPONENT_PATH")
    
    if [ -z "$INTERFACE_CONTENT" ]; then
        echo -e "  ${YELLOW}⚠${NC} $component - No Props interface found"
        WARNINGS=$((WARNINGS + 1))
        continue
    fi
    
    # Check each expected prop
    EXPECTED_PROPS="${COMPONENT_PROPS[$component]}"
    MISSING_PROPS=""
    
    for prop in $EXPECTED_PROPS; do
        if ! echo "$INTERFACE_CONTENT" | grep -q "$prop"; then
            MISSING_PROPS="$MISSING_PROPS $prop"
        fi
    done
    
    if [ ! -z "$MISSING_PROPS" ]; then
        echo -e "  ${RED}✗${NC} $component - Missing props:$MISSING_PROPS"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}✓${NC} $component"
    fi
done

echo ""
echo "Checking prop usage in page.tsx..."

PAGE_FILE="./app/page.tsx"

if [ ! -f "$PAGE_FILE" ]; then
    echo -e "${RED}✗ app/page.tsx not found${NC}"
    exit 1
fi

# Check for common prop mismatches
declare -A COMMON_MISTAKES

COMMON_MISTAKES["onLogin"]="Should be: onSuccess (LoginScreen)"
COMMON_MISTAKES["onNavigateToOnboarding"]="Should be: onSuccess (LoginScreen)"
COMMON_MISTAKES["updateUserProfile"]="Should be: saveUserProfile (Firestore)"
COMMON_MISTAKES["onLoginComplete"]="Should be: onSuccess (LoginScreen)"

echo "Checking for common prop mistakes..."

for mistake in "${!COMMON_MISTAKES[@]}"; do
    if grep -q "$mistake" "$PAGE_FILE" 2>/dev/null; then
        echo -e "  ${YELLOW}⚠${NC} Found: $mistake"
        echo -e "     ${COMMON_MISTAKES[$mistake]}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""

# Check for required Firebase service functions
echo "Verifying Firestore service functions..."

FIRESTORE_SERVICE="./lib/firestore-service.ts"

if [ -f "$FIRESTORE_SERVICE" ]; then
    REQUIRED_FUNCTIONS=(
        "saveUserProfile"
        "getUserProfile"
        "updateLocation"
        "saveOnboardingData"
        "getMatches"
    )
    
    for func in "${REQUIRED_FUNCTIONS[@]}"; do
        if grep -q "export.*function $func\|export.*const $func" "$FIRESTORE_SERVICE"; then
            echo -e "  ${GREEN}✓${NC} $func"
        else
            echo -e "  ${RED}✗${NC} $func - Missing"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}✗ Firestore service not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Props validation completed with ${WARNINGS} warning(s)${NC}"
    else
        echo -e "${GREEN}✓ All props are correctly defined${NC}"
    fi
    exit 0
else
    echo -e "${RED}✗ Found ${ERRORS} error(s) and ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Update component interfaces to match required props"
    echo "  2. Verify prop names in parent components match child expectations"
    echo "  3. Check that all callback functions are passed correctly"
    exit 1
fi
