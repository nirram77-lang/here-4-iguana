# 🦎 Database Manager - הוראות התקנה

## קבצים להעתקה:

### 1️⃣ צור תיקייה חדשה:
```
app/admin/super/db/
```

### 2️⃣ העתק את הקובץ:
```
admin-super-db/page.tsx → app/admin/super/db/page.tsx
```

### 3️⃣ החלף את הקובץ הקיים:
```
page.tsx → app/admin/super/page.tsx
```

---

## 🚀 איך להשתמש:

1. **לך ל:** `https://your-app.vercel.app/admin/super`
2. **לחץ על:** "DB Manager" (כפתור חדש)
3. **תהנה מהממשק!**

---

## ✨ מה יש ב-Database Manager:

### 📊 Stats Bar
- Total Users
- Real Users (לא dummy, לא deleted)
- Dummy Users
- Deleted Users
- Checked In (מי מחובר ל-venue)
- Premium Users
- Total Matches
- Total Chats

### 📑 Tabs:

**👥 Users Tab:**
- טבלה מלאה של כל המשתמשים
- חיפוש לפי email/name/UID
- פילטר: Show Dummy / Show Deleted
- לכל משתמש: Gender, Age, Age Range, Venue, Status, Swipes
- כפתורי Reset / Delete לכל משתמש
- **כפתור מהיר: "Reset Nir & Jango"** - מאפס את שני החשבונות שלך

**❤️ Matches Tab:**
- רשימת כל ה-matches
- מחיקת match בודד
- "Delete All Matches"

**💬 Chats Tab:**
- רשימת כל הצ'אטים
- מחיקת chat בודד
- "Delete All Chats"

**📱 Phones Tab:**
- Phone Identities (מערכת הפאסים)
- Passes Left, Premium Status, Lock Time

**🧹 Cleanup Tab:**
- **Reset Test Users** - מאפס את niroram77 & jango5432
- **Delete Dummy Users** - מוחק את כל הדמויות
- **Remove Deleted Users** - מנקה משתמשים שנמחקו
- **Clear All Matches** - מוחק את כל ההתאמות
- **Clear All Chats** - מוחק את כל הצ'אטים  
- **☢️ FULL CLEANUP** - מנקה הכל ומאפס הכל

---

## 🎯 לאיפוס מהיר של החשבונות שלך:

1. לך ל-DB Manager
2. לחץ על tab "Cleanup"
3. לחץ על **"Reset Nir & Jango"**
4. סיום! ✅

החשבונות יהיו עם:
- ✅ swipes מאופסים
- ✅ matches נמחקו
- ✅ chats נמחקו
- ✅ deleted = false
- ✅ isAvailable = true
- ✅ לא מחוברים ל-venue (צריך לסרוק QR מחדש)
