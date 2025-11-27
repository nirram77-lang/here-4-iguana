# 📥 Installation Instructions
## הוראות התקנה של מערכת הבדיקות

---

## 🚀 התקנה מהירה

### שלב 1: הורד את התיקייה
```bash
# הורד את i4iguana-tests לפרויקט שלך
# (אם כבר הורדת - דלג לשלב 2)
```

### שלב 2: הפוך לניתן להרצה
```bash
cd /path/to/your/project
chmod +x i4iguana-tests/*.sh
```

### שלב 3: וודא שיש TypeScript
```bash
# בדוק אם TypeScript מותקן:
npx tsc --version

# אם לא - התקן:
npm install -D typescript
# או
pnpm install -D typescript
```

### שלב 4: וודא שיש jq
```bash
# בדוק אם jq מותקן:
jq --version

# אם לא - התקן:
# Ubuntu/Debian:
sudo apt-get install jq

# macOS:
brew install jq

# Windows WSL:
sudo apt-get install jq
```

### שלב 5: הרץ!
```bash
./i4iguana-tests/run-all-tests.sh .
```

אם הכל ירוק - מעולה! המערכת עובדת! ✅

---

## 📦 מבנה תיקיות מומלץ

```
your-project/
├── app/
├── components/
├── lib/
├── i4iguana-tests/          ← התיקייה שהורדת
│   ├── run-all-tests.sh
│   ├── check-typescript.sh
│   ├── check-dependencies.sh
│   ├── check-imports.sh
│   ├── check-props.sh
│   ├── check-circular.sh
│   ├── INDEX.md
│   ├── QUICK_START.md
│   ├── README.md
│   ├── INTEGRATION_EXAMPLES.md
│   ├── TROUBLESHOOTING.md
│   ├── SUMMARY.md
│   ├── CHANGELOG.md
│   └── INSTALL.md           ← הקובץ הזה
├── package.json
└── tsconfig.json
```

---

## ✅ בדיקת התקנה

הרץ את הבדיקה הזו כדי לוודא שהכל עובד:

```bash
# 1. וודא שהסקריפטים ניתנים להרצה:
ls -la i4iguana-tests/*.sh

# צריך לראות משהו כמו:
# -rwxr-xr-x ... check-typescript.sh
#  ^^^
#  זה ה-x שאומר executable

# 2. הרץ בדיקה בסיסית:
./i4iguana-tests/check-typescript.sh .

# 3. אם עובד - הרץ את הכל:
./i4iguana-tests/run-all-tests.sh .
```

---

## 🔧 פתרון בעיות התקנה

### ❌ "Permission denied"
```bash
# פתרון:
chmod +x i4iguana-tests/*.sh
```

### ❌ "command not found: tsc"
```bash
# פתרון:
npm install -D typescript
```

### ❌ "command not found: jq"
```bash
# Ubuntu/Debian:
sudo apt-get install jq

# macOS:
brew install jq
```

### ❌ "Project directory not found"
```bash
# ודא שאתה בתיקיית הפרויקט:
pwd  # צריך להיות המיקום הנכון

# או העבר path מפורש:
./i4iguana-tests/run-all-tests.sh /full/path/to/project
```

---

## 🎯 שלבים הבאים

אחרי ההתקנה:

1. ✅ קרא את [QUICK_START.md](QUICK_START.md)
2. ✅ הרץ `./i4iguana-tests/run-all-tests.sh .`
3. ✅ שלב ב-workflow שלך (ראה [INTEGRATION_EXAMPLES.md](INTEGRATION_EXAMPLES.md))

---

## 📝 Optional: שילוב ב-npm scripts

הוסף ל-`package.json`:

```json
{
  "scripts": {
    "validate": "./i4iguana-tests/run-all-tests.sh .",
    "predeploy": "npm run validate",
    "deploy": "vercel --prod"
  }
}
```

עכשיו אפשר להריץ:
```bash
npm run validate
npm run deploy  # יריץ validate אוטומטית
```

---

## 🎊 סיימת את ההתקנה!

המערכת מוכנה לשימוש! 🚀

קרא את [INDEX.md](INDEX.md) כדי להתחיל.

---

**🦎 Built for I4IGUANA | Installation Guide**
