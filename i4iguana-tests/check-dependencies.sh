#!/bin/bash

# 📦 Dependency Checker
# בודק שכל הספריות הדרושות מותקנות

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Dependency Checker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR=${1:-.}

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

ERRORS=0
MISSING_DEPS=()

echo "📂 Checking package.json..."
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    exit 1
fi

# בדיקה ש-node_modules קיים
if [ ! -d "node_modules" ]; then
    echo "⚠️  Warning: node_modules not found!"
    echo "💡 Run: npm install or pnpm install"
    echo ""
fi

# חילוץ רשימת dependencies מ-package.json
DECLARED_DEPS=$(jq -r '.dependencies // {} | keys[]' package.json 2>/dev/null)
DECLARED_DEV_DEPS=$(jq -r '.devDependencies // {} | keys[]' package.json 2>/dev/null)

echo "📊 Declared dependencies: $(echo "$DECLARED_DEPS" | wc -l)"
echo "📊 Declared devDependencies: $(echo "$DECLARED_DEV_DEPS" | wc -l)"
echo ""

# חיפוש imports בקוד
echo "🔍 Scanning for used packages..."
echo ""

USED_PACKAGES=$(grep -rh "from ['\"]" . --include="*.ts" --include="*.tsx" ! -path "*/node_modules/*" ! -path "*/.next/*" 2>/dev/null | \
    sed -E "s/.*from ['\"]([^'\"]+).*/\1/" | \
    grep -v "^[@\./]" | \
    cut -d'/' -f1 | \
    sort -u)

# בדיקה לכל חבילה שנמצאת בשימוש
while IFS= read -r package; do
    if [ -z "$package" ]; then
        continue
    fi
    
    # בדיקה אם החבילה מוגדרת ב-package.json
    if ! echo "$DECLARED_DEPS" | grep -q "^$package$" && \
       ! echo "$DECLARED_DEV_DEPS" | grep -q "^$package$"; then
        echo "❌ Missing: $package"
        MISSING_DEPS+=("$package")
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ Found: $package"
    fi
done <<< "$USED_PACKAGES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All Dependencies Declared!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo "❌ Found $ERRORS Missing Dependencies!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Install missing packages:"
    echo ""
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  npm install $dep"
    done
    echo ""
    exit 1
fi
