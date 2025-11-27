# Quick Start Guide

Get the automated testing system running in **5 minutes**.

## Step 1: Installation (1 minute)

### Option A: From ZIP File
```bash
# Extract the ZIP
unzip i4iguana-testing.zip

# Copy to your project
cp -r i4iguana-testing/scripts /path/to/your/i4iguana/project/

# Make scripts executable
chmod +x /path/to/your/i4iguana/project/scripts/*.sh
```

### Option B: Manual Setup
```bash
# In your project root
mkdir -p scripts

# Copy all .sh files to scripts/
# Make them executable
chmod +x scripts/*.sh
```

## Step 2: First Test Run (2 minutes)

```bash
# Navigate to your project
cd /path/to/your/i4iguana

# Run all tests
./scripts/run-all-tests.sh
```

**Expected:** You'll see colored output showing each test's status.

## Step 3: Fix Any Issues (Varies)

If tests fail, each script provides:
- ❌ **What failed**
- 💡 **Why it failed**
- 🔧 **How to fix it**

### Common First-Time Issues

**TypeScript Errors:**
```bash
# Usually missing dependencies
npm install
```

**Missing Firebase Config:**
```bash
# Create .env.local with your Firebase credentials
cp .env.example .env.local
# Edit .env.local with your actual values
```

**Import Errors:**
- Check file paths are correct
- Verify case sensitivity (loginScreen.tsx vs LoginScreen.tsx)

## Step 4: Automate (Optional, 2 minutes)

### Add to npm scripts
```json
{
  "scripts": {
    "test:build": "./scripts/run-all-tests.sh",
    "prebuild": "npm run test:build"
  }
}
```

Now tests run automatically before every build:
```bash
npm run build  # Tests run first automatically
```

## Step 5: CI/CD Integration (Optional)

### Vercel
```json
// vercel.json
{
  "buildCommand": "./scripts/run-all-tests.sh && next build"
}
```

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Validate Build
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: ./scripts/run-all-tests.sh
```

## Usage Patterns

### Before Each Commit
```bash
./scripts/run-all-tests.sh
git add .
git commit -m "Your changes"
```

### Before Each Push
```bash
./scripts/run-all-tests.sh && git push
```

### Before Deployment
```bash
./scripts/run-all-tests.sh
# If passes, deploy to Vercel
vercel --prod
```

## Individual Test Scripts

Run specific tests when debugging:

```bash
# Only check TypeScript
./scripts/01-typescript-check.sh

# Only check dependencies
./scripts/02-dependency-check.sh

# Only check imports
./scripts/03-import-check.sh

# Only check props
./scripts/04-props-check.sh

# Only check circular dependencies
./scripts/05-circular-deps-check.sh

# Only check Firebase
./scripts/06-firebase-check.sh
```

## Understanding Test Output

### ✅ Green = Pass
```
✓ PASSED: TypeScript Syntax Check
```
Everything is good, no action needed.

### ❌ Red = Fail
```
✗ FAILED: Props Compatibility Check
```
Fix required before deployment. Details provided above the failure.

### ⚠️ Yellow = Warning
```
⚠ Warning: No lock file found
```
Not blocking, but should be addressed for production.

## Getting Help

1. **Check test output** - It tells you what's wrong and how to fix it
2. **Read TROUBLESHOOTING.md** - Common issues and solutions
3. **Check individual test scripts** - They have helpful comments

## Next Steps

- ✅ Read [INTEGRATION.md](INTEGRATION.md) for advanced integration options
- ✅ Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- ✅ Set up pre-commit hooks to catch issues before committing

---

**You're ready!** Run tests before every deployment to catch issues early.
