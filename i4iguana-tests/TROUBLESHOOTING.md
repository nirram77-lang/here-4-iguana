# 🔧 Troubleshooting Guide
## פתרון בעיות נפוצות במערכת הבדיקות

---

## ❌ "command not found: tsc"

### הבעיה:
TypeScript לא מותקן או לא נמצא ב-PATH

### הפתרון:
```bash
# אופציה 1: התקנה גלובלית
npm install -g typescript

# אופציה 2: התקנה local (מומלץ)
npm install -D typescript

# אופציה 3: שימוש ב-pnpm
pnpm install -D typescript

# בדוק שהותקן:
npx tsc --version
```

---

## ❌ "command not found: jq"

### הבעיה:
jq לא מותקן (נדרש לבדיקת dependencies)

### הפתרון:
```bash
# Ubuntu/Debian:
sudo apt-get install jq

# macOS:
brew install jq

# Windows (WSL):
sudo apt-get install jq

# Windows (Chocolatey):
choco install jq

# בדוק שהותקן:
jq --version
```

---

## ❌ "Permission denied"

### הבעיה:
הסקריפטים לא ניתנים להרצה

### הפתרון:
```bash
chmod +x ./i4iguana-tests/*.sh

# או לכל סקריפט בנפרד:
chmod +x ./i4iguana-tests/run-all-tests.sh
chmod +x ./i4iguana-tests/check-typescript.sh
# וכו'...
```

---

## ❌ TypeScript Check נכשל עם שגיאות רבות

### הבעיה:
הקוד מכיל שגיאות TypeScript

### פתרון שלב אחר שלב:

#### 1. זהה את השגיאה הראשונה:
```bash
./i4iguana-tests/check-typescript.sh . | head -20
```

#### 2. תקן את השגיאה הראשונה בלבד

#### 3. בדוק שוב:
```bash
./i4iguana-tests/check-typescript.sh .
```

#### 4. חזור על 1-3 עד שהכל עובד

### טיפים:
```bash
# הצג רק את 5 השגיאות הראשונות:
./i4iguana-tests/check-typescript.sh . 2>&1 | grep "error TS" | head -5

# שמור את השגיאות לקובץ:
./i4iguana-tests/check-typescript.sh . 2>&1 > errors.log

# ספור כמה שגיאות יש:
./i4iguana-tests/check-typescript.sh . 2>&1 | grep -c "error TS"
```

---

## ❌ "No such file or directory" ב-Import Check

### הבעיה:
הסקריפט מחפש קובץ שלא קיים

### פתרון:

#### בדוק את ה-import:
```typescript
// ❌ לא נכון:
import { Component } from '../components/old-name'

// ✅ נכון:
import { Component } from '../components/new-name'
```

#### או הוסף את הקובץ החסר:
```bash
# אם הקובץ באמת צריך להיות שם
touch components/old-name.tsx
```

---

## ⚠️ Props Check מראה אזהרות שגויות (False Positives)

### הבעיה:
הבדיקה פשטנית ולא תמיד מדויקת

### הפתרון:
**זה נורמלי!** הבדיקה הזו היא heuristic ולא מושלמת.

#### אופציות:
1. **התעלם** - אם אתה בטוח שהקוד תקין
2. **השתמש ב-TypeScript Check** - זה יותר מדויק
3. **השבת את הבדיקה** - ערוך את `run-all-tests.sh`:

```bash
# הערה את השורה:
# run_test "🎯 Props & Interface Check" "check-props.sh" || true
```

---

## ❌ Circular Dependency נמצא (אבל הכל עובד)

### הבעיה:
לפעמים יש circular dependency לגיטימי

### הפתרון:

#### 1. וודא שזה לא באג אמיתי:
```bash
./i4iguana-tests/check-circular.sh .
```

קרא את ה-cycle path ובדוק אם זה הגיוני.

#### 2. אם זה לגיטימי, תקן את הארכיטקטורה:

**אופציה א': העבר קוד משותף לקובץ נפרד**
```typescript
// ❌ Before:
// A.ts imports B.ts
// B.ts imports A.ts

// ✅ After:
// shared.ts - קוד משותף
// A.ts imports shared.ts
// B.ts imports shared.ts
```

**אופציה ב': שימוש ב-Dependency Injection**
```typescript
// ❌ Before:
import { serviceA } from './serviceA'

// ✅ After:
// העבר את serviceA כפרמטר
function myFunction(serviceA: ServiceA) {
  // ...
}
```

#### 3. אם אי אפשר לתקן, השבת את הבדיקה:
```bash
# ערוך run-all-tests.sh:
# run_test "🔄 Circular Dependency Check" "check-circular.sh" || true
```

---

## ❌ "Project directory not found"

### הבעיה:
הסקריפט לא מוצא את תיקיית הפרויקט

### הפתרון:

#### וודא שאתה מריץ מהמיקום הנכון:
```bash
# בדוק איפה אתה:
pwd

# צריך להיות משהו כמו:
# /home/user/i4iguana

# אם לא, עבור לתיקיית הפרויקט:
cd /path/to/i4iguana
```

#### או העבר את ה-path במפורש:
```bash
./i4iguana-tests/run-all-tests.sh /full/path/to/project
```

---

## ❌ הבדיקה אורכת זמן רב מדי

### הבעיה:
הפרויקט גדול והבדיקות לוקחות זמן

### הפתרון:

#### 1. הרץ רק בדיקות חשובות:
```bash
# רק TypeScript (הכי חשוב):
./i4iguana-tests/check-typescript.sh .

# רק TypeScript + Imports:
./check-typescript.sh . && ./check-imports.sh .
```

#### 2. הגבל את ה-scope:
```bash
# בדוק רק קובץ אחד:
npx tsc --noEmit app/page.tsx

# בדוק רק תיקייה אחת:
npx tsc --noEmit app/**/*.tsx
```

#### 3. השתמש ב-cache:
```bash
# הוסף ל-package.json:
"scripts": {
  "validate:cached": "tsc --incremental --noEmit"
}
```

---

## ❌ "Module not found" בזמן build (אבל הבדיקות עברו)

### הבעיה:
יש הבדל בין הבדיקות ל-build האמיתי

### הפתרון:

#### 1. נקה את ה-cache:
```bash
# Next.js:
rm -rf .next
npm run build

# או:
npx next build --no-cache
```

#### 2. וודא ש-node_modules מעודכן:
```bash
rm -rf node_modules
npm install
```

#### 3. בדוק את tsconfig.json:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## ❌ הבדיקות עוברות ב-local אבל נכשלות ב-CI/CD

### הבעיה:
הבדל בסביבות

### הפתרון:

#### 1. וודא שכל הכלים מותקנים ב-CI:
```yaml
# GitHub Actions:
- name: Install system dependencies
  run: sudo apt-get install -y jq

- name: Install Node dependencies
  run: npm ci
```

#### 2. וודא שהקבצים מועתקים:
```yaml
- name: Checkout code
  uses: actions/checkout@v3
```

#### 3. וודא שהסקריפטים executable:
```yaml
- name: Make scripts executable
  run: chmod +x ./i4iguana-tests/*.sh
```

---

## ❌ "realpath: command not found" (macOS ישן)

### הבעיה:
macOS ישן לא מכיל את `realpath`

### הפתרון:
```bash
# התקן coreutils:
brew install coreutils

# או:
# הסקריפטים ישתמשו ב-fallback אוטומטית
```

---

## 🐛 Debug Mode

### הפעל debug mode לראות מה קורה:

```bash
# הוסף -x לכל סקריפט:
bash -x ./i4iguana-tests/check-typescript.sh .

# או ערוך את הסקריפט:
#!/bin/bash -x

# זה ידפיס כל פקודה לפני הביצוע
```

---

## 📝 לוגים מפורטים

### שמור את הלוגים לקובץ:

```bash
# כל הפלט (stdout + stderr):
./i4iguana-tests/run-all-tests.sh . &> validation.log

# רק שגיאות:
./i4iguana-tests/run-all-tests.sh . 2> errors.log

# הכל + עדיין תראה בטרמינל:
./i4iguana-tests/run-all-tests.sh . 2>&1 | tee validation.log
```

---

## 🆘 כלים נוספים לאבחון

### TypeScript Compiler API:
```bash
# בדוק את ה-config:
npx tsc --showConfig

# הצג את כל הקבצים שנבדקים:
npx tsc --listFiles --noEmit | head -20

# הצג רק שגיאות:
npx tsc --noEmit --pretty false 2>&1 | grep "error TS"
```

### npm/pnpm:
```bash
# בדוק dependencies:
npm ls

# מצא outdated packages:
npm outdated

# בדוק שאין conflicts:
npm ls --depth=0
```

---

## 💡 Tips למניעת בעיות

### 1. תמיד הרץ בדיקות לפני commit:
```bash
# הוסף alias ל-.bashrc / .zshrc:
alias validate='./i4iguana-tests/run-all-tests.sh .'
```

### 2. השתמש ב-IDE plugins:
- **VS Code**: ESLint + TypeScript extensions
- **WebStorm**: Built-in TypeScript support

### 3. הגדר auto-format:
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 📞 עדיין תקוע?

### 1. בדוק את הלוגים:
```bash
./i4iguana-tests/run-all-tests.sh . 2>&1 | tee full-log.txt
```

### 2. העתק את השגיאה המדויקת

### 3. פנה ל-Claude בצ'אט עם:
- השגיאה המלאה
- הקובץ שגורם לבעיה
- מה ניסית כבר

---

**נבנה עבור I4IGUANA 🦎 | Troubleshooting Guide**
