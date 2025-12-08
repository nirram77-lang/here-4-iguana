# ═══════════════════════════════════════════════════════════════════════════════
#                    🛡️ I4IGUANA - BACKUP ARCHITECTURE
#                         Disaster Recovery Plan
# ═══════════════════════════════════════════════════════════════════════════════
#
#  Created: December 2024
#  Owner: Nir Ram
#  Version: 1.0
#
# ═══════════════════════════════════════════════════════════════════════════════


## 📊 OVERVIEW - 3 LAYERS OF PROTECTION

┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKUP ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   LAYER 1: GitHub (Cloud)                                                   │
│   ├── Source code                                                           │
│   ├── Version history                                                       │
│   ├── All commits & branches                                                │
│   └── Automatic Vercel integration                                          │
│                                                                              │
│   LAYER 2: Firebase (Google Cloud)                                          │
│   ├── Firestore database                                                    │
│   ├── Firebase Storage (user photos)                                        │
│   ├── Authentication data                                                   │
│   └── Google's automatic backups                                            │
│                                                                              │
│   LAYER 3: External Disk (Local)                                            │
│   ├── Full project folder copy                                              │
│   ├── Manual backup every few days                                          │
│   └── Offline safety net                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


## 🎯 WHAT IS BACKED UP WHERE

┌──────────────────────┬──────────┬──────────┬──────────────┐
│ Component            │ GitHub   │ Firebase │ External Disk│
├──────────────────────┼──────────┼──────────┼──────────────┤
│ Source Code          │    ✅    │    ❌    │      ✅      │
│ Version History      │    ✅    │    ❌    │      ❌      │
│ Database (Firestore) │    ❌    │    ✅    │      ❌      │
│ User Photos          │    ❌    │    ✅    │      ❌      │
│ User Auth            │    ❌    │    ✅    │      ❌      │
│ Environment Vars     │    ❌    │    ❌    │      ✅      │
│ node_modules         │    ❌    │    ❌    │      ✅      │
└──────────────────────┴──────────┴──────────┴──────────────┘


## 🔄 BACKUP SCHEDULE

┌────────────────────────────────────────────────────────────┐
│ Layer          │ Frequency        │ Method                 │
├────────────────┼──────────────────┼────────────────────────┤
│ GitHub         │ Every commit     │ git push               │
│ Firebase       │ Automatic        │ Google managed         │
│ External Disk  │ Every few days   │ Manual copy            │
└────────────────┴──────────────────┴────────────────────────┘


## 🚨 DISASTER RECOVERY SCENARIOS

### Scenario 1: Local Computer Crash
┌─────────────────────────────────────────────────────────────┐
│ RECOVERY STEPS:                                             │
│ 1. Buy/Fix new computer                                     │
│ 2. Install Node.js, npm, git                                │
│ 3. git clone https://github.com/YOUR_USERNAME/i4iguana      │
│ 4. npm install                                              │
│ 5. Copy .env.local from external disk backup                │
│ 6. npm run dev                                              │
│                                                             │
│ RECOVERY TIME: ~30 minutes                                  │
│ DATA LOSS: None (if pushed to GitHub)                       │
└─────────────────────────────────────────────────────────────┘

### Scenario 2: External Disk Failure
┌─────────────────────────────────────────────────────────────┐
│ IMPACT: Minimal                                             │
│ - Code is safe on GitHub                                    │
│ - Database is safe on Firebase                              │
│ - Only lose: latest local changes not pushed                │
│                                                             │
│ ACTION: Buy new external disk, resume backups               │
└─────────────────────────────────────────────────────────────┘

### Scenario 3: GitHub Account Compromise
┌─────────────────────────────────────────────────────────────┐
│ RECOVERY STEPS:                                             │
│ 1. Use local copy or external disk backup                   │
│ 2. Create new GitHub account                                │
│ 3. Create new repository                                    │
│ 4. Push code from local/external backup                     │
│ 5. Update Vercel integration                                │
│                                                             │
│ RECOVERY TIME: ~1 hour                                      │
└─────────────────────────────────────────────────────────────┘

### Scenario 4: Firebase Project Deleted
┌─────────────────────────────────────────────────────────────┐
│ RECOVERY STEPS:                                             │
│ 1. Create new Firebase project                              │
│ 2. Update .env.local with new credentials                   │
│ 3. Redeploy to Vercel                                       │
│                                                             │
│ DATA LOSS: All user data, photos, accounts                  │
│ NOTE: Consider Firebase scheduled backups for production    │
└─────────────────────────────────────────────────────────────┘


## 📁 CRITICAL FILES - NEVER LOSE THESE!

### Environment Variables (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
STRIPE_SECRET_KEY=xxx
ONESIGNAL_API_KEY=xxx
```

⚠️ IMPORTANT: 
- Keep a copy of .env.local on external disk
- NEVER commit to GitHub
- Store in secure password manager (recommended)


## 🛠️ GITHUB SETUP COMMANDS

### First Time Setup:
```powershell
# Navigate to project folder
cd C:\path\to\i4iguana

# Initialize git repository
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit - I4IGUANA v1.0"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/i4iguana.git

# Push to GitHub
git push -u origin main
```

### Daily Workflow:
```powershell
# Check what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push
```


## 📅 EXTERNAL DISK BACKUP PROCEDURE

### What to Copy:
```
📁 i4iguana/
├── 📁 app/              ✅ Copy
├── 📁 components/       ✅ Copy
├── 📁 lib/              ✅ Copy
├── 📁 public/           ✅ Copy
├── 📁 node_modules/     ⚠️ Optional (can npm install)
├── 📄 .env.local        ✅ CRITICAL - Always copy!
├── 📄 package.json      ✅ Copy
├── 📄 next.config.js    ✅ Copy
├── 📄 tsconfig.json     ✅ Copy
└── 📄 tailwind.config   ✅ Copy
```

### Backup Naming Convention:
```
i4iguana_backup_2024-12-08/
i4iguana_backup_2024-12-10/
i4iguana_backup_2024-12-15/
```


## 🔐 SECURITY REMINDERS

1. ✅ Use strong GitHub password + 2FA
2. ✅ Never commit .env files
3. ✅ Keep Firebase service account keys secure
4. ✅ Encrypt external disk if possible
5. ✅ Store passwords in password manager


## 📞 EMERGENCY CONTACTS

- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub: https://github.com
- OneSignal: https://onesignal.com


## 📝 BACKUP LOG

| Date       | Type          | Status | Notes                    |
|------------|---------------|--------|--------------------------|
| 2024-12-08 | External Disk | ✅     | Full backup completed    |
| 2024-12-08 | GitHub        | ⏳     | Setting up...            |
|            |               |        |                          |


═══════════════════════════════════════════════════════════════════════════════
                    © 2024 I4IGUANA - All Rights Reserved
                              Owner: Nir Ram
═══════════════════════════════════════════════════════════════════════════════
