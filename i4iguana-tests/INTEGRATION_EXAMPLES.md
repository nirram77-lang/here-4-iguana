# 🔗 Integration Examples
## דוגמאות לשילוב מערכת הבדיקות

---

## 1. Vercel Deploy 🚀

### package.json
```json
{
  "name": "i4iguana",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    
    "validate": "./i4iguana-tests/run-all-tests.sh .",
    "predeploy": "npm run validate",
    "deploy": "vercel --prod",
    
    "deploy-force": "vercel --prod",
    "test": "npm run validate"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### שימוש:
```bash
# Deploy רגיל (עם בדיקות):
npm run deploy

# Deploy ללא בדיקות (במקרה חירום):
npm run deploy-force

# הרצת בדיקות בלבד:
npm test
```

---

## 2. GitHub Actions 🤖

### .github/workflows/validate-build.yml
```yaml
name: Build Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install jq (for dependency check)
        run: sudo apt-get install -y jq
      
      - name: Make test scripts executable
        run: chmod +x ./i4iguana-tests/*.sh
      
      - name: Run Build Validation
        run: ./i4iguana-tests/run-all-tests.sh .
      
      - name: Comment PR with results
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Build validation failed! Please check the logs and fix the errors.'
            })
```

---

## 3. Git Hooks 🪝

### .git/hooks/pre-commit
```bash
#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Running pre-commit validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# הרצת הבדיקות
./i4iguana-tests/run-all-tests.sh .

# בדיקת exit code
if [ $? -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Validation failed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Fix the errors above before committing."
    echo ""
    echo "To bypass (not recommended):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ All checks passed! Proceeding with commit..."
exit 0
```

**התקנה:**
```bash
# העתק את הסקריפט:
cp examples/pre-commit .git/hooks/pre-commit

# הפוך לניתן להרצה:
chmod +x .git/hooks/pre-commit
```

---

## 4. Pre-push Hook 🚀

### .git/hooks/pre-push
```bash
#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Running pre-push validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# בדיקות מהירות בלבד (לחסוך זמן)
./i4iguana-tests/check-typescript.sh .

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ TypeScript check failed!"
    echo "Fix errors before pushing."
    echo ""
    exit 1
fi

echo "✅ Ready to push!"
exit 0
```

---

## 5. VS Code Tasks ⚙️

### .vscode/tasks.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Build",
      "type": "shell",
      "command": "./i4iguana-tests/run-all-tests.sh .",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "TypeScript Check Only",
      "type": "shell",
      "command": "./i4iguana-tests/check-typescript.sh .",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Quick Validation",
      "type": "shell",
      "command": "./i4iguana-tests/check-typescript.sh . && ./i4iguana-tests/check-imports.sh .",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

**שימוש ב-VS Code:**
- `Ctrl+Shift+B` → Validate Build
- `Ctrl+Shift+P` → "Tasks: Run Task" → בחר task

---

## 6. npm Scripts מתקדם 📜

### package.json (מורחב)
```json
{
  "scripts": {
    "validate": "./i4iguana-tests/run-all-tests.sh .",
    "validate:ts": "./i4iguana-tests/check-typescript.sh .",
    "validate:deps": "./i4iguana-tests/check-dependencies.sh .",
    "validate:imports": "./i4iguana-tests/check-imports.sh .",
    "validate:props": "./i4iguana-tests/check-props.sh .",
    "validate:circular": "./i4iguana-tests/check-circular.sh .",
    
    "validate:quick": "npm run validate:ts && npm run validate:imports",
    "validate:full": "npm run validate",
    
    "pretest": "npm run validate:quick",
    "test": "jest",
    
    "prebuild": "npm run validate:ts",
    "build": "next build",
    
    "predeploy": "npm run validate",
    "deploy": "vercel --prod",
    
    "watch:validate": "nodemon --watch 'app/**/*.tsx' --watch 'components/**/*.tsx' --exec 'npm run validate:quick'"
  }
}
```

**שימוש:**
```bash
# בדיקה מלאה:
npm run validate

# בדיקה מהירה (רק TS + Imports):
npm run validate:quick

# בדיקה ספציפית:
npm run validate:ts
npm run validate:deps

# Watch mode (אוטומטי בכל שינוי):
npm run watch:validate
```

---

## 7. Docker Integration 🐳

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# העתקת package files
COPY package*.json ./

# התקנת dependencies
RUN npm ci

# התקנת jq (לבדיקות)
RUN apk add --no-cache bash jq

# העתקת הקוד
COPY . .

# הפיכת הסקריפטים לניתנים להרצה
RUN chmod +x ./i4iguana-tests/*.sh

# הרצת בדיקות
RUN ./i4iguana-tests/run-all-tests.sh .

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 8. Makefile 🛠️

### Makefile
```makefile
.PHONY: validate validate-quick validate-ts validate-deps validate-imports deploy test

validate:
	@echo "Running full validation..."
	@./i4iguana-tests/run-all-tests.sh .

validate-quick:
	@echo "Running quick validation..."
	@./i4iguana-tests/check-typescript.sh .
	@./i4iguana-tests/check-imports.sh .

validate-ts:
	@./i4iguana-tests/check-typescript.sh .

validate-deps:
	@./i4iguana-tests/check-dependencies.sh .

validate-imports:
	@./i4iguana-tests/check-imports.sh .

deploy: validate
	@echo "Validation passed! Deploying..."
	@vercel --prod

test: validate
	@echo "Running tests..."
	@npm test

install-hooks:
	@cp examples/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Git hooks installed!"
```

**שימוש:**
```bash
make validate        # בדיקה מלאה
make validate-quick  # בדיקה מהירה
make deploy          # בדיקה + deploy
make install-hooks   # התקנת git hooks
```

---

## 9. Claude Integration 🤖

### איך Claude משתמש בזה:

```bash
# 1. Claude כותב/מתקן קבצים
# 2. Claude מריץ:
./i4iguana-tests/run-all-tests.sh /mnt/user-data/uploads

# 3. אם עובר:
echo "✅ Files ready for user!"
mv files /mnt/user-data/outputs/

# 4. אם נכשל:
echo "❌ Found errors, fixing..."
# Claude מתקן ובודק שוב
```

---

## 10. Watch Mode (Development) 👀

### package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:validate": "concurrently \"npm run dev\" \"npm run watch:validate\"",
    "watch:validate": "nodemon --watch 'app/**/*' --watch 'components/**/*' --watch 'lib/**/*' --ext ts,tsx --exec './i4iguana-tests/check-typescript.sh .'"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "nodemon": "^3.0.0"
  }
}
```

**שימוש:**
```bash
npm run dev:validate
```

בכל שינוי בקוד → בדיקה אוטומטית!

---

## 📊 השוואת אינטגרציות:

| Integration | מתי להשתמש | יתרונות | חסרונות |
|-------------|-----------|----------|----------|
| **Vercel** | Production deploy | אוטומטי, חסום deploy באג | רק בעת deploy |
| **GitHub Actions** | CI/CD | בכל PR, אוטומטי | דורש setup |
| **Git Hooks** | Development | מהיר, מקומי | רק local |
| **npm Scripts** | גמיש | פשוט, נוח | צריך להריץ ידנית |
| **Watch Mode** | Development | אוטומטי בשינוי | רץ כל הזמן |
| **VS Code Tasks** | Development | שילוב IDE | רק VS Code |

---

**המלצה:** 
- ✅ התחל עם **npm Scripts** (פשוט)
- ✅ הוסף **Git Hooks** (למנוע commits עם באגים)
- ✅ שדרג ל-**GitHub Actions** (CI/CD)

---

**נבנה עבור I4IGUANA 🦎**
