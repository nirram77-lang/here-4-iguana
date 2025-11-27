#!/bin/bash

# 🔍 TypeScript Syntax & Type Checker
# בודק שגיאות TypeScript לפני build

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 TypeScript Syntax & Type Checker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR=${1:-.}
ERRORS=0

# בדיקה שהתיקייה קיימת
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# בדיקה ש-TypeScript מותקן
if ! command -v tsc &> /dev/null; then
    if [ -f "node_modules/.bin/tsc" ]; then
        TSC_CMD="node_modules/.bin/tsc"
    else
        echo "❌ Error: TypeScript not installed"
        echo "💡 Run: npm install -D typescript"
        exit 1
    fi
else
    TSC_CMD="tsc"
fi

echo "📦 Running TypeScript compiler check..."
echo ""

# הרצת TypeScript compiler בלי emit
$TSC_CMD --noEmit 2>&1 | tee /tmp/tsc-output.log

# בדיקת exit code
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ TypeScript Errors Found!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # ספירת שגיאות
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.log)
    echo "📊 Total Errors: $ERROR_COUNT"
    echo ""
    
    # הצגת 10 השגיאות הראשונות
    echo "🔴 First errors:"
    grep "error TS" /tmp/tsc-output.log | head -10
    
    exit 1
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ TypeScript Check Passed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
fi
