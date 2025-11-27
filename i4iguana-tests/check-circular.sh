#!/bin/bash

# 🔄 Circular Dependency Detector
# מזהה circular dependencies שגורמים לבאגים

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Circular Dependency Detector"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR=${1:-.}

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

ERRORS=0

echo "📂 Building dependency graph..."
echo ""

# מציאת כל קבצי TS/TSX
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*")

# יצירת מפת dependencies
declare -A DEP_MAP
declare -A VISITED
declare -A IN_PATH

# בניית גרף הזיכרון
while IFS= read -r file; do
    # נרמול שם הקובץ
    NORMALIZED_FILE=$(realpath "$file" 2>/dev/null || echo "$file")
    
    # חיפוש imports
    IMPORTS=$(grep -E "from ['\"][@\./]" "$file" 2>/dev/null | sed -E "s/.*from ['\"]([^'\"]+).*/\1/")
    
    DEP_MAP["$NORMALIZED_FILE"]="$IMPORTS"
done <<< "$FILES"

echo "📊 Found ${#DEP_MAP[@]} files in dependency graph"
echo ""

# פונקציה לבדיקת cycles (DFS)
check_cycles() {
    local current=$1
    local path=$2
    
    if [ -n "${IN_PATH[$current]}" ]; then
        # מצאנו cycle!
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "❌ CIRCULAR DEPENDENCY DETECTED!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Cycle path:"
        echo "$path" | tr ':' '\n' | tail -5
        echo "  ↓"
        echo "  $(basename "$current")"
        echo ""
        return 1
    fi
    
    if [ -n "${VISITED[$current]}" ]; then
        return 0
    fi
    
    VISITED["$current"]=1
    IN_PATH["$current"]=1
    
    # בדיקת כל ה-dependencies
    local deps="${DEP_MAP[$current]}"
    if [ -n "$deps" ]; then
        while IFS= read -r dep; do
            # המרת path יחסי ל-path מלא
            local dep_full=$(dirname "$current")/"$dep"
            dep_full=$(realpath -m "$dep_full" 2>/dev/null || echo "$dep_full")
            
            # ניסיון למצוא את הקובץ עם סיומות שונות
            for ext in "" ".ts" ".tsx" "/index.ts" "/index.tsx"; do
                if [ -f "${dep_full}${ext}" ]; then
                    check_cycles "${dep_full}${ext}" "$path:$(basename "$current")"
                    if [ $? -ne 0 ]; then
                        return 1
                    fi
                    break
                fi
            done
        done <<< "$deps"
    fi
    
    unset IN_PATH["$current"]
    return 0
}

echo "🔍 Checking for circular dependencies..."
echo ""

# בדיקת cycles מכל נקודת כניסה
for file in "${!DEP_MAP[@]}"; do
    unset VISITED
    unset IN_PATH
    declare -A VISITED
    declare -A IN_PATH
    
    check_cycles "$file" ""
    if [ $? -ne 0 ]; then
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo "✅ No Circular Dependencies Found!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo "❌ Found $ERRORS Circular Dependencies!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Fix by:"
    echo "  1. Moving shared code to a separate file"
    echo "  2. Using dependency injection"
    echo "  3. Restructuring imports"
    echo ""
    exit 1
fi
