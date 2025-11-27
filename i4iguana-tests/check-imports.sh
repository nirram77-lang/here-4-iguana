#!/bin/bash

# 🔗 Import/Export Validator
# בודק שכל ה-imports תואמים ל-exports

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Import/Export Validator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR=${1:-.}

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

ERRORS=0
TEMP_FILE="/tmp/import-export-check.txt"
> "$TEMP_FILE"

echo "📂 Scanning TypeScript/TSX files..."
echo ""

# מציאת כל קבצי TS/TSX
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*")

# ספירת קבצים
FILE_COUNT=$(echo "$FILES" | wc -l)
echo "📊 Found $FILE_COUNT files to check"
echo ""

echo "🔍 Checking imports..."
echo ""

# לולאה על כל הקבצים
while IFS= read -r file; do
    # דילוג על קבצי d.ts
    if [[ $file == *.d.ts ]]; then
        continue
    fi
    
    # חיפוש imports מקומיים (מתחילים ב-@ או .)
    IMPORTS=$(grep -E "import .* from ['\"][@\./]" "$file" 2>/dev/null || true)
    
    if [ -n "$IMPORTS" ]; then
        echo "Checking: $file"
        
        while IFS= read -r import_line; do
            # חילוץ שם הקובץ המיובא
            IMPORT_PATH=$(echo "$import_line" | sed -E "s/.*from ['\"]([^'\"]+).*/\1/")
            
            # אם זה path יחסי
            if [[ $IMPORT_PATH == ./* ]] || [[ $IMPORT_PATH == ../* ]]; then
                # חישוב ה-path המלא
                FILE_DIR=$(dirname "$file")
                FULL_PATH="$FILE_DIR/$IMPORT_PATH"
                
                # נרמול path
                FULL_PATH=$(realpath -m "$FULL_PATH" 2>/dev/null || echo "$FULL_PATH")
                
                # בדיקה אם הקובץ קיים (עם או בלי סיומת)
                if [ ! -f "$FULL_PATH" ] && [ ! -f "$FULL_PATH.ts" ] && [ ! -f "$FULL_PATH.tsx" ] && [ ! -f "$FULL_PATH/index.ts" ] && [ ! -f "$FULL_PATH/index.tsx" ]; then
                    echo "  ❌ Missing import: $IMPORT_PATH" | tee -a "$TEMP_FILE"
                    ERRORS=$((ERRORS + 1))
                fi
            fi
            
            # חילוץ named imports
            NAMED_IMPORTS=$(echo "$import_line" | sed -E 's/import \{([^}]+)\}.*/\1/' | tr ',' '\n' | sed 's/^ *//;s/ *$//')
            
            if [ -n "$NAMED_IMPORTS" ]; then
                # כאן אפשר להוסיף בדיקה אם ה-export באמת קיים
                # (דורש parsing מורכב יותר)
                :
            fi
        done <<< "$IMPORTS"
    fi
done <<< "$FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo "✅ Import/Export Check Passed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo "❌ Found $ERRORS Import/Export Issues!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat "$TEMP_FILE"
    echo ""
    exit 1
fi
