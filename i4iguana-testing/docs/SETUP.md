# Setup Guide

Complete setup instructions for the I4IGUANA Automated Testing System.

## Prerequisites

Before installing, ensure you have:

- ✅ Node.js 16 or higher
- ✅ npm or yarn package manager
- ✅ Git
- ✅ Bash shell (available on Linux, macOS, Git Bash on Windows)
- ✅ Your I4IGUANA project

**Check versions:**
```bash
node --version   # Should be v16.0.0 or higher
npm --version    # Should be 7.0.0 or higher
```

## Installation Methods

### Method 1: From ZIP File (Recommended)

**Step 1: Extract the archive**
```bash
unzip i4iguana-testing.zip
cd i4iguana-testing
```

**Step 2: Copy to your project**
```bash
# Navigate to your I4IGUANA project
cd /path/to/your/i4iguana/project

# Copy scripts directory
cp -r /path/to/extracted/i4iguana-testing/scripts ./

# Make scripts executable
chmod +x scripts/*.sh
```

**Step 3: Verify installation**
```bash
ls -la scripts/
# Should show all .sh files with execute permissions (x)

./scripts/run-all-tests.sh
```

### Method 2: Manual File-by-File

**Step 1: Create directory structure**
```bash
cd /path/to/your/i4iguana/project
mkdir -p scripts
```

**Step 2: Create each script file**

Create these files in the `scripts/` directory:
- `run-all-tests.sh`
- `01-typescript-check.sh`
- `02-dependency-check.sh`
- `03-import-check.sh`
- `04-props-check.sh`
- `05-circular-deps-check.sh`
- `06-firebase-check.sh`

Copy content from the provided files.

**Step 3: Make executable**
```bash
chmod +x scripts/*.sh
```

## Post-Installation Configuration

### 1. Verify Project Structure

Ensure your project has these key files/directories:
```
i4iguana/
├── app/
│   └── page.tsx
├── components/
│   ├── home-screen.tsx
│   ├── login-screen.tsx
│   └── welcome-screen.tsx
├── lib/
│   ├── firebase.ts
│   └── firestore-service.ts
├── scripts/          ← Testing scripts go here
├── package.json
├── tsconfig.json
└── .env.local
```

### 2. Configure TypeScript

**If tsconfig.json doesn't exist:**
```bash
# Create basic config
npx tsc --init
```

**Recommended tsconfig.json for I4IGUANA:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### 3. Set Up Environment Variables

**Create .env.local if missing:**
```bash
touch .env.local
```

**Required variables:**
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click Settings (gear icon) → Project Settings
4. Scroll to "Your apps" → Web app
5. Copy configuration values

### 4. Install Dependencies

```bash
# Clean install
npm ci

# Or regular install
npm install
```

### 5. Run First Test

```bash
./scripts/run-all-tests.sh
```

**Expected output:**
- If everything is configured correctly: All tests pass ✅
- If issues exist: Specific errors with fix suggestions ❌

## Integration Setup

### Add to npm Scripts

**Update package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "./scripts/run-all-tests.sh",
    "test:ts": "./scripts/01-typescript-check.sh",
    "test:deps": "./scripts/02-dependency-check.sh",
    "test:imports": "./scripts/03-import-check.sh",
    "test:props": "./scripts/04-props-check.sh",
    "test:circular": "./scripts/05-circular-deps-check.sh",
    "test:firebase": "./scripts/06-firebase-check.sh",
    "prebuild": "npm test"
  }
}
```

**Now you can run:**
```bash
npm test          # Run all tests
npm run test:ts   # Just TypeScript
npm run build     # Automatically tests before building
```

### Set Up Git Hooks (Optional but Recommended)

**Using Husky:**
```bash
# Install Husky
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test"
chmod +x .husky/pre-commit

# Update package.json
npm pkg set scripts.prepare="husky install"
```

**Manual hook:**
```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./scripts/run-all-tests.sh || exit 1
EOF

chmod +x .git/hooks/pre-commit
```

### Vercel Configuration (Optional)

**Create/update vercel.json:**
```json
{
  "buildCommand": "chmod +x scripts/*.sh && ./scripts/run-all-tests.sh && next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## Verification Checklist

After installation, verify:

- [ ] Scripts are in `scripts/` directory
- [ ] Scripts are executable (`ls -la scripts/` shows `rwxr-xr-x`)
- [ ] `./scripts/run-all-tests.sh` runs without "Permission denied"
- [ ] TypeScript compiler is available (`npx tsc --version`)
- [ ] Node modules are installed (`ls node_modules/`)
- [ ] Firebase config exists (`ls lib/firebase.ts`)
- [ ] Environment variables are set (`cat .env.local`)
- [ ] Tests can identify your project structure
- [ ] All tests run and show results

## Troubleshooting Installation

### Issue: "Permission denied"

**Solution:**
```bash
chmod +x scripts/*.sh
```

### Issue: "TypeScript compiler not found"

**Solution:**
```bash
npm install --save-dev typescript
```

### Issue: "No such file or directory: scripts/"

**Solution:**
```bash
mkdir scripts
# Copy scripts again
```

### Issue: Scripts don't run on Windows

**Solutions:**

**Option 1: Use Git Bash**
```bash
# Open Git Bash
bash ./scripts/run-all-tests.sh
```

**Option 2: Use WSL (Windows Subsystem for Linux)**
```bash
# In WSL terminal
./scripts/run-all-tests.sh
```

**Option 3: Use npm scripts**
```json
{
  "scripts": {
    "test": "bash ./scripts/run-all-tests.sh"
  }
}
```

Then:
```bash
npm test
```

## Advanced Configuration

### Custom Test Exclusions

**Exclude specific directories:**

Edit each test script and modify the `find` command:

```bash
# In any test script
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.next/*" \
    ! -path "*/out/*" \
    ! -path "*/build/*" \          # Add custom exclusion
    ! -path "*/custom-folder/*")   # Add more as needed
```

### Custom Critical Files

**Edit 03-import-check.sh:**

```bash
CRITICAL_FILES=(
    "./app/page.tsx"
    "./components/home-screen.tsx"
    # Add your critical files
    "./lib/your-critical-service.ts"
)
```

### Modify Test Thresholds

**Edit run-all-tests.sh to continue on warnings:**

```bash
# Change this:
run_test "TypeScript Syntax Check" "01-typescript-check.sh"

# To this (continue even if fails):
run_test "TypeScript Syntax Check" "01-typescript-check.sh" || true
```

## Next Steps

1. ✅ **Read [QUICKSTART.md](QUICKSTART.md)** - Learn basic usage
2. ✅ **Review [INTEGRATION.md](INTEGRATION.md)** - Set up automation
3. ✅ **Check [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** - See real scenarios
4. ✅ **Bookmark [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - For when issues arise

## Getting Help

1. Run tests with verbose mode: `bash -x ./scripts/run-all-tests.sh`
2. Check individual test outputs for specific error messages
3. Review documentation in `docs/` directory
4. Verify your project structure matches expectations

---

**Congratulations!** The testing system is now installed and ready to use.

Run `./scripts/run-all-tests.sh` before every deployment! 🚀
