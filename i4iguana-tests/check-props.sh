#!/bin/bash

# 🎯 Props & Interface Validator
# בודק שכל ה-props שנשלחים לקומפוננטות תואמים להגדרות

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Props & Interface Validator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR=${1:-.}

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

ERRORS=0
WARNINGS=0

echo "📂 Scanning component files..."
echo ""

# מציאת קבצי קומפוננטות
COMPONENT_FILES=$(find . -type f -name "*.tsx" ! -path "*/node_modules/*" ! -path "*/.next/*")

# יצירת מפה של קומפוננטות וה-props שלהן
declare -A COMPONENT_PROPS

echo "🔍 Extracting component interfaces..."
echo ""

while IFS= read -r file; do
    # חיפוש הגדרות interface/type Props
    COMPONENT_NAME=$(basename "$file" .tsx)
    
    # חיפוש interface Props
    PROPS_DEF=$(grep -A 20 "interface ${COMPONENT_NAME}Props" "$file" 2>/dev/null || true)
    
    if [ -n "$PROPS_DEF" ]; then
        echo "Found: $COMPONENT_NAME"
        # שמירת ההגדרה (פשטני)
        COMPONENT_PROPS["$COMPONENT_NAME"]="$PROPS_DEF"
    fi
done <<< "$COMPONENT_FILES"

echo ""
echo "📊 Found ${#COMPONENT_PROPS[@]} components with Props interfaces"
echo ""

# בדיקת שימוש בקומפוננטות
echo "🔍 Checking component usage..."
echo ""

for comp_name in "${!COMPONENT_PROPS[@]}"; do
    # חיפוש שימושים בקומפוננטה
    USAGES=$(grep -r "<$comp_name" . --include="*.tsx" --include="*.ts" ! -path "*/node_modules/*" ! -path "*/.next/*" 2>/dev/null || true)
    
    if [ -n "$USAGES" ]; then
        echo "Checking usages of: $comp_name"
        
        # כאן אפשר לבדוק אם ה-props שנשלחים תואמים להגדרה
        # (דורש parser מתוחכם יותר - נעשה validation בסיסי)
        
        # בדיקה בסיסית: האם יש props חסרים?
        REQUIRED_PROPS=$(echo "${COMPONENT_PROPS[$comp_name]}" | grep -v "?" | grep ":" | sed 's/[[:space:]]//g' | cut -d':' -f1)
        
        if [ -n "$REQUIRED_PROPS" ]; then
            while IFS= read -r prop; do
                # בדיקה אם ה-prop מופיע בשימוש
                if ! echo "$USAGES" | grep -q "$prop="; then
                    echo "  ⚠️  Warning: Required prop '$prop' might be missing in some usages"
                    WARNINGS=$((WARNINGS + 1))
                fi
            done <<< "$REQUIRED_PROPS"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Props & Interface Check Passed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Props Check Passed with $WARNINGS warnings"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo "❌ Found $ERRORS errors and $WARNINGS warnings!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi
