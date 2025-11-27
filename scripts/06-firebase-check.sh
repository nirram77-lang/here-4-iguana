#!/bin/bash

################################################################################
# Firebase Configuration Check
# Validates Firebase setup and environment variables
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "Checking Firebase configuration..."

# Check for Firebase config file
FIREBASE_FILE="./lib/firebase.ts"

if [ ! -f "$FIREBASE_FILE" ]; then
    echo -e "${RED}✗ Firebase config file not found: $FIREBASE_FILE${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} Firebase config file exists"
    
    # Check for required Firebase imports
    REQUIRED_IMPORTS=(
        "initializeApp"
        "getAuth"
        "getFirestore"
    )
    
    for import in "${REQUIRED_IMPORTS[@]}"; do
        if grep -q "$import" "$FIREBASE_FILE"; then
            echo -e "  ${GREEN}✓${NC} $import imported"
        else
            echo -e "  ${RED}✗${NC} $import - Missing import"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

echo ""
echo "Checking environment variables..."

# Check for .env files
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ No .env file found${NC}"
    echo "  Create .env.local with Firebase credentials"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} Environment file exists"
    
    # Check for required variables (without exposing values)
    REQUIRED_VARS=(
        "NEXT_PUBLIC_FIREBASE_API_KEY"
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
        "NEXT_PUBLIC_FIREBASE_APP_ID"
    )
    
    ENV_FILE=".env.local"
    [ ! -f "$ENV_FILE" ] && ENV_FILE=".env"
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            VALUE=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
            if [ -z "$VALUE" ]; then
                echo -e "  ${RED}✗${NC} $var - Empty value"
                ERRORS=$((ERRORS + 1))
            else
                echo -e "  ${GREEN}✓${NC} $var"
            fi
        else
            echo -e "  ${RED}✗${NC} $var - Not set"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

echo ""
echo "Checking Firebase Security Rules..."

if [ -f "firestore.rules" ]; then
    echo -e "${GREEN}✓${NC} Firestore rules file exists"
    
    # Check if rules are not the default unsafe rules
    if grep -q "allow read, write: if true" "firestore.rules"; then
        echo -e "${YELLOW}⚠ Warning: Firestore rules allow public access${NC}"
        echo "  Update rules for production security"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Custom security rules defined"
    fi
else
    echo -e "${YELLOW}⚠${NC} No firestore.rules file found"
    echo "  Consider adding security rules for production"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "storage.rules" ]; then
    echo -e "${GREEN}✓${NC} Storage rules file exists"
else
    echo -e "${YELLOW}⚠${NC} No storage.rules file found"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "Checking Firebase service usage..."

# Check if Firestore is properly initialized
FIRESTORE_SERVICE="./lib/firestore-service.ts"

if [ -f "$FIRESTORE_SERVICE" ]; then
    if grep -q "getFirestore\|db" "$FIRESTORE_SERVICE"; then
        echo -e "${GREEN}✓${NC} Firestore service properly configured"
    else
        echo -e "${RED}✗${NC} Firestore not initialized in service"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check for proper error handling
    if grep -q "try.*catch" "$FIRESTORE_SERVICE"; then
        echo -e "${GREEN}✓${NC} Error handling implemented"
    else
        echo -e "${YELLOW}⚠${NC} No error handling found"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Firestore service not found"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Firebase check completed with ${WARNINGS} warning(s)${NC}"
        echo "  App should work, but consider addressing warnings for production"
    else
        echo -e "${GREEN}✓ Firebase is correctly configured${NC}"
    fi
    exit 0
else
    echo -e "${RED}✗ Found ${ERRORS} error(s) and ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Create .env.local with all required Firebase credentials"
    echo "  2. Verify Firebase project is correctly set up in Firebase Console"
    echo "  3. Check that Firebase imports match your project setup"
    echo "  4. Ensure Firebase SDKs are installed: npm install firebase"
    exit 1
fi
